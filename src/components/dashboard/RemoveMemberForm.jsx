'use client';

import { removeSiteMember } from '@/app/actions/site';

export default function RemoveMemberForm({ siteId, siteSlug, memberId }) {
  return (
    <form
      action={removeSiteMember}
      onSubmit={(e) => {
        if (!confirm('Supprimer ce membre du site ?')) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="siteId" value={siteId} />
      <input type="hidden" name="siteSlug" value={siteSlug} />
      <input type="hidden" name="memberId" value={memberId} />
      <button className="px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-xs font-semibold hover:bg-red-50 transition">
        Retirer
      </button>
    </form>
  );
}
