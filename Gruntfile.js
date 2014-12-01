module.exports = function( grunt ) {

grunt.loadNpmTasks( "grunt-contrib-jshint" );

grunt.initConfig({
	watch: {
		files: "<config:lint.files>",
		tasks: "default"
	},
	jshint: {
		options: {
			jshintrc: true
		},
		files: [ "Gruntfile.js", "tasks/**/*.js" ]
	}
});

grunt.registerTask( "default", "jshint" );

};
