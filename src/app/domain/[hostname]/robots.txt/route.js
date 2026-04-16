import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req, { params }) {
  const { hostname } = await params;

  const site = await prisma.site.findUnique({
    where: { domain: hostname },
    select: { isPublic: true, noIndex: true, slug: true },
  });

  const blocked = !site || !site.isPublic || site.noIndex;

  const content = blocked
    ? `User-agent: *\nDisallow: /\n`
    : `User-agent: *\nAllow: /\n\nSitemap: https://${hostname}/sitemap.xml\n`;

  return new Response(content, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
