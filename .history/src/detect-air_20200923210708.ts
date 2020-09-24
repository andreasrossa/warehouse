import robot = require("robot")
import component = require("component")
import serialization = require("serialization")
import { parseArguments } from "System"

const geolyzer = component.geolyzer

const parsedArgs = [...args]

const offsetX = tonumber(parsedArgs[0])
const offsetY = tonumber(parsedArgs[1])
const offsetZ = tonumber(parsedArgs[2])
const sizeX = tonumber(parsedArgs[3])
const sizeY = tonumber(parsedArgs[4])
const sizeZ = tonumber(parsedArgs[5])

const scanData = geolyzer.scan(0,0,0,scanW, scanD, scanH)

for(let i = 0; i < scanW*scanD*scanH; i++) {
    print(scanData[i])
}