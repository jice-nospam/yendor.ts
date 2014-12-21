/// <reference path="../decl/jquery.d.ts" />
/// <reference path="../yendor/yendor.ts" />
var	root: Yendor.Console;

module Benchmark {
	"use strict";
	// these are the dimensions of the libtcod benchmark sample
	var WIDTH: number = 80;
	var HEIGHT: number = 60;
	var SAMPLE_SCREEN_WIDTH: number = 46;
	var SAMPLE_SCREEN_HEIGHT: number = 20;
	var SAMPLE_SCREEN_X: number = 20;
	var SAMPLE_SCREEN_Y: number = 10;
	var rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom();
	var framesPerSecond: number = 0;
	var currentFrameCount: number = 0;
	var fpsTimer: number = 0;

	function render() {
		for (var x = SAMPLE_SCREEN_X; x < SAMPLE_SCREEN_X + SAMPLE_SCREEN_WIDTH; x++ ) {
			for ( var y = SAMPLE_SCREEN_Y; y < SAMPLE_SCREEN_Y + SAMPLE_SCREEN_HEIGHT; y++ ) {
				var r = rng.getNumber(0, 255);
				var g = rng.getNumber(0, 255);
				var b = rng.getNumber(0, 255);
				var col = "rgb(" + r + "," + g + "," + b + ")";
				root.back[x][y] = col;
				r = rng.getNumber(0, 255);
				g = rng.getNumber(0, 255);
				b = rng.getNumber(0, 255);
				col = "rgb(" + r + "," + g + "," + b + ")";
				root.fore[x][y] = col;
				var ch = rng.getNumber(32, 128);
				root.setChar(x, y, String.fromCharCode(ch));
			}
		}
		root.print(1, 46, "fps : " + framesPerSecond);
	}

	function handleNewFrame(time: number) {
		currentFrameCount++;
		if ( fpsTimer === 0 ) {
			fpsTimer = time;
		} else if ( time - fpsTimer > 1000 ) {
			framesPerSecond = currentFrameCount;
			fpsTimer = time;
			currentFrameCount = 0;
		}
		render();
		root.render();
	}

	$(function() {
		Yendor.init();
		root = new Yendor.PixiConsole( WIDTH, HEIGHT, "#ffffff", "#000000", "#console", "terminal.png" );
		// root = new Yendor.DivConsole( WIDTH, HEIGHT, "#ffffff", "#000000", "#console" );
		Yendor.loop(handleNewFrame);
	});
}
