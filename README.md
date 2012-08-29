# grunt-jquery-content

A collection of tasks for building the jQuery websites

## build-pages

This multi-task takes a list of html or markdown files, copies them to `[wordpress.dir]/posts/page`, processes @partial entries and highlights the syntax in each.

### @partial

Usage:

```html
<pre><code data-linenum>@partial(resources/code-sample.html)</code></pre>
```

Where `resources/code-sample.html` is relative path in the current directory. That html file will be inserted, escaped and highlighted.

### @placeholder

Inside markup included with @partial you can mark sections of code as @placeholder code, to be excluded from the inserted code, replaced with a html comment.

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

## License
Copyright (c) 2012 jQuery Foundation
Licensed under the MIT license.
