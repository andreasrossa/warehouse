import robot = require("robot");
import component = require("component");
import serialization = require("serialization");

const nav = component.navigation

const [x,y,z] = nav.getPosition()

print(`X: ${x}, Y: ${y}, Z: ${z}`)