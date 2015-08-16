var wq = require('../src/main.js');

wq.query('SELECT attr(class) as c1, text, value, tag, type, class, id, name, index, size(children), size(attributes), html, css ' +
  'FROM http://my.como.com ' +
  'where jquery=(dl dd) OR jquery=(.dropdown a)', '../output.json', true).then(
  function success (result) {
    console.log('Query completed successfully!');
  },
  function error (err) {
    console.error('Query failed to complete: %s', err);
  }
);