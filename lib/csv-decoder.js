"use strict";

var stream = require("stream"),
    util = require("util");

var base64 = require("base64-stream"),
    buffertools = require("buffertools");

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

module.exports = CSVDecoder;
