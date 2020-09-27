import component = require("component");
import serialization = require("serialization");

const parsedArgs = [...args]

const a = parsedArgs[0]
const b = parsedArgs[1]
const range = tonumber(parsedArgs[2]) || 1000

const nav = component.navigation

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

export function getWaypoints(...args: string[]): OpenOS.Waypoint[] {
    const waypointsInRange = nav.findWaypoints(range);
    let matchingWaypoints = []
    for(let i = 0; i < args.length; i++) {
        const matched = waypointsInRange.find(e => e.label == a);
        if(matched == null) continue
        matchingWaypoints.push(matched)
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
export function getRectangle(wA: OpenOS.Waypoint, wB: OpenOS.Waypoint): Rectangle {
    const pos = [...nav.getPosition()]
    
    return {
        bottomLeft: toGlobalPos(wA.position, pos),
        topRight: toGlobalPos(wB.position, pos),
        bottomRight: toGlobalPos([wB.position[0], wB.position[1], wA.position[2]], pos),
        topLeft: toGlobalPos([wA.position[0], wA.position[1], wB.position[2]], pos)
    }
}