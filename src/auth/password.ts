import "server-only";

import { hash, verify } from "@node-rs/argon2";

export async function hashPassword(password: string) {
  return await hash(password, {
    memoryCost: 19456,
    timeCost: 2,
    outputLen: 32,
    parallelism: 1,
  });
}

export async function verifyPassword(hash: string, password: string) {
  return await verify(hash, password);
}
