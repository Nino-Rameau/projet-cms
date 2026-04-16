import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { siteSlug } = await params;

  const site = await prisma.site.findUnique({
    where: { slug: siteSlug },
    select: { isPublic: true, noIndex: true, domain: true },
  });

  const blocked = !site || !site.isPublic || site.noIndex;
  const appDomain = process.env.CMS_DOMAIN || req.headers.get('host') || 'localhost';
  const sitemapUrl = site?.domain
    ? `https://${site.domain}/sitemap.xml`
    : `https://${appDomain}/view/${siteSlug}/sitemap.xml`;

  const content = blocked
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\n\nSitemap: ${sitemapUrl}\n`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
