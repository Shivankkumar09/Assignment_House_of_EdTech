"use client";

import { Cloud, CloudOff, RefreshCw, HardDrive } from "lucide-react";
import type { SyncState } from "@/hooks/useYjsDocument";

export default function SyncStatusBadge({ status }: { status: SyncState }) {
  let icon = <HardDrive size={13} />;
  let text = "Loading local copy…";
  let tone = "bg-ink-100 text-ink-500";

  if (!status.indexedDbSynced) {
    icon = <HardDrive size={13} />;
    text = "Loading local copy…";
    tone = "bg-ink-100 text-ink-500";
  } else if (!status.online) {
    icon = <CloudOff size={13} />;
    text = "Offline — editing local copy";
    tone = "bg-amber/15 text-ink-700";
  } else if (!status.synced) {
    icon = <RefreshCw size={13} className="animate-spin" />;
    text = "Syncing…";
    tone = "bg-signal-soft text-signal-dark";
  } else {
    icon = <Cloud size={13} />;
    text = "All changes synced";
    tone = "bg-green-50 text-green-700";
  }

  return (
    <span className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${tone}`}>
      {icon}
      {text}
    </span>
  );
}
