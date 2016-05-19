
lychee.define('harvester.net.remote.Project').includes([
	'lychee.net.Service'
]).exports(function(lychee, global, attachments) {

	var _Service = lychee.import('lychee.net.Service');
	var _Server  = lychee.import('harvester.mod.Server');



	/*
	 * HELPERS
	 */

	var _on_start = function(data) {
// TODO: start project
	};

	var _on_stop = function(data) {
// TODO: stop project
	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(remote) {

		_Service.call(this, 'control', remote, _Service.TYPE.remote);


		this.bind('start', _on_start, this);
		this.bind('stop',  _on_stop,  this);

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		serialize: function() {

			var data = _Service.prototype.serialize.call(this);
			data['constructor'] = 'harvester.net.remote.Project';


			return data;

		},



		/*
		 * CUSTOM API
		 */

		index: function(data) {
// TODO: Return array of all projects
		}

	};


	return Class;

});

