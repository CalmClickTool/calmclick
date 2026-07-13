/* Auto-generated from updates/rules-latest.json â€” do not edit by hand.
 * Rebuild: powershell -File scripts/sync-rules.ps1
 */
window.CALMCLICK_BUNDLED_RULES = {
  "schemaVersion": 1,
  "rulesVersion": "2026.07.13",
  "updatedAt": "2026-07-13",
  "minAppVersion": "1.1.0",
  "changelog": [
    "Expanded 2026 scam patterns: ClickFix, fake CAPTCHA, quishing, pig-butchering, MFA fatigue, AI voice-clone pressure",
    "More lookalike brands, risky TLDs, and URL shorteners",
    "Crypto drainer / seed-phrase and passkey-phishing signals",
    "Job-offer, package-hold, and â€˜browser updateâ€™ scare patterns"
  ],
  "trustedBrands": [
    "google", "gmail", "youtube", "microsoft", "apple", "icloud", "amazon", "paypal",
    "netflix", "facebook", "instagram", "whatsapp", "meta", "chase", "wellsfargo",
    "bankofamerica", "citibank", "capitalone", "americanexpress", "amex", "discover",
    "irs", "ssa", "usps", "ups", "fedex", "dhl", "ebay", "walmart", "target", "costco",
    "dropbox", "linkedin", "twitter", "adobe", "zoom", "spotify", "venmo", "cashapp",
    "zelle", "coinbase", "binance", "kraken", "robinhood", "fidelity", "vanguard",
    "outlook", "office", "office365", "microsoft365", "onedrive", "sharepoint",
    "docusign", "intuit", "turbotax", "hulu", "disney", "bestbuy", "homedepot",
    "lowes", "att", "verizon", "tmobile", "comcast", "xfinity", "spectrum",
    "github", "steam", "epicgames", "playstation", "xbox", "nintendo", "tiktok",
    "snapchat", "telegram", "signal", "chatgpt", "openai", "claude", "anthropic"
  ],
  "suspiciousTlds": [
    "zip", "mov", "xyz", "top", "gq", "tk", "ml", "cf", "ga", "work", "click",
    "country", "stream", "download", "racing", "review", "science", "kim", "men",
    "loan", "win", "bid", "trade", "webcam", "party", "accountants", "date",
    "faith", "cricket", "realtor", "support", "security", "help", "rest",
    "cfd", "sbs", "cyou", "icu", "buzz", "monster", "quest", "bond", "hair",
    "skin", "motorcycles", "yachts", "boats", "vip", "club", "online", "site",
    "website", "space", "fun", "live", "today", "cam", "mom", "dad", "ink"
  ],
  "shorteners": [
    "bit.ly", "tinyurl.com", "t.co", "goo.gl", "rebrand.ly", "ow.ly", "is.gd",
    "buff.ly", "cutt.ly", "shorturl.at", "rb.gy", "tiny.cc", "s.id", "v.gd",
    "t.ly", "lnkd.in", "db.tt", "j.mp", "tr.im", "cli.re", "short.io",
    "bl.ink", "soo.gd", "qr.ae", "adf.ly", "bc.vc", "ouo.io", "shorte.st"
  ],
  "signals": [
    {
      "id": "urgency",
      "label": "Creates urgency or fear",
      "weight": 2,
      "patterns": [
        "\\b(urgent|immediately|right away|act now|within \\d+\\s*(hours?|minutes?|days?))\\b",
        "\\b(account (will be|is being) (closed|suspended|locked|deactivated|terminated|limited))\\b",
        "\\b(final (notice|warning)|last chance|expire[sd]? soon|limited time)\\b",
        "\\b(legal action|arrest|warrant|lawsuit|collections?|repo(ssess)?|evict)\\b",
        "\\b(your (package|delivery|parcel|shipment) (could not|failed|is held|on hold|pending))\\b",
        "\\b(respond within|confirm within|verify within)\\s*\\d+",
        "\\b(suspended (in|within)|will be deleted|permanent(ly)? (ban|delete|close))\\b"
      ]
    },
    {
      "id": "credentials",
      "label": "Asks for passwords, codes, or account takeover help",
      "weight": 3,
      "patterns": [
        "\\b(enter|confirm|verify|update|send|share|reply with)\\b.{0,50}\\b(password|passcode|pin|otp|one[- ]time|security code|2fa|authentication code|backup codes?|recovery codes?)\\b",
        "\\b(username and password|login details|account credentials|sign[- ]?in (info|details))\\b",
        "\\b(remote (access|desktop|session)|anydesk|teamviewer|quick assist|rustdesk|splashtop|logmein)\\b",
        "\\b(seed phrase|recovery phrase|secret recovery|private key|12[- ]word|24[- ]word|mnemonic)\\b",
        "\\b(passkey|security key).{0,40}\\b(reset|re[- ]?register|confirm|verify)\\b",
        "\\b(session (token|cookie)|paste (this )?code|read (me )?(the )?code (from|on) (your )?(phone|authenticator))\\b"
      ]
    },
    {
      "id": "money",
      "label": "Asks for money, gift cards, crypto, or instant payments",
      "weight": 3,
      "patterns": [
        "\\b(gift\\s*cards?|itunes|google play|steam card|apple (gift )?card|visa gift)\\b",
        "\\b(wire transfer|western union|moneygram|bitcoin|btc|ethereum|eth|crypto(currency)?|usdt|usdc|wallet address|seed wallet)\\b",
        "\\b(pay (a |the )?(fee|fine|tax|bail|release fee|processing fee|customs fee))\\b",
        "\\b(refund|overpayment).{0,50}\\b(send|return|wire|crypto|gift)\\b",
        "\\b(you('ve| have) won|lottery|sweepstakes|claim your (prize|reward|refund))\\b",
        "\\b(zelle|venmo|cash\\s*app|apple pay|google pay|wise|paypal).{0,40}\\b(send|transfer|pay|now)\\b",
        "\\b(connect (your )?wallet|approve (the )?transaction|sign (the )?message|claim airdrop)\\b",
        "\\b(investment (return|opportunity)|guaranteed profit|double your money|risk[- ]free returns?)\\b"
      ]
    },
    {
      "id": "impersonation",
      "label": "Pretends to be a bank, government, IT, or big company",
      "weight": 2,
      "patterns": [
        "\\b(irs|social security|ssa|medicare|dmv|fbi|cia|border patrol|ice|uscis|treasury)\\b",
        "\\b(microsoft|apple|google|amazon|paypal|netflix|bank of america|wells fargo|chase|coinbase)\\b.{0,40}\\b(support|security|alert|notice|helpdesk|it department)\\b",
        "\\b(this is (the )?(fraud|security|compliance|collections) department)\\b",
        "\\b(we detected (unusual|suspicious|unauthorized) (activity|sign[- ]?in|login|purchase))\\b",
        "\\b(your (microsoft|apple|google|amazon|netflix|paypal) (account|id|subscription))\\b.{0,40}\\b(suspend|lock|bill|charge|verify)\\b",
        "\\b(it (support|help ?desk|department)|service desk).{0,40}\\b(call|remote|password|ticket)\\b",
        "\\b(ceo|cfo|executive).{0,30}\\b(urgent (wire|transfer|payment)|do this quietly)\\b"
      ]
    },
    {
      "id": "secrecy",
      "label": "Tells you to keep it secret or avoid normal channels",
      "weight": 2,
      "patterns": [
        "\\b(do not tell|don't tell|keep this (a )?secret|between us|confidential|don't mention)\\b",
        "\\b(do not (call|contact) (the )?bank|ignore other messages|don't talk to (anyone|your family))\\b",
        "\\b(move (this |the )?(chat|conversation) to (telegram|whatsapp|signal|text))\\b",
        "\\b(delete (this|our) (messages?|chat|conversation) after)\\b"
      ]
    },
    {
      "id": "links",
      "label": "Pushes a link, QR code, or download hard",
      "weight": 1,
      "patterns": [
        "\\b(click (here|below|this link)|tap (here|below)|open the attachment)\\b",
        "\\b(download (now|the (file|app|invoice|document|update|browser)))\\b",
        "https?:\\/\\/\\S+",
        "\\b(bit\\.ly|tinyurl|t\\.co|goo\\.gl|rebrand\\.ly|cutt\\.ly|rb\\.gy)\\b",
        "\\b(scan (this |the )?qr|qr code (below|attached)|point your camera)\\b",
        "\\b(login portal|secure portal|document shared with you|view (shared )?document)\\b"
      ]
    },
    {
      "id": "romance",
      "label": "Romance or â€˜too good to be trueâ€™ help / investment pitch",
      "weight": 2,
      "patterns": [
        "\\b(my (dear|love|honey)|god bless you|we are meant to be|my beloved)\\b",
        "\\b(stuck (in|at)|stranded|emergency (surgery|hospital)|customs fee|diplomatic bag)\\b",
        "\\b(i need (your )?help (with|to) (money|transfer|fees|investment))\\b",
        "\\b(crypto (trading|mentor|platform)|binary options|forex signal|account manager assigned)\\b",
        "\\b(send (a )?(small|first) (amount|deposit)|prove (your )?(trust|love) with)\\b"
      ]
    },
    {
      "id": "clickfix",
      "label": "ClickFix / fake error: tells you to run or paste commands",
      "weight": 4,
      "patterns": [
        "\\b(press (windows|win) ?\\+ ?r|win ?\\+ ?r|open run dialog)\\b",
        "\\b(press (ctrl|control) ?\\+ ?(shift )? ?(c|v)|copy (and|&) paste (this|the) (command|script|code))\\b",
        "\\b(powershell|cmd\\.exe|command prompt|mshta|wscript|cscript|bitsadmin|curl .+\\|.+?(bash|sh|iex))\\b",
        "\\b(fix (this|the) (error|problem) by (running|pasting|typing))\\b",
        "\\b(verification (id|token).{0,40}(run|paste|powershell|terminal))\\b",
        "\\b(human verification).{0,60}\\b(press|copy|paste|run|windows)\\b"
      ]
    },
    {
      "id": "fake_captcha",
      "label": "Fake CAPTCHA or â€˜prove youâ€™re humanâ€™ malware lure",
      "weight": 3,
      "patterns": [
        "\\b(i'?m not a robot|verify you are human|complete (the )?captcha|cloudflare verification failed)\\b.{0,80}\\b(copy|paste|press|run|download)\\b",
        "\\b(anti[- ]bot check|browser check failed|ray id).{0,60}\\b(download|fix|update|allow)\\b",
        "\\b(hold (ctrl|control).{0,20}(c|v).{0,40}(verify|confirm|continue))\\b"
      ]
    },
    {
      "id": "mfa_fatigue",
      "label": "MFA / push-notification fatigue or code phishing",
      "weight": 3,
      "patterns": [
        "\\b(approve (the )?(sign[- ]?in|login) (request|prompt|notification))\\b",
        "\\b(if you did not (approve|tap)|keep (tapping|approving)|number matching)\\b",
        "\\b(did you (just )?try to (sign|log) ?in)\\b.{0,40}\\b(approve|deny|code)\\b",
        "\\b(authenticator (app )?code|duo (push|prompt)|okta verify)\\b.{0,40}\\b(send|reply|read|tell)\\b"
      ]
    },
    {
      "id": "ai_voice_deepfake",
      "label": "AI voice / deepfake or â€˜Iâ€™m in troubleâ€™ family emergency",
      "weight": 3,
      "patterns": [
        "\\b(this (is|sounds like) (mom|dad|your (son|daughter|grandson|granddaughter)))\\b.{0,80}\\b(bail|jail|arrest|accident|hospital|wire|gift card)\\b",
        "\\b(don't hang up|stay on the (line|phone)|do not call (mom|dad|the police) back)\\b",
        "\\b(voice (clone|message)|i sound different because|bad connection).{0,60}\\b(money|bail|wire|urgent)\\b",
        "\\b(kidnapped|ransom|hurt (him|her|them) if you)\\b"
      ]
    },
    {
      "id": "job_offer",
      "label": "Fake job / task / check-cashing scam patterns",
      "weight": 2,
      "patterns": [
        "\\b(work from home|remote (job|position)|hiring immediately|no experience (needed|required))\\b.{0,60}\\b(payment|check|deposit|crypto|daily pay)\\b",
        "\\b(task (job|platform)|like (and )?review products|reship(ping)? (package|goods)|package mule)\\b",
        "\\b(we (over)?paid you|deposit (this )?check).{0,50}\\b(send back|wire|keep \\$?\\d+)\\b",
        "\\b(linkedin).{0,40}\\b(crypto|investment|trading mentor|account manager)\\b"
      ]
    },
    {
      "id": "delivery_toll",
      "label": "Package / toll / postage fee scam",
      "weight": 2,
      "patterns": [
        "\\b(usps|ups|fedex|dhl|royal mail|canada post)\\b.{0,50}\\b(fee|duty|customs|redelivery|held|pending)\\b",
        "\\b(unpaid (toll| tolls)|toll (violation|notice)|ez[- ]?pass|highway toll)\\b",
        "\\b(delivery attempt failed|schedule redelivery|pay (shipping|postage) to release)\\b",
        "\\b(tracking (number|id).{0,40}(pay|fee|click|confirm))\\b"
      ]
    },
    {
      "id": "browser_update_scare",
      "label": "Fake browser / Flash / codec update scare",
      "weight": 3,
      "patterns": [
        "\\b(your (browser|chrome|edge|firefox|safari) is (out of date|outdated|not secure))\\b",
        "\\b(update (flash|silverlight|codec|video player) (now|to (watch|continue)))\\b",
        "\\b(critical (security )?update).{0,40}\\b(download|install|run)\\b.{0,40}\\b(immediately|now)\\b",
        "\\b(your device (is )?(infected|hacked|locked)|\\d{2,3}% (infected|damaged))\\b"
      ]
    },
    {
      "id": "wallet_drainer",
      "label": "Crypto wallet connect / drainer / airdrop lure",
      "weight": 3,
      "patterns": [
        "\\b(connect wallet|walletconnect|claim (your )?(airdrop|tokens?|nft)|mint (now|free))\\b",
        "\\b(approve (all|unlimited) (tokens?|spending|allowance)|set approval for all)\\b",
        "\\b(sync (your )?wallet|validate (your )?wallet|rectify (your )?wallet)\\b",
        "\\b(drainer|phishing dapp|free nft|whitelist spot)\\b"
      ]
    },
    {
      "id": "quishing",
      "label": "QR-code pressure (quishing)",
      "weight": 2,
      "patterns": [
        "\\b(scan (to )?(pay|login|verify|unlock|park|wifi))\\b",
        "\\b(parking (fine|ticket|payment).{0,40}(qr|scan))\\b",
        "\\b(multi[- ]factor|2fa|mfa).{0,40}\\b(scan (this |the )?qr)\\b"
      ]
    },
    {
      "id": "grammar_pressure",
      "label": "Odd formal pressure + money language",
      "weight": 1,
      "patterns": [
        "\\b(kindly|do the needful)\\b.{0,60}\\b(payment|transfer|account|password)\\b",
        "\\b(dear (customer|user|valued|beneficiary|winner))\\b",
        "\\b(compliments of the (day|season)|i am (the )?(son|daughter) of)\\b"
      ]
    }
  ]
};

