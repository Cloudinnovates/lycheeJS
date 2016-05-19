
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

					var protocol = new _Protocol(_Protocol.TYPE.remote);

// TODO: lychee.net.Remote API

				} else {

					var protocol = new _Protocol(_Protocol.TYPE.client);

// TODO: lychee.net.Client API

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
				console.log('lychee.net.socket.HTTP: Disconnected');
			}


			if (this.__connection !== null) {
				this.__connection.close();
			}

		}

	};


	return Class;

});

