# Introduction

yendor.ts is a [TypeScript](http://www.typescriptlang.org) toolkit for roguelike developers. It provides a true color console, a robust random number generator, a field of view toolkit, and other utilities frequently used in roguelikes.

umbra.ts is a [TypeScript](http://www.typescriptlang.org) lightweight game framework built on top of yendor.ts. It handles player input and the game scene graph.

GeneRogue is a generic roguelike loosely based on the famous [python roguelike tutorial](http://www.roguebasin.com/index.php?title=Complete_Roguelike_Tutorial,_using_python%2Blibtcod).

# Features

## yendor.ts
* fast WebGL/Canvas true color console  (using [pixi.js](http://www.pixijs.com/))
* BSP based dungeon building toolkit
* [CMWC random number generator](https://en.wikipedia.org/wiki/Multiply-with-carry#Complementary-multiply-with-carry_generators)
* field of view toolkit using [restrictive precise angle shadowcasting](http://www.roguebasin.com/index.php?title=Restrictive_Precise_Angle_Shadowcasting)
* [A* pathfinding](http://en.wikipedia.org/wiki/A*_search_algorithm) toolkit
* a scheduler to handle the order in which creatures with different speed are updated
* a simplex noise toolkit

## umbra.ts
* scene graph management
* user input management
* event bus

## GeneRogue
* multi-level procedurally generated dungeon
* key/lock puzzles
* melee combat, ranged combat, magic items and scrolls
* lighting

# Supported browsers

 * ECMAScript 6 compliant browsers (yendor/div renderer) :
 	- Edge 13+
 	- Firefox 47+
 	- Safari 9.1+
 	- Chrome 49+
 	- Opera 39+
 * For pixi renderers, check [pixi.js](http://www.pixijs.com/) documentation

# Links
* [Play GeneRogue online](http://roguecentral.org/doryen/yendor.ts/game/index.html)
* [Run the benchmark online](http://roguecentral.org/doryen/yendor.ts/game/bench.html)

# Quick Start

## pre-requisites
* install [node.js](http://nodejs.org/), at least version 6.5.0.
* install the dependencies

`npm install`

## compile and run the demo game

`npm run build:generogue`

Then open build/index.html in your browser.

## compile and run the unit tests

`npm run build:tests`

Then open build/index.html in your browser.

## compile and run the benchmark

`npm run build:benchmark`

Then open build/index.html in your browser.

# Troubleshooting

## Rendering issue / low framerate
By default, Yendor will render the screen using PIXI. PIXI will try to use a webGL renderer and fall back to a canvas based renderer if that doesn't work. Yet, if you have rendering issues, you can force the use of a specific renderer by adding the `renderer` parameter to the URL.

`http://mysite/index.html?renderer=<rendererName>`

Following renderer names are supported :
* pixi/webgl : should be the fastest except if you have broken OpenGL drivers or an old browser
* pixi/canvas : should work on not so recent browser, but not on very old browsers
* yendor/div : failsafe but slow (and ugly) classic HTML renderer

## Staled game
If the savegame gets corrupted, you might be stuck, not being able to start a new game.
You can force the start of a new game and ignore the current savegame by adding the clearsavegame parameter to the URL.

`http://mysite/index.html?clearsavegame=1`

# License

Yendor's code uses the MIT license, see our `LICENSE` file.
