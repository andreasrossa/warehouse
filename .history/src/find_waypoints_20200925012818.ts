import component = require("component");
import serialization = require("serialization");
import term = require("term");
import { current } from "thread";

type Position3D = number[];
type Position2D = number[];
type Matrix3D = number[][][];
type Matrix2D = number[][];

const parsedArgs = [...args];

const aLabel = parsedArgs[0];
const bLabel = parsedArgs[1];
const range = tonumber(parsedArgs[2]) || 1000;

const nav = component.navigation;
const geo = component.geolyzer;
const gpu = component.gpu;

interface Rectangle {
    bottomLeft: Position3D;
    bottomRight: Position3D;
    topLeft: Position3D;
    topRight: Position3D;
}

function toGlobalPos(offset: number[], globalPos: Position3D): Position3D {
    let newPos = [];
    for (let i = 0; i < 3; i++) {
        newPos[i] = globalPos[i] + offset[i];
    }
    return newPos;
}

const width = (r: Rectangle): number =>
    Math.abs(r.bottomRight[0] - r.bottomLeft[0]) + 1;
const length = (r: Rectangle): number =>
    Math.abs(r.topRight[2] - r.bottomRight[2]) + 1;

const getPos = (nav: OpenOS.Navigation): Position3D => [...nav.getPosition()];

/**
 * Finds waypoints for the specified labels
 * @param waypointLabels Labels of the waypoints
 */
function getWaypoints(
    waypointLabels: string[],
    nav: OpenOS.Navigation
): { [name: string]: OpenOS.Waypoint } {
    const waypointsInRange = nav.findWaypoints(range);
    let matchingWaypoints: { [name: string]: OpenOS.Waypoint } = {};
    for (let i = 0; i < waypointLabels.length; i++) {
        const matched = waypointsInRange.find(
            (e) => e.label == waypointLabels[i]
        );
        if (matched == null)
            error(
                `"${waypointLabels[i]}" could not be found within ${range} blocks`
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
function getRectangle(
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
function scanTo3DMatrix(
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

function print3DMatrix(matrix: Matrix3D) {
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

function correctXZ(matrix: Matrix3D): Matrix3D {
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
function scanRectangle(
    r: Rectangle,
    nav: OpenOS.Navigation,
    geo: OpenOS.Geolyzer
): Matrix3D | null {
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
        print(
            `Scan unsuccessful - w:${rW} l:${rL} - ${relativeOrigin[0]}, ${relativeOrigin[1]}, ${relativeOrigin[2]}`
        );
        return null;
    }

    return scanTo3DMatrix(rW, 1, rL, scanData);
}

function printWaypointArea(
    waypointA: string,
    waypointB: string,
    nav: OpenOS.Navigation,
    geo: OpenOS.Geolyzer
) {
    const waypoints = getWaypoints([waypointA, waypointB], nav);
    const r = getRectangle(
        waypoints[waypointA],
        waypoints[waypointB],
        nav.getPosition()
    );
    print(
        `Rectangle: bl=${r.bottomLeft.join(",")} br=${r.bottomRight.join(
            ","
        )} tl=${r.topLeft.join(",")} tr=${r.topRight.join(",")}`
    );
    let matrix = scanRectangle(r, nav, geo);

    if (matrix == null) return;

    print3DMatrix(matrix);
}

interface Node {
    pos: Position3D;
    neighbours: number[];
}

type NodeGraph = Map<number, Node>;

function exploreSides(currentNode: number, graph: NodeGraph, matrix: Matrix2D) {
	const pos = graph.get(currentNode)?.pos
	if(pos == null) return
	let sides: Node[] = []
	const top = matrix[pos[1]+1][pos[0]]
	const right = matrix[pos[1]][pos[0]-1]
	const bottom = matrix[pos[1]-1][pos[0]]
	const left = matrix[pos[1]+1][pos[0]+1]

	if(top == 0) sides.push({pos: [pos[0], pos[1]+1], neighbours: [currentNode]})
	if(right == 0) sides.push({pos: [pos[0]-1, pos[1]], neighbours: [currentNode]})
	if(bottom == 0) sides.push({pos: [pos[0], pos[1]-1], neighbours: [currentNode]})
	if(left == 0) sides.push({pos: [pos[0]+1, pos[1]], neighbours: [currentNode]})

	graph[graph.length].
}

function nodeGraphFromMatrix(matrix: Matrix2D, startPoint: Position2D) {
    let graph: NodeGraph = {};

    let x = startPoint[0];
    let z = startPoint[1];

    if (matrix[startPoint[z]][startPoint[x]] != 0)
        error("Start-Block is not air");

    while (true) {}

    // for(let z = 0; z < matrix.length; z++) {
    // 	for(let x = 0; x < matrix[z].length; x++) {

    // 	}
    // }
}

printWaypointArea(aLabel, bLabel, nav, geo);
