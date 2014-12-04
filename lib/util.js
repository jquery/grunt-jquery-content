var fs = require( "fs" ),
	async = require( "async" ),
	marked = require( "marked" );

function htmlEscape( text ) {
	return text

		// Supports keeping markup in source file, but drop from inline sample
		.replace(
			/<!-- @placeholder-start\((.+)\) -->[\s\S]+@placeholder-end -->/g,
			function( match, input ) {
				return "<!-- " + input + " -->";
			}
		)
		.replace( /&/g, "&amp;" )
		.replace( /</g, "&lt;" )
		.replace( />/g, "&gt;" )
		.replace( /"/g, "&quot;" )
		.replace( /'/g, "&#039;" );
}

function parseMarkdown( src, options ) {
	var toc = "",
		tokens = marked.lexer( src ),
		links = tokens.links;

	if ( !options.generateLinks ) {
		return marked.parser( tokens );
	}

	tokens.forEach(function( item ) {
		if ( item.type !== "heading" ) {
			return;
		}

		// Store original text and create an id for linking
		var parsedText = marked( item.text );
		parsedText = parsedText.substring( 3, parsedText.length - 5 );
		item.tocText = parsedText.replace( /<[^>]+>/g, "" );
		item.tocId = item.tocText
			.replace( /\W+/g, "-" )
			.replace( /^-+|-+$/, "" )
			.toLowerCase();

		// Convert to HTML
		item.type = "html";
		item.pre = false;

		// Insert the link
		item.text = "<h" + item.depth + " class='toc-linked'>" +
			"<a href='#" + item.tocId + "' id='" + item.tocId + "' class='icon-link toc-link'>" +
				"<span class='visuallyhidden'>link</span>" +
			"</a> " + parsedText + "</h" + item.depth + ">";

		if ( options.generateToc ) {
			toc += new Array( (item.depth - 1) * 2 + 1 ).join( " " ) + "* " +
				"[" + item.tocText + "](#" + item.tocId + ")\n";
		}
	});

	if ( options.generateToc ) {
		tokens = marked.lexer( toc ).concat( tokens );

		// The TOC never generates links, so we can just copy the links directly
		// from the original tokens.
		tokens.links = links;
	}

	return marked.parser( tokens );
}

function eachFile( files, stepFn, complete ) {
	var count = 0;

	async.forEachSeries( files, function( fileName, fileDone ) {
		if ( !fs.statSync( fileName ).isFile() ) {
			return fileDone();
		}

		count++;
		stepFn( fileName, fileDone );
	}, function( error ) {
		if ( error ) {
			return complete( error );
		}

		complete( null, count );
	});
}

exports.htmlEscape = htmlEscape;
exports.parseMarkdown = parseMarkdown;
exports.eachFile = eachFile;
