# SECURITY

## Current security model
- AI provider API keys are entered by users in Settings.
- Keys are persisted client-side through Zustand persistence.
- Backend does not store provider keys.

## Data handling
- Content is processed through selected external AI provider APIs.
- API routes in this app are minimal and do not proxy sensitive key storage.

## Security rules for contributors
- Never hardcode API keys, tokens, or secrets.
- Never commit `.env` secrets.
- Keep error handling explicit; avoid leaking sensitive data in UI/logs.
- Validate user input before sending to external services.

## Configuration notes
- `next.config.js` currently allows broad remote image hosts (`**`).
- Treat image URLs as untrusted input and avoid trusting fetched metadata.

## Recommended operational practices
- Use least-privilege API keys where provider supports scopes.
- Rotate compromised keys immediately.
- Keep dependencies up to date and run regular vulnerability checks.
