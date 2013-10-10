# node-i3
[i3-ipc](http://i3wm.org/docs/ipc.html) client for [node.js](http://nodejs.org)

[![NPM](https://nodei.co/npm/i3.png?downloads=true&stars=true)](https://nodei.co/npm/i3/)

## Install

	npm install i3

## API

```js
var i3 = require('i3')
i3.command('focus left');
i3.on('workspace', function(w) {
  console.log('workspace event!', w);
})
```

## LINKS
  - [i3-ipc wire protocol documentation](http://i3wm.org/docs/ipc.html)
  - [Python client](https://github.com/ziberna/i3-py)
  - [collection of helper python scripts](https://github.com/yiuin/i3-wm-scripts)
