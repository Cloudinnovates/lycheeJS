
lychee.define('app.state.Profile').requires([
	'lychee.data.JSON',
	'lychee.ui.Blueprint',
	'lychee.ui.Element',
	'lychee.ui.entity.Helper',
	'lychee.ui.entity.Input',
	'lychee.ui.entity.Select',
	'lychee.ui.layer.Table',
	'app.ui.layer.Profile'
]).includes([
	'lychee.ui.State'
]).exports(function(lychee, global, attachments) {

	var _Helper = lychee.import('lychee.ui.entity.Helper');
	var _State  = lychee.import('lychee.ui.State');
	var _JSON   = lychee.import('lychee.data.JSON');
	var _BLOB   = attachments["json"].buffer;
	var _cache  = {};
	var _helper = new _Helper();



	/*
	 * HELPERS
	 */

	var _read_profile = function(profile) {

		if (profile.buffer !== null && profile.buffer.length > 0) {

			_cache = {};


			var element = this.queryLayer('ui', 'profile > select');
			var entity  = this.queryLayer('ui', 'profile > select > 0');
			var options = [];


			profile.buffer.forEach(function(object) {

				var identifier = object.identifier;

				_cache[identifier] = {
					port:  object.port,
					hosts: object.hosts
				};

				options.push(identifier);

			});


			if (entity !== null && options.indexOf(entity.value) !== -1) {
				entity.setOptions(options);
				element.trigger('relayout');
			}

		}

	};

	var _save_profile = function(identifier, profile) {

		var data = new Buffer(_JSON.encode(profile), 'utf8').toString('base64');

		_helper.setValue('profile=' + identifier + '?data=' + data);
		_helper.trigger('touch');

	};

	var _on_add = function(value) {

		var entity     = this.queryLayer('ui', 'profile > select > 2');
		var identifier = this.queryLayer('ui', 'profile > select > 0').value;

		if (identifier !== null) {

			var profile = _cache[identifier] || null;
			if (profile !== null) {

				if (profile.hosts instanceof Object) {

					profile.hosts[value.host] = value.project;
					_on_select.call(this, identifier);

				}

			}

		}

	};

	var _on_remove = function(entity, value) {

		var table      = this.queryLayer('ui', 'profile > select > 2');
		var identifier = this.queryLayer('ui', 'profile > select > 0').value;

		if (identifier !== null) {

			var profile = _cache[identifier] || null;
			if (profile !== null) {

				if (profile.hosts instanceof Object) {

					for (var host in profile.hosts) {

						if (host === value.host) {
							profile.hosts[host] = value.project;
						}

					}


					if (entity.value === 'remove') {
						delete profile.hosts[value.host];
						_on_select.call(this, identifier);
					}

				}

			}

		}

	};

	var _on_select = function(identifier) {

		var profile = _cache[identifier] || null;
		var table   = null;
		var entity  = null;
		var value   = [];


		if (profile !== null) {

			for (var host in profile.hosts) {

				var project = profile.hosts[host];

				value.push({
					host:    host,
					project: project === null ? '*' : project,
					action:  'remove'
				});

			}


			entity = this.queryLayer('ui', 'profile > select > 2');
			entity.setValue(profile.port);

		}


		table = this.queryLayer('ui', 'profile > modify > 0');
		table.setValue(value);

	};

	var _on_relayout = function() {

		var viewport = this.viewport;
		if (viewport !== null) {

			var entity    = null;
			var width     = viewport.width;
			var height    = viewport.height;
			var profile_h = 0;

			entity        = this.queryLayer('ui', 'profile > modify > 2');
			entity.height = 64;
			profile_h     = entity.height;

			entity        = this.queryLayer('ui', 'profile > modify > 0');
			entity.height = height - 80 - 32 - profile_h;

		}

	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(main) {

		_State.call(this, main);


		this.deserialize(_BLOB);

	};


	Class.prototype = {

		/*
		 * STATE API
		 */

		deserialize: function(blob) {

			_State.prototype.deserialize.call(this, blob);


			var menu = this.queryLayer('ui', 'menu');
			if (menu !== null) {

				menu.bind('relayout', function() {
					_on_relayout.call(this);
				}, this);

			}


			this.queryLayer('ui', 'profile > select > 0').bind('change', _on_select, this);
			this.queryLayer('ui', 'profile > modify > 0').bind('change', _on_remove, this);
			this.queryLayer('ui', 'profile > modify > 2').bind('change', _on_add,    this);

			this.queryLayer('ui', 'profile > select').bind('change', function(value) {

				if (value === 'save') {

					var data = {
						port:  1337,
						hosts: {}
					};


					var profile = this.queryLayer('ui', 'profile > select > 0');
					var port    = this.queryLayer('ui', 'profile > select > 2');
					var table   = this.queryLayer('ui', 'profile > modify > 0');


					if (port !== null) {
						data.port = port.value;
					}

					if (table !== null) {

						table.value.forEach(function(object) {
							data.hosts[object.host] = object.project === '*' ? null : object.project;
						});

					}


					if (profile !== null && profile.value !== null) {
						_save_profile(profile.value, data);
					}

				}

			}, this);


			var viewport = this.viewport;
			if (viewport !== null) {

				viewport.bind('reshape', function(orientation, rotation, width, height) {
					_on_relayout.call(this);
				}, this);

			}

		},

		serialize: function() {

			var data = _State.prototype.serialize.call(this);
			data['constructor'] = 'app.state.Profile';


			if (data.blob !== null) {

				if (data.blob.layers instanceof Object) {

					data.blob.layers['ui'].blob.entities = data.blob.layers['ui'].blob.entities.filter(function(blob) {
						return blob.constructor !== 'lychee.ui.Menu';
					});

				}

			}


			return data;

		},

		enter: function(oncomplete, data) {

			var profile = this.main.profile;
			if (profile !== null && profile.buffer !== null) {

				_read_profile.call(this, profile);


				var entity = this.queryLayer('ui', 'profile > select > 0');
				if (entity !== null) {
					entity.setValue('development');
					entity.trigger('change', [ 'development' ]);
				}

			}


			_State.prototype.enter.call(this, oncomplete, data);

		},

		leave: function(oncomplete, data) {

			_State.prototype.leave.call(this, oncomplete, data);

		}

	};


	return Class;

});

