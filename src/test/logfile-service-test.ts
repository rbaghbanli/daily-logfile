import cluster from 'cluster';
import { Logfile_Service } from '..';

export class Logfile_Service_Test {

	test_log(): number {
		if ( cluster.isPrimary ) {
			console.log( `test logfile started` );
		}
		const logf1 = new Logfile_Service( { tag: '.test', stack: true } );
		const logf2 = new Logfile_Service( { tag: 'cl-test', cluster: true } );
		if ( cluster.isPrimary ) {
			for ( let i = 0; i < 4; ++i ) {
				cluster.fork();
			}
		}
		[
			[ `Operation testing error`, new Error( 'Error' ) ],
			[ `Operation generic entry`, undefined ],
			[ 'Lorem ipsum dolor sit amet, consectetur adipiscing elit,'
				+ ' sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco'
				+ ' laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore'
				+ ' eu fugiat nulla pariatur.', undefined ]
		].forEach(
			prm => {
				const text = prm[ 0 ] as string;
				const error = prm[ 1 ];
				logf1.log( text, error );
				logf2.log( text, error );
			}
		);
		if ( cluster.isPrimary ) {
			console.log( `test logfile finished` );
		}
		else {
			setTimeout( () => process.exit(), 1000 );
		}
		return 0;
	}

}
