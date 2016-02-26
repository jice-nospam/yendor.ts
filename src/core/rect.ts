/*
	Section: Rect
*/
module Core {
    "use strict";
	/*
		Class: Rect
		Stores a position and size
	*/
    export class Rect extends Position implements Comparable {
		/*
			Property: w
		*/
        w: number;

		/*
			Property: h
		*/
        h: number;

		/*
			Constructor: constructor

			Parameters:
			_x : the column
			_y : the row
			_w : the width
			_h : the height
		*/
        constructor(_x: number = 0, _y: number = 0, _w: number = 0, _h: number = 0) {
            super(_x, _y);
            this.w = _w;
            this.h = _h;
        }

		/*
			Function: resize
			Update the size of this rectangle.

			Parameters:
			w - the width
			h - the height
		*/
        resize(w: number, h: number) {
            this.w = w;
            this.h = h;
        }

        equals(r: Rect): boolean {
            return this.x === r.x && this.y === r.y && this.w === r.w && this.h === r.h;
        }

		/*
			Function: contains
			Check if a point is inside this rectangle.

			Parameters:
			px - the point x coordinate.
			py - the point y coordinate.

			Returns:
			true if the point is inside the rectangle.
		*/
        contains(px: number, py: number): boolean {
            return px >= this.x && py >= this.y && px <= this.x + this.w && py <= this.y + this.h;
        }

		/*
			Function: containsRect
			Check if a rectangle is inside this rectangle.

			Parameters:
			rect - the rectangle

			Returns:
			true if rect is inside *this*.
		*/
        containsRect(rect: Rect) {
            return this.x <= rect.x && this.y <= rect.y
                && this.x + this.w >= rect.x + rect.w
                && this.y + this.h >= rect.y + rect.h;
        }
    }
}