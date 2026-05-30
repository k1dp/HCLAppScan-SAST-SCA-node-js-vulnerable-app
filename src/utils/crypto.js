/**
 * utils/crypto.js — Insecure Cryptography Utilities
 * SAST Issues:
 *  - Weak hashing algorithm (MD5)
 *  - Weak cipher (DES)
 *  - Static IV in AES
 *  - Insecure TLS (rejectUnauthorized: false)
 */

const crypto = require("crypto");
const https = require("https");

// -------------------------------------------------------
// VULNERABILITY — Weak Hash Algorithm (MD5)
// AppScan SAST Rule: WeakHashingAlgorithm / InsecureCryptography
// -------------------------------------------------------
function hashPassword(password) {
  // MD5 is cryptographically broken — should use bcrypt/argon2
  return crypto.createHash("md5").update(password).digest("hex");
}

// -------------------------------------------------------
// VULNERABILITY — Weak Cipher (DES)
// AppScan SAST Rule: WeakEncryptionAlgorithm
// -------------------------------------------------------
function encryptDES(data, key) {
  const cipher = crypto.createCipher("des", key); // DES is broken
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// -------------------------------------------------------
// VULNERABILITY — Static / Hardcoded IV
// AppScan SAST Rule: HardcodedIV / StaticIV
// -------------------------------------------------------
const STATIC_IV = Buffer.from("1234567890123456"); // never changes

function encryptAES(data, key) {
  const cipher = crypto.createCipheriv(
    "aes-128-cbc",
    Buffer.from(key),
    STATIC_IV // reusing same IV for every encryption
  );
  let encrypted = cipher.update(data, "utf8", "hex");
  encrypted += cipher.final("hex");
  return encrypted;
}

// -------------------------------------------------------
// VULNERABILITY — Insecure TLS (certificate validation disabled)
// AppScan SAST Rule: InsecureTLS / DisabledCertificateValidation
// -------------------------------------------------------
function insecureHttpsGet(url, callback) {
  const options = {
    rejectUnauthorized: false, // disables SSL/TLS cert verification!
  };
  https.get(url, options, callback);
}

// -------------------------------------------------------
// VULNERABILITY — XXE (XML External Entity)
// AppScan SAST Rule: XXE / XMLExternalEntity
// -------------------------------------------------------
function parseXML(xmlString) {
  // libxmljs with external entity enabled (vulnerable pattern)
  const libxmljs = require("libxmljs");
  // noent: true enables external entities — XXE attack vector
  return libxmljs.parseXmlString(xmlString, { noent: true });
}

module.exports = {
  hashPassword,
  encryptDES,
  encryptAES,
  insecureHttpsGet,
};
