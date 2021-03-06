import component = require("component")
import controller = require("./controller")
import * as wl from "./warehouse_lib"
import term = require("term")
const parsedArgs = [...args];

const aLabel = parsedArgs[0]!!;
const bLabel = parsedArgs[1]!!;
const start = tonumber(parsedArgs[2])!!;
const end = tonumber(parsedArgs[3])!!;
const range = tonumber(parsedArgs[4]) || 100;

const nav = component.navigation
const geo = component.geolyzer;

const waypoints = wl.getWaypoints([aLabel, bLabel], nav, range);
const r = wl.getRectangle(waypoints[aLabel], waypoints[bLabel], wl.getPos(nav));

let matrix: wl.Matrix2D = wl.scanRectangle(r, nav, geo)!!;

const nodePositions = wl.findAirPositions(matrix);

nodePositions.forEach((n, id) => print(`${id} (x: ${n.x}, z: ${n.z})`))

let graph = wl.nodeGraphFromNodePosMap(nodePositions);

print("Size before reduction:", graph.size)

graph = wl.reduceGraph(graph);

print("Size:", graph.size);

[...graph].forEach(([id, it]) =>
    print(
        `${id} (x: ${it.pos.x}, z: ${it.pos.z}): [${it.neighbours.join(", ")}]`
    )               
);

const path = wl.russianMan(start, end, graph)!!;
// print("Path:", path.join(", "))

controller.walkPath(path, graph, nav)