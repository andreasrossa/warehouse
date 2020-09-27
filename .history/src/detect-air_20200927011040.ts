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

type Matrix2D = number[][];
type NodeGraph = Map<Pos2D, GraphNode>;
interface Pos2D {
  x: number;
  z: number;
}

interface GraphNode {
  index: number;
  neighbours: Pos2D[];
}

function comparePos(a: Pos2D, b: Pos2D): boolean {
  return a.x == b.x && a.z == b.z;
}

//function posHash(pos: Pos2D, sX: number): number {
//  return pos.z + 1 * sX - pos.x;
//}

function getNeighbours(currentPos: Pos2D, posArr: Pos2D[]): Pos2D[] {
  return posArr
    .filter((pos) => (
        comparePos({ x: currentPos.x, z: currentPos.z - 1 }, pos) ||
        comparePos({ x: currentPos.x, z: currentPos.z + 1 }, pos) ||
        comparePos({ x: currentPos.x - 1, z: currentPos.z }, pos) ||
        comparePos({ x: currentPos.x + 1, z: currentPos.z }, pos)
      )
    );
}

function findAirPositions(matrix: Matrix2D): Pos2D[] {
  const nodePositions: Pos2D[] = []

  for (let z = 0; z < matrix.length; z++) {
    for (let x = 0; x < matrix[z].length; x++) {
      const tile = matrix[z][x];
      if (tile != 0) continue; // Continue if not air-block
      nodePositions.push({x: x, z: z})
    }
  }

  return nodePositions
}

function nodeGraphFromPositions(nodePositions: Pos2D[]): NodeGraph {
  const graph: NodeGraph = new Map();

  for (let i = 0; i < nodePositions.length; i++) {
    const pos = nodePositions[i]
    const neighbours = getNeighbours(pos, nodePositions)
    graph.set(pos, {index: graph.size, neighbours: neighbours})
  }
  
  return graph
}

function reduceGraph(graph: NodeGraph): NodeGraph {
    const reduced = new Map(graph)
    let nonReducedCount = 0
    while(nonReducedCount < reduced.size) {
      reduced.forEach((n, pos) => {
        if(n.neighbours.length == 2 && ((n.neighbours[0].x == pos.x && n.neighbours[1].x == pos.x) || (n.neighbours[0].z == pos.z && n.neighbours[1].z == pos.z))) {
          const nAPos = n.neighbours[0]
          const nA = reduced.get(nAPos)!!
          const nBPos = n.neighbours[1]
          const nB = reduced.get(nBPos)!!

          nA.neighbours = nA.neighbours.filter(it => it != pos)
          nB.neighbours = nB.neighbours.filter(it => it != pos)
          nA.neighbours.push(nBPos)
          nB.neighbours.push(nAPos)
          reduced.set(nAPos, nA)
          reduced.set(nBPos, nB)
          reduced.delete(pos)
        } else {
          nonReducedCount++
        }
      })
    }
    return reduced
}

const matrix = scanTo3DMatrix(sizeX, sizeY, sizeZ, scanData)
print3DMatrix(matrix)

