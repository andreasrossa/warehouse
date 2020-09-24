import robot = require("robot");
import component = require("component");
import serialization = require("serialization");
import { write } from "term";
import { filledWindow } from "GUI";

type Matrix3D = number[][][]

const geolyzer = component.geolyzer;

const parsedArgs = [...args];

const offsetX = tonumber(parsedArgs[0]) || 0;
const offsetY = tonumber(parsedArgs[1]) || 0;
const offsetZ = tonumber(parsedArgs[2]) || 0;
const sizeX = tonumber(parsedArgs[3]) || 0;
const sizeY = tonumber(parsedArgs[4]) || 0;
const sizeZ = tonumber(parsedArgs[5]) || 0;

const rawScanData: number[] = geolyzer.scan(
    offsetX,
    offsetZ,
    offsetY,
    sizeX,
    sizeZ,
    sizeY
);
const scanData = rawScanData.slice(0, sizeX * sizeY * sizeZ);
 
function scanTo3DMatrix(sizeX: number, sizeY: number, sizeZ: number, scanData: number[]): Matrix3D {
    let matrix: Matrix3D = [];
    let i = 0;

    for (let y = 0; y < sizeY; y++) {
        print("Y: " + y);
        matrix[y] = [];
        for (let z = 0; z < sizeZ; z++) {
            print("Z: " + z);
            matrix[y][z] = [];
            for (let x = 0; x < sizeX; x++) {     
                print("X: " + x);
                matrix[y][z][x] = scanData[i];
                i++;
            }
        }
    }

    return matrix
}

function print3DMatrix(matrix: Matrix3D) {
    for (let y = 0; y < matrix.length; y++) {
        for (let z = 0; z < matrix[0].length; z ++) {
            print(matrix[0][z].map((e) => (e > 0 ? 1 : 0)).join(" "));
        }
        print("-".repeat(sizeX));
    }
}

const matrix = scanTo3DMatrix(sizeX, sizeY, sizeZ, scanData)
print3DMatrix(matrix)


