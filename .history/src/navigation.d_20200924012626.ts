declare namespace OpenOS {
    interface Navigation {
        /**
         * @tupleReturn
         */
        getPosition(): [number, number, number]
        findWaypoints(range: number): {
            label: string,
            position: number[],
            redstone: number
        }[]
    }
}