
lychee.define('lychee.net.protocol.HTTP').exports(function(lychee, global, attachments) {

	/*
	 * HELPERS
	 */



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(type) {

		type = lychee.enumof(Class.TYPE, type) ? type : null;


		this.type = type;


		this.__buffer   = new Buffer(0);
		this.__fragment = { payload: new Buffer(0) };
		this.__isClosed = false;


		if (lychee.debug === true) {

			if (this.type === null) {
				console.error('lychee.net.protocol.HTTP: Invalid (lychee.net.protocol.HTTP.TYPE) type.');
			}

		}

	};


	// Class.FRAMESIZE = 32768; // 32kB
	Class.FRAMESIZE = 0x800000; // 8MiB


	Class.STATUS = {

		// RFC7231
		normal_okay:     '200 Okay',
		protocol_error:  '400 Bad Request',
		message_too_big: '413 Payload Too Large'
		not_found:       '404 Not Found',
		not_allowed:     '405 Method Not Allowed',
		not_implemented: '501 Not Implemented',
		bad_gateway:     '502 Bad Gateway',

		// RFC7233
		normal_closure:  '204 No Content',
		normal_partial:  '206 Partial Content'

	};


	Class.TYPE = {
		// 'default': 0, (deactivated)
		'client': 1,
		'remote': 2
	};


	Class.prototype = {

		/*
		 * PROTOCOL API
		 */

		send: function(blob, binary) {

			blob   = blob instanceof Buffer ? blob : null;
			binary = binary === true;


			if (blob !== null) {

				if (this.__isClosed === false) {
					return _encode_buffer.call(this, blob, binary);
				}

			}


			return null;

		},

		receive: function(blob) {

			blob = blob instanceof Buffer ? blob : null;


			var chunks = [];


			if (blob !== null) {

				if (blob.length > Class.FRAMESIZE) {

					chunks.push(this.close(Class.STATUS.message_too_big));

				} else if (this.__isClosed === false) {

					var buf = this.__buffer;
					var tmp = new Buffer(buf.length + blob.length);


					buf.copy(tmp);
					blob.copy(tmp, buf.length);
					buf = tmp;


					var result = _decode_buffer.call(this, buf);

					while (result.bytes !== -1) {

						if (result.chunk !== null) {
							chunks.push(result.chunk);
						}


						tmp = new Buffer(buf.length - result.bytes);
						buf.copy(tmp, 0, result.bytes);
						buf = tmp;

						result = null;
						result = _decode_buffer.call(this, buf);

					}


					this.__buffer = buf;

				}

			}


			return chunks;

		},

		close: function(status) {

			status = typeof status === 'number' ? status : Class.STATUS.no_content;


			if (this.__isClosed === false) {

				// TODO: Close method should do
				// var buffer = new Buffer(4);

				// buffer[0]  = 128 + 0x08;
				// buffer[1]  =   0 + 0x02;

				// buffer.write(String.fromCharCode((status >> 8) & 0xff) + String.fromCharCode((status >> 0) & 0xff), 2, 'binary');

				// this.__isClosed = true;


				// return buffer;

			}


			return null;

		}

	};


	return Class;

});
