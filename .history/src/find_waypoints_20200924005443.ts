import robot = require("robot");
import component = require("component");
import serialization = require("serialization");

const nav = component.navigation

const pos = [...nav.getPosition()]
print(typeof pos)