"use client";

import { useEffect, useState } from "react";

// One shared "Added …" confirmation for the whole site, so adding items from
// several menu rows in a row shows one toast instead of a stack of them.
const EVENT = "fto:added";

export function announceAdded(msg: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT, { detail: msg }));
}

export default function AddedToast() {
  const [msg, setMsg] = useState("");
  useEffect(() => {
    let t: ReturnType<typeof setTimeout> | undefined;
    const on = (e: Event) => {
      setMsg((e as CustomEvent<string>).detail);
      clearTimeout(t);
      t = setTimeout(() => setMsg(""), 2200);
    };
    window.addEventListener(EVENT, on);
    return () => {
      window.removeEventListener(EVENT, on);
      clearTimeout(t);
    };
  }, []);
  if (!msg) return null;
  return (
    <div
      role="status"
      className="fixed left-1/2 -translate-x-1/2 bottom-24 z-[75] px-4 py-2 rounded-full bg-white text-black text-sm font-semibold shadow-lg whitespace-nowrap"
    >
      ✓ {msg}
    </div>
  );
}
