import robot = require("robot");
import component = require("component");
import serialization = require("serialization");

const nav = component.navigation

const = [...nav.getPosition()]
print(`X: ${x}, Y: ${y}, Z: ${z}`)