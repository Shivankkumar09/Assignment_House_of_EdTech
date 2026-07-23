"use client";

import { useEffect, useState } from "react";
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

  return (
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
  );
}
