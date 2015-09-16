var wq = require('../src/main.js');

wq.query('select text from https://www.google.co.il/webhp?q=100%20ils%20to%20usd where jquery=(.vk_ans)', '../output.json', true).then(
  function success (result) {
    console.log('Query completed successfully!');
  },
  function error (err) {
    console.error('Query failed to complete: %s', err);
  }
);