
(function(lychee, global) {

	var _fs       = require('fs');
	var _filename = null;



	/*
	 * FEATURE DETECTION
	 */

	(function(process, selfpath) {

		var cwd  = typeof process.cwd === 'function' ? process.cwd() : '';
		var tmp1 = selfpath.indexOf('/libraries/lychee');

		if (tmp1 !== -1) {
			lychee.ROOT.lychee = selfpath.substr(0, tmp1);
		}

		if (cwd !== '') {
			lychee.ROOT.project = cwd;
		}

	})(global.process || {}, typeof __filename === 'string' ? __filename : '');



	/*
	 * HELPERS
	 */

	var _load_asset = function(settings, callback, scope) {

		var path     = lychee.environment.resolve(settings.url);
		var encoding = settings.encoding === 'binary' ? 'binary': 'utf8';


		_fs.readFile(path, encoding, function(error, buffer) {

			var raw = null;
			if (!error) {
				raw = buffer;
			}

			try {
				callback.call(scope, raw);
			} catch(err) {
				lychee.Debugger.report(lychee.environment, err, null);
			}

		});

	};



	/*
	 * POLYFILLS
	 */

	var _log   = console.log   || function() {};
	var _info  = console.info  || console.log;
	var _warn  = console.warn  || console.log;
	var _error = console.error || console.log;


	console.log = function() {

		var al   = arguments.length;
		var args = new Array(al);
		for (var a = 0; a < al; a++) {
			args[a] = arguments[a];
		}

		args.reverse();
		args.push(' ');
		args.reverse();
		args.push(' ');

		_log.apply(console, args);

	};

	console.info = function() {

		var al   = arguments.length;
		var args = new Array(al);
		for (var a = 0; a < al; a++) {
			args[a] = arguments[a];
		}

		args.reverse();
		args.push('\u001b[37m');
		args.push('\u001b[42m');
		args.reverse();
		args.push('\u001b[49m');
		args.push('\u001b[39m');

		_info.apply(console, args);

	};

	console.warn = function() {

		var al   = arguments.length;
		var args = new Array(al);
		for (var a = 0; a < al; a++) {
			args[a] = arguments[a];
		}

		args.reverse();
		args.push('\u001b[37m');
		args.push('\u001b[43m');
		args.reverse();
		args.push('\u001b[49m');
		args.push('\u001b[39m');

		_warn.apply(console, args);

	};

	console.error = function() {

		var al   = arguments.length;
		var args = new Array(al);
		for (var a = 0; a < al; a++) {
			args[a] = arguments[a];
		}

		args.reverse();
		args.push('\u001b[37m');
		args.push('\u001b[41m');
		args.reverse();
		args.push('\u001b[49m');
		args.push('\u001b[39m');

		_error.apply(console, args);

	};



	/*
	 * FEATURE DETECTION
	 */

	var _codecs = {
		aac: true,
		ogg: true,
		mp3: true
	};

	(function() {

		var consol = 'console' in global;
		var audio  = false;
		var buffer = true;
		var image  = false;


		if (lychee.debug === true) {

			var methods = [];

			if (consol)  methods.push('console');
			if (audio)   methods.push('Audio');
			if (buffer)  methods.push('Buffer');
			if (image)   methods.push('Image');

			if (methods.length === 0) {
				console.error('bootstrap.js: Supported methods are NONE');
			} else {
				console.info('bootstrap.js: Supported methods are ' + methods.join(', '));
			}

		}

	})();



	/*
	 * BUFFER IMPLEMENTATION
	 */

	Buffer.prototype.serialize = function() {

		return {
			'constructor': 'Buffer',
			'arguments':   [ this.toString('base64'), 'base64' ]
		};

	};

	Buffer.prototype.map = function(callback) {

		callback = callback instanceof Function ? callback : function(value) { return value; };


		var clone = new Buffer(this.length);

		for (var b = 0; b < this.length; b++) {
			clone[b] = callback(this[b], b);
		}

		return clone;

	};




	/*
	 * CONFIG IMPLEMENTATION
	 */

	var _config_cache = {};


	var _clone_config = function(origin, clone) {

		if (origin.buffer !== null) {

			clone.buffer = JSON.parse(JSON.stringify(origin.buffer));

			clone.__load = false;

		}

	};


	var Config = function(url) {

		url = typeof url === 'string' ? url : null;


		this.url    = url;
		this.onload = null;
		this.buffer = null;

		this.__load = true;


		if (url !== null) {

			if (_config_cache[url] !== undefined) {
				_clone_config(_config_cache[url], this);
			} else {
				_config_cache[url] = this;
			}

		}

	};


	Config.prototype = {

		deserialize: function(blob) {

			if (typeof blob.buffer === 'string') {
				this.buffer = JSON.parse(new Buffer(blob.buffer.substr(29), 'base64').toString('utf8'));
				this.__load = false;
			}

		},

		serialize: function() {

			var blob = {};


			if (this.buffer !== null) {
				blob.buffer = 'data:application/json;base64,' + new Buffer(JSON.stringify(this.buffer), 'utf8').toString('base64');
			}


			return {
				'constructor': 'Config',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

				return;

			}


			_load_asset({
				url:      this.url,
				encoding: 'utf8'
			}, function(raw) {

				var data = null;
				try {
					data = JSON.parse(raw);
				} catch(e) {
				}


				this.buffer = data;


				if (data !== null) {

				} else {

					if (lychee.debug === true) {
						console.error('bootstrap.js: Config at ' + this.url + ' is invalid (No JSON file)');
					}

				}


				if (this.onload instanceof Function) {
					this.onload(data !== null);
					this.onload = null;
				}

			}, this);

		}

	};



	/*
	 * FONT IMPLEMENTATION
	 */

	var _parse_font = function() {

		var data = this.__buffer;

		if (typeof data.kerning === 'number' && typeof data.spacing === 'number') {

			if (data.kerning > data.spacing) {
				data.kerning = data.spacing;
			}

		}


		if (data.texture !== undefined) {
			this.texture = new Texture(data.texture);
			this.texture.load();
		}


		this.baseline   = typeof data.baseline === 'number'    ? data.baseline   : this.baseline;
		this.charset    = typeof data.charset === 'string'     ? data.charset    : this.charset;
		this.spacing    = typeof data.spacing === 'number'     ? data.spacing    : this.spacing;
		this.kerning    = typeof data.kerning === 'number'     ? data.kerning    : this.kerning;
		this.lineheight = typeof data.lineheight === 'number'  ? data.lineheight : this.lineheight;


		if (data.map instanceof Array) {

			var offset = this.spacing;

			for (var c = 0, cl = this.charset.length; c < cl; c++) {

				var id = this.charset[c];

				var chr = {
					width:      data.map[c] + this.spacing * 2,
					height:     this.lineheight,
					realwidth:  data.map[c],
					realheight: this.lineheight,
					x:          offset - this.spacing,
					y:          0
				};

				offset += chr.width;


				this.__charset[id] = chr;

			}

		}


		if (this.texture === null) {

			if (lychee.debug === true) {
				console.error('bootstrap.js: Font at "' + this.url + '" is invalid (No FNT file)');
			}

		}

	};


	var _font_cache = {};


	var _clone_font = function(origin, clone) {

		if (origin.__buffer !== null) {

			clone.__buffer = origin.__buffer;
			clone.__load   = false;

			_parse_font.call(clone);

		}

	};


	var Font = function(url) {

		url = typeof url === 'string' ? url : null;


		this.url        = url;
		this.onload     = null;
		this.texture    = null;

		this.baseline   = 0;
		this.charset    = ' !"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~';
		this.spacing    = 0;
		this.kerning    = 0;
		this.lineheight = 1;

		this.__buffer   = null;
		this.__load     = true;

		this.__charset     = {};
		this.__charset[''] = {
			width:      0,
			height:     this.lineheight,
			realwidth:  0,
			realheight: this.lineheight,
			x:          0,
			y:          0
		};


		if (url !== null) {

			if (_font_cache[url] !== undefined) {
				_clone_font(_font_cache[url], this);
			} else {
				_font_cache[url] = this;
			}

		}

	};


	Font.prototype = {

		deserialize: function(blob) {

			if (typeof blob.buffer === 'string') {
				this.__buffer = JSON.parse(new Buffer(blob.buffer.substr(29), 'base64').toString('utf8'));
				this.__load   = false;
				_parse_font.call(this);
			}

		},

		serialize: function() {

			var blob = {};


			if (this.__buffer !== null) {
				blob.buffer = 'data:application/json;base64,' + new Buffer(JSON.stringify(this.__buffer), 'utf8').toString('base64');
			}


			return {
				'constructor': 'Font',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		measure: function(text) {

			text = typeof text === 'string' ? text : null;


			if (text !== null) {

				if (text.length === 1) {

					if (this.__charset[text] !== undefined) {
						return this.__charset[text];
					}

				} else if (text.length > 1) {

					var data = this.__charset[text] || null;
					if (data === null) {

						var width = 0;

						for (var t = 0, tl = text.length; t < tl; t++) {
							var chr = this.measure(text[t]);
							width  += chr.realwidth + this.kerning;
						}


						// TODO: Embedded Font ligatures will set x and y values based on settings.map

						data = this.__charset[text] = {
							width:      width,
							height:     this.lineheight,
							realwidth:  width,
							realheight: this.lineheight,
							x:          0,
							y:          0
						};

					}


					return data;

				}

			}


			return this.__charset[''];

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

				return;

			}


			_load_asset({
				url:      this.url,
				encoding: 'utf8'
			}, function(raw) {

				var data = null;
				try {
					data = JSON.parse(raw);
				} catch(e) {
				}


				if (data !== null) {

					this.__buffer = data;
					this.__load   = false;

					_parse_font.call(this);

				}


				if (this.onload instanceof Function) {
					this.onload(data !== null);
					this.onload = null;
				}

			}, this);

		}

	};



	/*
	 * MUSIC IMPLEMENTATION
	 */

	var _music_cache = {};


	var _clone_music = function(origin, clone) {

		if (origin.__buffer.ogg !== null || origin.__buffer.mp3 !== null) {

			clone.__buffer.ogg = origin.__buffer.ogg;
			clone.__buffer.mp3 = origin.__buffer.mp3;
			clone.__load       = false;

		}

	};


	var Music = function(url) {

		url = typeof url === 'string' ? url : null;


		this.url      = url;
		this.onload   = null;
		this.buffer   = null;
		this.volume   = 0.0;
		this.isIdle   = true;

		this.__buffer = { ogg: null, mp3: null };
		this.__load   = true;


		if (url !== null) {

			if (_music_cache[url] !== undefined) {
				_clone_music(_music_cache[url], this);
			} else {
				_music_cache[url] = this;
			}

		}

	};


	Music.prototype = {

		deserialize: function(blob) {

			if (blob.buffer instanceof Object) {

				if (typeof blob.buffer.ogg === 'string') {
					this.__buffer.ogg = new Buffer(blob.buffer.substr(28), 'base64');
				}

				if (typeof blob.buffer.mp3 === 'string') {
					this.__buffer.mp3 = new Buffer(blob.buffer.substr(22), 'base64');
				}


				this.__load = false;

			}

		},

		serialize: function() {

			var blob = {};


			if (this.__buffer.ogg !== null || this.__buffer.mp3 !== null) {

				blob.buffer = {};

				if (this.__buffer.ogg !== null) {
					blob.buffer.ogg = 'data:application/ogg;base64,' + new Buffer(this.__buffer.ogg, 'binary').toString('base64');
				}

				if (this.__buffer.mp3 !== null) {
					blob.buffer.mp3 = 'data:audio/mp3;base64,' + new Buffer(this.__buffer.mp3, 'binary').toString('base64');
				}

			}


			return {
				'constructor': 'Music',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

				return;

			}


			_load_asset({
				url:      this.url + '.ogg',
				encoding: 'binary'
			}, function(rawogg) {

				_load_asset({
					url:      this.url + '.mp3',
					encoding: 'binary'
				}, function(rawmp3) {

					if (rawogg !== null) {
						this.__buffer.ogg = new Buffer(rawogg, 'binary');
					}

					if (rawmp3 !== null) {
						this.__buffer.mp3 = new Buffer(rawmp3, 'binary');
					}


					this.__load = false;


					if (this.onload instanceof Function) {
						this.onload(rawogg !== null || rawmp3 !== null);
						this.onload = null;
					}

				}, this);

			}, this);

		},

		clone: function() {
			return new Music(this.url);
		},

		play: function() {
			this.isIdle = false;
		},

		pause: function() {
			this.isIdle = true;
		},

		resume: function() {
			this.isIdle = false;
		},

		stop: function() {
			this.isIdle = true;
		},

		setVolume: function(volume) {

			volume = typeof volume === 'number' ? volume : null;


			return false;

		}

	};



	/*
	 * SOUND IMPLEMENTATION
	 */

	var _sound_cache = {};


	var _clone_sound = function(origin, clone) {

		if (origin.__buffer.ogg !== null || origin.__buffer.mp3 !== null) {

			clone.__buffer.ogg = origin.__buffer.ogg;
			clone.__buffer.mp3 = origin.__buffer.mp3;
			clone.__load       = false;

		}

	};


	var Sound = function(url) {

		url = typeof url === 'string' ? url : null;


		this.url      = url;
		this.onload   = null;
		this.buffer   = null;
		this.volume   = 0.0;
		this.isIdle   = true;

		this.__buffer = { ogg: null, mp3: null };
		this.__load   = true;


		if (url !== null) {

			if (_sound_cache[url] !== undefined) {
				_clone_sound(_sound_cache[url], this);
			} else {
				_sound_cache[url] = this;
			}

		}

	};


	Sound.prototype = {

		deserialize: function(blob) {

			if (blob.buffer instanceof Object) {

				if (typeof blob.buffer.ogg === 'string') {
					this.__buffer.ogg = new Buffer(blob.buffer.substr(28), 'base64');
				}

				if (typeof blob.buffer.mp3 === 'string') {
					this.__buffer.mp3 = new Buffer(blob.buffer.substr(22), 'base64');
				}


				this.__load = false;

			}

		},

		serialize: function() {

			var blob = {};


			if (this.__buffer.ogg !== null || this.__buffer.mp3 !== null) {

				blob.buffer = {};

				if (this.__buffer.ogg !== null) {
					blob.buffer.ogg = 'data:application/ogg;base64,' + new Buffer(this.__buffer.ogg, 'binary').toString('base64');
				}

				if (this.__buffer.mp3 !== null) {
					blob.buffer.mp3 = 'data:audio/mp3;base64,' + new Buffer(this.__buffer.mp3, 'binary').toString('base64');
				}

			}


			return {
				'constructor': 'Sound',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

				return;

			}


			_load_asset({
				url:      this.url + '.ogg',
				encoding: 'binary'
			}, function(rawogg) {

				_load_asset({
					url:      this.url + '.mp3',
					encoding: 'binary'
				}, function(rawmp3) {

					if (rawogg !== null) {
						this.__buffer.ogg = new Buffer(rawogg, 'binary');
					}

					if (rawmp3 !== null) {
						this.__buffer.mp3 = new Buffer(rawmp3, 'binary');
					}


					this.__load = false;


					if (this.onload instanceof Function) {
						this.onload(rawogg !== null || rawmp3 !== null);
						this.onload = null;
					}

				}, this);

			}, this);

		},

		clone: function() {
			return new Sound(this.url);
		},

		play: function() {
			this.isIdle = false;
		},

		pause: function() {
			this.isIdle = true;
		},

		resume: function() {
			this.isIdle = false;
		},

		stop: function() {
			this.isIdle = true;
		},

		setVolume: function(volume) {

			volume = typeof volume === 'number' ? volume : null;


			return false;

		}

	};



	/*
	 * TEXTURE IMPLEMENTATION
	 */

	var _texture_id    = 0;
	var _texture_cache = {};

	var _parse_texture = function(data) {

		this.width  = (data[0] << 24) | (data[1] << 16) | (data[2] << 8) | data[3];
		this.height = (data[4] << 24) | (data[5] << 16) | (data[6] << 8) | data[7];

	};


	var _clone_texture = function(origin, clone) {

		if (origin.buffer !== null) {

			clone.id     = origin.id;

			clone.buffer = origin.buffer;
			clone.width  = origin.width;
			clone.height = origin.height;

			clone.__load = false;

		}

	};


	var Texture = function(url) {

		url = typeof url === 'string' ? url : null;


		this.id     = _texture_id++;
		this.url    = url;
		this.onload = null;
		this.buffer = null;
		this.width  = 0;
		this.height = 0;

		this.__load = true;


		if (url !== null && url.substr(0, 10) !== 'data:image') {

			if (_texture_cache[url] !== undefined) {
				_clone_texture(_texture_cache[url], this);
			} else {
				_texture_cache[url] = this;
			}

		}

	};


	Texture.prototype = {

		deserialize: function(blob) {

			if (typeof blob.buffer === 'string') {
				this.buffer = new Buffer(blob.buffer.substr(22), 'base64');
				this.__load = false;
			}

		},

		serialize: function() {

			var blob = {};


			if (this.buffer !== null) {
				blob.buffer = 'data:image/png;base64,' + this.buffer.toString('base64');
			}


			return {
				'constructor': 'Texture',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

				return;

			}


			var url = this.url;
			if (url.substr(0, 5) === 'data:') {

				if (url.substr(0, 15) === 'data:image/png;') {

					var b64data = url.substr(15, url.length - 15);
					this.buffer = new Buffer(b64data, 'base64');
					this.__load = false;

					_parse_texture.call(this, this.buffer.slice(16, 24));


					var is_power_of_two = (this.width & (this.width - 1)) === 0 && (this.height & (this.height - 1)) === 0;
					if (lychee.debug === true && is_power_of_two === false) {
						console.warn('bootstrap.js: Texture at data:image/png; is NOT power-of-two');
					}

				} else {

					if (lychee.debug === true) {
						console.error('bootstrap.js: Texture at "' + url.substr(0, 15) + '" is invalid (no PNG file)');
					}

				}


				if (this.onload instanceof Function) {
					this.onload(this.buffer !== null);
					this.onload = null;
				}

			} else {

				if (url.split('.').pop() === 'png') {

					_load_asset({
						url:      url,
						encoding: 'binary'
					}, function(raw) {

						if (raw !== null) {

							this.buffer = new Buffer(raw, 'binary');
							this.__load = false;

							_parse_texture.call(this, this.buffer.slice(16, 24));

						}


  						var is_power_of_two = (this.width & (this.width - 1)) === 0 && (this.height & (this.height - 1)) === 0;
						if (lychee.debug === true && is_power_of_two === false) {
							console.warn('bootstrap.js: Texture at ' + this.url + ' is NOT power-of-two');
						}


						if (this.onload instanceof Function) {
							this.onload(raw !== null);
							this.onload = null;
						}

					}, this);

				} else {

					if (lychee.debug === true) {
						console.error('bootstrap.js: Texture at "' + this.url + '" is invalid (no PNG file)');
					}


					if (this.onload instanceof Function) {
						this.onload(false);
						this.onload = null;
					}

				}

			}

		}

	};



	/*
	 * PRELOADER IMPLEMENTATION
	 */

	var _stuff_cache = {};


	var _clone_stuff = function(origin, clone) {

		if (origin.buffer !== null) {

			clone.buffer = origin.buffer;

			clone.__load = false;

		}

	};


	var Stuff = function(url, ignore) {

		url    = typeof url === 'string' ? url : null;
		ignore = ignore === true;


		this.url      = url;
		this.onload   = null;
		this.buffer   = null;

		this.__ignore = ignore;
		this.__load   = true;


		if (url !== null) {

			if (_stuff_cache[url] !== undefined) {
				_clone_stuff(_stuff_cache[url], this);
			} else {
				_stuff_cache[url] = this;
			}

		}

	};


	Stuff.prototype = {

		deserialize: function(blob) {

			if (typeof blob.buffer === 'string') {
				this.buffer = new Buffer(blob.buffer.substr(blob.buffer.indexOf(',') + 1), 'base64').toString('utf8');
				this.__load = false;
			}

		},

		serialize: function() {

			var blob = {};
			var type = this.url.split('/').pop().split('.').pop();
			var mime = 'application/octet-stream';


			if (type === 'js') {
				mime = 'application/javascript';
			}


			if (this.buffer !== null) {
				blob.buffer = 'data:' + mime + ';base64,' + new Buffer(this.buffer, 'utf8').toString('base64');
			}


			return {
				'constructor': 'Stuff',
				'arguments':   [ this.url ],
				'blob':        Object.keys(blob).length > 0 ? blob : null
			};

		},

		load: function() {

			if (this.__load === false) {

				if (this.onload instanceof Function) {
					this.onload(true);
					this.onload = null;
				}

				return;

			}


			var that = this;
			var type = this.url.split('/').pop().split('.').pop();
			if (type === 'js' && this.__ignore === false) {

				_load_asset({
					url:      this.url,
					encoding: 'utf8'
				}, function(raw) {

					if (raw !== null) {
						that.buffer = raw.toString('utf8');
					} else {
						that.buffer = '';
					}


					_filename = that.url;

					var cid = lychee.environment.resolve(that.url);
					if (require.cache[cid] !== undefined) {
						delete require.cache[cid];
					}

					require(cid);
					_filename = null;


					if (that.onload instanceof Function) {
						that.onload(raw !== null);
						that.onload = null;
					}

				});

			} else {

				_load_asset({
					url:      this.url,
					encoding: 'utf8'
				}, function(raw) {

					if (raw !== null) {
						that.buffer = raw.toString('utf8');
					} else {
						that.buffer = '';
					}


					if (that.onload instanceof Function) {
						that.onload(raw !== null);
						that.onload = null;
					}

				});

			}

		}

	};



	/*
	 * EXPORTS
	 */

	// global.Buffer  = Buffer; // Not necessary, NODE data type
	global.Config  = Config;
	global.Font    = Font;
	global.Music   = Music;
	global.Sound   = Sound;
	global.Texture = Texture;
	global.Stuff   = Stuff;


	global.require = require;

	Object.defineProperty(lychee.Environment, '__FILENAME', {

		get: function() {

			if (_filename !== null) {
				return _filename;
			}

			return null;

		},

		set: function() {
			return false;
		}

	});



	module.exports = function(root) {

// TODO: Bind to process.stdin and pare keyboard input


		if (typeof root === 'string') {
			lychee.ROOT.project = root;
		}


		return lychee;

	};

})(lychee, global);

