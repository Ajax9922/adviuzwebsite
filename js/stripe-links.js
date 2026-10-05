/* Adviuz – Stripe Payment Links.
   Paste each link between the quotes. A plan left empty ('') sends its button
   to the Contact page instead.
   In each Stripe link set: After payment -> "Don't show confirmation page" ->
   https://adviuz.com/welcome?plan=PLAN-KEY   (PLAN-KEY = the name on the left)  */
window.ADVIUZ_STRIPE = {
  /* AI Conversion Engine – MONTHLY plans (Stripe: "Recurring", monthly) – ai-conversion-engine.html */
  'ce-starter-m':  '',   // Starter – $200/month  – 100 AI min, 500 texts/emails/call min
  'ce-growth-m':   '',   // Growth  – $350/month  – 200 AI min, 1,000 each
  'ce-scale-m':    '',   // Scale   – $600/month  – 400 AI min, 2,000 each
  'ce-pro-m':      '',   // Pro     – $1,000/month – 800 AI min, 4,000 each

  /* AI Conversion Engine – ONE-TIME prepaid packs (Stripe: "One time") – pricing.html */
  'ce-starter':    '',   // 100 AI minutes   – $200
  'ce-growth':     '',   // 200 AI minutes   – $350
  'ce-scale':      '',   // 400 AI minutes   – $600
  'ce-pro':        '',   // 800 AI minutes   – $1,000
  'ce-max':        '',   // 2,000 AI minutes – $2,000
  'ce-enterprise': '',   // 5,000 AI minutes – $4,500
  'ce-ultimate':   '',   // 10,000 AI minutes – $8,000
  'ce-25k':        ''    // 25,000 AI minutes – $17,500
};
