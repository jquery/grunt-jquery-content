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
	nsh = require( "node-syntaxhighlighter" ),
	path = require( "path" ),
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

// Process a YAML order file and return an object of page slugs and their ordinal indices
grunt.registerHelper( "read-order", function( orderFile ) {
	var order,
		map = {},
		index = 0;

	try {
		order = yaml.load( grunt.file.read( orderFile ) );
	} catch( error ) {
		grunt.warn( "Invalid order file: " + orderFile );
		return null;
	}


	function flatten( item, folder ) {
		var title,
		path = folder ? [ folder ] : [];

		if ( grunt.utils._.isObject( item ) ) {
			title = Object.keys( item )[ 0 ];
			path.push( title );
			path = path.join( "/" );
			map[ path ] = ++index;

			item[ title ].forEach(function( item ) {
				flatten( item, path );
			});
		} else {
			path.push( item );
			map[ path.join( "/" ) ] = ++index;
		}
	}
	order.forEach(function( item ) {
		flatten( item );
	});
	return map;
});

grunt.registerMultiTask( "build-pages", "Process html and markdown files as pages, include @partials and syntax higlight code snippets", function() {
	var content, orderMap,
		task = this,
		taskDone = task.async(),
		files = this.data,
		targetDir = grunt.config( "wordpress.dir" ) + "/posts/page/",
		orderFile = grunt.config( "wordpress.order" );

	if ( orderFile ) {
		orderMap = grunt.helper( "read-order", orderFile );
		if ( !orderMap ) {
			taskDone( false );
			return;
		}
	}

	grunt.file.mkdir( targetDir );

	grunt.utils.async.forEachSeries( files, function( fileName, fileDone ) {
		var menuOrder,
			post = grunt.helper( "wordpress-parse-post-flex", fileName ),
			content = post.content,
			fileType = /\.(\w+)$/.exec( fileName )[ 1 ],
			targetSlug = fileName.replace( /^.+?\/(.+)\.\w+$/, "$1" ),
			targetFileName = targetDir + targetSlug + ".html";

		// If an order file was specified, set the menuOrder,
		// unless the page being processed isn't in the order file,
		// in which case it shouldn't be published
		if ( orderMap ) {
			menuOrder = orderMap[ targetSlug ];
			if ( menuOrder ) {
				post.menuOrder = menuOrder;
			}
		}

		grunt.verbose.write( "Processing " + fileName + "..." );
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

grunt.registerHelper( "syntax-highlight", function( options ) {

	// receives the innerHTML of a <code> element and if the first character
	// is an encoded left angle bracket, we'll assume the language is html
	function crudeHtmlCheck ( input ) {
		return input.trim().indexOf( "&lt;" ) === 0 ? "html" : "";
	}

	// when parsing the class attribute, make sure a class matches an actually
	// highlightable language, instead of being presentational (e.g. 'example')
	function getLanguageFromClass( str ) {
		str = str || "";
		var classes = str.split(" "),
			i = 0,
			length = classes.length;
		for ( ; i < length; i++ ) {
			if ( nsh.getLanguage( classes[i].replace( /^lang-/, "" ) ) ) {
				return classes[i].replace( /^lang-/, "" );
			}
		}
		return "";
	}

	var html = options.file ? grunt.file.read( options.file ) : options.content,
		$ = cheerio.load( html );

	$( "pre > code" ).each( function( index, el ) {
		var $t = $( this ),
			code = $t.html(),
			lang = $t.attr( "data-lang" ) ||
				getLanguageFromClass( $t.attr( "class" ) ) ||
				crudeHtmlCheck( code ),
			linenumAttr = $t.attr( "data-linenum" ),
			linenum = (linenumAttr === "true" ? 1 : linenumAttr) || 1,
			gutter = linenumAttr === undefined ? false : true,
			brush = nsh.getLanguage( lang ) || nsh.getLanguage( "js" ),
			highlighted = nsh.highlight( code, brush, {
				"first-line": linenum,
				gutter: gutter
			});
		$t.parent().replaceWith( $( highlighted ).removeAttr( "id" ) );
	});

	return $.html();
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
