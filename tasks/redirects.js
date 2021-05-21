"use strict";

module.exports = function( grunt ) {

const wp = require( "wordpress" );

grunt.registerTask( "deploy-redirects", function() {
	const config = grunt.config( "wordpress" );
	const redirects = grunt.file.exists( "redirects.json" ) ?
		grunt.file.readJSON( "redirects.json" ) :
		{};
	const client = wp.createClient( config );

	client.authenticatedCall( "jq.setRedirects", JSON.stringify( redirects ), this.async() );
} );

grunt.registerTask( "deploy", [ "wordpress-deploy", "deploy-redirects" ] );

};
