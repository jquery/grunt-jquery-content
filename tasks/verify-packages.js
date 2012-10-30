module.exports = function(grunt) {

grunt.registerTask( "verify-packages", "Run this before anything else that loads local modules to verify they're installed", function() {
	var done = this.async();
	grunt.utils.spawn({
		cmd: "npm",
		args: [ "ls" ]
	}, function( err ) {
		if ( err ) {
			grunt.verbose.error();
			grunt.log.error( err );
			done();
			return;
		}
		grunt.verbose.ok();
		done();
	});
});

};
