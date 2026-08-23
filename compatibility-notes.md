# 相容性驗證基準

## 編解碼

- RFC 4648 的標準 Base64 與 Base32 均使用 `=` 進行填補；解碼器應拒絕非字母表字元，除非呼叫端明確指定寬鬆模式。
- 「Base85」不是單一格式。Python 的 `b85encode`（Git／RFC 1924 變體）、`a85encode`（Ascii85／PDF）與 Z85 使用不同字母表與填補規則。本工具目前使用與 Python `b85encode` 相同的 Git／RFC 1924 字母表，並採未填補輸出。

## 加密

- Web Crypto AES-GCM 建議使用 96 位元（12 位元組）且每次加密唯一的 IV；認證標籤預設為 128 位元，並附加於 Web Crypto 的加密結果。
- OpenSSL `enc` 對密碼式加密預設涉及 salt 與 KDF 參數，且不支援 GCM；因此要判定跨工具互通，必須同時指定演算法、模式、padding、金鑰位元組、IV、salt、KDF 及密文封裝格式。

## 來源

- RFC 4648: https://datatracker.ietf.org/doc/html/rfc4648
- Python base64 模組: https://docs.python.org/3/library/base64.html
- MDN AesGcmParams: https://developer.mozilla.org/en-US/docs/Web/API/AesGcmParams
- OpenSSL enc: https://docs.openssl.org/3.3/man1/openssl-enc/

## 實際介面驗證

網站加解密頁已以固定 AES-256-GCM 向量完成實測：金鑰 `000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f`、IV `101112131415161718191a1b` 與明文 `Interop 測試` 會輸出 `gcm1:101112131415161718191a1b:NJDsczumSpMszaT1pt/8+oexNpxWow6Hl9n0s++B`。其中 `gcm1` 是本網站容器標記；其後的 Base64 內容為 Web Crypto 產生的「密文後接 128 位元認證標籤」，可由獨立標準實作還原。

網站編解碼頁已以 Unicode 向量 `Tsau 工具 🛠` 完成實測，Base64 輸出為 `VHNhdSDlt6Xlhbcg8J+boA==`，與 RFC 4648 及 Python `base64.b64encode` 的 UTF-8 位元組輸出一致。
