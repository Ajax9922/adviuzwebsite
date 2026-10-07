/* Adviuz – Stripe Payment Links.
   Paste each link between the quotes. A plan left empty ('') sends its button
   to the Contact page instead.
   In each Stripe link set: After payment -> "Don't show confirmation page" ->
   https://adviuz.com/welcome?plan=PLAN-KEY   (PLAN-KEY = the name on the left)
   Essential: add TWO items to its Stripe link – the $599 plan and the $300 one-time setup fee. */
window.ADVIUZ_STRIPE = {
  /* AI Conversion Engine – prepaid plans (Stripe: "One time") – used on ai-conversion-engine.html and pricing.html */
  'ce-essential': '',   // Essential – $599 + $300 one-time setup (400 AI minutes, 120 days)
  'ce-pro':       '',   // Pro       – $999, setup included (800 AI minutes, 180 days)
  'ce-max':       ''    // Max       – $1,999, setup included (2,000 AI minutes, 360 days)
};
