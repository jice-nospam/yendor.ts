/**
	Section: Path finding
*/
module Yendor {
    "use strict";

	/**
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
            let len: number = elements.length;
            for (let i: number = 0; i < len; ++i) {
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
            let result: T = this.content[0];
            let end: T = this.content.pop();
            if (this.content.length > 0) {
                this.content[0] = end;
                this.sinkDown(0);
            }
            return result;
        }
		/**
			Function: contains
			Check if the heap contains en element. Only works if the elements implements <Comparable>
		*/
        contains(element: T): boolean {
            let len: number = this.content.length;
            for (let i: number = 0; i < len; ++i) {
                if ((<any>element).equals(<any>(this.content[i]))) {
                    return true;
                }
            }
            return false;
        }
        remove(element: T): boolean {
            let index: number = this.content.indexOf(element);
            if ( index === -1 ) {
                return false;
            }
            let end: T = this.content.pop();
            if (index !== this.content.length ) {
                this.content[index] = end;
                if (this.scoreFunction(end) < this.scoreFunction(element)) {
                    this.bubbleUp(index);
                } else {
                    this.sinkDown(index);
                }
            }
            return true;
        }
        size(): number {
            return this.content.length;
        }
        isEmpty(): boolean {
            return this.content.length === 0;
        }
        private bubbleUp(n: number) {
            let element: T = this.content[n];
            while (n > 0) {
                let parentN: number = Math.floor((n + 1) / 2) - 1;
                let parent: T = this.content[parentN];
                if (this.scoreFunction(element) <= this.scoreFunction(parent)) {
                    this.content[parentN] = element;
                    this.content[n] = parent;
                    n = parentN;
                } else {
                    break;
                }
            }
        }
        private sinkDown(n: number) {
            let length: number = this.content.length;
            let element: T = this.content[n];
            let elemScore: number = this.scoreFunction(element);
            while (true) {
                let child2N: number = (n + 1) * 2;
                let child1N: number = child2N - 1;
                let swap: number = undefined;
                let child1Score: number;
                if (child1N < length) {
                    let child1 = this.content[child1N];
                    child1Score = this.scoreFunction(child1);
                    if (child1Score < elemScore) {
                        swap = child1N;
                    }
                }
                if (child2N < length) {
                    let child2 = this.content[child2N];
                    let child2Score = this.scoreFunction(child2);
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

	/**
		Class: PathFinder
		Find the shortest path on a map using A* algorithm.
		Adapted from https://en.wikipedia.org/wiki/A*_search_algorithm
	*/
    export class PathFinder {
        private walkCostFunction: (from: Core.Position, to: Core.Position) => number;
        private heuristicFunction: (from: Core.Position, to: Core.Position) => number;
        private mapWidth: number;
        private mapHeight: number;
        // limit the number of steps to keep the pathfinder from sucking all cpu
        private maxSteps: number;

		/**
			Constructor: constructor
			Parameters:
			mapWidth - width of the map
			mapHeight - height of the map
			walkCostFunction - a function returning the actual walk cost between two adjacent position. 
				Return 0 for a non walkable destination cell. Default : cost = 1
			heuristicFunction - a function computing the estimated walk cost from a cell to the destination. Default : cost = distance
		*/
        constructor(mapWidth: number, mapHeight: number,
            walkCostFunction?: (from: Core.Position, to: Core.Position) => number,
            heuristicFunction?: (from: Core.Position, to: Core.Position) => number) {
            this.walkCostFunction = walkCostFunction ? walkCostFunction : function(from: Core.Position, to: Core.Position) { return 1; };
            this.heuristicFunction = heuristicFunction ? heuristicFunction : Core.Position.distance;
            this.mapWidth = mapWidth;
            this.mapHeight = mapHeight;
        }

        private pos2Offset(pos: Core.Position): number {
            return pos.x + pos.y * this.mapWidth;
        }

        private arrayContains(array: Core.Position[], pos: Core.Position): boolean {
            let len: number = array.length;
            for (let i: number = 0; i < len; ++i) {
                if (array[i].x === pos.x && array[i].y === pos.y) {
                    return true;
                }
            }
            return false;
        }

        /**
            Function: getPath
            Compute the shortest path between two positions.

            Returns:
            An array of Core.Position containing the reversed path. Use pop() on this array to walk the path.
            Returns undefined if no path can be found (no path exists or destination is too far away)
        */
        getPath(from: Core.Position, to: Core.Position): Core.Position[] {
            let closedSet: Core.Position[] = [];
            let cameFrom: { [index: number]: Core.Position } = {};
            // walk cost from start to this cell
            let gScore: { [index: number]: number } = {};
            // estimated walk cost from start to the destination cell, going through this cell
            let fScore: { [index: number]: number } = {};
            let pathFinderThis: PathFinder = this;
            let openSet: BinaryHeap<Core.Position> = new BinaryHeap<Core.Position>(
                function(pos: Core.Position): number {
                    return fScore[pathFinderThis.pos2Offset(pos)];
                }
            );
            let fromOffset: number = this.pos2Offset(from);
            gScore[fromOffset] = 0;
            fScore[fromOffset] = gScore[fromOffset] + this.heuristicFunction(from, to);
            this.maxSteps = fScore[fromOffset] * 10;
            openSet.push(new Core.Position(from.x, from.y));
            let step: number = this.maxSteps;
            while (openSet.size() > 0 && step > 0) {
                step--;
                let current: Core.Position = <Core.Position>openSet.pop();
                if (current.x === to.x && current.y === to.y) {
                    // reached destination. build path
                    return this.reconstructPath(cameFrom, current);
                }
                closedSet.push(current);
                let currentOffset: number = this.pos2Offset(current);
                let adjacentCells: Core.Position[] = current.getAdjacentCells(this.mapWidth, this.mapHeight);
                let len: number = adjacentCells.length;
                for (let i: number = 0; i < len; ++i) {
                    let neighbor: Core.Position = adjacentCells[i];
                    if (!this.arrayContains(closedSet, neighbor)) {
                        let neighborOffset: number = this.pos2Offset(neighbor);
                        let cost: number = this.walkCostFunction(current, neighbor);
                        if (cost > 0) {
                            let tentativeGScore: number = gScore[currentOffset] + cost;
                            let neighborInOpenSet: boolean = openSet.contains(neighbor);
                            if (!neighborInOpenSet || tentativeGScore < gScore[neighborOffset]) {
                                cameFrom[neighborOffset] = current;
                                gScore[neighborOffset] = tentativeGScore;
                                fScore[neighborOffset] = tentativeGScore + this.heuristicFunction(neighbor, to);
                                if (!neighborInOpenSet) {
                                    openSet.push(neighbor);
                                }
                            }
                        }
                    }
                }
            }
            if (step === 0) {
                console.log("Could not find path from " + from.x + "," + from.y
                    + " to " + to.x + "," + to.y + ": max steps reached");
            }
            // no path found
            return undefined;
        }

        private reconstructPath(cameFrom: { [index: number]: Core.Position }, current: Core.Position): Core.Position[] {
            let path: Core.Position[] = [current];
            let currentOffset = this.pos2Offset(current);
            while (cameFrom[currentOffset]) {
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
