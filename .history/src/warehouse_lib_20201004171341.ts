export type Position3D = number[];
export type Position2D = number[];
/**
 * Matrix of [y][z][x]
 */
export type Matrix3D = number[][][];

/**
 * Matrix of [z][x]
 */
export type Matrix2D = number[][];

export type Pair<A, B> = { first: A; second: B };

export type NodeID = number;
export type Cost = number;
export type Path = NodeID[];

export interface Rectangle {
    bottomLeft: Pos3D;
    bottomRight: Pos3D;
    topLeft: Pos3D;
    topRight: Pos3D;
}

export type NodePosMap = Map<number, Pos2D>;

export type PosNodeGraph = Map<Pos2D, GraphNode>;
export type NodeGraph = Map<number, GraphNode>;

export interface Pos2D {
    x: number;
    z: number;
}

export interface Pos3D {
    x: number;
    y: number;
    z: number;
}

export interface GraphNode {
    pos: Pos2D;
    neighbours: number[];
}

/**
 * Converts a given offset (relative pos) to a global pos, relative to globalPos
 * @param offset
 * @param globalPos
 */
export function toGlobalPos(offset: Pos3D, globalPos: Pos3D): Pos3D {
    return {
        x: globalPos.x + offset.x,
        y: globalPos.y + offset.y,
        z: globalPos.z + offset.z,
    };
}

/**
 * Gets the width of a {@link Rectangle | Rectangle}
 * @param r
 */
export const width = (r: Rectangle): number =>
    Math.abs(r.bottomRight.x - r.bottomLeft.x) + 1;

/**
 * Gets the length of a {@link Rectangle | Rectangle}
 * @param r
 */
export const length = (r: Rectangle): number =>
    Math.abs(r.topRight.z - r.bottomRight.z) + 1;

/**
 * Gets the current Position with the given {@link Navigation | Navigation Component}
 * @param nav
 */
export function getPos(nav: OpenOS.Navigation): Pos3D {
    const p = [...nav.getPosition()];
    return { x: p[0], y: p[1], z: p[2] };
}

/**
 * Finds {@link OpenOS.Waypoint | Waypoints} for the specified labels
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

export function numberArrayToPos(arr: number[]): Pos3D {
    return { x: arr[0], y: arr[1], z: arr[2] };
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
    pos: Pos3D
): Rectangle {
    return {
        bottomRight: toGlobalPos(numberArrayToPos(wA.position), pos),
        topLeft: toGlobalPos(numberArrayToPos(wB.position), pos),
        bottomLeft: toGlobalPos(
            { x: wB.position[0], y: wB.position[1], z: wA.position[2] },
            pos
        ),
        topRight: toGlobalPos(
            { x: wA.position[0], y: wA.position[1], z: wB.position[2] },
            pos
        ),
    };
}

/**
 * Takes a Scan and converts it to a {@link Matrix3D | 3D Matrix}.
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

/**
 * Prints a {@link Matrix3D | 3D Matrix}
 * @param matrix Matrix to be printed
 * @param gpu GPU Component
 * @param term Terminal Component
 */
export function print3DMatrix(matrix: Matrix3D, gpu: OpenOS.GPU, term: any) {
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

/**
 * Scans a rectangle and returns a {@link Matrix2D | Matrix 2D}
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
    if (pos.y != a.y) error("Robot and rectangle not on the same y");

    const relativeOrigin: Pos3D = {x: a.x - pos.x, y: 0, z: a.z - pos.z};

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

/**
 * Scans and prints a Waypoint-Area
 * @param waypointA Bottom Right Waypoint
 * @param waypointB Top Left Waypoint
 * @param waypointRange Scan-Range for waypoints
 * @param nav Navigation Component
 * @param geo Geolyzer Component
 * @param gpu GPU Component
 * @param term Terminal Component
 */
export function printWaypointArea(
    waypointA: string,
    waypointB: string,
    waypointRange: number = 100,
    nav: OpenOS.Navigation,
    geo: OpenOS.Geolyzer,
    gpu: OpenOS.GPU,
    term: any
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

    print3DMatrix([matrix], gpu, term);
}

/**
 * Compares two {@link Pos2D | Positions} and checks their equality
 * @param a
 * @param b
 * @returns equality of {@link Pos2D | Positions}
 */
export function comparePos(a: Pos2D, b: Pos2D): boolean {
    return a.x == b.x && a.z == b.z;
}

/**
 * Gets all directly-adjacent neighbours of the given {@link Pos2D | positions} in the {@link NodePosMap}
 * @param currentPos
 * @param nodePosMap
 */
export function getNeighbours(
    currentPos: Pos2D,
    nodePosMap: NodePosMap
): number[] {
    return [...nodePosMap]
        .filter(
            ([id, pos]) =>
                comparePos({ x: currentPos.x, z: currentPos.z - 1 }, pos) ||
                comparePos({ x: currentPos.x, z: currentPos.z + 1 }, pos) ||
                comparePos({ x: currentPos.x - 1, z: currentPos.z }, pos) ||
                comparePos({ x: currentPos.x + 1, z: currentPos.z }, pos)
        )
        .map(([id, pos]) => id);
}

/**
 * Finds all air-{@link Pos2D | positions} (hardness = 0) in the given {@link Matrix2D | matrix}
 * @param matrix
 * @returns NodePosMap of: Index of found air-block --> Position of found air-block
 */
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

/**
 * Generates a {@link NodeGraph} from a {@link NodePosMap}.
 *
 * @remark the main difference between the two
 * is that {@link NodeGraph} {@link GraphNode | Nodes} are aware of their neighbours
 *
 * @param nodePositions
 */
export function nodeGraphFromNodePosMap(nodePositions: NodePosMap): NodeGraph {
    const graph: NodeGraph = new Map();

    [...nodePositions].forEach(([id, p]) => {
        const neighbours = getNeighbours(p, nodePositions);
        graph.set(id, { neighbours: neighbours, pos: p });
    });

    return graph;
}

/**
 * Checks if two {@link Pos2D | 2D Positions} align in either the x or z axis
 * @param a
 * @param b
 */
export const positionsAlign = (a: Pos2D, b: Pos2D) => a.x == b.x || a.z == b.z;

/**
 * Takes a {@link NodeGraph} and reduces it as much as possible.
 * Effectively removes all "path"-nodes that dont branch out.s
 *
 * @remarks It does this by finding three Nodes that have exactly
 * that are all adjacent and in either the same X or Z axis.
 * It then removes the middle Node and connects the two outer nodes
 * (therefore removing the middle-node that connects to nothing and is not needed).
 *
 * @param graph
 * @returns Reduced Copy of the original graph
 */
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

/**
 * Returns the manhattan-distance in blocks of two {@link Pos2D | positions}
 * @remark The manhattan-distance is the shortest path in a grid (not diagonally)
 * @param a
 * @param b
 */
export function manhattanDistance(a: Pos2D, b: Pos2D): number {
    return Math.abs(a.x - b.x) + Math.abs(a.z - b.z);
}

/**
 * Cost function that determines the distance between two nodes.
 * @param a
 * @param b
 * @param graph
 */
export function cost(a: NodeID, b: NodeID, graph: NodeGraph): number {
    return manhattanDistance(graph.get(a)!!.pos, graph.get(b)!!.pos);
}

/**
 * Implementation of dijkstras shortest-path
 *
 * @returns An array of {@link NodeID | Node-Ids}
 *
 * @param start Starting-Node
 * @param end End-Node
 * @param graph Node-Graph
 */
export function russianMan(
    start: NodeID,
    end: NodeID,
    graph: NodeGraph
): Path | null | undefined {
    const finished: number[] = [];
    const costs: Map<NodeID, Cost> = new Map();
    const paths: Map<NodeID, Path> = new Map();

    costs.set(start, 0);
    paths.set(start, [start]);

    let runs = 0;

    while (runs < 20) {
        0;
        const cheapestCostEntry = [...costs]
            .filter(([n, c]) => finished.includes(n) == false)
            .sort((a, b) => b[1] - a[1])[0];

        if (cheapestCostEntry == null || cheapestCostEntry == undefined) break;
        const cheapestCost = cheapestCostEntry[0];
        const current = cheapestCost;

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

        runs++;
        finished.push(current);
    }

    return null;
}
