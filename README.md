[![Tested with QUnit](https://img.shields.io/badge/tested_with-qunit-9c3493.svg)](https://qunitjs.com/)

# grunt-jquery-content

A collection of Grunt tasks for deploying jQuery documentation sites.

This module builds on top of [node-wordpress](https://github.com/scottgonzalez/node-wordpress) and the [Gilded WordPress](https://github.com/scottgonzalez/gilded-wordpress) plugin. See the Gilded WordPress documentation for details on the [directory structure and file formats](https://github.com/scottgonzalez/gilded-wordpress#directory-structure).

## Getting started

Prerequisites:

* Install the gilded-wordpress.php plugin on your WordPress site (copy from [Gilded WordPress](https://github.com/scottgonzalez/gilded-wordpress)).
* Depending on what kind of files you want to upload as "resources", you may need to configure WordPress to allow more permissive uploads. See the [Gilded WordPress documentation](https://github.com/scottgonzalez/gilded-wordpress#permissive-uploads) for how to do this.

Basic set up for your project:

1. add `wordpress` configuration to Gruntfile.js.
2. add `build-posts` task configuration to Gruntfile.js.
3. add `grunt.registerTask( "build", [ "build-posts" ] );` to Gruntfile.js

You can now use `grunt wordpress-deploy` to build and deploy your project.

The `wordpress-deploy` task is a tree of the following tasks:

* `wordpress-deploy`
  * `build-wordpress`
    * `check-modules`
    * `lint` (empty placeholder by default)
    * `clean-dist`
    * `build` (undefined by default)
  * `wordpress-publish`
    * `wordpress-validate`
    * `wordpress-sync`

The following optional tasks are made available to use via the `lint` or `build` phase:

* lint:
  *  `xmllint`
* build:
  * `build-posts`
  * `build-resources`
  * `build-xml-entries`
  * `build-xml-categories`
  * `build-xml-full`

## Config

```javascript
grunt.initConfig({
	wordpress: {
		url: "wordpress.localhost",
		username: "admin",
		password: "admin",
		dir: "dist"
	}
});
```

* `url`: The URL for the WordPress install.
  Can be a full URL, e.g., `http://wordpress.localhost:1234/some/path`
  or as short as just the host name.
  If the protocol is `https`, then a secure connection will be used.
* `host` (optional): The actual host to connect to if different from the URL, e.g., when deploying to a local server behind a firewall.
* `username`: WordPress username.
* `password`: WordPress password.
* `dir`: Directory containing posts, taxonomies, and resources.
  * See the [Gilded WordPress documentation](https://github.com/scottgonzalez/gilded-wordpress#directory-structure) for details on the directory structure and file formats.

## Tasks

### clean-dist

This task removes all files in the `dist/` directory.

### lint

This is an empty task list by default. If the site contains any lint checks, they should be defined here. For example, API documentation sites should have the following task list:

```javascript
grunt.registerTask( "lint", [ "xmllint" ] );
```

### build-posts

```javascript
grunt.initConfig({
	"build-posts": {
		page: "pages/**"
	},
});
```

This multi-task takes a list of html or markdown files, copies them to `[wordpress.dir]/posts/[post-type]/`, processes `@partial` entries and highlights the syntax in each. The keys are the post types for each set of posts.

See the [`postPreprocessors` export](#postpreprocessors) for a hook to implement custom processing.

### build-resources

This mult-task copies all source files into `[wordpress.dir]/resources/`.

```javascript
grunt.initConfig({
	"build-resources": {
		all: "resources/**"
	},
});
```

### xmllint

This multi-task lints XML files to ensure the files are valid.

### build-xml-entries

This multi-task generates HTML files to be published to WordPress by parsing the source XML files and transforming them through `entries2html.xsl`. The generate files are copied to `[wordpress.dir]/posts/post/`.

The content repo must create its own `entries2html.xsl` file which must import `node_modules/grunt-jquery-content/tasks/jquery-xml/entries2html-base.xsl`.

### build-xml-categories

This task reads `categories.xml` from the root of the content repo and generates `[wordpress.dir]/taxonomies.json`.

`categories.xml` should have the following format:

```xml
<categories>
	<category name="Category 1" slug="category1">
		<desc>A description of the category.</desc>
		<category name="Subcategory" slug="subcategory">
			<desc><![CDATA[A description containing <em>HTML</em>!]]></desc>
		</category>
	<category name="Another Category" slug="another-category">
		<desc>This category is boring.</desc>
	</category>
</categories>
```

Code examples in the descriptions will be syntax highlighted.

### build-xml-full

This task generates a single XML file that contains all entries and stores the result in `[wordpress.dir]/resources/api.xml`.

### wordpress-validate

Walks through the `wordpress.dir` directory and performs various validations, such as:

* Verifying that XML-RPC is enabled for the WordPress site.
* Verifying that the custom XML-RPC methods for gilded-wordpress are installed.
* Verifying the taxonomies and terms in `taxonomies.json`.
* Verifying that child-parent relationships for posts are valid.
* Verifying data for each post.

### wordpress-sync

Synchronizes everything in `wordpress.dir` to the WordPress site.
This will create/edit/delete terms, posts, and resources.

*Note: `wordpress-validate` must run prior to `wordpress-sync`.*

### wordpress-publish

Alias task for `wordpress-validate` and `wordpress-sync`.
This is useful if your original source content is already in the proper format,
or if you want to manually verify generated content between your custom build and publishing.

### wordpress-deploy

Alias task for `build-wordpress` and `wordpress-publish`.
This is useful if you are generating content for use with `wordpress-sync`.
Simply create a `build-wordpress` task that populates the `wordpress.dir` directory
and your deployments will be as simple as `grunt wordpress-deploy`.

### deploy

Alias task for `wordpress-deploy`.

Since most projects that use grunt-jquery-content have one deploy target (WordPress),
there is a built-in `deploy` task that just runs `wordpress-deploy`.

If your project has other deploy targets, you can redefine `deploy` as an alias that runs both `wordpress-deploy` and your other deployment-related tasks.

## Page content

The following features are available in pages built via the `build-posts` task.

### Markdown

Using markdown files provides additional features over HTML files. By default, links for each header are automatically generated for markdown files.

In addition to the [standard metadata](https://github.com/scottgonzalez/gilded-wordpress#post-files) for post files, the following properties can be set:

* `noHeadingLinks`: When set to `false`, heading links won't be generated.
* `toc`: When set to `true`, a table of contents will be inserted at the top of the post based on the headings within the post.

### `@partial`

Usage:

```html
<pre><code data-linenum>@partial(resources/code-sample.html)</code></pre>
```

Where `resources/code-sample.html` is a relative path in the current directory. That html file will be inserted, escaped and highlighted.

### `@placeholder`

Inside markup included with `@partial`, you can mark sections of code as `@placeholder` code, to be excluded from the inserted code, replaced with an html comment.

Usage:

```html
regular markup will show up here
<!-- @placeholder-start(more markup) -->
this will be replaced
<!-- @placeholder-end -->
other content
```

That will result in:

```html
regular markup will show up here
<!-- more markup -->
other content
```

## Exports

The grunt-jquery-content module primarily registers Grunt tasks, but it also exports some methods through the `require()` API.

### `syntaxHighlight( content )`

Syntax highlights content.

* `content` String: The string the highlight.

### `postPreprocessors`

Hooks for modifying the posts before they're processed in the [`build-posts`](#build-posts) task.

`postPreprocessors` is a hash of preprocessors, where the key is the post type and the value is a function which modifies the post.

The functions must be in the form of:
`function( post, fileName, callback )`

* `post` Object: The post being processed.
* `fileName` String: The name of the file used to generate the post object.
* `callback` function( error, post ): Callback to invoke after modifying the post.
  * `error`: An `Error` instance, if there was an error while modifying the post.
  * `post` The modified post.

By default, posts are placed in the `[wordpress.dir]/[post-type]` directory using the same relative path and file name as the source file. The relative path can be changed by setting the `fileName` property on the post.

If a preprocessor is not defined for the given post type, then the `_default` preprocessor will be used.
