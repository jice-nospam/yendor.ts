/*
	Section: Path finding
*/
module Yendor {
	"use strict";

	/*
		Class: BinaryHeap
		A min heap used for A* algorithm.
		Adapted from http://www.openbookproject.net/books/mi2pwjs/app_b.html#binary-heaps-appendix
	*/
	export class BinaryHeap<T> {
		private content: T[] = [];
		private scoreFunction: (element: T) => number;
		constructor(scoreFunction: (element: T) => number) {
			this.scoreFunction = scoreFunction;
		}
		push(element: T) {
			this.content.push(element);
			this.bubbleUp(this.content.length - 1);
		}
		pushAll(elements: T[]) {
			var len: number = elements.length;
			for (var i: number = 0; i < len; ++i) {
				this.push(elements[i]);
			}
		}
		peek(index: number = 0): T {
			return this.content.length > index ? this.content[index] : undefined;
		}
		clear() {
			this.content = [];
		}
		pop(): T {
			var result: T = this.content[0];
			var end: T = this.content.pop();
			if ( this.content.length > 0 ) {
				this.content[0] = end;
				this.sinkDown(0);
			}
			return result;
		}
		/*
			Function: contains
			Check if the heap contains en element. Only works if the elements implements Comparable
		*/
		contains(element: T): boolean {
			var len: number = this.content.length;
			for (var i: number = 0; i < len; ++i) {
				if ( (<any>element).equals(<any>(this.content[i])) ) {
					return true;
				}
			}
			return false;
		}
		remove(element: T) {
			var len: number = this.content.length;
			for (var i: number = 0; i < len; ++i) {
				if ( this.content[i] === element ) {
					var end: T = this.content.pop();
					if (i !== len - 1) {
						this.content[i] = end;
						if (this.scoreFunction(end) < this.scoreFunction(element)) {
							this.bubbleUp(i);
						} else {
							this.sinkDown(i);
						}
					}
					return;
				}
			}
		}
		size(): number {
			return this.content.length;
		}
		isEmpty(): boolean {
			return this.content.length === 0;
		}
		private bubbleUp(n: number) {
			var element: T = this.content[n];
			while (n > 0) {
				var parentN: number = Math.floor((n + 1) / 2) - 1;
                var parent: T = this.content[parentN];
                if (this.scoreFunction(element) < this.scoreFunction(parent)) {
                	this.content[parentN] = element;
                	this.content[n] = parent;
                	n = parentN;
                } else {
                	break;
                }
			}
		}
		private sinkDown(n: number) {
			var length: number = this.content.length;
            var element: T = this.content[n];
            var elemScore: number = this.scoreFunction(element);
            while (true) {
            	var child2N: number = (n + 1) * 2;
            	var child1N: number = child2N - 1;
            	var swap: number = undefined;
            	if (child1N < length) {
            		var child1 = this.content[child1N];
            		var child1Score = this.scoreFunction(child1);
            		if (child1Score < elemScore) {
            			swap = child1N;
            		}
            	}
            	if (child2N < length) {
            		var child2 = this.content[child2N];
            		var child2Score = this.scoreFunction(child2);
            		if (child2Score < (swap === undefined ? elemScore : child1Score)) {
            			swap = child2N;
            		}
            	}
            	if (swap !== undefined) {
            		this.content[n] = this.content[swap];
            		this.content[swap] = element;
            		n = swap;
            	} else {
            		break;
            	}
            }
		}
	}

	/*
		Class: PathFinder
		Find the shortest path on a map using A* algorithm.
		Adapted from https://en.wikipedia.org/wiki/A*_search_algorithm
	*/
	export class PathFinder {
		private walkCostFunction: (from: Position, to: Position) => number;
		private heuristicFunction: (from: Position, to: Position) => number;
		private mapWidth: number;
		private mapHeight: number;
		// limit the number of steps to keep the pathfinder from sucking all cpu
		private maxSteps: number;

		/*
			Constructor: constructor
			Parameters:
			mapWidth - width of the map
			mapHeight - height of the map
			walkCostFunction - a function returning the actual walk cost between two adjacent position. 
				Return 0 for a non walkable destination cell. Default : cost = 1
			heuristicFunction - a function computing the estimated walk cost from a cell to the destination. Default : cost = distance
		*/
		constructor(mapWidth: number, mapHeight: number,
			walkCostFunction?: (from: Position, to: Position) => number,
			heuristicFunction?: (from: Position, to: Position) => number) {
			this.walkCostFunction = walkCostFunction ? walkCostFunction : function(from: Position, to: Position) { return 1; };
			this.heuristicFunction = heuristicFunction ? heuristicFunction : Position.distance;
			this.mapWidth = mapWidth;
			this.mapHeight = mapHeight;
			this.maxSteps = mapWidth * mapHeight / 4;
		}

		private pos2Offset(pos: Position): number {
			return pos.x + pos.y * this.mapWidth;
		}

		private arrayContains(array: Position[], pos: Position): boolean {
			var len: number = array.length;
			for ( var i: number = 0; i < len; ++i) {
				if ( array[i].x === pos.x && array[i].y === pos.y ) {
					return true;
				}
			}
			return false;
 		}

 		/*
 			Function: getPath
 			Compute the shortest path between two positions.

 			Returns:
 			An array of Yendor.Position containing the reversed path. Use pop() on this array to walk the path.
 			Returns undefined if no path can be found (no path exists or destination is too far away)
 		*/
		getPath(from: Position, to: Position): Position[] {
			var closedSet: Position[] = [];
			var cameFrom: { [index: number]: Position} = {};
			// walk cost from start to this cell
			var gScore: { [index: number]: number} = {};
			// estimated walk cost from start to the destination cell, going through this cell
			var fScore: { [index: number]: number} = {};
			var pathFinderThis: PathFinder = this;
			var openSet: BinaryHeap<Position> = new BinaryHeap<Position>(
				function(pos: Position): number {
					return fScore[pathFinderThis.pos2Offset(pos)];
				}
			);
			var fromOffset: number = this.pos2Offset(from);
			gScore[fromOffset] = 0;
			fScore[fromOffset] = gScore[fromOffset] + this.heuristicFunction(from, to);
			openSet.push(new Position(from.x, from.y));
			var step: number = this.maxSteps;
			while (openSet.size() > 0 && step > 0) {
				step --;
				var current: Position = <Position>openSet.pop();
				if ( current.x === to.x && current.y === to.y) {
					// reached destination. build path
					return this.reconstructPath( cameFrom, current );
				}
				closedSet.push(current);
				var currentOffset: number = this.pos2Offset(current);
				var adjacentCells: Position[] = current.getAdjacentCells(this.mapWidth, this.mapHeight);
				var len: number = adjacentCells.length;
				for ( var i: number = 0; i < len; ++i) {
					var neighbor: Position = adjacentCells[i];
					if ( !this.arrayContains(closedSet, neighbor)) {
						var neighborOffset: number = this.pos2Offset(neighbor);
						var cost: number = this.walkCostFunction(current, neighbor);
						if ( cost > 0 ) {
							var tentativeGScore: number = gScore[currentOffset] + cost;
							var neighborInOpenSet: boolean = openSet.contains(neighbor);
							if ( !neighborInOpenSet || tentativeGScore < gScore[neighborOffset]) {
								cameFrom[neighborOffset] = current;
								gScore[neighborOffset] = tentativeGScore;
								fScore[neighborOffset] = tentativeGScore + this.heuristicFunction(neighbor, to);
								if (! neighborInOpenSet) {
									openSet.push(neighbor);
								}
							}
						}
					}
				}
			}
			if ( step === 0 ) {
				console.log("Could not find path from " + from.x + "," + from.y
					+ " to " + to.x + "," + to.y + ": max steps reached");
			}
			// no path found
			return undefined;
		}

		private reconstructPath(cameFrom: { [index: number]: Position}, current: Position): Position[] {
			var path: Position[] = [current];
			var currentOffset = this.pos2Offset(current);
			while ( cameFrom[ currentOffset] ) {
				current = cameFrom[currentOffset];
				currentOffset = this.pos2Offset(current);
				if (cameFrom[currentOffset]) {
					path.push(current);
				}
			}
			return path;
		}
	}
}
