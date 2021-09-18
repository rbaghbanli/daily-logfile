import * as fs from 'fs';
import * as cluster from 'cluster';

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
		if ( cluster.isMaster ) {
			cluster.on( 'message',
				( worker, msg ) => {
					if ( msg.__logfile_service_log ) {
						this.log( `{${ worker.id.toString().padStart( 3, '0' ) }:${ worker.process.pid.toString().padStart( 6, '0' ) }} ${ msg.text }`,
							msg.error
						);
					}
				}
			);
		}
	}

	/**
		Logfile extension
	*/
	get logfile_extension(): string {
		return this._ext;
	}

	/**
		Logfile directory
	*/
	get logfile_directory(): string {
		return this._dir;
	}

	/**
		True if date and time values are UTC, false otherwise
	*/
	get is_utc(): boolean {
		return this._utc;
	}

	/**
		Writes time indexed text with optional error into date bound file
		@param text string to record into the log file
		@param error optional error to record error message and stack into the log file
	*/
	log( text: string, error?: any ): void {
		if ( cluster.isMaster ) {
			const now = new Date();
			const timer = this._utc ?
				[ now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
					now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds() ] :
				[ now.getFullYear(), now.getMonth() + 1, now.getDate(),
					now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds() ];
			let change = 2; // date changed or first entry
			if ( this._last_entry_timer ) {
				change = 0; // neither date nor time changed
				for ( let i = 0; i < 6; ++i ) {
					if ( timer[ i ] != this._last_entry_timer[ i ] ) {
						change = i < 3 ? 2 : 1; // date or time changed
						break;
					}
				}
			}
			if ( change > 1 ) {
				if ( this._stream && !this._stream.writableEnded ) {
					this._stream.end();
				}
				const fp = `${ this._dir }/${ timer[ 0 ].toString() }-\
${ timer[ 1 ].toString().padStart( 2, '0' ) }-\
${ timer[ 2 ].toString().padStart( 2, '0' ) }${ this._ext }`;
				this._stream = fs.createWriteStream( fp, { flags: 'a' } );
				this._stream.on( 'error', err => {
					this._last_entry_timer = undefined;
					process.stderr.write( `[${ now.toISOString() }] failure to write entry: ${ text }\n\
						...on error: ${ err }\n` );
				} );
			}
			if ( change > 0 ) {
				const ts = `[${ timer[ 3 ].toString().padStart( 2, '0' ) }:\
${ timer[ 4 ].toString().padStart( 2, '0' ) }:\
${ timer[ 5 ].toString().padStart( 2, '0' ) }]\n`;
				this._stream?.write( ts );
				process.stdout.write( ts );
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
		else {
			process.send!(
				{
					__logfile_service_log: true,
					text: text,
					error: error ? { name: error.name, message: error.message ?? error, stack: error.stack } : undefined
				}
			);
		}
	}

}
