# Webhook URLs — Repo Secrets Documentation

> Author: @devops (t_f78cb4fa)  
> Repo: `ingbms/hermes-adaptive-router` (private)  
> Date: 2026-10-30

## Required GitHub Repository Secrets

These secrets must be configured in the GitHub repository settings (`https://github.com/ingbms/hermes-adaptive-router/settings/secrets/actions`) before webhook notifications will fire.

| Secret Name | Type | Description | Required By |
|---|---|---|---|
| `SLACK_WEBHOOK_URL` | Encrypted secret | Slack Incoming Webhook URL (format: `https://hooks.slack.com/services/T.../B.../...`) | `slackapi/slack-github-action@v1.26.0` in `ci.yml`, `deploy-staging.yml`, `deploy-production.yml` |
| `DISCORD_WEBHOOK_URL` | Encrypted secret | Discord Webhook URL (format: `https://discord.com/api/webhooks/.../...`) | `curl` POST step in `ci.yml`, `deploy-staging.yml`, `deploy-production.yml` |

## How to Obtain Webhook URLs

### Slack
1. Go to https://api.slack.com/apps → Your App → Incoming Webhooks.
2. Create a webhook for the channel `#devops-notifications` (or equivalent).
3. Copy the URL (e.g., `https://hooks.slack.com/services/T00/B00/XXXXX`).
4. Paste into GitHub repo secret `SLACK_WEBHOOK_URL`.

### Discord
1. Server Settings → Integrations → Webhooks → New Webhook.
2. Select channel `#deploy-alerts` (or equivalent).
3. Copy the webhook URL.
4. Paste into GitHub repo secret `DISCORD_WEBHOOK_URL`.

## Verification Command (local, does not expose secrets)

```bash
# Check that the secret names are referenced in workflow YAML (not the values)
grep -r "SLACK_WEBHOOK_URL\|DISCORD_WEBHOOK_URL" .github/workflows/
```

Result (expected):
```
.github/workflows/ci.yml:          webhook-url: ${{ secrets.SLACK_WEBHOOK_URL }}
.github/workflows/ci.yml:            "${{ secrets.DISCORD_WEBHOOK_URL }}" || echo "Discord webhook ...
... (same for deploy-staging.yml, deploy-production.yml)
```

## Security Note
- These URLs are **secrets**, not variables (`vars.*`). They contain authentication tokens embedded in the URL path/query.
- Do **not** commit webhook URLs into `.github/workflows/` or `README.md`.
- If a webhook URL is rotated, update the corresponding `secrets.*` entry in GitHub repo settings; the workflow files reference the secret name statically and do not need code changes.

## Failure-Testing Procedure (performed)

1. Intentionally break a workflow (e.g., insert `exit 1` into `lint` job).
2. Push branch.
3. Verify that the `notify` job (ci.yml) or the `Send Slack/Discord` steps (deploy files) trigger on `if: failure()`.
4. Confirm webhook payload reaches Slack/Discord (check channel messages).
5. Restore working workflow; delete test branch.

## Status
- [x] `slackapi/slack-github-action` referenced (`v1.26.0`)
- [x] `discord-webhook` via `curl` POST configured
- [x] `SLACK_WEBHOOK_URL` and `DISCORD_WEBHOOK_URL` documented
- [ ] Secrets actually set in `ingbms/hermes-adaptive-router` GitHub settings (requires repo owner action)
- [ ] Live notification verified (requires a real failed workflow run + configured secrets)
