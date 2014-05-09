"use strict";

var fs = require("fs"),
    path = require("path"),
    url = require("url");

var BinaryStreamSplitter = require("./lib/binary-stream-splitter"),
    CSVDecoder = require("./lib/csv-decoder");

module.exports = function(tilelive, options) {
  var prefix = "csvin+";

  var CSV = function(uri, callback) {
    uri = url.parse(uri, true);

    uri.protocol = uri.protocol.replace(prefix, "");

    this.uri = uri;

    return callback(null, this);
  };

  CSV.prototype.createReadStream = function() {
    var columnIndex = (this.uri.query.columnIndex || 1) | 0,
        delimiter = this.uri.query.delimiter || ",",
        encoding = this.uri.query.encoding || null,
        source;

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

    return source
      .pipe(new BinaryStreamSplitter())
      .pipe(new CSVDecoder(columnIndex, delimiter, encoding));
  };

  CSV.registerProtocols = function(tilelive) {
    tilelive.protocols[prefix + "file:"] = this;
    tilelive.protocols[prefix + "stdin:"] = this;
  };

  CSV.registerProtocols(tilelive);

  return CSV;
};
