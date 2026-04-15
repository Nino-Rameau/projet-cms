'use client';

import { deleteSite } from '@/app/actions/site';

export default function DeleteSiteForm({ siteId, siteSlug, siteName }) {
  return (
    <form
      action={deleteSite}
      onSubmit={(e) => {
        if (!confirm(`Supprimer definitivement le site "${siteName}" ? Cette action est irreversible.`)) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="siteSlug" value={siteSlug} />
      <button
        type="submit"
        className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 transition"
      >
        Supprimer le site
      </button>
    </form>
  );
}
