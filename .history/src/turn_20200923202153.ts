import robot = require("robot")
import serialization = require("serialization")
import { parseArguments } from "System"

const bruh = {...args}

print(serialization.serialize(bruh))