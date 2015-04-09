var fs = require( "fs" ),
	hljs = require( "highlight.js" ),
	cheerio = require( "cheerio" ),
	he = require( "he" ),
	grunt = require( "grunt" ),
	lineNumberTemplate = fs.readFileSync( __dirname + "/lineNumberTemplate.jst", "utf-8" );

// When parsing the class attribute, make sure a class matches an actually
// highlightable language, instead of being presentational (e.g. 'example')
function getLanguageFromClass( str ) {
	var classes = (str || "").split( " " ),
		i = 0,
		length = classes.length;

	for ( ; i < length; i++ ) {
		if ( hljs.LANGUAGES[ classes[ i ].replace( /^lang-/, "" ) ] ) {
			return classes[i].replace( /^lang-/, "" );
		}
	}

	return "";
}

function outdent( string ) {
	var rOutdent,
		adjustedLines = [],
		minTabs = Infinity,
		rLeadingTabs = /^\t+/;

	string.split( "\n" ).forEach(function( line, i, arr ) {

		// Don't include first or last line if it's nothing but whitespace
		if ( (i === 0 || i === arr.length - 1) && !line.trim().length ) {
			return;
		}

		// For empty lines inside the snippet, push a space so the line renders properly
		if ( !line.trim().length ) {
			adjustedLines.push(" ");
			return;
		}

		// Count how many leading tabs there are and update the global minimum
		var match = line.match( rLeadingTabs ),
			tabs = match ? match[0].length : 0;
		minTabs = Math.min( minTabs, tabs );

		adjustedLines.push( line );
	});

	if ( minTabs !== Infinity ) {

		// Outdent the lines as much as possible
		rOutdent = new RegExp( "^\t{" + minTabs + "}" );
		adjustedLines = adjustedLines.map(function( line ) {
			return line.replace( rOutdent, "" );
		});
	}

	return adjustedLines.join( "\n" );
}

function syntaxHighlight( html ) {
	var $ = cheerio.load( html );

	$( "pre > code" ).each(function() {
		var $t = $( this ),
			code = he.decode( outdent( $t.html() ) ),
			lang = $t.attr( "data-lang" ) ||
				getLanguageFromClass( $t.attr( "class" ) ) ||
				(code.trim().charAt( 0 ) === "<" ? "xml" : "") ||
				"javascript",
			linenumAttr = $t.attr( "data-linenum" ),
			linenum = parseInt( linenumAttr, 10 ) || 1,
			gutter = linenumAttr === "false" ? false : true,
			highlighted = hljs.highlight( lang, code ),
			fixed = hljs.fixMarkup( highlighted.value, "  " );

		// Handle multi-line comments (#32)
		fixed = fixed.replace(
			/<span class="comment">\/\*([^<]+)\*\/<\/span>/g,
			function( full, comment ) {
				return "<span class=\"comment\">/*" +
					comment.split( "\n" ).join( "</span>\n<span class=\"comment\">" ) +
					"*/</span>";
			}
		);

		$t.parent().replaceWith( grunt.template.process( lineNumberTemplate, {
			data: {
				lines: fixed.split( "\n" ),
				startAt: linenum,
				gutter: gutter,
				lang: lang
			}
		}));
	});

	return $.html();
}

module.exports = syntaxHighlight;
