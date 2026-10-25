"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

// Modulo GET che si invia da solo quando cambia un menu. Su mobile i filtri sono
// ripiegati dietro un pulsante; su desktop sono sempre visibili.
export function FilterForm({
  action,
  search,
  filters,
  defaultOpen,
  labels,
}: {
  action: string;
  search: React.ReactNode;
  filters: React.ReactNode;
  defaultOpen: boolean;
  labels: { open: string; close: string; apply: string };
}) {
  const ref = useRef<HTMLFormElement>(null);
  const router = useRouter();
  const [open, setOpen] = useState(defaultOpen);

  // URL pulito: solo i parametri compilati.
  const submit = () => {
    if (!ref.current) return;
    const params = new URLSearchParams();
    for (const [k, v] of new FormData(ref.current)) if (typeof v === "string" && v.trim()) params.set(k, v.trim());
    const s = params.toString();
    router.push(s ? `${action}?${s}` : action);
  };

  return (
    <form
      ref={ref}
      action={action}
      className="space-y-3"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      onChange={(e) => {
        if ((e.target as HTMLElement).tagName === "SELECT") submit();
      }}
    >
      {search}
      <button type="button" onClick={() => setOpen(!open)} className="rounded-full border border-line px-4 py-2 text-sm font-semibold sm:hidden">
        {open ? labels.close : labels.open}
      </button>
      <div className={open ? "block" : "hidden sm:block"}>
        {filters}
        <button className="mt-2 rounded-full bg-foreground px-5 py-2 text-sm font-semibold text-white sm:hidden">
          {labels.apply}
        </button>
      </div>
    </form>
  );
}
