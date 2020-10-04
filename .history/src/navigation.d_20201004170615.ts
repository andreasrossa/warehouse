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
        position: [],
        redstone: number
    }
}

declare module "component" {
    function get(address: string, componentType: "navigation"): OpenOS.Navigation | null
    function getPrimary(componentType: "modem"): OpenOS.Navigation;
    const navigation: OpenOS.Navigation;
}