# 🔐 HCL AppScan SAST & SCA Training — Demo Application

> **⚠️ WARNING:** This codebase is **intentionally vulnerable**. It is for  
> training and demonstration purposes ONLY. Never deploy this to production.

---

## 📦 Project Structure

```
vulnerable-demo-app/
├── src/
│   ├── app.js              ← Main Express app (SAST vulnerabilities)
│   └── utils/crypto.js     ← Crypto utilities (SAST vulnerabilities)
├── .github/
│   └── workflows/
│       └── appscan-pipeline.yml  ← GitHub Actions CI/CD pipeline
├── Jenkinsfile             ← Jenkins pipeline (alternative)
├── package.json            ← Vulnerable/outdated dependencies (SCA)
└── README.md
```

---

## 🐛 SAST Vulnerabilities (Source Code Issues)

| # | Vulnerability | File | Line(s) | AppScan Rule |
|---|--------------|------|---------|--------------|
| 1 | **SQL/NoSQL Injection** | `app.js` | ~52 | `SQLInjection` |
| 2 | **Command Injection** | `app.js` | ~83 | `OS_CommandInjection` |
| 3 | **Hardcoded Credentials** | `app.js` | ~33–36 | `HardcodedPassword` |
| 4 | **Insecure JWT (alg:none)** | `app.js` | ~68–70 | `InsecureJWT` |
| 5 | **Path Traversal** | `app.js` | ~92–95 | `PathTraversal` |
| 6 | **Reflected XSS** | `app.js` | ~103 | `CrossSiteScripting` |
| 7 | **Insecure Random** | `app.js` | ~58 | `WeakRandom` |
| 8 | **Sensitive Data in Logs** | `app.js` | ~55 | `SensitiveDataExposure` |
| 9 | **Prototype Pollution** | `app.js` | ~110 | `PrototypePollution` |
| 10 | **SSRF** | `app.js` | ~120 | `SSRF` |
| 11 | **Unrestricted File Upload** | `app.js` | ~132 | `UnrestrictedFileUpload` |
| 12 | **Weak Hash (MD5)** | `utils/crypto.js` | ~23 | `WeakHashingAlgorithm` |
| 13 | **Weak Cipher (DES)** | `utils/crypto.js` | ~31 | `WeakEncryptionAlgorithm` |
| 14 | **Static IV in AES** | `utils/crypto.js` | ~41 | `HardcodedIV` |
| 15 | **Insecure TLS** | `utils/crypto.js` | ~53 | `InsecureTLS` |

---

## 📦 SCA Vulnerabilities (Dependency Issues)

These packages in `package.json` have known CVEs that AppScan SCA will detect:

| Package | Version | CVE | Severity | Issue |
|---------|---------|-----|----------|-------|
| `express` | 4.17.1 | CVE-2022-24999 | High | Open Redirect |
| `lodash` | 4.17.15 | CVE-2021-23337 | High | Command Injection |
| `lodash` | 4.17.15 | CVE-2020-28500 | Medium | ReDoS |
| `jsonwebtoken` | 8.5.1 | CVE-2022-23529 | High | Improper Verification |
| `serialize-javascript` | 2.1.1 | CVE-2020-7660 | High | XSS |
| `node-fetch` | 2.6.0 | CVE-2022-0235 | High | Exposure of Sensitive Info |
| `ejs` | 3.1.3 | CVE-2022-29078 | Critical | RCE via template injection |
| `multer` | 1.4.2 | CVE-2022-24434 | High | DoS |
| `mongoose` | 5.9.10 | CVE-2022-24702 | Medium | Prototype Pollution |

---

## 🚀 CI/CD Pipeline Setup

### Option A — GitHub Actions

#### Step 1: Add Secrets to GitHub Repository
```
GitHub Repo → Settings → Secrets and Variables → Actions → New secret

APPSCAN_API_KEY_ID      = <your AppScan on Cloud key ID>
APPSCAN_API_KEY_SECRET  = <your AppScan on Cloud key secret>
APPSCAN_APP_ID          = <your Application ID in AppScan>
```

#### Step 2: Get AppScan API Credentials
1. Log in to **https://cloud.appscan.com**
2. Go to **Profile → API Key Management**
3. Click **Generate New Key** → copy Key ID & Secret

#### Step 3: Create Application in AppScan
1. In AppScan on Cloud → **Applications → New Application**
2. Copy the **Application ID** (GUID format)

#### Step 4: Trigger the Pipeline
```bash
# Push to main or develop — auto-triggers
git add .
git commit -m "feat: add login endpoint"
git push origin develop

# Or trigger manually: GitHub → Actions tab → Run workflow
```

#### Pipeline Flow
```
Push / PR
    │
    ▼
┌─────────┐
│  Build  │  npm ci
└────┬────┘
     │
     ├──────────────────────────────┐
     ▼                              ▼
┌─────────────┐            ┌─────────────┐
│  SCA Scan   │            │  SAST Scan  │
│  (deps CVE) │            │  (src code) │
└──────┬──────┘            └──────┬──────┘
       │                          │
       └──────────┬───────────────┘
                  ▼
         ┌────────────────┐
         │ Security Gate  │  Fail if High/Critical found
         └────────────────┘
```

---

### Option B — Jenkins

#### Step 1: Add Credentials in Jenkins
```
Manage Jenkins → Credentials → System → Global → Add Credentials

Kind: Secret text
ID:   appscan-key-id       Value: <Key ID>
ID:   appscan-key-secret   Value: <Key Secret>
ID:   appscan-app-id       Value: <App ID>
```

#### Step 2: Create a Pipeline Job
1. **New Item → Pipeline**
2. Definition: **Pipeline script from SCM**
3. SCM: Git → your repo URL
4. Script Path: `Jenkinsfile`

#### Step 3: Trigger Build
```
Jenkins Dashboard → Your Job → Build Now
```
Or configure webhook in your Git provider to auto-trigger.

---

## 🎯 Training Exercises

### Exercise 1 — Run Baseline Scan
1. Push code to the repo as-is
2. Watch the pipeline run in GitHub Actions / Jenkins
3. Review findings in AppScan on Cloud dashboard

### Exercise 2 — Fix a SAST Issue
Fix the Command Injection in `app.js`:
```javascript
// BEFORE (vulnerable)
exec(`ping -c 3 ${host}`, callback);

// AFTER (fixed) — validate input before use
const validHost = /^[a-zA-Z0-9.\-]+$/.test(host) ? host : null;
if (!validHost) return res.status(400).json({ error: "Invalid host" });
exec(`ping -c 3 ${validHost}`, callback);
```
Re-run the scan. Verify the finding is resolved.

### Exercise 3 — Fix SCA Issues
```bash
# Update vulnerable packages
npm install express@latest lodash@latest jsonwebtoken@latest ejs@latest
```
Re-run the scan. Confirm SCA findings decrease.

### Exercise 4 — Tune the Security Gate
Modify `.github/workflows/appscan-pipeline.yml` to:
- Allow builds to pass with Medium issues but fail on High
- Set a maximum threshold of 5 Medium issues

---

## 📋 Prerequisites

- Node.js 16+
- HCL AppScan on Cloud account (trial: https://cloud.appscan.com)
- GitHub repository (for GitHub Actions) or Jenkins instance
