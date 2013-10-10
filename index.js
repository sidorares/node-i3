var I3IpcClient = require('./lib/ipc').I3IpcClient;

module.exports.createClient = module.exports.connect = function(options) {
  var cli = new I3IpcClient(options);
  return cli;
};

I3IpcClient.prototype.command = function(arg, cb) {
  this.message(0, arg, cb);
}
module.exports.I3IpcClient = I3IpcClient;
