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
            label: string,
            position: number[],
            redstone: number
        }[]
    }
}