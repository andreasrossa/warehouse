import robot = require("robot")
import component = require("component")
import sides = require("sides")
import { NodeGraph, nodeGraphFromNodePosMap, NodeID, Path, Pos2D } from "./warehouse_lib";

export enum FacingDir {
    North = 0,
    East = 90,
    South = 180,
    West = 270
}

export function currentFacingDir(nav: OpenOS.Navigation): FacingDir {
    const facing = nav.getFacing()
    switch(facing) {
        case sides.front: return FacingDir.North;
        case sides.right: return FacingDir.East;
        case sides.left: return FacingDir.West;
        case sides.back: return FacingDir.South;
    }

    return -1
}

export function faceDirection(dir: FacingDir, nav: OpenOS.Navigation) {
    print("Facing: " + dir.toString())
    const facing = currentFacingDir(nav)
    let rotation = dir - facing;
    if(rotation < 0) {
        for(let i = 0; i <= Math.abs(rotation); i += 90) {
            robot.turnLeft()
        }
    } else {
        for(let i = 0; i <= Math.abs(rotation); i += 90) {
            robot.turnRight()
        }
    }
}

export function moveInDirection(dir: FacingDir, dist: number, nav: OpenOS.Navigation) {
    faceDirection(dir, nav)
    for(let i = 0; i < Math.abs(dist); i++) {
        moveForward()
    }
}

/**
 * Moves the robot dist blocks in positive X (negative X when dist < 0)
 * @param dist distance
 */
export function moveX(dist: number, nav: OpenOS.Navigation) {
    if(dist < 0) {  
        moveInDirection(FacingDir.East, dist, nav)
    } else {
        moveInDirection(FacingDir.West, dist, nav)
    }
}

/**
 * Moves the robot dist blocks in positive Z (negative Z when dist < 0)
 * @param dist distance
 */
export function moveZ(dist: number, nav: OpenOS.Navigation) {
    if(dist < 0) {
        moveInDirection(FacingDir.South, dist, nav)
    } else {
        moveInDirection(FacingDir.North, dist, nav)
    }
}

export function moveFromTo(from: Pos2D, to: Pos2D, nav: OpenOS.Navigation) {
    print(`Moving: (${from.x}, ${from.z}) -> (${to.x}, ${to.z})`)
    if(from.z === to.z) {
        const dist = to.x - from.x;
        print("dist = " + dist)
        moveZ(dist, nav)
    } else if (from.x === to.x) {
        const dist = to.z - from.z;
        print("dist = " + dist)
        moveX(dist, nav)
    } else {
        error("Tried to move diagonally")
    }
}

export function walkPath(path: Path, nodeGraph: NodeGraph, nav: OpenOS.Navigation) {
    print("Walking Path with size " + path.length)
    for(let i = 0; i < path.length-1; i++) {
        const from = nodeGraph.get(path[i]);
        const to = nodeGraph.get(path[i+1]);

        if(from === undefined || to === undefined) error("From or to was null")

        try {
            moveFromTo(from.pos, to.pos, nav)
        } catch (error) {
            print(error)
        }

        os.sleep(0.5)
    }
}

export function moveForward() {
    print("Moving Forward")
    const mvt = robot.forward()
    if(!mvt[0]) error(mvt[1]!!, 0)
}