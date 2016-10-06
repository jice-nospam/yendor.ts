/**
 * Section: Position
 */
/**
 * Interface: Comparable
 */
export interface IComparable {
    /**
     * Function: equals
     *  Returns:
     *  true if two Comparable are equals
     */
    equals(c: IComparable): boolean;
}

/**
 * Class: Position
 * Stores the position of a cell in the console (column, row)
 */
export class Position implements IComparable {
    /**
     * Function: distance
     * Returns :
     * the distance between two Position
     */
    public static distance(p1: Position, p2: Position): number {
        let dx: number = p1.x - p2.x;
        let dy: number = p1.y - p2.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    // static arrays to help scan adjacent cells
    private static TDX: number[] = [-1, 1, 0, 0, -1, 1, -1, 1];
    private static TDY: number[] = [0, 0, -1, 1, -1, -1, 1, 1];

    /**
     * Constructor: constructor
     * Parameters:
     * _x : the column
     * _y : the row
     */
    constructor(public x: number = 0, public y: number = 0) {
    }

    public set(pos: Position) {
        this.x = pos.x;
        this.y = pos.y;
    }

    public clone(): Position {
        return new Position(this.x, this.y);
    }

    public toString() {
        return this.x + "," + this.y;
    }

    /**
     * Function: moveTo
     * Update this position.
     * Parameters:
     * x - the new column
     * y - the new row
     */
    public moveTo(x: number, y: number) {
        this.x = x;
        this.y = y;
    }

   public equals(pos: Position): boolean {
        return this.x === pos.x && this.y === pos.y;
    }

    public isAdjacent(pos: Position): boolean {
        let dx = Math.abs(this.x - pos.x);
        let dy = Math.abs(this.y - pos.y);
        return (dx === 1 && dy <= 1) || (dx <= 1 && dy === 1);
    }

    /**
     * Function: getAdjacentCells
     * Returns all cells adjacent to this position. The map width/height are used to handle border cases.
     * Parameters:
     * mapWidth - the width of the map
     * mapHeight - the height of the map
     * diagonals - whether we consider diagonals or not (default : true)
     * Returns:
     * an array of Position containing all adjacent cells
     */
    public getAdjacentCells(mapWidth: number, mapHeight: number, diagonals: boolean = true): Position[] {
        let adjacents: Position[] = [];
        for (let i: number = 0, len: number = diagonals ? 8 : 4; i < len; ++i) {
            let x = this.x + Position.TDX[i];
            if (x >= 0 && x < mapWidth) {
                let y = this.y + Position.TDY[i];
                if (y >= 0 && y < mapHeight) {
                    adjacents.push(new Position(x, y));
                }
            }
        }
        return adjacents;
    }
}
