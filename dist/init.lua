local sh = require("shell")

sh.execute("wget -fw https://raw.githubusercontent.com/andreasrossa/warehouse/master/dist/warehouse_lib.lua")
sh.execute("wget -fw https://raw.githubusercontent.com/andreasrossa/warehouse/master/dist/controller.lua")
sh.execute("wget -fw https://raw.githubusercontent.com/andreasrossa/warehouse/master/dist/find_waypoints.lua")
sh.execute("wget -fw https://raw.githubusercontent.com/andreasrossa/warehouse/master/dist/robot_client.lua")
sh.execute("wget -fw https://raw.githubusercontent.com/andreasrossa/warehouse/master/dist/lualib_bundle.lua")