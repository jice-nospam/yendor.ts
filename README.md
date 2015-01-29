# Introduction

Yendor.ts is a [TypeScript](http://www.typescriptlang.org) API for roguelike developers. It provides a true color console, a robust random number generator, a field of view toolkit, and other utilities frequently used in roguelikes.

It comes with a simple generic roguelike game to extend and a benchmark showcasing some features. 

# Features

* fast WebGL/Canvas true color console  (using [pixi.js](http://www.pixijs.com/))
* BSP based dungeon building toolkit
* [CMWC random number generator](https://en.wikipedia.org/wiki/Multiply-with-carry#Complementary-multiply-with-carry_generators)
* field of view toolkit using [restrictive precise angle shadowcasting](http://www.roguebasin.com/index.php?title=Restrictive_Precise_Angle_Shadowcasting)
* [A* pathfinding](http://en.wikipedia.org/wiki/A*_search_algorithm) toolkit
* a scheduler to handle the order in which creatures with different speed are updated

# Supported browsers

 * ECMAScript 5 compliant browsers (yendor/div renderer) :
 	- Internet Explorer 9+
 	- Firefox 4+
 	- Safari 6+
 	- Chrome 23+
 	- Opera 15+
 * For pixi renderers, check [pixi.js](http://www.pixijs.com/) documentation

# Links
* [yendor.ts documentation](http://roguecentral.org/doryen/yendor.ts/doc/yendor/index.html)
* [GeneRogue documentation](http://roguecentral.org/doryen/yendor.ts/doc/game/index.html)
* [Play GeneRogue online](http://roguecentral.org/doryen/yendor.ts/game/index.html)
* [Run the benchmark online](http://roguecentral.org/doryen/yendor.ts/bench/index.html)

# Quick Start

## pre-requisites
* install [node.js](http://nodejs.org/)
* install [TypeScript](http://www.typescriptlang.org/) (version 1.4+ required)

`npm install -g typescript`

* install [jake](https://github.com/mde/jake)

`npm install -g jake`

## compile and run the demo game

`jake`

Then open game/index.html in your favorite browser.

## compile and run the unit tests

`jake tests`

Then open game/index.html in your favorite browser.

## compile and run the benchmark

`jake benchmark`

Then open game/index.html in your favorite browser.

# Troubleshooting

By default, Yendor will render the screen using PIXI. PIXI will try to use a webGL renderer and fall back to a canvas based renderer if that doesn't work. Yet, if you have rendering issues, you can force the use of a specific renderer by adding the `renderer` parameter to the URL.

`http://mysite/index.html?renderer=<rendererName>`

Following renderer names are supported :
* pixi/webgl : should be the fastest except if you have broken OpenGL drivers or an old browser
* pixi/canvas : should work on not so recent browser, but not on very old browsers
* yendor/div : failsafe but slow classic HTML renderer

# License

Yendor's code uses the MIT license, see our `LICENSE` file.
