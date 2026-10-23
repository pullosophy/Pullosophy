import type { Condition, SealedType } from "@prisma/client";

export const conditionLabels: Record<Condition, string> = {
  MINT: "Mint",
  NEAR_MINT: "Near Mint",
  EXCELLENT: "Excellent",
  GOOD: "Good",
  LIGHT_PLAYED: "Light Played",
  PLAYED: "Played",
  POOR: "Poor",
};

export const sealedLabels: Record<SealedType, string> = {
  BOOSTER_PACK: "Busta",
  BOOSTER_BOX: "Booster Box",
  ELITE_TRAINER_BOX: "Elite Trainer Box",
  COLLECTION_BOX: "Collezione",
  TIN: "Tin",
  BUNDLE: "Bundle",
  OTHER: "Altro",
};

export const languageLabels: Record<string, string> = {
  it: "Italiano",
  en: "Inglese",
  ja: "Giapponese",
  fr: "Francese",
  de: "Tedesco",
  es: "Spagnolo",
};
