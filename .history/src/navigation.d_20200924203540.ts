declare namespace OpenOS {
    interface Navigation {
        /**
         * @tupleReturn
         */
        getPosition(): [number, number, number]
        /**
         * @noSelf
         */
        findWaypoints(range: number): {
        }[]
    }
    
    interface Waypoint {
        label: string,
        position: number[],
        redstone: number
    }
}