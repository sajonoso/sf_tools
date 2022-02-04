// This script watches a source folder for changes and restarts the given entry script
// It is a simple replacement of nodemon

const fs = require('fs');
const { fork } = require('child_process');

const SOURCE_FOLDER = './src';
const EXTENSION = '.js';
const DEBOUNCE_INTERVAL = 1500; // in milliseconds


var debounceTimer = null;
var forkedProcess = null;

const scriptMain = process.argv[2];
const scriptArgs = process.argv.slice(3);

console.log(`Watching for file changes on ${SOURCE_FOLDER} and running: ${scriptMain} ${scriptArgs.join(' ')}`);

function runScript(script, args) {
  forkedProcess = fork(script, args);
}

fs.watch(SOURCE_FOLDER, (event, filename) => {
  if (filename.endsWith(EXTENSION)) {
    console.log(`${filename} file Changed`);
    if (debounceTimer == null) {
      debounceTimer = setTimeout(() => {
        forkedProcess.kill('SIGHUP');
        runScript(entryScript, scriptArgs);
        debounceTimer = null;
      }, DEBOUNCE_INTERVAL)
    }
  }
});

runScript(scriptMain, scriptArgs);
