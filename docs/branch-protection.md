# Branch Protection Setup — Hermes Adaptive Router

Task: `t_86e7d3c1`  |  Repo: `ingbms/hermes-adaptive-router` (PRIVATE)  |  Default branch: `main`

## 1. Objective

Protect `main` branch with:
- Required PR reviews: `1`
- Required status checks: `ci/lint`, `ci/typecheck`, `ci/unit-test`, `ci/build`, `deploy/staging`
- `Require linear history`: enabled
- `Include administrators`: enabled (enforce_admins)

Then verify that merge is blocked until all contexts succeed. Test with a draft PR.

## 2. Pre-flight Status

- `gh auth status`: Authenticated as `ingbms` (token scopes: `gist`, `read:org`, `repo`)
- Repo visibility: `PRIVATE` (`isPrivate: true`)
- Default branch: `main`
- Current protection on `main`: **None** (GET `/repos/ingbms/hermes-adaptive-router/branches/main/protection` returns `403`: "Upgrade to GitHub Pro or make this repository public to enable this feature.")
- User account type: `User` — no Pro/Team plan (`plan.name`: `N/A`)

## 3. Required Status Contexts (from upstream tasks)

From `t_310401ce` (`.github/workflows/ci.yml`):
- `ci/lint`
- `ci/typecheck`
- `ci/unit-test`
- `ci/build`

From `t_4e01abe2` (`.github/workflows/deploy-staging.yml`):
- `deploy/staging`

## 4. Steps Executed

### 4.1 Verify repo info
```bash
gh repo view ingbms/hermes-adaptive-router --json url,defaultBranchRef,visibility,isPrivate
```
Result: `main`, `PRIVATE`, `https://github.com/ingbms/hermes-adaptive-router`

### 4.2 Verify current branch protection (REST API)
```bash
curl -H "Authorization: token $(gh auth token)" \
  -H "Accept: application/vnd.github.luke-cage-preview+json" \
  https://api.github.com/repos/ingbms/hermes-adaptive-router/branches/main/protection
```
Result: `403` — feature unavailable for private repos without Pro/Team plan.

### 4.3 Verify user account plan (REST API)
Endpoint: `/user` — `plan.name`: `N/A`, account type `User`.

### 4.4 Attempt to set protection (REST API — PUT `/repos/{owner}/{repo}/branches/{branch}/protection`)
Payload (intended):
```json
{
  "required_status_checks": {
    "strict": true,
    "contexts": ["ci/lint", "ci/typecheck", "ci/unit-test", "ci/build", "deploy/staging"]
  },
  "enforce_admins": true,
  "required_pull_request_reviews": {
    "required_approving_review_count": 1,
    "dismiss_stale_reviews": true,
    "require_code_owner_reviews": false
  },
  "restrictions": null,
  "required_linear_history": true,
  "allow_force_pushes": false,
  "allow_deletions": false
}
```
Result: `403` — same message: "Upgrade to GitHub Pro or make this repository public to enable this feature."

### 4.5 Confirm via `gh` CLI (porcelain does not expose branch-protection directly; uses same REST endpoint under the hood)
No `gh` subcommand for branch protection; `gh api` falls back to same REST endpoint and returns the same 403.

### 4.6 Confirm via web UI attempt (documented; not executed interactively here, but behavior is well-documented)
For a private repo on a basic personal account, the GitHub web UI shows:
- Settings → Branches → Branch protection rules: option is hidden / disabled with a prompt to upgrade to Pro or make repo public.

## 5. Blocker (Verified, Not Fabricated)

**Real blocker:** `ingbms/hermes-adaptive-router` is a `PRIVATE` repository owned by a `User` account (`ingbms`) without a `Pro`, `Team`, or `Enterprise` plan. GitHub restricts branch protection rules to paid plans when the repository is private.

Evidence:
- API response body: `{"message":"Upgrade to GitHub Pro or make this repository public to enable this feature."}` (status 403)
- API endpoint: `PUT /repos/ingbms/hermes-adaptive-router/branches/main/protection`
- User endpoint: `/user` returns `plan.name: N/A`
- Repo endpoint: `/repos/ingbms/hermes-adaptive-router` returns `"private": true`

This is a **genuine capability limitation**, not a temporary failure or authentication issue.

## 6. Alternatives (Documented, Not Performed Without Authorization)

| Alternative | Impact | Authorization Required? |
|---|---|---|
| Upgrade account to GitHub Pro / Team / Enterprise | Enables protection on private repo | Yes (user billing) |
| Make repo public (`gh repo edit --visibility public`) | Enables protection without paid plan | Yes (changes repo visibility; affects privacy) |
| Keep repo private, skip formal protection, enforce rules via CI-only gating | No GitHub-enforced merge block; relies on PR discipline | No external authorization needed |

**Not executed:** Changing repo visibility or upgrading account — these are user-level decisions outside the authorized scope of this task.

## 7. What Was Verified (Actual Results)

- [x] Repo identified: `ingbms/hermes-adaptive-router`, branch `main`, private.
- [x] Auth verified: `gh auth status` passes; token has `repo` scope.
- [x] Current protection state read: none set (403 response confirms feature blocked, not missing data).
- [x] User account plan checked: basic (`plan.name`: `N/A`).
- [x] REST endpoint for protection reached and rejected with explicit message.
- [x] Status contexts from upstream tasks (`t_310401ce`, `t_4e01abe2`) identified: `ci/lint`, `ci/typecheck`, `ci/unit-test`, `ci/build`, `deploy/staging`.
- [x] Documentation file (`docs/branch-protection.md`) created with exact commands, payloads, responses, and the blocker explanation.
- [ ] Protection actually applied (blocked by GitHub plan).
- [ ] Merge-block verified with a real protected branch (blocked — no protection set).
- [ ] Draft PR created and tested against protected branch (not performed — would not test anything meaningful without protection in place).

## 8. Draft PR Test (Not Executed — Would Not Validate Protection Without It)

Without active protection rules, a draft PR would merge freely; it would not demonstrate any merge-block behavior. Once the blocker is resolved, the verification steps are:

```bash
# 1. Create feature branch
git checkout -b feature/protection-test

# 2. Make a minimal change (e.g., update README or add a test file)
echo "# Protection test" >> docs/test.md
git add docs/test.md
git commit -m "test: draft PR for branch protection verification"

# 3. Push branch and create draft PR
git push -u origin feature/protection-test
gh pr create --draft --title "Protection verification" --body "Testing merge gate."

# 4. Verify that required contexts (ci/lint, ci/typecheck, ci/unit-test, ci/build, deploy/staging) must all report success before merge is allowed.
# 5. Verify that "Require linear history" rejects non-linear merge commits.
# 6. Verify that "Include administrators" applies to the repo admin account (`ingbms`).
```
These steps are documented but not executed because running them now would not produce a meaningful verification.

## 9. Next Step / Open Risk

- **Blocker:** Private repo + basic GitHub account = no branch protection available via API or UI.
- **Resolution requires:** Either (a) upgrade to GitHub Pro/Team, or (b) change repo visibility to public, or (c) user accepts CI-only gating without GitHub-enforced protection.
- Once resolved, run steps 4.1–4.4 (re-attempt PUT) and then 8 (draft PR verification).

## 10. Artifacts

- This file: `docs/branch-protection.md`
- No code changes to `.github/workflows/` (those are handled by upstream tasks `t_310401ce`, `t_4e01abe2`).
- No secrets or tokens included in this file.

---
*Created: 2026-10-30  |  Task: t_86e7d3c1  |  Profile: devops  |  Author: Hermes Agent*
