import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const GLOBAL_SLUGS = ['__global-header', '__global-footer'];

function toW3CDate(date) {
  return new Date(date).toISOString().split('T')[0];
}

const EMPTY_SITEMAP = '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>';

export async function GET(req, { params }) {
  const { siteSlug } = await params;

  const site = await prisma.site.findUnique({
    where: { slug: siteSlug },
    select: {
      isPublic: true,
      noIndex: true,
      domain: true,
      pages: {
        where: { slug: { notIn: GLOBAL_SLUGS } },
        select: { slug: true, updatedAt: true, status: true },
      },
    },
  });

  const isPublic = site?.isPublic === true || site?.isPublic === 1;
  const noIndex = site?.noIndex === true || site?.noIndex === 1;

  if (!site || !isPublic || noIndex) {
    return new Response(EMPTY_SITEMAP, {
      status: 404,
      headers: { 'Content-Type': 'application/xml; charset=utf-8' },
    });
  }

  const publishedPages = site.pages.filter(p => String(p.status).toUpperCase() === 'PUBLISHED');

  const appDomain = process.env.CMS_DOMAIN || req.headers.get('host') || 'localhost';

  const urls = publishedPages.map((page) => {
    const loc = site.domain
      ? (page.slug === 'home' ? `https://${site.domain}/` : `https://${site.domain}/${page.slug}`)
      : `https://${appDomain}/view/${siteSlug}/${page.slug}`;
    return `  <url>\n    <loc>${loc}</loc>\n    <lastmod>${toW3CDate(page.updatedAt)}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>${page.slug === 'home' ? '1.0' : '0.8'}</priority>\n  </url>`;
  });

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
}
