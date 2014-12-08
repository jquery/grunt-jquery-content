# grunt-jquery-content

A collection of tasks for building the jQuery web sites via Grunt.

This module builds on top of [grunt-wordpress](https://github.com/scottgonzalez/grunt-wordpress), which builds on top of [Gilded WordPress](https://github.com/scottgonzalez/gilded-wordpress). See the Gilded WordPress documentation for details on the [directory structure and file formats](https://github.com/scottgonzalez/gilded-wordpress#directory-structure).

## Tasks

### clean-dist

This task removes all files in the `dist/` directory.

### lint

This is an empty task list. If the site contains any lint checks, they should be defined here. For example, API sites should have the following task list:

```
grunt.registerTask( "lint", [ "xmllint" ] );
```

### build

This is a task list that must be defined per site, containing all of the build steps. A simple site would have the following task list:

```
grunt.registerTask( "build", [ "build-posts", "build-resources" ] );
```

### build-posts

This multi-task takes a list of html or markdown files, copies them to `[wordpress.dir]/posts/[post-type]/`, processes `@partial` entries and highlights the syntax in each. The keys are the post types for each set of posts.

See the [`postPreprocessors` export](#postpreprocessors) for a hook to implement custom processing.

#### markdown

Using markdown files provides additional features over HTML files. By default, links for each header are automatically generated for markdown files.

In addition to the [standard metadata](https://github.com/scottgonzalez/gilded-wordpress#post-files) for post files, the following properties can be set:

* `noHeadingLinks`: When set to `false`, heading links won't be generated.
* `toc`: When set to `true`, a table of contents will be inserted at the top of the post based on the headings within the post.

#### @partial

Usage:

```html
<pre><code data-linenum>@partial(resources/code-sample.html)</code></pre>
```

Where `resources/code-sample.html` is a relative path in the current directory. That html file will be inserted, escaped and highlighted.

#### @placeholder

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

### build-resources

This mult-task copies all source files into `[wordpress.dir]/resources/`.

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



## Exports

This module also exports some methods through the standard node `require()` API.

### syntaxHighlight( content )

Syntax highlights content.

* `content` String: The string the highlight.

### postPreprocessors

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
