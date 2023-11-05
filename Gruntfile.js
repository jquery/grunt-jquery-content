"use strict";

module.exports = function( grunt ) {
	grunt.initConfig( {
		"build-posts": {
			page: "fixture/pages/**"
		},
		"build-resources": {
			all: "fixture/resources/**"
		},
		"build-xml-entries": {
			all: "fixture/entries/**"
		},
		wordpress: {
			url: "example.org",
			username: "admin",
			password: "admin",
			dir: "test/dist/wordpress"
		}
	} );

	grunt.loadTasks( "tasks" );

	grunt.registerTask( "build", [ "build-posts", "build-resources", "build-xml-entries" ] );
};
