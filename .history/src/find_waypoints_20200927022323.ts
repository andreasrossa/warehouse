import component = require("component")

import * as wh from "./warehouse_lib"
const parsedArgs = [...args];

const aLabel = parsedArgs[0];
const bLabel = parsedArgs[1];
const range = tonumber(parsedArgs[2]) || 1000;

const nav = component.navigation;
const geo = component.geolyzer;
const gpu = component.gpu;

const waypoints = wh.getWaypoints([aLabel, bLabel], nav);
const r = wh.getRectangle(waypoints[aLabel], waypoints[bLabel], nav.getPosition());

let matrix: wh.Matrix2D = wh.scanRectangle(r, nav, geo)!!;

const nodePositions = wh.findAirPositions(matrix);
let graph = wh.nodeGraphFromPositions(nodePositions);
graph = wh.reduceGraph(graph);

[...graph].forEach(([pos, it]) =>
    print(
        `${it.index} (x: ${pos.x}, z: ${pos.z}): [${it.neighbours
            .map((n) => graph.get(n)?.index)
            .join(", ")}]`
    )
);
