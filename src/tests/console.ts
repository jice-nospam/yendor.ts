/// <reference path="tsUnit.ts" />
/// <reference path="../yendor/console.ts" />
module Tests {
	"use strict";

	export class ConsoleTests extends tsUnit.TestClass {

		hexColorMultiply() {
			var col: Yendor.Color = "#FFFFFF";
			var col2: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.5);
			var col3: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.1);

			this.areIdentical( col2, 0x808080, "col2" );
			this.areIdentical( col3, 0x1A1A1A, "col3" );
		}

		shortHexColorMultiply() {
			var col: Yendor.Color = "#FFF";
			var col2: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.5);
			var col3: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.1);

			this.areIdentical( col2, 0x808080, "col2" );
			this.areIdentical( col3, 0x1A1A1A, "col3" );
		}

		rgbColorMultiply() {
			var col: Yendor.Color = "rgb(255,255,255)";
			var col2: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.5);
			var col3: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.1);

			this.areIdentical( col2, 0x808080, "col2" );
			this.areIdentical( col3, 0x1A1A1A, "col3" );
		}

		stdColorMultiply() {
			var col: Yendor.Color = "white";
			var col2: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.5);
			var col3: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.1);

			this.areIdentical( col2, 0x808080, "col2" );
			this.areIdentical( col3, 0x1A1A1A, "col3" );
		}
	}
}
