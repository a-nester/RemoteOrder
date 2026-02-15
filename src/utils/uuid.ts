import * as Crypto from "expo-crypto";

export function getUUID(): string {
  return Crypto.randomUUID();
}
