/// <reference path="tsUnit.ts" />
/// <reference path="../yendor/console.ts" />
module Tests {
	export class ConsoleTests extends tsUnit.TestClass {

		hexColorMultiply() {
			var col: Yendor.Color = "#FFFFFF";
			var col2: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.5);
			var col3: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.1);

			this.areIdentical( col2, "rgb(128,128,128)", "col2" );
			this.areIdentical( col3, "rgb(26,26,26)", "col3" );
		}

		shortHexColorMultiply() {
			var col: Yendor.Color = "#FFF";
			var col2: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.5);
			var col3: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.1);

			this.areIdentical( col2, "rgb(128,128,128)", "col2" );
			this.areIdentical( col3, "rgb(26,26,26)", "col3" );
		}

		rgbColorMultiply() {
			var col: Yendor.Color = "rgb(255,255,255)";
			var col2: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.5);
			var col3: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.1);

			this.areIdentical( col2, "rgb(128,128,128)", "col2" );
			this.areIdentical( col3, "rgb(26,26,26)", "col3" );
		}

		stdColorMultiply() {
			var col: Yendor.Color = "white";
			var col2: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.5);
			var col3: Yendor.Color = Yendor.ColorUtils.multiply(col, 0.1);

			this.areIdentical( col2, "rgb(128,128,128)", "col2" );
			this.areIdentical( col3, "rgb(26,26,26)", "col3" );
		}
	}
}
