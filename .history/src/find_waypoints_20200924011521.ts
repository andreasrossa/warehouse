import robot = require("robot");
import component = require("component");
import serialization = require("serialization");
import navigation = require("navigation")


@tupleReturn
const pos = nav.getPosition()

print(typeof pos)