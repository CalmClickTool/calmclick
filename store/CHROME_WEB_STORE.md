# Chrome Web Store — CalmClick listing pack

Upload zip: **`downloads/calmclick-extension.zip`**  
Privacy policy: **https://calmclicktool.github.io/calmclick/privacy.html**  
Homepage: **https://calmclicktool.github.io/calmclick/**

## One-time setup

1. Register as a Chrome Web Store developer (one-time fee).
2. **New item** → Upload `downloads/calmclick-extension.zip`  
   (zip root must contain `manifest.json` — `scripts/pack.ps1` does this).
3. Fill listing copy below.
4. Complete **Privacy practices** questionnaire honestly (see below).
5. Submit for review.

## Listing copy

### Name
CalmClick - Check before you click

### Summary (≤132 characters)
Check links & messages in plain English before you click. Free, private, no account. On-device checks.

### Description

```
Not sure if a link or message is safe? Pause and check with CalmClick.

CalmClick looks for common scam and phishing patterns in links and message text, then explains the result in plain English. Free, no account.

WHAT YOU CAN DO
• Right-click any link → “Check with CalmClick”
• Right-click selected text → check a message for common scam patterns
• Open the toolbar popup to paste a link or message anytime

HOW IT WORKS (HONEST LIMITS)
• Checks run on your device using a packaged pattern list
• This is a helper, not a live virus scan or guarantee of safety
• New scams can appear before our list is updated (updates ship with new extension versions)
• When money or passwords are involved, verify with the company using a number you already trust

PRIVACY
• We do not upload the link or text you choose to check
• No ads, no account, no analytics SDKs
• Permissions: context menu + temporary session storage for the check handoff

Full privacy policy: https://calmclicktool.github.io/calmclick/privacy.html
Website & offline download: https://calmclicktool.github.io/calmclick/#get
Source: https://github.com/CalmClickTool/calmclick
```

### Category
Productivity

### Language
English

### Single purpose
Help users evaluate links and selected text for common scam/phishing patterns and show plain-English guidance.

### Permission justifications (dashboard)

| Permission | Justification |
|------------|----------------|
| `contextMenus` | Adds right-click “Check with CalmClick” on links and selected text. |
| `storage` | Temporarily stores the chosen link/text so the checker page can open without putting private text in the URL bar. |

**Host permissions:** none.  
**Remote code:** none. Pattern data is packaged with the extension.  
**Analytics / ads:** none.

### Privacy practices questionnaire (suggested answers)

- **Does the extension collect user data?** No (user content is processed on-device and not sent to your servers).
- **Sold to third parties?** No.
- **Used for purposes unrelated to the single purpose?** No.
- **Website content / URL?** Only when the user explicitly right-clicks or pastes something to check; processed locally; not transmitted to developer servers.

If Google asks about “storage”: disclose session handoff of the user-selected check payload on-device only.

## Screenshots (required)

1–5 images, **1280×800** or **640×400**:

1. Right-click menu: “Check with CalmClick”
2. Checker result for a lookalike domain (e.g. paypa1-style)
3. Message result with scam-pattern warnings
4. Popup paste UI

Optional: small promo 440×280.

## After approval

1. Put the store URL in site `config.js` → `chromeStoreUrl`
2. Run `powershell -File scripts/pack.ps1` and push so the website button updates
