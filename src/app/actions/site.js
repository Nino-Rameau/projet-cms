"use server"
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";

const GLOBAL_HEADER_SLUG = "__global-header";
const GLOBAL_FOOTER_SLUG = "__global-footer";

class ActionError extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
}

function throwActionError(code) {
  throw new ActionError(code);
}

function isNextRedirectError(error) {
  return typeof error?.digest === "string" && error.digest.startsWith("NEXT_REDIRECT");
}

function getErrorCode(error, fallbackCode) {
  if (error instanceof ActionError) return error.code;
  if (error?.code === "P2002") return "duplicate_value";
  return fallbackCode;
}

function redirectWithParams(path, params = {}) {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    searchParams.set(key, String(value));
  }

  const query = searchParams.toString();
  redirect(query ? `${path}?${query}` : path);
}

function getSiteDashboardPath(siteSlug) {
  return siteSlug ? `/dashboard/${siteSlug}` : "/dashboard";
}

async function logPageModification({ pageId, userId, action = 'UPDATE' }) {
  await prisma.pageModification.create({
    data: {
      pageId,
      userId,
      action,
    },
  });
}

export async function createNewSite(formData) {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirectWithParams("/", { error: "session_expired" });
  }

  const userId = session.user.id;
  const name = String(formData.get("name") || '').trim();
  const encodedName = encodeURIComponent(name);

  if (!name) {
    redirect('/dashboard?error=site_name_required');
  }
  
  // Générer un slug unique
  const baseSlug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');

  if (!baseSlug) {
    redirect(`/dashboard?error=invalid_site_name&name=${encodedName}`);
  }

  const finalSlug = `${baseSlug}`;

  const existingSite = await prisma.site.findUnique({
    where: { slug: finalSlug },
    select: { id: true },
  });

  if (existingSite) {
    redirect(`/dashboard?error=site_slug_taken&name=${encodedName}`);
  }

  let newSite;
  try {
    newSite = await prisma.site.create({
      data: {
        name,
        slug: finalSlug,
        members: {
          create: {
            role: "OWNER",
            userId: userId
          }
        },
        pages: {
          create: [
            {
              title: "Accueil",
              slug: "home",
              status: "PUBLISHED",
              content: [] // Bloc JSON vide
            },
            {
              title: "Header Global",
              slug: GLOBAL_HEADER_SLUG,
              status: "DRAFT",
              content: [],
            },
            {
              title: "Footer Global",
              slug: GLOBAL_FOOTER_SLUG,
              status: "DRAFT",
              content: [],
            },
          ]
        }
      }
    });
  } catch (error) {
    if (error?.code === 'P2002') {
      redirect(`/dashboard?error=site_slug_taken&name=${encodedName}`);
    }
    redirect(`/dashboard?error=site_create_failed&name=${encodedName}`);
  }

  redirect(`/dashboard/${newSite.slug}`);
}

export async function createNewPage(formData) {
  const siteSlug = String(formData.get("siteSlug") || "");
  const siteDashboardPath = getSiteDashboardPath(siteSlug);

  try {
    const session = await getServerSession(authOptions);
    if (!session) throwActionError("unauthorized");

    const siteId = String(formData.get("siteId") || "");
    const title = String(formData.get("title") || "").trim();
    const parentId = formData.get("parentId") || null;

    if (!siteId) throwActionError("site_not_found");
    if (!title) throwActionError("page_title_required");

    const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
    if (!slug) throwActionError("page_slug_invalid");

    await requireEditableMembership(siteId, session.user.id);

    const createdPage = await prisma.page.create({
      data: {
        title,
        slug,
        status: "DRAFT",
        content: [],
        siteId,
        parentId: parentId !== "null" ? parentId : null,
      },
    });

    await logPageModification({
      pageId: createdPage.id,
      userId: session.user.id,
      action: "CREATE",
    });

    redirectWithParams(siteDashboardPath, { siteSuccess: "page_created" });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirectWithParams(siteDashboardPath, { siteError: getErrorCode(error, "page_create_failed") });
  }
}

export async function updatePageStatus(formData) {
  const siteSlug = String(formData.get("siteSlug") || "");
  const siteDashboardPath = getSiteDashboardPath(siteSlug);

  try {
    const session = await getServerSession(authOptions);
    if (!session) throwActionError("unauthorized");

    const pageId = String(formData.get("pageId") || "");
    const status = String(formData.get("status") || "").toUpperCase();
    if (!pageId) throwActionError("page_not_found");
    if (!["DRAFT", "PUBLISHED"].includes(status)) throwActionError("invalid_status");

    const page = await prisma.page.findUnique({ where: { id: pageId }, select: { siteId: true } });
    if (!page) throwActionError("page_not_found");

    await requireEditableMembership(page.siteId, session.user.id);

    await prisma.page.update({
      where: { id: pageId },
      data: { status },
    });

    await logPageModification({
      pageId,
      userId: session.user.id,
      action: "STATUS_CHANGE",
    });

    redirectWithParams(siteDashboardPath, { siteSuccess: "page_status_updated" });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirectWithParams(siteDashboardPath, { siteError: getErrorCode(error, "page_status_update_failed") });
  }
}

export async function updatePageDetails(formData) {
  const siteSlug = String(formData.get("siteSlug") || "");
  const siteDashboardPath = getSiteDashboardPath(siteSlug);

  try {
    const session = await getServerSession(authOptions);
    if (!session) throwActionError("unauthorized");

    const pageId = String(formData.get("pageId") || "");
    const title = String(formData.get("title") || "").trim();
    const slug = String(formData.get("slug") || "").trim();

    if (!pageId) throwActionError("page_not_found");
    if (!title) throwActionError("page_title_required");
    if (!slug) throwActionError("page_slug_required");

    const page = await prisma.page.findUnique({ where: { id: pageId }, select: { siteId: true } });
    if (!page) throwActionError("page_not_found");

    await requireEditableMembership(page.siteId, session.user.id);

    await prisma.page.update({
      where: { id: pageId },
      data: { title, slug },
    });

    await logPageModification({
      pageId,
      userId: session.user.id,
      action: "DETAILS_UPDATE",
    });

    redirectWithParams(siteDashboardPath, { siteSuccess: "page_updated" });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirectWithParams(siteDashboardPath, { siteError: getErrorCode(error, "page_update_failed") });
  }
}

export async function deletePage(formData) {
  const siteSlug = String(formData.get("siteSlug") || "");
  const siteDashboardPath = getSiteDashboardPath(siteSlug);

  try {
    const session = await getServerSession(authOptions);
    if (!session) throwActionError("unauthorized");

    const pageId = String(formData.get("pageId") || "");
    if (!pageId) throwActionError("page_not_found");

    const page = await prisma.page.findUnique({ where: { id: pageId }, select: { siteId: true } });
    if (!page) throwActionError("page_not_found");

    await requireEditableMembership(page.siteId, session.user.id);

    await prisma.page.delete({
      where: { id: pageId },
    });

    redirectWithParams(siteDashboardPath, { siteSuccess: "page_deleted" });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirectWithParams(siteDashboardPath, { siteError: getErrorCode(error, "page_delete_failed") });
  }
}

export async function savePageContent(pageId, content) {
  const session = await getServerSession(authOptions);
  if (!session) throw new Error("Non autorisé");

  const page = await prisma.page.findUnique({ where: { id: pageId }, select: { siteId: true } });
  if (!page) throw new Error('Page introuvable');

  await requireEditableMembership(page.siteId, session.user.id);

  const normalizedContent = (() => {
    if (Array.isArray(content)) {
      return { blocks: content, settings: {} };
    }

    if (content && typeof content === 'object') {
      return {
        blocks: Array.isArray(content.blocks) ? content.blocks : [],
        settings: content.settings && typeof content.settings === 'object' ? content.settings : {},
      };
    }

    return { blocks: [], settings: {} };
  })();

  await prisma.page.update({
    where: { id: pageId },
    data: { content: normalizedContent } // Prisma JSON store handles objects automatically if using Prisma Json type
  });

  await logPageModification({
    pageId,
    userId: session.user.id,
    action: 'CONTENT_UPDATE',
  });

  return { success: true };
}

function uid(prefix = 'block') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function createHeaderTemplate() {
  return {
    id: uid('section'),
    type: 'Section',
    props: {
      style: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
        gap: '16px',
        alignItems: 'center',
        padding: '20px',
        backgroundColor: '#0f172a',
        color: '#ffffff',
      },
    },
    children: [
      {
        id: uid('container'),
        type: 'Container',
        props: {
          style: {
            backgroundColor: 'transparent',
            border: 'none',
          },
        },
        children: [
          {
            id: uid('title'),
            type: 'H2',
            props: { content: 'Mon Site', style: { color: '#000000', margin: '0' } },
            children: [],
          },
        ],
      },
      {
        id: uid('container'),
        type: 'Container',
        props: {
          style: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
            backgroundColor: 'transparent',
            border: 'none',
          },
        },
        children: [
          {
            id: uid('btn'),
            type: 'Button',
            props: { content: 'Accueil', actionType: 'page', pagePath: 'home' },
            children: [],
          },
          {
            id: uid('btn'),
            type: 'Button',
            props: { content: 'Contact', actionType: 'link', href: '#' },
            children: [],
          },
        ],
      },
    ],
  };
}

function createFooterTemplate() {
  return {
    id: uid('section'),
    type: 'Section',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        padding: '24px',
        backgroundColor: '#111827',
        color: '#e5e7eb',
        borderRadius: '12px',
      },
    },
    children: [
      {
        id: uid('p'),
        type: 'Paragraph',
        props: { content: '© 2026 Mon Site - Tous droits réservés.', style: { color: '#e5e7eb', margin: '0' } },
        children: [],
      },
      {
        id: uid('p'),
        type: 'Paragraph',
        props: { content: '<a href="#" style="color:#93c5fd">Mentions légales</a> · <a href="#" style="color:#93c5fd">Politique de confidentialité</a>', style: { margin: '0' } },
        children: [],
      },
    ],
  };
}

function parsePageBlocks(content) {
  if (Array.isArray(content)) return content;
  if (content && typeof content === 'object' && Array.isArray(content.blocks)) return content.blocks;
  return [];
}

export async function addSiteComponentTemplate(formData) {
  const siteSlug = String(formData.get("siteSlug") || "");
  const siteDashboardPath = getSiteDashboardPath(siteSlug);

  try {
    const session = await getServerSession(authOptions);
    if (!session) throwActionError("unauthorized");

    const siteId = String(formData.get("siteId") || "");
    const componentType = String(formData.get("componentType") || "").trim().toLowerCase();

    await requireEditableMembership(siteId, session.user.id);

    const targetSlug = componentType === "header" ? GLOBAL_HEADER_SLUG : componentType === "footer" ? GLOBAL_FOOTER_SLUG : null;
    if (!targetSlug) throwActionError("unknown_component");

    let globalPage = await prisma.page.findUnique({
      where: {
        siteId_slug: {
          siteId,
          slug: targetSlug,
        },
      },
    });

    if (!globalPage) {
      globalPage = await prisma.page.create({
        data: {
          title: targetSlug === GLOBAL_HEADER_SLUG ? "Header Global" : "Footer Global",
          slug: targetSlug,
          status: "DRAFT",
          content: [],
          siteId,
        },
      });
    }

    const blocks = parsePageBlocks(globalPage.content);

    let templateBlock = null;
    if (componentType === "header") templateBlock = createHeaderTemplate();
    if (componentType === "footer") templateBlock = createFooterTemplate();

    const nextBlocks = componentType === "header" ? [templateBlock, ...blocks] : [...blocks, templateBlock];

    await prisma.page.update({
      where: { id: globalPage.id },
      data: { content: nextBlocks },
    });

    redirectWithParams(siteDashboardPath, { siteSuccess: "global_component_added" });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirectWithParams(siteDashboardPath, { siteError: getErrorCode(error, "global_component_add_failed") });
  }
}

export async function editSiteGlobalComponent(formData) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      redirectWithParams("/", { error: "session_expired" });
    }

    const siteId = String(formData.get("siteId") || "");
    const siteSlug = String(formData.get("siteSlug") || "");
    const siteDashboardPath = getSiteDashboardPath(siteSlug);
    const componentType = String(formData.get("componentType") || "").trim().toLowerCase();

    await requireEditableMembership(siteId, session.user.id);

    const targetSlug = componentType === "header" ? GLOBAL_HEADER_SLUG : componentType === "footer" ? GLOBAL_FOOTER_SLUG : null;
    if (!targetSlug) throwActionError("unknown_component");

    let globalPage = await prisma.page.findUnique({
      where: {
        siteId_slug: {
          siteId,
          slug: targetSlug,
        },
      },
    });

    if (!globalPage) {
      globalPage = await prisma.page.create({
        data: {
          title: targetSlug === GLOBAL_HEADER_SLUG ? "Header Global" : "Footer Global",
          slug: targetSlug,
          status: "DRAFT",
          content: { blocks: [], settings: {} },
          siteId,
        },
      });
    }

    const currentBlocks = parsePageBlocks(globalPage.content);
    if (currentBlocks.length === 0) {
      const templateBlock = componentType === "header" ? createHeaderTemplate() : createFooterTemplate();
      await prisma.page.update({
        where: { id: globalPage.id },
        data: {
          content: {
            blocks: [templateBlock],
            settings: {},
          },
        },
      });
    }

    redirect(`/editor/${siteSlug}/edit/${targetSlug}`);
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    const siteSlug = String(formData.get("siteSlug") || "");
    const siteDashboardPath = getSiteDashboardPath(siteSlug);
    redirectWithParams(siteDashboardPath, { siteError: getErrorCode(error, "global_component_open_failed") });
  }
}

export async function updateSiteSettings(formData) {
  const siteSlug = String(formData.get("siteSlug") || "");
  const settingsPath = `${getSiteDashboardPath(siteSlug)}/settings`;

  try {
    const session = await getServerSession(authOptions);
    if (!session) throwActionError("unauthorized");

    const siteId = String(formData.get("siteId") || "");
    const name = String(formData.get("name") || "").trim();
    const description = String(formData.get("description") || "").trim();
    const domainRaw = String(formData.get("domain") || "").trim();
    const languageRaw = String(formData.get("language") || "fr").trim().toLowerCase();
    const isPublic = formData.get("isPublic") === "on";

    await requireEditableMembership(siteId, session.user.id);

    const allowedLanguages = new Set(["fr", "en", "es", "de", "it", "pt"]);
    const language = allowedLanguages.has(languageRaw) ? languageRaw : "fr";

    await prisma.site.update({
      where: { id: siteId },
      data: {
        name: name || "Mon site",
        description: description || null,
        domain: domainRaw || null,
        language,
        isPublic,
      },
    });

    redirectWithParams(settingsPath, { settingsSuccess: "updated" });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirectWithParams(settingsPath, { settingsError: getErrorCode(error, "settings_update_failed") });
  }
}

export async function deleteSite(formData) {
  const siteSlug = String(formData.get("siteSlug") || "");
  const settingsPath = `${getSiteDashboardPath(siteSlug)}/settings`;

  try {
    const session = await getServerSession(authOptions);
    if (!session) throwActionError("unauthorized");

    const siteId = String(formData.get("siteId") || "");

    await requireOwnerMembership(siteId, session.user.id);

    await prisma.site.delete({
      where: { id: siteId },
    });

    redirectWithParams("/dashboard", { success: "site_deleted" });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirectWithParams(settingsPath, { dangerError: getErrorCode(error, "site_delete_failed") });
  }
}

async function requireOwnerMembership(siteId, userId) {
  const membership = await requireSiteMembership(siteId, userId);

  if (membership.role !== 'OWNER') throwActionError('owner_required');

  return membership;
}

async function requireSiteMembership(siteId, userId) {
  const membership = await prisma.member.findFirst({
    where: {
      siteId,
      userId,
    },
  });

  if (!membership) throwActionError('site_access_denied');

  return membership;
}

async function requireEditableMembership(siteId, userId) {
  const membership = await requireSiteMembership(siteId, userId);
  if (membership.role === 'READER') throwActionError('read_only');
  return membership;
}

export async function inviteSiteMember(formData) {
  const siteSlug = String(formData.get("siteSlug") || "");
  const teamPath = `${getSiteDashboardPath(siteSlug)}/team`;

  try {
    const session = await getServerSession(authOptions);
    if (!session) throwActionError("unauthorized");

    const siteId = String(formData.get("siteId") || "");
    const email = String(formData.get("email") || "").trim().toLowerCase();
    const roleRaw = String(formData.get("role") || "EDITOR").trim().toUpperCase();
    const role = ["OWNER", "EDITOR", "READER"].includes(roleRaw) ? roleRaw : "EDITOR";

    if (!email) throwActionError("invite_email_required");

    await requireOwnerMembership(siteId, session.user.id);

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throwActionError("invite_user_not_found");

    const existing = await prisma.member.findFirst({
      where: {
        siteId,
        userId: user.id,
      },
    });

    if (existing) {
      await prisma.member.update({
        where: { id: existing.id },
        data: { role },
      });
      redirectWithParams(teamPath, { teamSuccess: "member_role_updated" });
    }

    await prisma.member.create({
      data: {
        siteId,
        userId: user.id,
        role,
      },
    });

    redirectWithParams(teamPath, { teamSuccess: "member_invited" });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirectWithParams(teamPath, { teamError: getErrorCode(error, "member_invite_failed") });
  }
}

export async function updateSiteMemberRole(formData) {
  const siteSlug = String(formData.get("siteSlug") || "");
  const teamPath = `${getSiteDashboardPath(siteSlug)}/team`;

  try {
    const session = await getServerSession(authOptions);
    if (!session) throwActionError("unauthorized");

    const siteId = String(formData.get("siteId") || "");
    const memberId = String(formData.get("memberId") || "");
    const roleRaw = String(formData.get("role") || "EDITOR").trim().toUpperCase();
    const role = ["OWNER", "EDITOR", "READER"].includes(roleRaw) ? roleRaw : "EDITOR";

    await requireOwnerMembership(siteId, session.user.id);

    const targetMember = await prisma.member.findUnique({ where: { id: memberId } });
    if (!targetMember || targetMember.siteId !== siteId) throwActionError("member_not_found");

    if (role === "OWNER") {
      await prisma.$transaction([
        prisma.member.updateMany({
          where: { siteId, role: "OWNER" },
          data: { role: "EDITOR" },
        }),
        prisma.member.update({
          where: { id: memberId },
          data: { role: "OWNER" },
        }),
      ]);
    } else {
      if (targetMember.role === "OWNER") {
        const ownersCount = await prisma.member.count({ where: { siteId, role: "OWNER" } });
        if (ownersCount <= 1) {
          throwActionError("owner_required");
        }
      }

      await prisma.member.update({
        where: { id: memberId },
        data: { role },
      });
    }

    redirectWithParams(teamPath, { teamSuccess: "member_role_updated" });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirectWithParams(teamPath, { teamError: getErrorCode(error, "member_role_update_failed") });
  }
}

export async function removeSiteMember(formData) {
  const siteSlug = String(formData.get("siteSlug") || "");
  const teamPath = `${getSiteDashboardPath(siteSlug)}/team`;

  try {
    const session = await getServerSession(authOptions);
    if (!session) throwActionError("unauthorized");

    const siteId = String(formData.get("siteId") || "");
    const memberId = String(formData.get("memberId") || "");

    await requireOwnerMembership(siteId, session.user.id);

    const targetMember = await prisma.member.findUnique({ where: { id: memberId } });
    if (!targetMember || targetMember.siteId !== siteId) throwActionError("member_not_found");

    if (targetMember.role === "OWNER") {
      const ownersCount = await prisma.member.count({ where: { siteId, role: "OWNER" } });
      if (ownersCount <= 1) {
        throwActionError("owner_required");
      }
    }

    await prisma.member.delete({ where: { id: memberId } });

    redirectWithParams(teamPath, { teamSuccess: "member_removed" });
  } catch (error) {
    if (isNextRedirectError(error)) throw error;
    redirectWithParams(teamPath, { teamError: getErrorCode(error, "member_remove_failed") });
  }
}
