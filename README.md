# Introduction

Yendor.ts is a [TypeScript](http://www.typescriptlang.org) API for roguelike developers. It provides a true color console, a robust random number generator, a field of view toolkit, and other utilities frequently used in roguelikes.

It comes with a simple generic roguelike game to extend. 

# Features

* fast WebGL/Canvas true color console  (using [pixi.js](http://www.pixijs.com/))
* BSP based dungeon building toolkit
* [CMWC random number generator](https://en.wikipedia.org/wiki/Multiply-with-carry#Complementary-multiply-with-carry_generators)
* field of view toolkit using [restrictive precise angle shadowcasting](http://www.roguebasin.com/index.php?title=Restrictive_Precise_Angle_Shadowcasting)

# Quick Start

## pre-requisites
* install [node.js](http://nodejs.org/)
* install [TypeScript](http://www.typescriptlang.org/) 

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

# Documents

# Community

# License

Yendor's code uses the MIT license, see our `LICENSE` file.
