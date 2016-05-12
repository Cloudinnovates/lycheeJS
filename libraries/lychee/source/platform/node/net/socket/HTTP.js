
lychee.define('lychee.net.socket.HTTP').tags({
	platform: 'node'
}).requires([
	'lychee.net.protocol.HTTP'
]).includes([
	'lychee.event.Emitter'
]).supports(function(lychee, global) {

	try {

		require('http');

		return true;

	} catch(e) {
	}


	return false;

}).exports(function(lychee, global, attachments) {

	var _Protocol = lychee.import('lychee.net.protocol.HTTP');
	var _http     = require('http');



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


			var that = this;
			var url  = host.match(/:/g) !== null ? ('http://[' + host + ']:' + port) : ('http://' + host + ':' + port);


			if (host !== null && port !== null) {

				if (connection !== null) {

					connection.on('request', function(request) {

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
										console.log('lychee.net.socket.HTTP: Disconnected');
									}

									that.__connection = null;
									that.__protocol   = null;
									that.trigger('disconnect');
									// this.destroy();

								});


								if (lychee.debug === true) {
									console.log('lychee.net.socket.HTTP: Connected to ' + host + ':' + port);
								}


								that.__connection = socket;
								that.__protocol   = protocol;

								setTimeout(function() {
									that.trigger('connect');
								}, 100);

							} else {


// TODO: Verify if this is triggered on second request
// returned verification shall be an empty string on GET/POST/PUT/DELETE
// 1. OPTIONS + GET
// 2. GET only (old Clients)

								socket.end();
								socket.destroy();


								that.__connection = null;
								that.__protocol   = null;
								that.trigger('error');

							}

						}

					});

// TODO: Port harvester.net.Remote stuff

				} else {

// TODO: Port harvester.net.Client stuff

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

