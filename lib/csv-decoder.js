"use strict";

var stream = require("stream"),
    util = require("util");

var base64 = require("base64-stream"),
    buffertools = require("buffertools");

var ColumnFilter = function(columnIndex, delimiter) {
  stream.Transform.call(this);

  var delimiterSeen = 0;

  this._transform = function(chunk, encoding, callback) {
    var offset = 0,
        idx;

    while (offset < chunk.length) {
      idx = buffertools.indexOf(chunk, delimiter, offset);

      if (idx > 0) {
        if (delimiterSeen === 0) {
          var coords = chunk.slice(offset, idx).toString().split(".")[0].split("/");

          this.z = coords.shift() | 0;
          this.x = coords.shift() | 0;
          this.y = coords.shift() | 0;

          this.emit("coordinates", {
            z: this.z,
            x: this.x,
            y: this.y
          });
        }

        if (delimiterSeen === columnIndex) {
          this.push(chunk.slice(offset, idx));
        }

        delimiterSeen++;
        offset = idx + 1;
      } else {
        if (delimiterSeen === columnIndex) {
          this.push(chunk.slice(offset));
        }

        break;
      }
    }

    return callback();
  };
};

util.inherits(ColumnFilter, stream.Transform);

var CSVDecoder = function(columnIndex, delimiter, encoding) {
  stream.Transform.call(this, {
    objectMode: true,
    highWaterMark: 32
  });

  delimiter = delimiter || ",";
  var pending = 0;

  this._transform = function(obj, _, callback) {
    // obj is a stream containing a single row
    var cf = new ColumnFilter(columnIndex, delimiter),
        data = obj.pipe(cf);

    if (encoding && encoding.toLowerCase() === "base64") {
      data = data.pipe(base64.decode());
    }

    pending++;

    // wait until we know the coordinates before passing on the stream
    cf.on("coordinates", function(coords) {
      // copy the coordinates over to the last object in the pipeline
      Object.keys(coords).forEach(function(k) {
        data[k] = coords[k];
      });

      this.push(data);
    }.bind(this));

    cf.on("end", function() {
      pending--;
    });

    return callback();
  };

  this._flush = function(callback) {
    if (pending > 0) {
      return setImmediate(this._flush.bind(this), callback);
    }

    return callback();
  };
};

util.inherits(CSVDecoder, stream.Transform);

module.exports = CSVDecoder;
