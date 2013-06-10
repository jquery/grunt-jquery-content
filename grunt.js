module.exports = function( grunt ) {
"use strict";

grunt.initConfig({
	lint: {
		files: [ "grunt.js", "tasks/**/*.js" ]
	},
	watch: {
		files: "<config:lint.files>",
		tasks: "default"
	},
	jshint: {
		options: {
			boss: true,
			curly: true,
			eqeqeq: true,
			eqnull: true,
			expr: true,
			immed: true,
			noarg: true,
			onevar: true,
			quotmark: "double",
			smarttabs: true,
			trailing: true,
			undef: true,
			unused: true,

			node: true
		}
	}
});

grunt.loadTasks( "tasks" );
grunt.registerTask( "default", "lint" );

};
