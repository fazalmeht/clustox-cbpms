# Clustox CBPMS — Google Apps Script web app

A secure rebuild of the CBPMS as a Google Apps Script web app:

- **Login = Google Workspace SSO** (domain-restricted to clustox.com). No passwords stored anywhere.
- **Database = a private Google Sheet** that nobody opens by hand — the app reads/writes it server-side.
- **No secrets in client code.** All data access runs server-side as the signed-in user's identity.
- Full UI for everyone — managers, admins, and employees never touch a spreadsheet.

## Files

| File | Purpose |
|------|---------|
| `Code.gs` | Server: identity/role checks, scoring, all read/write API |
| `Setup.gs` | One-time `setup()` + the seeded 14 designations & KPIs |
| `Index.html` | HTML shell (includes the two below) |
| `Styles.html` | All CSS (Clustox design tokens) |
| `JavaScript.html` | The single-page UI (admin + reviewer + employee views) |
| `appsscript.json` | Manifest — web app deploys as USER_ACCESSING, access DOMAIN |

## Deploy — Option A: paste into the editor (no tooling)

1. Go to <https://script.google.com> → **New project** (signed in as the account that should own the data Sheet).
2. **Project Settings** → tick **"Show appsscript.json manifest file in editor"**.
3. Recreate each file with the exact names above (use **＋ → Script** for `.gs`, **＋ → HTML** for the `.html` files — type the name *without* the extension). Paste contents from this folder.
4. Save all files.
5. **Run ▸ `setup`** (from `Setup.gs`). Approve the OAuth consent screen the first time. This creates the data Spreadsheet, builds the tabs, seeds the 14 designations, and registers **you** as the first admin. Check **View ▸ Logs** for the Spreadsheet id.
6. **Deploy ▸ New deployment ▸ Web app**:
   - Execute as: **Me** (the owner) — **important**, see note below
   - Who has access: **clustox.com** (your domain)
7. Open the web app URL. You'll land on the admin Dashboard.

> **Execute as "Me" — why it matters.** The app must run as the owner, not "User accessing the web app." Running as the owner means the script reads *your* private data Sheet, so **reviewers are never prompted for Google Sheets/Mail access** and never see the spreadsheet. Their identity is still detected correctly via `Session.getActiveUser()` (reliable because everyone is in the same `clustox.com` Workspace), and every server call re-checks roles — so a reviewer still can't perform admin actions. If reviewers are being asked for Sheets permission, the deployment is set to "User accessing"; change it to "Me" and redeploy.

## Deploy — Option B: `clasp` (recommended for version control)

```bash
npm install -g @google/clasp
clasp login
cd apps-script-cbpms
clasp create --type webapp --title "Clustox CBPMS"   # writes .clasp.json
clasp push                                            # uploads all files
clasp open                                            # open editor → Run setup() once
clasp deploy                                          # create a web-app deployment
```
After the first `setup()` run, set the deployment to **Execute as: Me** and **Access: clustox.com** from the editor's **Deploy** menu (the manifest already defaults `executeAs` to the owner).

## First-run checklist

1. Run `setup()` — you become admin automatically.
2. Add more admins: edit `addAdmin('someone@clustox.com')` and run it, **or** later add emails to the `Config` tab's `admins` row (comma-separated).
3. In the app → **Employees**: add people. Email is an optional record field.
4. **Reviewers**: assign employees to a reviewer by their Workspace email. The reviewer is **emailed automatically** when new employees are added to their list.
5. **Designations & KPIs**: the 14 roles are pre-seeded; edit weights/KPIs here (weights must total 100%).
6. Reviewers sign in → **My Evaluations** → rate → **Save Draft** or **Submit**. Drafts and submitted reviews both stay under **My Reviews** (resume drafts, view submitted).
7. **Reports**: filter, view, export CSV.

> **Note:** Employees do **not** have access to view their own results — the app is for admins and reviewers only.

## Security model

| Risk in the old app | How this fixes it |
|---|---|
| Supabase URL + anon key committed in JS | No DB credentials in client. Server-side Sheet access only. |
| Plaintext admin/reviewer passwords shipped to browser | No passwords — Workspace SSO is the login. |
| "Login" was a JS string compare (spoofable) | Identity comes from `Session.getActiveUser().getEmail()`, set by Google. |
| Anyone could read/write all data via the anon key | Sheet is private; every privileged call re-checks `isAdmin_()` / assignment. |
| Guessable `Math.random()` result-share tokens | Removed entirely — results are visible only to admins and the assigning reviewer. No public links. |

## Troubleshooting

**Reviewer is prompted for Google Sheets / Mail permission.**
Deployment is set to "Execute as: User accessing." Change it to **Execute as: Me** (Deploy ▸ Manage deployments ▸ edit ▸ new version) and redeploy. Running as the owner means reviewers never touch the Sheet.

**Reviewer sees "You do not have permission to access the requested document."**
1. **"Who has access" is "Only myself."** Switching "Execute as" to *Me* can reset this. Deploy ▸ Manage deployments ▸ edit ▸ set **Who has access: Anyone within Clustox** (not "Only myself"), then deploy a new version. This is the most common cause when the `/exec` URL is otherwise correct.
2. You shared the **`/dev`** (test) URL — only the owner/editors can open that. Share the **`/exec`** URL instead: Deploy ▸ Manage deployments ▸ copy the Web app URL (ends in `/exec`).
3. They're signed into a **personal Gmail**, not their `@clustox.com` account. Access is domain-restricted. Have them sign in with the Workspace account (test in an Incognito window).
4. **Multiple-account mismatch** (`/u/0/` vs `/u/1/`) — open the link in Incognito signed into only the clustox account.

**"Not set up yet…" error.**
An admin hasn't run `setup()` yet, or the `SPREADSHEET_ID` script property is missing. Run `setup()` once from the editor.

## Optional: Looker Studio dashboard

For a separate, shareable read-only leadership dashboard:
1. Looker Studio → **Create ▸ Data source ▸ Google Sheets** → pick the CBPMS Sheet → `Reviews` tab.
2. Build score-distribution / recommendation-breakdown charts; filter by cycle & designation.
3. Share the report read-only with leadership. The in-app Dashboard already covers day-to-day needs, so this is optional.

## Notes & follow-ups

- One review per (employee, cycle); re-submitting overwrites. Drafts auto-load when you re-select the same employee + cycle.
- Scores/gates/recommendations are recomputed **server-side** on save — the client display is just a live preview.
- The data Sheet keeps full revision history (an audit trail) automatically.
- Reviewers are emailed (via `MailApp`) when new employees are assigned to them. This needs the `script.send_mail` scope (already in `appsscript.json`) — approve it on first run.
- Possible next steps: self-review or peer-review stages, multi-reviewer averaging, reminder emails for pending drafts.
