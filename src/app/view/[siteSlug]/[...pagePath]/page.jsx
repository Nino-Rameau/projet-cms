import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import BlockRenderer from "@/components/view/BlockRenderer";
import HtmlLangSync from "@/components/ui/HtmlLangSync";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

const PAGE_SETTINGS_DEFAULTS = {
  metaTitle: '',
  metaDescription: '',
  noIndex: false,
  contentWidth: '100%',
  customClassName: '',
  backgroundColor: '',
  backgroundImage: '',
};

const stripHtml = (text = '') => String(text).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

const I18N = {
  fr: {
    pageNotFoundTitle: 'Page introuvable',
    pageNotFoundDescription: 'Cette page n\'existe pas.',
    emptyPage: 'Cette page est vide.',
    pageDescriptionPrefix: 'Page',
    siteDescriptionSuffix: 'du site',
  },
  en: {
    pageNotFoundTitle: 'Page not found',
    pageNotFoundDescription: 'This page does not exist.',
    emptyPage: 'This page is empty.',
    pageDescriptionPrefix: 'Page',
    siteDescriptionSuffix: 'from site',
  },
  es: {
    pageNotFoundTitle: 'Pagina no encontrada',
    pageNotFoundDescription: 'Esta pagina no existe.',
    emptyPage: 'Esta pagina esta vacia.',
    pageDescriptionPrefix: 'Pagina',
    siteDescriptionSuffix: 'del sitio',
  },
  de: {
    pageNotFoundTitle: 'Seite nicht gefunden',
    pageNotFoundDescription: 'Diese Seite existiert nicht.',
    emptyPage: 'Diese Seite ist leer.',
    pageDescriptionPrefix: 'Seite',
    siteDescriptionSuffix: 'von der Website',
  },
  it: {
    pageNotFoundTitle: 'Pagina non trovata',
    pageNotFoundDescription: 'Questa pagina non esiste.',
    emptyPage: 'Questa pagina e vuota.',
    pageDescriptionPrefix: 'Pagina',
    siteDescriptionSuffix: 'del sito',
  },
  pt: {
    pageNotFoundTitle: 'Pagina nao encontrada',
    pageNotFoundDescription: 'Esta pagina nao existe.',
    emptyPage: 'Esta pagina esta vazia.',
    pageDescriptionPrefix: 'Pagina',
    siteDescriptionSuffix: 'do site',
  },
};

const t = (language = 'fr') => I18N[language] || I18N.fr;

const parsePageContent = (content) => {
  try {
    if (!content) return { blocks: [], settings: {} };

    const parsed = Array.isArray(content) || typeof content === 'object' ? content : JSON.parse(content);

    if (Array.isArray(parsed)) {
      return { blocks: parsed, settings: {} };
    }

    return {
      blocks: Array.isArray(parsed?.blocks) ? parsed.blocks : [],
      settings: parsed?.settings && typeof parsed.settings === 'object' ? parsed.settings : {},
    };
  } catch {
    return { blocks: [], settings: {} };
  }
};

async function getViewData(params) {
  noStore();
  const resolvedParams = await params;
  const { siteSlug, pagePath } = resolvedParams;
  const pageSlug = pagePath[pagePath.length - 1];

  const site = await prisma.site.findUnique({ where: { slug: siteSlug } });
  if (!site) return null;

  if (!site.isPublic) {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const membership = await prisma.member.findFirst({
      where: {
        siteId: site.id,
        userId: session.user.id,
      },
    });

    if (!membership) return null;
  }

  const page = await prisma.page.findFirst({
    where: {
      siteId: site.id,
      slug: pageSlug,
      status: 'PUBLISHED',
    },
  });

  if (!page) return null;

  const [globalHeaderPage, globalFooterPage] = await Promise.all([
    prisma.page.findUnique({
      where: {
        siteId_slug: {
          siteId: site.id,
          slug: '__global-header',
        },
      },
    }),
    prisma.page.findUnique({
      where: {
        siteId_slug: {
          siteId: site.id,
          slug: '__global-footer',
        },
      },
    }),
  ]);

  const globalHeaderBlocks = parsePageContent(globalHeaderPage?.content).blocks;
  const pageParsed = parsePageContent(page.content);
  const pageBlocks = pageParsed.blocks;
  const pageSettings = { ...PAGE_SETTINGS_DEFAULTS, ...pageParsed.settings };
  const globalFooterBlocks = parsePageContent(globalFooterPage?.content).blocks;
  const blocks = [...globalHeaderBlocks, ...pageBlocks, ...globalFooterBlocks];

  return { resolvedParams, site, page, blocks, pageBlocks, pageSettings };
}

export async function generateMetadata({ params }) {
  const data = await getViewData(params);
  if (!data) {
    const locale = t('fr');
    return {
      title: locale.pageNotFoundTitle,
      description: locale.pageNotFoundDescription,
    };
  }

  const { site, page, pageBlocks, pageSettings } = data;
  const locale = t(site.language);
  const firstHeading = pageBlocks.find((b) => ['H1', 'H2', 'H3', 'heading', 'title'].includes(String(b?.type || '').toUpperCase()));
  const firstParagraph = pageBlocks.find((b) => ['Paragraph', 'Text'].includes(String(b?.type || '')));
  const title = pageSettings.metaTitle || stripHtml(firstHeading?.props?.content) || `${page.slug} - ${site.slug}`;
  const description = pageSettings.metaDescription || stripHtml(firstParagraph?.props?.content) || `${locale.pageDescriptionPrefix} ${page.slug} ${locale.siteDescriptionSuffix} ${site.slug}.`;

  return {
    title,
    description,
    robots: pageSettings.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title,
      description,
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

export default async function ViewPage({ params }) {
  const data = await getViewData(params);
  if (!data) return notFound();
  const { blocks, pageSettings, site } = data;
  const locale = t(site.language);
  const contentWidth = pageSettings.contentWidth || '100%';
  const mainMaxWidth = contentWidth === '100%' ? '100%' : contentWidth;

  const bgStyle = {
    backgroundColor: '#ffffff',
    backgroundImage: [
      pageSettings.backgroundImage || '',
      pageSettings.backgroundColor && pageSettings.backgroundColor !== 'transparent' 
        ? `linear-gradient(${pageSettings.backgroundColor}, ${pageSettings.backgroundColor})` 
        : ''
    ].filter(Boolean).join(', ') || undefined,
  };

  return (
    <div 
      className="min-h-screen text-slate-900" 
      lang={site.language || 'fr'}
      style={bgStyle}
    >
      <HtmlLangSync lang={site.language || 'fr'} />
      {blocks.length === 0 ? (
        <div className="flex items-center justify-center min-h-[60vh] text-slate-500 font-medium">
          {locale.emptyPage}
        </div>
      ) : (
        <main lang={site.language || 'fr'} className={`mx-auto space-y-5 ${pageSettings.customClassName || ''}`} style={{ width: '100%', maxWidth: mainMaxWidth }}>
          {blocks.map(block => <BlockRenderer key={block.id} block={block} siteSlug={site.slug} />)}
        </main>
      )}
    </div>
  );
}
