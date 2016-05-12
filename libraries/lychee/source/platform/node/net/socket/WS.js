
lychee.define('lychee.net.socket.WS').tags({
	platform: 'node'
}).requires([
	'lychee.crypto.SHA1',
	'lychee.net.protocol.WS'
]).includes([
	'lychee.event.Emitter'
]).supports(function(lychee, global) {

	try {

		require('http');

		if (typeof global.setInterval === 'function') {
			return true;
		}

	} catch(e) {
	}


	return false;

}).exports(function(lychee, global, attachments) {

	var _Protocol    = lychee.import('lychee.net.protocol.WS');
	var _SHA1        = lychee.import('lychee.crypto.SHA1');
	var _http        = require('http');
	var _setInterval = global.setInterval;



	/*
	 * HELPERS
	 */

	var _verify_client = function(headers, nonce) {

		var connection = (headers.connection || '').toLowerCase();
		var upgrade    = (headers.upgrade    || '').toLowerCase();
		var protocol   = (headers['sec-websocket-protocol'] || '').toLowerCase();

		if (connection === 'upgrade' && upgrade === 'websocket' && protocol === 'lycheejs') {

			var accept = (headers['sec-websocket-accept'] || '');
			var expect = (function(nonce) {

				var sha1 = new _SHA1();
				sha1.update(nonce + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
				return sha1.digest().toString('base64');

			})(nonce.toString('base64'));

			if (accept === expect) {
				return accept;
			}

		}


		return null;

	};

	var _verify_remote = function(headers) {

		var connection = (headers.connection || '').toLowerCase();
		var upgrade    = (headers.upgrade    || '').toLowerCase();
		var protocol   = (headers['sec-websocket-protocol'] || '').toLowerCase();

		if (connection.indexOf('upgrade') !== -1 && upgrade.indexOf('websocket') !== -1 && protocol === 'lycheejs') {

			var host   = headers.host   || null;
			var nonce  = headers['sec-websocket-key'] || null;
			var origin = headers.origin || null;

			if (host !== null && nonce !== null && origin !== null) {

				var handshake = '';
				var accept    = (function(nonce) {

					var sha1 = new _SHA1();
					sha1.update(nonce + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11');
					return sha1.digest().toString('base64');

				})(nonce);


				// HEAD

				handshake += 'HTTP/1.1 101 WebSocket Protocol Handshake\r\n';
				handshake += 'Upgrade: WebSocket\r\n';
				handshake += 'Connection: Upgrade\r\n';

				handshake += 'Sec-WebSocket-Version: '  + '13'       + '\r\n';
				handshake += 'Sec-WebSocket-Origin: '   + origin     + '\r\n';
				handshake += 'Sec-WebSocket-Protocol: ' + 'lycheejs' + '\r\n';
				handshake += 'Sec-WebSocket-Accept: '   + accept     + '\r\n';


				// BODY
				handshake += '\r\n';


				return handshake;

			}

		}


		return null;

	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function() {

		this.__connection = null;
		this.__protocol   = null;


		lychee.event.Emitter.call(this);

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			var data = lychee.event.Emitter.prototype.serialize.call(this);
			data['constructor'] = 'lychee.net.socket.WS';


			return data;

		},



		/*
		 * CUSTOM API
		 */

		connect: function(host, port, connection) {

			host       = typeof host === 'string'       ? host       : null;
			port       = typeof port === 'number'       ? (port | 0) : null;
			connection = typeof connection === 'object' ? connection : null;


			var that = this;
			var url  = host.match(/:/g) !== null ? ('ws://[' + host + ']:' + port) : ('ws://' + host + ':' + port);


			if (host !== null && port !== null) {

				if (connection !== null) {

					connection.on('upgrade', function(request) {

						var protocol = new _Protocol(_Protocol.TYPE.remote);
						var socket   = request.socket || null;


						if (socket !== null) {

							var verification = _verify_remote(request.headers);
							if (verification !== null) {

								socket.write(verification, 'ascii');
								socket.setTimeout(0);
								socket.setNoDelay(true);
								socket.setKeepAlive(true, 0);
								socket.removeAllListeners('timeout');


								socket.on('data', function(blob) {

									var chunks = protocol.receive(blob);
									if (chunks.length > 0) {

										for (var c = 0, cl = chunks.length; c < cl; c++) {
											that.trigger('receive', [ chunks[c] ]);
										}

									}

								});

								socket.on('error', function() {

									that.trigger('error');
									this.end();

								});

								socket.on('timeout', function() {

									this.end();

								});

								socket.on('close', function() {
									// XXX: Do nothing
								});

								socket.on('end', function() {

									if (lychee.debug === true) {
										console.log('lychee.net.socket.WS: Disconnected');
									}

									that.__connection = null;
									that.__protocol   = null;
									that.trigger('disconnect');
									// this.destroy();

								});


								if (lychee.debug === true) {
									console.log('lychee.net.socket.WS: Connected to ' + host + ':' + port);
								}


								that.__connection = socket;
								that.__protocol   = protocol;

								setTimeout(function() {
									that.trigger('connect');
								}, 100);

							} else {

								socket.end();
								socket.destroy();


								that.__connection = null;
								that.__protocol   = null;
								that.trigger('error');

							}

						}

					});

				} else {

					var nonce = new Buffer(16);

					for (var n = 0; n < 16; n++) {
						nonce[n] = Math.round(Math.random() * 0xff);
					}


					var connector = _http.request({
						hostname: host,
						port:     port,
						method:   'GET',
						headers:  {
							'Upgrade':                'websocket',
							'Connection':             'Upgrade',
							'Origin':                 url,
							'Host':                   host + ':' + port,
							'Sec-WebSocket-Key':      nonce.toString('base64'),
							'Sec-WebSocket-Version':  '13',
							'Sec-WebSocket-Protocol': 'lycheejs'
						}
					});


					connector.on('upgrade', function(response) {

						var protocol = new _Protocol(_Protocol.TYPE.client);
						var socket   = response.socket || null;


						if (socket !== null) {

							var verification = _verify_client(response.headers, nonce);
							if (verification !== null) {

								socket.setTimeout(0);
								socket.setNoDelay(true);
								socket.setKeepAlive(true, 0);
								socket.removeAllListeners('timeout');


								_setInterval(function() {

									var chunk = protocol.ping();
									if (chunk !== null) {
										socket.write(chunk);
									}

								}.bind(this), 60000);


								socket.on('data', function(blob) {

									var chunks = protocol.receive(blob);
									if (chunks.length > 0) {

										for (var c = 0, cl = chunks.length; c < cl; c++) {
											that.trigger('receive', [ chunks[c] ]);
										}

									}

								});

								socket.on('error', function() {

									that.trigger('error');
									this.end();

								});

								socket.on('timeout', function() {

									that.trigger('error');
									this.end();

								});

								socket.on('close', function() {
									// XXX: Do nothing
								});

								socket.on('end', function() {

									if (lychee.debug === true) {
										console.log('lychee.net.socket.WS: Disconnected');
									}

									that.__connection = null;
									that.__protocol   = null;
									that.trigger('disconnect');
									// this.destroy();

								});


								if (lychee.debug === true) {
									console.log('lychee.net.socket.WS: Connected to ' + host + ':' + port);
								}


								that.__connection = socket;
								that.__protocol   = protocol;
								that.trigger('connect');

							} else {

								socket.end();
								socket.destroy();


								that.__connection = null;
								that.__protocol   = null;
								that.trigger('error');

							}

						}

					});

					connector.on('error', function(response) {

						var socket = response.socket || null;
						if (socket !== null) {

							socket.end();
							socket.destroy();


							that.__connection = null;
							that.__protocol   = null;
							that.trigger('error');

						}

					});

					connector.on('response', function(response) {

						var socket = response.socket || null;
						if (socket !== null) {

							socket.end();
							socket.destroy();


							that.__connection = null;
							that.__protocol   = null;
							that.trigger('error');

						}

					});

					connector.end();

				}

			}

		},

		send: function(data, binary) {

			data   = data instanceof Buffer ? data : null;
			binary = binary === true;


			if (data !== null) {

				var connection = this.__connection;
				var protocol   = this.__protocol;

				if (connection !== null && protocol !== null) {

					var chunk = this.__protocol.send(data, binary);
					var enc   = binary === true ? 'binary' : 'utf8';

					if (chunk !== null) {
						connection.write(chunk, enc);
					}

				}

			}

		},

		disconnect: function() {

			if (lychee.debug === true) {
				console.log('lychee.net.socket.WS: Disconnected');
			}


			if (this.__connection !== null) {
				this.__connection.close();
			}

		}

	};


	return Class;

});

