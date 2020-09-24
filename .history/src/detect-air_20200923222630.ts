import robot = require("robot")
import component = require("component")
import serialization = require("serialization")

const geolyzer = component.geolyzer

const parsedArgs = [...args]

const offsetX = tonumber(parsedArgs[0]) || 0
const offsetY = tonumber(parsedArgs[1]) || 0 
const offsetZ = tonumber(parsedArgs[2]) || 0
const sizeX = tonumber(parsedArgs[3]) || 0
const sizeY = tonumber(parsedArgs[4]) || 0
const sizeZ = tonumber(parsedArgs[5]) || 0

const scanData = geolyzer.scan(offsetX,offsetY,offsetZ,sizeX, sizeY, sizeZ)

interface DataPoint {
    posX: number,
    posY: number,
    posZ: number,
    hardness: number
}

let i = 0

let map: {[key: number]: DataPoint} = {}

for (let y = 0; y < sizeY - 1; y++) {
    print("Y: "+y)
    for (let z = 0; z < sizeZ - 1; z++) {
        print("Z: "+z)
        for(let x = 0; x < sizeX - 1; x++) {
            print("X: "+x)
            map[i] = {posX: x, posY: y, posZ: z, hardness: scanData[i]}
        }
    }
}

print(serialization.serialize(map, true))