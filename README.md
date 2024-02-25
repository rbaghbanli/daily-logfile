# logfile-service
Service for quick and easy cluster-aware logging into date-bound files.

Use LogfileService to log events, data and/or errors into locally generated logfiles.
Each logfile is date stamped and contains logs only for that date. Log entries are time stamped to milliseconds.

By default, if application runs on cluster, each cluster node logs into separate file.
If cluster identifier is set, then logs are written into single file for all cluster nodes,
 and log entries are stamped with worker id and process id.

Target: ES2022 [NodeJS][ESM+CJS].


## Logging functions
Use functions **trace**, **debug**, **info**, **warn**, and **error** to write logs conditionally, depending on specified minimum log level.
For example, if minimum log level is **INFORMATION** then **trace** and **debug** will not write into a logfile.
Use functions **fail** and **log** to write logs unconditionally.


## LogLevel enumerationks
LogfileService allows logging with the following levels:
* TRACE
* DEBUG
* INFORMATION
* WARNING
* ERROR
* FAILURE


## LogfileService configuration parameters
* dir: Logfile directory, defaults to current working directory.
* tag: Logfile tag to identify logging application, defaults to empty string.
* ext: Logfile extension, defaults to 'log'.
* utc: If true date-time values are in UTC, defaults to false.
* stack: If true writes error stack trace if available, defaults to false.
* stdout: If true additionally writes logs to stdout, defaults to false.
* level: Minimum log level, errors and failures are always logged, defaults to INFORMATION.
* cluster: Logfile cluster identifier if logs to be written into a single file for all cluster nodes.
By default, each cluster node logs into separate logfile [dir]/YYYY-MM-DD.[tag].[worker-id].[ext].

If multiple instances of LogfileService are used, make sure that each instance has different dir/tag/ext combination, and cluster identifier.


## How to use LogfileService
Sample code to log events and errors:

```ts
...
const logger = new LogfileService( { tag: 'test', utc: true } );
...
logger.info( 'log some info' );
logger.log( 'logging some data', { val: 'abc', anotherValue: 'def' }, [ 1, 2 ] );
...
logger.error( 'something went wrong', new Error( 'Test Error' ), obj );
...
```

### Generated logfile
Sample log file 2023-07-12.test.log:

```
|14:18:57|
|349| log some info
|411| logging some data
{"val":"abc","anotherValue":"def"}
[1,2]
|14:18:58|
|010| something went wrong
Test Error
{"objProp1":"a"}
```
