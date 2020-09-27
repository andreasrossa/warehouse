import term = require("term");
import serialization = require("serialization");
import { red } from "colors";

export type Position3D = number[];
export type Position2D = number[];
export type Matrix3D = number[][][];
export type Matrix2D = number[][];

export type Pair<A, B> = { first: A; second: B };
export type NodeID = number;
export type Cost = number;
export type Path = NodeID[];

export interface Rectangle {
    bottomLeft: Position3D;
    bottomRight: Position3D;
    topLeft: Position3D;
    topRight: Position3D;
}

export type NodePosMap = Map<number, Pos2D>;

export type PosNodeGraph = Map<Pos2D, GraphNode>;
export type NodeGraph = Map<number, GraphNode>;

export interface Pos2D {
    x: number;
    z: number;
}

export interface Pos2D {
    x: number;
    z: number;
}

export interface GraphNode {
    pos: Pos2D;
    neighbours: number[];
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

export function getNeighbours(currentPos: Pos2D, graph: NodePosMap): number[] {
    return [...graph]
        .filter(
            ([id, pos]) =>
                comparePos({ x: currentPos.x, z: currentPos.z - 1 }, pos) ||
                comparePos({ x: currentPos.x, z: currentPos.z + 1 }, pos) ||
                comparePos({ x: currentPos.x - 1, z: currentPos.z }, pos) ||
                comparePos({ x: currentPos.x + 1, z: currentPos.z }, pos)
        )
        .map(([id, pos]) => id);
}

export function findAirPositions(matrix: Matrix2D): NodePosMap {
    const nodePositions: NodePosMap = new Map();
    let i = 0;

    for (let z = 0; z < matrix.length; z++) {
        for (let x = 0; x < matrix[z].length; x++) {
            const tile = matrix[z][x];
            if (tile != 0) continue; // Continue if not air-block
            nodePositions.set(i, { x: x, z: z });
            i++;
        }
    }

    return nodePositions;
}

export function nodeGraphFromPositions(nodePositions: NodePosMap): NodeGraph {
    const graph: NodeGraph = new Map();

    for (let i = 0; i < nodePositions.size; i++) {
        const pos = nodePositions.get(i)!!;
        const neighbours = getNeighbours(pos, nodePositions);
        if (neighbours.length == 0) continue; // skip if there is no way to reach this node
        graph.set(i, { neighbours: neighbours, pos: pos });
    }

    return graph;
}

export function reduceGraph(graph: NodeGraph): NodeGraph | undefined | null {
    const reduced: NodeGraph = new Map(graph);
    print("Non-Reduced size: " + reduced.size)
    let nonReducedCount = 0;
    while (nonReducedCount < reduced.size) {
        for (let i = 0; i < reduced.size; i++) {
            const n = reduced.get(i);
            if (n == null) error(`${i} was null`);
            if (n.neighbours.length === 2) {
                const nAId = n.neighbours[0];
                const nA = reduced.get(nAId);
                const nBId = n.neighbours[1];
                const nB = reduced.get(nBId);

                if (nA == null) {
                    error(`${nAId} is backed by null`);
                }

                if (nB == null) {
                    error(`${nBId} is backed by null`);
                }

                if (
                    (nA.pos.x == n.pos.x && nB.pos.x == n.pos.x) ||
                    (nA.pos.z == n.pos.z && nB.pos.z == n.pos.z)
                ) {
                    nA.neighbours = nA.neighbours.filter((it) => it != i);
                    nB.neighbours = nB.neighbours.filter((it) => it != i);
                    nA.neighbours.push(nBId);
                    nB.neighbours.push(nAId);
                    reduced.set(nAId, nA);
                    reduced.set(nBId, nB);
                    reduced.delete(i);
                } else {
                    nonReducedCount++;
                }
            }
        }
    }
    return reduced;
}

export function manhattanDistance(a: Pos2D, b: Pos2D): number {
    return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

export function cost(a: NodeID, b: NodeID, graph: NodeGraph): number {
    return manhattanDistance(graph.get(a)!!.pos, graph.get(b)!!.pos);
}

export function russianMan(
    start: NodeID,
    end: NodeID,
    graph: NodeGraph
): Path | null | undefined {
    const finished: Set<NodeID> = new Set();
    const costs: Map<NodeID, Cost> = new Map();
    const paths: Map<NodeID, Path> = new Map();

    costs.set(start, 0);
    paths.set(start, [start]);

    while (true) {
        const cheapestCost = Math.min(
            ...[...costs]
                .filter(([id, n]) => !finished.has(id))
                .map(([id, c]) => c)
        );
        if (cheapestCost == null) break;
        const current = [...costs].find(([id, c]) => c == cheapestCost)!![0];

        if (current == end) return paths.get(end);

        const n = graph.get(current)!!.neighbours;

        if (n == null || n.length == 0) error("Seperate Nodes");

        n.forEach((id) => {
            const edgeCost = cost(current, id, graph);
            const newCost = edgeCost + costs.get(current)!!;
            const oldCost = costs.get(id);
            const newPath = [...paths.get(current)!!, id];

            if (oldCost == null) {
                // Hasnt been visited yet
                costs.set(id, newCost);
                paths.set(id, newPath);
            } else {
                if (newCost < oldCost) {
                    // Cheaper?
                    costs.set(id, newCost);
                    paths.set(id, newPath);
                }
            }
        });

        finished.add(current);
    }

    return null;
}
