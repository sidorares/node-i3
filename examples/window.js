var i3 = require('../index.js').createClient();
var test = function() {
          console.log('workspace event!', arguments);
};
i3.on('window', test);
debugger
i3.on('workspace', test);
i3.on('output', test);
