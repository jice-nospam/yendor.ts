/// <reference path="../decl/jquery.d.ts" />
/// <reference path="../yendor/yendor.ts" />
/// <reference path="base.ts" />
/// <reference path="eventbus.ts" />
/// <reference path="actor.ts" />
/// <reference path="item.ts" />
/// <reference path="creature.ts" />
/// <reference path="map.ts" />
/// <reference path="gui.ts" />
/// <reference path="engine.ts" />
module Game {
	"use strict";
	/*
		This function is called when the document has finished loading in the browser.
		It creates the root console, register the keyboard and mouse event callbacks, and starts the frame rendering loop.
	*/
	$(function() {
		try {
			Yendor.init();
			var engine = Engine.instance;
			$(document).keydown(engine.handleKeypress.bind(engine));
			$(document).mousemove(engine.handleMouseMove.bind(engine));
			$(document).click(engine.handleMouseClick.bind(engine));
			Yendor.loop(engine.handleNewFrame.bind(engine));
		} catch (e) {
			console.log("ERROR in " + e.fileName + ":" + e.lineNumber + " : " + e.message);
			console.log(e.stack);
		}
	});
}
