module.exports = function(grunt) {

var // modules
	fs = require( "fs" ),
	path = require( "path" ),
	rimraf = require( "rimraf" ),
	spawn = require( "child_process" ).spawn;

grunt.registerMultiTask( "xmllint", "Lint xml files", function() {
	var task = this,
		taskDone = task.async(),
		files = this.data;
	grunt.utils.async.forEachSeries( this.data, function( fileName, fileDone ) {
		grunt.verbose.write( "Linting " + fileName + "..." );
		grunt.utils.spawn({
			cmd: "xmllint",
			args: [ "--noout", fileName ]
		}, function( err, result ) {
			if ( err ) {
				grunt.verbose.error();
				grunt.log.error( err );
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
		// TODO make `entry` a custom post type instead of (ab)using `post`?
		targetDir = grunt.config( "wordpress.dir" ) + "/posts/post/";

	grunt.file.mkdir( targetDir );

	grunt.utils.async.forEachSeries( files, function( fileName, fileDone ) {
		grunt.verbose.write( "Transforming (pass 1: preproc-xinclude.xsl) " + fileName + "..." );
		grunt.utils.spawn({
			cmd: "xsltproc",
			args: [ "preproc-xinclude.xsl", fileName ]
		}, function( err, pass1result ) {
			if ( err ) {
				grunt.verbose.error();
				grunt.log.error( err );
				fileDone();
				return;
			}
			grunt.verbose.ok();

			var targetXMLFileName = "entries_tmp/" + path.basename( fileName );

			grunt.file.write( targetXMLFileName, pass1result );

			grunt.verbose.write( "Transforming (pass 2: entries2html.xsl) " + fileName + "..." );
			grunt.utils.spawn({
				cmd: "xsltproc",
				args: [ "--xinclude", "entries2html.xsl", targetXMLFileName ]
			}, function( err, content ) {
				if ( err ) {
					grunt.verbose.error();
					grunt.log.error( err );
					fileDone();
					return;
				}
				grunt.verbose.ok();

				var targetHTMLFileName = targetDir + path.basename( fileName );
				targetHTMLFileName = targetHTMLFileName.substr( 0, targetHTMLFileName.length - "xml".length ) + "html";


				// Syntax highlight code blocks
				if ( !grunt.option( "nohighlight" ) ) {
					content = grunt.helper( "syntax-highlight", { content: content } );
				}

				grunt.file.write( targetHTMLFileName, content );

				fileDone();
			});
		});
	}, function() {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			taskDone();
			return;
		}
		rimraf.sync( "entries_tmp" );
		grunt.log.writeln( "Built " + files.length + " entries." );
		taskDone();
	});
});

grunt.registerTask( "build-xml-categories", function() {
	var task = this,
		taskDone = task.async(),
		categories = {},
		outFilename = grunt.config( "wordpress.dir" ) + "/taxonomies.json";

		grunt.utils.spawn({
			cmd: "xsltproc",
			args: [ "--output", "taxonomies.xml", "cat2tax.xsl", "categories.xml" ]
		}, function( err, result ) {
			if ( err ) {
				grunt.verbose.error();
				grunt.log.error( err );
				taskDone();
				return;
			}
			grunt.utils.spawn({
				cmd: "xsltproc",
				args: [ "--output", outFilename, "xml2json.xsl", "taxonomies.xml" ]
			}, function( err, result ) {
			if ( err ) {
				grunt.verbose.error();
				grunt.log.error( err );
				taskDone();
				return;
			}
			fs.unlinkSync( "taxonomies.xml" );
			grunt.verbose.ok();
			taskDone();
		});
	});
});

};
