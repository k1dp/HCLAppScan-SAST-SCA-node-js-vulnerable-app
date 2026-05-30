/**
 * app.js — Intentionally Vulnerable Demo Application
 * Purpose: HCL AppScan SAST & SCA Training
 *
 * SAST Issues embedded:
 *  1. SQL Injection (simulated via raw query string)
 *  2. Command Injection (child_process with user input)
 *  3. Hardcoded credentials / secrets
 *  4. Insecure JWT (algorithm: 'none')
 *  5. Path Traversal in file download
 *  6. XSS via res.send() with unsanitized input
 *  7. Insecure random (Math.random for token)
 *  8. Sensitive data in logs (password logged)
 *  9. Prototype Pollution via lodash merge
 * 10. SSRF in proxy endpoint
 */

const express = require("express");
const jwt = require("jsonwebtoken");
const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const _ = require("lodash");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// -------------------------------------------------------
// VULNERABILITY #3 — Hardcoded Credentials
// AppScan SAST Rule: HardcodedCredentials / HardcodedPassword
// -------------------------------------------------------
const DB_HOST = "mongodb://admin:SuperSecret123@prod-db.internal:27017/users";
const JWT_SECRET = "mysecretkey";
const AWS_ACCESS_KEY = "AKIAIOSFODNN7EXAMPLE";
const AWS_SECRET_KEY = "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY";

// -------------------------------------------------------
// VULNERABILITY #1 — SQL/NoSQL Injection
// AppScan SAST Rule: SQLInjection / NoSQLInjection
// User-controlled input passed directly into query
// -------------------------------------------------------
app.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Simulated raw query — never sanitised
  const query = `db.users.find({ username: "${username}", password: "${password}" })`;
  console.log("[DEBUG] Running query:", query);

  // VULNERABILITY #8 — Sensitive Data in Logs
  // AppScan SAST Rule: SensitiveDataExposure
  console.log(`[DEBUG] Login attempt — user: ${username} pass: ${password}`);

  // VULNERABILITY #7 — Insecure Random (token generation)
  // AppScan SAST Rule: InsecureRandom / WeakRandom
  const sessionToken = Math.random().toString(36).substring(2);

  res.json({ token: sessionToken, query });
});

// -------------------------------------------------------
// VULNERABILITY #4 — Insecure JWT (none algorithm)
// AppScan SAST Rule: InsecureJWT / WeakCryptography
// -------------------------------------------------------
app.post("/auth/token", (req, res) => {
  const { userId, role } = req.body;

  // algorithm: 'none' disables signature verification
  const token = jwt.sign({ userId, role }, "", { algorithm: "none" });

  res.json({ token });
});

app.get("/auth/verify", (req, res) => {
  const token = req.headers["authorization"];
  try {
    // algorithms array includes 'none' — attackers can forge tokens
    const decoded = jwt.verify(token, "", { algorithms: ["none", "HS256"] });
    res.json({ valid: true, decoded });
  } catch (e) {
    res.status(401).json({ valid: false });
  }
});

// -------------------------------------------------------
// VULNERABILITY #2 — Command Injection
// AppScan SAST Rule: CommandInjection / OS_CommandInjection
// -------------------------------------------------------
app.get("/ping", (req, res) => {
  const host = req.query.host; // user-controlled

  // Directly interpolated into shell command — no validation
  exec(`ping -c 3 ${host}`, (error, stdout, stderr) => {
    res.json({ result: stdout || stderr });
  });
});

// -------------------------------------------------------
// VULNERABILITY #5 — Path Traversal
// AppScan SAST Rule: PathTraversal / DirectoryTraversal
// -------------------------------------------------------
app.get("/download", (req, res) => {
  const filename = req.query.file; // e.g. ../../etc/passwd

  // No path normalisation or jail check
  const filePath = path.join(__dirname, "uploads", filename);
  res.download(filePath);
});

// -------------------------------------------------------
// VULNERABILITY #6 — Cross-Site Scripting (Reflected XSS)
// AppScan SAST Rule: CrossSiteScripting / ReflectedXSS
// -------------------------------------------------------
app.get("/search", (req, res) => {
  const term = req.query.q;

  // Unsanitised user input reflected back as HTML
  res.send(`<h1>Search results for: ${term}</h1>`);
});

// -------------------------------------------------------
// VULNERABILITY #9 — Prototype Pollution
// AppScan SAST Rule: PrototypePollution
// Via vulnerable lodash version (< 4.17.17) merge/defaultsDeep
// -------------------------------------------------------
app.post("/config/merge", (req, res) => {
  const userConfig = req.body;
  const defaultConfig = {};

  // _.merge with unsanitised object can pollute Object.prototype
  const merged = _.merge(defaultConfig, userConfig);
  res.json(merged);
});

// -------------------------------------------------------
// VULNERABILITY #10 — SSRF (Server-Side Request Forgery)
// AppScan SAST Rule: SSRF / ServerSideRequestForgery
// -------------------------------------------------------
app.get("/proxy", async (req, res) => {
  const url = req.query.url; // attacker can point to internal services

  try {
    // No URL whitelist / validation
    const response = await fetch(url);
    const data = await response.text();
    res.send(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// -------------------------------------------------------
// VULNERABILITY — Insecure File Upload (no type check)
// AppScan SAST Rule: UnrestrictedFileUpload
// -------------------------------------------------------
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // no file type restriction

app.post("/upload", upload.single("file"), (req, res) => {
  // No MIME type or extension validation — allows .php, .sh, etc.
  res.json({ file: req.file });
});

// Health check
app.get("/", (req, res) => {
  res.json({ status: "running", version: "1.0.0" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Demo app running on port ${PORT}`);
});

module.exports = app;
