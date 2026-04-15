import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { notFound, redirect } from "next/navigation";
import EditorClient from "./EditorClient";

export default async function EditorPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) return redirect("/dashboard");

  const resolvedParams = await params;
  const { siteSlug, pagePath } = resolvedParams;

  const pageSlug = pagePath[pagePath.length - 1];

  const membership = await prisma.member.findFirst({
    where: { 
      userId: session.user.id,
      site: { slug: siteSlug }
    },
    include: {
      site: true
    }
  });

  if (!membership) return redirect("/dashboard");
  if (membership.role === 'READER') return redirect(`/dashboard/${siteSlug}`);

  const page = await prisma.page.findUnique({
    where: {
      siteId_slug: {
        siteId: membership.site.id,
        slug: pageSlug,
      },
    },
  });

  if (!page) return notFound();

  // On parse les blocs et les paramètres de page côté client (rétrocompatible)
  let initialBlocks = [];
  let initialPageSettings = {};
  try {
    const parsed = page.content
      ? (Array.isArray(page.content) || typeof page.content === 'object' ? page.content : JSON.parse(page.content))
      : [];

    if (Array.isArray(parsed)) {
      initialBlocks = parsed;
      initialPageSettings = {};
    } else {
      initialBlocks = Array.isArray(parsed?.blocks) ? parsed.blocks : [];
      initialPageSettings = parsed?.settings && typeof parsed.settings === 'object' ? parsed.settings : {};
    }
  } catch(e) {
    initialBlocks = [];
    initialPageSettings = {};
  }

  return (
    <EditorClient 
      siteSlug={siteSlug} 
      pagePath={pagePath} 
      pageId={page.id} 
      initialBlocks={initialBlocks} 
      initialPageSettings={initialPageSettings}
    />
  );
}
