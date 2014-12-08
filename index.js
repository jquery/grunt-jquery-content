var syntaxHighlight = require( "./lib/highlight" );

exports.syntaxHighlight = syntaxHighlight;

exports.postPreprocessors = {
	_default: function( post, fileName, callback ) {
		callback( null, post );
	}
};
