var TSC_COMMAND='tsc --target ES5 --noImplicitReturns';
var RM_COMMAND='rm -f';
//var NATURALDOCS_COMMAND='perl ../naturaldocs/NaturalDocs';
var NATURALDOCS_COMMAND='naturaldocs';


task( 'default', ['compile'] );

function runCommand(cmd) {
	var ex = jake.createExec([cmd]);
	ex.addListener("stdout", function(output) {
            process.stdout.write(output);
        });
    ex.addListener("stderr", function(error) {
        process.stderr.write(error);
    });
    ex.run();	
}

task( 'compile', function(params) {
	runCommand(TSC_COMMAND+' --out game/main.js src/game/main.ts');
} );

task( 'clean', function(params) {
  runCommand(RM_COMMAND+' game/main.js');
});

task( 'tests', function(params) {
  runCommand(TSC_COMMAND+' --out game/main.js src/tests/main.ts');
});

task( 'benchmark', function(params) {
  runCommand(TSC_COMMAND+' --out game/main.js src/tests/bench.ts');
});

task( 'doc', function(params) {
  runCommand(NATURALDOCS_COMMAND+' -i src/yendor -o HTML doc/yendor -p doc/yendor/config/');
  runCommand(NATURALDOCS_COMMAND+' -i src/game -o HTML doc/game -p doc/game/config/');
});