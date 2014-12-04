var syntaxHighlight = require( "./lib/highlight" );

exports.syntaxHighlight = syntaxHighlight;

exports.preprocessPost = function( post, fileName, callback ) {
	callback( null, post );
};
