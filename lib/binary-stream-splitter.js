"use strict";

var stream = require("stream"),
    util = require("util");

var buffertools = require("buffertools");

var BinaryStreamSplitter = function(delimiter) {
  stream.Transform.call(this);
  this._readableState.objectMode = true;

  this.delimiter = delimiter || "\n";

  var out;

  this._transform = function(chunk, encoding, callback) {
    var offset = 0;

    while (offset < chunk.length) {
      if (!out) {
        out = new stream.PassThrough();
        this.push(out);
      }

      var idx = buffertools.indexOf(chunk, this.delimiter, offset);

      if (idx < 0) {
        // delimiter is not present--just push it through
        out.write(chunk.slice(offset));

        break;
      }

      out.write(chunk.slice(offset, idx + 1));

      // end the previous stream if necessary
      if (out) {
        out.end();
      }

      // create a new stream to write data through
      out = new stream.PassThrough();
      this.push(out);

      offset = idx + 1;
    }

    return callback();
  };

  this._flush = function(callback) {
    if (out) {
      out.end();
    }

    return callback();
  };
};

util.inherits(BinaryStreamSplitter, stream.Transform);

module.exports = BinaryStreamSplitter;
