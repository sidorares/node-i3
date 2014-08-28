var I3IpcClient = require('./lib/ipc').I3IpcClient;

module.exports.createClient = module.exports.connect = function(options) {
  var cli = new I3IpcClient(options);
  return cli;
};

I3IpcClient.prototype.command = function(arg, cb) {
  this.message(0, arg, cb);
};

I3IpcClient.prototype.workspaces = function(cb) {
  this.message(1, null, cb);
};

I3IpcClient.prototype.subscribe = function(events, cb) {
  this.message(2, events, cb);
};

I3IpcClient.prototype.outputs = function(cb) {
  this.message(3, null, cb);
};

I3IpcClient.prototype.tree = function(cb) {
  this.message(4, null, cb);
};

I3IpcClient.prototype.marks = function(cb) {
  this.message(5, null, cb);
};

I3IpcClient.prototype.barConfig = function(cb) {
  this.message(6, null, cb);
};

module.exports.I3IpcClient = I3IpcClient;
