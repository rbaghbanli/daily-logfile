import fs from 'fs';
import cluster from 'cluster';

export enum LogLevel {
	TRACE = 0,
	DEBUG,
	INFORMATION,
	WARNING,
	ERROR,
	FAILURE,
}

export interface LogConfig {
	dir?: string,
	tag?: string,
	ext?: string,
	utc?: boolean,
	stack?: boolean,
	stdout?: boolean,
	level?: LogLevel | 'TRACE' | 'DEBUG' | 'INFORMATION' | 'WARNING' | 'ERROR' | 'FAILURE',
	cluster?: string,
}

export class LogFile {

	private _dir: string;
	private _tag: string;
	private _ext: string;
	private _utc: boolean;
	private _stack: boolean;
	private _stdout: boolean;
	private _level: LogLevel;
	private _cluster: string;
	private _path: string = '';
	private _stream: fs.WriteStream | undefined;
	private _lastEntryTimer: number[] | undefined;

	/**
		Constructs logfile service instance
		@param config Optional parameterized object to format logfile name [dir]/YYYY-MM-DD.[tag].[ext], and setup logging options:
		    dir: logfile directory, defaults to current working directory.
			tag: logfile tag to identify logging application, defaults to empty string.
			ext: logfile extension, defaults to 'log'.
			utc: true to use UTC, defaults to false.
			stack: if true writes stack trace if available, defaults to false.
			stdout: if true additionally writes logs to stdout, defaults to false.
			level: minimum log level, errors and failures are always logged, defaults to LogLevel.LOG.
			cluster: cluster identifier if logs to be written into a single file for all cluster nodes,
				by default each cluster node logs into separate logfile [dir]/YYYY-MM-DD.[tag].[worker-id].[ext].
	*/
	constructor( config?: LogConfig ) {
		this._dir = config?.dir ?? process.cwd();
		this._tag = config?.tag ? config.tag.startsWith( '.' ) ? config.tag : `.${ config.tag }` : '';
		this._ext = config?.ext ? config.ext.startsWith( '.' ) ? config.ext : `.${ config.ext }` : '.log';
		this._utc = config?.utc ?? false;
		this._stack = config?.stack ?? false;
		this._stdout = config?.stdout ?? false;
		this._level = ( config?.level == null
			? undefined
			: typeof config.level === 'number'
				? config.level
				: {
					TRACE: LogLevel.TRACE,
					DEBUG: LogLevel.DEBUG,
					INFORMATION: LogLevel.INFORMATION,
					WARNING: LogLevel.WARNING,
					ERROR: LogLevel.ERROR,
					FAILURE: LogLevel.FAILURE,
				}[ config.level ]
		) ?? LogLevel.INFORMATION;
		this._cluster = config?.cluster ?? '';
		if ( this._cluster && cluster.isPrimary ) {
			cluster.on( 'message', ( worker, msg ) => {
				if ( msg.__logfile_service === this._cluster ) {
					this.log( `<${ worker.id.toString().padStart( 3, '0' ) }:${ worker.process.pid?.toString().padStart( 6, '0' ) }> ${ msg.message }`,
						...msg.data
					);
				}
			} );
		}
	}

	/**
		Writes time indexed log entry with optional context data into date bound file
		@param message log entry
		@param data optional context data
	*/
	log( message?: any, ...data: any[] ): void {
		if ( cluster.isPrimary || !this._cluster ) {
			const now = new Date();
			const timer = this._utc
				? [ now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
					now.getUTCHours(), now.getUTCMinutes(), now.getUTCSeconds(), now.getUTCMilliseconds() ]
				: [ now.getFullYear(), now.getMonth() + 1, now.getDate(),
					now.getHours(), now.getMinutes(), now.getSeconds(), now.getMilliseconds() ];
			let change = 2; // date changed or first entry
			if ( this._lastEntryTimer ) {
				change = 0; // neither date nor time changed
				for ( let i = 0; i < 6; ++i ) {
					if ( timer[ i ] !== this._lastEntryTimer[ i ] ) {
						change = i < 3 ? 2 : 1; // date or time changed
						break;
					}
				}
			}
			if ( change > 1 ) {
				if ( this._stream && !this._stream.writableEnded ) {
					this._stream.end();
				}
				this._path = `${ this._dir }/${ timer[ 0 ].toString() }-\
${ timer[ 1 ].toString().padStart( 2, '0' ) }-\
${ timer[ 2 ].toString().padStart( 2, '0' ) }${ this._tag }`
					+ ( cluster.isWorker ? `.${ cluster.worker?.id.toString().padStart( 3, '0' ) }${ this._ext }` : this._ext );
				this._stream = fs.createWriteStream( this._path, { flags: 'a' } );
				this._stream.on( 'error', err => {
					this._lastEntryTimer = undefined;
					process.stderr.write( `|${ now.toISOString() }|\nfailure to write entry: \
${ this._stringify( message ) }\n${ this._stringifyArray( data ) }\n...on error: ${ err }\n` );
				} );
			}
			if ( change > 0 ) {
				const timestamp = `|${ timer[ 3 ].toString().padStart( 2, '0' ) }:\
${ timer[ 4 ].toString().padStart( 2, '0' ) }:\
${ timer[ 5 ].toString().padStart( 2, '0' ) }|\n`;
				this._stream?.write( timestamp );
				if ( this._stdout ) {
					process.stdout.write( timestamp );
				}
			}
			const entry = `|${ timer[ 6 ].toString().padStart( 3, '0' ) }| ${ this._stringify( message ) }\n${ this._stringifyArray( data ) }`;
			this._stream?.write( entry );
			if ( this._stdout ) {
				process.stdout.write( entry );
			}
			this._lastEntryTimer = timer;
		}
		else {
			process.send!( {
				__logfile_service: this._cluster,
				message: this._stringify( message ),
				data: data.map( v => this._stringify( v ) )
			} );
		}
	}

	/**
		Writes time indexed log entry with optional context data into date bound file
		@param message log entry
		@param data optional context data
	*/
	trace( message?: any, ...data: any[] ): void {
		if ( this._level === LogLevel.TRACE ) {
			this.log( message, ...data );
		}
	}

	/**
		Writes time indexed log entry with optional context data into date bound file
		@param message log entry
		@param data optional context data
	*/
	debug( message?: any, ...data: any[] ): void {
		if ( this._level <= LogLevel.DEBUG ) {
			this.log( message, ...data );
		}
	}

	/**
		Writes time indexed log entry with optional context data into date bound file
		@param message log entry
		@param data optional context data
	*/
	info( message?: any, ...data: any[] ): void {
		if ( this._level <= LogLevel.INFORMATION ) {
			this.log( message, ...data );
		}
	}

	/**
		Writes time indexed log entry with optional context data into date bound file
		@param message log entry
		@param data optional context data
	*/
	warn( message?: any, ...data: any[] ): void {
		if ( this._level <= LogLevel.WARNING ) {
			this.log( message, ...data );
		}
	}

	/**
		Writes time indexed log entry with optional context data into date bound file
		@param message log entry
		@param data optional context data
	*/
	error( message?: any, ...data: any[] ): void {
		if ( this._level <= LogLevel.ERROR ) {
			this.log( message, ...data );
		}
	}

	/**
		Writes time indexed log entry with optional context data into date bound file
		@param message log entry
		@param data optional context data
	*/
	fail( message?: any, ...data: any[] ): void {
		this.log( message, ...data );
	}

	/**
		Logfile directory
	*/
	get directory(): string {
		return this._dir;
	}

	/**
		Logfile tag
	*/
	get tag(): string {
		return this._tag;
	}

	/**
		Logfile extension
	*/
	get extension(): string {
		return this._ext;
	}

	/**
		True to log date and time in UTC
	*/
	get utc(): boolean {
		return this._utc;
	}

	/**
		True to log error stack trace
	*/
	get stack(): boolean {
		return this._stack;
	}

	/**
		True to additionally log to stdout
	*/
	get stdout(): boolean {
		return this._stdout;
	}

	/**
		Log level
	*/
	get level(): LogLevel {
		return this._level;
	}

	/**
		Cluster identifier
	*/
	get cluster(): string {
		return this._cluster;
	}

	/**
		Logfile path - available only after at least one log entry written
	*/
	get path(): string {
		return this._path;
	}

	private _stringify( value: any ): string {
		try {
			return typeof value === 'string'
				? value
				: value.message || value.name
					? this._stack && value.stack
						? `${ value.message ?? value.name ?? value }\n${ value.stack }`
						: `${ value.message ?? value.name }`
					: JSON.stringify( value, LogFile._replace );
		}
		catch ( err ) {
			return value.toString();
		}
	}

	private _stringifyArray( values: any[] ): string {
		return values.map( v => `${ this._stringify( v ) }\n` ).join( '' );
	}

	private static _replace( this: any, key: string, value: any ): any {
		return typeof value === 'bigint'
			? value.toString()
			: value;
	}

}
