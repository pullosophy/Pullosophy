"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { LOCALE_COOKIE } from "@/lib/i18n";

export async function setLocale(formData: FormData) {
  const lang = formData.get("lang") === "en" ? "en" : "it";
  (await cookies()).set(LOCALE_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const back = (await headers()).get("referer");
  redirect(back && back.startsWith((await headers()).get("origin") ?? "\u0000") ? back : "/");
}
