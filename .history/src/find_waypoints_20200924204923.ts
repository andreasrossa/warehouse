import component = require("component");
import serialization = require("serialization");

const parsedArgs = [...args]

const a = parsedArgs[0]
const b = parsedArgs[1]
const range = tonumber(parsedArgs[2]) || 1000

export interface Rectangle {
    bottomLeft: number[],
    bottomRight: number[],
    topLeft: number[],
    topRight: number[]
}

export function toGlobalPos(offset: number[], globalPos: number[]): number[] {
    let newPos = []
    for(let i = 0; i < 3; i++) {
        newPos[i] = globalPos[i] + offset[i]
    }
    return newPos
}


export const width = (r: Rectangle) => Math.abs(r.bottomRight[0] - r.bottomLeft[0])
export const length = (r: Rectangle) => Math.abs(r.topRight[2] - r.bottomRight[2])

const nav = component.navigation

const pos = [...nav.getPosition()]


export function getWaypoints(...args: string[]) {
    const waypointsInRange = nav.findWaypoints(range);
    let matchingWaypoints = []
    for(let i = 0; i < args.length; i++) {
        matchingWaypoints.push(waypointsInRange.find(e => e.label == a))
    }

    return waypointsInRange;
}

if (wA == null) error(`${a} could not be found`)
if (wB == null) error(`${b} could not be found`)

const r: Rectangle = {
    bottomLeft: toGlobalPos(wA.position, pos),
    topRight: toGlobalPos(wB.position, pos),
    bottomRight: toGlobalPos([wB.position[0], wB.position[1], wA.position[2]], pos),
    topLeft: toGlobalPos([wA.position[0], wA.position[1], wB.position[2]], pos)
}

/**
 * Calculates a {@link Rectangle} from 2 Waypoints
 * @param a lower left corner waypoint of the warehouse
 * @param b upper right corner waypoint of the warehouse
 */
export function getRectangle(a: OpenOS.Waypoint, b: OpenOS.Waypoint) {

}

print(serialization.serialize(r, true))
