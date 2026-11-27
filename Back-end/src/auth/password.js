import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const derive = promisify(scrypt);
const options = { N: 131_072, r: 8, p: 1, maxmem: 256 * 1024 * 1024 };
const pattern = /^scrypt\$131072\$8\$1\$([a-f0-9]{32})\$([a-f0-9]{128})$/;
const dummySalt = randomBytes(16);

export async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await derive(password, salt, 64, options);
  return ["scrypt", options.N, options.r, options.p, salt.toString("hex"), hash.toString("hex")].join("$");
}

export async function verifyPassword(password, stored) {
  const match = pattern.exec(stored ?? "");
  const salt = match ? Buffer.from(match[1], "hex") : dummySalt;
  const expected = match ? Buffer.from(match[2], "hex") : Buffer.alloc(64);
  const actual = await derive(password, salt, 64, options);
  return timingSafeEqual(actual, expected) && Boolean(match);
}