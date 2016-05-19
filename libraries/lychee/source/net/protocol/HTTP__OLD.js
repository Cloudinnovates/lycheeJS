
lychee.define('lychee.net.protocol.HTTP').exports(function(lychee, global, attachments) {



	/*
	 * HELPERS
	 */

	var _uppercase = function(str) {

		return str.split('-').map(function(val) {
			return val.charAt(0).toUpperCase() + val.substr(1);
		}).join('-');

	};

	var _STATUS = {
		100: '100 Continue',
		200: '200 OK',
		206: '206 Partial Content',
		301: '301 Moved Permanently',
		302: '302 Found',
		304: '304 Not Modified',
		400: '400 Bad Request',
		401: '401 Unauthorized',
		403: '403 Forbidden',
		404: '404 Not Found',
		405: '405 Method Not Allowed',
		500: '500 Internal Server Error',
		501: '501 Not Implemented',
		502: '502 Bad Gateway',
		503: '503 Service Unavailable',
		504: '504 Gateway Timeout',
		505: '505 HTTP Version Not Supported'
	};

	var _encode_buffer = function(headers, data, binary) {

		var type           = this.type;
		var buffer         = null;
		var tmp_headers    = '\r\n';

		var status_length  = 0;
		var status_data    = null;
		var headers_length = 0;
		var headers_data   = null;
		var payload_length = data.length;
		var payload_data   = data;


		if (type === Class.TYPE.client) {

			status_data   = new Buffer('', 'utf8');
			status_length = status_data.length;



			tmp_headers = '\r\n';

			if (typeof headers.method === 'string' || typeof headers.url === 'string') {
				tmp_headers += (headers.method || 'GET') + ' ' + (headers.url || '/') + ' HTTP/1.1\r\n';
			} else {
				tmp_headers += 'GET * HTTP/1.1\r\n';
			}

			delete headers.method;
			delete headers.url;


			for (var key1 in headers) {
				tmp_headers += '' + _uppercase(key1) + ': ' + headers[key1] + '\r\n';
			}

			tmp_headers += 'Content-Length: ' + payload_length + '\r\n';
//			tmp_headers += 'Connection: keep-alive\r\n';
			tmp_headers += '\r\n';


			headers_data   = new Buffer(tmp_headers, 'utf8');
			headers_length = headers_data.length;

		} else {

			if (typeof headers.location === 'string') {

				status_data   = new Buffer('HTTP/1.1 ' + _STATUS[301], 'utf8');
				status_length = status_data.length;

			} else if (typeof headers.status === 'number') {

				status_data   = new Buffer('HTTP/1.1 ' + (_STATUS[headers.status] || _STATUS[500]), 'utf8');
				status_length = status_data.length;
				delete headers.status;

			} else {

				status_data   = new Buffer('HTTP/1.1 ' + _STATUS[200], 'utf8');
				status_length = status_data.length;

			}



			tmp_headers = '\r\n';

			for (var key2 in headers) {
				tmp_headers += '' + _uppercase(key2) + ': ' + headers[key2] + '\r\n';
			}

			tmp_headers += 'Content-Length: ' + payload_length + '\r\n';
//			tmp_headers += 'Connection: keep-alive\r\n';
			tmp_headers += '\r\n';


			headers_data   = new Buffer(tmp_headers, 'utf8');
			headers_length = headers_data.length;

		}


		buffer = new Buffer(status_length + headers_length + payload_length);

		status_data.copy(buffer, 0);
		headers_data.copy(buffer, status_length);
		payload_data.copy(buffer, status_length + headers_length);


		return buffer;

	};

	var _decode_buffer = function(buffer) {

		buffer = buffer.toString();


		var parsed_bytes   = -1;
		var type           = this.type;

		var headers_length = buffer.indexOf('\r\n\r\n');
		var headers_data   = buffer.substr(0, headers_length);
		var payload_data   = buffer.substr(headers_length);
		var payload_length = payload_data.length;


		// Well, fuck you, Blink. TCP RST exists for a reason.
		// Well, fuck you, curl. Because you guys are the shit.
		if (headers_data.substr(0, 4) === 'POST' || headers_data.substr(0, 3) === 'PUT') {

			if (payload_data === '\r\n\r\n' && !headers_data.match(/curl/)) {
				return -1;
			}

		}


		parsed_bytes = headers_length + payload_length;


		var headers = { status: 200 };
		var payload = {};


		headers_data.split('\r\n').forEach(function(value) {

			if (value.indexOf(':') !== -1) {

				var tmp1 = value.split(':');
				var key  = tmp1.shift().toLowerCase();
				var val  = tmp1.join(':');

				headers[key] = val.trim();

			} else if (value.split(' ')[0].match(/OPTIONS|GET|PUT|POST|DELETE/)){

				var tmp2   = value.split(' ');
				var method = tmp2[0].trim();
				var url    = tmp2[1].trim();

				headers['method'] = method;
				headers['url']    = url;

			} else if (value.split(' ')[0].match(/([0-9]{3})/)) {

				headers['status'] = parseInt(value.split(' ')[0].trim(), 10);

			}

		});


		var content_type = headers['Content-Type'] || 'text/plain';
		if (content_type.match(/text\//g)) {
			payload = buffer.toString().split('\r\n\r\n')[1];
		} else {
			payload = buffer.slice(buffer.indexOf('\r\n\r\n'));
		}


		if (Object.keys(headers).length > 0) {
			this.ondata(headers, payload);
		}


		return parsed_bytes;

	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(socket, type) {

		type = lychee.enumof(Class.TYPE, type) ? type : null;


		this.socket  = socket;
		this.type    = type;
		this.ondata  = function() {};
		this.onclose = function(err) {};


		this.__isClosed = false;



		if (lychee.debug === true) {

			if (this.type === null) {
				console.error('lychee.net.protocol.HTTP: Invalid (lychee.net.protocol.HTTP.TYPE) type.');
			}

		}



		/*
		 * INITIALIZATION
		 */

		var that = this;
		var temp = new Buffer(0);

		this.socket.on('data', function(data) {

			if (data.length > Class.FRAMESIZE) {

				that.close(Class.STATUS.bad_request);

			} else if (that.__isClosed === false) {

				var tmp = new Buffer(temp.length + data.length);
				temp.copy(tmp);
				data.copy(tmp, temp.length);
				temp = tmp;

				var parsed_bytes = _decode_buffer.call(that, temp);
				if (parsed_bytes !== -1) {

					tmp = new Buffer(temp.length - parsed_bytes);
					temp.copy(tmp, 0, parsed_bytes);
					temp = tmp;

				}

			}

		});

		this.socket.on('error', function() {
			that.close(Class.STATUS.bad_request);
		});

		this.socket.on('timeout', function() {
			that.close(Class.STATUS.request_timeout);
		});

		this.socket.on('end', function() {
			that.close(Class.STATUS.normal_closure);
		});

		this.socket.on('close', function() {
			that.close(Class.STATUS.normal_closure);
		});

	};


	// Class.FRAMESIZE = 32768; // 32kB
	Class.FRAMESIZE = 0x800000; // 8MiB


	Class.STATUS = {
		normal_closure:  200,
		redirect:        302,
		not_modified:    304,
		bad_request:     400,
		request_timeout: 408
	};


	Class.TYPE = {
		// 'default': 0, (deactivated)
		'client': 1,
		'remote': 2
	};


	Class.prototype = {

		send: function(headers, payload, binary) {

			headers = headers instanceof Object ? headers : {};
			binary  = binary === true;


			var blob = null;

			if (typeof payload === 'string') {
				blob = new Buffer(payload, 'utf8');
			} else if (payload instanceof Buffer) {
				blob = payload;
			}


			if (blob !== null) {

				if (this.__isClosed === false) {

					var buffer = _encode_buffer.call(this, headers, blob, binary);
					if (buffer !== null) {

						this.socket.write(buffer);

						buffer = null;
						blob   = null;

						return true;

					}

				}

			}


			return false;

		},

		close: function(status) {

			status = typeof status === 'number' ? status : Class.STATUS.normal_closure;


			if (this.__isClosed === false) {

				this.socket.end();
				this.socket.destroy();


				this.__isClosed = true;
				this.onclose(status);


				return true;

			}


			return false;

		}

	};


	return Class;

});

