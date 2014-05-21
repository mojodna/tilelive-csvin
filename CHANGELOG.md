# Changes

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
