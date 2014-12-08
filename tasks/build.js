module.exports = function( grunt ) {

var rimraf = require( "rimraf" ),
	wordpress = require( "grunt-wordpress" ),
	util = require( "../lib/util" ),
	syntaxHighlight = require( "../lib/highlight" ),
	mainExports = require( "../" );

// Load external tasks as local tasks
// Grunt doesn't provide an API to pass thru tasks from dependent grunt plugins
require( "grunt-wordpress/tasks/wordpress" )( grunt );
require( "grunt-check-modules/tasks/check-modules" )( grunt );

grunt.registerTask( "clean-dist", function() {
	rimraf.sync( "dist" );
});

// Define an empty lint task, to be redefined by each site with relevant lint tasks
grunt.registerTask( "lint", [] );

grunt.registerTask( "build-wordpress", [ "check-modules", "lint", "clean-dist", "build" ] );

grunt.registerMultiTask( "build-posts", "Process html and markdown files as posts", function() {
	var task = this,
		taskDone = task.async(),
		wordpressClient = wordpress.createClient( grunt.config( "wordpress" ) ),
		postType = this.target,
		preprocessor = mainExports.postPreprocessors[ postType ] ||
			mainExports.postPreprocessors._default,
		targetDir = grunt.config( "wordpress.dir" ) + "/posts/" + postType + "/";

	grunt.file.mkdir( targetDir );

	function parsePost( fileName, callback ) {
		wordpressClient.parsePost( fileName, function( error, post ) {
			if ( error ) {
				return callback( error );
			}

			preprocessor( post, fileName, callback );
		});
	}

	util.eachFile( this.filesSrc, function( fileName, fileDone ) {
		grunt.verbose.write( "Processing " + fileName + "..." );

		parsePost( fileName, function( error, post ) {
			if ( error ) {
				return fileDone( error );
			}

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
				});
				delete post.noHeadingLinks;
				delete post.toc;
			}

			// Replace partials
			content = content.replace( /@partial\((.+)\)/g, function( match, input ) {
				return util.htmlEscape( grunt.file.read( input ) );
			});

			// Syntax highlight code blocks
			if ( !grunt.option( "nohighlight" ) ) {
				content = syntaxHighlight( content );
			}

			post.customFields = post.customFields || [];
			post.customFields.push({
				key: "source_path",
				value: fileName
			});

			// Write file
			grunt.file.write( targetFileName,
				"<script>" + JSON.stringify( post ) + "</script>\n" + content );

			fileDone();
		});
	}, function( error, count ) {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			return taskDone();
		}

		grunt.log.writeln( "Built " + count + " pages." );
		taskDone();
	});
});

grunt.registerMultiTask( "build-resources", "Copy resources", function() {
	var task = this,
		taskDone = task.async(),
		targetDir = grunt.config( "wordpress.dir" ) + "/resources/";

	grunt.file.mkdir( targetDir );

	util.eachFile( this.filesSrc, function( fileName, fileDone ) {
		if ( grunt.file.isFile( fileName ) ) {
			grunt.file.copy( fileName, targetDir + fileName.replace( /^.+?\//, "" ) );
		}
		fileDone();
	}, function( error, count ) {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			return taskDone();
		}

		grunt.log.writeln( "Built " + count + " resources." );
		taskDone();
	});
});

};
