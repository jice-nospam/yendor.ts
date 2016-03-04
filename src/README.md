This directory contains the typescript source code of yendor.ts, umbra.ts, gizmo.ts and GeneRogue.
This code can be compiled into ../game/main.js using jake.

# Directories
* decl : typescript declaration files for jquery and pixi.js
* core : base utilities
* yendor : the yendor.ts toolkit
* umbra : the umbra.ts framework
* gizmo : the gizmo.ts widget library
* game : GeneRogue source code
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
private _name type;
get name() { return this._name; }
```

* private field :
```
private name type;
```

* volatile fields (should not be serialized by the persister) : begin the name with two underscores 
```
__name1 type;
private __name2 type;
```


