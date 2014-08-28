var i3 = require('../index.js').createClient();
i3.command('focus left');
i3.on('workspace', console.log);
