var TSC_COMMAND='tsc --target ES5 --sourceMap --noImplicitReturns';
var RM_COMMAND='rm -f';
//var NATURALDOCS_COMMAND='perl ../naturaldocs/NaturalDocs';
var NATURALDOCS_COMMAND='naturaldocs';
var UGLIFY_COMMAND='uglifyjs'


task( 'default', ['prod'] );

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

task( 'prod', function(params) {
	runCommand(TSC_COMMAND+' --out game/main.dev.js src/game/main.ts');
    runCommand(UGLIFY_COMMAND+' game/main.dev.js -o game/main.js');
} );

task( 'dev', function(params) {
	runCommand(TSC_COMMAND+' --out game/main.js src/game/main.ts');
} );

task( 'clean', function(params) {
  runCommand(RM_COMMAND+' game/main.js');
});

task( 'tests', function(params) {
  runCommand(TSC_COMMAND+' --out game/main.js src/tests/main.ts');
});

task( 'benchmark', function(params) {
  runCommand(TSC_COMMAND+' --out game/main.dev.js src/tests/bench.ts');
  runCommand(UGLIFY_COMMAND+' game/main.dev.js -o game/main.js');
});

task( 'doc', function(params) {
  runCommand(NATURALDOCS_COMMAND+' -i src/yendor -o HTML doc/yendor -p doc/yendor/config/');
  runCommand(NATURALDOCS_COMMAND+' -i src/umbra -o HTML doc/umbra -p doc/umbra/config/');
  runCommand(NATURALDOCS_COMMAND+' -i src/gizmo -o HTML doc/gizmo -p doc/gizmo/config/');
  runCommand(NATURALDOCS_COMMAND+' -i src/game -o HTML doc/game -p doc/game/config/');
});