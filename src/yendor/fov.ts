// field of view algorithm : restrictive precise angle shadowcasting by Dominik Marczuk
// http://www.roguebasin.com/index.php?title=Restrictive_Precise_Angle_Shadowcasting

/*
	Section: Field of view
*/
module Yendor {
	"use strict";

	/*
		Class: Fov
		Stores the map properties and compute the field of view from a point.
	*/
	export class Fov {
		private _walkable: boolean[][];
		private _transparent: boolean[][];
		private _inFov: boolean[][];
		private startAngle: number[];
		private endAngle: number[];
		private _width: number;
		private _height: number;

		/*
			Constructor: constructor

			Parameters:
			width - the map width
			height - the map height
		*/
		constructor(_width: number, _height: number) {
			this._width = _width;
			this._height = _height;
			this._walkable = [];
			this._transparent = [];
			this._inFov = [];
			for ( var x = 0; x < _width; x++) {
				this._walkable[x] = [];
				this._transparent[x] = [];
				this._inFov[x] = [];
			}
			this.startAngle = [];
			this.endAngle = [];
		}

		/*
			Property: width
			Return the map width (read-only)
		*/
		get width() { return this._width; }

		/*
			Property: height
			Return the map height (read-only)
		*/
		get height() { return this._height; }

		/*
			Function: isWalkable

			Parameters:
			x - x coordinate in the map
			y - y coordinate in the map

			Returns:
			true if the cell at coordinate x,y is walkable
		*/
		isWalkable(x: number, y: number): boolean {
			return this._walkable[x] ? this._walkable[x][y] : false;
		}

		/*
			Function: isTransparent

			Parameters:
			x - x coordinate in the map
			y - y coordinate in the map

			Returns:
			true if the cell at coordinate x,y is transparent (doesn't block field of view)
		*/
		isTransparent(x: number, y: number): boolean {
			return this._transparent[x] ? this._transparent[x][y] : false;
		}


		/*
			Function: isInFov
			This function always return false until <computeFov> has been called.

			Parameters:
			x - x coordinate in the map
			y - y coordinate in the map

			Returns:
			true if the cell at coordinate x,y is in the last computed field of view
		*/
		isInFov(x: number, y: number): boolean {
			return this._inFov[x] ? this._inFov[x][y] : false;
		}

		/*
			Function: setCell
			Define the properties of a map cell

			Parameters:
			x - x coordinate in the map
			y - y coordinate in the map
			walkable - whether a creature can walk on this cell
			transparent - whether a creature can see through this cell
		*/
		setCell(x: number, y: number, walkable: boolean, transparent: boolean) {
			this._walkable[x][y] = walkable;
			this._transparent[x][y] = transparent;
		}

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
		computeFov(x: number, y: number, maxRadius: number, lightWalls: boolean = true) {
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
		}

		/*
			Function: clearFov
			Reset the field of view information. After this, <isInFov> returns false for all the cells.
		*/
		private clearFov() {
			for ( var x: number = 0; x < this.width; x++) {
				for ( var y: number = 0; y < this.height; y++) {
					this._inFov[x][y] = false;
				}
			}
		}

		private computeQuadrantVertical(xPov: number, yPov: number, maxRadius: number, lightWalls: boolean, dx: number, dy: number) {
			var y: number = yPov + dy;
			var done: boolean = false;
			var iteration: number = 1;
			var minAngle: number = 0;
			var lastLineObstacleCount: number = 0;
			var totalObstacleCount = 0;
			while ( ! done && y >= 0 && y < this.height ) {
				var slopePerCell: number = 1 / iteration;
				var halfSlope: number = slopePerCell * 0.5;
				var processedCell: number = Math.floor((minAngle + halfSlope) / slopePerCell);
				var xMin: number = Math.max(0, xPov - iteration);
				var xMax: number = Math.min(this.width - 1, xPov + iteration);
				done = true;
				for ( var x: number = xPov + processedCell * dx; x >= xMin && x <= xMax; x += dx) {
					var centreSlope: number = processedCell * slopePerCell;
					var startSlope: number = centreSlope - halfSlope;
					var endSlope: number = centreSlope + halfSlope;
					var visible: boolean = true;
					var extended: boolean = false;
					if ( lastLineObstacleCount > 0 && !this.isInFov(x, y) ) {
						var idx: number = 0;
						if ( visible && ! this.canSee(x, y - dy)
							&& x - dx >= 0 && x - dx < this.width && ! this.canSee(x - dx, y - dy)) {
							visible = false;
						} else {
							while ( visible && idx < lastLineObstacleCount ) {
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
								if (processedCell === iteration) {
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
				if (iteration === maxRadius) {
					done = true;
				}
				iteration++;
				lastLineObstacleCount = totalObstacleCount;
				y += dy;
				if (y < 0 || y >= this.height) {
					done = true;
				}
			}
		}

		private computeQuadrantHorizontal(xPov: number, yPov: number, maxRadius: number, lightWalls: boolean, dx: number, dy: number) {
			var x: number = xPov + dx;
			var done: boolean = false;
			var iteration: number = 1;
			var minAngle: number = 0;
			var lastLineObstacleCount: number = 0;
			var totalObstacleCount = 0;
			while ( ! done && x >= 0 && x < this.width ) {
				var slopePerCell: number = 1 / iteration;
				var halfSlope: number = slopePerCell * 0.5;
				var processedCell: number = Math.floor((minAngle + halfSlope) / slopePerCell);
				var yMin: number = Math.max(0, yPov - iteration);
				var yMax: number = Math.min(this.height - 1, yPov + iteration);
				done = true;
				for ( var y: number = yPov + processedCell * dy; y >= yMin && y <= yMax; y += dy) {
					var centreSlope: number = processedCell * slopePerCell;
					var startSlope: number = centreSlope - halfSlope;
					var endSlope: number = centreSlope + halfSlope;
					var visible: boolean = true;
					var extended: boolean = false;
					if ( lastLineObstacleCount > 0 && ! this.isInFov(x, y) ) {
						var idx: number = 0;
						if ( visible && ! this.canSee(x - dx, y)
							&& y - dy >= 0 && y - dy < this.height && ! this.canSee(x - dx, y - dy)) {
							visible = false;
						} else {
							while ( visible && idx < lastLineObstacleCount ) {
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
								if (processedCell === iteration) {
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
				if (iteration === maxRadius) {
					done = true;
				}
				iteration++;
				lastLineObstacleCount = totalObstacleCount;
				x += dx;
				if (x < 0 || x >= this.width) {
					done = true;
				}
			}
		}

		private canSee(x: number, y: number) {
			return this.isInFov(x, y) && this.isTransparent(x, y);
		}
	}
}
