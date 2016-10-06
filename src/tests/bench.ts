import * as $ from "jquery";
import * as Core from "../fwk/core/main";
import * as Yendor from "../fwk/yendor/main";
import * as Umbra from "../fwk/umbra/main";
import * as Gui from "../fwk/gui/main";

// these are the dimensions of the libtcod benchmark sample
const WIDTH: number = 80;
const HEIGHT: number = 50;
const SAMPLE_SCREEN_WIDTH: number = 46;
const SAMPLE_SCREEN_HEIGHT: number = 20;
const SAMPLE_SCREEN_X: number = 20;
const SAMPLE_SCREEN_Y: number = 10;
const MENU_BACKGROUND: Core.Color = 0x272822;
const MENU_BACKGROUND_ACTIVE: Core.Color = 0x383830;
const MENU_FOREGROUND: Core.Color = 0xFD971F;
const MENU_FOREGROUND_ACTIVE: Core.Color = 0xFFDF90;
const MENU_FOREGROUND_DISABLED: Core.Color = 0x748E5F;
const TITLE_FOREGROUND: Core.Color = 0xFFFFFF;

abstract class Sample extends Umbra.Node {
    public abstract name: string;
    public abstract mustClearConsole: boolean;
    public index: number;
}

class PerfSample extends Sample {
    public name: string = "True color";
    public mustClearConsole: boolean = false;
    private rng: Yendor.Random = new Yendor.CMWCRandom();

    public onRender(con: Yendor.Console) {
        for (let x = SAMPLE_SCREEN_X; x < SAMPLE_SCREEN_X + SAMPLE_SCREEN_WIDTH; ++x) {
            for (let y = SAMPLE_SCREEN_Y; y < SAMPLE_SCREEN_Y + SAMPLE_SCREEN_HEIGHT; ++y) {
                con.back[x][y] = this.rng.getNumber(0, 0xFFFFFF);
                con.fore[x][y] = this.rng.getNumber(0, 0xFFFFFF);
                con.text[x][y] = this.rng.getNumber(32, 128);
            }
        }
    }
}

class AStarSample extends Sample {
    private static DARK_WALL: Core.Color = 0x000064;
    private static LIGHT_WALL: Core.Color = 0x826E32;
    private static DARK_GROUND: Core.Color = 0x323296;

    public name: string = "Path finding";
    public mustClearConsole: boolean = true;

    private pathFinder: Yendor.PathFinder;
    private from: Core.Position = new Core.Position(19, 10);
    private to: Core.Position = new Core.Position(0, 0);
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

    public onInit() {
        let thisMap: string[] = this.map;
        this.pathFinder = new Yendor.PathFinder(SAMPLE_SCREEN_WIDTH, SAMPLE_SCREEN_HEIGHT,
            function(_from: Core.Position, to: Core.Position): number {
                return thisMap[to.y][to.x] === "#" ? 0 : 1;
            });
    }

    public onRender(con: Yendor.Console) {
        do {
            this.setNewDestination();
        } while (!this.isDestinationWalkable());
        this.drawMap(con);
        let path: Core.Position[]|undefined = this.pathFinder.getPath(this.from, this.to);
        if (path) {
            let pos: Core.Position|undefined = path.pop();
            while (pos) {
                con.back[SAMPLE_SCREEN_X + pos.x][SAMPLE_SCREEN_Y + pos.y] = AStarSample.LIGHT_WALL;
                pos = path.pop();
            }
        }
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

    private drawMap(con: Yendor.Console) {
        for (let y: number = 0; y < SAMPLE_SCREEN_HEIGHT; ++y) {
            for (let x: number = 0; x < SAMPLE_SCREEN_WIDTH; ++x) {
                con.back[SAMPLE_SCREEN_X + x][SAMPLE_SCREEN_Y + y] =
                    this.map[y][x] === "#" ? AStarSample.DARK_WALL : AStarSample.DARK_GROUND;
            }
        }
    }

    private isDestinationWalkable(): boolean {
        return this.map[this.to.y][this.to.x] === " ";
    }
}

class ScheduledEntity extends Yendor.TimedEntity {
    public position: number = 0;
    public char: number = "r".charCodeAt(0);
    constructor(public  turnLength: number) {
        super();
    }
    public update() {
        this.position++;
        if (this.position === SAMPLE_SCREEN_WIDTH) {
            this.position = 0;
        }
        this.wait(this.turnLength);
    }
}

class PlayerEntity extends ScheduledEntity {
    public move: boolean = false;
    constructor(turnLength: number) {
        super(turnLength);
        this.char = "@".charCodeAt(0);
    }
    public update() {
        if (this.move) {
            super.update();
            this.move = false;
        } else {
            this.wait(this.turnLength);
        }
    }
}
abstract class AbstractSchedulerSample extends Sample {
    protected scheduler: Yendor.Scheduler = new Yendor.Scheduler();
    protected entities: ScheduledEntity[] = [];
    protected player: PlayerEntity;
    public onRender(con: Yendor.Console) {
        let y: number = 2;
        con.clearText(0, SAMPLE_SCREEN_X, SAMPLE_SCREEN_Y, SAMPLE_SCREEN_WIDTH, SAMPLE_SCREEN_HEIGHT);
        con.print(SAMPLE_SCREEN_X, SAMPLE_SCREEN_Y + 15, "Press space to move");
        for ( let i: number = 0, len: number = this.entities.length; i < len; ++i) {
            let entity = this.entities[i];
            con.text[SAMPLE_SCREEN_X + entity.position][SAMPLE_SCREEN_Y + y] = entity.char;
            y += 2;
        }
        this.scheduler.run();
    }
    protected init() {
        this.entities.push(new ScheduledEntity(4));
        this.entities.push(new ScheduledEntity(5));
        this.entities.push(new ScheduledEntity(6));
        this.entities.push(new ScheduledEntity(10));
        this.entities.push(this.player);
        this.scheduler.addAll(this.entities);
    }
}

class RealTimeSchedulerSample extends AbstractSchedulerSample {
    public name: string = "Scheduler (real time)";
    public mustClearConsole: boolean = false;

    public onInit() {
        this.player = new PlayerEntity(5);
        this.init();
    }
    public onUpdate(_time: number) {
        if ( Umbra.isKeyDown(Umbra.KeyCodeEnum.DOM_VK_SPACE) ) {
            this.player.move = true;
        }
    }
}

class TurnByTurnPlayerEntity extends PlayerEntity {
    public scheduler: Yendor.Scheduler;
    constructor(scheduler: Yendor.Scheduler) {
        super(5);
        this.scheduler = scheduler;
    }
    public update() {
        if (this.move) {
            super.update();
        } else {
            // pause the scheduler to wait for a keypress
            this.scheduler.pause();
        }
    }
}

class TurnByTurnSchedulerSample extends AbstractSchedulerSample {
    public name: string = "Scheduler (turn by turn)";
    public mustClearConsole: boolean = false;

    public onInit() {
        this.player = new TurnByTurnPlayerEntity(this.scheduler);
        this.init();
    }
    public onUpdate(_time: number) {
        if ( Umbra.wasKeyPressed(Umbra.KeyCodeEnum.DOM_VK_SPACE) ) {
            this.player.move = true;
            this.scheduler.resume();
        }
    }
}

class NoiseSample extends Sample {
    public name: string = "Noise";
    public mustClearConsole: boolean = false;

    private noise: Yendor.Noise;
    private frequency: number = 2;
    private offset: number = 0;
    private octaves: number = 3;
    private dim: number = 0;
    private fbm: boolean = false;
    public onInit() {
        this.noise = new Yendor.SimplexNoise(new Yendor.CMWCRandom());
    }
    public onRender(con: Yendor.Console) {
        con.clearText(0, SAMPLE_SCREEN_X, SAMPLE_SCREEN_Y, SAMPLE_SCREEN_WIDTH, SAMPLE_SCREEN_HEIGHT);
        con.print(SAMPLE_SCREEN_X, SAMPLE_SCREEN_Y + 15, "+/- : frequency (" + this.frequency + ")");
        con.print(SAMPLE_SCREEN_X, SAMPLE_SCREEN_Y + 16, "space : "
            + (this.dim % 3 + 1) + "D" + (this.fbm ? " FBM" : ""));
        for (let x = SAMPLE_SCREEN_X; x < SAMPLE_SCREEN_X + SAMPLE_SCREEN_WIDTH; ++x) {
            let h: number|undefined;
            if (this.dim % 3 === 0) {
                h = this.fbm ?
                    this.noise.fbm1D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH
                        + this.offset, this.frequency, this.octaves)
                    : this.noise.get1D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset, this.frequency);
                h = (h + 1) / 2;
            }
            for (let y = SAMPLE_SCREEN_Y; y < SAMPLE_SCREEN_Y + SAMPLE_SCREEN_HEIGHT; ++y) {
                if (this.dim % 3 === 1) {
                    h = this.fbm ?
                        this.noise.fbm2D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset,
                            (y - SAMPLE_SCREEN_Y) / SAMPLE_SCREEN_HEIGHT + this.offset, this.frequency, this.octaves)
                        : this.noise.get2D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset,
                            (y - SAMPLE_SCREEN_Y) / SAMPLE_SCREEN_HEIGHT + this.offset, this.frequency);
                    h = (h + 1) / 2;
                } else if ( this.dim % 3 === 2 ) {
                    h = this.fbm ?
                        this.noise.fbm3D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset,
                            (y - SAMPLE_SCREEN_Y) / SAMPLE_SCREEN_HEIGHT + this.offset,
                            this.offset, this.frequency, this.octaves)
                        : this.noise.get3D((x - SAMPLE_SCREEN_X) / SAMPLE_SCREEN_WIDTH + this.offset,
                            (y - SAMPLE_SCREEN_Y) / SAMPLE_SCREEN_HEIGHT + this.offset, this.offset, this.frequency);
                    h = (h + 1) / 2;
                }
                let col = Core.ColorUtils.add(Core.ColorUtils.multiply(0x000064, h || 0),
                    Core.ColorUtils.multiply(0x826E64, 1 - h));
                con.back[x][y] = col;
            }
        }
        this.offset += 0.005;
    }
    public onUpdate(_time: number) {
        if ( Umbra.wasKeyPressed(Umbra.KeyCodeEnum.DOM_VK_ADD) ) {
            this.frequency++;
        } else if ( Umbra.wasKeyPressed(Umbra.KeyCodeEnum.DOM_VK_SUBTRACT) ) {
            if (this.frequency > 1) {
                this.frequency--;
            }
        } else if ( Umbra.wasKeyPressed(Umbra.KeyCodeEnum.DOM_VK_SPACE) ) {
            this.dim = (this.dim + 1) % 6;
            this.fbm = this.dim >= 3;
        }
    }
}

class GuiSample extends Sample {
    public name: string = "Gui";
    public mustClearConsole: boolean = true;
    private sliderLabel: Gui.Label<Gui.ILabelOption>;
    private slider: Gui.Slider;

    public onInit() {
        this.addChild(new Gui.Button({expand: Umbra.ExpandEnum.NONE, label: " a button "}));
        let vpanel: Gui.VPanel = this.addChild(new Gui.VPanel({expand: Umbra.ExpandEnum.NONE}));
        vpanel.moveTo(13, 0);
        vpanel.addChild(new Gui.Label({label: "this"}));
        vpanel.addChild(new Gui.Label({label: "is"}));
        vpanel.addChild(new Gui.Label({label: "a vertical"}));
        vpanel.addChild(new Gui.Label({label: "panel"}));
        vpanel.addChild(new Gui.HSeparator("separator"));
        // drag'n drop example
        vpanel.addChild(new Gui.Draggable({})).addChild(new Gui.Button({label: "drag me!"}));
        let dropFrame: Gui.Frame = this.addChild(new Gui.Frame({title: "Drop here"}));
        dropFrame.addChild(new Gui.DragTarget({
            dropCallback: (dropped: Gui.Draggable, _target: Gui.DragTarget, _data: any) => {
                vpanel.removeChild(dropped);
                dropFrame.addChild(dropped);
                dropped.moveTo(1, 0);
            },
            minHeight: 1,
            minWidth: 8,
        }));
        dropFrame.moveTo(25, 0);
        // slider
        let sliderFrame: Gui.Frame = this.addChild(new Gui.Frame({title: "Slider"}));
        this.sliderLabel = sliderFrame.addChild(new Gui.Label({label: "value:0"}));
        this.slider = sliderFrame.addChild(new Gui.Slider({
            maxValue: 100,
            minValue: 0,
        }));
        this.slider.moveTo(1, 2);
        sliderFrame.moveTo(0, 3);
    }

    public onUpdate(_time: number) {
        this.sliderLabel.getOptions().label = "value:" + this.slider.getValue().toFixed(0);
    }
}

class BenchmarkScene extends Umbra.Scene {
    private framesPerSecond: number = 0;
    private currentFrameCount: number = 0;
    private fpsTimer: number = 0;
    private samples: Sample[] = [];
    private currentSampleIndex: number = 0;
    private mustClearConsole: boolean = false;

    public onInit() {
        this.samples.push(this.addChild(new PerfSample()));
        this.samples.push(this.addChild(new AStarSample()));
        this.samples.push(this.addChild(new TurnByTurnSchedulerSample()));
        this.samples.push(this.addChild(new RealTimeSchedulerSample()));
        this.samples.push(this.addChild(new NoiseSample()));
        this.samples.push(this.addChild(new GuiSample()));
        this.buildSampleMenu();
        this.samples[0].show();
    }

    public onRender(con: Yendor.Console) {
        this.currentFrameCount ++;
        if (this.mustClearConsole || this.samples[this.currentSampleIndex].mustClearConsole) {
            this.clearConsole(con);
            this.mustClearConsole = false;
        }
        con.print(1, 46, "frame/s : " + this.framesPerSecond + "    ");
    }

    public onUpdate(time: number) {
        this.computeFps(time);
        if (Umbra.wasKeyPressed(Umbra.KeyCodeEnum.DOM_VK_DOWN)) {
            this.setCurrentSample((this.currentSampleIndex + 1) % this.samples.length);
        } else if (Umbra.wasKeyPressed(Umbra.KeyCodeEnum.DOM_VK_UP)) {
            this.setCurrentSample(this.currentSampleIndex === 0
                ? this.samples.length - 1 : this.currentSampleIndex - 1);
        }
    }

    private buildSampleMenu() {
        let vpanel = this.addChild(new Gui.VPanel({}));
        vpanel.moveTo(1, 40);
        let index: number = 0;
        for (let sample of this.samples) {
            sample.hide();
            sample.index = index;
            index ++;
            sample.moveTo(SAMPLE_SCREEN_X, SAMPLE_SCREEN_Y);
            vpanel.addChild(this.createSampleMenuButton(sample));
        }
    }

    private createSampleMenuButton(sample: Sample) {
        return new Gui.Button({
            callback: (data: any) => {
                this.setCurrentSample((<Sample> data).index);
                return true;
            },
            eventData: sample,
            expand: Umbra.ExpandEnum.NONE,
            label: sample.name,
            postRender: (con: Yendor.Console, x: number, y: number,
                options: Gui.IButtonOption, active: boolean) => {
                if ((<Sample> options.eventData).index === this.currentSampleIndex) {
                    con.clearBack(0x323296, x, y, 26, 1);
                } else {
                    con.clearBack(0x000000, x, y, 26, 1);
                }
                if ((<Sample> options.eventData).index === this.currentSampleIndex || active) {
                    con.clearFore(0xFFFFFF, x, y, 26, 1);
                } else {
                    con.clearFore(0xD0D0D0, x, y, 26, 1);
                }
            },
        });
    }

    private setCurrentSample(index: number) {
        this.samples[this.currentSampleIndex].hide();
        this.currentSampleIndex = index;
        this.samples[this.currentSampleIndex].show();
        this.mustClearConsole = true;
    }

    private clearConsole(con: Yendor.Console) {
        con.clearText();
        con.clearBack(0x000000);
        con.clearFore(0xFFFFFF);
    }

    private computeFps(time: number) {
        if (this.fpsTimer === 0) {
            this.fpsTimer = time;
        }
        if (time - this.fpsTimer > 1000) {
            this.framesPerSecond = this.currentFrameCount;
            this.fpsTimer = time;
            this.currentFrameCount = 0;
        }
    }
}

$(function() {
    Gui.setConfiguration(
        {
            color: {
                background: MENU_BACKGROUND,
                backgroundActive: MENU_BACKGROUND_ACTIVE,
                backgroundDisabled: MENU_BACKGROUND,
                foreground: MENU_FOREGROUND,
                foregroundActive: MENU_FOREGROUND_ACTIVE,
                foregroundDisabled: MENU_FOREGROUND_DISABLED,
                titleForeground: TITLE_FOREGROUND,
            },
                input: {
                cancelAxisName: "cancel",
                focusNextWidgetAxisName: "next",
                focusPreviousWidgetAxisName: "prev",
                validateAxisName: "validate",
            },
        });
    Umbra.init(new Umbra.Application()).run(new BenchmarkScene(), {
        backgroundAnimation: true,
        consoleHeight: HEIGHT,
        consoleWidth: WIDTH,
    });
});
