/// <reference path="../../decl/pixi.js.d.ts" />

/**
	Section: PixiConsole
*/
import * as Core from "../core/main";
import * as con from "./console";
/**
    Class: PixiConsole
    A console that can be rendered as WebGL or canvas using pixi.js.
*/
export class PixiConsole extends con.Console {
    private static CANVAS_ID: string = "__yendor_canvas";
    private static CANVAS_SELECTOR: string = "#" + PixiConsole.CANVAS_ID;
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
    // empty character
    private static ASCII_SPACE: number = 32;
    // full character (all white)
    private static ASCII_FULL: number = 219;

    /**
        Property: charWidth
        A character's width in pixels.
    */
    private charWidth: number;

    /**
        Property: charHeight
        A character's height in pixels.
    */
    private charHeight: number;

    /**
        Constructor: constructor

        Parameters:
        width - number of columns
        height - number of rows
        foreground - default foreground color
        background - default background color
        divSelector - JQuery selector for the div where to render this console
        fontUrl - URL of the image containing the font
        rendererName - type of renderer to use
    */
    constructor( _width: number, _height: number,
        foreground: Core.Color, background: Core.Color, divSelector: string, fontUrl: string, rendererName?: string ) {
        super(_width, _height, foreground, background);
        this.divSelector = divSelector;
        this.loadComplete = false;
        this.defaultBackgroundColor = Core.ColorUtils.toNumber(background);
        this.defaultForegroundColor = Core.ColorUtils.toNumber(foreground);
        this.stage = new PIXI.Container();
        this.loadFont(fontUrl, rendererName);
    }

    private loadFont( fontUrl: string, rendererName?: string ) {
        this.font = PIXI.BaseTexture.fromImage(fontUrl, false, PIXI.SCALE_MODES.NEAREST);
        if (!this.font.hasLoaded) {
            this.font.on("loaded", () => this.onFontLoaded(rendererName));
        } else {
            this.onFontLoaded(rendererName);
        }
    }

    private onFontLoaded(rendererName: string) {
        this.charWidth = this.font.width / 16;
        this.charHeight = this.font.height / 16;
        this.initCanvas(rendererName);
        this.initCharacterMap();
        this.initBackgroundCells();
        this.initForegroundCells();
        this.loadComplete = true;
    }

    private initCanvas(rendererName: string) {
        let div = $(this.divSelector)[0];
        let canvasWidth = this.width * this.charWidth;
        let canvasHeight = this.height * this.charHeight;

        div.innerHTML = "<canvas id='" + PixiConsole.CANVAS_ID
            + "' width='" + canvasWidth
            + "' height='" + canvasHeight + "'></canvas>";

        this.canvas = <HTMLCanvasElement>$(PixiConsole.CANVAS_SELECTOR)[0];
        this.topLeftPos = new Core.Position($(PixiConsole.CANVAS_SELECTOR).offset().left, $(PixiConsole.CANVAS_SELECTOR).offset().top);
        let pixiOptions: any = {
            antialias: false,
            clearBeforeRender: false,
            preserveDrawingBuffer: false,
            resolution: 1,
            transparent: false,
            view: this.canvas};
        if ( rendererName === con.URL_PARAM_RENDERER_PIXI_WEBGL) {
            this.renderer = new PIXI.WebGLRenderer(canvasWidth, canvasHeight, pixiOptions);
        } else if ( rendererName === con.URL_PARAM_RENDERER_PIXI_CANVAS) {
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

    private initBackgroundCells() {
        this.backCells = [];
        for ( let x = 0; x < this.width; x++) {
            this.backCells[x] = [];
            for ( let y = 0; y < this.height; y++) {
                let cell = new PIXI.Sprite(this.chars[PixiConsole.ASCII_FULL]);
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

    private initForegroundCells() {
        this.foreCells = [];
        for ( let x = 0; x < this.width; x++) {
            this.foreCells[x] = [];
            for ( let y = 0; y < this.height; y++) {
                let cell = new PIXI.Sprite(this.chars[PixiConsole.ASCII_SPACE]);
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

    /**
        Function: render
        Update the content of the canvas
    */
    render() {
        if (this.loadComplete) {
            for ( let x = 0; x < this.width; x++) {
                for ( let y = 0; y < this.height; y++) {
                    let ascii = this.text[x][y];
                    if ( ascii >= 0 && ascii <= 255 ) {
                        this.foreCells[x][y].texture = this.chars[ascii];
                    }
                    this.foreCells[x][y].tint = Core.ColorUtils.toNumber(this.fore[x][y]);
                    this.backCells[x][y].tint = Core.ColorUtils.toNumber(this.back[x][y]);
                }
            }
            this.renderer.render(this.stage);
        }
    }

    /**
        Function: getPositionFromPixels
        Returns the column and row corresponding to a mouse position in the page.

        Parameters:
        x - the mouse x coordinate in pixels relative to the document
        y - the mouse y coordinate in pixels relative to the document
        pos - if not undefined, when function exits, contains the mouse cell position

        Returns:
        The <Core.Position> in the console.
    */
    getPositionFromPixels( x: number, y: number, pos: Core.Position ): Core.Position {
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
}
