"use strict";

var fs = require("fs"),
    path = require("path"),
    stream = require("stream"),
    url = require("url"),
    util = require("util");

var base64 = require("base64-stream"),
    buffertools = require("buffertools");

var BinaryStreamSplitter = require("./lib/binary-stream-splitter");

var CoordinateCollector = function(delimiter) {
  stream.Transform.call(this);
  this._readableState.objectMode = true;

  var done = false,
      pending = new Buffer(0);

  this._transform = function(chunk, encoding, callback) {
    if (done) {
      return callback();
    }

    var buffer = Buffer.concat([pending, chunk]),
        idx = buffertools.indexOf(buffer, delimiter);

    if (idx >= 0) {
      var coords = buffer.slice(0, idx).toString().split(".")[0].split("/");

      this.push({
        z: coords.shift() | 0,
        x: coords.shift() | 0,
        y: coords.shift() | 0
      });

      done = true;

      return callback();
    }

    pending = buffer;

    return callback();
  };
};

util.inherits(CoordinateCollector, stream.Transform);

var CoordinateDropper = function(delimiter) {
  stream.Transform.call(this);

  var delimiterSeen = false;

  this._transform = function(chunk, encoding, callback) {
    var idx = buffertools.indexOf(chunk, delimiter);

    if (idx >= 0) {
      chunk = chunk.slice(idx + 1);
      delimiterSeen = true;
    }

    if (delimiterSeen) {
      this.push(chunk);
    }

    return callback();
  };
};

util.inherits(CoordinateDropper, stream.Transform);

var CSVDecoder = function(delimiter, encoding) {
  stream.Transform.call(this, {
    objectMode: true
  });

  delimiter = delimiter || ",";

  this._transform = function(obj, _, callback) {
    // obj is a stream containing a single row

    var data = obj.pipe(new CoordinateDropper(delimiter));

    obj
      .pipe(new CoordinateCollector(delimiter)
              .on("data", function(coords) {
                if (encoding && encoding.toLowerCase() === "base64") {
                  data = data.pipe(base64.decode());
                }

                Object.keys(coords).forEach(function(k) {
                  data[k] = coords[k];
                });

                this.push(data);

                return callback();
              }.bind(this)));
  };
};

util.inherits(CSVDecoder, stream.Transform);

module.exports = function(tilelive, options) {
  var prefix = "csvin+";

  var CSV = function(uri, callback) {
    uri = url.parse(uri, true);

    uri.protocol = uri.protocol.replace(prefix, "");

    this.uri = uri;

    return callback(null, this);
  };

  CSV.prototype.createReadStream = function() {
    var delimiter = this.uri.query.delimiter || ",",
        encoding = this.uri.query.encoding || null,
        source,
        readStream = new stream.PassThrough({
          objectMode: true
        });

    switch (this.uri.protocol.toLowerCase()) {
    case "file:":
      source = fs.createReadStream(path.resolve(path.join(this.uri.host, this.uri.pathname)));

      break;

    case "stdin:":
      source = process.stdin;

      break;

    default:
      throw new Error("Unsupported protocol: " + this.uri.protocol);
    }

    source
      .pipe(new BinaryStreamSplitter())
      .pipe(new CSVDecoder(delimiter, encoding))
      .pipe(readStream);

    return readStream;
  };

  CSV.registerProtocols = function(tilelive) {
    tilelive.protocols[prefix + "file:"] = this;
    tilelive.protocols[prefix + "stdin:"] = this;
  };

  CSV.registerProtocols(tilelive);

  return CSV;
};

module.exports.CSVDecoder = CSVDecoder;
