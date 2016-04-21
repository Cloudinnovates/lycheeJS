
lychee.define('harvester.serve.API').requires([
	'lychee.data.JSON',
//	'harvester.serve.api.Console',
	'harvester.serve.api.Library',
	'harvester.serve.api.Profile',
	'harvester.serve.api.Project',
	'harvester.serve.api.Server'
]).exports(function(lychee, global, attachments) {

	var _JSON   = lychee.data.JSON;
	var _ADMIN  = {
		'Console': lychee.import('harvester.serve.api.Console'),
		'Library': lychee.import('harvester.serve.api.Library'),
		'Profile': lychee.import('harvester.serve.api.Profile'),
		'Project': lychee.import('harvester.serve.api.Project')
	};
	var _PUBLIC = {
		'Server': lychee.import('harvester.serve.api.Server')
	};



	/*
	 * IMPLEMENTATION
	 */

	var Module = {

		can: function(host, url) {

			if (url.substr(0, 5) === '/api/') {
				return true;
			}


			return false;

		},

		process: function(host, url, data, ready) {

			var api  = url.split('/').pop().split('?')[0];
			var name = (data.headers.host || '');

			if (name === 'localhost:4848' && _ADMIN[api] !== null) {

				_ADMIN[api].process(host, url, data, ready);

			} else if (_PUBLIC[api] !== null) {

				_PUBLIC[api].process(host, url, data, ready);

			} else {

				ready({
					headers: { 'status': 404, 'content-type': 'application/json' },
					payload: _JSON.encode({
						error: 'API not found.'
					})
				});

			}

		}

	};


	return Module;

});

