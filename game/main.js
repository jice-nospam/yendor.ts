var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
/*
Section: Console
*/
var Yendor;
(function (Yendor) {
    

    /*
    Class: ColorUtils
    Some color manipulation utilities.
    */
    var ColorUtils = (function () {
        function ColorUtils() {
        }
        /*
        Function: multiply
        Multiply a color with a number.
        > (r,g,b) * n == (r*n, g*n, b*n)
        
        Parameters:
        color - the color
        coef - the factor
        
        Returns:
        A new color
        */
        ColorUtils.multiply = function (color, coef) {
            var rgb = ColorUtils.toRgb(color);
            var r = Math.round(rgb[0] * coef);
            var g = Math.round(rgb[1] * coef);
            var b = Math.round(rgb[2] * coef);
            return 'rgb(' + r + ',' + g + ',' + b + ')';
        };

        /*
        Function: toRgb
        Convert a string color into a [r,g,b] number array.
        
        Parameters:
        color - the color
        
        Returns:
        An array of 3 numbers [r,g,b] between 0 and 255.
        */
        ColorUtils.toRgb = function (color) {
            color = color.toLowerCase();
            var stdColValues = ColorUtils.stdCol[String(color)];
            if (stdColValues) {
                return stdColValues;
            }
            if (color.charAt(0) == '#') {
                // #FFF or #FFFFFF format
                if (color.length == 4) {
                    // expand #FFF to #FFFFFF
                    color = '#' + color.charAt(1) + color.charAt(1) + color.charAt(2) + color.charAt(2) + color.charAt(3) + color.charAt(3);
                }
                var num = parseInt(color.substr(1), 16);
                return [num >> 16, num >> 8 & 0xFF, num & 0xFF];
            } else if (color.indexOf('rgb(') == 0) {
                // rgb(r,g,b) format
                var rgbList = color.substr(4, color.length - 5).split(',');
                return [parseInt(rgbList[0]), parseInt(rgbList[1]), parseInt(rgbList[2])];
            }
            return [0, 0, 0];
        };

        /*
        Function: toNumber
        Convert a string color into a number.
        
        Parameters:
        color - the color
        
        Returns:
        A number between 0x000000 and 0xFFFFFF.
        */
        ColorUtils.toNumber = function (color) {
            var rgb = ColorUtils.toRgb(color);
            return rgb[0] * 65536 + rgb[1] * 256 + rgb[2];
        };
        ColorUtils.stdCol = {
            'aqua': [0, 255, 255],
            'black': [0, 0, 0],
            'blue': [0, 0, 255],
            'fuchsia': [255, 0, 255],
            'gray': [128, 128, 128],
            'green': [0, 128, 0],
            'lime': [0, 255, 0],
            'maroon': [128, 0, 0],
            'navy': [0, 0, 128],
            'olive': [128, 128, 0],
            'orange': [255, 165, 0],
            'purple': [128, 0, 128],
            'red': [255, 0, 0],
            'silver': [192, 192, 192],
            'teal': [0, 128, 128],
            'white': [255, 255, 255],
            'yellow': [255, 255, 0]
        };
        return ColorUtils;
    })();
    Yendor.ColorUtils = ColorUtils;

    /*
    Class: Position
    Stores the position of a cell in the console (column, row)
    */
    var Position = (function () {
        /*
        Constructor: constructor
        
        Parameters:
        _x : the column
        _y : the row
        */
        function Position(_x, _y) {
            if (typeof _x === "undefined") { _x = 0; }
            if (typeof _y === "undefined") { _y = 0; }
            this._x = _x;
            this._y = _y;
        }
        Object.defineProperty(Position.prototype, "x", {
            /*
            Property: x
            */
            get: function () {
                return this._x;
            },
            set: function (newValue) {
                this._x = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Position.prototype, "y", {
            /*
            Property: y
            */
            get: function () {
                return this._y;
            },
            set: function (newValue) {
                this._y = newValue;
            },
            enumerable: true,
            configurable: true
        });

        /*
        Function: moveTo
        Update this position.
        
        Parameters:
        x - the column
        y - the row
        */
        Position.prototype.moveTo = function (x, y) {
            this.x = x;
            this.y = y;
        };

        Position.distance = function (p1, p2) {
            var dx = p1.x - p2.x;
            var dy = p1.y - p2.y;
            return Math.sqrt(dx * dx + dy * dy);
        };
        return Position;
    })();
    Yendor.Position = Position;

    /*
    Class: Console
    An offscreen console that cannot be rendered on screen, but can be blit on other consoles.
    */
    var Console = (function () {
        /*
        Constructor: constructor
        
        Parameters:
        width - the number of columns
        height - the number of rows
        foreground - *optional* (default : white) default foreground color
        background - *optional* (default : black) default background color
        */
        function Console(_width, _height, foreground, background) {
            if (typeof foreground === "undefined") { foreground = 'white'; }
            if (typeof background === "undefined") { background = 'black'; }
            this._width = _width;
            this._height = _height;
            this.text = [];
            this.clearText();
            this.fore = this.newColorTable();
            this.back = this.newColorTable();
            this.clearFore(foreground);
            this.clearBack(background);
        }
        Object.defineProperty(Console.prototype, "height", {
            /*
            Property: height
            The number of rows (read-only)
            */
            get: function () {
                return this._height;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Console.prototype, "width", {
            /*
            Property: width
            The number of columns (read-only)
            */
            get: function () {
                return this._width;
            },
            enumerable: true,
            configurable: true
        });

        /*
        Function: render
        To be implemented by non offscreen consoles extending this class.
        */
        Console.prototype.render = function () {
        };

        /*
        Function: getPositionFromPixels
        Convert mouse coordinates relative to the document to console position.
        To be implemented by non offscreen consoles extending this class.
        
        Parameters:
        x - the mouse x coordinate in pixels relative to the document
        y - the mouse y coordinate in pixels relative to the document
        
        Returns:
        The <Position> in the console.
        */
        Console.prototype.getPositionFromPixels = function (x, y) {
            return undefined;
        };

        /*
        Function: setChar
        Change a character in the console
        
        Parameters:
        x - the column
        y - the row
        char - the new character (must be a one character string)
        */
        Console.prototype.setChar = function (x, y, char) {
            var s = this.text[y].substr(0, x) + char[0] + this.text[y].substr(x + 1);
            this.text[y] = s;
        };

        /*
        Function: print
        Print a string on the console. If the string starts before the first column (x < 0) or ends after the last rows, it's truncated.
        
        Parameters:
        x - the column of the string's first character
        y - the row
        text - the string to print
        color - *optional* (default white)
        */
        Console.prototype.print = function (x, y, text, color) {
            if (typeof color === "undefined") { color = 'white'; }
            var begin = 0;
            var end = text.length;
            if (x + end > this.width) {
                end = this.width - x;
            }
            if (x < 0) {
                end += x;
                x = 0;
            }
            this.clearFore(color, x, y, end, 1);
            for (var i = begin; i < end; ++i) {
                this.setChar(x + i, y, text[i]);
            }
        };

        /*
        Function: clearText
        Erase all the text on the console (don't change foreground/background colors)
        */
        Console.prototype.clearText = function () {
            for (var i = 0; i < this.height; i++) {
                this.text[i] = this.emptyLine();
            }
        };

        /*
        Function: clearFore
        Change all the foreground colors of a rectangular zone. If width and height are undefined, fills the area to the border of the console.
        Using
        > console.clearFore('red');
        fills the whole console foreground with red.
        
        Parameters:
        value - new foreground color
        x - *optional* (default 0) top left column
        y - *optional* (default 0) top left row
        width - *optional* the rectangle width
        height - *optional* the rectangle height
        */
        Console.prototype.clearFore = function (value, x, y, width, height) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            if (typeof width === "undefined") { width = -1; }
            if (typeof height === "undefined") { height = -1; }
            this.clearColorTable(this.fore, value, x, y, width, height);
        };

        /*
        Function: clearBack
        Change all the background colors of a rectangular zone. If width and height are undefined, fills the area to the border of the console.
        Using
        > console.clearBack('red');
        fills the whole console background with red.
        
        Parameters:
        value - new background color
        x - *optional* (default 0) top left column
        y - *optional* (default 0) top left row
        width - *optional* the rectangle width
        height - *optional* the rectangle height
        */
        Console.prototype.clearBack = function (value, x, y, width, height) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            if (typeof width === "undefined") { width = -1; }
            if (typeof height === "undefined") { height = -1; }
            this.clearColorTable(this.back, value, x, y, width, height);
        };

        /*
        Function: blit
        Copy a part of a console on another console.
        
        Parameters:
        console - the destination console
        x - *optional* (default 0) column where to blit on the destination console
        y - *optional* (default 0) row where to blit on the destination console
        xSrc - *optional* (default 0) top left column of the area to copy on the source console
        ySrc - *optional* (default 0) top left row of the area to copy on the source console
        srcWidth - *optional* width of the area to copy
        srcHeight - *optional* height of the area to copy
        */
        Console.prototype.blit = function (console, x, y, xSrc, ySrc, srcWidth, srcHeight) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            if (typeof xSrc === "undefined") { xSrc = 0; }
            if (typeof ySrc === "undefined") { ySrc = 0; }
            if (typeof srcWidth === "undefined") { srcWidth = -1; }
            if (typeof srcHeight === "undefined") { srcHeight = -1; }
            if (srcWidth == -1) {
                srcWidth = this.width;
            }
            if (srcHeight == -1) {
                srcHeight = this.height;
            }
            if (x + srcWidth > console.width) {
                srcWidth = console.width - x;
            }
            if (y + srcHeight > console.height) {
                srcHeight = console.height - y;
            }
            for (var desty = y; desty < y + srcHeight; ++desty) {
                for (var destx = x; destx < x + srcWidth; ++destx) {
                    var sourcex = xSrc + destx - x;
                    var sourcey = ySrc + desty - y;
                    console.setChar(destx, desty, this.text[sourcey][sourcex]);
                    console.back[destx][desty] = this.back[sourcex][sourcey];
                    console.fore[destx][desty] = this.fore[sourcex][sourcey];
                }
            }
        };

        Console.prototype.clearColorTable = function (table, value, x, y, width, height) {
            if (typeof x === "undefined") { x = 0; }
            if (typeof y === "undefined") { y = 0; }
            if (typeof width === "undefined") { width = -1; }
            if (typeof height === "undefined") { height = -1; }
            if (width == -1) {
                width = this.width - x;
            }
            if (height == -1) {
                height = this.height - y;
            }
            for (var cy = y; cy < y + height; ++cy) {
                for (var cx = x; cx < x + width; ++cx) {
                    table[cx][cy] = value;
                }
            }
        };

        Console.prototype.newColorTable = function () {
            var table = [];
            for (var i = 0; i < this.width; i++) {
                table[i] = [];
            }
            return table;
        };

        Console.prototype.emptyLine = function () {
            var s = '';
            for (var i = 0; i < this.width; i++) {
                s += ' ';
            }
            return s;
        };
        return Console;
    })();
    Yendor.Console = Console;

    /*
    Class: DivConsole
    A console that can be rendered as divs (one per row) filled with spans.
    */
    var DivConsole = (function (_super) {
        __extends(DivConsole, _super);
        /*
        Constructor: constructor
        
        Parameters:
        width - number of columns
        height - number of rows
        foreground - default foreground color
        background - default background color
        divSelector - JQuery selector for the element where to render this console
        */
        function DivConsole(_width, _height, foreground, background, divSelector) {
            _super.call(this, _width, _height, foreground, background);
            this.divSelector = divSelector;
            this.div = $(divSelector)[0];
            this.computeCharSize();
        }
        /*
        Function: computeCharSize
        Compute the size of a character in pixels. This is needed to convert mouse coordinates from pixels to console position.
        */
        DivConsole.prototype.computeCharSize = function () {
            // insert a single (invisible) character in the console
            this.text[0][0] = '@';
            this.fore[0][0] = 'black';
            this.render();

            // get the resulting span size
            var oldId = this.div.id;
            this.div.id = '__yendor_div';
            var span = $('#__yendor_div div.line span');
            this.charWidth = span.width();
            this.charHeight = span.height();
            console.log('Char size : ' + this.charWidth + ' x ' + this.charHeight);

            // restore the console
            this.div.id = oldId;
            this.text[0][0] = ' ';
            this.fore[0][0] = this.fore[0][1];
            this.render();
        };

        /*
        Function: render
        Update the content of the HTML element
        */
        DivConsole.prototype.render = function () {
            this.div.innerHTML = this.getHTML();
        };

        /*
        Function: getPositionFromPixels
        Returns the column and row corresponding to a mouse position in the page.
        
        Parameters:
        x - the mouse x coordinate in pixels relative to the document
        y - the mouse y coordinate in pixels relative to the document
        
        Returns:
        The <Position> in the console.
        */
        DivConsole.prototype.getPositionFromPixels = function (x, y) {
            var dx = x - $(this.divSelector).offset().left;
            var dy = y - $(this.divSelector).offset().top;
            return new Position(Math.floor(dx / this.charWidth), Math.floor(dy / this.charHeight));
        };

        /*
        Function: getHTML
        
        Returns:
        A HTML representation of the console
        */
        DivConsole.prototype.getHTML = function () {
            var s = '';
            for (var i = 0; i < this.height; i++) {
                s += "<div class='line'>" + this.getLineHTML(i) + '</div>';
            }
            return s;
        };

        DivConsole.prototype.getLineHTML = function (line) {
            var currentFore = this.fore[0][line];
            var currentBack = this.back[0][line];
            var s = '<span style="color:' + currentFore + ';background-color:' + currentBack + '">' + this.text[line][0];
            for (var i = 1; i < this.width; i++) {
                var nextFore = this.fore[i][line];
                var nextBack = this.back[i][line];
                if (nextFore != currentFore || nextBack != currentBack) {
                    currentFore = nextFore;
                    currentBack = nextBack;
                    s += '</span><span style="color:' + currentFore + ';background-color:' + currentBack + '">';
                }
                s += this.text[line][i];
            }
            s += '</span>';
            return s;
        };
        return DivConsole;
    })(Console);
    Yendor.DivConsole = DivConsole;
})(Yendor || (Yendor = {}));
/// <reference path="../decl/pixi.d.ts" />
/// <reference path="../yendor/yendor.ts" />
/*
Section: Console
*/
var Yendor;
(function (Yendor) {
    /*
    Class: PixiConsole
    A console that can be rendered as WebGL or canvas using pixi.js.
    */
    var PixiConsole = (function (_super) {
        __extends(PixiConsole, _super);
        /*
        Constructor: constructor
        
        Parameters:
        width - number of columns
        height - number of rows
        foreground - default foreground color
        background - default background color
        canvasSelector - JQuery selector for the canvas where to render this console
        fontUrl - URL of the image containing the font
        */
        function PixiConsole(_width, _height, foreground, background, canvasSelector, fontUrl) {
            _super.call(this, _width, _height, foreground, background);
            this.canvasSelector = canvasSelector;
            this.canvas = $(canvasSelector)[0];
            this.stage = new PIXI.Stage(0x888888);
            this.renderer = PIXI.autoDetectRenderer(640, 480, { antialias: false, clearBeforeRender: false, preserveDrawingBuffer: true, resolution: 1, transparent: false, view: this.canvas });
            var gameContainer = new PIXI.SpriteBatch();
            this.font = PIXI.BaseTexture.fromImage(fontUrl, false, PIXI.scaleModes.NEAREST);
            this.charWidth = this.font.width / 16;
            this.charHeight = this.font.width / 16;
            this.stage.addChild(gameContainer);
            this.cells = [];
            this.chars = [];
            for (var x = 0; x < 16; x++) {
                for (var y = 0; y < 16; y++) {
                    var rect = new PIXI.Rectangle(y * this.charHeight, x * this.charWidth, this.charWidth, this.charHeight);
                    this.chars[x + y * 16] = new PIXI.Texture(this.font, rect);
                }
            }
            for (var x = 0; x < this.width; x++) {
                this.cells[x] = [];
                for (var y = 0; y < this.height; y++) {
                    var rect = new PIXI.Rectangle(0, 0, this.charWidth, this.charHeight);
                    var cell = new PIXI.Sprite(this.chars[32]);
                    cell.position.x = x * this.charWidth;
                    cell.position.y = y * this.charHeight;
                    cell.tint = 0xFF0000;
                    this.cells[x][y] = cell;
                    gameContainer.addChild(cell);
                }
            }
        }
        /*
        Function: render
        Update the content of the canvas
        */
        PixiConsole.prototype.render = function () {
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    var ascii = this.text[y].charCodeAt(x);
                    this.cells[x][y].texture = this.chars[ascii];
                    this.cells[x][y].tint = 0xFF0000; //ColorUtils.toNumber(this.fore[x][y]);
                }
            }
            this.renderer.render(this.stage);
        };

        /*
        Function: getPositionFromPixels
        Returns the column and row corresponding to a mouse position in the page.
        
        Parameters:
        x - the mouse x coordinate in pixels relative to the document
        y - the mouse y coordinate in pixels relative to the document
        
        Returns:
        The <Position> in the console.
        */
        PixiConsole.prototype.getPositionFromPixels = function (x, y) {
            var dx = x - $(this.canvasSelector).offset().left;
            var dy = y - $(this.canvasSelector).offset().top;
            return new Yendor.Position(Math.floor(dx / this.charWidth), Math.floor(dy / this.charHeight));
        };
        return PixiConsole;
    })(Yendor.Console);
    Yendor.PixiConsole = PixiConsole;
})(Yendor || (Yendor = {}));
/*
Section: Random number generator
*/
var Yendor;
(function (Yendor) {
    

    /*
    Class: ComplementaryMultiplyWithCarryRandom
    Implements a RNG using <complementary multiply with carry at https://en.wikipedia.org/wiki/Multiply-with-carry> algorithm by George Marsaglia.
    */
    var ComplementaryMultiplyWithCarryRandom = (function () {
        /*
        Constructor: constructor
        
        Parameters:
        seed - *optional* use the same seed twice to get the same list of numbers. If not defined, a random seed is used.
        */
        function ComplementaryMultiplyWithCarryRandom(seed) {
            this.cur = 0;
            if (!seed) {
                seed = Math.floor(Math.random() * 0x7FFFFFFF);
            }

            // fill the Q array with pseudorandom seeds
            var s = seed;
            this.Q = [];
            for (var i = 0; i < 4096; i++) {
                s = ((s * 1103515245) + 12345) % 0x100000000; // glibc LCG
                this.Q[i] = s;
            }
            this.c = ((s * 1103515245) + 12345) % 809430660; // this max value is recommended by George Marsaglia
        }
        ComplementaryMultiplyWithCarryRandom.prototype.getNumber = function (min, max) {
            if (max == min) {
                return min;
            }
            if (max < min) {
                var tmp = max;
                max = min;
                min = tmp;
            }
            var delta = max - min + 1;
            return (Math.abs(this.getCMWCNumber() % delta)) + min;
        };

        ComplementaryMultiplyWithCarryRandom.prototype.getCMWCNumber = function () {
            var t;
            var x;
            this.cur = (this.cur + 1) % 4096;
            t = 18782 * this.Q[this.cur] + this.c;
            this.c = Math.floor(t / (2 ^ 32));
            x = (t + this.c) % 0x100000000;
            if (x < this.c) {
                x++;
                this.c++;
            }
            if ((x + 1) == 0) {
                this.c++;
                x = 0;
            }
            this.Q[this.cur] = 0xfffffffe - x;
            return this.Q[this.cur];
        };
        return ComplementaryMultiplyWithCarryRandom;
    })();
    Yendor.ComplementaryMultiplyWithCarryRandom = ComplementaryMultiplyWithCarryRandom;
})(Yendor || (Yendor = {}));
/// <reference path="rng.ts" />
/*
Section: Binary space partition tree.
*/
var Yendor;
(function (Yendor) {
    (function (BSPTraversalOrder) {
        BSPTraversalOrder[BSPTraversalOrder["PRE_ORDER"] = 0] = "PRE_ORDER";
        BSPTraversalOrder[BSPTraversalOrder["IN_ORDER"] = 1] = "IN_ORDER";
        BSPTraversalOrder[BSPTraversalOrder["POST_ORDER"] = 2] = "POST_ORDER";
        BSPTraversalOrder[BSPTraversalOrder["LEVEL_ORDER"] = 3] = "LEVEL_ORDER";
        BSPTraversalOrder[BSPTraversalOrder["INVERTED_LEVEL_ORDER"] = 4] = "INVERTED_LEVEL_ORDER";
    })(Yendor.BSPTraversalOrder || (Yendor.BSPTraversalOrder = {}));
    var BSPTraversalOrder = Yendor.BSPTraversalOrder;

    /*
    Enum: BSPTraversalAction
    Value returned by the callback during a tree traversal.
    
    CONTINUE - continue the traversal to the next node.
    STOP - stop the traversal at this node.
    */
    (function (BSPTraversalAction) {
        BSPTraversalAction[BSPTraversalAction["CONTINUE"] = 0] = "CONTINUE";
        BSPTraversalAction[BSPTraversalAction["STOP"] = 1] = "STOP";
    })(Yendor.BSPTraversalAction || (Yendor.BSPTraversalAction = {}));
    var BSPTraversalAction = Yendor.BSPTraversalAction;

    /*
    Class: BSPNode
    A binary space partition toolkit, making it easy to build, split and traverse a BSP tree.
    */
    var BSPNode = (function () {
        /*
        Constructor: constructor
        
        Parameters:
        x - left coordinate of the node region.
        y - top coordinate of the node region.
        w - the node region's width
        h - the node region's height
        */
        function BSPNode(x, y, w, h, level) {
            this.level = 0;
            this.x = x;
            this.y = y;
            this.w = w;
            this.h = h;
            if (level) {
                this.level = level;
            }
        }
        /*
        Group: inspecting the tree
        
        Function: isLeaf
        Returns:
        true is this node is a leaf (has no children).
        */
        BSPNode.prototype.isLeaf = function () {
            return (!this.leftChild);
        };

        /*
        Function: contains
        Check if a point is inside this node's region.
        
        Parameters:
        px - the point x coordinate.
        py - the point y coordinate.
        
        Returns:
        true if the point is inside the node's region.
        */
        BSPNode.prototype.contains = function (px, py) {
            return px >= this.x && py >= this.y && px <= this.x + this.w && py <= this.y + this.h;
        };

        /*
        Function: containsNode
        Check if a node is inside this node's region.
        
        Parameters:
        node - the node
        
        Returns:
        true if node is inside *this*.
        */
        BSPNode.prototype.containsNode = function (node) {
            return this.x <= node.x && this.y <= node.y && this.x + this.w >= node.x + node.w && this.y + this.h >= node.y + node.h;
        };

        /*
        Function: findNode
        Find the smallest node in the tree containing a point.
        
        Parameters:
        px - the point x coordinate.
        py - the point y coordinate.
        
        Returns:
        the smallest BSPNode in the hierarchy that contains the point, or *undefined* if the point is outside the tree.
        */
        BSPNode.prototype.findNode = function (px, py) {
            if (this.contains(px, py)) {
                if (this.leftChild && this.leftChild.contains(px, py)) {
                    return this.leftChild.findNode(px, py);
                }
                if (this.rightChild && this.rightChild.contains(px, py)) {
                    return this.rightChild.findNode(px, py);
                }
                return this;
            }
            return undefined;
        };

        /*
        Group: building the tree
        
        Function: clear
        Remove this node's children, turning it into a leaf.
        */
        BSPNode.prototype.clear = function () {
            this.leftChild = undefined;
            this.rightChild = undefined;
            this.splitPos = undefined;
            this.horiz = undefined;
        };

        /*
        Function: split
        Split this node into two sub-nodes, either horizontally (the left child is on top of the right child)
        or vertically (the left child is left to the right child).
        
        Parameters:
        horiz - whether to split horizontally or vertically.
        splitPos - coordinate of the frontier.
        */
        BSPNode.prototype.split = function (horiz, splitPos) {
            this.horiz = horiz;
            this.splitPos = splitPos;
            if (horiz) {
                this.leftChild = new BSPNode(this.x, this.y, this.splitPos, this.h, this.level + 1);
                this.rightChild = new BSPNode(this.x + this.splitPos, this.y, this.w - this.splitPos, this.h, this.level + 1);
            } else {
                this.leftChild = new BSPNode(this.x, this.y, this.w, this.splitPos, this.level + 1);
                this.rightChild = new BSPNode(this.x, this.y + this.splitPos, this.w, this.h - this.splitPos, this.level + 1);
            }
        };

        /*
        Function: splitRecursive
        Recursively and randomly split this node and its children.
        
        Parameters:
        rng - random number generator to use or *undefined*.
        count - number of levels of the generated tree.
        minSize - *optional* don't split a node if the resulting child's region has a width or height smaller than minSize.
        maxHVRatio - *optional* don't split a node if the resulting child width/height or height/width ratio is greater than maxHVRatio.
        */
        BSPNode.prototype.splitRecursive = function (rng, count, minSize, maxHVRatio) {
            if (!rng) {
                rng = new Yendor.ComplementaryMultiplyWithCarryRandom();
            }
            var horiz;
            if (!minSize) {
                minSize = 0;
            } else {
                if (this.w < 2 * minSize || this.h < 2 * minSize) {
                    return;
                } else if (this.w < 2 * minSize) {
                    horiz = false;
                } else if (this.h < 2 * minSize) {
                    horiz = true;
                }
            }
            if (!horiz) {
                horiz = rng.getNumber(0, 1) == 0 ? false : true;
            }
            var splitPos = horiz ? rng.getNumber(minSize, this.w - minSize) : rng.getNumber(minSize, this.h - minSize);
            this.split(horiz, splitPos);
            if (count > 1) {
                this.leftChild.splitRecursive(rng, count - 1, minSize, maxHVRatio);
                this.rightChild.splitRecursive(rng, count - 1, minSize, maxHVRatio);
            }
        };

        /*
        Group: traversing the tree
        Function: traversePreOrder
        Traverse the tree in pre-order (node, left child, right child).
        
        Parameters:
        callback - a function called when visiting a node.
        userData - *optional* some user data sent to the callback.
        */
        BSPNode.prototype.traversePreOrder = function (callback, userData) {
            if (callback(this, userData) == 1 /* STOP */) {
                return 1 /* STOP */;
            }
            if (this.leftChild) {
                if (this.leftChild.traversePreOrder(callback, userData) == 1 /* STOP */) {
                    return 1 /* STOP */;
                }
                if (this.rightChild.traversePreOrder(callback, userData) == 1 /* STOP */) {
                    return 1 /* STOP */;
                }
            }
            return 0 /* CONTINUE */;
        };

        /*
        Function: traverseInOrder
        Traverse the tree in in-order (left child, node, right child).
        
        Parameters:
        callback - a function called when visiting a node.
        userData - *optional* some user data sent to the callback.
        */
        BSPNode.prototype.traverseInOrder = function (callback, userData) {
            if (this.leftChild && this.leftChild.traverseInOrder(callback, userData) == 1 /* STOP */) {
                return 1 /* STOP */;
            }
            if (callback(this, userData) == 1 /* STOP */) {
                return 1 /* STOP */;
            }
            if (this.rightChild) {
                return this.rightChild.traverseInOrder(callback, userData);
            }
            return 0 /* CONTINUE */;
        };

        /*
        Function: traversePostOrder
        Traverse the tree in post-order (left child, right child, node).
        
        Parameters:
        callback - a function called when visiting a node.
        userData - *optional* some user data sent to the callback.
        */
        BSPNode.prototype.traversePostOrder = function (callback, userData) {
            if (this.leftChild) {
                if (this.leftChild.traversePostOrder(callback, userData) == 1 /* STOP */) {
                    return 1 /* STOP */;
                }
                if (this.rightChild.traversePostOrder(callback, userData) == 1 /* STOP */) {
                    return 1 /* STOP */;
                }
            }
            return callback(this, userData);
        };

        BSPNode.prototype.buildLevelTraversalNodeArray = function () {
            var nodesToTraverse = [];
            var nodes = [];
            nodes.push(this);
            while (nodes.length > 0) {
                var node = nodes.shift();
                nodesToTraverse.push(node);
                if (node.leftChild) {
                    nodes.push(node.leftChild);
                    nodes.push(node.rightChild);
                }
            }
            return nodesToTraverse;
        };

        /*
        Function: traverseLevelOrder
        Traverse the tree level by level (root, then root children, then level 2 children and so on).
        
        Parameters:
        callback - a function called when visiting a node.
        userData - *optional* some user data sent to the callback.
        */
        BSPNode.prototype.traverseLevelOrder = function (callback, userData) {
            var nodes = this.buildLevelTraversalNodeArray();
            var nodeCount = nodes.length;
            for (var i = 0; i < nodeCount; i++) {
                var node = nodes[i];
                if (callback(node, userData) == 1 /* STOP */) {
                    return 1 /* STOP */;
                }
            }
            return 0 /* CONTINUE */;
        };

        /*
        Function: traverseInvertedLevelOrder
        Traverse the tree level by level, starting with the lowest levels (lowest leafs, up to the root).
        
        Parameters:
        callback - a function called when visiting a node.
        userData - *optional* some user data sent to the callback.
        */
        BSPNode.prototype.traverseInvertedLevelOrder = function (callback, userData) {
            var nodes = this.buildLevelTraversalNodeArray();
            var nbNodes = nodes.length;
            for (var i = nbNodes - 1; i >= 0; i--) {
                var node = nodes[i];
                if (callback(node, userData) == 1 /* STOP */) {
                    return 1 /* STOP */;
                }
            }
            return 0 /* CONTINUE */;
        };
        return BSPNode;
    })();
    Yendor.BSPNode = BSPNode;
})(Yendor || (Yendor = {}));
// field of view algorithm : restrictive precise angle shadowcasting by Dominik Marczuk
// http://www.roguebasin.com/index.php?title=Restrictive_Precise_Angle_Shadowcasting
/*
Section: Field of view
*/
var Yendor;
(function (Yendor) {
    /*
    Class: Fov
    Stores the map properties and compute the field of view from a point.
    */
    var Fov = (function () {
        /*
        Constructor: constructor
        
        Parameters:
        width - the map width
        height - the map height
        */
        function Fov(_width, _height) {
            this._width = _width;
            this._height = _height;
            this._walkable = [];
            this._transparent = [];
            this._inFov = [];
            for (var x = 0; x < _width; x++) {
                this._walkable[x] = [];
                this._transparent[x] = [];
                this._inFov[x] = [];
            }
            this.startAngle = [];
            this.endAngle = [];
        }
        Object.defineProperty(Fov.prototype, "width", {
            /*
            Property: width
            Return the map width (read-only)
            */
            get: function () {
                return this._width;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Fov.prototype, "height", {
            /*
            Property: height
            Return the map height (read-only)
            */
            get: function () {
                return this._height;
            },
            enumerable: true,
            configurable: true
        });

        /*
        Function: isWalkable
        
        Parameters:
        x - x coordinate in the map
        y - y coordinate in the map
        
        Returns:
        true if the cell at coordinate x,y is walkable
        */
        Fov.prototype.isWalkable = function (x, y) {
            return this._walkable[x] ? this._walkable[x][y] : false;
        };

        /*
        Function: isTransparent
        
        Parameters:
        x - x coordinate in the map
        y - y coordinate in the map
        
        Returns:
        true if the cell at coordinate x,y is transparent (doesn't block field of view)
        */
        Fov.prototype.isTransparent = function (x, y) {
            return this._transparent[x] ? this._transparent[x][y] : false;
        };

        /*
        Function: isInFov
        This function always return false until <computeFov> has been called.
        
        Parameters:
        x - x coordinate in the map
        y - y coordinate in the map
        
        Returns:
        true if the cell at coordinate x,y is in the last computed field of view
        */
        Fov.prototype.isInFov = function (x, y) {
            return this._inFov[x] ? this._inFov[x][y] : false;
        };

        /*
        Function: setCell
        Define the properties of a map cell
        
        Parameters:
        x - x coordinate in the map
        y - y coordinate in the map
        walkable - whether a creature can walk on this cell
        transparent - whether a creature can see through this cell
        */
        Fov.prototype.setCell = function (x, y, walkable, transparent) {
            this._walkable[x][y] = walkable;
            this._transparent[x][y] = transparent;
        };

        /*
        Function: computeFov
        Compute the field of view using <restrictive precise angle shadowcasting
        at http://www.roguebasin.com/index.php?title=Restrictive_Precise_Angle_Shadowcasting> by Dominik Marczuk
        
        Parameters:
        x - x coordinate of the point of view
        y - y coordinate of the point of view
        maxRadius - maximum distance for a cell to be visible
        lightWalls - *optional* (default : true) whether walls are included in the field of view.
        */
        Fov.prototype.computeFov = function (x, y, maxRadius, lightWalls) {
            if (typeof lightWalls === "undefined") { lightWalls = true; }
            this.clearFov();
            this._inFov[x][y] = true;
            this.computeQuadrantVertical(x, y, maxRadius, lightWalls, 1, 1);
            this.computeQuadrantHorizontal(x, y, maxRadius, lightWalls, 1, 1);
            this.computeQuadrantVertical(x, y, maxRadius, lightWalls, 1, -1);
            this.computeQuadrantHorizontal(x, y, maxRadius, lightWalls, 1, -1);
            this.computeQuadrantVertical(x, y, maxRadius, lightWalls, -1, 1);
            this.computeQuadrantHorizontal(x, y, maxRadius, lightWalls, -1, 1);
            this.computeQuadrantVertical(x, y, maxRadius, lightWalls, -1, -1);
            this.computeQuadrantHorizontal(x, y, maxRadius, lightWalls, -1, -1);
        };

        /*
        Function: clearFov
        Reset the field of view information. After this, <isInFov> returns false for all the cells.
        */
        Fov.prototype.clearFov = function () {
            for (var x = 0; x < this.width; x++) {
                for (var y = 0; y < this.height; y++) {
                    this._inFov[x][y] = false;
                }
            }
        };

        Fov.prototype.computeQuadrantVertical = function (xPov, yPov, maxRadius, lightWalls, dx, dy) {
            var y = yPov + dy;
            var done = false;
            var iteration = 1;
            var minAngle = 0;
            var lastLineObstacleCount = 0;
            var totalObstacleCount = 0;
            while (!done && y >= 0 && y < this.height) {
                var slopePerCell = 1 / iteration;
                var halfSlope = slopePerCell * 0.5;
                var processedCell = Math.floor((minAngle + halfSlope) / slopePerCell);
                var xMin = Math.max(0, xPov - iteration);
                var xMax = Math.min(this.width - 1, xPov + iteration);
                done = true;
                for (var x = xPov + processedCell * dx; x >= xMin && x <= xMax; x += dx) {
                    var centreSlope = processedCell * slopePerCell;
                    var startSlope = centreSlope - halfSlope;
                    var endSlope = centreSlope + halfSlope;
                    var visible = true;
                    var extended = false;
                    if (lastLineObstacleCount > 0 && !this.isInFov(x, y)) {
                        var idx = 0;
                        if (visible && !this.canSee(x, y - dy) && x - dx >= 0 && x - dx < this.width && !this.canSee(x - dx, y - dy)) {
                            visible = false;
                        } else {
                            while (visible && idx < lastLineObstacleCount) {
                                if (this.startAngle[idx] > endSlope || this.endAngle[idx] < startSlope) {
                                    ++idx;
                                } else {
                                    if (this.isTransparent(x, y)) {
                                        if (centreSlope > this.startAngle[idx] && centreSlope < this.endAngle[idx]) {
                                            visible = false;
                                        }
                                    } else {
                                        if (startSlope >= this.startAngle[idx] && endSlope <= this.endAngle[idx]) {
                                            visible = false;
                                        } else {
                                            this.startAngle[idx] = Math.min(this.startAngle[idx], startSlope);
                                            this.endAngle[idx] = Math.max(this.endAngle[idx], endSlope);
                                            extended = true;
                                        }
                                    }
                                    ++idx;
                                }
                            }
                        }
                    }
                    if (visible) {
                        this._inFov[x][y] = true;
                        done = false;

                        // if the cell is opaque, block the adjacent slopes
                        if (!this.isTransparent(x, y)) {
                            if (minAngle >= startSlope) {
                                minAngle = endSlope;

                                // if min_angle is applied to the last cell in line, nothing more
                                // needs to be checked.
                                if (processedCell == iteration) {
                                    done = true;
                                }
                            } else if (!extended) {
                                this.startAngle[totalObstacleCount] = startSlope;
                                this.endAngle[totalObstacleCount] = endSlope;
                                totalObstacleCount++;
                            }
                            if (!lightWalls) {
                                this._inFov[x][y] = false;
                            }
                        }
                    }
                    processedCell++;
                }
                if (iteration == maxRadius) {
                    done = true;
                }
                iteration++;
                lastLineObstacleCount = totalObstacleCount;
                y += dy;
                if (y < 0 || y >= this.height) {
                    done = true;
                }
            }
        };

        Fov.prototype.computeQuadrantHorizontal = function (xPov, yPov, maxRadius, lightWalls, dx, dy) {
            var x = xPov + dx;
            var done = false;
            var iteration = 1;
            var minAngle = 0;
            var lastLineObstacleCount = 0;
            var totalObstacleCount = 0;
            while (!done && x >= 0 && x < this.width) {
                var slopePerCell = 1 / iteration;
                var halfSlope = slopePerCell * 0.5;
                var processedCell = Math.floor((minAngle + halfSlope) / slopePerCell);
                var yMin = Math.max(0, yPov - iteration);
                var yMax = Math.min(this.height - 1, yPov + iteration);
                done = true;
                for (var y = yPov + processedCell * dy; y >= yMin && y <= yMax; y += dy) {
                    var centreSlope = processedCell * slopePerCell;
                    var startSlope = centreSlope - halfSlope;
                    var endSlope = centreSlope + halfSlope;
                    var visible = true;
                    var extended = false;
                    if (lastLineObstacleCount > 0 && !this.isInFov(x, y)) {
                        var idx = 0;
                        if (visible && !this.canSee(x - dx, y) && y - dy >= 0 && y - dy < this.height && !this.canSee(x - dx, y - dy)) {
                            visible = false;
                        } else {
                            while (visible && idx < lastLineObstacleCount) {
                                if (this.startAngle[idx] > endSlope || this.endAngle[idx] < startSlope) {
                                    ++idx;
                                } else {
                                    if (this.isTransparent(x, y)) {
                                        if (centreSlope > this.startAngle[idx] && centreSlope < this.endAngle[idx]) {
                                            visible = false;
                                        }
                                    } else {
                                        if (startSlope >= this.startAngle[idx] && endSlope <= this.endAngle[idx]) {
                                            visible = false;
                                        } else {
                                            this.startAngle[idx] = Math.min(this.startAngle[idx], startSlope);
                                            this.endAngle[idx] = Math.max(this.endAngle[idx], endSlope);
                                            extended = true;
                                        }
                                    }
                                    ++idx;
                                }
                            }
                        }
                    }
                    if (visible) {
                        this._inFov[x][y] = true;
                        done = false;

                        // if the cell is opaque, block the adjacent slopes
                        if (!this.isTransparent(x, y)) {
                            if (minAngle >= startSlope) {
                                minAngle = endSlope;

                                // if min_angle is applied to the last cell in line, nothing more
                                // needs to be checked.
                                if (processedCell == iteration) {
                                    done = true;
                                }
                            } else if (!extended) {
                                this.startAngle[totalObstacleCount] = startSlope;
                                this.endAngle[totalObstacleCount] = endSlope;
                                totalObstacleCount++;
                            }
                            if (!lightWalls) {
                                this._inFov[x][y] = false;
                            }
                        }
                    }
                    processedCell++;
                }
                if (iteration == maxRadius) {
                    done = true;
                }
                iteration++;
                lastLineObstacleCount = totalObstacleCount;
                x += dx;
                if (x < 0 || x >= this.width) {
                    done = true;
                }
            }
        };

        Fov.prototype.canSee = function (x, y) {
            return this.isInFov(x, y) && this.isTransparent(x, y);
        };
        return Fov;
    })();
    Yendor.Fov = Fov;
})(Yendor || (Yendor = {}));
/// <reference path="../decl/jquery.d.ts" />
/// <reference path="console.ts" />
/// <reference path="console_pixi.ts" />
/// <reference path="rng.ts" />
/// <reference path="bsp.ts" />
/// <reference path="fov.ts" />
var Yendor;
(function (Yendor) {
    Yendor.VERSION = '0.0.2';
    var frameLoop;

    /*
    Function: init
    
    Create the main console inside an HTML element.
    
    Parameters:
    divSelector - a CSS selector for the HTML element containing the console.
    width - number of columns.
    height - number of rows.
    foreground - default foreground color.
    background - default background color.
    
    Returns:
    
    The Yendor.Console created.
    */
    function init(divSelector, width, height, foreground, background) {
        var div = $(divSelector)[0];
        div.style.fontFamily = 'monospace';
        div.style.whiteSpace = 'pre';
        div.style.display = 'table';

        /*
        Provides requestAnimationFrame in a cross browser way.
        http://paulirish.com/2011/requestanimationframe-for-smart-animating/
        */
        frameLoop = (function () {
            return window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame || function (callback) {
                window.setTimeout(callback, 1000 / 60, new Date().getTime());
            };
        })();
        return new Yendor.PixiConsole(width, height, foreground, background, divSelector, 'terminal.png');
    }
    Yendor.init = init;

    var renderer;
    function frameFunc(elapsedTime) {
        frameLoop(frameFunc);
        renderer(elapsedTime);
    }

    function loop(theRenderer) {
        renderer = theRenderer;
        frameLoop(frameFunc);
    }
    Yendor.loop = loop;
})(Yendor || (Yendor = {}));
var Game;
(function (Game) {
    (function (Constants) {
        // console
        Constants.CONSOLE_WIDTH = 80;
        Constants.CONSOLE_HEIGHT = 34;

        // rendering
        Constants.DARK_WALL = 'rgb(0,0,100)';
        Constants.LIGHT_WALL = 'rgb(130,110,50)';
        Constants.DARK_GROUND = 'rgb(50,50,150)';
        Constants.LIGHT_GROUND = 'rgb(200,180,50)';
        Constants.CORPSE_COLOR = 'rgb(191,0,0)';
        Constants.FOV_RADIUS = 10;

        // gui
        Constants.LOG_DARKEN_COEF = 0.9;
        Constants.STATUS_PANEL_HEIGHT = 7;
        Constants.STAT_BAR_WIDTH = 20;
        Constants.HEALTH_BAR_BACKGROUND = 'rgb(255,63,63)';
        Constants.HEALTH_BAR_FOREGROUND = 'rgb(127,0,0)';
        Constants.INVENTORY_PANEL_WIDTH = 50;
        Constants.INVENTORY_PANEL_HEIGHT = 28;

        // map building
        Constants.MAX_MONSTERS_PER_ROOM = 3;
        Constants.MAX_ITEMS_PER_ROOM = 2;
        Constants.ROOM_MAX_SIZE = 8;
        Constants.ROOM_MIN_SIZE = 4;

        // AI
        Constants.SCENT_THRESHOLD = 10;
    })(Game.Constants || (Game.Constants = {}));
    var Constants = Game.Constants;
    (function (GameStatus) {
        // First frame
        GameStatus[GameStatus["STARTUP"] = 0] = "STARTUP";

        // new frame with no world update
        GameStatus[GameStatus["IDLE"] = 1] = "IDLE";

        // new frame with world update
        GameStatus[GameStatus["NEW_TURN"] = 2] = "NEW_TURN";

        // player won
        GameStatus[GameStatus["VICTORY"] = 3] = "VICTORY";

        // player died
        GameStatus[GameStatus["DEFEAT"] = 4] = "DEFEAT";
    })(Game.GameStatus || (Game.GameStatus = {}));
    var GameStatus = Game.GameStatus;

    // key codes
    Game.KeyEvent = {
        DOM_VK_CANCEL: 3,
        DOM_VK_HELP: 6,
        DOM_VK_BACK_SPACE: 8,
        DOM_VK_TAB: 9,
        DOM_VK_CLEAR: 12,
        DOM_VK_RETURN: 13,
        DOM_VK_ENTER: 14,
        DOM_VK_SHIFT: 16,
        DOM_VK_CONTROL: 17,
        DOM_VK_ALT: 18,
        DOM_VK_PAUSE: 19,
        DOM_VK_CAPS_LOCK: 20,
        DOM_VK_ESCAPE: 27,
        DOM_VK_SPACE: 32,
        DOM_VK_PAGE_UP: 33,
        DOM_VK_PAGE_DOWN: 34,
        DOM_VK_END: 35,
        DOM_VK_HOME: 36,
        DOM_VK_LEFT: 37,
        DOM_VK_UP: 38,
        DOM_VK_RIGHT: 39,
        DOM_VK_DOWN: 40,
        DOM_VK_PRINTSCREEN: 44,
        DOM_VK_INSERT: 45,
        DOM_VK_DELETE: 46,
        DOM_VK_0: 48,
        DOM_VK_1: 49,
        DOM_VK_2: 50,
        DOM_VK_3: 51,
        DOM_VK_4: 52,
        DOM_VK_5: 53,
        DOM_VK_6: 54,
        DOM_VK_7: 55,
        DOM_VK_8: 56,
        DOM_VK_9: 57,
        DOM_VK_SEMICOLON: 59,
        DOM_VK_EQUALS: 61,
        DOM_VK_A: 65,
        DOM_VK_B: 66,
        DOM_VK_C: 67,
        DOM_VK_D: 68,
        DOM_VK_E: 69,
        DOM_VK_F: 70,
        DOM_VK_G: 71,
        DOM_VK_H: 72,
        DOM_VK_I: 73,
        DOM_VK_J: 74,
        DOM_VK_K: 75,
        DOM_VK_L: 76,
        DOM_VK_M: 77,
        DOM_VK_N: 78,
        DOM_VK_O: 79,
        DOM_VK_P: 80,
        DOM_VK_Q: 81,
        DOM_VK_R: 82,
        DOM_VK_S: 83,
        DOM_VK_T: 84,
        DOM_VK_U: 85,
        DOM_VK_V: 86,
        DOM_VK_W: 87,
        DOM_VK_X: 88,
        DOM_VK_Y: 89,
        DOM_VK_Z: 90,
        DOM_VK_CONTEXT_MENU: 93,
        DOM_VK_NUMPAD0: 96,
        DOM_VK_NUMPAD1: 97,
        DOM_VK_NUMPAD2: 98,
        DOM_VK_NUMPAD3: 99,
        DOM_VK_NUMPAD4: 100,
        DOM_VK_NUMPAD5: 101,
        DOM_VK_NUMPAD6: 102,
        DOM_VK_NUMPAD7: 103,
        DOM_VK_NUMPAD8: 104,
        DOM_VK_NUMPAD9: 105,
        DOM_VK_MULTIPLY: 106,
        DOM_VK_ADD: 107,
        DOM_VK_SEPARATOR: 108,
        DOM_VK_SUBTRACT: 109,
        DOM_VK_DECIMAL: 110,
        DOM_VK_DIVIDE: 111,
        DOM_VK_F1: 112,
        DOM_VK_F2: 113,
        DOM_VK_F3: 114,
        DOM_VK_F4: 115,
        DOM_VK_F5: 116,
        DOM_VK_F6: 117,
        DOM_VK_F7: 118,
        DOM_VK_F8: 119,
        DOM_VK_F9: 120,
        DOM_VK_F10: 121,
        DOM_VK_F11: 122,
        DOM_VK_F12: 123,
        DOM_VK_F13: 124,
        DOM_VK_F14: 125,
        DOM_VK_F15: 126,
        DOM_VK_F16: 127,
        DOM_VK_F17: 128,
        DOM_VK_F18: 129,
        DOM_VK_F19: 130,
        DOM_VK_F20: 131,
        DOM_VK_F21: 132,
        DOM_VK_F22: 133,
        DOM_VK_F23: 134,
        DOM_VK_F24: 135,
        DOM_VK_NUM_LOCK: 144,
        DOM_VK_SCROLL_LOCK: 145,
        DOM_VK_COMMA: 188,
        DOM_VK_PERIOD: 190,
        DOM_VK_SLASH: 191,
        DOM_VK_BACK_QUOTE: 192,
        DOM_VK_OPEN_BRACKET: 219,
        DOM_VK_BACK_SLASH: 220,
        DOM_VK_CLOSE_BRACKET: 221,
        DOM_VK_QUOTE: 222,
        DOM_VK_META: 224
    };

    // utilities
    Game.log;
})(Game || (Game = {}));
var Game;
(function (Game) {
    (function (EventType) {
        /*
        change game status. Associated data : GameStatus
        */
        EventType[EventType["CHANGE_STATUS"] = 0] = "CHANGE_STATUS";

        /*
        key press event. Associated data : KeyboardEvent
        */
        EventType[EventType["KEY_PRESSED"] = 1] = "KEY_PRESSED";

        /*
        sends a message to the log. Associated data :
        */
        EventType[EventType["LOG_MESSAGE"] = 2] = "LOG_MESSAGE";

        /*
        mouse movement. Associated data : Yendor.Position with mouse coordinates on the root console
        */
        EventType[EventType["MOUSE_MOVE"] = 3] = "MOUSE_MOVE";

        /*
        mouse button press event. Associated data : button num (0: left, 1: middle, 2: right)
        */
        EventType[EventType["MOUSE_CLICK"] = 4] = "MOUSE_CLICK";

        /*
        open the tile picker. Associated data : the reply event
        */
        EventType[EventType["PICK_TILE"] = 5] = "PICK_TILE";
        EventType[EventType["REMOVE_ACTOR"] = 6] = "REMOVE_ACTOR";
    })(Game.EventType || (Game.EventType = {}));
    var EventType = Game.EventType;

    var Event = (function () {
        function Event(_type, _data) {
            this._type = _type;
            this._data = _data;
        }
        Object.defineProperty(Event.prototype, "type", {
            get: function () {
                return this._type;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Event.prototype, "data", {
            get: function () {
                return this._data;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Event.prototype, "actorManager", {
            get: function () {
                return this._actorManager;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Event.prototype, "map", {
            get: function () {
                return this._map;
            },
            enumerable: true,
            configurable: true
        });

        Event.prototype.initContext = function (actorManager, map) {
            this._actorManager = actorManager;
            this._map = map;
        };
        return Event;
    })();
    Game.Event = Event;

    var EventBus = (function () {
        function EventBus() {
            this.listeners = [];
        }
        EventBus.prototype.init = function (actorManager, map) {
            this.map = map;
            this.actorManager = actorManager;
        };

        EventBus.getInstance = function () {
            return EventBus.instance;
        };

        EventBus.prototype.registerListener = function (listener, type) {
            if (!this.listeners[type]) {
                this.listeners[type] = new Array();
            }
            this.listeners[type].push(listener);
        };

        EventBus.prototype.publishEvent = function (event) {
            event.initContext(this.actorManager, this.map);
            if (this.listeners[event.type]) {
                var selectedListeners = this.listeners[event.type];
                for (var i = 0; i < selectedListeners.length; i++) {
                    selectedListeners[i].processEvent(event);
                }
            }
        };
        EventBus.instance = new EventBus();
        return EventBus;
    })();
    Game.EventBus = EventBus;
})(Game || (Game = {}));
/*
Section: actors
*/
var Game;
(function (Game) {
    /********************************************************************************
    * Group: combat
    ********************************************************************************/
    /*
    Class: Destructible
    Something that can take damages and heal/repair.
    */
    var Destructible = (function () {
        /*
        Constructor: constructor
        
        Parameters:
        _maxHp - initial amount of health points
        _defense - when attacked, how much hit points are deflected
        _corpseName - new name of the actor when its health points reach 0
        */
        function Destructible(_maxHp, _defense, _corpseName) {
            this._maxHp = _maxHp;
            this._defense = _defense;
            this._corpseName = _corpseName;
            this._hp = _maxHp;
        }
        Object.defineProperty(Destructible.prototype, "hp", {
            get: function () {
                return this._hp;
            },
            set: function (newValue) {
                this._hp = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Destructible.prototype, "maxHp", {
            get: function () {
                return this._maxHp;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Destructible.prototype, "defense", {
            get: function () {
                return this._defense;
            },
            set: function (newValue) {
                this._defense = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Destructible.prototype.isDead = function () {
            return this._hp <= 0;
        };

        /*
        Function: takeDamage
        Deals damages to this actor. If health points reach 0, call the die function.
        
        Parameters:
        owner - the actor owning this Destructible
        damage - amount of damages to deal
        
        Returns:
        the actual amount of damage taken
        */
        Destructible.prototype.takeDamage = function (owner, damage) {
            damage -= this._defense;
            if (damage > 0) {
                this._hp -= damage;
                if (this.isDead()) {
                    this._hp = 0;
                    this.die(owner);
                }
            } else {
                damage = 0;
            }
            return damage;
        };

        /*
        Function: heal
        Recover some health points
        
        Parameters:
        amount - amount of health points to recover
        
        Returns:
        the actual amount of health points recovered
        */
        Destructible.prototype.heal = function (amount) {
            this._hp += amount;
            if (this._hp > this._maxHp) {
                amount -= this._hp - this._maxHp;
                this._hp = this._maxHp;
            }
            return amount;
        };

        /*
        Function: die
        Turn this actor into a corpse
        
        Parameters:
        owner - the actor owning this Destructible
        */
        Destructible.prototype.die = function (owner) {
            owner.ch = '%';
            owner.col = Game.Constants.CORPSE_COLOR;
            owner.name = this._corpseName;
            owner.blocks = false;
        };
        return Destructible;
    })();
    Game.Destructible = Destructible;

    /*
    Class: MonsterDestructible
    Contains an overloaded die function that logs the monsters death
    */
    var MonsterDestructible = (function (_super) {
        __extends(MonsterDestructible, _super);
        function MonsterDestructible() {
            _super.apply(this, arguments);
        }
        MonsterDestructible.prototype.die = function (owner) {
            Game.log(owner.name + ' is dead');
            _super.prototype.die.call(this, owner);
        };
        return MonsterDestructible;
    })(Destructible);
    Game.MonsterDestructible = MonsterDestructible;

    /*
    Class: PlayerDestructible
    Contains an overloaded die function to notify the Engine about the player's death
    */
    var PlayerDestructible = (function (_super) {
        __extends(PlayerDestructible, _super);
        function PlayerDestructible() {
            _super.apply(this, arguments);
        }
        PlayerDestructible.prototype.die = function (owner) {
            Game.log('You died!', 'red');
            _super.prototype.die.call(this, owner);
            Game.EventBus.getInstance().publishEvent(new Game.Event(0 /* CHANGE_STATUS */, 4 /* DEFEAT */));
        };
        return PlayerDestructible;
    })(Destructible);
    Game.PlayerDestructible = PlayerDestructible;

    /*
    Class: Attacker
    An actor that can deal damages to another one
    */
    var Attacker = (function () {
        /*
        Constructor: constructor
        
        Parameters:
        _power : amount of damages given
        */
        function Attacker(_power) {
            this._power = _power;
        }
        Object.defineProperty(Attacker.prototype, "power", {
            /*
            Property: power
            Amount of damages given
            */
            get: function () {
                return this._power;
            },
            set: function (newValue) {
                this._power = newValue;
            },
            enumerable: true,
            configurable: true
        });

        /*
        Function: attack
        Deal damages to another actor
        
        Parameters:
        owner - the actor owning this Attacker
        target - the actor being attacked
        */
        Attacker.prototype.attack = function (owner, target) {
            if (target.destructible && !target.destructible.isDead()) {
                var damage = this._power - target.destructible.defense;
                if (damage >= target.destructible.hp) {
                    Game.log(owner.name + ' attacks ' + target.name + ' and kill it !', 'orange');
                    target.destructible.takeDamage(target, this._power);
                } else if (damage > 0) {
                    Game.log(owner.name + ' attacks ' + target.name + ' for ' + damage + ' hit points.', 'orange');
                    target.destructible.takeDamage(target, this._power);
                } else {
                    Game.log(owner.name + ' attacks ' + target.name + ' but it has no effect!');
                }
            }
        };
        return Attacker;
    })();
    Game.Attacker = Attacker;

    /********************************************************************************
    * Group: articifial intelligence
    ********************************************************************************/
    /*
    Class: Ai
    Owned by self-updating actors
    */
    var Ai = (function () {
        function Ai() {
        }
        Ai.prototype.update = function (owner, map, actorManager) {
        };
        return Ai;
    })();
    Game.Ai = Ai;

    /*
    Class: PlayerAi
    Handles player input. Determin in a new game turn must be started.
    */
    var PlayerAi = (function (_super) {
        __extends(PlayerAi, _super);
        function PlayerAi() {
            _super.call(this);
            this.first = true;
            this.keyCode = 0;
            Game.EventBus.getInstance().registerListener(this, 1 /* KEY_PRESSED */);
        }
        /*
        Function: processEvent
        Stores the keyCode from KEY_PRESSED event so that <update> can use it.
        
        Parameters:
        event - the KEY_PRESSED <Event>
        */
        PlayerAi.prototype.processEvent = function (event) {
            if (event.type == 1 /* KEY_PRESSED */) {
                this.keyCode = event.data.keyCode;
                this.keyChar = event.data.key;
            } else {
                this.keyCode = 0;
                this.keyChar = undefined;
            }
        };

        /*
        Function: update
        Updates the player, eventually sends a CHANGE_STATUS event if a new turn has started.
        
        Parameters:
        owner - the actor owning this PlayerAi (obviously, the player)
        actorManager - the main actor manager used to check it there are monsters nearby.
        */
        PlayerAi.prototype.update = function (owner, map, actorManager) {
            // don't update a dead actor
            if (owner.destructible && owner.destructible.isDead()) {
                return;
            }

            // check movement keys
            var dx = 0;
            var dy = 0;
            switch (this.keyCode) {
                case Game.KeyEvent.DOM_VK_LEFT:
                    dx = -1;
                    break;
                case Game.KeyEvent.DOM_VK_RIGHT:
                    dx = 1;
                    break;
                case Game.KeyEvent.DOM_VK_UP:
                    dy = -1;
                    break;
                case Game.KeyEvent.DOM_VK_DOWN:
                    dy = 1;
                    break;
                default:
                    this.handleActionKey(owner, map, actorManager);
                    break;
            }
            if (dx != 0 || dy != 0) {
                // the player moved or try to move. New game turn
                Game.EventBus.getInstance().publishEvent(new Game.Event(0 /* CHANGE_STATUS */, 2 /* NEW_TURN */));

                // move to the target cell or attack if there's a creature
                if (this.moveOrAttack(owner, owner.x + dx, owner.y + dy, map, actorManager)) {
                    // the player actually move. Recompute the field of view
                    map.computeFov(owner.x, owner.y, Game.Constants.FOV_RADIUS);
                }
            } else if (this.first) {
                // first game frame : compute the field of view
                map.computeFov(owner.x, owner.y, Game.Constants.FOV_RADIUS);
                this.first = false;
            }
        };

        PlayerAi.prototype.handleActionKey = function (owner, map, actorManager) {
            if (this.keyChar == 'g') {
                this.pickupItem(owner, map, actorManager);
            }
        };

        PlayerAi.prototype.pickupItem = function (owner, map, actorManager) {
            var found = false;
            Game.EventBus.getInstance().publishEvent(new Game.Event(0 /* CHANGE_STATUS */, 2 /* NEW_TURN */));
            actorManager.getItems().some(function (item) {
                if (item.pickable && item.x == owner.x && item.y == owner.y) {
                    found = true;
                    if (item.pickable.pick(item, owner)) {
                        Game.log('You pick the ' + item.name + '.');
                    } else {
                        Game.log('Your inventory is full.');
                    }
                    return true;
                } else {
                    return false;
                }
            });
            if (!found) {
                Game.log("There's nothing to pick here.");
            }
        };

        /*
        Function: moveOrAttack
        Try to move the player to a new map call. if there's a living creature on this map cell, attack it.
        
        Parameters:
        owner - the actor owning this Attacker (the player)
        x - the destination cell x coordinate
        y - the destination cell y coordinate
        map - the game map, used to check for wall collisions
        actorManager - used to check for living actors
        
        Returns:
        true if the player actually moved to the new cell
        */
        PlayerAi.prototype.moveOrAttack = function (owner, x, y, map, actorManager) {
            // cannot move or attack a wall!
            if (map.isWall(x, y)) {
                return false;
            }

            // check for living monsters on the destination cell
            var cellPos = new Yendor.Position(x, y);
            var actors = actorManager.findActorsOnCell(cellPos, actorManager.getCreatures());
            for (var i = 0; i < actors.length; i++) {
                var actor = actors[i];
                if (actor.destructible && !actor.destructible.isDead()) {
                    // attack the first living actor found on the cell
                    owner.attacker.attack(owner, actor);
                    return false;
                }
            }

            // no living actor. Log exising corpses and items
            actorManager.findActorsOnCell(cellPos, actorManager.getCorpses()).forEach(function (actor) {
                Game.log("There's a " + actor.name + ' here');
            });
            actorManager.findActorsOnCell(cellPos, actorManager.getItems()).forEach(function (actor) {
                Game.log("There's a " + actor.name + ' here');
            });

            // move the player
            owner.x = x;
            owner.y = y;
            return true;
        };
        return PlayerAi;
    })(Ai);
    Game.PlayerAi = PlayerAi;

    /*
    Class: MonsterAi
    NPC monsters articial intelligence. Attacks the player when he is at melee range,
    else moves towards him using scent tracking.
    */
    var MonsterAi = (function (_super) {
        __extends(MonsterAi, _super);
        function MonsterAi() {
            _super.apply(this, arguments);
        }
        /*
        Function: update
        
        Parameters:
        owner - the actor owning this MonsterAi (the monster)
        map - the game map (used to check player line of sight)
        actorManager - used to get the player actor
        */
        MonsterAi.prototype.update = function (owner, map, actorManager) {
            // don't update a dead monster
            if (owner.destructible && owner.destructible.isDead()) {
                return;
            }

            // attack the player when at melee range, else try to track his scent
            this.moveOrAttack(owner, actorManager.getPlayer().x, actorManager.getPlayer().y, map, actorManager);
        };

        /*
        Function: moveOrAttack
        If the player is at range, attack him. If in sight, move towards him, else try to track his scent.
        
        Parameters:
        owner - the actor owning this MonsterAi (the monster)
        x - the destination cell x coordinate
        y - the destination cell y coordinate
        map - the game map. Used to check if player is in sight
        actorManager - used to get the player actor
        */
        MonsterAi.prototype.moveOrAttack = function (owner, x, y, map, actorManager) {
            var dx = x - owner.x;
            var dy = y - owner.y;

            // compute distance from player
            var distance = Math.sqrt(dx * dx + dy * dy);
            if (distance < 2) {
                // at melee range. Attack !
                if (owner.attacker) {
                    owner.attacker.attack(owner, actorManager.getPlayer());
                }
            } else if (map.isInFov(owner.x, owner.y)) {
                // not at melee range, but in sight. Move towards him
                dx = Math.round(dx / distance);
                dy = Math.round(dy / distance);
                this.move(owner, dx, dy, map, actorManager);
            } else {
                // player not in range. Use scent tracking
                this.trackScent(owner, map, actorManager);
            }
        };

        /*
        Function: move
        Move to a destination cell, avoiding potential obstacles (walls, other creatures)
        
        Parameters:
        owner - the actor owning this MonsterAi (the monster)
        dx - horizontal direction
        dy - vertical direction
        map - the game map (to check if a cell is walkable)
        actorManager - to check blocking actors
        */
        MonsterAi.prototype.move = function (owner, dx, dy, map, actorManager) {
            // compute the unitary move vector
            var stepdx = dx > 0 ? 1 : -1;
            var stepdy = dy > 0 ? 1 : -1;
            if (map.canWalk(owner.x + dx, owner.y + dy, actorManager)) {
                // can walk
                owner.x += dx;
                owner.y += dy;
            } else if (map.canWalk(owner.x + stepdx, owner.y, actorManager)) {
                // horizontal slide
                owner.x += stepdx;
            } else if (map.canWalk(owner.x, owner.y + stepdy, actorManager)) {
                // vertical slide
                owner.y += stepdy;
            }
        };

        /*
        Function: findHighestScentCellIndex
        Find the adjacent cell with the highest scent value
        
        Parameters:
        owner - the actor owning this MonsterAi (the monster)
        map - the game map, used to skip wall cells from the search
        
        Returns:
        the cell index :
        - 0 : north-west
        - 1 : north
        - 2 : north-east
        - 3 : west
        - 4 : east
        - 5 : south-west
        - 6 : south
        - 7 : south-east
        - or -1 if no adjacent cell has scent.
        */
        MonsterAi.prototype.findHighestScentCellIndex = function (owner, map) {
            var bestScentLevel = 0;
            var bestCellIndex = -1;

            for (var i = 0; i < 8; i++) {
                var cellx = owner.x + MonsterAi.TDX[i];
                var celly = owner.y + MonsterAi.TDY[i];
                if (!map.isWall(cellx, celly)) {
                    // not a wall, check if scent is higher
                    var scentAmount = map.getScent(cellx, celly);
                    if (scentAmount > map.currentScentValue - Game.Constants.SCENT_THRESHOLD && scentAmount > bestScentLevel) {
                        // scent is higher. New candidate
                        bestScentLevel = scentAmount;
                        bestCellIndex = i;
                    }
                }
            }
            return bestCellIndex;
        };

        /*
        Function: trackScent
        Move towards the adjacent cell with the highest scent value
        */
        MonsterAi.prototype.trackScent = function (owner, map, actorManager) {
            // get the adjacent cell with the highest scent value
            var bestCellIndex = this.findHighestScentCellIndex(owner, map);
            if (bestCellIndex != -1) {
                // found. try to move
                this.move(owner, MonsterAi.TDX[bestCellIndex], MonsterAi.TDY[bestCellIndex], map, actorManager);
            }
        };
        MonsterAi.TDX = [-1, 0, 1, -1, 1, -1, 0, 1];
        MonsterAi.TDY = [-1, -1, -1, 0, 0, 1, 1, 1];
        return MonsterAi;
    })(Ai);
    Game.MonsterAi = MonsterAi;

    /********************************************************************************
    * Group: inventory
    ********************************************************************************/
    /*
    Class: Container
    An actor that can contain other actors :
    - creatures with inventory
    - chests, barrels, ...
    */
    var Container = (function () {
        /*
        Constructor: constructor
        
        Parameters:
        _capaticty - this container's maximum number of items
        */
        function Container(_capaticty) {
            this._capaticty = _capaticty;
            this.actors = [];
        }
        Object.defineProperty(Container.prototype, "capacity", {
            get: function () {
                return this._capaticty;
            },
            set: function (newValue) {
                this._capaticty = newValue;
            },
            enumerable: true,
            configurable: true
        });
        Container.prototype.size = function () {
            return this.actors.length;
        };

        Container.prototype.get = function (index) {
            return this.actors[index];
        };

        /*
        Function: add
        add a new actor in this container
        
        Parameters:
        actor - the actor to add
        
        Returns:
        false if the operation failed because the container is full
        */
        Container.prototype.add = function (actor) {
            if (this.actors.length >= this._capaticty) {
                return false;
            }
            this.actors.push(actor);
            return true;
        };

        /*
        Function: remove
        remove an actor from this container
        
        Parameters:
        actor - the actor to remove
        */
        Container.prototype.remove = function (actor) {
            var idx = this.actors.indexOf(actor);
            if (idx != -1) {
                this.actors.splice(idx, 1);
            }
        };
        return Container;
    })();
    Game.Container = Container;

    /*
    Enum: TargetSelectionMethod
    Define how we select the actors that are impacted by an effect.
    The wearer is the actor triggering the effect (by using an item or casting a spell)
    
    WEARER_CLOSEST_ENEMY - the closest enemy
    SELECTED_ACTOR - an actor manually selected
    WEARER_RANGE - all actors close to the wearer
    SELECTED_RANGE - all actors close to a manually selected position
    */
    (function (TargetSelectionMethod) {
        TargetSelectionMethod[TargetSelectionMethod["WEARER_CLOSEST_ENEMY"] = 0] = "WEARER_CLOSEST_ENEMY";
        TargetSelectionMethod[TargetSelectionMethod["SELECTED_ACTOR"] = 1] = "SELECTED_ACTOR";
        TargetSelectionMethod[TargetSelectionMethod["WEARER_RANGE"] = 2] = "WEARER_RANGE";
        TargetSelectionMethod[TargetSelectionMethod["SELECTED_RANGE"] = 3] = "SELECTED_RANGE";
    })(Game.TargetSelectionMethod || (Game.TargetSelectionMethod = {}));
    var TargetSelectionMethod = Game.TargetSelectionMethod;

    /*
    Class: TargetSelector
    Various ways to select actors
    */
    var TargetSelector = (function () {
        /*
        Constructor: constructor
        
        Parameters:
        _method - the target selection method
        _range - for methods requiring a range
        */
        function TargetSelector(_method, _range) {
            if (typeof _range === "undefined") { _range = 0; }
            this._method = _method;
            this._range = _range;
        }
        Object.defineProperty(TargetSelector.prototype, "method", {
            /*
            Property: method
            The target selection method (read-only)
            */
            get: function () {
                return this._method;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(TargetSelector.prototype, "range", {
            /*
            Property: range
            The selection range (read-only)
            */
            get: function () {
                return this._range;
            },
            enumerable: true,
            configurable: true
        });

        /*
        Function: selectTargets
        Return all the actors matching the selection criteria
        
        Parameters:
        wearer -
        */
        TargetSelector.prototype.selectTargets = function (wearer, actorManager) {
            var selectedTargets = [];
            switch (this._method) {
                case 0 /* WEARER_CLOSEST_ENEMY */:
                    var actor = actorManager.findClosestActor(wearer, this.range, actorManager.getCreatures());
                    if (actor) {
                        selectedTargets.push(actor);
                    }
                    break;
            }
            return selectedTargets;
        };
        return TargetSelector;
    })();
    Game.TargetSelector = TargetSelector;

    

    var InstantHealthEffect = (function () {
        function InstantHealthEffect(_amount, _message) {
            this._amount = _amount;
            this._message = _message;
        }
        InstantHealthEffect.prototype.applyTo = function (actor) {
            if (!actor.destructible) {
                return false;
            }
            if (this._amount > 0) {
                // healing effect
                var healPointsCount = actor.destructible.heal(this._amount);
                if (healPointsCount > 0 && this._message) {
                    // TODO message formatting utility
                    Game.log(this._message);
                }
                return true;
            } else {
                // wounding effect
                if (this._message && actor.destructible.defense < -this._amount) {
                    Game.log(this._message);
                }
                if (actor.destructible.takeDamage(actor, -this._amount)) {
                    return true;
                }
            }
            return false;
        };
        return InstantHealthEffect;
    })();
    Game.InstantHealthEffect = InstantHealthEffect;

    /*
    Class: Pickable
    An actor that can be picked by a creature
    */
    var Pickable = (function () {
        function Pickable(_effect, _targetSelector) {
            this._effect = _effect;
            this._targetSelector = _targetSelector;
        }
        /*
        Function: pick
        Put this actor in a container actor
        
        Parameters:
        owner - the actor owning this Pickable (the item)
        wearer - the container
        
        Returns:
        true if the operation succeeded
        */
        Pickable.prototype.pick = function (owner, wearer) {
            if (wearer.container && wearer.container.add(owner)) {
                // tells the engine to remove this actor from main list
                Game.EventBus.getInstance().publishEvent(new Game.Event(6 /* REMOVE_ACTOR */, owner));
                return true;
            }

            // wearer is not a container or is full
            return false;
        };

        /*
        Function: use
        Consume this item, destroying it
        
        Parameters:
        owner - the actor owning this Pickable (the item)
        weare - the container
        
        Returns:
        true if the action succeeded
        */
        Pickable.prototype.use = function (owner, wearer, actorManager) {
            var actors;
            if (this._targetSelector) {
                actors = this._targetSelector.selectTargets(wearer, actorManager);
            } else {
                actors = [];
                actors.push(wearer);
            }
            var success = false;

            for (var i = 0; i < actors.length; ++i) {
                if (this._effect.applyTo(actors[i])) {
                    success = true;
                }
            }
            if (success && wearer.container) {
                wearer.container.remove(owner);
            }
            return success;
        };

        /*
        Some factory helpers
        */
        Pickable.createHealthPotion = function (x, y, amount) {
            var healthPotion = new Actor(x, y, '!', 'health potion', 'purple');
            healthPotion.pickable = new Pickable(new InstantHealthEffect(amount, 'You drink the health potion'));
            healthPotion.blocks = false;
            return healthPotion;
        };

        Pickable.createLightningBoltScroll = function (x, y, range, damages) {
            var lightningBolt = new Actor(x, y, '#', 'scroll of lightning bolt', 'rgb(255,255,63)');
            lightningBolt.pickable = new Pickable(new InstantHealthEffect(-damages, 'A lightning bolt hits with a loud thunder!'), new TargetSelector(0 /* WEARER_CLOSEST_ENEMY */, range));
            lightningBolt.blocks = false;
            return lightningBolt;
        };
        return Pickable;
    })();
    Game.Pickable = Pickable;

    /********************************************************************************
    * Group: actors
    ********************************************************************************/
    var Actor = (function (_super) {
        __extends(Actor, _super);
        function Actor(_x, _y, _ch, _name, _col) {
            _super.call(this, _x, _y);
            this._ch = _ch;
            this._name = _name;
            this._col = _col;
            this._blocks = true;
        }
        Object.defineProperty(Actor.prototype, "ch", {
            get: function () {
                return this._ch;
            },
            set: function (newValue) {
                this._ch = newValue[0];
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Actor.prototype, "col", {
            get: function () {
                return this._col;
            },
            set: function (newValue) {
                this._col = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Actor.prototype, "name", {
            get: function () {
                return this._name;
            },
            set: function (newValue) {
                this._name = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Actor.prototype.isBlocking = function () {
            return this._blocks;
        };
        Object.defineProperty(Actor.prototype, "blocks", {
            set: function (newValue) {
                this._blocks = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Actor.prototype, "destructible", {
            get: function () {
                return this._destructible;
            },
            set: function (newValue) {
                this._destructible = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Actor.prototype, "attacker", {
            get: function () {
                return this._attacker;
            },
            set: function (newValue) {
                this._attacker = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Actor.prototype, "ai", {
            get: function () {
                return this._ai;
            },
            set: function (newValue) {
                this._ai = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Actor.prototype, "pickable", {
            get: function () {
                return this._pickable;
            },
            set: function (newValue) {
                this._pickable = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Object.defineProperty(Actor.prototype, "container", {
            get: function () {
                return this._container;
            },
            set: function (newValue) {
                this._container = newValue;
            },
            enumerable: true,
            configurable: true
        });

        Actor.prototype.update = function (map, actorManager) {
            if (this._ai) {
                this._ai.update(this, map, actorManager);
            }
        };

        Actor.prototype.render = function () {
            root.setChar(this.x, this.y, this._ch);
            root.fore[this.x][this.y] = this._col;
        };
        return Actor;
    })(Yendor.Position);
    Game.Actor = Actor;

    var Player = (function (_super) {
        __extends(Player, _super);
        function Player(_x, _y, _ch, _name, _col) {
            _super.call(this, _x, _y, _ch, _name, _col);
            this.ai = new PlayerAi();
            this.attacker = new Attacker(5);
            this.destructible = new PlayerDestructible(30, 2, 'your cadaver');
            this.container = new Container(26);
        }
        return Player;
    })(Actor);
    Game.Player = Player;
})(Game || (Game = {}));
var Game;
(function (Game) {
    var Tile = (function () {
        function Tile() {
            this.explored = false;
            this.scentAmount = 0;
        }
        return Tile;
    })();
    Game.Tile = Tile;

    var AbstractDungeonBuilder = (function () {
        function AbstractDungeonBuilder() {
        }
        AbstractDungeonBuilder.prototype.dig = function (map, x1, y1, x2, y2) {
            if (x2 < x1) {
                var tmp = x2;
                x2 = x1;
                x1 = tmp;
            }
            if (y2 < y1) {
                var tmp = y2;
                y2 = y1;
                y1 = tmp;
            }
            for (var tilex = x1; tilex <= x2; tilex++) {
                for (var tiley = y1; tiley <= y2; tiley++) {
                    map.setFloor(tilex, tiley);
                }
            }
        };

        AbstractDungeonBuilder.prototype.createMonster = function (x, y, rng) {
            if (rng.getNumber(0, 100) < 80) {
                var orc = new Game.Actor(x, y, 'o', 'orc', 'rgb(63,127,63)');
                orc.destructible = new Game.MonsterDestructible(10, 0, 'dead orc');
                orc.attacker = new Game.Attacker(3);
                orc.ai = new Game.MonsterAi();
                return orc;
            } else {
                var troll = new Game.Actor(x, y, 'T', 'troll', 'rgb(0,127,0)');
                troll.destructible = new Game.MonsterDestructible(16, 1, 'troll carcass');
                troll.attacker = new Game.Attacker(4);
                troll.ai = new Game.MonsterAi();
                return troll;
            }
        };

        AbstractDungeonBuilder.prototype.createItem = function (x, y, rng) {
            var dice = rng.getNumber(0, 100);
            var item;
            if (dice < 70) {
                item = Game.Pickable.createHealthPotion(x, y, 4);
            } else {
                item = Game.Pickable.createLightningBoltScroll(x, y, 5, 20);
            }
            return item;
        };

        AbstractDungeonBuilder.prototype.createRoom = function (map, actorManager, first, x1, y1, x2, y2) {
            this.dig(map, x1, y1, x2, y2);
            if (first) {
                // put the player in the first room
                actorManager.getPlayer().x = Math.floor((x1 + x2) / 2);
                actorManager.getPlayer().y = Math.floor((y1 + y2) / 2);
            } else {
                var rng = new Yendor.ComplementaryMultiplyWithCarryRandom();
                this.createMonsters(x1, y1, x2, y2, rng, map, actorManager);
                this.createItems(x1, y1, x2, y2, rng, map, actorManager);
            }
        };

        AbstractDungeonBuilder.prototype.createMonsters = function (x1, y1, x2, y2, rng, map, actorManager) {
            var monsterCount = rng.getNumber(0, Game.Constants.MAX_MONSTERS_PER_ROOM);
            while (monsterCount > 0) {
                var x = rng.getNumber(x1, x2);
                var y = rng.getNumber(y1, y2);
                if (map.canWalk(x, y, actorManager)) {
                    actorManager.addCreature(this.createMonster(x, y, rng));
                }
                monsterCount--;
            }
        };

        AbstractDungeonBuilder.prototype.createItems = function (x1, y1, x2, y2, rng, map, actorManager) {
            var itemCount = rng.getNumber(0, Game.Constants.MAX_ITEMS_PER_ROOM);
            while (itemCount > 0) {
                var x = rng.getNumber(x1, x2);
                var y = rng.getNumber(y1, y2);
                if (map.canWalk(x, y, actorManager)) {
                    actorManager.addItem(this.createItem(x, y, rng));
                }
                itemCount--;
            }
        };
        return AbstractDungeonBuilder;
    })();
    Game.AbstractDungeonBuilder = AbstractDungeonBuilder;

    var BspDungeonBuilder = (function (_super) {
        __extends(BspDungeonBuilder, _super);
        function BspDungeonBuilder() {
            _super.apply(this, arguments);
            this.roomNum = 0;
            this.visitNode = function (node, userData) {
                var dungeonBuilder = userData[0];
                var map = userData[1];
                var actorManager = userData[2];
                if (node.isLeaf()) {
                    var x, y, w, h;
                    var rng = new Yendor.ComplementaryMultiplyWithCarryRandom();
                    w = rng.getNumber(Game.Constants.ROOM_MIN_SIZE, node.w - 2);
                    h = rng.getNumber(Game.Constants.ROOM_MIN_SIZE, node.h - 2);
                    x = rng.getNumber(node.x + 1, node.x + node.w - w - 1);
                    y = rng.getNumber(node.y + 1, node.y + node.h - h - 1);
                    dungeonBuilder.createRoom(map, actorManager, dungeonBuilder.roomNum == 0, x, y, x + w - 1, y + h - 1);
                    if (dungeonBuilder.roomNum != 0) {
                        // build a corridor from previous room
                        dungeonBuilder.dig(map, dungeonBuilder.lastx, dungeonBuilder.lasty, Math.floor(x + w / 2), dungeonBuilder.lasty);
                        dungeonBuilder.dig(map, Math.floor(x + w / 2), dungeonBuilder.lasty, Math.floor(x + w / 2), Math.floor(y + h / 2));
                    }
                    dungeonBuilder.lastx = Math.floor(x + w / 2);
                    dungeonBuilder.lasty = Math.floor(y + h / 2);
                    dungeonBuilder.roomNum++;
                }
                return 0 /* CONTINUE */;
            };
        }
        BspDungeonBuilder.prototype.build = function (map, actorManager) {
            var bsp = new Yendor.BSPNode(0, 0, map.width, map.height);
            bsp.splitRecursive(undefined, 8, Game.Constants.ROOM_MIN_SIZE, 1.5);
            bsp.traverseInvertedLevelOrder(this.visitNode, [this, map, actorManager]);
        };
        return BspDungeonBuilder;
    })(AbstractDungeonBuilder);
    Game.BspDungeonBuilder = BspDungeonBuilder;

    var Map = (function () {
        function Map(_width, _height) {
            this._width = _width;
            this._height = _height;
            this._currentScentValue = Game.Constants.SCENT_THRESHOLD;
            this.tiles = [];
            this.map = new Yendor.Fov(_width, _height);
            for (var x = 0; x < this._width; x++) {
                this.tiles[x] = [];
                for (var y = 0; y < this._height; y++) {
                    this.tiles[x][y] = new Tile();
                }
            }
        }
        Object.defineProperty(Map.prototype, "width", {
            get: function () {
                return this._width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Map.prototype, "height", {
            get: function () {
                return this._height;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Map.prototype, "currentScentValue", {
            get: function () {
                return this._currentScentValue;
            },
            enumerable: true,
            configurable: true
        });

        Map.prototype.isWall = function (x, y) {
            return !this.map.isWalkable(x, y);
        };

        Map.prototype.canWalk = function (x, y, actorManager) {
            if (this.isWall(x, y)) {
                return false;
            }
            actorManager.findActorsOnCell(new Yendor.Position(x, y), actorManager.getCreatures()).forEach(function (actor) {
                if (actor.isBlocking()) {
                    return false;
                }
            });
            return true;
        };

        Map.prototype.isExplored = function (x, y) {
            return this.tiles[x][y].explored;
        };

        Map.prototype.isInFov = function (x, y) {
            if (this.map.isInFov(x, y)) {
                this.tiles[x][y].explored = true;
                return true;
            }
            return false;
        };

        Map.prototype.getScent = function (x, y) {
            return this.tiles[x][y].scentAmount;
        };

        Map.prototype.computeFov = function (x, y, radius) {
            this.map.computeFov(x, y, radius);
            this._currentScentValue++;
            this.updateScentField(x, y);
        };

        Map.prototype.updateScentField = function (xPlayer, yPlayer) {
            for (var x = 0; x < this._width; x++) {
                for (var y = 0; y < this._height; y++) {
                    if (this.isInFov(x, y)) {
                        var oldScent = this.getScent(x, y);
                        var dx = x - xPlayer;
                        var dy = y - yPlayer;
                        var distance = Math.floor(Math.sqrt(dx * dx + dy * dy));
                        var newScent = this._currentScentValue - distance;
                        if (newScent > oldScent) {
                            this.tiles[x][y].scentAmount = newScent;
                        }
                    }
                }
            }
        };

        Map.prototype.setFloor = function (x, y) {
            this.map.setCell(x, y, true, true);
        };
        Map.prototype.setWall = function (x, y) {
            this.map.setCell(x, y, false, false);
        };

        Map.prototype.render = function () {
            for (var x = 0; x < this._width; x++) {
                for (var y = 0; y < this._height; y++) {
                    if (this.isInFov(x, y)) {
                        root.back[x][y] = this.isWall(x, y) ? Game.Constants.LIGHT_WALL : Game.Constants.LIGHT_GROUND;
                    } else if (this.isExplored(x, y)) {
                        root.back[x][y] = this.isWall(x, y) ? Game.Constants.DARK_WALL : Game.Constants.DARK_GROUND;
                    } else {
                        root.back[x][y] = 'black';
                    }
                }
            }
        };
        return Map;
    })();
    Game.Map = Map;
})(Game || (Game = {}));
/// <reference path="../yendor/yendor.ts" />
var Game;
(function (Game) {
    /********************************************************************************
    * Group: generic GUI stuff
    ********************************************************************************/
    var Gui = (function (_super) {
        __extends(Gui, _super);
        function Gui(_width, _height) {
            _super.call(this);
            this._width = _width;
            this._height = _height;
            this._pos = new Yendor.Position();
            this._visible = false;
            this._console = new Yendor.Console(_width, _height);
        }
        Object.defineProperty(Gui.prototype, "width", {
            get: function () {
                return this._width;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Gui.prototype, "height", {
            get: function () {
                return this._height;
            },
            enumerable: true,
            configurable: true
        });

        Gui.prototype.isVisible = function () {
            return this._visible;
        };
        Object.defineProperty(Gui.prototype, "visible", {
            set: function (newValue) {
                this._visible = newValue;
            },
            enumerable: true,
            configurable: true
        });
        Gui.prototype.show = function () {
            this._visible = true;
        };
        Gui.prototype.hide = function () {
            this._visible = false;
        };

        Object.defineProperty(Gui.prototype, "console", {
            get: function () {
                return this._console;
            },
            enumerable: true,
            configurable: true
        });

        /*
        Function: render
        To be overloaded by extending classes.
        */
        Gui.prototype.render = function (map, actorManager, destination) {
            this._console.blit(destination, this.x, this.y);
        };
        return Gui;
    })(Yendor.Position);
    Game.Gui = Gui;

    /********************************************************************************
    * Group: status panel
    ********************************************************************************/
    var Message = (function () {
        function Message(_color, _text) {
            this._color = _color;
            this._text = _text;
        }
        Object.defineProperty(Message.prototype, "text", {
            get: function () {
                return this._text;
            },
            enumerable: true,
            configurable: true
        });
        Object.defineProperty(Message.prototype, "color", {
            get: function () {
                return this._color;
            },
            enumerable: true,
            configurable: true
        });
        Message.prototype.darkenColor = function () {
            this._color = Yendor.ColorUtils.multiply(this._color, Game.Constants.LOG_DARKEN_COEF);
        };
        return Message;
    })();
    Game.Message = Message;

    var StatusPanel = (function (_super) {
        __extends(StatusPanel, _super);
        function StatusPanel(width, height) {
            _super.call(this, width, height);
            this.messages = [];
            this.mouseLookText = '';
            this.messageHeight = height - 1;
            Game.EventBus.getInstance().registerListener(this, 2 /* LOG_MESSAGE */);
            Game.EventBus.getInstance().registerListener(this, 3 /* MOUSE_MOVE */);
        }
        StatusPanel.prototype.processEvent = function (event) {
            switch (event.type) {
                case 2 /* LOG_MESSAGE */:
                    var msg = event.data;
                    this.message(msg.color, msg.text);
                    break;
                case 3 /* MOUSE_MOVE */:
                    var pos = event.data;
                    if (event.map.isInFov(pos.x, pos.y)) {
                        var actorsOnCell = event.actorManager.findActorsOnCell(pos, event.actorManager.getCreatures());
                        actorsOnCell = actorsOnCell.concat(event.actorManager.findActorsOnCell(pos, event.actorManager.getItems()));
                        actorsOnCell = actorsOnCell.concat(event.actorManager.findActorsOnCell(pos, event.actorManager.getCorpses()));
                        this.handleMouseLook(actorsOnCell);
                    }
                    break;
            }
        };

        StatusPanel.prototype.message = function (color, text) {
            var lines = text.split('\n');
            if (this.messages.length + lines.length > this.messageHeight) {
                this.messages.splice(0, this.messages.length + lines.length - this.messageHeight);
            }
            for (var i = 0; i < this.messages.length; ++i) {
                this.messages[i].darkenColor();
            }
            for (var i = 0; i < lines.length; ++i) {
                this.messages.push(new Message(color, lines[i]));
            }
        };

        StatusPanel.prototype.handleMouseLook = function (actors) {
            var len = actors.length;
            this.mouseLookText = len == 0 ? '' : actors[0].name;
            for (var i = 1; i < len; ++i) {
                var actor = actors[i];
                this.mouseLookText += ',' + actor.name;
            }
        };

        StatusPanel.prototype.renderMessages = function () {
            for (var i = 0; i < this.messages.length; ++i) {
                var msg = this.messages[i];
                this.console.print(StatusPanel.MESSAGE_X, i + 1, msg.text, msg.color);
            }
        };

        StatusPanel.prototype.render = function (map, actorManager, destination) {
            this.console.clearBack('black');
            this.console.clearText();
            var player = actorManager.getPlayer();
            this.renderBar(1, 1, Game.Constants.STAT_BAR_WIDTH, 'HP', player.destructible.hp, player.destructible.maxHp, Game.Constants.HEALTH_BAR_BACKGROUND, Game.Constants.HEALTH_BAR_FOREGROUND);
            this.console.print(0, 0, this.mouseLookText);
            this.renderMessages();
            _super.prototype.render.call(this, map, actorManager, destination);
        };

        StatusPanel.prototype.renderBar = function (x, y, width, name, value, maxValue, foreColor, backColor) {
            this.console.clearBack(backColor, x, y, width, 1);
            var barWidth = Math.floor(value / maxValue * width);
            if (barWidth > 0) {
                this.console.clearBack(foreColor, x, y, barWidth, 1);
            }
            var label = name + ' : ' + value + '/' + maxValue;
            this.console.print(x + ((width - label.length) >> 1), y, label);
        };
        StatusPanel.MESSAGE_X = Game.Constants.STAT_BAR_WIDTH + 2;
        return StatusPanel;
    })(Gui);
    Game.StatusPanel = StatusPanel;

    /********************************************************************************
    * Group: inventory
    ********************************************************************************/
    var InventoryPanel = (function (_super) {
        __extends(InventoryPanel, _super);
        function InventoryPanel(width, height, actor) {
            _super.call(this, width, height);
            this.actor = actor;
            Game.EventBus.getInstance().registerListener(this, 1 /* KEY_PRESSED */);
        }
        InventoryPanel.prototype.processEvent = function (event) {
            if (!this.isVisible() && event.data.key == 'i') {
                this.show();
            } else if (this.isVisible()) {
                if (event.data.keyCode == Game.KeyEvent.DOM_VK_ESCAPE) {
                    this.hide();
                } else {
                    var index = event.data.key.charCodeAt(0) - 'a'.charCodeAt(0);
                    if (index >= 0 && index < this.actor.container.size()) {
                        var item = this.actor.container.get(index);
                        if (item.pickable) {
                            item.pickable.use(item, this.actor, event.actorManager);
                        }
                    }
                }
            }
        };

        InventoryPanel.prototype.render = function (map, actorManager, destination) {
            this.console.clearBack('maroon');
            this.console.clearText();
            var shortcut = 'a'.charCodeAt(0);
            var y = 1;
            this.console.print(Math.floor(this.width / 2 - InventoryPanel.TITLE.length / 2), 0, InventoryPanel.TITLE);
            for (var i = 0; i < this.actor.container.size(); ++i) {
                var item = this.actor.container.get(i);
                this.console.print(2, y, '(' + String.fromCharCode(shortcut) + ') ' + item.name);
                y++;
                shortcut++;
            }
            _super.prototype.render.call(this, map, actorManager, destination);
        };
        InventoryPanel.TITLE = '=== inventory - ESC to close ===';
        return InventoryPanel;
    })(Gui);
    Game.InventoryPanel = InventoryPanel;

    

    var TilePicker = (function (_super) {
        __extends(TilePicker, _super);
        function TilePicker() {
            _super.call(this, Game.Constants.CONSOLE_WIDTH, Game.Constants.CONSOLE_HEIGHT);
            Game.EventBus.getInstance().registerListener(this, 5 /* PICK_TILE */);
            Game.EventBus.getInstance().registerListener(this, 3 /* MOUSE_MOVE */);
        }
        TilePicker.prototype.processEvent = function (event) {
            if (!this.isVisible() && event.type == 5 /* PICK_TILE */) {
                this.listener = event.data;
                this.show();
            } else if (this.isVisible() && event.type == 3 /* MOUSE_MOVE */) {
                this.tilePos = event.data;
            } else if (this.isVisible() && event.type == 4 /* MOUSE_CLICK */) {
                if (this.listener) {
                    this.listener.onTilePicked(this.tilePos);
                }
                this.hide();
            }
        };

        TilePicker.prototype.render = function (map, actorManager, destination) {
        };
        return TilePicker;
    })(Gui);
    Game.TilePicker = TilePicker;
})(Game || (Game = {}));
/// <reference path="../decl/jquery.d.ts" />
/// <reference path="../yendor/yendor.ts" />
/// <reference path="base.ts" />
/// <reference path="eventbus.ts" />
/// <reference path="actor.ts" />
/// <reference path="map.ts" />
/// <reference path="gui.ts" />
var root;
var Game;
(function (Game) {
    /*
    Class: Engine
    Handles frame rendering and world updating.
    */
    var Engine = (function () {
        /*
        Constructor: constructor
        */
        function Engine() {
            this.actors = [];
            this.corpses = [];
            this.items = [];
            this.rng = new Yendor.ComplementaryMultiplyWithCarryRandom();
            this.status = 0 /* STARTUP */;
            this.guis = [];
            this.player = new Game.Player(Game.Constants.CONSOLE_WIDTH / 2, Game.Constants.CONSOLE_HEIGHT / 2, '@', 'player', '#fff');
            this.map = new Game.Map(Game.Constants.CONSOLE_WIDTH, Game.Constants.CONSOLE_HEIGHT - Game.Constants.STATUS_PANEL_HEIGHT);
            Game.EventBus.getInstance().init(this, this.map);
            this.actors.push(this.player);
            var dungeonBuilder = new Game.BspDungeonBuilder();
            dungeonBuilder.build(this.map, this);
            Game.EventBus.getInstance().registerListener(this, 0 /* CHANGE_STATUS */);
            Game.EventBus.getInstance().registerListener(this, 6 /* REMOVE_ACTOR */);

            var statusPanel = new Game.StatusPanel(Game.Constants.CONSOLE_WIDTH, Game.Constants.STATUS_PANEL_HEIGHT);
            statusPanel.show();
            this.addGui(statusPanel, "statusPanel", 0, Game.Constants.CONSOLE_HEIGHT - Game.Constants.STATUS_PANEL_HEIGHT);

            var inventoryPanel = new Game.InventoryPanel(Game.Constants.INVENTORY_PANEL_WIDTH, Game.Constants.INVENTORY_PANEL_HEIGHT, this.player);
            this.addGui(inventoryPanel, "inventoryPanel", Math.floor(Game.Constants.CONSOLE_WIDTH / 2 - Game.Constants.INVENTORY_PANEL_WIDTH / 2), 0);
        }
        /*
        ActorManager interface
        */
        Engine.prototype.getPlayer = function () {
            return this.player;
        };

        Engine.prototype.addCreature = function (actor) {
            this.actors.push(actor);
        };

        Engine.prototype.addItem = function (actor) {
            this.items.push(actor);
        };

        Engine.prototype.getCreatures = function () {
            return this.actors;
        };

        Engine.prototype.getItems = function () {
            return this.items;
        };

        Engine.prototype.getCorpses = function () {
            return this.corpses;
        };

        /*
        GuiManager interface
        */
        Engine.prototype.addGui = function (gui, name, x, y) {
            gui.moveTo(x, y);
            this.guis.push(gui);
        };

        Engine.prototype.renderGui = function (rootConsole) {
            for (var i = 0; i < this.guis.length; i++) {
                var gui = this.guis[i];
                if (gui.isVisible()) {
                    gui.render(this.map, this, rootConsole);
                }
            }
        };

        /*
        Function: findClosestActor
        
        In the `actors` array, find the closest actor (except the player) from position `pos` within `range`.
        If range is 0, no range limitation.
        */
        Engine.prototype.findClosestActor = function (pos, range, actors) {
            var bestDistance = 1E8;
            var closestActor = undefined;
            var player = this.getPlayer();
            actors.forEach(function (actor) {
                if (actor != player) {
                    var distance = Yendor.Position.distance(pos, actor);
                    if (distance < bestDistance && (distance < range || range == 0)) {
                        bestDistance = distance;
                        closestActor = actor;
                    }
                }
            });
            return closestActor;
        };

        /*
        Function: findActorsOnCell
        
        Parameters:
        pos - a position on the map
        actors - the list of actors to scan (either actors, corpses or items)
        
        Returns:
        an array containing all the living actors on the cell
        
        */
        Engine.prototype.findActorsOnCell = function (pos, actors) {
            var actorsOnCell = [];
            var nbActors = actors.length;
            for (var i = 0; i < nbActors; i++) {
                var actor = actors[i];
                if (actor.x == pos.x && actor.y == pos.y) {
                    actorsOnCell.push(actor);
                }
            }
            return actorsOnCell;
        };

        /*
        Function: processEvent
        Handle <CHANGE_STATUS> events (see <EventListener>)
        
        Parameters:
        event - the CHANGE_STATUS event
        */
        Engine.prototype.processEvent = function (event) {
            if (event.type == 0 /* CHANGE_STATUS */) {
                this.status = event.data;
            } else if (event.type == 6 /* REMOVE_ACTOR */) {
                var item = event.data;
                this.removeItem(item);
            }
        };

        Engine.prototype.removeItem = function (item) {
            var idx = this.items.indexOf(item);
            if (idx != -1) {
                this.items.splice(idx, 1);
            }
        };

        Engine.prototype.renderActors = function (actors) {
            var nbActors = actors.length;
            for (var i = 0; i < nbActors; i++) {
                var actor = actors[i];
                if (this.map.isInFov(actor.x, actor.y)) {
                    actor.render();
                }
            }
        };

        /*
        Function: render
        The actual frame rendering. Render objects in this order:
        - the map
        - the corpses
        - the living actors
        - the GUI
        */
        Engine.prototype.render = function () {
            root.clearText();
            this.map.render();
            this.renderActors(this.corpses);
            this.renderActors(this.items);
            this.renderActors(this.actors);
            this.renderGui(root);
        };

        /*
        Function: updateActors
        Triggers actors' A.I. during a new game turn.
        Moves the dead actors from the actor list to the corpse list.
        */
        Engine.prototype.updateActors = function () {
            var nbActors = this.actors.length;
            for (var i = 1; i < nbActors; i++) {
                var actor = this.actors[i];
                actor.update(this.map, this);
                if (actor.destructible && actor.destructible.isDead()) {
                    this.actors.splice(i, 1);
                    i--;
                    nbActors--;
                    this.corpses.push(actor);
                }
            }
        };

        /*
        Function: handleKeypress
        Triggered when the player presses a key. Updates the game world and possibly starts a new turn for NPCs.
        
        Parameters:
        event - the KeyboardEvent
        */
        Engine.prototype.handleKeypress = function (event) {
            Game.EventBus.getInstance().publishEvent(new Game.Event(1 /* KEY_PRESSED */, event));
            this.player.ai.update(this.player, this.map, this);
            if (this.status == 2 /* NEW_TURN */) {
                this.updateActors();
                this.status = 1 /* IDLE */;
            }
        };

        /*
        Function: handleNewFrame
        Render a new frame. Frame rate is not tied to game turns to allow animations between turns.
        
        Parameters:
        time - elapsed time since the last frame in milliseconds
        */
        Engine.prototype.handleNewFrame = function (time) {
            if (this.status == 0 /* STARTUP */) {
                this.player.ai.update(this.player, this.map, this);
                this.status = 1 /* IDLE */;
            }
            this.render();
            root.render();
        };

        /*
        Function: handleMouseMove
        Triggered by mouse motion events.
        
        Parameters:
        event - the JQueryMouseEventObject
        */
        Engine.prototype.handleMouseMove = function (event) {
            var pos = root.getPositionFromPixels(event.pageX, event.pageY);
            Game.EventBus.getInstance().publishEvent(new Game.Event(3 /* MOUSE_MOVE */, pos));
        };
        return Engine;
    })();

    var engine = new Engine();

    /*
    Section: Game startup
    
    Function: handleNewFrame
    Renders a single frame and request a new call by the browser. This function is called by the browser before a screen repaint.
    The number of callbacks is usually 60 times per second, but will generally match the display refresh rate
    in most web browsers as per W3C recommendation. The callback rate may be reduced to a lower rate when running in background tabs.
    
    Parameters:
    time - elapsed time since the last frame in milliseconds.
    */
    function handleNewFrame(time) {
        engine.handleNewFrame(time);
    }

    /*
    Function: handleKeypress
    Keypress event callback wrapping the engine method.
    */
    function handleKeypress(event) {
        engine.handleKeypress(event);
    }

    /*
    Function: handleMouseMove
    JQuery mouse motion callback wrapping the engine method.
    */
    function handleMouseMove(event) {
        engine.handleMouseMove(event);
    }

    /*
    Function: log
    Utility to send a LOG_MESSAGE event on the event bus.
    */
    Game.log = function (text, color) {
        if (typeof color === "undefined") { color = 'white'; }
        Game.EventBus.getInstance().publishEvent(new Game.Event(2 /* LOG_MESSAGE */, new Game.Message(color, text)));
    };

    /*
    This function is called when the document has finished loading in the browser.
    It creates the root console, register the keyboard and mouse event callbacks, and draw the first frame.
    */
    $(function () {
        root = Yendor.init('#console', Game.Constants.CONSOLE_WIDTH, Game.Constants.CONSOLE_HEIGHT, '#fff', '#000');
        $(document).keydown(handleKeypress);
        $(document).mousemove(handleMouseMove);
        Yendor.loop(handleNewFrame);
    });
})(Game || (Game = {}));
