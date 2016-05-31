
lychee.define('lychee.net.socket.HTTP').tags({
	platform: 'html'
}).requires([
	'lychee.net.protocol.HTTP'
]).includes([
	'lychee.event.Emitter'
]).supports(function(lychee, global) {

	try {


		return true;

	} catch(e) {
	}


	return false;

}).exports(function(lychee, global, attachments) {

	var _Protocol = lychee.import('lychee.net.protocol.HTTP');



	/*
	 * HELPERS
	 */

	var _connect_socket = function(socket, protocol) {

		var that = this;
		if (that.__connection !== socket) {

			// TODO: connect socket events

			that.__connection = socket;
			that.__protocol   = protocol;

			that.trigger('connect');

		}

	};

	var _disconnect_socket = function(socket, protocol) {

		var that = this;
		if (that.__connection === socket) {

			// TODO: disconnect socket events

			// socket.destroy();
			protocol.close();


			that.__connection = null;
			that.__protocol   = null;


			setTimeout(function() {
				that.trigger('disconnect');
			}, 0);

		}

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

					protocol   = new _Protocol(_Protocol.TYPE.remote);
					connection = null;

					// TODO: Remote Socket API

					// _connect_socket.call(that, connection, protocol);
					// connection.resume();

				} else {

					protocol   = new _Protocol(_Protocol.TYPE.client);
					connection = null;

					// TODO: Client Socket API

					// _connect_socket.call(that, connection, protocol);
					// connection.connect({host, port});

				}

			}

		},

		send: function(payload, headers, binary) {

			payload = payload instanceof Buffer ? payload : null;
			headers = headers instanceof Object ? headers : null;
			binary  = binary === true;


			if (payload !== null) {

				var connection = this.__connection;
				var protocol   = this.__protocol;

				if (connection !== null && protocol !== null) {

					var chunk = protocol.send(payload, headers, binary);
					var enc   = binary === true ? 'binary' : 'utf8';

					if (chunk !== null) {
						connection.write(chunk, enc);
					}

				}

			}

		},

		disconnect: function() {

			var connection = this.__connection;
			var protocol   = this.__protocol;

			if (connection !== null && protocol !== null) {

				_disconnect_socket.call(this, connection, protocol);


				return true;

			}


			return false;

		}

	};


	return Class;

});

