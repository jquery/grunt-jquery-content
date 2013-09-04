module.exports = function( grunt ) {
"use strict";

var fs = require( "fs" ),
	path = require( "path" ),
	which = require( "which" );

function checkLibxml2( executable ) {
	try {
		which.sync( executable );
	} catch( error ) {
		grunt.log.error( "Missing executable: " + executable + "." );
		grunt.log.error( "You must install libxml2." );
		grunt.log.error( "Downloads are available from http://www.xmlsoft.org/downloads.html" );
		return false;
	}

	return true;
}

function checkXmllint() {
	return checkLibxml2( "xmllint" );
}

function checkXsltproc() {
	return checkLibxml2( "xsltproc" );
}

grunt.registerMultiTask( "xmllint", "Lint xml files", function() {
	var task = this,
		taskDone = task.async(),
		files = this.data;

	if ( !checkXmllint() ) {
		taskDone( false );
	}

	grunt.utils.async.forEachSeries( this.data, function( fileName, fileDone ) {
		grunt.verbose.write( "Linting " + fileName + "..." );
		grunt.utils.spawn({
			cmd: "xmllint",
			args: [ "--noout", fileName ]
		}, function( error ) {
			if ( error ) {
				grunt.verbose.error();
				grunt.log.error( error );
				fileDone();
				return;
			}
			grunt.verbose.ok();
			fileDone();
		});
	}, function() {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			taskDone();
			return;
		}
		grunt.log.writeln( "Lint free files: " + files.length );
		taskDone();
	});
});

grunt.registerMultiTask( "xmltidy", "Tidy xml files - changes source files!", function() {
	var task = this,
		taskDone = task.async(),
		files = this.data;

	// Only tidy files that are lint free
	task.requires( "xmllint" );

	if ( !checkXmllint() ) {
		taskDone( false );
	}

	grunt.utils.async.forEachSeries( files, function( fileName, fileDone )  {
		grunt.verbose.write( "Tidying " + fileName + "..." );
		grunt.utils.spawn({
			cmd: "xmllint",
			args: [ "--format", fileName ]
		}, function( err, result ) {
			if ( err ) {
				grunt.verbose.error();
				grunt.log.error( err );
				fileDone();
				return;
			}
			grunt.verbose.ok();

			grunt.file.write( fileName, result );

			fileDone();
		});
	}, function() {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			taskDone();
			return;
		}
		grunt.log.writeln( "Tidied " + files.length + " files." );
		taskDone();
	});
});

grunt.registerMultiTask( "build-xml-entries", "Process API xml files with xsl and syntax highlight", function() {
	var task = this,
		taskDone = task.async(),
		files = this.data,
		targetDir = grunt.config( "wordpress.dir" ) + "/posts/post/";

	if ( !checkXsltproc() ) {
		taskDone( false );
	}

	grunt.file.mkdir( targetDir );

	grunt.utils.async.forEachSeries( files, function( fileName, fileDone ) {
		grunt.verbose.write( "Transforming " + fileName + "..." );
		grunt.utils.spawn({
			cmd: "xsltproc",
			args: [ "--xinclude", "entries2html.xsl", fileName ]
		}, function( err, content ) {
			if ( err ) {
				grunt.verbose.error();
				grunt.log.error( err );
				fileDone();
				return;
			}
			grunt.verbose.ok();

			var targetFileName = targetDir + path.basename( fileName, ".xml" ) + ".html";

			// Syntax highlight code blocks
			if ( !grunt.option( "nohighlight" ) ) {
				content = grunt.helper( "syntax-highlight", { content: content } );
			}

			grunt.file.write( targetFileName, content );
			fileDone();
		});
	}, function() {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			taskDone();
			return;
		}

		grunt.log.writeln( "Built " + files.length + " entries." );
		taskDone();
	});
});

grunt.registerTask( "build-xml-categories", function() {
	var taskDone = this.async(),
		targetPath = grunt.config( "wordpress.dir" ) + "/taxonomies.json";

	if ( !checkXsltproc() ) {
		taskDone( false );
	}

	grunt.utils.spawn({
		cmd: "xsltproc",
		args: [ "--output", "taxonomies.xml",
			grunt.task.getFile( "jquery-xml/cat2tax.xsl" ), "categories.xml" ]
	}, function( error ) {
		if ( error ) {
			grunt.verbose.error();
			grunt.log.error( error );
			taskDone();
			return;
		}

		grunt.utils.spawn({
			cmd: "xsltproc",
			args: [ "--output", targetPath,
				grunt.task.getFile( "jquery-xml/xml2json.xsl" ), "taxonomies.xml" ]
		}, function( error ) {
			var taxonomies;

			if ( error ) {
				grunt.verbose.error();
				grunt.log.error( error );
				taskDone();
				return;
			}

			// Syntax highlight code blocks
			function highlightDescription( category ) {
				if ( category.description ) {
					category.description = grunt.helper( "syntax-highlight",
						{ content: category.description } );
				}
			}

			function highlightCategories( categories ) {
				categories.forEach(function( category ) {
					highlightDescription( category );
					if ( category.children ) {
						highlightCategories( category.children );
					}
				});
			}

			if ( !grunt.option( "nohighlight" ) ) {
				taxonomies = grunt.file.readJSON( targetPath );
				highlightCategories( taxonomies.category );
				grunt.file.write( targetPath, JSON.stringify( taxonomies ) );
			}

			fs.unlinkSync( "taxonomies.xml" );
			grunt.verbose.ok();
			taskDone();
		});
	});
});

grunt.registerTask( "build-xml-full", function() {
	var taskDone = this.async();

	if ( !checkXsltproc() ) {
		taskDone( false );
	}

	grunt.file.copy( grunt.task.getFile( "jquery-xml/all-entries.xml" ), "all-entries.xml", {
		process: function( content ) {
			return content.replace( "<!--entries-->",
				grunt.file.expandFiles( "entries/*.xml" ).map(function( entry ) {
					return "<entry file=\"" + entry + "\"/>";
				}).join( "\n" ) );
		}
	});

	grunt.utils.spawn({
		cmd: "xsltproc",
		args: [ "--xinclude", "--path", process.cwd(),
			// "--output", grunt.config( "wordpress.dir" ) + "/resources/api.xml",
			grunt.task.getFile( "jquery-xml/all-entries.xsl" ), "all-entries.xml" ]
	}, function( err, result ) {
		// For some reason using --output with xsltproc kills the --xinclude option,
		// so we let it write to stdout, then save it to a file
		grunt.file.write( grunt.config( "wordpress.dir" ) + "/resources/api.xml", result );
		fs.unlinkSync( "all-entries.xml" );

		if ( err ) {
			grunt.verbose.error();
			grunt.log.error( err );
			taskDone( false );
			return;
		}

		taskDone();
	});
});

};
