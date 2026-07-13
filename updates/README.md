# Protection list feed

`rules-latest.json` is the **public, versioned** pattern pack CalmClick can download.

## Privacy

- Clients only **GET** this file.
- They never upload links, messages, or errors the user is checking.
- Offline / local copies keep working with `data/bundled-rules.js`.

## How “self-improving” works

1. Maintainers (or contributors) add new scam patterns to `rules-latest.json`.
2. Bump `rulesVersion` (use `YYYY.MM.DD` or `YYYY.MM.DD.N`).
3. Run `powershell -File scripts/sync-rules.ps1` to refresh the offline bundle.
4. Commit + push — GitHub Pages serves the new feed within a few minutes.
5. Site and extension auto-check about once per day (or via **Update protection lists**).

This is **human-curated improvement**, not ML that learns from users’ private pastes.

## Suggest a new pattern

Open an issue or PR on the repo describing:

- Example scam wording (redact personal info)
- Why it’s harmful
- Suggested plain-English label
