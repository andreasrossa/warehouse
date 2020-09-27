import { Pos2D, NodeGraph, GraphNode } from "./warehouse_lib"

export type Pair<A,B> = {first: A, second: B}
export type IPPair = Pair<number, Pos2D>

type NodeID = number
type Cost = number

export function cost(a: Pos2D, b: Pos2D, graph: NodeGraph) {
    return Math.abs(a.x - b.x) + Math.abs(a.z - b.z)
}

export function russianMan() {
    const finished: Set<NodeID> = new Set()
    const costs: Map<NodeID, Cost> = new Map()
}