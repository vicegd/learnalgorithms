# learnalgorithms.dev API

Backend of [learnalgorithms.dev](https://learnalgorithms.dev), served at `api.learnalgorithms.dev`. It has no user accounts.

| Endpoint | Purpose |
| :--- | :--- |
| `GET /health` | Liveness check |
| `POST /feedback` | "Was this page helpful?" vote, with an optional comment |
| `GET /feedback/summary?page=/concepts/...` | Votes of one page |
| `GET /popular` | Most read lessons of the last 7 days, from Matomo |
| `POST /webhooks/github` | GitHub `issues` events, verified with HMAC-SHA256 |
| `GET /admin/feedback` | Latest votes and comments (bearer token) |

It is written with the Python standard library only, runs in a hardened Docker container behind a reverse proxy with HTTPS, and stores its data in SQLite. See [THREAT-MODEL.md](THREAT-MODEL.md) for the security design.

## Run the tests

```bash
python -m unittest discover -s api/tests -v
```

## Deploy

```bash
cd api
cp .env.example .env && chmod 600 .env    # fill in the secrets
docker compose --profile caddy up -d --build
```

Use the `caddy` profile only if ports 80 and 443 are free; otherwise proxy `127.0.0.1:8080` from the existing web server (`deploy/nginx-api.conf`).
