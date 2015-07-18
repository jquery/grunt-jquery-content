module.exports = function( grunt ) {

var wp = require( "wordpress" );

grunt.registerTask( "deploy-redirects", function() {
	var config = grunt.config( "wordpress" );
	var redirects = grunt.file.exists( "redirects.json" ) ? grunt.file.readJSON( "redirects.json" ) : {};
	var client = wp.createClient( config );

	client.authenticatedCall( "jq.setRedirects", JSON.stringify( redirects ), this.async() );
} );

grunt.registerTask( "deploy", [ "wordpress-deploy", "deploy-redirects" ] );

};
