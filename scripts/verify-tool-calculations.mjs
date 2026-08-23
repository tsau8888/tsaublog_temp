import assert from "node:assert/strict";
import CryptoJS from "crypto-js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const base85Alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~";

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(value) {
  return new Uint8Array(Buffer.from(value.trim(), "base64"));
}

function hexToBytes(value) {
  if (!/^(?:[\dA-Fa-f]{2})+$/.test(value)) throw new Error("invalid hex");
  return Uint8Array.from(value.match(/.{1,2}/g) || [], (part) => parseInt(part, 16));
}

function bytesToHex(bytes) {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

function base32Encode(input) {
  let output = "";
  let buffer = 0;
  let bitsLeft = 0;
  for (const byte of encoder.encode(input)) {
    buffer = (buffer << 8) | byte;
    bitsLeft += 8;
    while (bitsLeft >= 5) {
      output += base32Alphabet[(buffer >>> (bitsLeft - 5)) & 31];
      bitsLeft -= 5;
    }
  }
  if (bitsLeft > 0) output += base32Alphabet[(buffer << (5 - bitsLeft)) & 31];
  return output.padEnd(Math.ceil(output.length / 8) * 8, "=");
}

function base32Decode(input) {
  const compact = input.replace(/\s/g, "");
  if (!/^[A-Z2-7]*={0,6}$/i.test(compact) || /=.+/.test(compact.replace(/=+$/, ""))) throw new Error("invalid Base32");
  const cleaned = compact.replace(/=+$/, "").toUpperCase();
  if (![0, 2, 4, 5, 7].includes(cleaned.length % 8)) throw new Error("invalid Base32 length");
  const bytes = [];
  let buffer = 0;
  let bitsLeft = 0;
  for (const character of cleaned) {
    buffer = (buffer << 5) | base32Alphabet.indexOf(character);
    bitsLeft += 5;
    while (bitsLeft >= 8) {
      bytes.push((buffer >>> (bitsLeft - 8)) & 255);
      bitsLeft -= 8;
    }
  }
  if (bitsLeft > 0 && (buffer & ((1 << bitsLeft) - 1)) !== 0) throw new Error("invalid Base32 padding bits");
  return decoder.decode(new Uint8Array(bytes));
}

function base85Encode(input) {
  let output = "";
  const bytes = encoder.encode(input);
  for (let index = 0; index < bytes.length; index += 4) {
    const length = Math.min(4, bytes.length - index);
    const value = (((bytes[index] || 0) * 256 + (bytes[index + 1] || 0)) * 256 + (bytes[index + 2] || 0)) * 256 + (bytes[index + 3] || 0);
    const characters = new Array(5);
    let remaining = value;
    for (let position = 4; position >= 0; position -= 1) {
      characters[position] = base85Alphabet[remaining % 85];
      remaining = Math.floor(remaining / 85);
    }
    output += characters.join("").slice(0, length < 4 ? length + 1 : 5);
  }
  return output;
}

function base85Decode(input) {
  const bytes = [];
  let group = [];
  const flushGroup = (values) => {
    if (values.length < 2) return;
    const originalLength = values.length;
    while (values.length < 5) values.push(84);
    const value = values.reduce((total, current) => total * 85 + current, 0);
    const decoded = [
      Math.floor(value / 256 ** 3) & 255,
      Math.floor(value / 256 ** 2) & 255,
      Math.floor(value / 256) & 255,
      value & 255,
    ];
    bytes.push(...decoded.slice(0, originalLength < 5 ? originalLength - 1 : 4));
  };
  for (const character of input.replace(/\s/g, "")) {
    const value = base85Alphabet.indexOf(character);
    if (value === -1) throw new Error("invalid Base85");
    group.push(value);
    if (group.length === 5) {
      flushGroup(group);
      group = [];
    }
  }
  if (group.length === 1) throw new Error("invalid Base85 length");
  flushGroup(group);
  return decoder.decode(new Uint8Array(bytes));
}

async function aesGcmEncrypt(plaintext, password, ivHex) {
  const keyHex = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  const key = await crypto.subtle.importKey("raw", hexToBytes(keyHex), { name: "AES-GCM" }, false, ["encrypt"]);
  const iv = hexToBytes(ivHex);
  if (iv.length !== 12) throw new Error("invalid GCM IV");
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoder.encode(plaintext));
  return `gcm1:${bytesToHex(iv)}:${bytesToBase64(new Uint8Array(encrypted))}`;
}

async function aesGcmDecrypt(ciphertext, password) {
  const [, ivHex, encryptedBase64] = ciphertext.split(":");
  const keyHex = CryptoJS.SHA256(password).toString(CryptoJS.enc.Hex);
  const key = await crypto.subtle.importKey("raw", hexToBytes(keyHex), { name: "AES-GCM" }, false, ["decrypt"]);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv: hexToBytes(ivHex) }, key, base64ToBytes(encryptedBase64));
  return decoder.decode(plaintext);
}

function deriveCryptoJsKey(algorithm, password) {
  if (algorithm === "RC4") {
    if (password.length < 32) return CryptoJS.PBKDF2(password, CryptoJS.enc.Utf8.parse("salt"), { keySize: 128 / 32, iterations: 1000 });
    if (password.length === 32) return CryptoJS.enc.Utf8.parse(password.substring(0, 16));
    return CryptoJS.MD5(password);
  }
  if (algorithm === "DES") {
    if (password.length < 8) return CryptoJS.PBKDF2(password, CryptoJS.enc.Utf8.parse("salt"), { keySize: 64 / 32, iterations: 1000 });
    if (password.length === 8) return CryptoJS.enc.Utf8.parse(password.substring(0, 8));
    return CryptoJS.enc.Utf8.parse(CryptoJS.MD5(password).toString().substring(0, 8));
  }
  if (algorithm === "3DES") {
    if (password.length < 24) return CryptoJS.PBKDF2(password, CryptoJS.enc.Utf8.parse("salt"), { keySize: 192 / 32, iterations: 1000 });
    if (password.length === 24) return CryptoJS.enc.Utf8.parse(password.substring(0, 24));
    return CryptoJS.enc.Utf8.parse((CryptoJS.MD5(password).toString() + CryptoJS.MD5(`${password}key2`).toString()).substring(0, 24));
  }
  if (password.length < 32) return CryptoJS.PBKDF2(password, CryptoJS.enc.Utf8.parse("salt"), { keySize: 256 / 32, iterations: 1000 });
  if (password.length === 32) return CryptoJS.enc.Utf8.parse(password.substring(0, 32));
  return CryptoJS.enc.Hex.parse(CryptoJS.SHA256(password).toString());
}

function cryptoJsRoundTrip(algorithm, plaintext, password) {
  const key = deriveCryptoJsKey(algorithm, password);
  if (algorithm === "RC4") {
    const encrypted = CryptoJS.RC4.encrypt(plaintext, key).toString();
    return CryptoJS.RC4.decrypt(encrypted, key).toString(CryptoJS.enc.Utf8);
  }
  const modeName = algorithm === "AES-ECB" ? "ECB" : "CBC";
  const iv = modeName === "ECB" ? null : CryptoJS.lib.WordArray.random(algorithm === "DES" || algorithm === "3DES" ? 8 : 16);
  const options = { mode: CryptoJS.mode[modeName], padding: CryptoJS.pad.Pkcs7, ...(iv ? { iv } : {}) };
  const encryptor = algorithm === "DES" ? CryptoJS.DES : algorithm === "3DES" ? CryptoJS.TripleDES : CryptoJS.AES;
  const encrypted = encryptor.encrypt(plaintext, key, options).toString();
  const decryptOptions = iv ? { ...options, iv } : options;
  return encryptor.decrypt(encrypted, key, decryptOptions).toString(CryptoJS.enc.Utf8);
}

const unicodeSample = "Tsau 工具 🛠 123";
assert.equal(bytesToBase64(encoder.encode(unicodeSample)), "VHNhdSDlt6Xlhbcg8J+boCAxMjM=");
assert.equal(decoder.decode(base64ToBytes("VHNhdSDlt6Xlhbcg8J+boCAxMjM=")), unicodeSample);
assert.equal(base32Encode("f"), "MY======");
assert.equal(base32Decode("MY======"), "f");
assert.equal(base32Decode(base32Encode(unicodeSample)), unicodeSample);
assert.equal(base85Decode(base85Encode("ab侾AB")), "ab侾AB");
assert.equal(base85Decode(base85Encode(unicodeSample)), unicodeSample);
assert.equal(encodeURIComponent("你好 tool"), "%E4%BD%A0%E5%A5%BD%20tool");

const gcmCiphertext = await aesGcmEncrypt(unicodeSample, "correct horse battery staple", "00112233445566778899aabb");
assert.equal(await aesGcmDecrypt(gcmCiphertext, "correct horse battery staple"), unicodeSample);
await assert.rejects(() => aesGcmEncrypt(unicodeSample, "correct horse battery staple", "00112233445566778899aabbccddeeff"));

for (const algorithm of ["AES-CBC", "AES-ECB", "DES", "3DES", "RC4"]) {
  assert.equal(cryptoJsRoundTrip(algorithm, unicodeSample, "驗證用密碼 2026"), unicodeSample, `${algorithm} should round-trip`);
}

console.log("TOOL_CALCULATION_VERIFICATION_OK");
