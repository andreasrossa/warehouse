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

let map: {[key: number]: DataPoint} = {}

for (let y = 0; y < sizeY; y++) {
    print("Y: "+y)
    for (let z = 0; z < sizeZ; z++) {
        print("Z: "+z)
        for(let x = 0; x < sizeX; x++) {
            print("X: "+x)
            map[i] = 
        }
    }
}

for(let z = 0; z < map[0].length; z++) {
    const row = map[0][z]
    print(row.map(it => it > 0 ? 1 : 0).join(" "))
}