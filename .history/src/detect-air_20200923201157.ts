import robot = require("robot")
import component = require("component")
import serialization = require("serialization")

print(this)

const geolyzer = component.geolyzer


const scanW = 4
const scanD = 4
const scanH = 1

const scanData = geolyzer.scan(0,0,0,scanW, scanD, scanH)

for(let i = 0; i < scanW*scanD*scanH; i++) {
    print(scanData[i])
}