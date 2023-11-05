<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

<xsl:import href="tasks/jquery-xml/entries2html-base.xsl"/>

<xsl:template name="example-code">
&lt;!doctype html&gt;
<xsl:if test="css">&lt;style&gt;<xsl:value-of select="css/text()"/>	&lt;/style&gt;</xsl:if>
<xsl:copy-of select="html/text()"/>
</xsl:template>

</xsl:stylesheet>
