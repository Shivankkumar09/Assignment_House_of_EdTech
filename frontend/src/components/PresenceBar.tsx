"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import type { WebsocketProvider } from "y-websocket";

interface Peer {
  clientId: number;
  name: string;
  color: string;
}

function nameInitial(name: string): string {
  return (name.charAt(0) || "?").toUpperCase();
}

export default function PresenceBar({ provider }: { provider: WebsocketProvider }) {
  const [peers, setPeers] = useState<Peer[]>([]);

  useEffect(() => {
    const update = () => {
      const states = provider.awareness.getStates();
      const list: Peer[] = [];
      states.forEach((state: { user?: { name?: string; color?: string } }, clientId: number) => {
        const name = state.user?.name?.trim();
        if (!name) return;
        list.push({
          clientId,
          name,
          color: state.user?.color ?? "#888888",
        });
      });
      setPeers(list);
    };
    provider.awareness.on("change", update);
    update();
    return () => provider.awareness.off("change", update);
  }, [provider]);

  if (peers.length === 0) return null;

  const namesLabel = peers.map((p) => p.name).join(", ");

  return (
    <div
      className="flex items-center gap-2 rounded-md border border-ink-200 bg-ink-50 px-2 py-1"
      title={namesLabel}
    >
      <div className="flex items-center gap-1 text-xs font-medium text-ink-600">
        <Users size={13} className="shrink-0 text-signal" />
        <span>
          {peers.length} online
        </span>
      </div>
      <div className="hidden h-4 w-px bg-ink-200 sm:block" />
      <div className="flex items-center -space-x-2">
        {peers.slice(0, 5).map((p) => (
          <div
            key={p.clientId}
            title={p.name}
            className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white text-[11px] font-semibold text-white shadow-sm"
            style={{ backgroundColor: p.color }}
          >
            {nameInitial(p.name)}
          </div>
        ))}
        {peers.length > 5 && (
          <div className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-ink-300 text-[11px] font-semibold text-white">
            +{peers.length - 5}
          </div>
        )}
      </div>
      <span className="hidden max-w-[140px] truncate text-xs text-ink-500 md:inline">
        {namesLabel}
      </span>
    </div>
  );
}
