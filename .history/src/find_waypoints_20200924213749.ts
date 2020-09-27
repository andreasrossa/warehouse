import component = require("component");
import serialization = require("serialization");

export type Position = number[]
export type Matrix3D = number[][][]

const parsedArgs = [...args];

const a = parsedArgs[0];
const b = parsedArgs[1];
const range = tonumber(parsedArgs[2]) || 1000;

const nav = component.navigation;

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

export const getPos = (nav: OpenOS.Navigation): Position => [...nav.getPosition()];

/**
 * Finds waypoints for the specified labels
 * @param waypointLabels Labels of the waypoints
 */
export function getWaypoints(waypointLabels: string[], nav: OpenOS.Navigation): OpenOS.Waypoint[] {
    const waypointsInRange = nav.findWaypoints(range);
    let matchingWaypoints = [];
    for (let i = 0; i < waypointLabels.length; i++) {
        const matched = waypointsInRange.find((e) => e.label == waypointLabels[i]);
        if (matched == null) error(`"${waypointLabels[i]}" could not be found within ${range} blocks`)
        matchingWaypoints.push(matched);
    }

    return matchingWaypoints;
}

/**
 * Calculates a {@link Rectangle} from 2 Waypoints.
 * The coordinates are returned relative to the center of the map of the nav-component
 *
 * @param a lower left corner waypoint of the warehouse
 * @param b upper right corner waypoint of the warehouse
 */
export function getRectangle(
    wA: OpenOS.Waypoint,
	wB: OpenOS.Waypoint,
	nav: OpenOS.Navigation
): Rectangle {
	const pos = getPos(nav)
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
    }
}

function scanTo3DMatrix(sizeX: number, sizeY: number, sizeZ: number, scanData: number[]): Matrix3D {
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

    return matrix
}

/**
 * Scans a rectangle and returns a 2D Array
 * @param r Rectangle representing scan-area
 * @param nav Navigtation Component
 */
function scanRectangle(r: Rectangle, nav: OpenOS.Navigation, geo: OpenOS.Geolyzer) {
	const pos = getPos(nav)
	const rW = width(r);
	const rL = length(r);
	//TODO: Scan area in 64 block chunks to cover bigger areas
	if(rW * length(r) > 64) error("Maximum volume is 64 blocks (for now)") 

	const a = r.bottomLeft
	const relativeOrigin: Position = [a[0] + pos[0], pos[1], a[2] + pos[2]]

	const scanData = geo.scan(relativeOrigin[0], relativeOrigin[1], relativeOrigin[2], rW, rL)

	scanTo3DMatrix()
}