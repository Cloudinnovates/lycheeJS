
lychee.define('harvester.net.Remote').requires([
	'harvester.net.protocol.HTTP'
]).includes([
	'lychee.net.Tunnel'
]).exports(function(lychee, global, attachments) {

	var _Protocol = lychee.import('harvester.net.protocol.HTTP');



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(data) {

		var settings = lychee.extend({}, data);


		this.__socket      = null;
		this.__isConnected = false;


		settings.codec = {
			encode: function(data) { return data; },
			decode: function(data) { return data; }
		};


		lychee.net.Tunnel.call(this, settings);

		settings = null;



		/*
		 * INITIALIZATION
		 */

		this.unbind('connect');
		this.bind('connect', function() {
			this.__isConnected = true;
		}, this);

		this.unbind('disconnect');
		this.bind('disconnect', function() {
			this.__isConnected = false;
		}, this);

		this.unbind('send');
		this.bind('send', function(blob) {

			if (this.__socket !== null) {
				this.__socket.send(blob.headers, blob.payload);
			}

		}, this);

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			var data = lychee.net.Tunnel.prototype.serialize.call(this);
			data['constructor'] = 'harvester.net.Remote';


			return data;

		},



		/*
		 * CUSTOM API
		 */

		connect: function(socket) {

			if (this.__isConnected === false) {

				var that = this;


				this.__socket = new _Protocol(socket, _Protocol.TYPE.remote);

				this.__socket.ondata = function(headers, payload) {

					that.receive({
						headers: headers,
						payload: payload
					});

				};

				this.__socket.onclose = function(code) {
					that.__socket = null;
					that.trigger('disconnect', [ code ]);
				};


				if (lychee.debug === true) {
					console.log('harvester.net.Remote: Connected to ' + this.host + ':' + this.port);
				}


				return true;

			}


			return false;

		},

		disconnect: function() {

			if (this.__isConnected === true) {

				if (lychee.debug === true) {
					console.log('harvester.net.Remote: Disconnected from ' + this.host + ':' + this.port);
				}

				if (this.__socket !== null) {
					this.__socket.close();
				}


				return true;

			}


			return false;

		}

	};


	return Class;

});

