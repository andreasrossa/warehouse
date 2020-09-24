declare namespace OpenOS {
    interface Navigation {
        getPosition(): [number,number,number]
        getFacing(): number
        getRange(): number
        findWaypoints(): Waypoint[] 
    }

    interface Waypoint {
        label: string
        position: number[]
        redstone: number
    }
}