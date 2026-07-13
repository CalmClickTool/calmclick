# Chrome Web Store — CalmClick listing pack

Use this when uploading at [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole).

## One-time setup

1. Pay the Google developer registration fee (one-time, currently $5 USD).
2. Create a new item → **Upload** the zip: `downloads/calmclick-extension.zip`
   - The zip root must contain `manifest.json` (our pack script does this).
3. Fill the store listing using the copy below.
4. Set **Privacy practices** + single-purpose description.
5. Privacy policy URL: `https://policysnapadmin.github.io/calmclick/privacy.html`
6. Submit for review (often 1–3 days, sometimes longer).

## Listing copy

### Name
CalmClick — Check before you click

### Summary (short, ≤132 characters)
Check links & messages in plain English before you click. Free, private, no account. Built for everyone.

### Description

```
Not sure if a link or message is safe? Pause and check with CalmClick.

CalmClick explains suspicious links, scam-like emails/texts, and common computer errors in plain English — free forever, with no account.

WHAT YOU CAN DO
• Right-click any link → “Check with CalmClick”
• Right-click selected text → check a message for common scam patterns
• Open the popup to paste a link or message anytime

PRIVACY FIRST
• Checks run on your device
• We don’t upload what you paste or right-click
• No ads, no tracking, no account
• Only permission: context menu (right-click)

WHO IT’S FOR
Parents, grandparents, students, and anyone who wants a calm second opinion before clicking.

CalmClick is a helper, not a guarantee. When money or passwords are involved, verify with the company using a phone number you already trust.

Full privacy policy: https://policysnapadmin.github.io/calmclick/privacy.html
Local offline website: download from https://policysnapadmin.github.io/calmclick/#get
```

### Category
Productivity (or Social & Communication — Productivity is fine)

### Language
English

### Single purpose
Help users evaluate links and messages for common scam patterns and explain results in plain English.

### Permission justification

| Permission | Why |
|------------|-----|
| `contextMenus` | Adds right-click actions to check a link or selected text with CalmClick. |

No host permissions. No remote code. No analytics.

### Data usage (privacy practices questionnaire)

- Does not collect user data (for store purposes: you do not transmit user content to your servers).
- Not sold, not used for ads.
- If asked about “website content”: only the URL/text the user explicitly chooses to check, processed locally in the extension pages.

## Screenshots (required)

Create 1–5 screenshots, preferably **1280×800** or **640×400**:

1. Right-click menu: “Check with CalmClick”
2. Results screen with a risky lookalike domain
3. Message check with scam warnings
4. Popup paste UI

Promo images (optional but nice): small tile 440×280, marquee 1400×560.

## After approval

1. Copy the store URL.
2. Put it in `config.js` as `chromeStoreUrl`.
3. Rebuild zips (`.\scripts\pack.ps1`) and redeploy the site.
4. Update this file’s YOUR-DOMAIN placeholders for the next release notes.
