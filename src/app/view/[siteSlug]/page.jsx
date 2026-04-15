import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SiteRootRedirect({ params }) {
  const resolvedParams = await params;
  // Redirect to viewing the index/home page normally mapped as 'home'
  // Alternatively we could query Prisma for the "home" page of this site.
  return redirect(`/view/${resolvedParams.siteSlug}/home`);
}
