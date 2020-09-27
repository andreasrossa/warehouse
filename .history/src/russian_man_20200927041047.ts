import { Pos2D, NodeGraph } from "./warehouse_lib"

export type Pair<A,B> = {first: A, second: B}

type NodeID = number
type Cost = number
type Path = NodeID[]

export function cost(a: Pos2D, b: Pos2D) {
    return Math.abs(a.x - b.x) + Math.abs(a.z - b.z)
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