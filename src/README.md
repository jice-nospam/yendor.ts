This directory contains the typescript source code of yendor.ts, umbra.ts and GeneRogue.

# Directories
* decl : typescript declaration files for jquery and pixi.js
* fwk : various libraries and frameworks
    * core : base utilities
    * yendor : the yendor.ts toolkit
    * umbra : the umbra.ts framework
    * gui : an immediate widget library
    * actors : creatures and items classes
    * map : map building and rendering
* generogue : GeneRogue source code
* tests : benchmark and unit tests

# Coding rules (to be completed)
* Follow tslint rules using the provided ../lint/tslint.json configuration file.

## fields
* public field : don't create a getter and a setter
```
name type;
```

* read-only field :
```
private _name: type;
get name() { return this._name; }
```

* private field :
```
private name: type;
```

* volatile fields (should not be serialized by the persister) : begin the name with two underscores
```
__name1 type;
private __name2: type;
```

## comments
* prefix fields and methods declarations with natural doc comments using javadov delimiter /** (it's visual studio code friendly)

