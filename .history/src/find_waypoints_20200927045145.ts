import component = require("component")

import * as wl from "./warehouse_lib"
const parsedArgs = [...args];

const aLabel = parsedArgs[0]!!;
const bLabel = parsedArgs[1]!!;
const start = tonumber(parsedArgs[2])!!;
const end = tonumber(parsedArgs[3])!!;
const range = tonumber(parsedArgs[4]) || 100;

const nav = component.navigation;
const geo = component.geolyzer;
const gpu = component.gpu;

const waypoints = wl.getWaypoints([aLabel, bLabel], nav, range);
const r = wl.getRectangle(waypoints[aLabel], waypoints[bLabel], nav.getPosition());

let matrix: wl.Matrix2D = wl.scanRectangle(r, nav, geo)!!;

const nodePositions = wl.findAirPositions(matrix);
let graph = wl.nodeGraphFromPositions(nodePositions);
// graph = wl.reduceGraph(graph);

[...graph].forEach(([id, it]) =>
    print(
        `${id} (x: ${it.pos.x}, z: ${it.pos.z}): [${it.neighbours.join(", ")}]`
    )
);

const co = coroutine.create(function *() {
    yield wl.russianMan(start, end, graph)?.join(", ")
})

coroutine.resume(co)