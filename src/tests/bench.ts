/// <reference path="../decl/jquery.d.ts" />
/// <reference path="../yendor/yendor.ts" />
var	root: Yendor.Console;

module Benchmark {

	// these are the dimensions of the libtcod benchmark sample
	var WIDTH: number = 80;
	var HEIGHT: number = 60;
	var rootDiv: HTMLElement;
	var rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom();
	var framesPerSecond: number = 0;
	var currentFrameCount: number = 0;
	var fpsTimer: number = 0;

	function render() {
		for (var x = 0; x < WIDTH; x++ ) {
			for ( var y = 0; y < HEIGHT; y++ ) {
				var r = rng.getNumber(0,255);
				var g = rng.getNumber(0,255);
				var b = rng.getNumber(0,255);
				var col = 'rgb(' + r + ',' + g + ',' + b + ')';
				root.back[x][y]=col;
				r = rng.getNumber(0,255);
				g = rng.getNumber(0,255);
				b = rng.getNumber(0,255);
				col = 'rgb(' + r + ',' + g + ',' + b + ')';
				root.fore[x][y]=col;
				var ch = rng.getNumber(32,128);
				root.setChar(x,y,String.fromCharCode(ch));
			}
		}
	}

	function handleNewFrame(time:number) {
		currentFrameCount++;
		if ( fpsTimer == 0 ) {
			fpsTimer = time;
		} else if ( time - fpsTimer > 1000 ) {
			framesPerSecond = currentFrameCount;
			fpsTimer = time;
			$('#fps')[0].innerHTML = framesPerSecond+' fps';
			currentFrameCount = 0;
		}
		render();
		root.render();
	}

	$(function(){
		root = Yendor.init( '#console', WIDTH, HEIGHT, '#000', '#fff' );
		$('body').append("<div id = 'fps'/>");
		Yendor.loop(handleNewFrame);
	});
}