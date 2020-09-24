import robot = require("robot");
import component = require("component");
import serialization = require("serialization");

const parsedArgs = [...args]

const a = parsedArgs[0]
const b = parsedArgs[1]
const range = tonumber(parsedArgs[2]) || 1000

interface Rectangle {
    bottomLeft: number,
    bottomRight: number,
    topLeft: number,
    topRight: number
}

const nav = component.navigation

const pos = [...nav.getPosition()]

const waypoints = nav.findWaypoints(range);

const wA = waypoints.find(e => e.label == a)
const wB = waypoints.find(e => e.label == b)

if (wA == null) error(`${a} could not be found`)
if (wB == null) error(`${b} could not be found`)

