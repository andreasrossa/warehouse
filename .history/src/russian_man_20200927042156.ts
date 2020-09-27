import { Pos2D, NodeGraph, GraphNode, getNeighbours } from "./warehouse_lib"

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

export function russianMan(start: NodeID, end: NodeID, graph: NodeGraph): Path | null | undefined {
    const finished: Set<NodeID> = new Set()
    const costs: Map<NodeID, Cost> = new Map()
    const paths: Map<NodeID, Path> = new Map();
    
    costs.set(start, 0)
    paths.set(start, [start])

    while(true) {
        const cheapestCost = Math.min(...[...costs].filter(([id, n]) => !finished.has(id)).map(([id, c]) => c))
        if(cheapestCost == null) break;
        const current = [...costs].find(([id, c]) => c == cheapestCost)!!.[0]

        if(current == end) return paths.get(end)

        const n = graph.get(current)!!.neighbours

        if(n == null || n.length == 0) error("Seperate Nodes")

        n.forEach(id => {
            const edgeCost = cost(current, id, graph)
            const newCost = edgeCost + costs.get(current)!!
            const oldCost = costs.get(id)
            const newPath = [...paths.get(current)!!, id]

            if(oldCost == null) { // Hasnt been visited yet
                costs.set(id, newCost)
                paths.set(id, newPath)
            } else {
                if(newCost < oldCost) { // Cheaper?
                    costs.set(id, newCost)
                    paths.set(id, newPath)
                }
            }
        })

        finished.add(current)
    }

    return null
}