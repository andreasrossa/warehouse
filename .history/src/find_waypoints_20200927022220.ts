import component = require("component")

import wh = require("./warehouse_lib")

const parsedArgs = [...args];

const aLabel = parsedArgs[0];
const bLabel = parsedArgs[1];
const range = tonumber(parsedArgs[2]) || 1000;

const nav = component.navigation;
const geo = component.geolyzer;
const gpu = component.gpu;

const waypoints = getWaypoints([aLabel, bLabel], nav);
const r = getRectangle(waypoints[aLabel], waypoints[bLabel], nav.getPosition());

let matrix: Matrix2D = scanRectangle(r, nav, geo)!!;

const nodePositions = findAirPositions(matrix);
let graph = nodeGraphFromPositions(nodePositions);
graph = reduceGraph(graph);

[...graph].forEach(([pos, it]) =>
    print(
        `${it.index} (x: ${pos.x}, z: ${pos.z}): [${it.neighbours
            .map((n) => graph.get(n)?.index)
            .join(", ")}]`
    )
);
