import robot = require("robot")
import serialization = require("serialization")
import bruh = require("process")
const degrees = tonumber([...args][0] ) || 0



if(degrees % 90) error("Must be in 90° steps")