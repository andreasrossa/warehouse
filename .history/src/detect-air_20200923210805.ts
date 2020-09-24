import robot = require("robot")
import component = require("component")
import serialization = require("serialization")
import { parseArguments } from "System"

const geolyzer = component.geolyzer

const parsedArgs = [...args]

const offsetX = tonumber(parsedArgs[0]) || 0
const offsetY = tonumber(parsedArgs[1]) || 0 
const offsetZ = tonumber(parsedArgs[2]) || 0
const sizeX = tonumber(parsedArgs[3]) || 0
const sizeY = tonumber(parsedArgs[4]) || 0
const sizeZ = tonumber(parsedArgs[5]) || 0

const scanData = geolyzer.scan(offsetX,offsetY,offsetZ,sizeX, sizeY, sizeZ)

for(let i = 0; i < scanW*scanD*scanH; i++) {
    print(scanData[i])
}