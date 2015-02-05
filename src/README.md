This directory contains the typescript source code of yendor.ts and the generogue game shell.
This code can be compiled into ../game/main.js using jake.

# Directories
* decl : typescript declaration files for jquery and pixi.js
* game : generogue source code
* tests : benchmark and unit tests
* yendor : the yendor.ts library

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


