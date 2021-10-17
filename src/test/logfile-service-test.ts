import { Logfile_Service } from '..';

export class Logfile_Service_Test {

	test_log(): number {
		console.log( `test data_logger.log started` );
		const logger = new Logfile_Service( { ext: '.test.log' } );
		[
			[ `ABC`, new Error( 'Test Error' ) ],
			[ 'Lorem ipsum dolor sit amet, consectetur adipiscing elit,' +
				' sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco' +
				' laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore' +
				' eu fugiat nulla pariatur.', undefined ]
		].forEach( prm => {
			const text = prm[ 0 ] as string;
			const error = prm[ 1 ];
			logger.log( text, error );
		} );
		console.log( `test data_logger.log finished` );
		return 0;
	}

}
