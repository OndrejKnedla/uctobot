import { getAllPosts } from '@/lib/blog';

export async function GET() {
  const posts = getAllPosts();
  
  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>DokladBot Blog - Poradna pro OSVČ</title>
    <description>Užitečné články o účetnictví, daních a podnikání pro OSVČ</description>
    <link>https://www.dokladbot.cz/blog</link>
    <language>cs</language>
    <atom:link href="https://www.dokladbot.cz/blog/rss.xml" rel="self" type="application/rss+xml"/>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    ${posts
      .map(
        (post) => `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <description><![CDATA[${post.metaDescription}]]></description>
      <link>https://www.dokladbot.cz/blog/${post.slug}</link>
      <guid isPermaLink="true">https://www.dokladbot.cz/blog/${post.slug}</guid>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <category>${post.category}</category>
      <author>noreply@dokladbot.cz (${post.author})</author>
    </item>`
      )
      .join('')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate',
    },
  });
}