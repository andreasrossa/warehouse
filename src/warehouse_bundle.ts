import component = require("component")
import sides = require("sides")
import term = require("term");
import robot = require("robot");

const nav = component.navigation

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

export function getNeighbours(
    currentPos: Pos2D,
    posArr: Map<number, Pos2D>
): number[] {
    return [...posArr]
        .filter(
            ([id, pos]) =>
                comparePos({ x: currentPos.x, z: currentPos.z - 1 }, pos) ||
                comparePos({ x: currentPos.x, z: currentPos.z + 1 }, pos) ||
                comparePos({ x: currentPos.x - 1, z: currentPos.z }, pos) ||
                comparePos({ x: currentPos.x + 1, z: currentPos.z }, pos)
        )
        .map(([id, pos]) => id);
}

export function findAirPositions(matrix: Matrix2D): Map<number, Pos2D> {
    const nodePositions: Map<number, Pos2D> = new Map();
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

export function nodeGraphFromPositions(
    nodePositions: Map<number, Pos2D>
): NodeGraph {
    const graph: NodeGraph = new Map();

    [...nodePositions].forEach(([id, p]) => {
        const neighbours = getNeighbours(p, nodePositions);
        graph.set(id, { neighbours: neighbours, pos: p });
    });

    return graph;
}

export function reduceGraph(graph: NodeGraph): NodeGraph {
    const reduced: NodeGraph = new Map(graph);
    let nonReducedCount = 0;
    while (nonReducedCount < reduced.size) {
        reduced.forEach((n, id) => {
            const nA = graph.get(n.neighbours[0])!!;
            const nB = graph.get(n.neighbours[1])!!;

            if (
                n.neighbours.length == 2 &&
                ((nA.pos.x == n.pos.x && nB.pos.x == n.pos.x) ||
                    (nA.pos.z == n.pos.z && nB.pos.z == n.pos.z))
            ) {
                const nAPos = n.neighbours[0];
                const nA = reduced.get(nAPos)!!;
                const nBPos = n.neighbours[1];
                const nB = reduced.get(nBPos)!!;

                nA.neighbours = nA.neighbours.filter((it) => it != id);
                nB.neighbours = nB.neighbours.filter((it) => it != id);
                nA.neighbours.push(nBPos);
                nB.neighbours.push(nAPos);
                reduced.set(nAPos, nA);
                reduced.set(nBPos, nB);
                reduced.delete(id);
                print("Reduced: " + id + ` (x: ${n.pos.x}, z: ${n.pos.z})`);
            } else {
                nonReducedCount++;
            }
        });
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
    const finished: number[] = []
    const costs: Map<NodeID, Cost> = new Map();
    const paths: Map<NodeID, Path> = new Map();

    costs.set(start, 0);
    paths.set(start, [start]);

  let runs = 0

    while (runs < 20) {0
        const cheapestCostEntry = [...costs]
                .filter(([n, c]) => finished.includes(n) == false)
                .sort((a,b) => b[1]-a[1])[0]

        if (cheapestCostEntry == null || cheapestCostEntry == undefined) break;
        const cheapestCost = cheapestCostEntry[0]
        const current = cheapestCost

        if (current == end) return paths.get(end);

        const n = graph.get(current)!!.neighbours;

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

        runs++
        finished.push(current);
    }

    return null;
}

export enum FacingDir {
    North = 0,
    East = 90,
    South = 180,
    West = 270
}

export function currentFacingDir(): FacingDir {
    const facing = nav.getFacing()
    switch(facing) {
        case sides.front: return FacingDir.North;
        case sides.right: return FacingDir.East;
        case sides.left: return FacingDir.West;
        case sides.back: return FacingDir.South;
    }

    return -1
}

export function faceDirection(dir: FacingDir) {
    print("Facing: " + dir.toString())
    const facing = currentFacingDir()
    let rotation = dir - facing;
    if(rotation < 0) {
        for(let i = 0; i <= Math.abs(rotation); i += 90) {
            robot.turnLeft()
        }
    } else {
        for(let i = 0; i <= Math.abs(rotation); i += 90) {
            robot.turnRight()
        }
    }
}

export function moveInDirection(dir: FacingDir, dist: number) {
   // faceDirection(dir)
    for(let i = 0; i < Math.abs(dist); i++) {
        moveForward()
    }
}

/**
 * Moves the robot dist blocks in positive X (negative X when dist < 0)
 * @param dist distance
 */
export function moveX(dist: number) {
    if(dist < 0) {
        moveInDirection(FacingDir.East, dist)
    } else {
        moveInDirection(FacingDir.West, dist)
    }
}

/**
 * Moves the robot dist blocks in positive Z (negative Z when dist < 0)
 * @param dist distance
 */
export function moveZ(dist: number) {
    if(dist < 0) {
        moveInDirection(FacingDir.South, dist)
    } else {
        moveInDirection(FacingDir.North, dist)
    }
}

export function moveFromTo(from: Pos2D, to: Pos2D) {
    print(`Moving: (${from.x}, ${from.z}) -> (${to.x}, ${to.z})`)
    try {
        if(from.z === to.z) {
            const dist = to.x - from.x;
            print("dist = " + dist)
            moveZ(dist)
        } else if (from.x === to.x) {
            const dist = to.z - from.z;
            print("dist = " + dist)
            moveX(dist)
        } else {
            error("Tried to move diagonally")
        }
    } catch (error) {
        print("Failed moving", error.message)
    }
}

export function walkPath(path: Path, nodeGraph: NodeGraph) {
    print("Walking Path with size " + path.length)
    for(let i = 0; i < path.length-1; i++) {
        const from = nodeGraph.get(path[i]);
        const to = nodeGraph.get(path[i+1]);

        if(from === undefined || to === undefined) error("From or to was null")

        moveFromTo(from.pos, to.pos)
        os.sleep(0.5)
    }
}

export function moveForward() {
    print("Moving Forward")
    robot.move(sides.front)
}


const parsedArgs = [...args];

const aLabel = parsedArgs[0]!!;
const bLabel = parsedArgs[1]!!;
const start = tonumber(parsedArgs[2])!!;
const end = tonumber(parsedArgs[3])!!;
const range = tonumber(parsedArgs[4]) || 100;

const geo = component.geolyzer;

const waypoints = getWaypoints([aLabel, bLabel], nav, range);
const r = getRectangle(waypoints[aLabel], waypoints[bLabel], nav.getPosition());

let matrix: Matrix2D = scanRectangle(r, nav, geo)!!;

const nodePositions = findAirPositions(matrix);

nodePositions.forEach((n, id) => print(`${id} (x: ${n.x}, z: ${n.z})`))

let graph = nodeGraphFromPositions(nodePositions);

print("Size before reduction:", graph.size)

graph = reduceGraph(graph);

print("Size:", graph.size);

[...graph].forEach(([id, it]) =>
    print(
        `${id} (x: ${it.pos.x}, z: ${it.pos.z}): [${it.neighbours.join(", ")}]`
    )               
);

const path = russianMan(start, end, graph)!!;
// print("Path:", path.join(", "))

walkPath(path, graph)