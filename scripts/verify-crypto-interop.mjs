import assert from "node:assert/strict";
import { createCipheriv, createDecipheriv, pbkdf2Sync, webcrypto } from "node:crypto";
import { execFileSync } from "node:child_process";
import CryptoJS from "crypto-js";

const plaintext = "Interop 測試";
const plaintextBytes = Buffer.from(plaintext, "utf8");

function toArrayBuffer(bytes) {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

const vectors = {
  "AES-CBC": { keyHex: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", ivHex: "101112131415161718191a1b1c1d1e1f", openssl: "aes-256-cbc" },
  "AES-ECB": { keyHex: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", ivHex: null, openssl: "aes-256-ecb" },
  DES: { keyHex: "0123456789ABCDEF", ivHex: "0102030405060708", openssl: "des-cbc" },
  "3DES": { keyHex: "0123456789ABCDEFFEDCBA98765432100011223344556677", ivHex: "0102030405060708", openssl: "des-ede3-cbc" },
  RC4: { keyHex: "00112233445566778899AABBCCDDEEFF", ivHex: null, openssl: "rc4" },
};

function websiteCiphertext(algorithm, vector) {
  const key = CryptoJS.enc.Hex.parse(vector.keyHex);
  if (algorithm === "RC4") return CryptoJS.RC4.encrypt(plaintext, key).ciphertext.toString(CryptoJS.enc.Hex);
  const mode = algorithm === "AES-ECB" ? CryptoJS.mode.ECB : CryptoJS.mode.CBC;
  const iv = vector.ivHex ? CryptoJS.enc.Hex.parse(vector.ivHex) : undefined;
  const cipher = algorithm === "DES" ? CryptoJS.DES : algorithm === "3DES" ? CryptoJS.TripleDES : CryptoJS.AES;
  return cipher.encrypt(plaintext, key, { mode, padding: CryptoJS.pad.Pkcs7, ...(iv ? { iv } : {}) }).ciphertext.toString(CryptoJS.enc.Hex);
}

function opensslCiphertext(vector) {
  const args = ["enc", `-${vector.openssl}`, "-K", vector.keyHex, "-nosalt"];
  if (vector.ivHex) args.push("-iv", vector.ivHex);
  if (["des-cbc", "des-ede3-cbc", "rc4"].includes(vector.openssl)) args.push("-provider", "default", "-provider", "legacy");
  return execFileSync("openssl", args, { input: plaintextBytes }).toString("hex");
}

for (const [algorithm, vector] of Object.entries(vectors)) {
  assert.equal(websiteCiphertext(algorithm, vector), opensslCiphertext(vector), `${algorithm} output differs from OpenSSL`);
}

const gcmKey = Buffer.from("000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", "hex");
const gcmIv = Buffer.from("101112131415161718191a1b", "hex");
const gcmCipher = createCipheriv("aes-256-gcm", gcmKey, gcmIv);
const gcmPayload = Buffer.concat([gcmCipher.update(plaintextBytes), gcmCipher.final(), gcmCipher.getAuthTag()]);
const gcmEnvelope = `gcm1:${gcmIv.toString("hex")}:${gcmPayload.toString("base64")}`;
const webCryptoKey = await webcrypto.subtle.importKey("raw", toArrayBuffer(gcmKey), { name: "AES-GCM" }, false, ["encrypt"]);
const webCryptoPayload = Buffer.from(await webcrypto.subtle.encrypt({ name: "AES-GCM", iv: toArrayBuffer(gcmIv) }, webCryptoKey, toArrayBuffer(plaintextBytes)));
assert.equal(webCryptoPayload.toString("base64"), gcmPayload.toString("base64"), "Web Crypto AES-GCM output differs from Node.js crypto");
const gcmParts = gcmEnvelope.split(":");
const gcmCiphertext = Buffer.from(gcmParts[2], "base64");
const gcmDecipher = createDecipheriv("aes-256-gcm", gcmKey, Buffer.from(gcmParts[1], "hex"));
gcmDecipher.setAuthTag(gcmCiphertext.subarray(-16));
assert.equal(Buffer.concat([gcmDecipher.update(gcmCiphertext.subarray(0, -16)), gcmDecipher.final()]).toString("utf8"), plaintext);

const filePassword = "file interoperability password";
const salt = Buffer.from("000102030405060708090a0b0c0d0e0f", "hex");
const fileIv = Buffer.from("101112131415161718191a1b", "hex");
const fileKey = pbkdf2Sync(filePassword, salt, 100000, 32, "sha256");
const fileCipher = createCipheriv("aes-256-gcm", fileKey, fileIv);
const filePayload = Buffer.concat([fileCipher.update(Buffer.from("file bytes", "utf8")), fileCipher.final(), fileCipher.getAuthTag()]);
const fileEnvelope = Buffer.concat([salt, fileIv, filePayload]);
const recoveredSalt = fileEnvelope.subarray(0, 16);
const recoveredIv = fileEnvelope.subarray(16, 28);
const recoveredPayload = fileEnvelope.subarray(28);
const recoveredKey = pbkdf2Sync(filePassword, recoveredSalt, 100000, 32, "sha256");
const fileDecipher = createDecipheriv("aes-256-gcm", recoveredKey, recoveredIv);
fileDecipher.setAuthTag(recoveredPayload.subarray(-16));
assert.equal(Buffer.concat([fileDecipher.update(recoveredPayload.subarray(0, -16)), fileDecipher.final()]).toString("utf8"), "file bytes");

console.log("CRYPTO_INTEROP_VERIFICATION_OK");
