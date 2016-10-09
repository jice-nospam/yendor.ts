# 0.7.0 / 09-oct-2016
* switched to typescript 2.0 (this breaks node support for unit tests)

* Yendor toolkit
    - separate console and console rendering features

* Umbra framework
    - nodes rendered in ascending z-order. scene hierarchy not taken into account anymore

* GeneRogue
    - new pickable and static containers : pouch, bag, satchel, map case, key ring, barrel, chests
    - drag'n drop inventory management
    - loot ui
    - you can loot creatures corpses

# 0.6.0 / 03-sep-2016
* upgraded to typescript 1.8.10, pixi 3.0.11
* switched to ES6 and ES6 modules
* replaced jake by node scripts
* unit tests can now be run with node

* Yendor toolkit
    - added noise module with simplex noise implementation + noise sample in benchmark
    - fov module no longer stores inFov information. You have to provide your own boolean[][].
      This makes it possible to use the same Yendor.Fov to compute fov from differents places.
    - more robust scheduler. Won't loop infinitely if an entity doesn't increase its wait time.

* Umbra framework
	- added basic log support

* GeneRogue
    - major refactoring for a simpler and more decoupled code. Use of promises instead of Umbra events for asynchronous tasks
    - lighting
    - new items : candle, torch, sunrod, lantern, oil flask, wall torches
	- added support for IndexedDb persistence (just replace LocalStoragePersister by IndexedDbPersister)

# 0.5.0 / 08-mar-2016
* upgraded typescript to 1.8.2, pixi to 3.0.9
* added Umbra framework for scene management, user input and events
* added widget toolkit

* Yendor toolkit
	- the Fov class does not handle the 'isWalkable' property anymore
	- added CRC32 hashing function Yendor.crc32(s: string): number

* GeneRogue
	- added doors, locks and keys

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
