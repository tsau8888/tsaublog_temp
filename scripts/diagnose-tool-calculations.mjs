import CryptoJS from "crypto-js";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~";

function currentBase85Encode(input) {
  let output = "";
  const bytes = encoder.encode(input);

  for (let index = 0; index < bytes.length; index += 4) {
    const length = Math.min(4, bytes.length - index);
    const value = (((bytes[index] || 0) * 256 + (bytes[index + 1] || 0)) * 256 + (bytes[index + 2] || 0)) * 256 + (bytes[index + 3] || 0);
    if (value === 0 && length === 4) {
      output += "z";
      continue;
    }
    const characters = new Array(5);
    let remaining = value;
    for (let position = 4; position >= 0; position -= 1) {
      characters[position] = alphabet[remaining % 85];
      remaining = Math.floor(remaining / 85);
    }
    output += characters.join("").slice(0, length < 4 ? length + 1 : 5);
  }
  return output;
}

function currentBase85Decode(input) {
  const cleaned = input.replace(/\s/g, "");
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

  for (const character of cleaned) {
    if (character === "z" && group.length === 0) {
      bytes.push(0, 0, 0, 0);
    } else {
      const index = alphabet.indexOf(character);
      if (index !== -1) {
        group.push(index);
        if (group.length === 5) {
          flushGroup(group);
          group = [];
        }
      }
    }
  }
  flushGroup(group);
  return decoder.decode(new Uint8Array(bytes));
}

function hexToBytes(value) {
  return Uint8Array.from(value.match(/.{1,2}/g) || [], (part) => parseInt(part, 16));
}

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
}

function base64ToBytes(value) {
  return new Uint8Array(Buffer.from(value, "base64"));
}

async function currentAesGcmEncrypt(plaintext, keyHex, ivHex) {
  const keyData = hexToBytes(keyHex);
  const ivData = hexToBytes(ivHex);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, ["encrypt"]);
  const encryptedData = await crypto.subtle.encrypt({ name: "AES-GCM", iv: ivData }, cryptoKey, encoder.encode(plaintext));
  const combined = new Uint8Array(ivData.length + encryptedData.byteLength);
  combined.set(ivData);
  combined.set(new Uint8Array(encryptedData), ivData.length);
  return bytesToBase64(combined);
}

async function currentAesGcmDecrypt(ciphertext, keyHex) {
  const combined = base64ToBytes(ciphertext);
  const ivData = combined.slice(0, 12);
  const encryptedData = combined.slice(12);
  const keyData = hexToBytes(keyHex);
  const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, ["decrypt"]);
  const decryptedData = await crypto.subtle.decrypt({ name: "AES-GCM", iv: ivData }, cryptoKey, encryptedData);
  return decoder.decode(decryptedData);
}

const base85Probe = "🛠工具測試";
const base85Encoded = currentBase85Encode(base85Probe);
const base85RoundTrip = currentBase85Decode(base85Encoded);
const ambiguousBase85Probe = "ab侾AB";
const ambiguousBase85Encoded = currentBase85Encode(ambiguousBase85Probe);
const ambiguousBase85RoundTrip = currentBase85Decode(ambiguousBase85Encoded);
const keyHex = CryptoJS.SHA256("測試密碼").toString(CryptoJS.enc.Hex);
const ciphertextWith16ByteIv = await currentAesGcmEncrypt("加密測試", keyHex, "00112233445566778899aabbccddeeff");

let gcmLegacyDecryptFailed = false;
try {
  await currentAesGcmDecrypt(ciphertextWith16ByteIv, keyHex);
} catch {
  gcmLegacyDecryptFailed = true;
}

console.log(JSON.stringify({
  base85Encoded,
  base85RoundTrip,
  base85RoundTripMatches: base85RoundTrip === base85Probe,
  ambiguousBase85Encoded,
  ambiguousBase85RoundTrip,
  ambiguousBase85RoundTripMatches: ambiguousBase85RoundTrip === ambiguousBase85Probe,
  gcmLegacyDecryptFailed,
}, null, 2));
