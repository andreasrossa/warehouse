import component = require("component");
import serialization = require("serialization");
import term = require("term");
import { current } from "thread";

type Position3D = number[];
type Position2D = number[];
type Matrix3D = number[][][];
type Matrix2D = number[][];

const parsedArgs = [...args];

const aLabel = parsedArgs[0];
const bLabel = parsedArgs[1];
const range = tonumber(parsedArgs[2]) || 1000;

const nav = component.navigation;
const geo = component.geolyzer;
const gpu = component.gpu;

interface Rectangle {
    bottomLeft: Position3D;
    bottomRight: Position3D;
    topLeft: Position3D;
    topRight: Position3D;
}

function toGlobalPos(offset: number[], globalPos: Position3D): Position3D {
    let newPos = [];
    for (let i = 0; i < 3; i++) {
        newPos[i] = globalPos[i] + offset[i];
    }
    return newPos;
}

const width = (r: Rectangle): number =>
    Math.abs(r.bottomRight[0] - r.bottomLeft[0]) + 1;
const length = (r: Rectangle): number =>
    Math.abs(r.topRight[2] - r.bottomRight[2]) + 1;

const getPos = (nav: OpenOS.Navigation): Position3D => [...nav.getPosition()];

/**
 * Finds waypoints for the specified labels
 * @param waypointLabels Labels of the waypoints
 */
function getWaypoints(
    waypointLabels: string[],
    nav: OpenOS.Navigation
): { [name: string]: OpenOS.Waypoint } {
    const waypointsInRange = nav.findWaypoints(range);
    let matchingWaypoints: { [name: string]: OpenOS.Waypoint } = {};
    for (let i = 0; i < waypointLabels.length; i++) {
        const matched = waypointsInRange.find(
            (e) => e.label == waypointLabels[i]
        );
        if (matched == null)
            error(
                `"${waypointLabels[i]}" could not be found within ${range} blocks`
            );
        matchingWaypoints[waypointLabels[i]] = matched;
    }

    return matchingWaypoints;
}

/**
 * Calculates a {@link Rectangle} from 2 Waypoints.
 * The coordinates are returned nav-map-global
 *
 * @param a lower left corner waypoint of the warehouse
 * @param b upper right corner waypoint of the warehouse
 */
function getRectangle(
    wA: OpenOS.Waypoint,
    wB: OpenOS.Waypoint,
    pos: Position3D
): Rectangle {
    return {
        bottomRight: toGlobalPos(wA.position, pos),
        topLeft: toGlobalPos(wB.position, pos),
        bottomLeft: toGlobalPos(
            [wB.position[0], wB.position[1], wA.position[2]],
            pos
        ),
        topRight: toGlobalPos(
            [wA.position[0], wA.position[1], wB.position[2]],
            pos
        ),
    };
}

/**
 * Takes a Scan and converts it to a 3D Matrix.
 * It is accessible like matrix[y][z][x]
 * @param sizeX Width of the rectangle
 * @param sizeY Height of the rectangle
 * @param sizeZ Depth of the rectangle
 * @param scanData data from geo.scan(...)
 */
function scanTo3DMatrix(
    sizeX: number,
    sizeY: number,
    sizeZ: number,
    scanData: number[]
): Matrix3D {
    let matrix: Matrix3D = [];
    let i = 0;

    for (let y = 0; y < sizeY; y++) {
        matrix[y] = [];
        for (let z = 0; z < sizeZ; z++) {
            matrix[y][z] = [];
            for (let x = 0; x < sizeX; x++) {
                matrix[y][z][x] = scanData[i];
                i++;
            }
        }
    }

    return matrix;
}

function print3DMatrix(matrix: Matrix3D) {
    term.clear();
    const cursorOffset = [7, 7];
    for (let y = 0; y < matrix.length; y++) {
        for (let z = 0; z < matrix[y].length; z++) {
            gpu.set(5, z + cursorOffset[1], tostring(z));
            for (let x = matrix[y][z].length - 1; x >= 0; x--) {
                gpu.set(
                    x + cursorOffset[0],
                    z + cursorOffset[1],
                    matrix[y][z][x] > 0 ? "O" : " "
                );
            }
        }
        print("_".repeat(matrix[0][1].length));
    }
}

function correctXZ(matrix: Matrix3D): Matrix3D {
    const newMatrix = Object.assign(matrix);
    for (let y = 0; y < matrix.length; y++) {
        newMatrix[y] = matrix[y].reverse();
        for (let z = 0; z < matrix[y].length; z++) {
            newMatrix[y][z] = matrix[y][z].reverse();
        }
    }
    return newMatrix;
}

/**
 * Scans a rectangle and returns a 2D Array
 * @param r Rectangle representing scan-area
 * @param nav Navigtation Component
 */
function scanRectangle(
    r: Rectangle,
    nav: OpenOS.Navigation,
    geo: OpenOS.Geolyzer
): Matrix3D | null {
    const pos = getPos(nav);
    const rW = width(r);
    const rL = length(r);

    const a = r.bottomRight;

    //TODO: Scan area in 64 block chunks to cover bigger areas
    if (rW * rL > 64) error("Maximum volume is 64 blocks (for now)");
    if (pos[1] != a[1]) error("Robot and rectangle not on the same y");

    const relativeOrigin: Position3D = [a[0] - pos[0], 0, a[2] - pos[2]];

    print(
        `Scanning: w=${rW} l=${rL} - x=${relativeOrigin[0]}, y=${relativeOrigin[1]}, z=${relativeOrigin[2]}`
    );

    let scanData = null;
    try {
        scanData = geo.scan(
            relativeOrigin[0],
            relativeOrigin[2],
            relativeOrigin[1],
            rW,
            rL,
            1
        );
    } catch (e) {
        print(e);
    }

    if (scanData == null) {
        print(
            `Scan unsuccessful - w:${rW} l:${rL} - ${relativeOrigin[0]}, ${relativeOrigin[1]}, ${relativeOrigin[2]}`
        );
        return null;
    }

    return scanTo3DMatrix(rW, 1, rL, scanData);
}

function printWaypointArea(
    waypointA: string,
    waypointB: string,
    nav: OpenOS.Navigation,
    geo: OpenOS.Geolyzer
) {
    const waypoints = getWaypoints([waypointA, waypointB], nav);
    const r = getRectangle(
        waypoints[waypointA],
        waypoints[waypointB],
        nav.getPosition()
    );
    print(
        `Rectangle: bl=${r.bottomLeft.join(",")} br=${r.bottomRight.join(
            ","
        )} tl=${r.topLeft.join(",")} tr=${r.topRight.join(",")}`
    );
    let matrix = scanRectangle(r, nav, geo);

    if (matrix == null) return;

    print3DMatrix(matrix);
}

    type NodeGraph = Map<number, Node>;
    interface Pos2D {
    x: number;
    z: number;
    }

    interface Node {
    pos: Pos2D;
    index: number;
    neighbours: number[];
    }

    const matrix: Matrix2D = [
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    ];

    function comparePos(a: Pos2D, b: Pos2D): boolean {
    return a.x == b.x && a.z == b.z;
    }

    function posHash(pos: Pos2D, sX: number): number {
    return pos.z + 1 * sX - pos.x;
    }

    function getNeighbours(currentPos: Pos2D, graph: NodeGraph): number[] {
    return [...graph]
        .filter(([i, n]) => {
        return (
            comparePos({ x: currentPos.x, z: currentPos.z - 1 }, n.pos) ||
            comparePos({ x: currentPos.x, z: currentPos.z + 1 }, n.pos) ||
            comparePos({ x: currentPos.x - 1, z: currentPos.z }, n.pos) ||
            comparePos({ x: currentPos.x + 1, z: currentPos.z }, n.pos)
        );
        })
        .map((n) => index);
    }

    const graph: NodeGraph = [];

    for (let z = 0; z < matrix.length; z++) {
    for (let x = 0; x < matrix[z].length; x++) {
        const tile = matrix[z][x];
        if (tile != 0) continue; // Continue if not air-block

        const n = getNeighbours({ x: x, z: z }, graph);

        graph.push({
        index: graph.length,
        pos: { x: x, z: z },
        neighbours: n,
        });
    }
    }

    graph.forEach((e) =>
    e.neighbours.forEach((n) => {
        const g = graph.find((i) => i.index == n).neighbours;
        if (!g.includes(e.index)) g.push(e.index);
    })
    );

printWaypointArea(aLabel, bLabel, nav, geo);

// https://www.typescriptlang.org/play?#code/MYewdgziA2CmB0AXAlgW1gCgOQEMsEoBuAKGMQE8AHWAAgFkdEAnZADwCYARGgXhrACuqAEawmAbQC6UkhWo0AciAAmsAOJMclABa96WgDwAFEBC4AaGhq3alqgHwlkYRGIBmOYLRNnuAb2IaGlYALn4hUSYSIIAvMMERMRIAX1JnVyYPLytNHTtaAKDnVVDwxKjA-lhkAHNtYRABJggwny4ZYlTiNwEwYBRwGlBUShwmWB8MHFbTCxphGd98MIaYWBwwGkKaccQmzZx4Vl4+YSOaADILmkOYk-n4GJTSAHoXnr6BzcpTAAkcCDaDA-Fo0NqcSwQAAa8QiYmWZUiW2IbyCu32NBBjxoAGoaABGGgAKho0JoAFpMaYjiQ3l0Pv1kIMarBEApqnUGk0IBhgE1xi4fIs5iCAIJMJjCzhSBHgqTItGsjFiiWVILwNzIaAZDDA0z4Xj2GgYNVBM3DUbjSZ+YJhPkS2CC6msSxxIb8x2IHzYymE5KWEEGgA+QdNZqGIBGYwmpgwNtK9oFXudrrtHqdEGxeL9Af1NBDYfNkctMZ58bTDoz519qfdleTmbu-qpEGDofD4Yt0ettrrSe9x2ztcTnu9TdzrcL+FNRE6pFAkEQNFQjBYpQYzDYXD04kq4nxlgPNAADIezwTz0er4fJOY99eT5enxeX1fb3vT4+v5+f5Zf9+-3fIJxE-I9QOfB9wIJICaBA89-3-SDLxguCXygsDn3QlCEMw3Cv3xbD4Lwh8MOgu9JBIUgGS+GhNTAZRRWQJgfGQL4eRXTd11XLdOFlWZpUkBUI0XfgVFLVimUgKV5T4KRSCCNwQCYY04CXO4+GPQgaDuAxl241h4DgMAakQbQtJiHEcQNbYFKUlTWWCPRNMc3SOLXcQYkkQzHRMszgks6zCwXCAlxQOA9DctgPOkVgKMLZA3GNMLaAAQg0g0FxQQRYC01EAGFwCygRaAS0SlxwJjyWEaAQGAABrQswDEli2PgSgBEBONShdbSwhiZJp3DVIgi6RU9iYTYmtUFrJIgOdul6RlBim9Rcm0AAxJhIxm8AeRWnapLBfiZTCfJrB0ITgqXGo1tOsTzt0PgwFgAB3fRKAwWdKkU5SMFUmhkCcrTAd0-bTAk3bvOM0zgYCoSgiuls9DBiAIcgcRkEkU1Eee2p6kaZo9BZNkOXx7k9QgSwUbRydwxumx4AgVkKcsPxilgUp6Z0RnkBiWAqdJrlmniQWCYgAbKmGmhKnRCaaC57R5uoyTMRYFwzrWjAFbu1QHshGFETESEAC1YXKQLbN+-71JPcyaF0iBjfMuGbNouy-oc44NK044HahH2XfitwtbW+BtABLqwh6t1+vwC2OwR3a1kMkAahDhnicj4Ja1jgB+eB2dYA1CylkbJaVxaaPGZQBC8B7050HXVpsBENZseHhJCnZYBrrxlGR173ob7RBrNF7tC1TBmGK+Pw2r2ue8+01Ui6HHmvBti9DohimIO9j9OnRHtcUe61uR0+bE27aN9mjBqbY6diAVjUlIAUU8IE74DSwagNHgjWCsnGqacAAGAASPwYAC70Q5skY0EDKBHGbAgx4A0wjiAgVA3GnIxbwBXB9HAhp5bwEzjgfA+dC74HgAAKxAM4DAAAiSwDD8DJEkCAuOQA

// https://www.typescriptlang.org/play?#code/MYewdgziA2CmB0AXAlgW1gCgOQEMsEoBuAKGMQE8AHWAAgFkdEAnZADwCYARGgXhrACuqAEawmAbQC6UkhWo0AciAAmsAOJMclABa96WgDwAFEBC4AaGhq3alqgHwlkYRGIBmOYLRNnuAb2IaGlYALn4hUSYSIIAvMMERMRIAX1JnVyYPLytNHTtaAKDnVVDwxKjA-lhkAHNtYRABJggwny4ZYlTiNwEwYBRwGlBUShwmWB8MHFbTCxphGd98MIaYWBwwGkKaccQmzZx4Vl4+YSOaADILmkOYk-n4GJTSAHoXnr6BzcpTAAkcCDaDA-Fo0NqcSwQAAa8QiYmWZUiW2IbyCu32NBBjxoAGoaABGGgAKho0JoAFpMaYjiQ3l0Pv1kIMarBEApqnUGk0IBhgE1xi4fIs5iCAIJMJjCzhSBHgqTItGsjFiiWVILwNzIaAZDDA0z4Xj2GgYNVBM3DUbjSZ+YJhPkS2CC6msSxxIb8x2IHzYymE5KWEEGgA+QdNZqGIBGYwmpgwNtK9oFXudrrtHqdEGxeL9Af1NBDYfNkctMZ58bTDoz519qfdleTmbu-qpEGDofD4Yt0ettrrSe9x2ztcTnu9TdzrcL+FNRE6pFAkEQNFQjBYpQYzDYXD04kq4nxlgPNAADIezwTz0er4fJOY99eT5enxeX1fb3vT4+v5+f5Zf9+-3fIJxE-I9QOfB9wIJICaBA89-3-SDLxguCXygsDn3QlCEMw3Cv3xbD4Lwh8MOgu9JBIUgGS+GhNTAZRRWQJgfGQL4eRXTd11XLdOFlWZpUkBUI0XfgVFLVimUgKV5T4KRSCCNwQCYY04CXO4+GPQgaDuAxl241h4DgMAakQbQtJiHEcQNbYFKUlTWWCPRNMc3SOLXcQYkkQzHRMszgks6zCwXCAlxQOA9DctgPOkVgKMLZA3GNMLaAAQg0g0FxQQRYC01EAGFwCygRaAS0SlxwJjyWEaAQGAABrQswDEli2PgSgBEBONShdbSwhiZJp3DVIgi6RU9iYTYmtUFrJIgOdul6RlBim9Rcm0AAxJhIxm8AeRWnapLBfiZTCfJrB0ITgqXGo1tOsTzt0PgwFgAB3fRKAwWdKkU5SMFUmhkCcrTAd0-bTAk3bvOM0zgYCoSgiuls9DBiAIcgcRkEkU1Eee2p6kaZo9BZNkOXx7k9QgSwUbRydwxumx4AgVkKcsPxilgUp6Z0RnkBiWAqdJrlmniQWCYgAbKmGmhKnRCaaC57R5uoyTMRYFwzrWjAFbu1QHshGFETESEAC1YXKQLbN+-71JPcyaF0iBjfMuGbNouy-oc44NK044HahH2XfitwtbW+BtABLqwh6t1+vwC2OwR3a1kMkAahDhnicj4Ja1jgB+eB2dYA1CylkbJaVxaaPGZQBC8B7050HXVpsBENZseHhJCnZYBrrxlGR173ob7RBrNf6mrAAAlHva57greiXDTTRe7QtUwCfp97ufGhce5q9n5Qeb5+Pw33vuNSUgBRTwgQwMAJwNHgjVd8MErv+Bcc5MWod8+52Eua4YAP6i25PAWAAA3MQ5BdRgB8I-I0sDnT3CxMcEM-AxzIOpDEOOHcE441FD4ZGwC8ZCwgCBLGCdOy7SXGAUUegz493gJnWhcCUopULFQkSYAABChCnrEK-tyfcFDKGJy4dw+hM9z7MN4fqNh8lRH8FFAIsmhMnrKM-qozMmptRiAwKxQ0AMlxpRbKPURPCVGkORtwyx38dE6gMU-IxNATGBg4WaWhtjQHtU6jwuB7iggWM0aQtqHUgQsP1AE7uW9D5M0QHfAhpgqaijMZQhhsTmZ+KSfwbhqSE7pPgKoVSmA3GiOSDQWA0Ama4I7BvKR28F6WXcaXM0EshqmllpsdJ80cbNXBmxPQdEGJMQOuxfS05Eba0UPdNayMZk2E2ttfps0759NRmxacxAFYXyYNfYAt976YksDUeBndk41TTgAAwACR+CAYXcpGBbmUCOM2Z5jwBphHELcoBwTv4rg+jgQxNQmHMxwPgfOhd8DwAAFYgGcBgAARJYRF+BkiSEuXHIAA