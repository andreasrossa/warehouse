import { Pos2D, PosNodeGraph, GraphNode } from "./warehouse_lib"

export type Pair<A,B> = {first: A, second: B}

export type IPPair = Pair<number, Pos2D>
export type NodeGraph = Map<number, GraphNode>

export function cost(a: Pos2D, b: Pos2D, graph: NodeGraph) {
    return Math.abs(a.x - b.x) + Math.abs(a.z - b.z)
}

export function russianMan() {
    const finished = []
    const consts
}