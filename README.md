# logfile-service
Service for quick and easy cluster-aware logging into date-bound files.

LogfileService is used for logging events, data or errors into locally generated logfiles.
Each logfiles is date stamped, and log entries are time stamped to milliseconds.

By default, if application is run on cluster, each node logs into separate file.
If cluster identifier is set, then logs are written into single file for all cluster nodes,
 and log entries are stamped with worker id and process id.


## Logging with LogfileService
Sample code to log events and errors:

```ts
...
const logger = new LogfileService( { tag: 'test', utc: true } );
...
logger.info( 'log some info' );
...
logger.log( 'logging some data', { val: 'abc', anotherValue: 'def' }, [ 1, 2, 3 ] );
...
logger.error( 'something went wrong', err, obj );
...
```

### Generated logfile
Sample log file 2023-07-12.test.log:

```
|14:18:57|
|349| log some info
|411| logging some data
{"val":"abc","anotherValue":"def"}
[1,2,3]
|14:18:58|
|010| something went wrong
Test Error
{"objProp1":"a"}
```
