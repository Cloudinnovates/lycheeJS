
lychee.define('lychee.ui.entity.Select').includes([
	'lychee.ui.Entity'
]).exports(function(lychee, global, attachments) {

	var _FONT = attachments["fnt"];



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(data) {

		var settings = lychee.extend({}, data);


		this.font    = _FONT;
		this.options = [];
		this.value   = '';

		this.__cursor = {
			active:   false,
			alpha:    0.0,
			duration: 600,
			start:    null,
			pingpong: false
		};
		this.__pulse  = {
			active:   false,
			duration: 300,
			start:    null,
			alpha:    0.0,
			previous: null
		};


		this.setFont(settings.font);
		this.setOptions(settings.options);
		this.setValue(settings.value);

		delete settings.font;
		delete settings.options;
		delete settings.value;


		settings.width  = typeof settings.width === 'number'  ? settings.width  : 128;
		settings.height = typeof settings.height === 'number' ? settings.height :  32;
		settings.shape  = lychee.ui.Entity.SHAPE.rectangle;


		lychee.ui.Entity.call(this, settings);


		if (this.options.length > 1) {
			this.height = this.options.length * settings.height;
		}

		if (this.value === '') {
			this.setValue(this.options[0] || null);
		}



		/*
		 * INITIALIZATION
		 */

		this.bind('touch', function(id, position, delta) {

			if (this.options.length === 0) return;


			var lh  = this.height / this.options.length;
			var pos = (position.y + this.height / 2);

			var q = (pos / lh) | 0;
			if (q >= 0) {

				var val    = this.options[q] || null;
				var result = this.setValue(val);
				if (result === true) {
					this.trigger('change', [ val ]);
				}

			}

		}, this);

		this.bind('key', function(key, name, delta) {

			if (this.options.length === 0) return;


			if (this.state === 'active') {

				var val = null;
				var q   = this.options.indexOf(this.value);

				if (key === 'w' || key === 'arrow-up')   val = this.options[q - 1] || null;
				if (key === 's' || key === 'arrow-down') val = this.options[q + 1] || null;


				if (key === 'space') val = this.options[0];
				if (key === 'enter') val = this.options[this.options.length - 1];


				var result = this.setValue(val);
				if (result === true) {
					this.trigger('change', [ val ]);
				}

			}

		}, this);

		this.bind('focus', function() {
			this.setState('active');
		}, this);

		this.bind('blur', function() {
			this.setState('default');
		}, this);


		settings = null;

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		deserialize: function(blob) {

			var font = lychee.deserialize(blob.font);
			if (font !== null) {
				this.setFont(font);
			}

		},

		serialize: function() {

			var data = lychee.ui.Entity.prototype.serialize.call(this);
			data['constructor'] = 'lychee.ui.entity.Select';

			var settings = data['arguments'][0];
			var blob     = (data['blob'] || {});


			if (this.options.length !== 0) settings.options = [].slice.call(this.options, 0);
			if (this.value !== '')         settings.value   = this.value;


			if (this.font !== null) blob.font = lychee.serialize(this.font);


			data['blob'] = Object.keys(blob).length > 0 ? blob : null;


			return data;

		},

		update: function(clock, delta) {

			var pulse = this.__pulse;
			if (pulse.active === true) {

				if (pulse.start === null) {
					pulse.start = clock;
				}

				var pt = (clock - pulse.start) / pulse.duration;
				if (pt <= 1) {
					pulse.alpha = (1 - pt);
				} else {
					pulse.alpha    = 0.0;
					pulse.active   = false;
					pulse.previous = null;
				}

			}


			var cursor = this.__cursor;
			if (cursor.active === true) {

				if (cursor.start === null) {
					cursor.start = clock;
				}


				var ct = (clock - cursor.start) / cursor.duration;
				if (ct <= 1) {
					cursor.alpha = cursor.pingpong === true ? (1 - ct) : ct;
				} else {
					cursor.start    = clock;
					cursor.pingpong = !cursor.pingpong;
				}

			}


			lychee.ui.Entity.prototype.update.call(this, clock, delta);

		},

		render: function(renderer, offsetX, offsetY) {

			if (this.visible === false) return;


			var alpha    = this.alpha;
			var position = this.position;
			var cursor   = this.__cursor;
			var pulse    = this.__pulse;
			var font     = this.font;
			var value    = this.value;
			var x        = position.x + offsetX;
			var y        = position.y + offsetY;
			var hwidth   = this.width  / 2;
			var hheight  = this.height / 2;


			if (alpha !== 1) {
				renderer.setAlpha(alpha);
			}


			var x1 = x - hwidth;
			var lh = this.height / this.options.length;

			for (var o = 0, ol = this.options.length; o < ol; o++) {

				var option = this.options[o];
				var y1     = y - hheight + o * lh;


				if (pulse.active === true) {

					if (option === value) {

						renderer.drawCircle(
							x1 + 16,
							y1 + 16,
							11,
							'#32afe5',
							false,
							2
						);

						renderer.setAlpha(pulse.alpha);

						renderer.drawCircle(
							x1 + 16,
							y1 + 16,
							12,
							'#32afe5',
							true
						);

						renderer.setAlpha(alpha);

					} else if (option === pulse.previous) {

						renderer.drawCircle(
							x1 + 16,
							y1 + 16,
							11,
							'#545454',
							false,
							2
						);

						renderer.setAlpha(pulse.alpha);

						renderer.drawCircle(
							x1 + 16,
							y1 + 16,
							11,
							'#32afe5',
							false,
							2
						);

						renderer.setAlpha(alpha);

					} else {

						renderer.drawCircle(
							x1 + 16,
							y1 + 16,
							11,
							'#545454',
							false,
							2
						);

					}

				} else {

					if (option === value) {

						renderer.drawCircle(
							x1 + 16,
							y1 + 16,
							11,
							'#32afe5',
							false,
							2
						);


						if (cursor.active === true) {

							renderer.setAlpha(cursor.alpha);

							renderer.drawCircle(
								x1 + 16,
								y1 + 16,
								12,
								'#32afe5',
								true
							);

							renderer.setAlpha(alpha);

						}

					} else {

						renderer.drawCircle(
							x1 + 16,
							y1 + 16,
							11,
							'#545454',
							false,
							2
						);

					}

				}


				renderer.drawText(
					x1 + 36,
					y1 + (font.lineheight / 2),
					option,
					font,
					false
				);

			}


			if (alpha !== 1) {
				renderer.setAlpha(1.0);
			}

		},



		/*
		 * CUSTOM API
		 */

		setFont: function(font) {

			font = font instanceof Font ? font : null;


			if (font !== null) {

				this.font = font;

				return true;

			}


			return false;

		},

		setOptions: function(options) {

			options = options instanceof Array ? options.unique() : null;


			if (options !== null) {

				this.height  = (this.height / this.options.length) * options.length;
				this.options = options.map(function(option) {
					return '' + option;
				});


				if (this.options.indexOf(this.value) === -1) {
					this.setValue(this.options[0] || null);
				}


				return true;

			}


			return false;

		},

		setState: function(id) {

			var result = lychee.ui.Entity.prototype.setState.call(this, id);
			if (result === true) {

				var cursor = this.__cursor;
				var pulse  = this.__pulse;


				if (id === 'active') {

					cursor.start  = null;
					cursor.active = true;

					pulse.alpha   = 1.0;
					pulse.start   = null;
					pulse.active  = true;

				} else {

					cursor.active = false;

				}


				return true;

			}


			return false;

		},

		setValue: function(value) {

			value = typeof value === 'string' ? value : null;


			if (value !== null) {

				if (this.options.indexOf(value) !== -1) {

					var pulse = this.__pulse;

					pulse.alpha    = 1.0;
					pulse.start    = null;
					pulse.active   = true;
					pulse.previous = this.value;


					this.value = value;

					return true;

				}

			}


			return false;

		}

	};


	return Class;

});

