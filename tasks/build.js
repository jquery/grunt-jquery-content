/*
 * grunt-jquery-content
 * https://github.com/jzaefferer/grunt-jquery-content
 *
 * Copyright (c) 2012 Jörn Zaefferer
 * Licensed under the MIT license.
 */

module.exports = function(grunt) {

function htmlEscape(text) {
	return text
		.replace(/&/g,'&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

var // modules
	fs = require( "fs" ),
	cheerio = require( "cheerio" ),
	nsh = require( "node-syntaxhighlighter" ),
	path = require( "path" );

grunt.registerMultiTask( "build-pages", "Process html files as pages, include @partials and syntax higlight code snippets", function() {
	var task = this,
		taskDone = task.async(),
		files = this.data,
		targetDir = grunt.config( "wordpress.dir" ) + "/posts/page/";

	grunt.file.mkdir( targetDir );

	grunt.utils.async.forEachSeries( files, function( fileName, fileDone ) {
		var targetFileName = targetDir + fileName.replace( /^.+?\//, "" );

		grunt.verbose.write( "Processing " + fileName + "..." );
		grunt.file.copy( fileName, targetFileName, {
			process: function( content ) {
				return content.replace(/@partial\((.+)\)/g, function(match, input) {
					return htmlEscape( grunt.file.read( input ) );
				});
			}
		});

		if ( grunt.option( "nohighlight" ) ) {
			fileDone();
			return;
		}

		grunt.verbose.write( "Syntax highlighting " + targetFileName + "..." );
		grunt.helper("syntax-highlight", {file: targetFileName, target: targetFileName}, function( error, data ) {
			if ( error ) {
				grunt.verbose.error();
				grunt.log.error( error );
				fileDone();
				return;
			}
			grunt.verbose.ok();

			grunt.file.write( targetFileName, data );

			fileDone();
		});
	}, function() {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			taskDone();
			return;
		}
		grunt.log.writeln( "Built " + files.length + " pages." );
		taskDone();
	});
});

grunt.registerMultiTask( "build-resources", "Copy resources", function() {
	var task = this,
		taskDone = task.async(),
		files = this.data,
		targetDir = grunt.config( "wordpress.dir" ) + "/resources/";

	grunt.file.mkdir( targetDir );

	grunt.utils.async.forEachSeries( files, function( fileName, fileDone )  {
		grunt.file.copy( fileName, targetDir + fileName.replace( /^.+?\//, "" ) );
		fileDone();
	}, function() {
		if ( task.errorCount ) {
			grunt.warn( "Task \"" + task.name + "\" failed." );
			taskDone();
			return;
		}
		grunt.log.writeln( "Built " + files.length + " resources." );
		taskDone();
	});
});

grunt.registerHelper("syntax-highlight", function( options, callback ) {

	// receives the innerHTML of a <code> element and if the first character
	// is an encoded left angle bracket, we'll "conclude" the "language" is html
	function crudeHTMLcheck ( input ) {
		return input.indexOf("&lt;") === 0 ? "html" : "";
	}

	var html = options.file ? grunt.file.read( options.file ) : options.cmd.stdout,
	$ = cheerio.load( html ),
	highlight = $("pre > code");
	try {
		highlight.each( function( index, el ) {
			var $t = $(this),
			code = $t.html(),
			lang = $t.attr("data-lang") || $t.attr("class") || crudeHTMLcheck( code ),
			brush = nsh.getLanguage( lang ) || nsh.getLanguage( "js" ),
			highlighted = nsh.highlight( code, brush );
			$t.parent().replaceWith( highlighted );
		});
	}
	catch ( excp ) {
		callback( excp );
		return;
	}

	callback( null, $.html() );

});

};
