import { useEffect, useState } from 'react';
import { WhatsNewModal } from '@/components/WhatsNewModal';
import { shouldShowWhatsNew } from '@/utils/changelog';
import {
  fetchChangelog,
  getCurrentVersion,
  getLastSeenVersion,
  markVersionSeen,
} from '@/utils/updateChecker';

/**
 * Detects a version change on launch and, when the app was just updated, shows
 * the "What's new" popup with the current release's notes. The version is
 * marked seen regardless of whether notes loaded, so the popup never nags and a
 * fresh install (no stored version) shows nothing.
 */
export function WhatsNewGate(): React.JSX.Element | null {
  const [notes, setNotes] = useState<string | null>(null);
  const version = getCurrentVersion();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const lastSeen = await getLastSeenVersion();
      if (!shouldShowWhatsNew(lastSeen, version)) {
        if (lastSeen === null) await markVersionSeen(version);
        return;
      }
      const fetched = await fetchChangelog(version);
      await markVersionSeen(version);
      if (!cancelled && fetched !== null && fetched.length > 0) setNotes(fetched);
    })();
    return () => {
      cancelled = true;
    };
  }, [version]);

  if (notes === null) return null;
  return (
    <WhatsNewModal
      visible
      version={version}
      notes={notes}
      onDismiss={() => setNotes(null)}
    />
  );
}
