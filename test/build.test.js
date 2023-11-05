/* eslint-env qunit */
"use strict";

const cp = require( "child_process" );
const path = require( "path" );
const fs = require( "fs" );
const ROOT = path.join( __dirname, ".." );
const DIST = path.join( __dirname, "dist" );
const EXPECTED = path.join( __dirname, "expected" );

QUnit.module( "build", function() {
	QUnit.test( "dist", function( assert ) {
		fs.rmSync( DIST, { recursive: true, force: true } );
		try {
			cp.execSync( "npm run build-example", {
				cwd: ROOT,
				env: { PATH: process.env.PATH, NPM_CONFIG_UPDATE_NOTIFIER: "false" },
				encoding: "utf8"
			} );
		} catch ( e ) {
			assert.equal( e.stdout || e.toString(), "", "error" );
			return;
		}

		const actualFiles = fs.readdirSync( DIST, { recursive: true } ).sort();
		const expectedFiles = fs.readdirSync( EXPECTED, { recursive: true } ).sort();
		assert.deepEqual( actualFiles, expectedFiles, "file names" );

		for ( const file of expectedFiles ) {
			if ( fs.statSync( path.join( EXPECTED, file ) ).isDirectory() ) {
				continue;
			}
			const actualContent = fs.readFileSync( path.join( DIST, file ), "utf8" );
			const expectedContent = fs.readFileSync( path.join( EXPECTED, file ), "utf8" );
			assert.strictEqual( actualContent, expectedContent, file );
		}
	} );
} );
