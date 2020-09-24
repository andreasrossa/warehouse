import robot = require("robot")
import component = require("component")
import serialization = require("serialization")
import { write } from "term"
import { filledWindow } from "GUI"

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

let map: Map<number, DataPoint> = new Map()

for (let y = 0; y < sizeY; y++) {
    print("Y: "+y)
    for (let z = 0; z < sizeZ; z++) {
        print("Z: "+z)
        for(let x = 0; x < sizeX; x++) {
            print("X: "+x)
            map.set(i, {posX: x, posY: y, posZ: z, hardness: scanData[i]})
            i++
        }
    }
}

let grid: Array<Array<Array<number>>> = []

map.forEach(e => grid[e.posY][e.posZ][e.posX] = e.hardness)

print(serialization.serialize(grid))