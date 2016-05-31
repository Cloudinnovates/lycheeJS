
lychee.define('harvester.net.server.Redirect').exports(function(lychee, global, attachments) {

	var Module = {

		/*
		 * MODULE API
		 */

		serialize: function() {

			return {
				'reference': 'harvester.net.server.Redirect',
				'arguments': []
			};

		},



		/*
		 * CUSTOM API
		 */

		receive: function(payload, headers) {

			var tunnel = this.tunnel;
			var url    = headers['url'];

			if (url === '/index.html' || url === '/') {

				tunnel.send('SHIT', {
					'status':   '301 Moved Permanently',
					'location': '/projects/cultivator/index.html'
				});

				return true;

			} else if (url.substr(0, 9) === '/projects') {

				var identifier = url.split('/').slice(0, 3).join('/');
				var project    = lychee.import('MAIN')._projects[identifier] || null;
				if (project !== null) {

					var path = '/' + url.split('/').slice(3).join('/');
					if (path === identifier || path === identifier + '/' || path === '/') {

						var info = project.filesystem.info('/index.html');
						if (info !== null) {

							tunnel.send('', {
								'status':   '301 Moved Permanently',
								'location': identifier + '/index.html'
							});

							return true;

						}

					}

				}

			}


			return false;

		}

	};


	return Module;

});

