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
            if (color.charAt(0) == '#') {
                return parseInt('0x' + color.substr(1));
            } else {
                var rgb = ColorUtils.toRgb(color);
                return rgb[0] * 65536 + rgb[1] * 256 + rgb[2];
            }
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
            this.stage = new PIXI.Stage(0xFFFFFF);
            this.renderer = PIXI.autoDetectRenderer(640, 480, { antialias: false, clearBeforeRender: false, preserveDrawingBuffer: false, resolution: 1, transparent: false, view: this.canvas });
            this.font = PIXI.BaseTexture.fromImage(fontUrl, false, PIXI.scaleModes.NEAREST);
            this.charWidth = this.font.width / 16;
            this.charHeight = this.font.height / 16;
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
                    cell.width = this.charWidth;
                    cell.height = this.charHeight;
                    this.cells[x][y] = cell;
                    this.stage.addChild(cell);
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
                    this.cells[x][y].tint = Yendor.ColorUtils.toNumber(this.fore[x][y]);
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
/// <reference path="../decl/jquery.d.ts" />
/// <reference path="../yendor/yendor.ts" />
var root;

var Benchmark;
(function (Benchmark) {
    // these are the dimensions of the libtcod benchmark sample
    var WIDTH = 80;
    var HEIGHT = 60;
    var rootDiv;
    var rng = new Yendor.ComplementaryMultiplyWithCarryRandom();
    var framesPerSecond = 0;
    var currentFrameCount = 0;
    var fpsTimer = 0;

    function render() {
        for (var x = 0; x < WIDTH; x++) {
            for (var y = 0; y < HEIGHT; y++) {
                var r = rng.getNumber(0, 255);
                var g = rng.getNumber(0, 255);
                var b = rng.getNumber(0, 255);
                var col = 'rgb(' + r + ',' + g + ',' + b + ')';
                root.back[x][y] = col;
                r = rng.getNumber(0, 255);
                g = rng.getNumber(0, 255);
                b = rng.getNumber(0, 255);
                col = 'rgb(' + r + ',' + g + ',' + b + ')';
                root.fore[x][y] = col;
                var ch = rng.getNumber(32, 128);
                root.setChar(x, y, String.fromCharCode(ch));
            }
        }
    }

    function handleNewFrame(time) {
        currentFrameCount++;
        if (fpsTimer == 0) {
            fpsTimer = time;
        } else if (time - fpsTimer > 1000) {
            framesPerSecond = currentFrameCount;
            fpsTimer = time;
            $('#fps')[0].innerHTML = framesPerSecond + ' fps';
            currentFrameCount = 0;
        }
        render();
        root.render();
    }

    $(function () {
        root = Yendor.init('#console', WIDTH, HEIGHT, '#000', '#fff');
        $('body').append("<div id = 'fps'/>");
        Yendor.loop(handleNewFrame);
    });
})(Benchmark || (Benchmark = {}));
