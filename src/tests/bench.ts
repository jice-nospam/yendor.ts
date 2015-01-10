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

	interface Sample {
		name: string;
		render(root: Yendor.Console);
		onKeyDown(event: KeyboardEvent);
	}

	var samples: Sample[] = [];
	var currentSampleIndex: number = 0;

	class PerfSample implements Sample {
		name: string = "True color";
		static hexa: string = "0123456789ABCDEF";
		render(root: Yendor.Console) {
			for (var x = SAMPLE_SCREEN_X; x < SAMPLE_SCREEN_X + SAMPLE_SCREEN_WIDTH; x++ ) {
				for ( var y = SAMPLE_SCREEN_Y; y < SAMPLE_SCREEN_Y + SAMPLE_SCREEN_HEIGHT; y++ ) {
					var r = PerfSample.hexa[rng.getNumber(0, 15)] + PerfSample.hexa[rng.getNumber(0, 15)];
					var g = PerfSample.hexa[rng.getNumber(0, 15)] + PerfSample.hexa[rng.getNumber(0, 15)];
					var b = PerfSample.hexa[rng.getNumber(0, 15)] + PerfSample.hexa[rng.getNumber(0, 15)];
					var col = "#" + r + g + b;
					root.back[x][y] = col;
					r = PerfSample.hexa[rng.getNumber(0, 15)] + PerfSample.hexa[rng.getNumber(0, 15)];
					g = PerfSample.hexa[rng.getNumber(0, 15)] + PerfSample.hexa[rng.getNumber(0, 15)];
					b = PerfSample.hexa[rng.getNumber(0, 15)] + PerfSample.hexa[rng.getNumber(0, 15)];
					col = "#" + r + g + b;
					root.fore[x][y] = col;
					var ch = rng.getNumber(32, 128);
					root.setChar(x, y, String.fromCharCode(ch));
				}
			}
		}
		onKeyDown(event: KeyboardEvent) {}
	}

	class AStarSample implements Sample {
		name: string = "Path finding";
		private pathFinder: Yendor.PathFinder;
		private from: Yendor.Position = new Yendor.Position( 19, 10 );
		private to: Yendor.Position = new Yendor.Position(0, 0);
		private static DARK_WALL: Yendor.Color = "#000064";
		private static LIGHT_WALL: Yendor.Color = "#826E32";
		private static DARK_GROUND: Yendor.Color = "#323296";
		private map: string[] = ["##############################################",
								"#######################      #################",
								"#####################    #     ###############",
								"######################  ###        ###########",
								"##################      #####             ####",
								"################       ########    ###### ####",
								"###############      #################### ####",
								"################    ######                  ##",
								"########   #######  ######   #     #     #  ##",
								"########   ######      ###                  ##",
								"########                                    ##",
								"####       ######      ###   #     #     #  ##",
								"#### ###   ########## ####                  ##",
								"#### ###   ##########   ###########=##########",
								"#### ##################   #####          #####",
								"#### ###             #### #####          #####",
								"####           #     ####                #####",
								"########       #     #### #####          #####",
								"########       #####      ####################",
								"##############################################"];
		constructor() {
			var thisMap: string[] = this.map;
			this.pathFinder = new Yendor.PathFinder(SAMPLE_SCREEN_WIDTH, SAMPLE_SCREEN_HEIGHT,
				function(from: Yendor.Position, to: Yendor.Position): number {
					return thisMap[to.y][to.x] === "#" ? 0 : 1;
				});
		}
		private setNewDestination() {
			this.to.x ++;
			if ( this.to.x === SAMPLE_SCREEN_WIDTH ) {
				this.to.x = 0;
				this.to.y++;
				if ( this.to.y === SAMPLE_SCREEN_HEIGHT ) {
					this.to.y = 0;
				}
			}
		}
		private drawMap(root: Yendor.Console) {
			for ( var y: number = 0; y < SAMPLE_SCREEN_HEIGHT; ++y) {
				for ( var x: number = 0; x < SAMPLE_SCREEN_WIDTH; ++x) {
					root.back[SAMPLE_SCREEN_X + x][SAMPLE_SCREEN_Y + y] =
						this.map[y][x] === "#" ? AStarSample.DARK_WALL : AStarSample.DARK_GROUND;
				}
			}
		}
		private isDestinationWalkable(): boolean {
			return this.map[this.to.y][this.to.x] === " ";
		}
		render(root: Yendor.Console) {
			do {
				this.setNewDestination();
			} while (! this.isDestinationWalkable());
			this.drawMap(root);
			var path: Yendor.Position[] = this.pathFinder.getPath(this.from, this.to);
			if ( path ) {
				var pos: Yendor.Position = path.pop();
				while ( pos ) {
					root.back[SAMPLE_SCREEN_X + pos.x][SAMPLE_SCREEN_Y + pos.y] = AStarSample.LIGHT_WALL;
					pos = path.pop();
				}
			}
		}
		onKeyDown(event: KeyboardEvent) {}
	}

	class ScheduledEntity implements Yendor.TimedEntity {
		waitTime: number = 0;
		turnLength: number;
		position: number = 0;
		char: string = "r";
		constructor(turnLength: number) {
			this.turnLength = turnLength;
		}
		update() {
			this.position ++;
			if ( this.position === SAMPLE_SCREEN_WIDTH ) {
				this.position = 0;
			}
			this.waitTime += this.turnLength;
		}
	}

	class PlayerEntity extends ScheduledEntity {
		move: boolean = false;
		constructor(turnLength : number) {
			super(turnLength);
			this.char = "@";
		}
		update() {
			if (this.move) {
				super.update();
				this.move = false;
			} else {
				this.waitTime += this.turnLength;
			}
		}
	}
	class AbstractSchedulerSample implements Sample {
		name: string;
		protected scheduler: Yendor.Scheduler = new Yendor.Scheduler();
		protected entities: ScheduledEntity[] = [];
		protected player: PlayerEntity;
		protected init() {
			this.entities.push( new ScheduledEntity(5) );
			this.entities.push( new ScheduledEntity(6) );
			this.entities.push( new ScheduledEntity(4) );
			this.entities.push( new ScheduledEntity(50) );
			this.entities.push( this.player );
			this.scheduler.addAll(this.entities);
		}
		render(root: Yendor.Console) {
			var y: number = 2;
			root.clearText();
			root.print(SAMPLE_SCREEN_X, SAMPLE_SCREEN_Y + 15, "Press any key to move");
			this.entities.forEach((entity: ScheduledEntity) => {
				root.setChar(SAMPLE_SCREEN_X + entity.position, SAMPLE_SCREEN_Y + y, entity.char);
				y += 2;
			});
			this.scheduler.run();
		}
		onKeyDown(event: KeyboardEvent) {}
	}

	class RealTimeSchedulerSample extends AbstractSchedulerSample {
		constructor() {
			super();
			this.name = "Scheduler (real time)";
			this.player = new PlayerEntity(1);
			this.init();
		}
		onKeyDown(event: KeyboardEvent) {
			this.player.move = true;
		}
	}

	class TurnByTurnPlayerEntity extends PlayerEntity {
		scheduler : Yendor.Scheduler;
		constructor(scheduler: Yendor.Scheduler) {
			super(5);
			this.scheduler = scheduler;
		}
		update() {
			if ( this.move ) {
				super.update();
			} else {
				// pause the scheduler to wait for a keypress
				this.scheduler.pause();
			}
		}
	}

	class TurnByTurnSchedulerSample extends AbstractSchedulerSample {
		constructor() {
			super();
			this.name = "Scheduler (turn by turn)";
			this.player = new TurnByTurnPlayerEntity(this.scheduler);
			this.init();
		}
		onKeyDown(event: KeyboardEvent) {
			this.player.move = true;
			this.scheduler.resume();
		}
	}

	function render() {
		samples[currentSampleIndex].render(root);
		for (var i: number = 0; i < samples.length; ++i) {
			var sample: Sample = samples[i];
			root.print(1, 40 + i, sample.name);
			if ( i === currentSampleIndex ) {
				root.clearBack("#323296", 1, 40 + i, 20, 1);
				root.clearFore("#FFFFFF", 1, 40 + i, 20, 1);
			} else {
				root.clearBack("#000000", 1, 40 + i, 20, 1);
				root.clearFore("#D0D0D0", 1, 40 + i, 20, 1);
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
		root = Yendor.createConsole( WIDTH, HEIGHT, "#ffffff", "#000000", "#console", "terminal.png" );
		samples.push(new PerfSample());
		samples.push(new AStarSample());
		samples.push(new RealTimeSchedulerSample());
		samples.push(new TurnByTurnSchedulerSample());
		$(document).keydown(function(event: KeyboardEvent) {
			if ( event.keyCode === 40 ) {
				// DOWN
				root.clearText();
				root.clearBack("#000000");
				root.clearFore("#FFFFFF");
				currentSampleIndex ++;
				if (currentSampleIndex >= samples.length ) {
					currentSampleIndex = 0;
				}
			} else if (event.keyCode === 38) {
				// UP
				root.clearText();
				root.clearBack("#000000");
				root.clearFore("#FFFFFF");
				currentSampleIndex --;
				if ( currentSampleIndex < 0 ) {
					currentSampleIndex = samples.length - 1;
				}
			} else {
				samples[currentSampleIndex].onKeyDown(event);
			}
		});
		Yendor.loop(handleNewFrame);
	});
}
