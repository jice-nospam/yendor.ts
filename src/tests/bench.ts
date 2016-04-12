/// <reference path="../decl/jquery.d.ts" />
/// <reference path="../yendor/yendor.ts" />
let root: Yendor.Console;

module Benchmark {
    "use strict";
    // these are the dimensions of the libtcod benchmark sample
    let WIDTH: number = 80;
    let HEIGHT: number = 60;
    let SAMPLE_SCREEN_WIDTH: number = 46;
    let SAMPLE_SCREEN_HEIGHT: number = 20;
    let SAMPLE_SCREEN_X: number = 20;
    let SAMPLE_SCREEN_Y: number = 10;
    let rng: Yendor.Random = new Yendor.ComplementaryMultiplyWithCarryRandom();
    let framesPerSecond: number = 0;
    let currentFrameCount: number = 0;
    let consoleRenderCount: number = 0;
    let consoleRenderCount10s: number = 0;
    let console10sTimer: number = 0;
    let consoleRenderPerSecond: number = 0;
    let consoleRenderPerSecond10s: number = 0;
    let fpsTimer: number = 0;
    /** how many time we render the console per frame. */
    let renderPerFrame: number = 1;

    interface Sample {
        name: string;
        render(root: Yendor.Console);
        onKeyDown(event: KeyboardEvent);
    }

    let samples: Sample[] = [];
    let currentSampleIndex: number = 0;

    class PerfSample implements Sample {
        name: string = "True color";
        render(root: Yendor.Console) {
            for (let x = SAMPLE_SCREEN_X; x < SAMPLE_SCREEN_X + SAMPLE_SCREEN_WIDTH; ++x) {
                for (let y = SAMPLE_SCREEN_Y; y < SAMPLE_SCREEN_Y + SAMPLE_SCREEN_HEIGHT; ++y) {
                    root.back[x][y] = rng.getNumber(0, 0xFFFFFF);
                    root.fore[x][y] = rng.getNumber(0, 0xFFFFFF);
                    root.text[x][y] = rng.getNumber(32, 128);
                }
            }
        }
        onKeyDown(event: KeyboardEvent) { }
    }

    class AStarSample implements Sample {
        name: string = "Path finding";
        private pathFinder: Yendor.PathFinder;
        private from: Core.Position = new Core.Position(19, 10);
        private to: Core.Position = new Core.Position(0, 0);
        private static DARK_WALL: Core.Color = 0x000064;
        private static LIGHT_WALL: Core.Color = 0x826E32;
        private static DARK_GROUND: Core.Color = 0x323296;
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
            let thisMap: string[] = this.map;
            this.pathFinder = new Yendor.PathFinder(SAMPLE_SCREEN_WIDTH, SAMPLE_SCREEN_HEIGHT,
                function(from: Core.Position, to: Core.Position): number {
                    return thisMap[to.y][to.x] === "#" ? 0 : 1;
                });
        }
        private setNewDestination() {
            this.to.x++;
            if (this.to.x === SAMPLE_SCREEN_WIDTH) {
                this.to.x = 0;
                this.to.y++;
                if (this.to.y === SAMPLE_SCREEN_HEIGHT) {
                    this.to.y = 0;
                }
            }
        }
        private drawMap(root: Yendor.Console) {
            for (let y: number = 0; y < SAMPLE_SCREEN_HEIGHT; ++y) {
                for (let x: number = 0; x < SAMPLE_SCREEN_WIDTH; ++x) {
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
            } while (!this.isDestinationWalkable());
            this.drawMap(root);
            let path: Core.Position[] = this.pathFinder.getPath(this.from, this.to);
            if (path) {
                let pos: Core.Position = path.pop();
                while (pos) {
                    root.back[SAMPLE_SCREEN_X + pos.x][SAMPLE_SCREEN_Y + pos.y] = AStarSample.LIGHT_WALL;
                    pos = path.pop();
                }
            }
        }
        onKeyDown(event: KeyboardEvent) { }
    }

    class ScheduledEntity extends Yendor.TimedEntity {
        turnLength: number;
        position: number = 0;
        char: number = "r".charCodeAt(0);
        constructor(turnLength: number) {
            super();
            this.turnLength = turnLength;
        }
        update() {
            this.position++;
            if (this.position === SAMPLE_SCREEN_WIDTH) {
                this.position = 0;
            }
            this.wait(this.turnLength);
        }
    }

    class PlayerEntity extends ScheduledEntity {
        move: boolean = false;
        constructor(turnLength: number) {
            super(turnLength);
            this.char = "@".charCodeAt(0);
        }
        update() {
            if (this.move) {
                super.update();
                this.move = false;
            } else {
                this.wait(this.turnLength);
            }
        }
    }
    class AbstractSchedulerSample implements Sample {
        name: string;
        protected scheduler: Yendor.Scheduler = new Yendor.Scheduler();
        protected entities: ScheduledEntity[] = [];
        protected player: PlayerEntity;
        protected init() {
            this.entities.push(new ScheduledEntity(4));
            this.entities.push(new ScheduledEntity(5));
            this.entities.push(new ScheduledEntity(6));
            this.entities.push(new ScheduledEntity(10));
            this.entities.push(this.player);
            this.scheduler.addAll(this.entities);
        }
        render(root: Yendor.Console) {
            let y: number = 2;
            root.clearText();
            root.print(SAMPLE_SCREEN_X, SAMPLE_SCREEN_Y + 15, "Press any key to move");
            for ( let i: number = 0, len: number = this.entities.length; i < len; ++i) {
                let entity = this.entities[i];
                root.text[SAMPLE_SCREEN_X + entity.position][SAMPLE_SCREEN_Y + y] = entity.char;
                y += 2;
            }
            this.scheduler.run();
        }
        onKeyDown(event: KeyboardEvent) { }
    }

    class RealTimeSchedulerSample extends AbstractSchedulerSample {
        constructor() {
            super();
            this.name = "Scheduler (real time)";
            this.player = new PlayerEntity(5);
            this.init();
        }
        onKeyDown(event: KeyboardEvent) {
            this.player.move = true;
        }
    }

    class TurnByTurnPlayerEntity extends PlayerEntity {
        scheduler: Yendor.Scheduler;
        constructor(scheduler: Yendor.Scheduler) {
            super(5);
            this.scheduler = scheduler;
        }
        update() {
            if (this.move) {
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

    class NoiseSample implements Sample {
        name: string = "Noise";
        private noise: Yendor.Noise;
        private frequency: number = 2;
        private offset: number = 0;
        private octaves: number = 3;
        private dim: number = 0;
        private fbm: boolean = false;
        constructor() {
            this.noise = new Yendor.SimplexNoise(rng);
        }
        render(root: Yendor.Console) {
            root.clearText();
            root.print(SAMPLE_SCREEN_X, SAMPLE_SCREEN_Y + 15, "+/- : frequency (" + this.frequency + ")");
            root.print(SAMPLE_SCREEN_X, SAMPLE_SCREEN_Y + 16, "any key : " + (this.dim % 3 + 1) + "D" + (this.fbm ? " FBM": ""));
            for (let x = SAMPLE_SCREEN_X; x < SAMPLE_SCREEN_X + SAMPLE_SCREEN_WIDTH; ++x) {
                let h: number;
                if (this.dim % 3 === 0) {
                    h = this.fbm ?
                        this.noise.fbm1D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset, this.frequency, this.octaves) 
                        : this.noise.get1D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset, this.frequency);
                    h = (h + 1) / 2;
                }
                for (let y = SAMPLE_SCREEN_Y; y < SAMPLE_SCREEN_Y + SAMPLE_SCREEN_HEIGHT; ++y) {
                    if (this.dim % 3 === 1) {
                        h = this.fbm ? 
                            this.noise.fbm2D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset, (y - SAMPLE_SCREEN_Y) / SAMPLE_SCREEN_HEIGHT + this.offset, this.frequency, this.octaves)
                            : this.noise.get2D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset, (y - SAMPLE_SCREEN_Y) / SAMPLE_SCREEN_HEIGHT + this.offset, this.frequency);
                        h = (h + 1) / 2;
                    } else if ( this.dim % 3 === 2 ) {
                        h = this.fbm ? 
                            this.noise.fbm3D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset, (y - SAMPLE_SCREEN_Y) / SAMPLE_SCREEN_HEIGHT + this.offset, this.offset, this.frequency, this.octaves)
                            : this.noise.get3D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset, (y - SAMPLE_SCREEN_Y) / SAMPLE_SCREEN_HEIGHT + this.offset, this.offset, this.frequency);
                        h = (h + 1) / 2;
                    }
                    let col = Core.ColorUtils.add(Core.ColorUtils.multiply(0x000064, h), Core.ColorUtils.multiply(0x826E64, 1 - h));
                    root.back[x][y] = col;
                }
            }
            this.offset += 0.005;
        }
        onKeyDown(event: KeyboardEvent) {
            if (event.key === "+") {
                this.frequency++;
            } else if (event.key === "-") {
                if (this.frequency > 1) {
                    this.frequency--;
                }
            } else {
                this.dim = (this.dim + 1) % 6;
                this.fbm = this.dim >= 3;
            }
        }
    }

    function render() {
        samples[currentSampleIndex].render(root);
        for (let i: number = 0, len: number = samples.length; i < len; ++i) {
            let sample: Sample = samples[i];
            root.print(1, 40 + i, sample.name);
            if (i === currentSampleIndex) {
                root.clearBack(0x323296, 0, 40 + i, 26, 1);
                root.clearFore(0xFFFFFF, 0, 40 + i, 26, 1);
            } else {
                root.clearBack(0x000000, 0, 40 + i, 26, 1);
                root.clearFore(0xD0D0D0, 0, 40 + i, 26, 1);
            }
        }
        root.print(1, 46, "frame/s : " + framesPerSecond + " render/s : " + consoleRenderPerSecond + " render/s (10s mean) : " + consoleRenderPerSecond10s + "     ");
    }
    
    function computeFps(time: number) {
        if (fpsTimer === 0) {
            fpsTimer = time;
            console10sTimer = time;
        }
        if (time - fpsTimer > 1000) {
            framesPerSecond = currentFrameCount;
            consoleRenderPerSecond = consoleRenderCount;
            fpsTimer = time;
            currentFrameCount = 0;
            consoleRenderCount = 0;
            if ( framesPerSecond > 45 ) {
                renderPerFrame++;
            } else if ( framesPerSecond < 10 && renderPerFrame > 1 ) {
                renderPerFrame --;
            }
        }
        if ( time - console10sTimer > 10000 ) {
            console10sTimer = time;
            consoleRenderPerSecond10s = Math.floor(consoleRenderCount10s / 10);
            consoleRenderCount10s = 0;
        }
    }

    function handleNewFrame(time: number) {
        computeFps(time);
        currentFrameCount++;
        let frameNum = renderPerFrame;
        while ( frameNum > 0) {
            consoleRenderCount++;
            consoleRenderCount10s++;
            render();
            root.render();
            frameNum--;
        }
    }

    $(function() {
        Yendor.init();
        root = Yendor.createConsole(WIDTH, HEIGHT, 0xffffff, 0x000000, "#console", "terminal.png");
        samples.push(new PerfSample());
        samples.push(new AStarSample());
        samples.push(new RealTimeSchedulerSample());
        samples.push(new TurnByTurnSchedulerSample());
        samples.push(new NoiseSample());
        $(document).keydown(function(event: KeyboardEvent) {
            if (event.keyCode === 40) {
                // DOWN
                root.clearText();
                root.clearBack(0x000000);
                root.clearFore(0xFFFFFF);
                currentSampleIndex++;
                if (currentSampleIndex >= samples.length) {
                    currentSampleIndex = 0;
                }
            } else if (event.keyCode === 38) {
                // UP
                root.clearText();
                root.clearBack(0x000000);
                root.clearFore(0xFFFFFF);
                currentSampleIndex--;
                if (currentSampleIndex < 0) {
                    currentSampleIndex = samples.length - 1;
                }
            } else {
                samples[currentSampleIndex].onKeyDown(event);
            }
        });
        Yendor.loop(handleNewFrame);
    });
}
