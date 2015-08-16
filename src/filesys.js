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