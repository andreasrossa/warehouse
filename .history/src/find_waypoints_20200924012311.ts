import robot = require("robot");
import component = require("component");
import serialization = require("serialization");

const nav = component.navigation

const [x,y,z] = nav.getPosition()

print(serialization.serialize(nav.findWaypoints(1000)))
print(`X: ${x}, Y: ${y}, Z: ${z}`)