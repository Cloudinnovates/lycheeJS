
lychee.define('harvester.net.Remote').includes([
	'lychee.net.Tunnel'
]).exports(function(lychee, global, attachments) {

	var _Tunnel = lychee.import('lychee.net.Tunnel');



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(data) {

		var settings = lychee.extend({}, data);


		_Tunnel.call(this, settings);

		settings = null;

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			var data = _Tunnel.prototype.serialize.call(this);
			data['constructor'] = 'harvester.net.Remote';


			return data;

		},



		/*
		 * CUSTOM API
		 */

		send: function(data, headers) {

			data    = data instanceof Object    ? data    : null;
			headers = headers instanceof Object ? headers : {};


			headers['access-control-allow-origin'] = '*';
			headers['content-control']             = 'no-transform';

			var content_type = headers['content-type'] || null;
			if (content_type === null) {
				headers['content-type'] = 'application/json';
			}


			if (/@plug|@unplug/g.test(headers.method) === false) {
				return _Tunnel.prototype.send.call(this, data, headers);
			}


			return false;

		}

	};


	return Class;

});

