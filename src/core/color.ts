/*
	Section: Color
*/
module Core {
    "use strict";
	/*
		Interface: Color
		Typesafe number or string color wrapper. 
		Stores colors using a number value between 0 and 0xFFFFFF or a CSS string 
		format "#rgb", "#rrggbb", "rgb(r,g,b)" or one of the 17 standard colors :
		- "aqua"
		- "black"
		- "blue"
		- "fuchsia"
		- "gray"
		- "green"
		- "lime"
		- "maroon"
		- "navy"
		- "olive"
		- "orange"
		- "purple"
		- "red"
		- "silver"
		- "teal"
		- "white"
		- "yellow"
		The faster format is the number format. Use it as often as possible.
	*/
    export type Color = String | number;

	/*
		Class: ColorUtils
		Some color manipulation utilities.
	*/
    export class ColorUtils {
		/*
			Function: multiply
			Multiply a color with a number. 
			> (r,g,b) * n == (r*n, g*n, b*n)

			Parameters:
			color - the color
			coef - the factor

			Returns:
			A new color as a number between 0x000000 and 0xFFFFFF
		*/
        static multiply(color: Color, coef: number): Color {
            var r, g, b: number;
            if (typeof color === "number") {
                // duplicated toRgbFromNumber code to avoid function call and array allocation
                r = (<number>color & 0xFF0000) >> 16;
                g = (<number>color & 0x00FF00) >> 8;
                b = <number>color & 0x0000FF;
            } else {
                var rgb: number[] = ColorUtils.toRgb(color);
                r = rgb[0];
                g = rgb[1];
                b = rgb[2];
            }
            r = Math.round(r * coef);
            g = Math.round(g * coef);
            b = Math.round(b * coef);
            r = r < 0 ? 0 : r > 255 ? 255 : r;
            g = g < 0 ? 0 : g > 255 ? 255 : g;
            b = b < 0 ? 0 : b > 255 ? 255 : b;
            return b | (g << 8) | (r << 16);
        }

		/*
			Function: add
			Add two colors.
			> (r1,g1,b1) + (r2,g2,b2) = (r1+r2,g1+g2,b1+b2)

			Parameters:
			col1 - the first color
			col2 - the second color

			Returns:
			A new color as a number between 0x000000 and 0xFFFFFF
		*/
        static add(col1: Color, col2: Color): Color {
            var r = ((<number>col1 & 0xFF0000) >> 16) + ((<number>col2 & 0xFF0000) >> 16);
            var g = ((<number>col1 & 0x00FF00) >> 8) + ((<number>col2 & 0x00FF00) >> 8);
            var b = (<number>col1 & 0x0000FF) + (<number>col2 & 0x0000FF);
            if (r > 255) {
                r = 255;
            }
            if (g > 255) {
                g = 255;
            }
            if (b > 255) {
                b = 255;
            }
            return b | (g << 8) | (r << 16);
        }

        private static stdCol = {
            "aqua": [0, 255, 255],
            "black": [0, 0, 0],
            "blue": [0, 0, 255],
            "fuchsia": [255, 0, 255],
            "gray": [128, 128, 128],
            "green": [0, 128, 0],
            "lime": [0, 255, 0],
            "maroon": [128, 0, 0],
            "navy": [0, 0, 128],
            "olive": [128, 128, 0],
            "orange": [255, 165, 0],
            "purple": [128, 0, 128],
            "red": [255, 0, 0],
            "silver": [192, 192, 192],
            "teal": [0, 128, 128],
            "white": [255, 255, 255],
            "yellow": [255, 255, 0]
        };
		/*
			Function: toRgb
			Convert a string color into a [r,g,b] number array.

			Parameters:
			color - the color

			Returns:
			An array of 3 numbers [r,g,b] between 0 and 255.
		*/
        static toRgb(color: Color): number[] {
            if (typeof color === "number") {
                return ColorUtils.toRgbFromNumber(<number>color);
            } else {
                return ColorUtils.toRgbFromString(<String>color);
            }
        }

		/*
			Function: toWeb
			Convert a color into a CSS color format (as a string)
		*/
        static toWeb(color: Color): string {
            if (typeof color === "number") {
                var ret: string = color.toString(16);
                var missingZeroes: number = 6 - ret.length;
                if (missingZeroes > 0) {
                    ret = "000000".substr(0, missingZeroes) + ret;
                }
                return "#" + ret;
            } else {
                return <string>color;
            }
        }

        private static toRgbFromNumber(color: number): number[] {
            var r = (color & 0xFF0000) >> 16;
            var g = (color & 0x00FF00) >> 8;
            var b = color & 0x0000FF;
            return [r, g, b];
        }

        private static toRgbFromString(color: String): number[] {
            color = color.toLowerCase();
            var stdColValues: number[] = ColorUtils.stdCol[String(color)];
            if (stdColValues) {
                return stdColValues;
            }
            if (color.charAt(0) === "#") {
                // #FFF or #FFFFFF format
                if (color.length === 4) {
                    // expand #FFF to #FFFFFF
                    color = "#" + color.charAt(1) + color.charAt(1) + color.charAt(2)
                        + color.charAt(2) + color.charAt(3) + color.charAt(3);
                }
                var r: number = parseInt(color.substr(1, 2), 16);
                var g: number = parseInt(color.substr(3, 2), 16);
                var b: number = parseInt(color.substr(5, 2), 16);
                return [r, g, b];
            } else if (color.indexOf("rgb(") === 0) {
                // rgb(r,g,b) format
                var rgbList = color.substr(4, color.length - 5).split(",");
                return [parseInt(rgbList[0], 10), parseInt(rgbList[1], 10), parseInt(rgbList[2], 10)];
            }
            return [0, 0, 0];
        }
		/*
			Function: toNumber
			Convert a string color into a number.

			Parameters:
			color - the color

			Returns:
			A number between 0x000000 and 0xFFFFFF.
		*/
        static toNumber(color: Color): number {
            if (typeof color === "number") {
                return <number>color;
            }
            var scol: String = <String>color;
            if (scol.charAt(0) === "#" && scol.length === 7) {
                return parseInt(scol.substr(1), 16);
            } else {
                var rgb = ColorUtils.toRgbFromString(scol);
                return rgb[0] * 65536 + rgb[1] * 256 + rgb[2];
            }
        }
    }
}
