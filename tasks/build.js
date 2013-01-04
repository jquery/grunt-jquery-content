module.exports = function(grunt) {
"use strict";

function htmlEscape(text) {
	return text
		// supports keeping markup in source file, but drop from inline sample
		.replace(/<!-- @placeholder-start\((.+)\) -->[\s\S]+@placeholder-end -->/g, function(match, input) {
			return "<-- " + input + " -->";
		})
		.replace(/&/g,'&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&#039;');
}

var // modules
	fs = require( "fs" ),
	cheerio = require( "cheerio" ),
	hljs = require( "highlight.js" ),
	path = require( "path" ),
	ent = require( "ent" ),
	yaml = require( "js-yaml" );

// Add a wrapper around wordpress-parse-post that supports YAML
grunt.registerHelper( "wordpress-parse-post-flex", function( path ) {
	var index,
		post = {},
		content = grunt.file.read( path );

	// Check for YAML metadata
	if ( content.substring( 0, 4 ) === "---\n" ) {
		try {
			index = content.indexOf( "\n---\n" );
			post = yaml.load( content.substr( 4, index - 4 ) );
			content = content.substr( index + 5 );
		} catch( error ) {
			grunt.log.error( "Invalid YAML metadata for " + path );
			return null;
		}

		post.content = content;
		return post;
	}

	// Fall back to standard JSON parsing
	return grunt.helper( "wordpress-parse-post", path );
});

grunt.registerMultiTask( "build-pages", "Process html and markdown files as pages, include @partials and syntax higlight code snippets", function() {
	var content,
		task = this,
		taskDone = task.async(),
		files = this.data,
		targetDir = grunt.config( "wordpress.dir" ) + "/posts/page/";

	grunt.file.mkdir( targetDir );

	grunt.utils.async.forEachSeries( files, function( fileName, fileDone ) {
		var content,
			post = grunt.helper( "wordpress-parse-post-flex", fileName ),
			fileType = /\.(\w+)$/.exec( fileName )[ 1 ],
			targetFileName = targetDir +
				fileName.replace( /^.+?\/(.+)\.\w+$/, "$1" ) + ".html";

		grunt.verbose.write( "Processing " + fileName + "..." );

		function processPost() {
			content = post.content;
			delete post.content;

			// Convert markdown to HTML
			if ( fileType === "md" ) {
				content = grunt.helper( "parse-markdown", content, post.toc );
				delete post.toc;
			}

			// Replace partials
			content = content.replace( /@partial\((.+)\)/g, function( match, input ) {
				return htmlEscape( grunt.file.read( input ) );
			});

			// Syntax highlight code blocks
			if ( !grunt.option( "nohighlight" ) ) {
				content = grunt.helper( "syntax-highlight", { content: content } );
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
		}

		// Invoke the pre-processor for custom functionality
		grunt.helper( "build-pages-preprocess", post, fileName, processPost );
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

// Default pre-processor is a no-op
grunt.registerHelper( "build-pages-preprocess", function( post, fileName, done ) {
	done();
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

grunt.registerHelper( "syntax-highlight", function( options ) {

	// receives the innerHTML of a <code> element and if the first character
	// is an encoded left angle bracket, we'll assume the language is html
	function crudeHtmlCheck ( input ) {
		var first = input.trim().charAt( 0 );
		return ( first === "&lt;" || first === "<" ) ? "xml" : "";
	}

	// when parsing the class attribute, make sure a class matches an actually
	// highlightable language, instead of being presentational (e.g. 'example')
	function getLanguageFromClass( str ) {
		str = str || "";
		var classes = str.split(" "),
			i = 0,
			length = classes.length;
		for ( ; i < length; i++ ) {
			if ( hljs.LANGUAGES[ classes[i].replace( /^lang-/, "" ) ] ) {
				return classes[i].replace( /^lang-/, "" );
			}
		}
		return "";
	}

	var html = options.file ? grunt.file.read( options.file ) : options.content,
		$ = cheerio.load( html );

	$( "pre > code" ).each( function( index, el ) {
		var $t = $( this ),
			code = ent.decode( $t.html() ),
			lang = $t.attr( "data-lang" ) ||
				getLanguageFromClass( $t.attr( "class" ) ) ||
				crudeHtmlCheck( code ) ||
				"javascript",
			linenumAttr = $t.attr( "data-linenum" ),
			linenum = (linenumAttr === "true" ? 1 : linenumAttr) || 1,
			gutter = linenumAttr === undefined ? false : true,
			highlighted = hljs.highlight( lang, code ),
			fixed = hljs.fixMarkup( highlighted.value, "  " ),
			output = grunt.helper( "add-line-numbers", fixed, linenum, gutter, highlighted.language );

		$t.parent().replaceWith( output );
	});

	return $.html();
});

var lineNumberTemplate = grunt.file.read( grunt.task.getFile("jquery-build/lineNumberTemplate.jst") );

grunt.registerHelper("add-line-numbers", function( block, startAt, gutter, lang ) {

	var lines = (function cleanLines() {
		var allLines = block.split("\n"),
		r = [],
		rLeadingTabs = /^\t+/g,
		minTabs = 0,
		indents = [],
		outdent;

		grunt.utils._.each( allLines, function(s,i) {
			// Don't include first or last line if it's nothing but whitespace/tabs
			if ( (i === 0 || i === allLines.length - 1) && !s.replace(/^\s+/,"").length ) {
				return;
			}

			// Find the difference in line length once leading tabs are stripped
			// and store the indent level in the indents collection for this code block
			var match = s.match( rLeadingTabs );
			if ( match ) {
				indents.push( -(match[0].replace( rLeadingTabs, "" ).length - match[0].length) );
			}

			// For empty lines inside the snippet, push in a <br> so the line renders properly
			if ( !s.trim().length ) {
				r.push("<br>");
				return;
			}

			// Otherwise, just push the line in as-is
			r.push(s)

		});


		// Find the lowest shared indent level across all lines
		// If it's greater than 0, we have to outdent the entire codeblock
		minTabs = indents.length ? grunt.utils._.min( indents ) : 0;

		if ( !minTabs ) {
			return r;
		}

		// Outdent the lines so indentation is only within the block, using the lowest shared indent level
		outdent = new RegExp("^"+ new Array(minTabs).join("\t"), "g" );
		return r.map(function(s) {
			return s.replace(outdent, "");
		});
	})(),
	
	data = {
		startAt: startAt,
                lines: lines,
		gutter: gutter,
		lang: lang
	},

	lined = grunt.template.process( lineNumberTemplate, data );

	return lined;

});

grunt.registerHelper( "parse-markdown", function( src, generateToc ) {
	var toc = "",
		marked = require( "marked" ),
		tokens = marked.lexer( src );

	if ( generateToc ) {
		tokens.filter(function( item ) {
			if ( item.type !== "heading" ) {
				return false;
			}

			// Store original text and create an id for linking
			item.tocText = item.text;
			item.tocId = item.text
				.replace( /\W+/g, "-" )
				.replace( /^-+|-+$/, "" )
				.toLowerCase();

			// Convert to HTML
			item.type = "html";
			item.pre = false;

			// Insert the link
			item.text = "<h" + item.depth + " class='toc-linked'>" +
				"<a href='#" + item.tocId + "' id='" + item.tocId + "' class='icon-link'>" +
					"<span class='visuallyhidden'>link</span>" +
				"</a> " + item.text + "</h" + item.depth + ">";

			return true;
		}).forEach(function( item ) {
			toc += new Array( (item.depth - 1) * 2 + 1 ).join( " " ) + "* " +
				"[" + item.tocText + "](#" + item.tocId + ")\n";
		});

		tokens = marked.lexer( toc ).concat( tokens );
	}

	// Override the default encoding of code blocks so that syntax highlighting
	// works properly.
	tokens.forEach(function( token ) {
		if ( token.type === "code" ) {
			token.escaped = true;
			token.text = token.text
				.replace( /</g, "&lt;" )
				.replace( />/g, "&gt;" );
		}
	});

	return marked.parser( tokens );
});

};
