import component = require("component");
import serialization = require("serialization");

const parsedArgs = [...args];

const a = parsedArgs[0];
const b = parsedArgs[1];
const range = tonumber(parsedArgs[2]) || 1000;

const nav = component.navigation;

export interface Rectangle {
    bottomLeft: number[];
    bottomRight: number[];
    topLeft: number[];
    topRight: number[];
}

export function toGlobalPos(offset: number[], globalPos: number[]): number[] {
    let newPos = [];
    for (let i = 0; i < 3; i++) {
        newPos[i] = globalPos[i] + offset[i];
    }
    return newPos;
}

export const width = (r: Rectangle) =>
    Math.abs(r.bottomRight[0] - r.bottomLeft[0]);
export const length = (r: Rectangle) =>
    Math.abs(r.topRight[2] - r.bottomRight[2]);

export const getPos = (nav: OpenOS.Navigation) => [...nav.getPosition()];

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

function scanRectangle()