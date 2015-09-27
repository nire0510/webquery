#!/usr/bin/env node
var wq = require('webquery'),
  program = require('commander');

program
  .version('1.0.7')
  .description('Query the web with SQL-like syntax')
  .usage('[options]')
  .option('-q, --query [query]', 'Query statement')
  .option('-ua, --useragent [user agent]', 'User agent')
  .option('-f, --file [path]', 'JSON file output file path')
  .option('-l, --log', 'Log output to console')
  //.option('-c, --copy', 'Copy output to clipboard')
  .parse(process.argv);

if (program.query) {
  wq.query(program.query, program.file, program.log, program.useragent).then(
    function success (result) {
      // Do nothing...
    },
    function error (err) {
      console.error('Query failed to complete: %s', err);
    }
  );
}