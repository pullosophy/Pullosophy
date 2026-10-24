"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pending,
  variant = "solid",
}: {
  children: React.ReactNode;
  pending: string;
  variant?: "solid" | "outline";
}) {
  const status = useFormStatus();
  const style =
    variant === "solid"
      ? "bg-foreground text-background"
      : "border border-black/20";
  return (
    <button disabled={status.pending} className={`rounded px-4 py-2 text-sm font-medium disabled:opacity-50 ${style}`}>
      {status.pending ? pending : children}
    </button>
  );
}
