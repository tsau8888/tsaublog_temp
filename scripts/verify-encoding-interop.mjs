import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";

const encoder = new TextEncoder();
const decoder = new TextDecoder();
const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
const base85Alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz!#$%&()*+-;<=>?@^_`{|}~";

function bytesToBase64(bytes) {
  return Buffer.from(bytes).toString("base64");
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

function base85Encode(input) {
  const bytes = encoder.encode(input);
  let output = "";
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

function pythonReference(functionName, utf8Bytes) {
  const script = `import base64, sys; data = base64.b64decode(sys.argv[2]); print(getattr(base64, sys.argv[1])(data).decode('ascii'))`;
  return execFileSync("python3", ["-c", script, functionName, Buffer.from(utf8Bytes).toString("base64")], { encoding: "utf8" }).trim();
}

const samples = ["f", "hello", "Tsau 工具 🛠", "ab侾AB"];
for (const sample of samples) {
  const bytes = encoder.encode(sample);
  assert.equal(bytesToBase64(bytes), pythonReference("b64encode", bytes), `Base64 mismatch: ${sample}`);
  assert.equal(base32Encode(sample), pythonReference("b32encode", bytes), `Base32 mismatch: ${sample}`);
  assert.equal(base85Encode(sample), pythonReference("b85encode", bytes), `Base85 mismatch: ${sample}`);
}

assert.equal(encodeURIComponent("你好 tool/+?&="), "%E4%BD%A0%E5%A5%BD%20tool%2F%2B%3F%26%3D");
assert.equal(decoder.decode(Uint8Array.from(Buffer.from("VHNhdSDlt6Xlhbcg8J+boA==", "base64"))), "Tsau 工具 🛠");

console.log("ENCODING_INTEROP_VERIFICATION_OK");
