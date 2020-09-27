import component = require("component");
import serialization = require("serialization");

const parsedArgs = [...args]

const a = parsedArgs[0]
const b = parsedArgs[1]
const range = tonumber(parsedArgs[2]) || 1000

interface Rectangle {
    bottomLeft: number[],
    bottomRight: number[],
    topLeft: number[],
    topRight: number[]
}

function toGlobalPos(offset: number[], globalPos: number[]): number[] {
    let newPos = []
    for(let i = 0; i < 3; i++) {
        newPos[i] = globalPos[i] + offset[i]
    }
    return newPos
}

const width = (r: Rectangle) => Math.abs(r.bottomRight[0] - r.bottomLeft[0])
const length = (r: Rectangle) => Math.abs(r.topRight[2] - r.bottomRight[2])

const nav = component.navigation

const pos = [...nav.getPosition()]

const waypoints = nav.findWaypoints(range);

const wA = waypoints.find(e => e.label == a)
const wB = waypoints.find(e => e.label == b)

if (wA == null) error(`${a} could not be found`)
if (wB == null) error(`${b} could not be found`)

function getRectangle(a: ) {

}

const r: Rectangle = {
    bottomLeft: toGlobalPos(wA.position, pos),
    topRight: toGlobalPos(wB.position, pos),
    bottomRight: toGlobalPos([wB.position[0], wB.position[1], wA.position[2]], pos),
    topLeft: toGlobalPos([wA.position[0], wA.position[1], wB.position[2]], pos)
}

print("Width: "+ width(r))
print("Length: "+ length(r))

print(serialization.serialize(r, true))
