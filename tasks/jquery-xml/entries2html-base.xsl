<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
<xsl:output method="html" omit-xml-declaration="yes"/>

<!-- Set this to true to display links to /category/version/{version} -->
<xsl:variable name="version-category-links" select="false()"/>
<!-- Set this to false to prevent prefixing method names with a dot -->
<xsl:variable name="method-prefix-dot" select="true()"/>
<!-- Set this to false to prevent widget method examples from being generated -->
<xsl:variable name="widget-method-examples" select="true()"/>

<xsl:variable name="lowercase" select="'abcdefghijklmnopqrstuvwxyz'"/>
<xsl:variable name="uppercase" select="'ABCDEFGHIJKLMNOPQRSTUVWXYZ'"/>

<xsl:template match="/">
	<script>{
		"title":
			<xsl:call-template name="escape-string">
				<xsl:with-param name="s" select="//entry/title/text()"/>
			</xsl:call-template>,
		"excerpt":
			<xsl:call-template name="escape-string">
				<xsl:with-param name="s">
					<xsl:choose>
						<xsl:when test="/entries/desc">
							<xsl:apply-templates select="/entries/desc"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:apply-templates select="//entry[1]/desc"/>
						</xsl:otherwise>
					</xsl:choose>
				</xsl:with-param>
			</xsl:call-template>,
		"termSlugs": {
			"category": [
				<xsl:for-each select="//entry/category">
					<xsl:if test="position() &gt; 1"><xsl:text>,</xsl:text></xsl:if>
					<xsl:text>"</xsl:text>
					<xsl:value-of select="@slug"/>
					<xsl:text>"</xsl:text>
				</xsl:for-each>
			]
		}
	}</script>

	<xsl:if test="count(//entry) &gt; 1">
		<xsl:call-template name="toc"/>
	</xsl:if>

	<xsl:for-each select="//entry">
		<xsl:variable name="entry-name" select="@name"/>
		<xsl:variable name="entry-name-trans" select="translate($entry-name,'$., ()/{}','s---')"/>
		<xsl:variable name="entry-type" select="@type"/>
		<xsl:variable name="entry-index" select="position()"/>
		<xsl:variable name="entry-pos" select="concat($entry-name-trans,$entry-index)"/>
		<xsl:variable name="number-examples" select="count(example)"/>

		<article>
			<xsl:attribute name="id">
				<xsl:value-of select="$entry-pos"/>
			</xsl:attribute>
			<xsl:attribute name="class">
				<xsl:value-of select="concat('entry ', $entry-type)"/>
			</xsl:attribute>

			<xsl:call-template name="entry-title"/>
			<div class="entry-wrapper">
				<xsl:call-template name="entry-signature">
					<xsl:with-param name="entry-index" select="$entry-index"/>
				</xsl:call-template>

				<xsl:if test="normalize-space(longdesc/*)">
					<div class="longdesc">
						<xsl:attribute name="id">
							<xsl:text>entry-longdesc</xsl:text>
							<xsl:if test="$entry-index &gt; 1">
								<xsl:text>-</xsl:text><xsl:value-of select="$entry-index - 1"/>
							</xsl:if>
						</xsl:attribute>

						<xsl:apply-templates select="longdesc"/>
					</div>
				</xsl:if>

				<xsl:if test="note">
					<h3>Additional Notes:</h3>
					<div class="longdesc">
						<ul>
							<xsl:for-each select="note">
								<li><xsl:call-template name="note"/></li>
							</xsl:for-each>
						</ul>
					</div>
				</xsl:if>

				<xsl:call-template name="entry-body"/>

				<xsl:if test="example">
					<section class="entry-examples">
						<xsl:attribute name="id">
							<xsl:text>entry-examples</xsl:text>
							<xsl:if test="$entry-index &gt; 1">
								<xsl:text>-</xsl:text><xsl:value-of select="$entry-index - 1"/>
							</xsl:if>
						</xsl:attribute>

						<header>
							<h2 class="underline">Example<xsl:if test="$number-examples &gt; 1">s</xsl:if>:</h2>
						</header>

						<xsl:apply-templates select="example">
							<xsl:with-param name="entry-index" select="$entry-index"/>
							<xsl:with-param name="number-examples" select="$number-examples"/>
						</xsl:apply-templates>
					</section>
				</xsl:if>
			</div>
		</article>
	</xsl:for-each>
</xsl:template>

<xsl:template name="toc">
	<xsl:apply-templates select="/entries/desc"/>
	<div class="toc">
		<h4><span>Contents:</span></h4>
		<ul class="toc-list">
			<xsl:for-each select="//entry">
				<xsl:choose>
					<xsl:when test="@type='method'">
						<xsl:call-template name="toc-method"/>
					</xsl:when>
					<xsl:otherwise>
						<xsl:call-template name="toc-basic"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:for-each>
		</ul>
	</div>
</xsl:template>

<xsl:template name="toc-basic">
	<xsl:variable name="entry-name-trans" select="translate(@name,'$., ()/{}','s---')"/>
	<xsl:variable name="entry-url" select="concat('#',$entry-name-trans,position())"/>
	<li><a href="{$entry-url}"><xsl:value-of select="@name"/></a></li>
</xsl:template>

<xsl:template name="toc-method">
	<xsl:variable name="entry-name" select="@name"/>
	<xsl:variable name="entry-name-trans" select="translate(@name,'$., ()/{}','s---')"/>
	<xsl:variable name="entry-url" select="concat('#',$entry-name-trans,position())"/>

	<li>
		<a href="{$entry-url}">
			<xsl:for-each select="signature[1]">
				<xsl:call-template name="method-signature">
					<xsl:with-param name="method-name" select="$entry-name"/>
					<xsl:with-param name="dot" select="$method-prefix-dot"/>
				</xsl:call-template>
			</xsl:for-each>
		</a>

		<ul>
			<xsl:for-each select="signature">
				<xsl:variable name="id">
					<xsl:value-of select="$entry-name-trans"/>
					<xsl:for-each select="argument">
						<xsl:text>-</xsl:text><xsl:value-of select="translate(@name, ' ,.)(', '--')"/>
					</xsl:for-each>
				</xsl:variable>

				<li>
					<a href="#{$id}">
						<xsl:call-template name="method-signature">
							<xsl:with-param name="method-name" select="$entry-name"/>
							<xsl:with-param name="dot" select="$method-prefix-dot"/>
						</xsl:call-template>
					</a>
				</li>
			</xsl:for-each>
		</ul>
	</li>
</xsl:template>

<xsl:template name="entry-title">
	<xsl:param name="entry-type" select="@type"/>
	<xsl:param name="entry-name" select="@name"/>

	<h2 class="section-title">
		<xsl:choose>
			<xsl:when test="$entry-type='method'">
				<span class="name">
					<xsl:for-each select="signature[1]">
						<xsl:call-template name="method-signature">
							<xsl:with-param name="method-name" select="$entry-name"/>
							<xsl:with-param name="dot" select="$method-prefix-dot"/>
						</xsl:call-template>
					</xsl:for-each>
				</span>
				<xsl:call-template name="return-value"/>
			</xsl:when>
			<xsl:when test="$entry-type='selector'">
				<span>
					<xsl:value-of select="@name"/>
					<xsl:text> selector</xsl:text>
				</span>
			</xsl:when>
			<xsl:when test="$entry-type='property'">
				<span>
					<xsl:value-of select="@name"/>
				</span>
				<xsl:call-template name="return-value"/>
			</xsl:when>
			<xsl:when test="$entry-type='event'">
				<span>
					<xsl:value-of select="@name"/>
					<xsl:text> event</xsl:text>
				</span>
			</xsl:when>
			<xsl:otherwise>
				<span><xsl:value-of select="title"/></span>
			</xsl:otherwise>
		</xsl:choose>
		<xsl:call-template name="version-details"/>
	</h2>
</xsl:template>

<xsl:template name="entry-signature">
	<xsl:param name="entry-index"/>

	<p class="desc"><strong>Description: </strong> <xsl:apply-templates select="desc"/></p>
	<xsl:choose>
		<xsl:when test="@type='selector'">
			<xsl:call-template name="entry-signature-selector"/>
		</xsl:when>
		<xsl:when test="@type='property'">
			<xsl:call-template name="entry-signature-property"/>
		</xsl:when>
		<xsl:when test="@type='event'">
			<xsl:call-template name="entry-signature-event"/>
		</xsl:when>
		<xsl:when test="@type='method'">
			<xsl:call-template name="entry-signature-method"/>
		</xsl:when>
		<xsl:when test="@type='effect'">
			<xsl:call-template name="entry-signature-effect"/>
		</xsl:when>
		<xsl:when test="@type='widget'">
			<xsl:call-template name="widget-quick-nav">
				<xsl:with-param name="entry-index" select="$entry-index"/>
			</xsl:call-template>
		</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template name="entry-signature-selector">
	<ul class="signatures">
		<xsl:for-each select="signature">
			<li class="signature">
				<h4 class="name">
					<xsl:call-template name="version-details"/>
					<xsl:text>jQuery( "</xsl:text><xsl:value-of select="sample|../sample"/><xsl:text>" )</xsl:text>
				</h4>

				<xsl:for-each select="argument">
					<p class="argument">
						<strong><xsl:value-of select="@name"/>: </strong>
						<xsl:copy-of select="desc/text()|desc/*"/>
					</p>
				</xsl:for-each>
			</li>
		</xsl:for-each>
	</ul>
</xsl:template>

<xsl:template name="entry-signature-property">
	<ul class="signatures">
		<!-- A property can't have multiple signatures, but we want to change
		context to the signature for consistency -->
		<xsl:for-each select="signature">
			<li class="signature">
				<h4 class="name">
					<xsl:call-template name="version-details"/>
					<xsl:value-of select="../@name"/>
				</h4>

				<xsl:call-template name="properties"/>
			</li>
		</xsl:for-each>
	</ul>
</xsl:template>

<xsl:template name="entry-signature-event">
	<ul class="signatures">
		<!-- An event can't have multiple signatures, but we want to change
		context to the signature for consistency -->
		<xsl:for-each select="signature">
			<li class="signature">
				<h4 class="name">
					<xsl:call-template name="version-details"/>
					<xsl:text>jQuery( </xsl:text>
					<xsl:choose>
						<xsl:when test="../@example-selector">
							<xsl:value-of select="../@example-selector"/>
						</xsl:when>
						<xsl:otherwise>
							<xsl:text>".selector"</xsl:text>
						</xsl:otherwise>
					</xsl:choose>
					<xsl:text> ).on( "</xsl:text>
					<xsl:value-of select="../@name"/>
					<xsl:text>", function( event ) { ... } )</xsl:text>
				</h4>

				<xsl:if test="property">
					<p class="event-properties">Additional properties on the <a href="http://api.jquery.com/category/events/event-object/">event object</a>:</p>
					<xsl:call-template name="properties"/>
				</xsl:if>
			</li>
		</xsl:for-each>
	</ul>
</xsl:template>

<xsl:template name="entry-signature-method">
	<xsl:variable name="entry-name" select="@name"/>
	<xsl:variable name="entry-name-trans" select="translate($entry-name,'$., ()/{}','s---')"/>

	<ul class="signatures">
		<xsl:for-each select="signature">
			<li class="signature">
				<xsl:variable name="id">
					<xsl:value-of select="$entry-name-trans"/>
					<xsl:for-each select="argument">
						<xsl:text>-</xsl:text><xsl:value-of select="translate(@name, ' ,.)(', '--')"/>
					</xsl:for-each>
				</xsl:variable>

				<h4 class="name">
					<xsl:call-template name="version-details"/>
					<a id="{$id}" href="#{$id}">
						<span class="icon-link"></span>

						<xsl:call-template name="method-signature">
							<xsl:with-param name="method-name" select="$entry-name"/>
							<xsl:with-param name="dot" select="$method-prefix-dot"/>
						</xsl:call-template>
					</a>
				</h4>

				<xsl:call-template name="arguments"/>
			</li>
		</xsl:for-each>
	</ul>
</xsl:template>

<xsl:template name="entry-signature-effect">
	<ul class="signatures">
		<!-- NOTE: effects don't have signatures, but they probably should -->
		<li class="signature">
			<h4 class="name">
				<xsl:call-template name="version-details"/>
				<xsl:value-of select="@name"/>
			</h4>

			<xsl:if test="arguments">
				<ul><xsl:for-each select="arguments/argument">
					<xsl:apply-templates select="."/>
				</xsl:for-each></ul>
			</xsl:if>
		</li>
	</ul>
</xsl:template>

<xsl:template name="entry-body">
	<xsl:choose>
		<xsl:when test="@type='widget'">
			<xsl:call-template name="entry-body-widget"/>
		</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template name="entry-body-widget">
	<xsl:variable name="entry-name" select="@name"/>
	<xsl:variable name="entry-index" select="position()"/>
	<xsl:variable name="widget-name">
		<xsl:choose>
			<xsl:when test="@widget-name">
				<xsl:value-of select="@widget-name"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="@name"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>

	<xsl:if test="options">
		<section id="options">
			<header>
				<h2 class="underline">Options</h2>
			</header>
			<xsl:for-each select="options/option">
				<xsl:sort select="@name"/>
				<div id="option-{@name}">
					<xsl:attribute name="class">
						<xsl:text>api-item</xsl:text>
						<xsl:if test="position() = 1">
							<xsl:text> first-item</xsl:text>
						</xsl:if>
					</xsl:attribute>

					<h3>
						<xsl:value-of select="@name"/>
						<span class="option-type">
							<strong>Type: </strong>
							<xsl:call-template name="render-types"/>
						</span>
					</h3>
					<div class="default">
						<strong>Default: </strong>
						<code><xsl:value-of select="@default"/></code>
					</div>
					<div>
						<xsl:apply-templates select="desc">
							<xsl:with-param name="entry-name" select="$entry-name"/>
						</xsl:apply-templates>
						<xsl:call-template name="version-details">
							<xsl:with-param name="parens" select="true()"/>
						</xsl:call-template>
					</div>
					<xsl:if test="type/desc">
						<strong>Multiple types supported:</strong>
						<ul>
							<xsl:for-each select="type/desc">
								<li>
									<strong><xsl:value-of select="../@name"/></strong>
									<xsl:text>: </xsl:text>
									<xsl:apply-templates select="."/>
								</li>
							</xsl:for-each>
						</ul>
					</xsl:if>
					<xsl:if test="@example-value">
						<strong>Code examples:</strong>

						<p>Initialize the <xsl:value-of select="$widget-name"/> with the <xsl:value-of select="@name"/> option specified:</p>
						<pre><code data-lang="javascript">
							$( ".selector" ).<xsl:value-of select="$widget-name"/>({ <xsl:value-of select="@name"/>: <xsl:value-of select="@example-value"/> });
						</code></pre>

						<p>Get or set the <xsl:value-of select="@name"/> option, after initialization:</p>
						<pre><code data-lang="javascript">
							// getter
							var <xsl:value-of select="@name"/> = $( ".selector" ).<xsl:value-of select="$widget-name"/>( "option", "<xsl:value-of select="@name"/>" );

							// setter
							$( ".selector" ).<xsl:value-of select="$widget-name"/>( "option", "<xsl:value-of select="@name"/>", <xsl:value-of select="@example-value"/> );
						</code></pre>
					</xsl:if>
					<xsl:apply-templates select="example">
						<xsl:with-param name="number-examples" select="count(example)"/>
					</xsl:apply-templates>
				</div>
			</xsl:for-each>
		</section>
	</xsl:if>
	<xsl:if test="methods">
		<section id="methods">
			<header>
				<h2 class="underline">Methods</h2>
			</header>
			<xsl:for-each select="methods/method">
				<xsl:sort select="@name"/>
				<xsl:variable name="method-name" select="@name"/>
				<xsl:variable name="method-position" select="position()"/>
				<div id="method-{$method-name}">
					<xsl:for-each select="signature | self::node()[count(signature) = 0]">
						<div>
							<xsl:attribute name="class">
								<xsl:text>api-item</xsl:text>
								<xsl:if test="$method-position = 1 and position() = 1">
									<xsl:text> first-item</xsl:text>
								</xsl:if>
							</xsl:attribute>

							<xsl:call-template name="widget-method">
								<xsl:with-param name="entry-name" select="$entry-name"/>
								<xsl:with-param name="method-name" select="$method-name"/>
							</xsl:call-template>

							<xsl:if test="$widget-method-examples and not(../@suppress-examples)">
								<div>
									<strong>Code examples:</strong>

									<p>Invoke the <xsl:value-of select="@name"/> method:</p>
									<pre><code data-lang="javascript">
										<xsl:choose>
											<xsl:when test="example">
												<xsl:value-of select="example"/>
											</xsl:when>
											<xsl:otherwise>
												<xsl:if test="@example-return-var">
													<xsl:text>var </xsl:text>
													<xsl:value-of select="@example-return-var"/>
													<xsl:text> = </xsl:text>
												</xsl:if>
												<xsl:text>$( ".selector" ).</xsl:text>
												<xsl:value-of select="$widget-name"/>
												<xsl:text>( "</xsl:text>
												<xsl:value-of select="$method-name"/>
												<xsl:text>"</xsl:text>
												<xsl:if test="@example-params">
													<xsl:text>, </xsl:text>
													<xsl:value-of select="@example-params"/>
												</xsl:if>
												<xsl:text> );</xsl:text>
											</xsl:otherwise>
										</xsl:choose>
									</code></pre>
								</div>
							</xsl:if>
						</div>
					</xsl:for-each>
				</div>
			</xsl:for-each>
		</section>
	</xsl:if>
	<xsl:if test="events">
		<section id="events">
			<header>
				<h2 class="underline">Events</h2>
			</header>
			<xsl:for-each select="events/event">
				<xsl:sort select="@name"/>
				<div id="event-{@name}">
					<xsl:attribute name="class">
						<xsl:text>api-item</xsl:text>
						<xsl:if test="position() = 1">
							<xsl:text> first-item</xsl:text>
						</xsl:if>
					</xsl:attribute>

					<xsl:call-template name="widget-event">
						<xsl:with-param name="entry-name" select="$entry-name"/>
						<xsl:with-param name="event-name" select="@name"/>
						<xsl:with-param name="widget-name" select="$widget-name"/>
					</xsl:call-template>
				</div>
			</xsl:for-each>
		</section>
	</xsl:if>
</xsl:template>

<xsl:template name="widget-quick-nav">
	<xsl:param name="entry-index"/>
	<section id="quick-nav">
		<header>
			<h2>
				<xsl:text>QuickNav</xsl:text>
				<xsl:if test="example">
					<a>
						<xsl:attribute name="href">
							<xsl:text>#entry-examples</xsl:text>
							<xsl:if test="$entry-index &gt; 1">
								<xsl:text>-</xsl:text><xsl:value-of select="$entry-index - 1"/>
							</xsl:if>
						</xsl:attribute>
						<xsl:text>Examples</xsl:text>
					</a>
				</xsl:if>
			</h2>
		</header>

		<div class="quick-nav-section">
			<h3>Options</h3>
			<xsl:for-each select="options/option">
				<xsl:sort select="@name"/>
				<xsl:variable name="name" select="@name"/>
				<div><a href="#option-{$name}"><xsl:value-of select="$name"/></a></div>
			</xsl:for-each>
		</div>

		<div class="quick-nav-section">
			<h3>Methods</h3>
			<xsl:for-each select="methods/method">
				<xsl:sort select="@name"/>
				<xsl:variable name="name" select="@name"/>
				<div><a href="#method-{$name}"><xsl:value-of select="$name"/></a></div>
			</xsl:for-each>
		</div>

		<div class="quick-nav-section">
			<h3>Events</h3>
			<xsl:for-each select="events/event">
				<xsl:sort select="@name"/>
				<xsl:variable name="name" select="@name"/>
				<div><a href="#event-{$name}"><xsl:value-of select="$name"/></a></div>
			</xsl:for-each>
		</div>
	</section>
</xsl:template>

<!-- examples -->
<xsl:template match="example">
	<xsl:param name="entry-index"/>
	<xsl:param name="number-examples"/>

	<div class="entry-example">
		<xsl:attribute name="id">
			<xsl:text>example-</xsl:text>
			<xsl:if test="$entry-index &gt; 1">
				<xsl:value-of select="$entry-index - 1"/>
				<xsl:text>-</xsl:text>
			</xsl:if>
			<xsl:value-of select="position() - 1"/>
		</xsl:attribute>

		<h4>
			<xsl:if test="$number-examples &gt; 1">Example: </xsl:if>
			<span class="desc"><xsl:apply-templates select="desc"/></span>
		</h4>
		<pre><code data-linenum="true">
			<xsl:choose>
				<xsl:when test="html">
					<xsl:call-template name="example-code"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:copy-of select="code/text()"/>
				</xsl:otherwise>
			</xsl:choose>
		</code></pre>

		<xsl:if test="html">
			<h4>Demo:</h4>
			<div class="demo code-demo">
				<xsl:if test="height">
					<xsl:attribute name="data-height">
						<xsl:value-of select="height"/>
					</xsl:attribute>
				</xsl:if>
			</div>
		</xsl:if>

		<xsl:if test="results">
			<h4>Result:</h4>
			<pre><code class="results">
				<xsl:value-of select="results"/>
			</code></pre>
		</xsl:if>
	</div>
</xsl:template>
<xsl:template name="example-code"/>

<!-- Render types (Number, Boolean, etc.) -->
<xsl:template name="render-types">
	<xsl:if test="@type and type">
		<strong>ERROR: Use <i>either</i> @type or type elements</strong>
	</xsl:if>

	<xsl:if test="@type">
		<xsl:call-template name="render-type">
			<xsl:with-param name="typename" select="@type" />
		</xsl:call-template>
	</xsl:if>

	<xsl:if test="type">
		<xsl:for-each select="type">
			<xsl:if test="position() &gt; 1">
				<xsl:text> or </xsl:text>
			</xsl:if>
			<xsl:call-template name="render-type">
				<xsl:with-param name="typename" select="@name" />
			</xsl:call-template>
		</xsl:for-each>
	</xsl:if>
</xsl:template>

<!-- Render a single type -->
<xsl:template name="render-type">
	<xsl:param name="typename"/>

	<xsl:call-template name="render-type-simple">
		<xsl:with-param name="typename" select="$typename"/>
	</xsl:call-template>

	<!--
		If the type is "Function" we special case and write the function signature,
		e.g. function(String)=>String
		- formal arguments are child elements to the current element
		- the return element is optional
	-->
	<xsl:if test="$typename = 'Function'">
		<xsl:call-template name="render-type-function"/>

		<!-- display return type if present -->
		<xsl:if test="return or @return">
			=>
			<xsl:call-template name="render-return-types" />
		</xsl:if>
	</xsl:if>
</xsl:template>

<xsl:template name="render-type-simple">
	<xsl:param name="typename"/>
	<a href="http://api.jquery.com/Types#{$typename}"><xsl:value-of select="$typename" /></a>
</xsl:template>

<xsl:template name="render-type-function">
	<xsl:text>(</xsl:text>
	<xsl:if test="argument">
		<xsl:text> </xsl:text>
		<xsl:for-each select="argument">
			<xsl:if test="position() &gt; 1">, </xsl:if>
			<a href="http://api.jquery.com/Types#{@type}">
				<xsl:value-of select="@type"/>
			</a>
			<xsl:text> </xsl:text>
			<xsl:value-of select="@name"/>
			<xsl:if test="@type = 'Function'">
				<xsl:call-template name="render-type-function"/>
			</xsl:if>
		</xsl:for-each>
		<xsl:text> </xsl:text>
	</xsl:if>
	<xsl:text>)</xsl:text>
</xsl:template>

<xsl:template name="render-return-types">
	<xsl:if test="@return and return">
		<strong>ERROR: Use <i>either</i> @return or return element</strong>
	</xsl:if>

	<!-- return attribute -->
	<xsl:if test="@return">
		<xsl:call-template name="render-type">
			<xsl:with-param name="typename" select="@return"/>
		</xsl:call-template>
	</xsl:if>

	<!-- a return element -->
	<xsl:if test="return">
		<xsl:for-each select="return">
			<xsl:if test="position() &gt; 1">
				<strong>ERROR: A single return element is expected</strong>
			</xsl:if>
			<xsl:call-template name="render-types"/>
		</xsl:for-each>
	</xsl:if>
</xsl:template>

<xsl:template name="return-value">
	<xsl:if test="@return or return">
		<span class="returns">
			<xsl:text>Returns: </xsl:text>
			<xsl:if test="@return">
				<xsl:call-template name="render-type-simple">
					<xsl:with-param name="typename" select="@return"/>
				</xsl:call-template>
			</xsl:if>
			<xsl:if test="return">
				<xsl:for-each select="return">
					<xsl:if test="position() &gt; 1">
						<xsl:text> or </xsl:text>
					</xsl:if>
					<xsl:call-template name="render-type">
						<xsl:with-param name="typename" select="@type"/>
					</xsl:call-template>
				</xsl:for-each>
			</xsl:if>
		</span>
	</xsl:if>
</xsl:template>

<xsl:template name="method-signature">
	<xsl:param name="method-name"/>
	<xsl:param name="dot" select="false()"/>

	<xsl:if test="$dot and not(contains($method-name, '.')) and $method-name != 'jQuery'">.</xsl:if>
	<xsl:value-of select="$method-name"/>
	<xsl:text>(</xsl:text>
	<xsl:if test="argument">
		<xsl:text> </xsl:text>
		<xsl:for-each select="argument">
			<xsl:if test="@optional"> [</xsl:if>
			<xsl:if test="position() &gt; 1"><xsl:text>, </xsl:text></xsl:if>
			<xsl:value-of select="@name"/>
			<xsl:if test="@optional"><xsl:text> ]</xsl:text></xsl:if>
		</xsl:for-each>
		<xsl:text> </xsl:text>
	</xsl:if>
	<xsl:text>)</xsl:text>
</xsl:template>

<xsl:template name="arguments">
	<xsl:if test="argument">
		<ul>
			<xsl:apply-templates select="argument"/>
		</ul>
	</xsl:if>
	<xsl:if test="not(argument)">
		<ul>
			<li><div class="null-signature">This method does not accept any arguments.</div></li>
		</ul>
	</xsl:if>
</xsl:template>

<xsl:template name="properties">
	<xsl:if test="property">
		<ul>
			<xsl:apply-templates select="property"/>
		</ul>
	</xsl:if>
</xsl:template>

<!-- arguments and properties are rendered the same way and nest -->
<xsl:template match="argument|property">
	<li>
		<div>
			<strong><xsl:value-of select="@name"/></strong>
			<xsl:if test="@default"> (default: <code><xsl:value-of select="@default"/></code>)</xsl:if>
		</div>
		<div>Type: <xsl:call-template name="render-types"/></div>
		<div>
			<xsl:apply-templates select="desc"/>
			<xsl:call-template name="version-details">
				<xsl:with-param name="parens" select="true()"/>
			</xsl:call-template>
		</div>
		<xsl:if test="property">
			<ul>
				<xsl:apply-templates select="property"/>
			</ul>
		</xsl:if>
	</li>
</xsl:template>

<xsl:template name="version-details">
	<xsl:param name="parens" select="false()"/>
	<xsl:variable name="added" select="@added | added/text()"/>
	<xsl:variable name="deprecated" select="@deprecated | deprecated/text()"/>
	<xsl:variable name="removed" select="@removed | removed/text()"/>

	<xsl:if test="$added | $deprecated | $removed">
		<span class="version-details">
			<xsl:if test="$parens">
				<xsl:text> (</xsl:text>
			</xsl:if>
			<xsl:text>version</xsl:text>
			<xsl:if test="$added">
				<xsl:text> added: </xsl:text>
				<xsl:choose>
					<xsl:when test="$version-category-links">
						<a href="/category/version/{$added}/">
							<xsl:value-of select="$added"/>
						</a>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$added"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:if>
			<xsl:if test="$deprecated">
				<xsl:if test="$added">
					<xsl:text>,</xsl:text>
				</xsl:if>
				<xsl:text> deprecated: </xsl:text>
				<xsl:choose>
					<xsl:when test="$version-category-links">
						<a href="/category/version/{$deprecated}/">
							<xsl:value-of select="$deprecated"/>
						</a>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$deprecated"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:if>
			<xsl:if test="$removed">
				<xsl:if test="$added | $deprecated">
					<xsl:text>,</xsl:text>
				</xsl:if>
				<xsl:text> removed: </xsl:text>
				<xsl:choose>
					<xsl:when test="$version-category-links">
						<a href="/category/version/{$removed}/">
							<xsl:value-of select="$removed"/>
						</a>
					</xsl:when>
					<xsl:otherwise>
						<xsl:value-of select="$removed"/>
					</xsl:otherwise>
				</xsl:choose>
			</xsl:if>
			<xsl:if test="$parens">
				<xsl:text>)</xsl:text>
			</xsl:if>
		</span>
	</xsl:if>
</xsl:template>

<xsl:template name="widget-method">
	<xsl:param name="entry-name"/>
	<xsl:param name="method-name"/>

	<h3>
		<xsl:call-template name="method-signature">
			<xsl:with-param name="method-name" select="$method-name"/>
		</xsl:call-template>
		<xsl:call-template name="return-value"/>
	</h3>
	<div>
		<xsl:apply-templates select="desc">
			<xsl:with-param name="entry-name" select="$entry-name"/>
		</xsl:apply-templates>
		<xsl:call-template name="version-details">
			<xsl:with-param name="parens" select="true()"/>
		</xsl:call-template>
	</div>
	<xsl:call-template name="arguments"/>
</xsl:template>

<xsl:template name="widget-event">
	<xsl:param name="entry-name"/>
	<xsl:param name="event-name"/>
	<xsl:param name="widget-name"/>
	<xsl:variable name="event-prefix">
		<xsl:choose>
			<xsl:when test="//entry/@event-prefix">
				<xsl:value-of select="//entry/@event-prefix"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$widget-name"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>
	<xsl:variable name="event-type">
		<xsl:choose>
			<xsl:when test="$event-name = $event-prefix">
				<xsl:value-of select="translate($event-name, $uppercase, $lowercase)"/>
			</xsl:when>
			<xsl:otherwise>
				<xsl:value-of select="$event-prefix"/>
				<xsl:value-of select="translate($event-name, $uppercase, $lowercase)"/>
			</xsl:otherwise>
		</xsl:choose>
	</xsl:variable>

	<h3>
		<xsl:call-template name="method-signature">
			<xsl:with-param name="method-name" select="$event-name"/>
		</xsl:call-template>
		<span class="returns">Type: <code><xsl:value-of select="$event-type"/></code></span>
	</h3>
	<div>
		<xsl:apply-templates select="desc">
			<xsl:with-param name="entry-name" select="$entry-name"/>
		</xsl:apply-templates>
		<xsl:call-template name="version-details">
			<xsl:with-param name="parens" select="true()"/>
		</xsl:call-template>
	</div>
	<xsl:call-template name="arguments"/>

	<div>
		<strong>Code examples:</strong>

		<p>Initialize the <xsl:value-of select="$widget-name"/> with the <xsl:value-of select="@name"/> callback specified:</p>
		<pre><code data-lang="javascript">
			<xsl:text>$( ".selector" ).</xsl:text>
			<xsl:value-of select="$widget-name"/>
			<xsl:text>({&#xA;&#x9;</xsl:text>
			<xsl:value-of select="@name"/>
			<xsl:text>: function( event, ui ) {}&#xA;});</xsl:text>
		</code></pre>

		<p>Bind an event listener to the <xsl:value-of select="$event-type"/> event:</p>
		<pre><code data-lang="javascript">
			$( ".selector" ).on( "<xsl:value-of select="$event-type"/>", function( event, ui ) {} );
		</code></pre>
	</div>
</xsl:template>

<!-- <desc> and <longdesc> support <placeholder name="foo"> to replace the
placeholder with @foo from the <entry> -->
<xsl:template match="desc|longdesc">
	<xsl:param name="entry-name"/>
	<xsl:apply-templates select="./node()">
		<xsl:with-param name="entry-name" select="$entry-name"/>
	</xsl:apply-templates>
</xsl:template>
<!-- This makes elements and attributes get copied over properly -->
<xsl:template match="desc//*|desc//@*|longdesc//*|longdesc//@*">
	<xsl:copy>
		<xsl:apply-templates select="@* | node()"/>
	</xsl:copy>
</xsl:template>
<!-- <xi:include> will add an xml:base attribute, so we strip it out -->
<xsl:template match="//@xml:base"/>
<!-- replace the <placeholder> with the associated attribute from the entry -->
<xsl:template match="//placeholder">
	<xsl:variable name="name" select="@name"/>
	<xsl:choose>
		<xsl:when test="$name = 'name'">
			<xsl:choose>
				<xsl:when test="ancestor::entry/@widget-name">
					<xsl:value-of select="ancestor::entry/@widget-name"/>
				</xsl:when>
				<xsl:otherwise>
					<xsl:value-of select="ancestor::entry/@name"/>
				</xsl:otherwise>
			</xsl:choose>
		</xsl:when>
		<xsl:otherwise>
			<xsl:value-of select="ancestor::entry/@*[name()=$name]"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:template>

<!-- escape-string, from xml2json.xsl -->
<xsl:template name="escape-string"><xsl:param name="s"/><xsl:text>"</xsl:text><xsl:call-template name="escape-bs-string"><xsl:with-param name="s" select="$s"/></xsl:call-template><xsl:text>"</xsl:text></xsl:template><xsl:template name="escape-bs-string"><xsl:param name="s"/><xsl:choose><xsl:when test="contains($s,'\')"><xsl:call-template name="escape-quot-string"><xsl:with-param name="s" select="concat(substring-before($s,'\'),'\\')"/></xsl:call-template><xsl:call-template name="escape-bs-string"><xsl:with-param name="s" select="substring-after($s,'\')"/></xsl:call-template></xsl:when><xsl:otherwise><xsl:call-template name="escape-quot-string"><xsl:with-param name="s" select="$s"/></xsl:call-template></xsl:otherwise></xsl:choose></xsl:template><xsl:template name="escape-quot-string"><xsl:param name="s"/><xsl:choose><xsl:when test="contains($s,'&quot;')"><xsl:call-template name="encode-string"><xsl:with-param name="s" select="concat(substring-before($s,'&quot;'),'\&quot;')"/></xsl:call-template><xsl:call-template name="escape-quot-string"><xsl:with-param name="s" select="substring-after($s,'&quot;')"/></xsl:call-template></xsl:when><xsl:otherwise><xsl:call-template name="encode-string"><xsl:with-param name="s" select="$s"/></xsl:call-template></xsl:otherwise></xsl:choose></xsl:template><xsl:template name="encode-string"><xsl:param name="s"/><xsl:choose><!-- tab --><xsl:when test="contains($s,'&#x9;')"><xsl:call-template name="encode-string"><xsl:with-param name="s" select="concat(substring-before($s,'&#x9;'),'\t',substring-after($s,'&#x9;'))"/></xsl:call-template></xsl:when><!-- line feed --><xsl:when test="contains($s,'&#xA;')"><xsl:call-template name="encode-string"><xsl:with-param name="s" select="concat(substring-before($s,'&#xA;'),'\n',substring-after($s,'&#xA;'))"/></xsl:call-template></xsl:when><!-- carriage return --><xsl:when test="contains($s,'&#xD;')"><xsl:call-template name="encode-string"><xsl:with-param name="s" select="concat(substring-before($s,'&#xD;'),'\r',substring-after($s,'&#xD;'))"/></xsl:call-template></xsl:when><xsl:otherwise><xsl:value-of select="$s"/></xsl:otherwise></xsl:choose></xsl:template>

</xsl:stylesheet>
