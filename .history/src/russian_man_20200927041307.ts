import { Pos2D, NodeGraph, GraphNode } from "./warehouse_lib"

export type Pair<A,B> = {first: A, second: B}

type NodeID = number
type Cost = number
type Path = NodeID[]

export function manhattanDistance(a: Pos2D, b: Pos2D): number {
    return Math.abs(a.x - b.x) + Math.abs(a.z - b.z)
}

export function cost(a: NodeID, b: NodeID, graph: NodeGraph): number {
    return manhattanDistance(graph.get(a)!!.pos, graph.get(b)!!.pos)
}

export function russianMan(start: NodeID, end: NodeID, graph: NodeGraph) {
    const finished: Set<NodeID> = new Set()
    const costs: Map<NodeID, Cost> = new Map()
    const paths: Map<NodeID, Path> = new Map();
    
    costs.set(start, 0)
    paths.set(start, [start])

    while(true) {
        const cheapestCost = Math.min(...[...costs].filter(([id, n]) => !finished.has(id)).map(([id, c]) => c))
        if(cheapestCost == null) break;
        const current = [...costs].find(([id, c]) => c == cheapestCost)?.0;

        if(current == end) return paths.get(end)

        const n = 
    }
}