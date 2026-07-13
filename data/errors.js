/* Common computer / browser error explanations — plain English */
window.CALMCLICK_ERRORS = [
  {
    id: "site-cant-reach",
    title: "This site can’t be reached",
    chips: ["This site can’t be reached", "can’t be reached"],
    match: [
      /site can'?t be reached/i,
      /can'?t be reached/i,
      /dns_probe_finished_nxdomain/i,
      /err_name_not_resolved/i,
      /server ip address could not be found/i
    ],
    summary: "Your browser tried to open a website, but it could not find that site or connect to it.",
    meaning: "Often this means the address was typed wrong, the site is down, or your internet connection is having trouble.",
    safe: "Usually not a virus. It’s a connection problem.",
    steps: [
      "Check the web address for typos (for example, .com vs .co).",
      "Make sure Wi‑Fi or ethernet is connected and other sites work.",
      "Try again in a few minutes — the website may be temporarily down.",
      "If only one site fails, wait or try later. If nothing works, restart your router."
    ]
  },
  {
    id: "timed-out",
    title: "Connection timed out",
    chips: ["Connection timed out", "ERR_CONNECTION_TIMED_OUT"],
    match: [
      /connection timed out/i,
      /err_connection_timed_out/i,
      /took too long to respond/i
    ],
    summary: "The website took too long to answer, so your browser stopped waiting.",
    meaning: "Your internet may be slow, the website may be overloaded, or a firewall/VPN is blocking the path.",
    safe: "Usually not dangerous. It’s a delay, not proof of a hack.",
    steps: [
      "Refresh the page once.",
      "Try another website to test your internet.",
      "If you use a VPN, turn it off and try again.",
      "Restart the browser, then the computer if it keeps happening."
    ]
  },
  {
    id: "not-secure",
    title: "Your connection is not private / Not secure",
    chips: ["Your connection is not private", "Not secure", "NET::ERR_CERT"],
    match: [
      /connection is not private/i,
      /not secure/i,
      /net::err_cert/i,
      /privacy error/i,
      /certificate/i
    ],
    summary: "Your browser is warning that the website’s security certificate looks wrong.",
    meaning: "That can mean the site is misconfigured, you are on a public Wi‑Fi filter, the date on your computer is wrong — or rarely, someone is intercepting traffic.",
    safe: "Do not enter passwords or card numbers on a page that says “not private,” unless you fully trust the situation (for example a known school/work login page).",
    steps: [
      "Do not click “Advanced → proceed” on banking, email, or shopping sites.",
      "Check that the web address is exactly right (no extra letters).",
      "Check your computer’s date and time are correct.",
      "Try a different network (phone hotspot) and see if the warning disappears."
    ]
  },
  {
    id: "404",
    title: "404 — Page not found",
    chips: ["404", "Page not found"],
    match: [/\b404\b/i, /page not found/i, /not found/i],
    summary: "The website exists, but that exact page address does not.",
    meaning: "The link may be old, broken, or typed incorrectly.",
    safe: "Harmless. Nothing is wrong with your computer.",
    steps: [
      "Go to the website’s home page and use the menu or search box.",
      "If a friend sent the link, ask them to resend it.",
      "Try removing the end of the address after the .com (or .org) and press Enter."
    ]
  },
  {
    id: "500",
    title: "500 — Server error",
    chips: ["500", "Internal Server Error"],
    match: [/\b500\b/i, /internal server error/i, /server error/i],
    summary: "The website itself had a problem — not your computer.",
    meaning: "Their system crashed or is misconfigured. You usually can’t fix it.",
    safe: "Safe. Wait and try later.",
    steps: [
      "Refresh once after a minute.",
      "Try again later the same day.",
      "If you need help urgently, contact the company by phone using a number from their official site or a bill — not from a random email."
    ]
  },
  {
    id: "windows-genuine",
    title: "Windows is not genuine",
    chips: ["Windows is not genuine", "Activate Windows"],
    match: [/not genuine/i, /activate windows/i, /windows license/i],
    summary: "Windows thinks the copy on this PC is not properly activated.",
    meaning: "Common on second‑hand PCs, after major hardware changes, or if Windows was never activated.",
    safe: "This is a licensing message, not proof that you have a virus. Still, only buy keys from trusted sellers or Microsoft.",
    steps: [
      "Open Settings → System → Activation and read the message there.",
      "If you have a product key, enter it only in the official Windows activation screen.",
      "Ignore pop‑up websites that scream “call this number now” — many of those are scams.",
      "A trusted local computer shop can help activate Windows without a scare call."
    ]
  },
  {
    id: "low-storage",
    title: "Low disk space / storage almost full",
    chips: ["Low disk space", "storage almost full"],
    match: [/low disk/i, /disk space/i, /storage.*(full|low)/i, /not enough space/i],
    summary: "Your computer or phone is running out of free storage room.",
    meaning: "When storage is nearly full, apps crash, updates fail, and everything feels slow.",
    safe: "Not a virus by itself — just clutter or large files.",
    steps: [
      "Empty the Recycle Bin / Trash.",
      "Delete huge downloads you no longer need (old installers, videos).",
      "On Windows: Settings → System → Storage → Temporary files.",
      "Move photos/videos to an external drive or cloud if you use one you trust."
    ]
  },
  {
    id: "update-failed",
    title: "Update failed / couldn’t install updates",
    chips: ["Update failed", "Couldn’t install updates"],
    match: [/update failed/i, /couldn'?t install updates/i, /error installing updates/i, /windows update/i],
    summary: "An automatic software update did not finish correctly.",
    meaning: "Often caused by a brief internet blip, low storage, or a temporary Microsoft/server issue.",
    safe: "Usually not dangerous. Leaving updates broken for months can leave security holes, so try again when you can.",
    steps: [
      "Restart the computer and try the update again.",
      "Make sure you have free storage space.",
      "Connect to reliable Wi‑Fi (avoid flaky public networks for big updates).",
      "If it keeps failing for days, a local tech can run the official Windows Update troubleshooter with you."
    ]
  },
  {
    id: "printer",
    title: "Printer offline / won’t print",
    chips: ["Printer offline", "won’t print"],
    match: [/printer offline/i, /won'?t print/i, /print spooler/i, /failed to print/i],
    summary: "Your computer cannot talk to the printer right now.",
    meaning: "Common causes: printer is off, Wi‑Fi printer lost the network, wrong printer selected, or a stuck print job.",
    safe: "Annoying, almost never a security issue.",
    steps: [
      "Make sure the printer is powered on and shows no error lights.",
      "If it’s wireless, confirm the printer and computer are on the same Wi‑Fi.",
      "On the computer, open printers and choose “Set as default” on the correct one.",
      "Cancel old stuck jobs, then print a test page. Restart printer + computer if needed."
    ]
  },
  {
    id: "password-incorrect",
    title: "Incorrect password / sign-in failed",
    chips: ["Incorrect password", "sign-in failed"],
    match: [/incorrect password/i, /wrong password/i, /sign[- ]?in failed/i, /invalid credentials/i],
    summary: "The password (or username) did not match what the service has on file.",
    meaning: "Caps Lock, an old password, or a saved wrong password in the browser are common causes.",
    safe: "Normal. After too many tries, the account may lock temporarily to stop hackers — that’s a good thing.",
    steps: [
      "Check Caps Lock and try typing the password in a notes app first to see it.",
      "Use the official “Forgot password” link on the real website (type the address yourself).",
      "Do not call phone numbers from pop‑ups that appear after a failed login — many are scams.",
      "If you get in, update the password and write it in a safe place or password manager."
    ]
  },
  {
    id: "virus-scare",
    title: "“Your computer has a virus” pop-up",
    chips: ["Your computer has a virus", "call Microsoft support"],
    match: [
      /your computer has a virus/i,
      /call (microsoft|apple|windows) support/i,
      /infected with \d+/i,
      /do not turn off your (computer|pc)/i
    ],
    summary: "A full‑screen scare page is trying to panic you into calling a fake support number or downloading junk.",
    meaning: "Real Microsoft/Apple employees do not cold‑call you from a webpage. These pages are almost always scams.",
    safe: "Do not call the number. Do not download what it offers. You can close it safely.",
    steps: [
      "Do not call any phone number shown on the page.",
      "Close the entire browser (use Task Manager on Windows if it won’t close: Ctrl+Shift+Esc → end browser).",
      "Reopen the browser. If the page returns, clear that site or reset the browser settings with a trusted helper.",
      "Run a scan with the built‑in Windows Security app if you want peace of mind — not a random “cleaner” from the pop‑up."
    ]
  },
  {
    id: "wifi",
    title: "No internet / Wi‑Fi connected but no internet",
    chips: ["No internet", "Connected, no internet"],
    match: [/no internet/i, /connected,? no internet/i, /wifi.*(not|isn'?t) working/i, /unable to connect to the internet/i],
    summary: "Your device is on a network, but that network can’t reach the wider internet — or Wi‑Fi isn’t really connected.",
    meaning: "Router problems, ISP outages, and wrong Wi‑Fi passwords are the usual suspects.",
    safe: "Connection issue, not a hack by itself.",
    steps: [
      "Confirm other devices have the same problem. If yes, restart the router (unplug 30 seconds, plug back in).",
      "Forget the Wi‑Fi network on your device, then rejoin and re‑enter the password carefully.",
      "Move closer to the router and try again.",
      "If nothing works for hours, contact your internet provider with the account phone number on your bill."
    ]
  },
  {
    id: "clickfix",
    title: "Fake error telling you to press Win+R or paste a command",
    chips: ["Press Windows + R", "ClickFix", "paste this command"],
    match: [
      /windows\s*\+\s*r/i,
      /win\s*\+\s*r/i,
      /press\s+ctrl/i,
      /paste (this|the) (command|script|code)/i,
      /clickfix/i,
      /verification id/i,
      /mshta|powershell\s+-|iex\s*\(/i
    ],
    summary: "This is often a “ClickFix” style trap: a webpage fakes an error or CAPTCHA and tells you to run something on your computer.",
    meaning: "Real websites do not fix problems by asking you to open Run, PowerShell, or paste hidden commands. That step can install malware.",
    safe: "Do not press Win+R, do not paste into a terminal, and do not download “fixers” from that page.",
    steps: [
      "Close the tab or the whole browser. Do not follow the on-screen “fix” steps.",
      "If you already pasted/ran something, disconnect from Wi‑Fi and get help from a trusted person or shop.",
      "Run a scan with Windows Security (built into Windows).",
      "Change important passwords later from a clean device if you think something installed."
    ]
  },
  {
    id: "fake-captcha",
    title: "Fake CAPTCHA / “I’m not a robot” that asks you to copy or run steps",
    chips: ["I'm not a robot", "Verify you are human", "fake CAPTCHA"],
    match: [
      /i'?m not a robot/i,
      /verify you are human/i,
      /complete (the )?captcha/i,
      /human verification/i,
      /hold ctrl/i
    ],
    summary: "Some scams dress up as a normal CAPTCHA, then tell you to copy, paste, or run a command to “verify.”",
    meaning: "A real CAPTCHA only needs a click, checkbox, or simple puzzle — never PowerShell, Run dialog, or “press Ctrl+C then Win+R.”",
    safe: "Stop. Close the page. You did not fail a real robot check.",
    steps: [
      "Close the page. Do not copy or run anything it shows.",
      "If you reached it from a search ad or odd site, avoid that site.",
      "Use bookmarks for banking and email instead of search ads.",
      "Update your browser from its official menu (Help → About), not from a pop-up."
    ]
  },
  {
    id: "browser-outdated-scare",
    title: "“Your browser is out of date” full-screen scare",
    chips: ["Your browser is out of date", "Update Chrome now"],
    match: [
      /browser is (out of date|outdated)/i,
      /update (chrome|edge|firefox|your browser) (now|immediately)/i,
      /flash (player )?update/i
    ],
    summary: "A page is trying to rush you into installing software that may be malware.",
    meaning: "Browser updates should come from the browser itself (or your app store) — not a random website’s giant red warning.",
    safe: "Ignore the page’s download button. Close it and update the official way if needed.",
    steps: [
      "Close the scary page.",
      "In Chrome/Edge: three-dot menu → Help → About (it updates there).",
      "Do not install “Flash,” “codec packs,” or “cleanup tools” from ads.",
      "If downloads already started, delete them without opening."
    ]
  },
  {
    id: "passkey-phish",
    title: "Unexpected passkey / “re-register security key” message",
    chips: ["Re-register passkey", "security key"],
    match: [
      /passkey/i,
      /security key/i,
      /re-?register (your )?(passkey|security key)/i
    ],
    summary: "Attackers sometimes invent passkey emergencies to push you to a fake login site.",
    meaning: "Real passkey prompts happen when you are already on a site you trust and choose to sign in — not from a cold email or text with a random link.",
    safe: "Do not click the message link. Open the real site from your bookmark if you need to check.",
    steps: [
      "Do not use the link in the message.",
      "Type the real site address yourself or use a saved bookmark.",
      "If nothing seems wrong in your real account, you can ignore the message.",
      "Never share backup codes or “seed phrases” with anyone."
    ]
  }
];
