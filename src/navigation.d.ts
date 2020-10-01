declare namespace OpenOS {
    interface Navigation {
        /**
         * @noSelf
         * @tupleReturn
         */
        getPosition(): [number, number, number]
        /**
         * @noSelf
         */
        findWaypoints(range: number): Waypoint[]
        
        getFacing(): number
    }
    
    interface Waypoint {
        label: string,
        position: number[],
        redstone: number
    }
}