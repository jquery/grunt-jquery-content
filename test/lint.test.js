/* eslint-env qunit */
"use strict";

const cp = require( "child_process" );
const path = require( "path" );
const ROOT = path.join( __dirname, ".." );

QUnit.module( "lint", function() {
	QUnit.test( "fixture", function( assert ) {
		let stdout;
		try {
			const result = cp.execSync( "npm run -s lint-example", {
				cwd: ROOT,
				env: { PATH: process.env.PATH, NPM_CONFIG_UPDATE_NOTIFIER: "false" },
				encoding: "utf8"
			} );
			stdout = result.toString().trim();
		} catch ( e ) {
			assert.equal( e.stdout || e.toString(), "", "error" );
			return;
		}

		const expect =
`Running "xmllint:all" (xmllint) task
Lint free files: 2

Done.`;
		assert.strictEqual( stdout, expect, "stdout" );
	} );
} );
