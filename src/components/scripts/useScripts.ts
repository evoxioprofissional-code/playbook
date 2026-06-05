"use client";

import { useCallback, useEffect, useState } from "react";
import {
  loadScripts,
  persistScripts,
  newId,
  type SavedScript,
} from "@/lib/scriptsStore";

export function useScripts() {
  const [scripts, setScripts] = useState<SavedScript[]>([]);

  useEffect(() => {
    setScripts(loadScripts());
    const onSync = () => setScripts(loadScripts());
    window.addEventListener("j2a-scripts-changed", onSync);
    return () => window.removeEventListener("j2a-scripts-changed", onSync);
  }, []);

  const setAll = useCallback((list: SavedScript[]) => {
    setScripts(list);
    persistScripts(list);
  }, []);

  const save = useCallback(
    (s: SavedScript) => {
      const list = loadScripts();
      const exists = list.some((x) => x.id === s.id);
      const next = exists ? list.map((x) => (x.id === s.id ? s : x)) : [{ ...s, id: s.id || newId() }, ...list];
      setAll(next);
    },
    [setAll]
  );

  const remove = useCallback(
    (id: string) => setAll(loadScripts().filter((x) => x.id !== id)),
    [setAll]
  );

  return { scripts, save, remove };
}
