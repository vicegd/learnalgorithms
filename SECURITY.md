# Security Policy

## Scope

This policy covers:

- the website [learnalgorithms.dev](https://learnalgorithms.dev) and the source code in this repository;
- the API at `api.learnalgorithms.dev`, once it is published.

## Reporting a vulnerability

Please **do not open a public issue** for security problems.

Report them privately through [GitHub's private vulnerability reporting](https://github.com/vicegd/learnalgorithms/security/advisories/new). Include:

- the affected page, endpoint or file;
- the steps to reproduce the problem and its possible impact;
- any proof of concept, if you have one.

You will receive an acknowledgement within **7 days**. Confirmed vulnerabilities are fixed as soon as possible, and you will be credited in the advisory unless you prefer otherwise.

## Security measures

- **Static website:** no user accounts and no personal data. A Content Security Policy restricts the sources of scripts, styles, fonts, images and connections.
- **Dependencies:** Dependabot keeps npm packages and GitHub Actions up to date.
- **Code analysis:** CodeQL scans the code on every push and every week.
- **Secrets:** secret scanning with push protection is enabled; no credentials are stored in the repository.
- **Contact:** [`/.well-known/security.txt`](https://learnalgorithms.dev/.well-known/security.txt) (RFC 9116).
