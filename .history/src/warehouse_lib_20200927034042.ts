import term = require("term");

export type Position3D = number[];
export type Position2D = number[];
export type Matrix3D = number[][][];
export type Matrix2D = number[][];

export interface Rectangle {
    bottomLeft: Position3D;
    bottomRight: Position3D;
    topLeft: Position3D;
    topRight: Position3D;
}

export type PosNodeGraph = Map<Pos2D, GraphNode>;
export type NodeGraph = Map<number, GraphNode>

export interface Pos2D {
    x: number;
    z: number;
}

export interface Pos2D {
    x: number;
    z: number;
}

export interface GraphNode {
    index: number;
    pos: Pos2D;
    neighbours: Pos2D[];
}

export function toGlobalPos(
    offset: number[],
    globalPos: Position3D
): Position3D {
    let newPos = [];
    for (let i = 0; i < 3; i++) {
        newPos[i] = globalPos[i] + offset[i];
    }
    return newPos;
}

export const width = (r: Rectangle): number =>
    Math.abs(r.bottomRight[0] - r.bottomLeft[0]) + 1;
export const length = (r: Rectangle): number =>
    Math.abs(r.topRight[2] - r.bottomRight[2]) + 1;
export const getPos = (nav: OpenOS.Navigation): Position3D => [
    ...nav.getPosition(),
];

export function posGraphToNodeGraph(posGraph: PosNodeGraph): NodeGraph {
    const ng = new Map();
    ([...posGraph]).forEach(([pos, n]) => ng.set(n.index, n))
    return ng
}

/**
 * Finds waypoints for the specified labels
 * @param waypointLabels Labels of the waypoints
 */
export function getWaypoints(
    waypointLabels: string[],
    nav: OpenOS.Navigation,
    waypointRange: number = 100
): { [name: string]: OpenOS.Waypoint } {
    const waypointsInRange = nav.findWaypoints(waypointRange);
    let matchingWaypoints: { [name: string]: OpenOS.Waypoint } = {};
    for (let i = 0; i < waypointLabels.length; i++) {
        const matched = waypointsInRange.find(
            (e) => e.label == waypointLabels[i]
        );
        if (matched == null)
            error(
                `"${waypointLabels[i]}" could not be found within ${waypointRange} blocks`
            );
        matchingWaypoints[waypointLabels[i]] = matched;
    }

    return matchingWaypoints;
}

/**
 * Calculates a {@link Rectangle} from 2 Waypoints.
 * The coordinates are returned nav-map-global
 *
 * @param a lower left corner waypoint of the warehouse
 * @param b upper right corner waypoint of the warehouse
 */
export function getRectangle(
    wA: OpenOS.Waypoint,
    wB: OpenOS.Waypoint,
    pos: Position3D
): Rectangle {
    return {
        bottomRight: toGlobalPos(wA.position, pos),
        topLeft: toGlobalPos(wB.position, pos),
        bottomLeft: toGlobalPos(
            [wB.position[0], wB.position[1], wA.position[2]],
            pos
        ),
        topRight: toGlobalPos(
            [wA.position[0], wA.position[1], wB.position[2]],
            pos
        ),
    };
}

/**
 * Takes a Scan and converts it to a 3D Matrix.
 * It is accessible like matrix[y][z][x]
 * @param sizeX Width of the rectangle
 * @param sizeY Height of the rectangle
 * @param sizeZ Depth of the rectangle
 * @param scanData data from geo.scan(...)
 */
export function scanTo3DMatrix(
    sizeX: number,
    sizeY: number,
    sizeZ: number,
    scanData: number[]
): Matrix3D {
    let matrix: Matrix3D = [];
    let i = 0;

    for (let y = 0; y < sizeY; y++) {
        matrix[y] = [];
        for (let z = 0; z < sizeZ; z++) {
            matrix[y][z] = [];
            for (let x = 0; x < sizeX; x++) {
                matrix[y][z][x] = scanData[i];
                i++;
            }
        }
    }

    return matrix;
}

export function print3DMatrix(matrix: Matrix3D, gpu: OpenOS.GPU) {
    term.clear();
    const cursorOffset = [7, 7];
    for (let y = 0; y < matrix.length; y++) {
        for (let z = 0; z < matrix[y].length; z++) {
            gpu.set(5, z + cursorOffset[1], tostring(z));
            for (let x = matrix[y][z].length - 1; x >= 0; x--) {
                gpu.set(
                    x + cursorOffset[0],
                    z + cursorOffset[1],
                    matrix[y][z][x] > 0 ? "O" : " "
                );
            }
        }
        print("_".repeat(matrix[0][1].length));
    }
}

export function printNodeGraph(graph: PosNodeGraph) {}

export function correctXZ(matrix: Matrix3D): Matrix3D {
    const newMatrix = Object.assign(matrix);
    for (let y = 0; y < matrix.length; y++) {
        newMatrix[y] = matrix[y].reverse();
        for (let z = 0; z < matrix[y].length; z++) {
            newMatrix[y][z] = matrix[y][z].reverse();
        }
    }
    return newMatrix;
}

/**
 * Scans a rectangle and returns a 2D Array
 * @param r Rectangle representing scan-area
 * @param nav Navigtation Component
 */
export function scanRectangle(
    r: Rectangle,
    nav: OpenOS.Navigation,
    geo: OpenOS.Geolyzer
): Matrix2D {
    const pos = getPos(nav);
    const rW = width(r);
    const rL = length(r);

    const a = r.bottomRight;

    //TODO: Scan area in 64 block chunks to cover bigger areas
    if (rW * rL > 64) error("Maximum volume is 64 blocks (for now)");
    if (pos[1] != a[1]) error("Robot and rectangle not on the same y");

    const relativeOrigin: Position3D = [a[0] - pos[0], 0, a[2] - pos[2]];

    print(
        `Scanning: w=${rW} l=${rL} - x=${relativeOrigin[0]}, y=${relativeOrigin[1]}, z=${relativeOrigin[2]}`
    );

    let scanData = null;
    try {
        scanData = geo.scan(
            relativeOrigin[0],
            relativeOrigin[2],
            relativeOrigin[1],
            rW,
            rL,
            1
        );
    } catch (e) {
        print(e);
    }

    if (scanData == null) {
        error(
            `Scan unsuccessful - w:${rW} l:${rL} - ${relativeOrigin[0]}, ${relativeOrigin[1]}, ${relativeOrigin[2]}`
        );
    }

    return scanTo3DMatrix(rW, 1, rL, scanData)[0];
}

export function printWaypointArea(
    waypointA: string,
    waypointB: string,
    waypointRange: number = 100,
    nav: OpenOS.Navigation,
    geo: OpenOS.Geolyzer,
    gpu: OpenOS.GPU
) {
    const waypoints = getWaypoints([waypointA, waypointB], nav, waypointRange);
    const r = getRectangle(
        waypoints[waypointA],
        waypoints[waypointB],
        nav.getPosition()
    );
    let matrix = scanRectangle(r, nav, geo);
    print(
        `Rectangle: bl=${r.bottomLeft.join(",")} br=${r.bottomRight.join(
            ","
        )} tl=${r.topLeft.join(",")} tr=${r.topRight.join(",")}`
    );

    if (matrix == null) return;

    print3DMatrix([matrix], gpu);
}

export function comparePos(a: Pos2D, b: Pos2D): boolean {
    return a.x == b.x && a.z == b.z;
}

//export function posHash(pos: Pos2D, sX: number): number {
//  return pos.z + 1 * sX - pos.x;
//}

export function getNeighbours(currentPos: Pos2D, posArr: Pos2D[]): Pos2D[] {
    return posArr.filter(
        (pos) =>
            comparePos({ x: currentPos.x, z: currentPos.z - 1 }, pos) ||
            comparePos({ x: currentPos.x, z: currentPos.z + 1 }, pos) ||
            comparePos({ x: currentPos.x - 1, z: currentPos.z }, pos) ||
            comparePos({ x: currentPos.x + 1, z: currentPos.z }, pos)
    );
}

export function findAirPositions(matrix: Matrix2D): Pos2D[] {
    const nodePositions: Map<number, Pos2D> = new Map();
    let i = 0;

    for (let z = 0; z < matrix.length; z++) {
        for (let x = 0; x < matrix[z].length; x++) {
            const tile = matrix[z][x];
            if (tile != 0) continue; // Continue if not air-block
            nodePositions.set(i, { x: x, z: z });
            i++
        }
    }

    return nodePositions;
}

export function nodeGraphFromPositions(nodePositions: Pos2D[]): PosNodeGraph {
    const graph: PosNodeGraph = new Map();

    for (let i = 0; i < nodePositions.length; i++) {
        const pos = nodePositions[i];
        const neighbours = getNeighbours(pos, nodePositions);
        if (neighbours.length == 0) continue; // skip if there is no way to reach this node
        graph.set(pos, { index: graph.size, neighbours: neighbours, pos: pos });
    }

    return graph;
}

export function reduceGraph(graph: PosNodeGraph): PosNodeGraph {
    const reduced = new Map(graph);
    let nonReducedCount = 0;
    while (nonReducedCount < reduced.size) {
        reduced.forEach((n, pos) => {
            if (
                n.neighbours.length == 2 &&
                ((n.neighbours[0].x == pos.x && n.neighbours[1].x == pos.x) ||
                    (n.neighbours[0].z == pos.z && n.neighbours[1].z == pos.z))
            ) {
                const nAPos = n.neighbours[0];
                const nA = reduced.get(nAPos)!!;
                const nBPos = n.neighbours[1];
                const nB = reduced.get(nBPos)!!;

                nA.neighbours = nA.neighbours.filter((it) => it != pos);
                nB.neighbours = nB.neighbours.filter((it) => it != pos);
                nA.neighbours.push(nBPos);
                nB.neighbours.push(nAPos);
                reduced.set(nAPos, nA);
                reduced.set(nBPos, nB);
                reduced.delete(pos);
            } else {
                nonReducedCount++;
            }
        });
    }
    return reduced;
}
