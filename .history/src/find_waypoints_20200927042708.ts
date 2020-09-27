import component = require("component")

import * as wh from "./warehouse_lib"
const parsedArgs = [...args];

const aLabel = parsedArgs[0];
const bLabel = parsedArgs[1];
const start = parsedArgs[2];
const end = parsedArgs[3];
const range = tonumber(parsedArgs[4]) || 100;

const nav = component.navigation;
const geo = component.geolyzer;
const gpu = component.gpu;

const waypoints = wh.getWaypoints([aLabel, bLabel], nav, range);
const r = wh.getRectangle(waypoints[aLabel], waypoints[bLabel], nav.getPosition());

let matrix: wh.Matrix2D = wh.scanRectangle(r, nav, geo)!!;

const nodePositions = wh.findAirPositions(matrix);
let graph = wh.nodeGraphFromPositions(nodePositions);
graph = wh.reduceGraph(graph);

[...graph].forEach(([id, it]) =>
    print(
        `${id} (x: ${it.pos.x}, z: ${it.pos.z}): [${it.neighbours.join(", ")}]`
    )
);
