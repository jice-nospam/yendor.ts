/**
 * Section: Rect
 */
import * as pos from "./position";
/**
 * Class: Rect
 * Stores a position and size
 */
export class Rect extends pos.Position implements pos.IComparable {
    /**
     * Constructor: constructor
     * Parameters:
     * x : the column
     * y : the row
     * w : the width
     * h : the height
     */
    constructor(x: number = 0, y: number = 0, public w: number = 0, public h: number = 0) {
        super(x, y);
    }

    public toString() {
        return super.toString() + "(" + this.w + "," + this.h + ")";
    }

    /**
     * Function: resize
     * Update the size of this rectangle.
     * Parameters:
     * w - the width
     * h - the height
     */
    public resize(w: number, h: number) {
        this.w = w;
        this.h = h;
    }

    public equals(r: Rect): boolean {
        return this.x === r.x && this.y === r.y && this.w === r.w && this.h === r.h;
    }

    /**
     * Function: contains
     * Check if a point is inside this rectangle.
     * Parameters:
     * px - the point x coordinate.
     * py - the point y coordinate.
     * Returns:
     * true if the point is inside the rectangle.
     */
    public contains(p: pos.Position): boolean;
    public contains(px: number, py: number): boolean;
    public contains(px: number|pos.Position, py?: number) {
        if (typeof px === "number") {
            return px >= this.x && py >= this.y && px < this.x + this.w && py < this.y + this.h;
        } else {
            return px.x >= this.x && px.y >= this.y && px.x < this.x + this.w && px.y < this.y + this.h;
        }
    }

    /**
     * Function: containsRect
     * Check if a rectangle is inside this rectangle.
     * Parameters:
     * rect - the rectangle
     * Returns:
     * true if rect is inside *this*.
     */
    public containsRect(rect: Rect): boolean {
        return this.x <= rect.x && this.y <= rect.y
            && this.x + this.w >= rect.x + rect.w
            && this.y + this.h >= rect.y + rect.h;
    }

    /**
     * Function: intersects
     * Check if a rectangle is intersecting this rectangle.
     * Parameters:
     * rect - the rectangle
     * Returns:
     * true if rect and *this* are intersecting.
     */
    public intersects(rect: Rect): boolean {
        return !(this.x + this.w <= rect.x
            || rect.x + rect.w <= this.x
            || this.y + this.h <= rect.y
            || rect.y + rect.h <= this.y);
    }

    /**
     * Function: expand
     * Grows this rectangle so that it contains a point
     * Parameters :
     * p - the point's position
     */
    public expand(p: pos.Position) {
        if (p.x < this.x) {
            this.w += this.x - p.x;
            this.x = p.x;
        } else if (p.x >= this.x + this.w) {
            this.w += p.x - this.x - this.w + 1;
        }
        if (p.y < this.y) {
            this.h += this.y - p.y;
            this.y = p.y;
        } else if (p.y >= this.y + this.h) {
            this.h += p.y - this.y - this.h + 1;
        }
    }

    public expandRect(r: Rect) {
        this.expand(r);
        this.expand(new pos.Position(r.x + r.w - 1, r.y + r.h - 1));
    }

    public set(rect: Rect) {
        this.x = rect.x;
        this.y = rect.y;
        this.w = rect.w;
        this.h = rect.h;
    }

    public clamp(xmin: number, ymin: number, xmax: number, ymax: number) {
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
