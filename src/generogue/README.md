# GeneRogue - a full featured game shell
This directory contains the source code of GeneRogue, a generic roguelike loosely based on the famous [python roguelike tutorial](http://www.roguebasin.com/index.php?title=Complete_Roguelike_Tutorial,_using_python%2Blibtcod).

The goal of Generogue is not to provide a real, balanced game, but a shell with all the required features to build a real game. Eventually, you might be able to create a game by adding new items, effects, creatures, A.I. without having to mess with the core mechanisms.

The name `GeneRogue` is a reference to Kornel Kisielewicz's mammoth [GenRogue project](http://www.roguebasin.com/index.php?title=GenRogue). Even if it was never released, it has been a major source of inspiration.

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
* e : activate an adjacent mechanism (lever, torch, door, or use a stair...). You can also unlock/open a door by bumping on it.
* ESC : open game menu
* look with mouse. UI also works with mouse

# WORK IN PROGRESS

# TODO

Reminder for stuff that might be added to the game. Or not.
* Bugs
    - player can move while inventory is open
    - monster AI does not wake up in darkness
    - monsters don't see the player's light
    - cannot take a candle with right hand

* Engine
    - reduce garbage collector usage
    - clean usage of constructors/onInit
    - rewrite Core.Color using faster tuple [r,g,b] format
    - rewrite Core.Position using faster tuple [x,y] format

* Gameplay
    - item durability
        - grinding stone
        - being able to break certain doors
    - fire
        - fire effect on items : fireball + dropped torchs should burn scrolls, wooden items
        - fire 'item' : fireball should leave fire on ground for some time
        - burning condition : caused by walking in fire / fireballs / hitting with a torch (melee or throw)
    - map building
        - multi-keys locks
        - remove monsters from dungeon's first room
    - A.I.
        - beast A.I. should move randomly when no scent is detected
        - orcs should have humanoid A.I. (can open door, use equipment)
        - humanoid A.I. (can use weapons and wear armors)
    - item conditions
        - poison potion and weapon / projectile poisoning (need onHitEffector on Attacker)
        - oil improve blades damages
    - light
        - radius should decrease and intensity variation increase before a candle/torch is consumed
    - items
        - armors
        - 'any hand' slot
        - spells and spellbooks
        - gems and weapons/armors slots
        - static containers (chests, corpses) + loot GUI
        - pickable containers to organize inventory (bags, quiver, scroll book, key ring, ...)
        - jewelry (necklace, rings)
    - player character
        - new XP level : being able to increase some stat (health, inventory, ...)
        - implement classical DEX/INT/CON/CHA/WIS stats
    - magic
        - scroll of floating light
    - combat
        - critical hits
        - dodge + parry
        - shield should block only one hit per turn
        - dual wielding (you attack with the fastest weapon first, then with the slowest one. Total waitTime is smaller than the sum of the weapons waitTimes. watch out for special cases like crossbow + sword)

* Eye candy
    - end of turn animation (flying arrows, explosions, ...)
    - blood stains
    - foot steps
