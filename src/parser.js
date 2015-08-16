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