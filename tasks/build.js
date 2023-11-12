"use strict";

module.exports = function( grunt ) {

const fs = require( "fs" );
const wordpress = require( "gilded-wordpress" );
const util = require( "../lib/util" );
const syntaxHighlight = require( "../lib/highlight" );
const mainExports = require( "../" );

// Load external tasks as local tasks
// Grunt doesn't provide an API to pass thru tasks from dependent grunt plugins
require( "grunt-check-modules/tasks/check-modules" )( grunt );

grunt.registerTask( "clean-dist", function() {
	fs.rmSync( "dist", { recursive: true, force: true } );
} );

// Define an empty lint task, to be redefined by each site with relevant lint tasks
grunt.registerTask( "lint", [] );

grunt.registerTask( "build-wordpress", [ "check-modules", "lint", "clean-dist", "build" ] );

grunt.registerMultiTask( "build-posts",
	"Process html and markdown files as posts", async function() {
	var task = this,
		taskDone = task.async(),
		wordpressClient = wordpress.createClient( grunt.config( "wordpress" ) ),
		postType = this.target,
		preprocessor = mainExports.postPreprocessors[ postType ] ||
			mainExports.postPreprocessors._default,
		targetDir = grunt.config( "wordpress.dir" ) + "/posts/" + postType + "/";

	grunt.file.mkdir( targetDir );

	async function parsePost( fileName ) {
		return new Promise( function( resolve, reject ) {
			wordpressClient.parsePost( fileName, function( error, post ) {
				if ( error ) {
					return reject( error );
				}

				preprocessor( post, fileName, function( err, res ) {
					if ( error ) {
						return reject( err );
					}
					resolve( res );
				} );
			} );
		} );
	}

	var count = 0;
	async function processFile( fileName ) {
		count++;
		grunt.verbose.write( "Processing " + fileName + "..." );

		const post = await parsePost( fileName );

		var content = post.content,
			fileType = /\.(\w+)$/.exec( fileName )[ 1 ],
			targetFileName = targetDir +
				( post.fileName || fileName.replace( /^.+?\/(.+)\.\w+$/, "$1" ) + ".html" );

		delete post.content;
		delete post.fileName;

		// Convert markdown to HTML
		if ( fileType === "md" ) {
			content = util.parseMarkdown( content, {
				generateLinks: post.toc || !post.noHeadingLinks,
				generateToc: post.toc
			} );
			delete post.noHeadingLinks;
			delete post.toc;
		}

		// Replace partials
		content = content.replace( /@partial\((.+)\)/g, function( _match, input ) {
			return util.htmlEscape( grunt.file.read( input ) );
		} );

		// Syntax highlight code blocks
		if ( !grunt.option( "nohighlight" ) ) {
			content = syntaxHighlight( content );
		}

		post.customFields = post.customFields || [];
		post.customFields.push( {
			key: "source_path",
			value: fileName
		} );

		// Write file
		grunt.file.write( targetFileName,
			"<script>" + JSON.stringify( post ) + "</script>\n" + content );
	}

	try {
		await util.eachFile( this.filesSrc, processFile );
	} catch ( e ) {
		grunt.warn( "Task \"" + task.name + "\" failed." );
		return taskDone();
	}

	grunt.log.writeln( "Built " + count + " pages." );
	taskDone();
} );

grunt.registerMultiTask( "build-resources", "Copy resources", function() {
	var task = this,
		taskDone = task.async(),
		targetDir = grunt.config( "wordpress.dir" ) + "/resources/";

	grunt.file.mkdir( targetDir );

	var count = 0;
	try {
		for ( const fileName of this.filesSrc ) {
			if ( grunt.file.isFile( fileName ) ) {
				grunt.file.copy( fileName, targetDir + fileName.replace( /^.+?\//, "" ) );
				count++;
			}
		}
	} catch ( e ) {
		grunt.warn( "Task \"" + task.name + "\" failed." );
		return taskDone();
	}

	grunt.log.writeln( "Built " + count + " resources." );
	taskDone();
} );

};
