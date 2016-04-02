/**
	Section: Rect
*/
module Core {
    "use strict";
	/**
		Class: Rect
		Stores a position and size
	*/
    export class Rect extends Position implements Comparable {
		/**
			Property: w
		*/
        w: number;

		/**
			Property: h
		*/
        h: number;

		/**
			Constructor: constructor

			Parameters:
			_x : the column
			_y : the row
			_w : the width
			_h : the height
		*/
        constructor(_x: number = 0, _y: number = 0, _w: number = 0, _h: number = 0) {
            super(_x, _y);
            this.className="Core.Rect";
            this.w = _w;
            this.h = _h;
        }

		/**
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

		/**
			Function: contains
			Check if a point is inside this rectangle.

			Parameters:
			px - the point x coordinate.
			py - the point y coordinate.

			Returns:
			true if the point is inside the rectangle.
		*/
        contains(pos: Core.Position): boolean;
        contains(px: number, py: number): boolean;
        contains(px: number|Core.Position, py?:number) {
            if (typeof px === "number") {
                return px >= this.x && py >= this.y && px < this.x + this.w && py < this.y + this.h;
            } else {
                return px.x >= this.x && px.y >= this.y && px.x < this.x + this.w && px.y < this.y + this.h;
            }
        }

		/**
			Function: containsRect
			Check if a rectangle is inside this rectangle.

			Parameters:
			rect - the rectangle

			Returns:
			true if rect is inside *this*.
		*/
        containsRect(rect: Rect): boolean {
            return this.x <= rect.x && this.y <= rect.y
                && this.x + this.w >= rect.x + rect.w
                && this.y + this.h >= rect.y + rect.h;
        }
        
		/**
			Function: intersects
			Check if a rectangle is intersecting this rectangle.

			Parameters:
			rect - the rectangle

			Returns:
			true if rect and *this* are intersecting.
		*/
        intersects(rect: Rect): boolean {
            return !(this.x + this.w <= rect.x
                || rect.x + rect.w <= this.x
                || this.y + this.h <= rect.y
                || rect.y + rect.h <= this.y);
        }
        
        /**
            Function: expand
            Grows this rectangle so that it contains a point
            
            Parameters :
            pos - the point's position
        */
        expand(pos: Core.Position) {
            if (pos.x < this.x) {
                this.w += this.x - pos.x;
                this.x = pos.x;
            } else if (pos.x >= this.x + this.w) {
                this.w += pos.x - this.x - this.w + 1;
            }
            if (pos.y < this.y) {
                this.h += this.y - pos.y;
                this.y = pos.y;
            } else if (pos.y >= this.y + this.h) {
                this.h += pos.y - this.y - this.h + 1;
            }
        }
        
        set(rect: Core.Rect) {
            this.x = rect.x;
            this.y = rect.y;
            this.w = rect.w;
            this.h = rect.h;
        }
        
        clamp(xmin: number, ymin: number, xmax: number, ymax: number) {
            if ( this.x < xmin ) {
                this.w -= xmin - this.x;
                this.x = xmin;
            }
            if ( this.x + this.w > xmax ) {
                this.w = xmax - this.x;
            }
            if ( this.y < ymin ) {
                this.h -= ymin - this.y;
                this.y = ymin;
            }
            if ( this.y + this.h > ymax ) {
                this.h = ymax - this.y;
            }
        }
    }
}