import { Pos2D, NodeGraph, GraphNode } from "./warehouse_lib"

export type Pair<A,B> = {first: A, second: B}

export type PosNodePair = Pair<Pos2D, GraphNode>

export function cost(a: Pos2D, b: Pos2D, graph: NodeGraph) {
    const nA = graph.get(a)!!
    const nB = graph.get(a)!!
    
}