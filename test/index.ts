import cluster from 'cluster';
import { LogfileService } from '../src/index.js';

if ( cluster.isPrimary ) {
	console.log( `LogfileService testing started...\n` );
	for ( let i = 0; i < 2; ++i ) {
		cluster.fork();
	}
}
const logf1 = new LogfileService( { tag: '.cluster', cluster: 'abc', stack: true, stdout: true } );
const logf2 = new LogfileService( { tag: 'test', stack: true, level: 'ERROR' } );
[
	[ `Operation testing error`, [ 'abc - context', new Error( 'Test Error' ), { a: 'abc', next: "test" }, [ 1, 2, 3 ], 9 ] ],
	[ { message: `Operation generic entry` }, [] ],
	[ { value: `Operation generic entry` }, [] ],
	[ 'Lorem ipsum dolor sit amet, consectetur adipiscing elit,'
		+ ' sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco'
		+ ' laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore'
		+ ' eu fugiat nulla pariatur.', [ new RangeError( 'Test Range Error' ), 100000000000n, { a: 100n, b: 'test-test' } ] ]
].forEach(
	prm => {
		const text = prm[ 0 ] as string;
		const vals = prm[ 1 ] as any[];
		logf1.trace( text );
		logf1.error( text, ...vals );
		logf2.warn( text );
		logf2.fail( text, ...vals );
	}
);
setTimeout( () => logf1.error( 'Test 1' ), 1100 );
setTimeout( () => logf2.error( 'Test 2' ), 1200 );
if ( cluster.isPrimary ) {
	console.log( `result: ended` );
}
else {
	setTimeout( () => process.exit(), 1400 );
}
