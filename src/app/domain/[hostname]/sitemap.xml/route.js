import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const GLOBAL_SLUGS = ['__global-header', '__global-footer'];

function toW3CDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

export async function GET(req, { params }) {
  const { hostname } = await params;

  const site = await prisma.site.findUnique({
    where: { domain: hostname },
    select: {
      isPublic: true,
      noIndex: true,
      updatedAt: true,
      pages: {
        where: { slug: { notIn: GLOBAL_SLUGS } },
        select: { slug: true, updatedAt: true, status: true },
      },
    },
  });

  if (!site || !site.isPublic || site.noIndex) {
    return new Response('<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>', {
      status: 404,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }

  const publishedPages = site.pages.filter(p => p.status === 'PUBLISHED');
  const base = `https://${hostname}`;

  const urls = publishedPages.map((page) => {
    const loc = page.slug === 'home' ? base + '/' : `${base}/${page.slug}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${toW3CDate(page.updatedAt)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${page.slug === 'home' ? '1.0' : '0.8'}</priority>\n  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
