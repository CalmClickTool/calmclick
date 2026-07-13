# CalmClick

**Pause. Check. Feel sure.**

Free, private tools that explain links, messages, and computer errors in plain English.

Maintained under the **[CalmClickTool](https://github.com/CalmClickTool)** organization.

| Surface | Best for |
|--------|----------|
| **[Website](https://calmclicktool.github.io/calmclick/)** | Instant checks, sharing a link |
| **Local download** | Offline use, maximum control (recommended) |
| **Chrome / Edge extension** | Right‑click any link while browsing |

Nothing you paste is uploaded. Checks run on your device.

---

## Public website

**https://calmclicktool.github.io/calmclick/**

Source: [github.com/CalmClickTool/calmclick](https://github.com/CalmClickTool/calmclick) (GitHub Pages).

---

## Download local copy

1. Open the site → **Get CalmClick** → **Download free local copy**  
   or grab [`downloads/calmclick-offline.zip`](downloads/calmclick-offline.zip)
2. Unzip → double‑click `index.html`

Why local is nudged: works offline, no dependency on site uptime, folder you control.

---

## Browser extension

### After Chrome Web Store approval

1. Put the store URL in `config.js` → `chromeStoreUrl`
2. Rebuild zips: `powershell -File scripts/pack.ps1`
3. Redeploy / push so the site button goes “Add to Chrome”

### Install now (developer / sideload)

1. Download [`downloads/calmclick-extension.zip`](downloads/calmclick-extension.zip) or use the `extension/` folder
2. Chrome/Edge → `chrome://extensions` → Developer mode → **Load unpacked**
3. Select the `extension` folder (manifest.json at the top level of that folder)

Full store checklist: [`store/CHROME_WEB_STORE.md`](store/CHROME_WEB_STORE.md)

---

## Protection lists (self-updating, privacy-safe)

CalmClick ships with a built-in 2026 threat pack and can **download newer public rules** from:

`https://calmclicktool.github.io/calmclick/updates/rules-latest.json`

| What updates | What never leaves the device |
|--------------|------------------------------|
| Scam pattern regexes, brand list, risky TLDs | The link/message/error you paste |

- Website: auto-checks about once/day + **Update protection lists** button  
- Offline zip: works without network; update when you next open the online site  
- Extension: optional fetch of the same feed (`host_permissions` only for our Pages host)

Edit rules: `updates/rules-latest.json` → `scripts/sync-rules.ps1` → commit.

## Rebuild download zips

```powershell
cd C:\Users\conor\calmclick
powershell -ExecutionPolicy Bypass -File .\scripts\pack.ps1
```

Creates:

- `downloads/calmclick-offline.zip` — website + data + extension (for family USB / Desktop)
- `downloads/calmclick-extension.zip` — for Chrome Web Store upload / sideload

---

## Privacy

See [privacy.html](https://calmclicktool.github.io/calmclick/privacy.html).

- No accounts, ads, or trackers  
- No server-side analysis of pasted content  
- Extension permission: `contextMenus` only  

---

## Project layout

```
calmclick/
  index.html          # Main app
  privacy.html
  config.js           # Store URL + download paths
  app.js / styles.css
  data/               # Errors, scam patterns, how-tos
  downloads/          # Generated zips (committed for the public site)
  extension/          # MV3 Chrome/Edge extension
  store/              # Chrome Web Store listing copy
  scripts/pack.ps1    # Zip builder
```

---

## License

Free for anyone to use, share, and improve. Made to help.
