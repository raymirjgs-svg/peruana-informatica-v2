# Security

## Credential rotation

Real credentials were committed to this repository's history before 2026-10-20.
History was **not** rewritten (decision documented in the remediation plan), so
the old values are still readable in past commits. Rotation is the mitigation:
every key below must be revoked and reissued, and only the new value may be used.

| Key | Where | Action |
| --- | --- | --- |
| `JWT_SECRET` | backend env | Generate a new random value; invalidates all sessions |
| `NEXTAUTH_SECRET` | frontend env | Generate a new random value |
| Google OAuth client secret | Google Cloud Console | Rotate the client secret, update `GOOGLE_CLIENT_SECRET` |
| Gemini API key | Google AI Studio | Revoke and create a new key |
| ERP Peruana token | ERP provider | Issue a new `API_PERUANA_TOKEN` |
| Mercado Pago access token | Mercado Pago dashboard | Rotate `MP_ACCESS_TOKEN`; set a real `MP_WEBHOOK_SECRET` |
| SMTP password | Mail provider | Rotate the app password |
| MySQL / Redis passwords | Infra | Rotate and update the secret store |

Never write real values into the repository. Production values are injected at
deploy time from the CI secret `ENV_PRODUCTION` into `envs/.env.production`.

## Secret scanning

- Local: `gitleaks detect --no-git --source . --config .gitleaks.toml --redact`
- CI: `.github/workflows/security.yml` runs the same scan on pushes and pull requests.

`.gitleaks.toml` allows the env templates, fixtures, docs and lockfiles, which
only contain placeholders. Any other match is a real finding.
