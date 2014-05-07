/*global describe, it, xit, before, beforeEach, after, afterEach */
"use strict";

var assert = require("assert"),
    stream = require("stream");

var BinaryStreamSplitter = require("../lib/binary-stream-splitter"),
    CSVDecoder = require("../lib/csv-decoder");

describe("CSVDecoder", function() {
  it("should split base64-encoded input", function(done) {
    var input = new stream.PassThrough();

    var i = 0;

    input
      .pipe(new BinaryStreamSplitter())
      .pipe(new CSVDecoder(1, "\t", "base64"))
      .pipe(new stream.PassThrough({ objectMode: true })
              .on("data", function(data) {
                var chunks = [];

                data
                  .on("data", function(chunk) {
                    chunks.push(chunk);
                  });

                if (i++ === 0) {
                  // row 1
                  assert.equal(0, data.z);
                  assert.equal(0, data.x);
                  assert.equal(0, data.y);

                  data.on("end", function() {
                    assert.equal("blob", Buffer.concat(chunks).toString());
                  });
                } else {
                  // row 2
                  assert.equal(1, data.z);
                  assert.equal(2, data.x);
                  assert.equal(3, data.y);

                  data.on("end", function() {
                    assert.equal("data", Buffer.concat(chunks).toString());

                    return done();
                  });
                }
              }));

    input.write("0/0/0\tYmxvYg==\n");
    input.write("1/2/3\tZG");
    input.end("F0YQ==");
  });
});
