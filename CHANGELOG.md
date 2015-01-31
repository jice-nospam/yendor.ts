# 0.5.0 / TBD
* Yendor toolkit
	- the Fov class does not handle the 'isWalkable' property anymore

# 0.4.0 / 28-jan-2015
* Yendor toolkit
	- improved Pixi console rendering performance (Console.setChar removed, Console.text is now a matrix of ascii codes)

* GeneRogue
	- added frozen and life detection condition
	- added teleport effect
	- added wand of frost, staff of teleportation, staff of life detection
	- effects, ranged weapons and item throwing have a max range

# 0.3.0 / 17-jan-2015
* Yendor toolkit
	- added timed entity Scheduler

* GeneRogue
	- weight based container capacity
	- overencumbered condition (when inventory capacity >= 90%, walk time increased by 50%)
	- creatures have different walking speed
	- ranged weapons have different loading speed
	- melee weapons have different attack speed
	- regeneration potion

* Benchmark
	- turn by turn and real time scheduler samples

# 0.2.0 / 01-jan-2015
* Yendor toolkit
	- added BinaryHeap, A* path finding toolkit

* GeneRogue
	- added ranged weapons (bow, crossbow)
	- creatures now use A* pathfinding when player is in field of view

* Benchmark
	- added path finding sample

# 0.1.0 / 23-dec-2014
* Yendor toolkit
	- added Random.getRandomChance()

* GeneRogue
	- goblins
	- multi-level dungeon
	- can drop items with 'd'
	- can throw items with 't'
	- equipable one-handed and two-handed items (swords, shields)
	- inventory now stacks similar items

# 0.0.3 / 06-dec-2014
* Yendor toolkit
	- mush faster console implementation using pixi.js

* GeneRogue :
	- scroll of fireball
	- scroll of confusion
	- persistence (game state saved in the browser's local storage)

# 0.0.2 / 15-oct-2014

* Yendor toolkit
	- improved browser compatibility (tested firefox + chrome + IE9 + IE11)

# 0.0.1 / 15-may-2014

Initial release

* Yendor toolkit
	- console toolkit
	- bsp toolkit
	- random number generator (complementary multiply with carry)
	- field of view (restrictive precise angle shadowcasting algorithm by Dominik Marczuk)

* GeneRogue : a generic roguelike
	- random levels
	- orcs and trolls with scent tracking A.I.
	- health potions, scrolls

* Benchmark
	- true color rendering performance benchmark
