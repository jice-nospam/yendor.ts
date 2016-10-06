This directory contains the typescript source code of yendor.ts, umbra.ts and GeneRogue.

# Directories
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
public name type;
```

* read-only field :
```
public readonly name: type;
```

* private field :
```
private name: type;
```

* volatile fields (should not be serialized by the persister) : begin the name with two underscores
```
public __name1 type;
private __name2: type;
```

## comments
* prefix fields and methods declarations with natural doc comments using javadov delimiter /** (it's visual studio code friendly)

## enums
* name should end with Enum
* use const enums wherever possible
* always start at value 1 to enable safe truthy checks
```
const enum MyEnum {
    VALUE1 = 1,
    VALUE2,
    VALUE3
}
```

## array iteration
* if you know you're dealing with a real array and it's not undefined, use for..of
```
for (let item of myArray) { ... }
```

* else use the classic loop
```
for (let i:number = 0, len: number = myArray ? myArray.length : 0; i < len; ++i) { ... }
```
