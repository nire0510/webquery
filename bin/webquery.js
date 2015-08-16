#!/usr/bin/env node
var wq = require('webquery'),
  program = require('commander');

program
  .version('1.0.1')
  .description('Query the web with SQL-like syntax')
  .usage('[options]')
  .option('-q, --query [query]', 'Query statement')
  .option('-f, --file [path]', 'JSON file output file path')
  .option('-l, --log', 'Log output to console')
  //.option('-c, --copy', 'Copy output to clipboard')
  .parse(process.argv);

if (program.query) {
  wq.query(program.query, program.file, program.log).then(
    function success (result) {
      console.log('Query completed successfully!');
    },
    function error (err) {
      console.error('Query failed to complete: %s', err);
    }
  );
}