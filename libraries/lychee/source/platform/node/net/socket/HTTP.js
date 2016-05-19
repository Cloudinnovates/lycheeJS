
lychee.define('lychee.net.socket.HTTP').tags({
	platform: 'node'
}).requires([
	'lychee.net.protocol.HTTP'
]).includes([
	'lychee.event.Emitter'
]).supports(function(lychee, global) {

	try {

		require('net');

		return true;

	} catch(e) {
	}


	return false;

}).exports(function(lychee, global, attachments) {

	var _Protocol = lychee.import('lychee.net.protocol.HTTP');
	var _net      = require('net');



	/*
	 * HELPERS
	 */

	var _verify_client = function(headers) {
		// TODO: Verify Client based on CORS headers
	};

	var _verify_remote = function(headers) {
		// TODO: Verify Remote based on CORS headers
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
			data['constructor'] = 'lychee.net.socket.HTTP';


			return data;

		},



		/*
		 * CUSTOM API
		 */

		connect: function(host, port, connection) {

			host       = typeof host === 'string'       ? host       : null;
			port       = typeof port === 'number'       ? (port | 0) : null;
			connection = typeof connection === 'object' ? connection : null;


			var that     = this;
			var url      = host.match(/:/g) !== null ? ('http://[' + host + ']:' + port) : ('http://' + host + ':' + port);
			var protocol = null;


			if (host !== null && port !== null) {

				if (connection !== null) {

					protocol = new _Protocol(_Protocol.TYPE.remote);

					connection.allowHalfOpen = true;
					connection.setTimeout(0);
					connection.setNoDelay(true);
					connection.setKeepAlive(true, 0);
					connection.removeAllListeners('timeout');

				} else {

					protocol   = new _Protocol(_Protocol.TYPE.client);
					connection = new _net.Socket({
						fd:       null,
						readable: true,
						writable: true
					});

					connection.allowHalfOpen = true;
					connection.setTimeout(0);
					connection.setNoDelay(true);
					connection.setKeepAlive(true, 0);
					connection.removeAllListeners('timeout');

				}


				connection.on('data', function(blob) {

					var chunks = protocol.receive(blob);
					if (chunks.length > 0) {

						for (var c = 0, cl = chunks.length; c < cl; c++) {

							var chunk = chunks[c];
// TODO: Implement intelligent close frames
							if (chunk[0] === 136 && false) {

								that.send(chunk, true);
								that.disconnect();

								return;

							} else {

								that.trigger('receive', [ chunk ]);

							}

						}

					}

				});

				connection.on('error', function() {
					that.trigger('error');
					that.disconnect();
				});

				connection.on('timeout', function() {
					that.trigger('error');
					that.disconnect();
				});

				connection.on('close', function() {
					that.disconnect();
				});

				connection.on('end', function() {
					that.disconnect();
				});


				if (lychee.debug === true) {
					console.log('lychee.net.socket.HTTP: Connect to ' + host + ':' + port);
				}


				that.__connection = connection;
				that.__protocol   = protocol;


				if (connection.server === null) {
					connection.connect();
				}


				setTimeout(function() {
					that.trigger('connect');
				}, 0);

			}

		},

		send: function(data, binary) {

			data   = data instanceof Buffer ? data : null;
			binary = binary === true;


			if (data !== null) {

				var connection = this.__connection;
				var protocol   = this.__protocol;

				if (connection !== null && protocol !== null) {

					var chunk = protocol.send(data, binary);
					var enc   = binary === true ? 'binary' : 'utf8';

					if (chunk !== null) {
						connection.write(chunk, enc);
					}

				}

			}

		},

		disconnect: function() {

			if (lychee.debug === true) {
				console.log('lychee.net.socket.HTTP: Disconnect');
			}


			var connection = this.__connection;
			var protocol   = this.__protocol;

			if (connection !== null && protocol !== null) {

				this.__connection = null;
				this.__protocol   = null;

				connection.destroy();
				protocol.close();


				// XXX: destroy() method is SYNCHRONOUS
				// so event HAS to be delayed
				this.trigger('disconnect');

			}

		}

	};


	return Class;

});

