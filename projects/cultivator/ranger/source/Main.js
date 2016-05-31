
lychee.define('app.Main').requires([
	'app.state.Welcome',
	'app.state.Profile',
//	'app.state.Console',
//	'app.state.Remote'
]).includes([
	'lychee.app.Main'
]).exports(function(lychee, global, attachments) {

	var _lychee = lychee.import('lychee');
	var _app    = lychee.import('app');
	var _Main   = lychee.import('lychee.app.Main');



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(data) {

		var settings = lychee.extend({

			client: null,
			server: null

		}, data);


		this.config  = null;
		this.profile = null;


		_Main.call(this, settings);



		/*
		 * INITIALIZATION
		 */

		this.bind('load', function(oncomplete) {

			this.reload(function(config, profile) {
				oncomplete(true);
			}, this);

		}, this, true);

		this.bind('init', function() {

			this.setState('welcome', new _app.state.Welcome(this));
			this.setState('profile', new _app.state.Profile(this));
			// this.setState('console', new _app.state.Console(this));
			// this.setState('remote',  new _app.state.Remote(this));


			this.changeState('welcome', 'welcome');

		}, this, true);

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		// deserialize: function(blob) {},

		serialize: function() {

			var data = _Main.prototype.serialize.call(this);
			data['constructor'] = 'app.Main';

			var settings = data['arguments'][0] || {};
			var blob     = data['blob'] || {};


			data['arguments'][0] = settings;
			data['blob']         = Object.keys(blob).length > 0 ? blob : null;


			return data;

		},

		reload: function(callback, scope) {

			callback = callback instanceof Function ? callback : null;
			scope    = scope !== undefined          ? scope    : this;


			var that    = this;
			var config  = new Config('http://localhost:4848/api/project/index?timestamp=' + Date.now());
			var profile = new Config('http://localhost:4848/api/profile/index?timestamp=' + Date.now());


			config.onload = function(result) {

				if (this.buffer !== null) {
					that.config = this;
				}

				profile.load();

			};

			profile.onload = function(result) {

				if (this.buffer !== null) {
					that.profile = this;
				}

				callback.call(scope, that.config, that.profile);

			}

			config.load();

		}

	};


	return Class;

});
