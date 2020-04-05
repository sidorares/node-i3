var net          = require('net');
var util         = require('util');
var EventEmitter = require('events').EventEmitter;
var Queue        = require('fastqueue');

var GET_SOCKET_PATH_CMD = 'i3 --get-socketpath';
var I3_MAGIC     = new Buffer.from('i3-ipc');
var I3_MESSAGE_HEADER_LENGTH = I3_MAGIC.length + 8;

function createStream(opts, callback) {
  var stream;
  if (opts && opts.stream)
    return callback(null, stream);
  if (opts && (opts.path || opts.host || opts.port)) {
    if (opts.path) 
      stream = net.connect(opts.path);
    else
      stream = net.connect(opts.port, opts.host);
    var connected = false;
    stream.on('connect', function() {
      connected = true;
      callback(null, stream);
    });
    stream.once('error', function(err) {
      if (!connected) // otherwise handle in client
        callback(err);
    });
  } else {
    require('child_process').exec(GET_SOCKET_PATH_CMD, function(err, path) {
      path = path.replace('\n', '');
      if (err)
        return callback(err);
      createStream({path: path}, callback);
    });
  }
}

function I3Message(buff) {
  this.magic   = buff.slice(0, I3_MAGIC.length); // TODO assert magic is correct
  this.payloadLength = buff.readUInt32LE(I3_MAGIC.length);
  this.code    = buff.readUInt16LE(I3_MAGIC.length + 4); // TODO UInt31 here?
  this.payload = null;
  this.isEvent = (buff.readUInt8(I3_MAGIC.length + 7) & 0x80) == 0x80;
}

function encodeCommand(code, payload) {
  if (!payload)
    payload = '';
  var payloadOffset = I3_MAGIC.length + 8;
  var buf = new Buffer.alloc(payloadOffset + payload.length);
  I3_MAGIC.copy(buf);
  buf.writeUInt32LE(payload.length, 6);
  buf.writeUInt32LE(code, 10);
  if (payload.length > 0) {
    buf.write(payload, payloadOffset);
  }
  return buf;
}

function I3IpcClient(opts) {
  EventEmitter.call(this);
  var self = this;
  self._stream = null;
  self._commands = new Queue();
  self._handlers = new Queue();
  createStream(opts, function(err, stream) {
     
    if (err)
       return self.emit('error', err); 
   
    self.emit('connect', self);
    self._stream = stream;
    self._pump(); // send queued commands
    self._waitHeader = true;

    self._stream.on('readable', function() {
      while(1) {
        if (self._waitHeader) {
          var header = self._stream.read(I3_MESSAGE_HEADER_LENGTH);
          if (header) {
            self._message = new I3Message(header);
            if (self._message.payloadLength == 0) {
              self._handleMessage();
            } else {
              self._waitHeader = false;
            }
          } else break;
        } else {
          var data = self._stream.read(self._message.payloadLength);
          if (data) {
            self._message.payload = data;
            self._handleMessage();
            self._waitHeader = true;
          } else break;
        }
      }
    });
  });
};

util.inherits(I3IpcClient, EventEmitter);

I3IpcClient.prototype._pump = function() {
  if (!this._stream) return;
  
  var command;
  while(command = this._commands.shift()) {
    this._stream.write(command.encoded);
    command.callback.encoded = command.encoded;
    this._handlers.push(command.callback);
  }
};

var noop = function() {};

I3IpcClient.prototype.message = function(cmd, payload, callback) {
  this._commands.push({
    encoded: encodeCommand(cmd, payload),
    callback: callback ? callback : noop
  });
  this._pump();
}

var commandNameFromCode = "COMMAND GET_WORKSPACES SUBSCRIBE GET_OUTPUTS GET_TREE GET_MARKS GET_BAR_CONFIG GET_VERSION GET_BINDING_MODES GET_CONFIG SEND_TICK SYNC".split(' ');
var commandCodeFromName = {};
commandNameFromCode.forEach(function(name, code) { commandCodeFromName[name] = code; });

var eventNameFromCode = "workspace output mode window barconfig_update binding shutdown tick".split(' ');
var eventCodeFromName = {};
eventNameFromCode.forEach(function(name, code) { eventCodeFromName[name] = code; });

I3IpcClient.prototype._handleMessage = function() {
  var message = this._message;

  var payload;
  try {
    payload = JSON.parse(message.payload.toString());
  } catch(e) {
    payload = e;
  }

  if (message.isEvent) {
     var eventName = eventNameFromCode[message.code];
     // TODO: check if code is known
     if (payload instanceof Error)
       return this.emit('error', payload)
     this.emit(eventName, payload);
  } else {
     var handler = this._handlers.shift();
     if (!handler) {
       var error = new Error('Unknown reply');
       error.i3Message = message;
       this.emit('error', error);
     } else {
       if (payload instanceof Error)
         return handler(payload)
       handler(null, payload);
     }
     if (this._handlers.length == 0) {
       this.emit('drain');
     }
  }
};

var baseOn = I3IpcClient.prototype.on;
I3IpcClient.prototype.on = function(event, handler) {
  var self = this;
  var i3EventCode = eventCodeFromName[event];
  if (typeof i3EventCode !== "undefined") {
    this.message(commandCodeFromName.SUBSCRIBE, JSON.stringify([event]), function(err, resp) {
      baseOn.call(self, event, handler);
    });
  } else {
    baseOn.call(this, event, handler);
  }
}

module.exports.I3IpcClient = I3IpcClient;
module.exports.Commads = commandCodeFromName;
module.exports.Events  = eventCodeFromName;
