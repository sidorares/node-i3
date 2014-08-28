var i3 = require('../index.js').createClient();
i3.command('focus left');
i3.tree(console.log);
i3.workspaces(console.log);
