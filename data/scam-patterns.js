/* Scam / social-engineering pattern library — runs entirely in the browser */
window.CALMCLICK_SCAM = {
  signals: [
    {
      id: "urgency",
      label: "Creates urgency or fear",
      weight: 2,
      patterns: [
        /\b(urgent|immediately|right away|act now|within \d+\s*(hours?|minutes?|days?))\b/i,
        /\b(account (will be|is being) (closed|suspended|locked|deactivated|terminated))\b/i,
        /\b(final (notice|warning)|last chance|expire[sd]? soon)\b/i,
        /\b(legal action|arrest|warrant|lawsuit)\b/i,
        /\b(your (package|delivery) (could not|failed|is held))\b/i
      ]
    },
    {
      id: "credentials",
      label: "Asks for passwords or codes",
      weight: 3,
      patterns: [
        /\b(enter|confirm|verify|update|send)\b.{0,40}\b(password|passcode|pin|otp|one[- ]time|security code|2fa|authentication code)\b/i,
        /\b(username and password|login details|account credentials)\b/i,
        /\b(remote (access|desktop)|anydesk|teamviewer|quick assist)\b/i
      ]
    },
    {
      id: "money",
      label: "Asks for money, gift cards, or crypto",
      weight: 3,
      patterns: [
        /\b(gift\s*cards?|itunes|google play|steam card|apple card)\b/i,
        /\b(wire transfer|western union|moneygram|bitcoin|crypto(currency)?|usdt|wallet address)\b/i,
        /\b(pay (a |the )?(fee|fine|tax|bail|release fee))\b/i,
        /\b(refund|overpayment).{0,40}\b(send|return|wire)\b/i,
        /\b(you('ve| have) won|lottery|sweepstakes|claim your prize)\b/i
      ]
    },
    {
      id: "impersonation",
      label: "Pretends to be a bank, government, or big company",
      weight: 2,
      patterns: [
        /\b(irs|social security|ssa|medicare|dmv|fbi|cia|border patrol)\b/i,
        /\b(microsoft|apple|google|amazon|paypal|netflix|bank of america|wells fargo|chase|irs)\b.{0,30}\b(support|security|alert|notice)\b/i,
        /\b(this is (the )?(fraud|security) department)\b/i,
        /\b(we detected (unusual|suspicious) (activity|sign[- ]?in))\b/i
      ]
    },
    {
      id: "secrecy",
      label: "Tells you to keep it secret",
      weight: 2,
      patterns: [
        /\b(do not tell|don't tell|keep this (a )?secret|between us|confidential)\b/i,
        /\b(do not (call|contact) (the )?bank|ignore other messages)\b/i
      ]
    },
    {
      id: "links",
      label: "Pushes a link or download hard",
      weight: 1,
      patterns: [
        /\b(click (here|below|this link)|tap (here|below)|open the attachment)\b/i,
        /\b(download (now|the (file|app|invoice|document)))\b/i,
        /https?:\/\/\S+/i,
        /\bbit\.ly|tinyurl|t\.co|goo\.gl|rebrand\.ly\b/i
      ]
    },
    {
      id: "romance",
      label: "Romance or “too good to be true” help request",
      weight: 2,
      patterns: [
        /\b(my (dear|love|honey)|god bless you|we are meant to be)\b/i,
        /\b(stuck (in|at)|stranded|emergency (surgery|hospital)|customs fee)\b/i,
        /\b(i need (your )?help (with|to) (money|transfer|fees))\b/i
      ]
    },
    {
      id: "grammar_pressure",
      label: "Odd pressure + money language together",
      weight: 1,
      patterns: [
        /\b(kindly|do the needful)\b.{0,60}\b(payment|transfer|account|password)\b/i,
        /\b(dear (customer|user|valued|beneficiary))\b/i
      ]
    }
  ],

  safeHints: [
    {
      label: "Looks like a normal conversation",
      test: (t) => t.length < 40 && !/[!$]{2,}/.test(t)
    }
  ]
};
