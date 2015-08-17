# WebQuery
**Query the web with SQL-like syntax**  
Inspired by the great Yahoo! YQL, this tool can help you generate stub files for development, scrap data from multiple sources for your portal, perform website's health check,
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
var wq = require('webquery');

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

* Mixed: `'WHERE jquery=(p > div.content) OR WHERE jquery=(#messages li) OR xpath=(/*[@id=’foo’])'`

## Output
```javascript
{
  "meta": {
    "date": 1439761398928,          // UNIX time in which query was executed
    "duration": 2881,               // Time in milliseconds it took the query to complete
    "url": [                        // Array of URLs which were used in the "FROM" clause
      "https://my.website.com"
    ],
    "title": [                      // An array of pages titles of the url(s) above
      "My Website"
    ],
    "items": 36                     // Number of items found
  },
  "data": [                         // Array of all items which were found
    {
      // ..
    },
    //...
  ]
}
```

## Known Issues
You may experience problems while executing `webquery` if you had to use `SUDO` to install it globally.  
In general, it is most recommended to use NPM without having to run commands as administrator.
To do so, follow the instructions below:

1. Change prefix in NPM configuration:  
  `npm config set prefix ~/npm`
1. Add NPM's bin folder to your system's PATH in ~/.bashrc:  
  `PATH=$PATH:$HOME/npm/bin`
1. Reload ~/.bashrc:  
  `. ~./.bashrc`
  
You may re-install now `webquery` package.