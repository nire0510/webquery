# WebQuery
**Query the web with SQL-like syntax**  
Inspired by the great Yahoo! YQL, this tool can be used to generate stub files for development, scrap data from multiple sources for your portal, perform website's health check,
test your app or just for fun!

## Installation
`npm install -g webquery`

## Usage

### Terminal (*NIX)
`webquery [options...]`  
For example: To print to console the content, the `lang` attribute value and the number of children elements of all
paragraph elements which has `content` class in page https://twitter.com/feditorio - just run the following command:  
`webquery -l -q "SELECT text, attr(lang), size(children) as total FROM https://twitter.com/feditorio WHERE jquery=(.content p)"`

Options:
* `-q "QUERY"` - Query statement
* `-f "JSON_OUTPUT_FILE_PATH"` - JSON output file path
* `-l` - Indicates whether results should be logged to console
* `-h` - Prints usage information
* `-v` - Prints the version number

### Node App
```javascript
var wq = require('../src/main.js');

// Arguments:  
// 1 - {string} Query statement  
// 2 - {string} JSON output file path  
// 3 - {boolean} Indicates whether results should be logged to console  
// Returns a promise
wq.query('SELECT text, attr(lang), size(children) as total FROM https://twitter.com/feditorio WHERE jquery=(.content p)', null, true).then(
  function success (result) {
    console.log('Query completed successfully!');
    console.log(result);
  },
  function error (err) {
    console.error('Query failed to complete: %s', err);
  }
);
```

## Query Statement
`SELECT {PROPERTY1}[, {PROPERTY2}[,...]] FROM {URL1}[, {URL2}[,...]] WHERE {SELECTOR1} [OR {SELECTOR2} [OR...]]`

### Property
You can use single or multiple comma-separated properties from the list below:
* `tag` - Tag name
* `type` - Element type
* `html` - HTML contents
* `text` - Combined text contents, including their descendants
* `value` - Current value (form element)
* `id` - Id attribute value
* `name` - Name attribute value
* `class` - CSS class names
* `index` - Position of the element, relative to its sibling elements
* `attr(_attribute_)` - Value of attribute _attribute_ 
* `data(_attribute_)` - Value of data attribute _attribute_ (without the data- prefix)
* `size(children)` - Number of children
* `size(attributes)` - Number of attributes

### URL
Any valid URL which starts with `http://` or `https://` protocols.  
You can query single or multiple comma-separated urls.

### SELECTOR
You can use either jquery or xpath valid selectors. You may also mix them both or use multiple selectors
of each type you like, separated with `OR` operator:
* jQuery: `WHERE jquery=(YOUR_SELECTOR_GOES_HERE)`  
For example: `WHERE jquery=(p > div.content)`

* XPath: `WHERE xpath=(YOUR_SELECTOR_GOES_HERE)`  
For example: `WHERE xpath=(/*[@id=’foo’])`

* Mixed: `'WHERE jquery=(YOUR_SELECTOR_GOES_HERE) OR xpath=(/*[@id=’foo’])'`