import robot = require("robot");
import component = require("component");
import serialization = require("serialization");

const nav = component.navigation

const [x,y,z] = nav.getPosition()

const waypoints = nav.findWaypoints(1000);
print(serialization.serialize(waypoints, true))
print(`X: ${x}, Y: ${y}, Z: ${z}`)