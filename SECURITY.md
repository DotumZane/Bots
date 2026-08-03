# Security policy

## Supported versions

Security fixes are applied to the latest `ghcr.io/dotumzane/bots:latest` image. Users should keep the container updated through Unraid.

## Reporting a vulnerability

Please do not publish security vulnerabilities in a public issue. Use GitHub's **Security → Report a vulnerability** feature for the Bots repository. Include the affected version or image digest, reproduction steps, impact, and any suggested mitigation.

You should receive an acknowledgement within seven days. Confirmed issues will be prioritized according to severity and disclosed after a fix is available.

## Deployment guidance

Bots is intended for a trusted home network and does not include user authentication. Do not expose it directly to the internet. If remote access is required, place it behind an authenticated reverse proxy and TLS.
