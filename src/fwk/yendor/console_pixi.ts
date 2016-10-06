/**
 * Section: PixiConsole
 */
import * as PIXI from "pixi.js";
import * as $ from "jquery";
import * as Core from "../core/main";
import {IConsoleRenderer, Console, URL_PARAM_RENDERER_PIXI_WEBGL, URL_PARAM_RENDERER_PIXI_CANVAS} from "./console";
/**
 * Class: PixiConsole
 * A console that can be rendered as WebGL or canvas using pixi.js.
 */
export class PixiConsoleRenderer implements IConsoleRenderer {
    // empty character
    private static ASCII_SPACE: number = 32;
    // full character (all white)
    private static ASCII_FULL: number = 219;
    private static CANVAS_ID: string = "__yendor_canvas";
    private static CANVAS_SELECTOR: string = "#" + PixiConsoleRenderer.CANVAS_ID;
    private divSelector: string;
    private topLeftPos: Core.Position;
    private defaultBackgroundColor: number;
    private defaultForegroundColor: number;
    private canvas: HTMLCanvasElement;
    private renderer: PIXI.SystemRenderer;
    private font: PIXI.BaseTexture;
    private chars: PIXI.Texture[];
    private backCells: PIXI.Sprite[][];
    private foreCells: PIXI.Sprite[][];
    private loadComplete: boolean;
    private stage: PIXI.Container;

    /**
     * Property: charWidth
     * A character's width in pixels.
     */
    private charWidth: number;

    /**
     * Property: charHeight
     * A character's height in pixels.
     */
    private charHeight: number;

    /**
     * Constructor: constructor
     * Parameters:
     * foreground - default foreground color
     * background - default background color
     * divSelector - JQuery selector for the div where to render this console
     * fontUrl - URL of the image containing the font
     * rendererName - type of renderer to use
     */
    constructor( foreground: Core.Color, background: Core.Color,
                 divSelector: string, private fontUrl: string, private rendererName?: string ) {
        this.divSelector = divSelector;
        this.loadComplete = false;
        this.defaultBackgroundColor = Core.ColorUtils.toNumber(background);
        this.defaultForegroundColor = Core.ColorUtils.toNumber(foreground);
        this.stage = new PIXI.Container();
    }

    public init(con: Console) {
        this.loadFont(this.fontUrl, this.rendererName, con);
    }

    /**
     * Function: render
     * Update the content of the canvas
     */
    public render(con: Console) {
        if (this.loadComplete) {
            for ( let x = 0; x < con.width; x++) {
                for ( let y = 0; y < con.height; y++) {
                    let ascii = con.text[x][y];
                    if ( ascii >= 0 && ascii <= 255 ) {
                        this.foreCells[x][y].texture = this.chars[ascii];
                    }
                    this.foreCells[x][y].tint = Core.ColorUtils.toNumber(con.fore[x][y]);
                    this.backCells[x][y].tint = Core.ColorUtils.toNumber(con.back[x][y]);
                }
            }
            this.renderer.render(this.stage);
        }
    }

    public getPositionFromPixels( x: number, y: number, pos?: Core.Position ): Core.Position {
        let ret = pos ? pos : new Core.Position();
        if (this.loadComplete) {
            let dx: number = x - this.topLeftPos.x;
            let dy: number = y - this.topLeftPos.y;
            ret.x = Math.floor(dx / this.charWidth);
            ret.y = Math.floor(dy / this.charHeight);
        } else {
            ret.x = -1;
            ret.y = -1;
        }
        return ret;
    }

    public getPixelPositionFromCell( x: number, y: number, pos?: Core.Position ): Core.Position {
        let ret = pos ? pos : new Core.Position();
        if (this.loadComplete) {
            ret.x = x * this.charWidth + this.topLeftPos.x;
            ret.y = y * this.charHeight + this.topLeftPos.y;
        } else {
            ret.x = -1;
            ret.y = -1;
        }
        return ret;
    }

    private loadFont( fontUrl: string, rendererName: string|undefined, con: Console ) {
        this.font = PIXI.BaseTexture.fromImage(fontUrl, false, PIXI.SCALE_MODES.NEAREST);
        if (!this.font.hasLoaded) {
            this.font.on("loaded", () => this.onFontLoaded(rendererName, con));
            this.font.on("error", () => this.onFontError(fontUrl));
        } else {
            this.onFontLoaded(rendererName, con);
        }
    }

    private onFontError(url: string) {
        console.log("FATAL: error while loading font " + url);
    }

    private onFontLoaded(rendererName: string|undefined, con: Console) {
        this.charWidth = this.font.width / 16;
        this.charHeight = this.font.height / 16;
        this.initCanvas(rendererName, con);
        this.initCharacterMap();
        this.initBackgroundCells(con);
        this.initForegroundCells(con);
        this.loadComplete = true;
    }

    private initCanvas(rendererName: string|undefined, con: Console) {
        let div = $(this.divSelector)[0];
        let canvasWidth = con.width * this.charWidth;
        let canvasHeight = con.height * this.charHeight;

        div.innerHTML = "<canvas id='" + PixiConsoleRenderer.CANVAS_ID
            + "' width='" + canvasWidth
            + "' height='" + canvasHeight + "'></canvas>";

        this.canvas = <HTMLCanvasElement> $(PixiConsoleRenderer.CANVAS_SELECTOR)[0];
        this.topLeftPos = new Core.Position($(PixiConsoleRenderer.CANVAS_SELECTOR).offset().left,
            $(PixiConsoleRenderer.CANVAS_SELECTOR).offset().top);
        let pixiOptions: any = {
            antialias: false,
            clearBeforeRender: false,
            preserveDrawingBuffer: false,
            resolution: 1,
            transparent: false,
            view: this.canvas};
        if ( rendererName === URL_PARAM_RENDERER_PIXI_WEBGL) {
            this.renderer = new PIXI.WebGLRenderer(canvasWidth, canvasHeight, pixiOptions);
        } else if ( rendererName === URL_PARAM_RENDERER_PIXI_CANVAS) {
            this.renderer = new PIXI.CanvasRenderer(canvasWidth, canvasHeight, pixiOptions);
        } else {
            this.renderer = PIXI.autoDetectRenderer(canvasWidth, canvasHeight, pixiOptions);
        }
        this.renderer.backgroundColor = this.defaultBackgroundColor;
    }

    private initCharacterMap() {
        this.chars = [];
        for ( let x = 0; x < 16; x++) {
            for ( let y = 0; y < 16; y++) {
                let rect = new PIXI.Rectangle(x * this.charWidth, y * this.charHeight, this.charWidth, this.charHeight);
                this.chars[x + y * 16] = new PIXI.Texture(this.font, rect);
            }
        }
    }

    private initBackgroundCells(con: Console) {
        this.backCells = [];
        for ( let x = 0; x < con.width; x++) {
            this.backCells[x] = [];
            for ( let y = 0; y < con.height; y++) {
                let cell = new PIXI.Sprite(this.chars[PixiConsoleRenderer.ASCII_FULL]);
                cell.position.x = x * this.charWidth;
                cell.position.y = y * this.charHeight;
                cell.width = this.charWidth;
                cell.height = this.charHeight;
                cell.tint = this.defaultBackgroundColor;
                this.backCells[x][y] = cell;
                this.stage.addChild(cell);
            }
        }
    }

    private initForegroundCells(con: Console) {
        this.foreCells = [];
        for ( let x = 0; x < con.width; x++) {
            this.foreCells[x] = [];
            for ( let y = 0; y < con.height; y++) {
                let cell = new PIXI.Sprite(this.chars[PixiConsoleRenderer.ASCII_SPACE]);
                cell.position.x = x * this.charWidth;
                cell.position.y = y * this.charHeight;
                cell.width = this.charWidth;
                cell.height = this.charHeight;
                cell.tint = this.defaultForegroundColor;
                this.foreCells[x][y] = cell;
                this.stage.addChild(cell);
            }
        }
    }
}
