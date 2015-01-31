This directory contains the source code of GeneRogue, a generic roguelike loosely based on the famous [python roguelike tutorial](http://www.roguebasin.com/index.php?title=Complete_Roguelike_Tutorial,_using_python%2Blibtcod).

The goal of Generogue is not to provide a real, balanced game, but a shell with all the required features to build a real game. Eventually, you might be able to create a game by adding new items, effects, creatures, A.I. without having to mess with the core mechanisms.

The name `GeneRogue` is a reference to Kornel Kisielewicz's mammoth [GenRogue project](http://www.roguebasin.com/index.php?title=GenRogue). Even if it was never released, it has been a major source of inspiration.

To compile it, run `jake` then open game/index.html in your browser.

# Controls

* movement / melee attack

>     arrows          numpad          vi
>        ^            7  8  9        y  k  u
>      <   >          4     6        h     l
>        v            1  2  3        b  j  n

* NUMPAD 5 / space : wait a turn
* g : pick an item up
* i : use an item from your inventory
* d : drop an item from your inventory
* t : throw an item
* f : fire a projectile using an equipped ranged weapon
* z : zap an equipped magic wand or staff
* e : activate an adjacent mechanism (lever, torch, door, ...)
* > : go down the stairs
* < : go up the stairs
* ESC : open game menu

# TODO

Reminder for stuff that might be added to the game. Or not.

* Engine
	- reduce garbage collector usage

* Gameplay
	- beast A.I. should move randomly when no scent is detected
	- humanoid A.I. (can use weapons and wear armors)
	- poison potion and weapon / projectile poisoning (need onHitEffector on Attacker)
	- doors and keys
	- armors
	- lighting
	- spells and spellbooks
	- gems and weapons/armors slots
	- static containers (chests, corpses) + loot GUI
	- jewelry (necklace, rings)
	- shield should block only one hit per turn
	- dual wielding (you attack with the fastest weapon first, then with the slowest one. Total waitTime is smaller than the sum of the weapons waitTimes. watch out for special cases like crossbow + sword)

* Eye candy
	- background animation (torch flickering)
	- end of turn animation (flying arrows, explosions, ...)
	- blood stains
