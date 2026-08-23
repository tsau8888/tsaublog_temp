import CryptoJS from "crypto-js";
import { execFileSync } from "node:child_process";

const plaintext = "Interop 測試";
const vectors = {
  "AES-CBC": { password: "000102030405060708090a0b0c0d0e0f", keyHex: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", ivHex: "101112131415161718191a1b1c1d1e1f", openssl: "aes-256-cbc" },
  "AES-ECB": { password: "000102030405060708090a0b0c0d0e0f", keyHex: "000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f", ivHex: null, openssl: "aes-256-ecb" },
  DES: { password: "0123456789ABCDEF", keyHex: "0123456789ABCDEF", ivHex: "0102030405060708", openssl: "des-cbc" },
  "3DES": { password: "0123456789ABCDEFFEDCBA98765432100011223344556677", keyHex: "0123456789ABCDEFFEDCBA98765432100011223344556677", ivHex: "0102030405060708", openssl: "des-ede3-cbc" },
  RC4: { password: "00112233445566778899AABBCCDDEEFF", keyHex: "00112233445566778899AABBCCDDEEFF", ivHex: null, openssl: "rc4" },
};

function currentWebsiteKey(algorithm, password) {
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

function currentWebsiteCiphertext(algorithm, vector) {
  const key = currentWebsiteKey(algorithm, vector.password);
  if (algorithm === "RC4") return CryptoJS.RC4.encrypt(plaintext, key).ciphertext.toString(CryptoJS.enc.Hex);
  const mode = algorithm === "AES-ECB" ? CryptoJS.mode.ECB : CryptoJS.mode.CBC;
  const iv = vector.ivHex ? CryptoJS.enc.Hex.parse(vector.ivHex) : undefined;
  const options = { mode, padding: CryptoJS.pad.Pkcs7, ...(iv ? { iv } : {}) };
  const encryptor = algorithm === "DES" ? CryptoJS.DES : algorithm === "3DES" ? CryptoJS.TripleDES : CryptoJS.AES;
  return encryptor.encrypt(plaintext, key, options).ciphertext.toString(CryptoJS.enc.Hex);
}

function opensslCiphertext(vector) {
  const args = ["enc", `-${vector.openssl}`, "-K", vector.keyHex, "-nosalt"];
  if (vector.ivHex) args.push("-iv", vector.ivHex);
  if (["des-cbc", "des-ede3-cbc", "rc4"].includes(vector.openssl)) args.push("-provider", "default", "-provider", "legacy");
  return execFileSync("openssl", args, { input: Buffer.from(plaintext, "utf8") }).toString("hex");
}

const results = Object.fromEntries(Object.entries(vectors).map(([algorithm, vector]) => {
  const website = currentWebsiteCiphertext(algorithm, vector);
  const reference = opensslCiphertext(vector);
  return [algorithm, { matches: website === reference, website, reference }];
}));

console.log(JSON.stringify(results, null, 2));
