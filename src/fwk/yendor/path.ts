/**
 * Section: Path finding
 */
import * as Core from "../core/main";
import { BinaryHeap } from "./heap";

/**
 * Class: PathFinder
 * Find the shortest path on a map using A* algorithm.
 * Adapted from https://en.wikipedia.org/wiki/A*_search_algorithm
 */
export class PathFinder {
    private walkCostFunction: (from: Core.Position, to: Core.Position) => number;
    private heuristicFunction: (from: Core.Position, to: Core.Position) => number;
    private mapWidth: number;
    private mapHeight: number;
    // limit the number of steps to keep the pathfinder from sucking all cpu
    private maxSteps: number;

    /**
     * Constructor: constructor
     * Parameters:
     * mapWidth - width of the map
     * mapHeight - height of the map
     * walkCostFunction - a function returning the actual walk cost between two adjacent position.
     *     Return 0 for a non walkable destination cell. Default : cost = 1
     * heuristicFunction - a function computing the estimated walk cost from a cell
     * to the destination. Default : cost = distance
     */
    constructor(mapWidth: number, mapHeight: number,
                walkCostFunction?: (from: Core.Position, to: Core.Position) => number,
                heuristicFunction?: (from: Core.Position, to: Core.Position) => number) {
        this.walkCostFunction = walkCostFunction ? walkCostFunction :
            function(_from: Core.Position, _to: Core.Position) { return 1; };
        this.heuristicFunction = heuristicFunction ? heuristicFunction : Core.Position.distance;
        this.mapWidth = mapWidth;
        this.mapHeight = mapHeight;
    }

    /**
     * Function: getPath
     * Compute the shortest path between two positions.
     * Returns:
     * An array of Core.Position containing the reversed path. Use pop() on this array to walk the path.
     * Returns undefined if no path can be found (no path exists or destination is too far away)
     */
    public getPath(from: Core.Position, to: Core.Position): Core.Position[]|undefined {
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
            let current: Core.Position = openSet.pop()!;
            if (current.x === to.x && current.y === to.y) {
                // reached destination. build path
                return this.reconstructPath(cameFrom, current);
            }
            closedSet.push(current);
            let currentOffset: number = this.pos2Offset(current);
            let adjacentCells: Core.Position[] = current.getAdjacentCells(this.mapWidth, this.mapHeight);
            for (let neighbor of adjacentCells) {
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

    private pos2Offset(pos: Core.Position): number {
        return pos.x + pos.y * this.mapWidth;
    }

    private arrayContains(array: Core.Position[], posToFind: Core.Position): boolean {
        for (let pos of array) {
            if (pos.equals(posToFind)) {
                return true;
            }
        }
        return false;
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
