# Threat model of the learnalgorithms.dev API

STRIDE analysis of `api.learnalgorithms.dev`. Reviewed whenever an endpoint is added.

## Assets

- Integrity of the feedback votes, comments, and anonymous telemetry events.
- Secrets: Matomo token, GitHub webhook secret, admin token.
- Availability of the API, and of the other services hosted on the same server.
- Privacy of the visitors: no personal data may be collected.

## Trust boundaries

Browser → HTTPS → reverse proxy (Caddy or nginx) → API container (127.0.0.1:8080) → SQLite volume.
The API also calls Matomo over HTTPS, and GitHub calls the webhook endpoint.

## Threats and mitigations

| STRIDE | Threat | Mitigation |
| :--- | :--- | :--- |
| **S**poofing | Forged GitHub webhooks | HMAC-SHA256 signature verified in constant time |
| Spoofing | Access to the admin endpoints (`/admin/feedback`, `/admin/stats`, `/admin/events`) | Random 256-bit bearer token, compared in constant time; HTTPS only; `Cache-Control: no-store` |
| Spoofing | Client faking its IP to dodge limits | Only `X-Real-IP` set by the proxy is trusted; the proxy overwrites it |
| **T**ampering | SQL injection | Bound parameters only; strict validation of every field |
| Tampering | Votes or telemetry from other websites (CSRF) | `Origin` must be `https://learnalgorithms.dev`; JSON content type required |
| Tampering | Ballot stuffing by bots | Honeypot field, minimum time on page, one vote per page and day, rate limit |
| Tampering | Arbitrary or oversized telemetry payloads (`POST /events`) | Strict allowlist for `eventType`, path regex for `page`, UUID check for `sessionId`, max 20 events/batch, 512 B metadata cap, clamped `durationMs`/`scrollPct` |
| Tampering | CSV formula injection in `/admin/events?format=csv` (CWE-1236) | Leading `=`, `+`, `-`, `@`, `\t`, `\r` neutralized with a leading apostrophe in `csv_safe` |
| **R**epudiation | Unknown changes to the deployment | Code, configuration and this document versioned in Git |
| **I**nformation disclosure | Leaking secrets | Secrets only in `.env` (mode 600) on the server; never in Git (push protection on) |
| Information disclosure | Personal data of visitors | No IPs stored or logged; daily-rotating salted hashes for rate limits; telemetry uses only random per-session UUIDs in `sessionStorage`; proxy keeps no access log |
| Information disclosure | Stored XSS through comments | API returns JSON only with `nosniff` and `default-src 'none'`; comments are shown only as text |
| Information disclosure | Version fingerprinting | `Server` header removed by the proxy |
| **D**enial of service | Floods of requests | Per-IP rate limits, 4 KB body limit (1 MB at the proxy), 10 s Matomo timeout and 15 min cache |
| Denial of service | Starving the other services of the server | Container limited to 0.5 CPU, 256 MB and 100 processes |
| **E**levation of privilege | Container escape or abuse | Non-root user, read-only file system, all capabilities dropped, `no-new-privileges` |
| Elevation of privilege | Vulnerable dependencies | No third-party packages; base image updated by Dependabot; CodeQL analysis |
| Elevation of privilege | Server compromise | SSH keys only, firewall with the needed ports only, fail2ban, automatic security updates |

## Verification

- `api/tests`: unit tests for validation, CORS, rate limits, bot filtering, authentication and webhook signatures, run by GitHub Actions on every change.
- OWASP ZAP baseline scan against the deployed API after each release.

## AI Security (OWASP Top 10 for LLM Applications)

The authenticated endpoint `POST /admin/report/interpret` forwards anonymized ETL teaching reports to an external OpenAI-compatible LLM provider. Specific controls:

- **LLM01 — Indirect Prompt Injection:** Student-submitted feedback comments and search queries are sanitized by `sanitize_for_llm()` to strip directive patterns and wrapped inside explicit `<untrusted_data>…</untrusted_data>` delimiters, while the system prompt instructs the model to treat the block strictly as passive data.
- **LLM02 — Sensitive Information Disclosure (PII):** `sanitize_for_llm()` redacts accidental emails, phone numbers, and Spanish IDs (`DNI`/`NIE`) before any text leaves the VPS. Only aggregated, anonymized telemetry is sent.
- **LLM04 / LLM10 — Unbounded Consumption / Cost Abuse:** Access requires `ADMIN_TOKEN` (constant-time `hmac.compare_digest`), a dedicated `LLM_RATE_LIMIT` (`20` requests/hour), input truncation (`16 KB`), and explicit `max_tokens` caps (`900` brief / `2500` detailed).
- **LLM09 — Misinformation / Overreliance:** Output is displayed only to the instructor inside `/admin` alongside the raw ETL report with an explicit *human-in-the-loop* disclaimer and official Core Web Vitals thresholds embedded in the system prompt.
