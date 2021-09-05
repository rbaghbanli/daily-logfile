import * as fs from 'fs';

export default class Logfile_Service {

	private _ext: string;
	private _dir: string;
	private _utc: boolean;
	private _stream: fs.WriteStream | undefined;
	private _last_entry_timer: number[] | undefined;

	/**
		Constructs logfile service instance
		@param config optional parameterized object to format logfile name: [dir]/YYYY-MM-DD[ext]
		    dir defaults to current working directory;
			ext defaults to '.log';
			utc defaults to false.
	*/
	constructor( config?: { dir?: string, ext?: string, utc?: boolean } ) {
		this._dir = config?.dir ?? process.cwd();
		this._ext = config?.ext ?? '.log';
		this._utc = config?.utc ?? false;
	}

	/**
		Writes time indexed text with optional error into date bound file
		@param text string to record into the log file
		@param error optional error to record error message and stack into the log file
	*/
	log( text: string, error?: any ): void {
		const now = new Date();
		const timer = this._utc ?
			[ now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
				now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds() ] :
			[ now.getFullYear(), now.getMonth() + 1, now.getDate(),
				now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds() ];
		let change = 2; // date changed or first entry
		if ( this._last_entry_timer ) {
			for ( let i = 0; i < 6; ++i ) {
				if ( timer[ i ] != this._last_entry_timer[ i ] ) {
					change = i < 3 ? 2 : 1; // date or time changed
					break;
				}
			}
			change = 0; // neither date nor time changed
		}
		if ( change > 1 ) {
			if ( this._stream && !this._stream.writableEnded ) {
				this._stream.end();
			}
			const date_str =
				`${ timer[ 0 ].toString() }-${ timer[ 1 ].toString().padStart( 2, '0' ) }-${  timer[ 2 ].toString().padStart( 2, '0' ) }`;
			this._stream = fs.createWriteStream( `${ this._dir }/${ date_str }${ this._ext }`, { flags: 'a' } );
			this._stream.on( 'error', err => {
				this._last_entry_timer = undefined;
				process.stdout.write( `[${ now.toISOString() }] failure to write entry: ${ text }\n...on error: ${ err }\n` );
			} );
		}
		if ( change > 0 ) {
			const time_str =
				`[${ timer[ 3 ].toString().padStart( 2, '0' ) }:${ timer[ 4 ].toString().padStart( 2, '0' ) }:${ timer[ 5 ].toString().padStart( 2, '0' ) }]\n`;
			this._stream?.write( time_str );
			process.stdout.write( time_str );
		}
		let entry = `[${ timer[ 6 ].toString().padStart( 3, '0' ) }] ${ text }\n`;
		if ( error ) {
			entry += `[<E>] ${ error.message ?? error }\n`;
			if ( error.stack ) {
				entry += `[<S>] ${ error.stack }\n`;
			}
		}
		this._stream?.write( entry );
		process.stdout.write( entry );
		this._last_entry_timer = timer;
	}

}
