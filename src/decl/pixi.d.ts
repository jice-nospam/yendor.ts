// Type definitions for PIXI 1.5.0
// Project: https://github.com/GoodBoyDigital/pixi.js/
// Definitions by: xperiments <http://github.com/xperiments>
// Definitions: https://github.com/borisyankov/DefinitelyTyped

declare module PIXI {

    /* CONSTANTS */
    export var WEBGL_RENDERER: number;
    export var CANVAS_RENDERER: number;
    export var VERSION: string;

    export enum blendModes {
        NORMAL,
        ADD,
        MULTIPLY,
        SCREEN,
        OVERLAY,
        DARKEN,
        LIGHTEN,
        COLOR_DODGE,
        COLOR_BURN,
        HARD_LIGHT,
        SOFT_LIGHT,
        DIFFERENCE,
        EXCLUSION,
        HUE,
        SATURATION,
        COLOR,
        LUMINOSITY,
    }

    export var INTERACTION_REQUENCY: number;
    export var AUTO_PREVENT_DEFAULT: boolean;
    export var RAD_TO_DEG: number;
    export var DEG_TO_RAD: number;

    /* MODULE FUNCTIONS */
    export function autoDetectRenderer(width: number, height: number, view?: HTMLCanvasElement, transparent?, antialias?): IPixiRenderer;
    export function autoDetectRecommendedRenderer(width: number, height: number, view?: HTMLCanvasElement, transparent?, antialias?): IPixiRenderer;
    export function AjaxRequest(): XMLHttpRequest;
    export function hex2rgb(hex);
    export function rgb2hex(rgb);
    export function canUseNewCanvasBlendModes();
    export function getNextPowerOfTwo(number);
    

    /*INTERFACES*/
    export interface IBasicCallback {
        (): void
    }

    export interface IEventCallback {
        (e?: IEvent): void
    }

    export interface IEvent {
        type: string;
        content: any;
    }

    export interface IHitArea {
        contains(x: number, y: number): boolean;
    }

    export interface IInteractionDataCallback {
        (interactionData: InteractionData): void
    }

    export interface IPixiRenderer {
        type: number;
        transparent: boolean;
        width: number; 
        height: number; 
        view: HTMLCanvasElement;
        
        render(stage: Stage): void;
        resize(width: number, height: number): void;
    }

    export interface IBitmapTextStyle {
        font?: string;
        align?: string;
        tint?: string;
    }

    export interface ITextStyle {
        font?: string;
        stroke?: string;
        fill?: string;
        align?: string;
        strokeThickness?: number;
        wordWrap?: boolean;
        wordWrapWidth?: number;
    }

    export interface IUniform {
        type: string;
        value: any;
    }

    export interface ILoader {
        constructor(url: string, crossorigin: boolean);
        load();
    }

    export interface ITintMethod {
        (texture: Texture, color: number, canvas: HTMLCanvasElement): void;
    }

    export interface IMaskData {
        alpha: number;
        worldTransform: number[];
    }

    export interface IRenderSession // unclear; Taken from DisplayObjectContainer:152
    {
        context: CanvasRenderingContext2D;
        maskManager: CanvasMaskManager;
        scaleMode: scaleModes;
        smoothProperty: string;
    }

    export interface IShaderAttribute {
        // TODO: Find signature of shader attributes
    }

    export interface IFilterBlock {
        // TODO: Find signature of filterBlock
    }

    /* CLASSES */

    export class AbstractFilter {
        passes: AbstractFilter[];
        shaders: PixiShader[];
        dirty: boolean;
        padding: number;
        uniforms: { [name: string]: IUniform };
        fragmentSrc: any[];
    }

    export class AlphaMaskFilter extends AbstractFilter {
        map: Texture;

        constructor(texture: Texture);
        onTextureLoaded(): void;
    }

    export class AssetLoader extends EventTarget {
        assetURLs: string[];
        crossorigin: boolean;
        loadersByType: { [key: string]: ILoader };

        constructor(assetURLs: string[], crossorigin: boolean);
        load(): void;
        onComplete(): void;
    }

    export class AtlasLoader extends EventTarget {
        url: string;
        baseUrl: string;
        crossorigin: boolean;
        loaded: boolean;

        constructor(url: string, crossorigin: boolean);
        load(): void;
    }

    export class BaseTexture extends EventTarget {
        height: number;
        width: number;
        source: HTMLImageElement;
        scaleMode: scaleModes;
        hasLoaded: boolean;

        constructor(source: HTMLImageElement, scaleMode: scaleModes);
        constructor(source: HTMLCanvasElement, scaleMode: scaleModes);
        destroy(): void;
        updateSourceImage(newSrc: string): void;

        static fromImage(imageUrl: string, crossorigin: boolean, scaleMode: scaleModes): BaseTexture;
        static fromCanvas(canvas: HTMLCanvasElement, scaleMode: scaleModes): BaseTexture;
    }

    export class BitmapFontLoader extends EventTarget {
        baseUrl: string;
        crossorigin: boolean;
        texture: Texture;
        url: string;

        constructor(url: string, crossorigin: boolean);
        load(): void;
    }

    export class BitmapText extends DisplayObjectContainer {
        width: number;
        height: number;
        fontName: string;
        fontSize: number;
        tint: string;

        constructor(text: string, style: IBitmapTextStyle);
        setText(text: string): void;
        setStyle(style: IBitmapTextStyle): void;
    }

    export class BlurFilter extends AbstractFilter {
        blur: number;
        blurX: number;
        blurY: number;
    }

    export class CanvasMaskManager {
        pushMask(maskData: IMaskData, context: CanvasRenderingContext2D): void;
        popMask(context: CanvasRenderingContext2D): void;
    }

    export class CanvasRenderer implements IPixiRenderer {
        type: number;
        clearBeforeRender: boolean;
        roundPixels: boolean;
        transparent: boolean;
        width: number;
        height: number;
        view: HTMLCanvasElement;
        context: CanvasRenderingContext2D;
        refresh: boolean;
        count: number;
        maskManager: CanvasMaskManager;
        renderSession: IRenderSession;

        constructor(width: number, height: number, view?: HTMLCanvasElement, transparent?: boolean);
        render(stage: Stage): void;
        resize(width: number, height: number): void;
    }

    export class CanvasTinter {
        canvas: HTMLCanvasElement;

        getTintedTexture(sprite: Sprite, color: number): HTMLCanvasElement;
        tintWithMultiply(texture: Texture, color: number, canvas: HTMLCanvasElement): void;
        tintWithOverlay(texture: Texture, color: number, canvas: HTMLCanvasElement): void;
        tintWithPerPixel(texture: Texture, color: number, canvas: HTMLCanvasElement): void;

        static cacheStepsPerColorChannel: number;
        static convertTintToImage: boolean;
        static canUseMultiply: boolean;
        static tintMethod: ITintMethod;

        static roundColor(color: number): number;
    }

    export class Circle implements IHitArea {
        x: number;
        y: number;
        radius: number;

        constructor(x: number, y: number, radius: number);
        clone(): Circle;
        contains(x: number, y: number): boolean;
    }

    export class ColorMatrixFilter extends AbstractFilter {
        matrix: number[];
    }

    export class ColorStepFilter extends AbstractFilter {
        step: number;
    }

    export class DisplacementFilter extends AbstractFilter {
        map: Texture;
        offset: Point;
        scale: Point;

        constructor(texture: Texture);
    }

    export class DisplayObject {
        alpha: number;
        buttonMode: boolean;
        defaultCursor: string;
        filterArea: Rectangle;
        filters: AbstractFilter[];
        hitArea: IHitArea;
        interactive: boolean;
        mask: Graphics;
        parent: DisplayObjectContainer;
        pivot: Point;
        position: Point;
        renderable: boolean;
        rotation: number;
        scale: Point;
        stage: Stage;
        visible: boolean;
        worldAlpha: number;
        worldVisible: boolean;
        x: number;
        y: number;

        click(e: InteractionData): void;
        getBounds(): Rectangle;
        getLocalBounds(): Rectangle;
        mousedown(e: InteractionData): void;
        mouseout(e: InteractionData): void;
        mouseover(e: InteractionData): void;
        mouseup(e: InteractionData): void;
        mouseupoutside(e: InteractionData): void;
        setStateReference(stage: Stage): void;
        tap(e: InteractionData): void;
        touchend(e: InteractionData): void;
        touchendoutside(e: InteractionData): void;
        touchstart(e: InteractionData): void;
        touchmove(e: InteractionData): void;
    }

    export class DisplayObjectContainer extends DisplayObject {
        height: number;
        width: number;
        children: DisplayObject[];
        constructor();
        addChild(child: DisplayObject): void;
        addChildAt(child: DisplayObject, index: number): void;
        getChildAt(index: number): DisplayObject;
        removeChild(child: DisplayObject): DisplayObject;
        removeChildAt(index:number ): DisplayObject;
        removeStageReference(): void;
    }

    export class Ellipse implements IHitArea {
        x: number;
        y: number;
        width: number;
        height: number;

        constructor(x: number, y: number, width: number, height: number);
        clone(): Ellipse;
        contains(x: number, y: number): boolean;
        getBounds(): Rectangle;
    }

    export class EventTarget {
        listeners: { [key: string]: IEventCallback[] };

        addEventListener(type: string, listener: IEventCallback): void;
        dispatchEvent(event: IEvent): void;
        removeAllEventListeners(type: string): void;
        removeEventListener(type: string, listener: IEventCallback): void;
    }

    export class FilterTexture {
        fragmentSrc: string[];
        gl: WebGLRenderingContext;
        program: WebGLProgram;

        constructor(gl: WebGLRenderingContext, width: number, height: number);
        clear(): void;
        resize(width: number, height: number): void;
        destroy(): void;
    }

    export class Graphics extends DisplayObjectContainer {
        blendMode: blendModes;
        bounds: Rectangle;
        boundsPadding: number;
        fillAlpha: number;
        isMask: boolean;
        lineColor: string;
        lineWidth: number;
        tint: number;

        beginFill(color: number, alpha?: number): void;
        clear(): void;
        drawCircle(x: number, y: number, radius: number): void;
        drawEllipse(x: number, y: number, width: number, height: number): void;
        drawRect(x: number, y: number, width: number, height: number): void;
        endFill(): void;
        generateTexture(): Texture;
        getBounds(): Rectangle;
        lineStyle(lineWidth: number, color: number, alpha: number): void;
        lineTo(x: number, y: number): void;
        moveTo(x: number, y: number): void;
        updateBounds(): void;
    }

    export class GrayFilter extends AbstractFilter {
        gray: number;
    }

    export class ImageLoader extends EventTarget {
        texture: Texture;

        constructor(url: string, crossorigin?: boolean);
        load(): void;
        loadFramedSpriteSheet(frameWidth: number, frameHeight: number, textureName: string): void;
    }

    export class InteractionData {
        global: Point;
        target: Sprite;
        originalEvent: Event;

        getLocalPosition(displayObject: DisplayObject): Point;
    }

    export class InteractionManager {
        currentCursorStyle: string;
        mouse: InteractionData;
        mouseOut: boolean;
        mouseoverEnabled: boolean;
        pool: InteractionData[];
        stage: Stage;
        touchs: { [id: string]: InteractionData };

        constructor(stage: Stage);
    }

    export class InvertFilter {
        invert: number;
    }

    export class JsonLoader extends EventTarget {
        baseUrl: string;
        crossorigin: boolean;
        loaded: boolean;
        url: string;

        constructor(url: string, crossorigin?: boolean);
        load(): void;
    }

    export class MovieClip extends Sprite {
        animationSpeed: number;
        currentFrame: number;
        loop: boolean;
        playing: boolean;
        textures: Texture[];
        totalFrames: number;

        constructor(textures: Texture[]);
        onComplete: IBasicCallback;
	static fromFrames(frames: string[]): MovieClip;
	static fromImages(images: string[]): MovieClip;

        gotoAndPlay(frameNumber: number): void;
        gotoAndStop(frameNumber: number): void;
        play(): void;
        stop(): void;
    }

    export class NormalMapFilter extends AbstractFilter {
        map: Texture;
        offset: Point;
        scale: Point;
    }

    export class PixelateFilter extends AbstractFilter {
        size: number;
    }

    export class PixiFastShader {
        gl: WebGLRenderingContext;
        fragmentSrc: string[];
        program: WebGLProgram;
        textureCount: number;
        vertexSrc: string[];

        constructor(gl: WebGLRenderingContext);
        destroy(): void;
        init(): void;
    }

    export class PixiShader {
        defaultVertexSrc: string;
        fragmentSrc: string[];
        gl: WebGLRenderingContext;
        program: WebGLProgram;
        textureCount: number;
        attributes: IShaderAttribute[];

        constructor(gl: WebGLRenderingContext);
        destroy(): void;
        init(): void;
        initSampler2D(): void;
        initUniforms(): void;
        syncUniforms(): void;
    }

    export class Point {
        x: number;
        y: number;

        constructor(x?: number, y?: number);
        clone(): Point;
        set(x: number, y: number): void;
    }

    export class Polygon implements IHitArea {
        points: Point[];

        constructor(points: Point[]);
        constructor(points: number[]);
        constructor(...points: Point[]);
        constructor(...points: number[]);

        clone(): Polygon;
        contains(x: number, y: number): boolean;
    }

    export class Rectangle implements IHitArea {
        x: number;
        y: number;
        width: number;
        height: number;

        constructor(x?: number, y?: number, width?: number, height?: number);
        clone(): Rectangle;
        contains(x: number, y: number): boolean
    }

    export class Rope {
        points: Point[];
        vertices: Float32Array;
        uvs: Float32Array;
        colors: Float32Array;
        indices: Uint16Array;

        constructor(texture: Texture, points: Point[]);
        refresh();
        setTexture(texture: Texture);
    }

    export class scaleModes {
        public static DEFAULT: number;
        public static LINEAR: number;
        public static NEAREST: number;
    }

    export class SepiaFilter {
        sepia: number;
    }

    export class Spine {
        url: string;
        crossorigin: boolean;
        loaded: boolean;

        constructor(url: string);
        load();
    }

    export class Sprite extends DisplayObjectContainer {
        anchor: Point;
        blendMode: number;
        texture: Texture;
        height: number;
        width: number;
        tint: number;

        constructor(texture: Texture);
        getBounds(): Rectangle;
        setTexture(texture: Texture): void;

        static fromFrame(frameId: string): Sprite;
        static fromImage(url: string): Sprite;
    }

    export class SpriteBatch extends PIXI.DisplayObjectContainer {
        constructor(texture?: Texture);
    }

    /* TODO determine type of frames */
    export class SpriteSheetLoader extends EventTarget {
        url: string;
        crossorigin: boolean;
        baseUrl: string;
        texture: Texture;
        frames: Object;

        constructor(url: string, crossorigin?: boolean);
        load();
    }

    export class Stage extends DisplayObjectContainer {
        interactive: boolean;
        interactionManager: InteractionManager;

        constructor(backgroundColor: number);
        getMousePosition(): Point;
        setBackgroundColor(backgroundColor: number): void;
        setInteractionDelegate(domElement: HTMLElement): void;
    }

    export class Strip extends DisplayObjectContainer {
        constructor(texture: Texture, width: number, height: number);
    }

    export class Text extends Sprite {
        canvas: HTMLCanvasElement;
        context: CanvasRenderingContext2D;

        constructor(text: string, style?: ITextStyle);
        destroy(destroyTexture: boolean): void;
        setText(text: string): void;
        setStyle(style: ITextStyle): void;
    }

    export class Texture extends EventTarget {
        baseTexture: BaseTexture;
        frame: Rectangle;
        crop: Rectangle;
        trim: Point;
        width: number;
        height: number;

        constructor(baseTexture: BaseTexture, frame?: Rectangle);
        destroy(destroyBase: boolean): void;
        setFrame(frame: Rectangle): void;
        render(displayObject: DisplayObject, position?: Point, clear?: boolean): void;
        on(event: string, callback: Function): void;

        static fromImage(imageUrl: string, crossorigin?: boolean, scaleMode?: scaleModes): Texture;
        static fromFrame(frameId: string): Texture;
        static fromCanvas(canvas: HTMLCanvasElement, scaleMode?: scaleModes): Texture;
        static addTextureToCache(texture: Texture, id: string): void;
        static removeTextureFromCache(id: string): Texture;
    }

    export class TilingSprite extends DisplayObjectContainer {
        width: number;
        height: number;
        renderable: boolean;
        texture: Texture;
        tint: number;
        tilePosition: Point;
        tileScale: Point;
        tileScaleOffset: Point;
        blendMode: blendModes;

        constructor(texture: Texture, width: number, height: number);
        generateTilingTexture(forcePowerOfTwo: boolean): void;
    }

    export class TwistFilter extends AbstractFilter {
        size: Point;
        angle: number;
        radius: number;
    }

    export class WebGLFilterManager {
        filterStack: AbstractFilter[];
        transparent: boolean;
        offsetX: number;
        offsetY: number;

        constructor(gl: WebGLRenderingContext, transparent: boolean);
        setContext(gl: WebGLRenderingContext);
        begin(renderSession: IRenderSession, buffer: ArrayBuffer): void;
        pushFilter(filterBlock: IFilterBlock): void;
        popFilter(): void;
        applyFilterPass(filter: AbstractFilter, filterArea: Texture, width: number, height: number): void;
        initShaderBuffers(): void;
        destroy(): void;
    }

    export class WebGLGraphics { }

    export class WebGLMaskManager {
        constructor(gl: WebGLRenderingContext);
        setContext(gl: WebGLRenderingContext);
        pushMask(maskData: any[], renderSession: IRenderSession): void;
        popMask(renderSession: IRenderSession): void;
        destroy(): void;
    }

    export class WebGLRenderer implements IPixiRenderer {
        type: number;
        contextLost: boolean;
        width: number;
        height: number;
        transparent: boolean;
        view: HTMLCanvasElement;

        constructor(width: number, height: number, view?: HTMLCanvasElement, transparent?: boolean, antialias?: boolean);
        destroy(): void;
        render(stage: Stage): void;
        renderDisplayObject(displayObject: DisplayObject, projection: Point, buffer: WebGLBuffer): void;
        resize(width: number, height: number): void;

        static createWebGLTexture(texture: Texture, gl: WebGLRenderingContext): void;
    }

    export class WebGLShaderManager {
        activatePrimitiveShader(): void;
        activateShader(shader: PixiShader): void;
        deactivatePrimitiveShader(): void;
        destroy(): void;
        setAttribs(attribs: IShaderAttribute[]): void;
        setContext(gl: WebGLRenderingContext, transparent: boolean);
    }

    export class WebGLSpriteBatch {
        indices: Uint16Array;
        size: number;
        vertices: Float32Array;
        vertSize: number;

        constructor(gl: WebGLRenderingContext);
        begin(renderSession: IRenderSession): void;
        flush(): void;
        end(): void;
        destroy(): void;
        render(sprite: Sprite): void;
        renderTilingSprite(sprite: TilingSprite): void;
        setBlendMode(blendMode: blendModes): void;
        setContext(gl: WebGLRenderingContext): void;
        start(): void;
        stop(): void;
    }
    
    export class RenderTexture extends Texture{
		width:number;
		height:number;
		frame:Rectangle;
		baseTexture:BaseTexture;
		renderer:IPixiRenderer;

		constructor(width, height, renderer?, scaleMode?);
		resize(width, height);
		renderWebGL(displayObject:DisplayObject, position, clear);
		renderCanvas(displayObject:DisplayObject, position, clear);

	}
	
}

declare function requestAnimFrame( animate: PIXI.IBasicCallback );

declare module PIXI.PolyK {
    export function Triangulate(p: number[]): number[];
}
