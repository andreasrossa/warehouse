import robot = require("robot")
import component = require("component")
import sides = require("sides")
import { NodeGraph, nodeGraphFromPositions, NodeID, Path, Pos2D } from "./warehouse_lib";

const nav = component.navigation;

export enum FacingDir {
    North = 0,
    East = 90,
    South = 180,
    West = 270
}

export function currentFacingDir(): FacingDir {
    const facing = nav.getFacing()
    switch(facing) {
        case sides.front: return FacingDir.North;
        case sides.right: return FacingDir.East;
        case sides.left: return FacingDir.West;
        case sides.back: return FacingDir.South;
    }

    return -1
}

export function faceDirection(dir: FacingDir) {
    print("Facing: " + dir.toString())
    const facing = currentFacingDir()
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

export function moveInDirection(dir: FacingDir, dist: number) {
    faceDirection(dir)
    for(let i = 0; i < Math.abs(dist); i++) {
        moveForward()
    }
}

/**
 * Moves the robot dist blocks in positive X (negative X when dist < 0)
 * @param dist distance
 */
export function moveX(dist: number) {
    if(dist < 0) {
        moveInDirection(FacingDir.East, dist)
    } else {
        moveInDirection(FacingDir.West, dist)
    }
}

/**
 * Moves the robot dist blocks in positive Z (negative Z when dist < 0)
 * @param dist distance
 */
export function moveZ(dist: number) {
    if(dist < 0) {
        moveInDirection(FacingDir.South, dist)
    } else {
        moveInDirection(FacingDir.North, dist)
    }
}

export function moveFromTo(from: Pos2D, to: Pos2D, nodeGraph: NodeGraph) {
    if(from.x === to.x) {
        moveX(to.x-from.x)
    } else if (from.z === to.z) {
        moveZ(to.z-from.z)
    } else {
        error("Tried to move diagonally")
    }
}

export function walkPath(path: Path, nodeGraph: NodeGraph) {
    print("Walking Path with size " + path.length)
    for(let i = 0; i < path.length-1; i++) {
        const from = nodeGraph.get(path[i])!!;
        const to = nodeGraph.get(path[i+1])!!;
        moveFromTo(from.pos, to.pos, nodeGraph)
    }
}

export function moveForward() {
    print("Moving Forward")
    if(robot.move(sides.front)) return
}