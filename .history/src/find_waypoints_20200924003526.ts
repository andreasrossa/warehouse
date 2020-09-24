import robot = require("robot");
import component = require("component");
import serialization = require("serialization");

const nav = component.navigation

print(serialization.serialize(nav.getPosition(), true))