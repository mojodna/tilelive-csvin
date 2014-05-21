"use strict";

var stream = require("stream"),
    util = require("util");

var buffertools = require("buffertools");

var BinaryStreamSplitter = function(delimiter, antiDelimiter) {
  stream.Transform.call(this);
  this._readableState.objectMode = true;

  this.delimiter = delimiter || "\n";
  // a character that invalidates the delimiting nature of the delimiter
  this.antiDelimiter = antiDelimiter || "\r";

  var out,
      previousTerminator;

  this._transform = function(chunk, encoding, callback) {
    var offset = 0;

    while (offset < chunk.length) {
      if (!out) {
        out = new stream.PassThrough();
        this.push(out);
      }

      var idx = buffertools.indexOf(chunk, this.delimiter, offset);

      while ((idx === 0 && previousTerminator === this.antiDelimiter) ||
             (idx > 0 && String.fromCharCode(chunk[idx - 1]) === this.antiDelimiter)) {
        idx = buffertools.indexOf(chunk, this.delimiter, idx + 1);
      }

      if (idx < 0) {
        // delimiter is not present--just push it through
        out.write(chunk.slice(offset));

        break;
      }

      out.write(chunk.slice(offset, idx + 1));

      // end the previous stream if necessary
      if (out) {
        out.end();
        out = null;
      }

      offset = idx + 1;
    }

    previousTerminator = chunk.slice(-1).toString();

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
