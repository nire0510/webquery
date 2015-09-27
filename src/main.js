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
 * @param {string} strUserAgent User agent
 * @returns {Promise}
 */
function query (strQuery, strFilePath, blnLogConsole, strUserAgent) {
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
        arrSourcePromises.push(getPageSource(strURL, strUserAgent));
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

function getPageSource (strURL, strUserAgent) {
  var promise = new Promise(function (resolve, reject) {
    phantom.create(function (pn) {
      pn.createPage(function (page) {
        if (strUserAgent) {
          page.set('settings.userAgent', strUserAgent);
        }
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