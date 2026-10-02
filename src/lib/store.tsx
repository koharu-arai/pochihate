"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { Item, Settings } from "./types";

const ITEMS_KEY = "pochihate-items-v1";
const SETTINGS_KEY = "pochihate-settings-v1";

type Store = {
  /** localStorage の読み込みが終わったか（それまでは空の状態で描画） */
  loaded: boolean;
  items: Item[];
  settings: Settings;
  putItem: (item: Item) => void;
  removeItem: (id: string) => void;
  setSettings: (patch: Partial<Settings>) => void;
  /** 30日リストから「もう一回判定」を押したときの対象 */
  recheckId: string | null;
  startRecheck: (id: string | null) => void;
  toast: (msg: string) => void;
  toastMsg: string | null;
};

const Ctx = createContext<Store | null>(null);

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* プライベートモードなどで保存できないときは何もしない */
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [loaded, setLoaded] = useState(false);
  const [items, setItems] = useState<Item[]>([]);
  const [settings, setSettingsState] = useState<Settings>({ savings: null, perUseMode: "expensive" });
  const [recheckId, setRecheckId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setItems(read<Item[]>(ITEMS_KEY, []));
    setSettingsState(read<Settings>(SETTINGS_KEY, { savings: null }));
    setLoaded(true);
  }, []);

  // 別タブで変更されたら取り込む
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === ITEMS_KEY) setItems(read<Item[]>(ITEMS_KEY, []));
      if (e.key === SETTINGS_KEY) setSettingsState(read<Settings>(SETTINGS_KEY, { savings: null }));
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const putItem = useCallback((item: Item) => {
    setItems((prev) => {
      const next = prev.some((x) => x.id === item.id) ? prev.map((x) => (x.id === item.id ? item : x)) : [...prev, item];
      write(ITEMS_KEY, next);
      return next;
    });
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => {
      const next = prev.filter((x) => x.id !== id);
      write(ITEMS_KEY, next);
      return next;
    });
  }, []);

  const setSettings = useCallback((patch: Partial<Settings>) => {
    setSettingsState((prev) => {
      const next = { ...prev, ...patch };
      write(SETTINGS_KEY, next);
      return next;
    });
  }, []);

  const toast = useCallback((msg: string) => {
    setToastMsg(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToastMsg(null), 2200);
  }, []);

  const value = useMemo<Store>(
    () => ({ loaded, items, settings, putItem, removeItem, setSettings, recheckId, startRecheck: setRecheckId, toast, toastMsg }),
    [loaded, items, settings, putItem, removeItem, setSettings, recheckId, toast, toastMsg],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore は StoreProvider の中で使ってください");
  return s;
}
