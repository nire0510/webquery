(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.webquery = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var fs = require('fs'),
  Promise = require('promise');

module.exports = {
  saveToFile: saveToFile
};

/**
 * Saves data to file
 * @param {string} strFilePath Target file path
 * @param {string} strContent File content
 * @returns {Promise}
 */
function saveToFile (strFilePath, strContent) {
  var promise = new Promise(function (resolve, reject) {
    fs.writeFile(strFilePath, strContent, function(err) {
      if(err) {
        reject(err);
      }

      resolve(true);
    });
  });

  return promise;
}
},{"fs":undefined,"promise":undefined}],2:[function(require,module,exports){
var phantom = require('phantom'),
  path = require('path'),
  filesys = require('./filesys.js'),
  parser = require('./parser.js'),
  cheerio = require('cheerio'),
  Promise = require('promise');

module.exports = {
  query: query
};

/**
 * Queries a web page
 * @param {string} strQuery Query statement
 * @param {string} strFilePath JSON output file path
 * @param {boolean} blnLogConsole Indicates whether to log the results to console
 * @returns {Promise}
 */
function query (strQuery, strFilePath, blnLogConsole) {
  var promise,
    objOutput = {
      meta: {
        date: Date.now(),
        duration: 0,
        url: [],
        title: [],
        items: 0
      },
      data: []
    },
    arrSourcePromises = [],
    objQuery;

  promise = new Promise (function (resolve, reject) {
    // Check if query is valid:
    if (parser.isValid(strQuery)) {
      // Extract data from query:
      objQuery = parser.parseQuery(strQuery);

      // Extract URLs from the "FROM" clause:
      objQuery.from.urls.forEach(function (strURL) {
        arrSourcePromises.push(getPageSource(strURL));
      });

      Promise.all(arrSourcePromises).then(function (result) {
        // Loop over each URL:
        result.forEach(function (source) {
          var $ = cheerio.load(source.html),
            $elems,
            $elem;

          // Select elements in "WHERE" clause:
          objQuery.where.selectors.forEach(function (objSelector) {
            switch (objSelector.type) {
              case 'jquery':
                $elems = $elems && $elems.length > 0 ? $elems.add(objSelector.query) : $(objSelector.query);
                break;
              case 'xpath':
                $elems = $elems && $elems.length > 0 ? $elems.add(_x(objSelector.query)) : $(_x(objSelector.query));
                break;
            }
          });

          // Loop over each element:
          $elems.each(function(i, elem) {
            var objItem = {},
              arrProperty,
              arrMatches;

            // jQuery object:
            $elem = $(elem);
            // Extract required properties:
            objQuery.select.props.forEach(function (strProperty) {
              arrProperty = strProperty.split(/\s+as\s+/i);

              switch (arrProperty[0].trim().toLowerCase()) {
                case 'tag':
                  objItem[arrProperty[1] || 'tag'] = elem.name;
                  break;
                case 'type':
                  objItem[arrProperty[1] || 'type'] = elem.type;
                  break;
                case 'class':
                  objItem[arrProperty[1] || 'class'] = elem.attribs['class'];
                  break;
                case 'id':
                  objItem[arrProperty[1] || 'id'] = elem.attribs['id'];
                  break;
                case 'name':
                  objItem[arrProperty[1] || 'name'] = elem.attribs['name'];
                  break;
                case 'index':
                  objItem[arrProperty[1] || 'index'] = $elem.index();
                  break;
                case 'size(children)':
                  objItem[arrProperty[1] || 'numChildren'] = elem.children.length;
                  break;
                case 'size(attributes)':
                  objItem[arrProperty[1] || 'numAttributes'] = Object.keys(elem.attribs).length;
                  break;
                case 'text':
                  objItem[arrProperty[1] || 'text'] = $elem.text().trim();
                  break;
                case 'value':
                  objItem[arrProperty[1] || 'value'] = $elem.val();
                  break;
                case 'html':
                  objItem[arrProperty[1] || 'html'] = $('<div>').append($elem.clone()).html().trim().replace(/[\n\r]/g, '').replace(/[\s]+/g, ' ');
                  break;
                case 'css':
                  objItem[arrProperty[1] || 'css'] = $elem.css();
                  break;
                default:
                  // Attribute:
                  if ((arrMatches = arrProperty[0].match(/attr\(\s*(.+)\s*\)/i)).length === 2) {
                    objItem[arrProperty[1] || arrMatches[1]] = $elem.attr(arrMatches[1]);
                  }
                  // Data:
                  else if ((arrMatches = arrProperty[0].match(/data\(\s*(.+)\s*\)/i)).length === 2) {
                    objItem[arrProperty[1] || arrMatches[1]] = $elem.data(arrMatches[1]);
                  }
                  break
              }
            });
            // Add item to output:
            objOutput.data.push(objItem);
          });
          // Set item's specific meta data:
          objOutput.meta.title.push(source.title);
          objOutput.meta.items += $elems.length;
        });

        // Set more meta data:
        objOutput.meta.url = objQuery.from.urls;
        objOutput.meta.duration = Date.now() - objOutput.meta.date;

        // Log console:
        if (blnLogConsole) {
          console.log(JSON.stringify(objOutput, null, 2));
        }

        //// Copy to clipboard:
        //if (blnCopyToClipboard) {
        //  clipboard.write(JSON.stringify(objOutput, null, 2));
        //}

        // Save output:
        if (strFilePath) {
          _saveObjectToFile(path.resolve(strFilePath), objOutput).then(
            function success () {
              // Resolve promise:
              resolve(objOutput);
            },

            function error (err) {
              reject('JSON file could not be saved: ' + err);
              return;
            }
          );
        }
        else {
          // Resolve promise:
          resolve(objOutput);
        }
      });
    }
    else {
      reject('Query is invalid');
      return;
    }
  });

  return promise;
}

function getPageSource (strURL) {
  var promise = new Promise(function (resolve, reject) {
    phantom.create(function (pn) {
      pn.createPage(function (page) {
        page.open(strURL, function (status) {
          if (status === 'success') {
            page.evaluate(function () { return { html: document.documentElement.outerHTML, title: document.title }; }, function (result) {
              // Resolve promise:
              resolve(result);
              pn.exit();
            });
          }
          else {
            reject('URL could not be loaded');
            return;
          }
        });
      });
    });
  });

  return promise;
}

/**
 * Saves JSON object to file
 * @param {string} strFilePath Target file path
 * @param {object} objData File content as object
 * @returns {Promise}
 * @private
 */
function _saveObjectToFile (strFilePath, objData) {
  return filesys.saveToFile(strFilePath, JSON.stringify(objData, null, 2));
}

/**
 * Xpath selector function
 * @param strXPathSelector XPath selector
 * @returns {Array}
 * @private
 */
function _x(strXPathSelector) {
  var objXReult = document.evaluate(strXPathSelector, document, null, XPathResult.ANY_TYPE, null);
  var arrXNodes = [];
  var objXItem;
  while (objXItem = objXReult.iterateNext()) {
    arrXNodes.push(objXItem);
  }

  return arrXNodes;
}
},{"./filesys.js":1,"./parser.js":3,"cheerio":undefined,"path":undefined,"phantom":undefined,"promise":undefined}],3:[function(require,module,exports){
module.exports = {
  parseQuery: parseQuery,
  isValid: isValid
};

/**
 * Parses query statement and converts to tokens object
 * @param {string} strQuery Query statement
 * @returns {object} Tokens object
 */
function parseQuery (strQuery) {
  var rgxQuery = /^select\s+(.+)\s+from\s+(.+)\s+where\s+(.+)$/i,
    objMatch = rgxQuery.exec(strQuery),
    objOutput = {
      valid: false,
      select: null,
      from: null,
      where: null
    };

  // Extract data from query:
  if (objMatch && objMatch.length === 4) {
    objOutput.select = {
      raw: objMatch[1],
      props: objMatch[1].replace(/\s*,\s*/, ',').split(',')
    };
    objOutput.from = {
      raw: objMatch[2],
      urls: _extractURLs(objMatch[2])
    };
    objOutput.where = {
      raw: objMatch[3],
      selectors: _extractSelectors(objMatch[3])
    };

    objOutput.valid = (objOutput.select.props.length > 0 && objOutput.from.urls.length > 0 && objOutput.where.selectors.length > 0);
  }

  return objOutput;
}

/**
 * Checks if query is valid
 * @param {string} strQuery Query statement
 * @returns {boolean} True if query is valid, false otherwise
 */
function isValid (strQuery) {
  return parseQuery(strQuery).valid;
}

/**
 * Extracts valid URLs from the "FROM" query clause
 * @param {string} strContent "FROM" query clause content
 * @returns {Array} Valid URLs
 * @private
 */
function _extractURLs (strContent) {
  var rgxURL = /(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?/ig;

  return strContent.match(rgxURL);
}

/**
 * Extracts query selectors from the "WHERE" query clause
 * @param strContent "WHERE" query clause content
 * @returns {Array} Array of query selectors
 * @private
 */
function _extractSelectors (strContent) {
  var rgxQuerySelector = /(jquery|xpath)=\((.*?)\)/ig,
    arrMatches,
    arrOutput = [];

  arrMatches = rgxQuerySelector.exec(strContent);
  while (arrMatches !== null) {
    arrOutput.push({
      type: arrMatches[1],
      query: arrMatches[2]
    });
    arrMatches = rgxQuerySelector.exec(strContent);
  }

  return arrOutput;
}
},{}]},{},[2])(2)
});