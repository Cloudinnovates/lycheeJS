
lychee.define('app.entity.Midground').includes([
	'lychee.app.Sprite'
]).exports(function(lychee, global, attachments) {

	var _Sprite  = lychee.import('lychee.app.Sprite');
	var _TEXTURE = attachments["png"];
	var _CONFIG  = {
		states: { 'default': 0 },
		map:    { 'default': [{ x: 0, y: 0, w: 2048, h: 2048 }] }
	};



	/*
	 * IMPLEMENTATION
	 */

	var Class = function(data) {

		var settings = lychee.extend({}, data);


		settings.repeat  = false;
		settings.states  = _CONFIG.states;
		settings.texture = _TEXTURE;
		settings.map     = _CONFIG.map;
		settings.position = { x: 0, y: 0};


		_Sprite.call(this, settings);

		settings = null;

	};


	Class.prototype = {

		/*
		 * ENTITY API
		 */

		serialize: function() {

			var data = _Sprite.prototype.serialize.call(this);
			data['constructor'] = 'app.entity.Midground';


			return data;

		}

	};


	return Class;

});

