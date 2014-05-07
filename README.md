[![Build
Status](https://travis-ci.org/mojodna/tilelive-csvin.png)](https://travis-ci.org/mojodna/tilelive-csvin)

# tilelive-csvin

A [tilelive](https://github.com/mapbox/tilelive.js) provider for CSV inputs
that supports streaming reads.

## Usage

This example requires [@mojodna](https://github.com/mojodna)'s fork of
[`mbtiles`](https://github.com/mojodna/node-mbtiles) for `createWriteStream()`.

```javascript
"use strict";

var MBTiles = require("mbtiles"),
    tilelive = require("tilelive");

var CSV = require("tilelive-csv")(tilelive);

new CSV("csvin+file://./data.csv?delimiter=\t&encoding=base64", function(err, src) {
  new MBTiles("mbtiles://./tiles.mbtiles", function(err, sink) {
    src.createReadStream().pipe(sink.createWriteStream());
  });
});
```

### Options

The following query parameters are recognized:

* `delimiter` - Column delimiter. Defaults to `,`.
* `encoding` - Option source encoding. Defaults to `null`. Other valid values:
  `base64`.
* `columnIndex` - 0-based index for the column containing data. Defaults to `1`.

## Supported Protocols

This provider understands the `file:` (e.g. `csvin+file://./stuff.csv`) and `stdin:` protocols.

## Why?

CSV is a popular format with the Big Data set.

## Streaming

For sparsely filled or unknown bounding boxes, iterating over a known list of
tiles is more efficient than using
a [`tilelive`](https://github.com/mojodna/tilelive.js) `Scheme`.

## `getInfo()`?

That's not implemented. You'll want to fake it by generating your own TileJSON
separately. Perhaps one could be provided as a query parameter?  (Patches
welcomed!)

## Base64 Encoding?

CSV is a text-based format, after all.

## Writing?

Nope. Why?

## Random Access (`getTile()`)?

Nope.
