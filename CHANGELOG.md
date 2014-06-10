# Changes

## v0.2.9 - 6/10/14

* Use `ColumnFilter`'s `end` event for tracking pending streams, not
  `coordinates`
* Handle recursive `_flush`ing properly

## v0.2.8 - 6/10/14

* Don't EOF before all streams have been written

## v0.2.7 - 6/9/14

* Work-around for regression due to node@9520ade (`\`s replaced with `/`s),
  affecting node-0.10.27+

## v0.2.6 - 6/9/14

* Explicitly set `highWaterMark` to 32 objects
* Bugfix: `CSVDecoder._transform` should always call back

## v0.2.5 - 6/5/14

* Handle escaped characters (e.g. `\t`) provided via the command line.

## v0.2.4 - 5/21/14

* Stop leaking streams in `BinaryStreamSplitter`--this allows writable tilelive
  modules to complete successfully.

## v0.2.3 - 5/19/14

* Add an "anti delimiter" (e.g. `\r` when the input shouldn't be split on the
  `\n` in `\r\n`)

## v0.2.2 - 5/8/14

* Correctly handle chunked column data

## v0.2.1 - 5/7/14

* Actually use `columnIndex` when instantiating `CSVDecoder`

## v0.2.0 - 5/6/14

* Introduced `columnIndex` to eliminate the 2-column assumption.

## v0.1.0 - 4/6/14

* Initial released version
