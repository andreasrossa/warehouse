import component = require("component");
import serialization = require("serialization");

export type Position = number[];
export type Matrix3D = number[][][];

const parsedArgs = [...args];

const a = parsedArgs[0];
const b = parsedArgs[1];
const range = tonumber(parsedArgs[2]) || 1000;

const nav = component.navigation;
const geo = component.geolyzer;

export interface Rectangle {
    bottomLeft: Position;
    bottomRight: Position;
    topLeft: Position;
    topRight: Position;
}

export function toGlobalPos(offset: number[], globalPos: Position): Position {
    let newPos = [];
    for (let i = 0; i < 3; i++) {
        newPos[i] = globalPos[i] + offset[i];
    }
    return newPos;
}

export const width = (r: Rectangle): number =>
    Math.abs(r.bottomRight[0] - r.bottomLeft[0]);
export const length = (r: Rectangle): number =>
    Math.abs(r.topRight[2] - r.bottomRight[2]);

export const getPos = (nav: OpenOS.Navigation): Position => [
    ...nav.getPosition(),
];

/**
 * Finds waypoints for the specified labels
 * @param waypointLabels Labels of the waypoints
 */
export function getWaypoints(
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
export function getRectangle(
    wA: OpenOS.Waypoint,
    wB: OpenOS.Waypoint,
    pos: Position
): Rectangle {
    return {
        bottomLeft: toGlobalPos(wA.position, pos),
        topRight: toGlobalPos(wB.position, pos),
        bottomRight: toGlobalPos(
            [wB.position[0], wB.position[1], wA.position[2]],
            pos
        ),
        topLeft: toGlobalPos(
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
        print("Y: " + y);
        matrix[y] = [];
        for (let z = 0; z < sizeZ; z++) {
            print("Z: " + z);
            matrix[y][z] = [];
            for (let x = 0; x < sizeX; x++) {
                print("X: " + x);
                matrix[y][z][x] = scanData[i];
                i++;
            }
        }
    }

    return matrix;
}

function print3DMatrix(matrix: Matrix3D) {
    for (let y = 0; y < matrix.length; y++) {
        for (let z = 0; z < matrix[0].length; z++) {
            print(matrix[0][z].map((e) => (e > 0 ? 1 : 0)).join(" "));
        }
        print("_".repeat(matrix[0][1].length));
    }
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
): Matrix3D {
    const pos = getPos(nav);
    const rW = width(r);
    const rL = length(r);

    const a = r.bottomLeft;

    //TODO: Scan area in 64 block chunks to cover bigger areas
    if (rW * rL > 64) error("Maximum volume is 64 blocks (for now)");
    if (pos[1] != a[1]) error("Robot and rectangle not on the same y");

    const relativeOrigin: Position = [a[0] + pos[0], pos[1], a[2] + pos[2]];

	let scanData = null
    try {
		scanData = geo.scan(
			relativeOrigin[0],
			relativeOrigin[1],
			relativeOrigin[2],
			rW,
			rL
		);
	} catch(e) {
		print(e)
	}

	if(scanData == null) error(`Scan unsuccessful - w:${rW} l:${rL} - ${relativeOrigin[0]}, ${relativeOrigin[1]}, ${relativeOrigin[2]}`)

    return scanTo3DMatrix(rW, 1, rL, scanData);
}

function scanWaypointArea(
    waypointA: string,
    waypointB: string,
    nav: OpenOS.Navigation,
    geo: OpenOS.Geolyzer
) {
    const waypoints = getWaypoints([waypointA, waypointB], nav);
    const r = getRectangle(waypoints[waypointA], waypoints[waypointB], nav.getPosition());
    const matrix = scanRectangle(r, nav, geo);
    print3DMatrix(matrix);
}

scanWaypointArea(a, b, nav, geo);
