"use strict";

const syntaxHighlight = require( "./lib/highlight" );

exports.syntaxHighlight = syntaxHighlight;

exports.postPreprocessors = {
	_default( post, _fileName, callback ) {
		callback( null, post );
	}
};
