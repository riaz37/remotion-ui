# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.4.x   | Yes       |
| < 0.4   | No        |

## Reporting a vulnerability

Please **do not** open a public GitHub issue for security problems.

1. Open a [private security advisory](https://github.com/riaz37/remotion-ui/security/advisories/new) on GitHub, or
2. Email the maintainer via the contact on their GitHub profile.

Include:

- Description of the issue
- Steps to reproduce
- Impact assessment (CLI, registry install path, docs site, etc.)

We aim to acknowledge reports within 72 hours.

## Release credential handling

Publish `remotion-ui` from the GitHub Actions `Publish CLI` workflow using npm
Trusted Publishing whenever possible. Configure the npm package trusted publisher
for repository `riaz37/remotion-ui`, workflow filename `publish.yml`, and the
`npm-publish` environment.

After a Trusted Publishing release succeeds, change the npm package publishing
access setting to require 2FA and disallow tokens, then revoke any old automation
tokens. If a token fallback is temporarily needed, use a short-lived,
package-scoped granular token and revoke it immediately after publishing.
