<?xml version="1.0"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

<xsl:import href="notes.xsl"/>

<xsl:template match="/">
	<api>
		<categories>
			<xsl:apply-templates select="document('categories.xml')/categories/category"/>
		</categories>
		<entries>
			<xsl:for-each select="//entry">
				<xsl:apply-templates select="document(@file)//entry"/>
			</xsl:for-each>
		</entries>
	</api>
</xsl:template>

<xsl:template match="*|@*">
	<xsl:copy>
		<xsl:apply-templates select="@* | node()"/>
	</xsl:copy>
</xsl:template>

<!-- Strip out xml:base attributes from includes -->
<xsl:template match="@xml:base"/>

<!-- Category descriptions are CDATA, so we want to avoid escaping -->
<xsl:template match="category/desc">
	<desc>
		<xsl:value-of select="text()" disable-output-escaping="yes"/>
	</desc>
</xsl:template>

<!-- Merge notes into the entries -->
<xsl:template match="note">
	<note>
		<xsl:call-template name="note"/>
	</note>
</xsl:template>

<!-- Replace <placeholder> with the associated attribute from the entry -->
<xsl:template match="placeholder">
	<xsl:variable name="name" select="@name"/>
	<xsl:value-of select="ancestor::entry/@*[name()=$name]"/>
</xsl:template>

</xsl:stylesheet>
