module.exports = function( grunt ) {

var fs = require( "fs" ),
	path = require( "path" ),
	which = require( "which" ),
	spawn = require( "spawnback" ),
	util = require( "../lib/util" ),
	syntaxHighlight = require( "../lib/highlight" );

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
		taskDone = task.async();

	if ( !checkXmllint() ) {
		return taskDone( false );
	}

	util.eachFile( this.filesSrc, function( fileName, fileDone ) {
		grunt.verbose.write( "Linting " + fileName + "..." );
		spawn( "xmllint", [ "--noout", fileName ], function( error ) {
			if ( error ) {
				grunt.verbose.error();
				grunt.log.error( error );
				return fileDone();
			}

			grunt.verbose.ok();
			fileDone();
		});
	}, function( error, count ) {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			return taskDone();
		}

		grunt.log.writeln( "Lint free files: " + count );
		taskDone();
	});
});

grunt.registerMultiTask( "build-xml-entries", "Process API xml files with xsl and syntax highlight", function() {
	var task = this,
		taskDone = task.async(),
		targetDir = grunt.config( "wordpress.dir" ) + "/posts/post/";

	if ( !checkXsltproc() ) {
		return taskDone( false );
	}

	grunt.file.mkdir( targetDir );

	util.eachFile( this.filesSrc, function( fileName, fileDone ) {
		grunt.verbose.write( "Transforming " + fileName + "..." );
		spawn( "xsltproc",
			[ "--xinclude", "entries2html.xsl", fileName ],
		function( error, content, stderr ) {

			// Certain errors won't cause the tranform to fail. For example, a
			// broken include will write to stderr, but still exit cleanly.
			if ( stderr && !error ) {
				error = new Error( stderr );
			}

			if ( error ) {
				grunt.verbose.error();
				grunt.log.error( error );
				return fileDone( error );
			}

			grunt.verbose.ok();

			var targetFileName = targetDir + path.basename( fileName, ".xml" ) + ".html";

			// Syntax highlight code blocks
			if ( !grunt.option( "nohighlight" ) ) {
				content = syntaxHighlight( content );
			}

			grunt.file.write( targetFileName, content );
			fileDone();
		});
	}, function( error, count ) {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			return taskDone();
		}

		grunt.log.writeln( "Built " + count + " entries." );
		taskDone();
	});
});

grunt.registerTask( "build-xml-categories", function() {
	var taskDone = this.async(),
		targetPath = grunt.config( "wordpress.dir" ) + "/taxonomies.json";

	if ( !checkXsltproc() ) {
		return taskDone( false );
	}

	spawn( "xsltproc",
		[ "--output", "taxonomies.xml",
			path.join( __dirname, "jquery-xml/cat2tax.xsl" ), "categories.xml" ],
	function( error ) {
		if ( error ) {
			grunt.verbose.error();
			grunt.log.error( error );
			return taskDone();
		}

		spawn( "xsltproc",
			[ "--output", targetPath,
				path.join( __dirname, "jquery-xml/xml2json.xsl" ), "taxonomies.xml" ],
		function( error ) {
			if ( error ) {
				grunt.verbose.error();
				grunt.log.error( error );
				return taskDone();
			}

			// xml2json can't determine when to use an array if there is only one child,
			// so we need to ensure all child terms are stored in an array
			var taxonomies = grunt.file.readJSON( targetPath );
			function normalize( term ) {
				if ( term.children && term.children.item ) {
					term.children = [ term.children.item ];
				}

				if ( term.children ) {
					term.children.forEach( normalize );
				}
			}
			taxonomies.category.forEach( normalize );
			grunt.file.write( targetPath, JSON.stringify( taxonomies ) );

			// Syntax highlight code blocks
			function highlightDescription( category ) {
				if ( category.description ) {
					category.description = syntaxHighlight( category.description );
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
		return taskDone( false );
	}

	grunt.file.copy( path.join( __dirname, "jquery-xml/all-entries.xml" ), "all-entries.xml", {
		process: function( content ) {
			return content.replace( "<!--entries-->",
				grunt.file.expand( "entries/*.xml" ).map(function( entry ) {
					return "<entry file=\"" + entry + "\"/>";
				}).join( "\n" ) );
		}
	});

	spawn( "xsltproc",
		[ "--xinclude", "--path", process.cwd(),
			// "--output", grunt.config( "wordpress.dir" ) + "/resources/api.xml",
			path.join( __dirname, "jquery-xml/all-entries.xsl" ), "all-entries.xml" ],
	function( error, result ) {

		// For some reason using --output with xsltproc kills the --xinclude option,
		// so we let it write to stdout, then save it to a file
		grunt.file.write( grunt.config( "wordpress.dir" ) + "/resources/api.xml", result );
		fs.unlinkSync( "all-entries.xml" );

		if ( error ) {
			grunt.verbose.error();
			grunt.log.error( error );
			return taskDone( false );
		}

		taskDone();
	});
});

};
