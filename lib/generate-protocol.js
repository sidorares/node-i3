var I3IpcClient = require('./ipc.js').I3IpcClient;

// WIP: auto-generate helpers using "Expected commands" error data
var protocol = {};

'move exec shmlog debuglog border layout append_layout workspace focus kill open fullscreen split floating mark unmark resize rename nop scratchpad mode bar'.split(' ')
  .forEach(function(command) {
    c.message(0, command, function(err, res) {
      console.log(err, res);
      if (!err) {
        protocol[command] = [];
      } else {
        protocol[command] = {};
        //console.log(command + ' == ' + err.error);
        if (m = err.error.match(/Expected one of these tokens:(.*)/) ) {
           m[1].split(',').forEach(function(subcmd) {
             var sc = subcmd.replace(/[ ]?'/g, '');
             if (!sc[0].match(/ <-/)) {
               protocol[command][sc] = [];
               c.message(0, command + ' ' + sc, function(err, res) {
                 //console.log(command + ' ' + sc, "=====", err, res);
               });
             }
           });
        }
      }
    });
  });

c.on('drain', function() {
  console.log(protocol);
});
