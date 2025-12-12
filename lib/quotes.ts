export type QuoteCategory = "safe" | "warning" | "danger" | "over";

export interface Quote {
  text: string;
  category: QuoteCategory;
}

const QUOTES: Quote[] = [
  // SAFE (Under 30m)
  { text: "quotes.safe.q1", category: "safe" },
  { text: "quotes.safe.q2", category: "safe" },
  { text: "quotes.safe.q3", category: "safe" },
  { text: "quotes.safe.q4", category: "safe" },
  { text: "quotes.safe.q5", category: "safe" },
  { text: "quotes.safe.q6", category: "safe" },
  { text: "quotes.safe.q7", category: "safe" },
  { text: "quotes.safe.q8", category: "safe" },
  { text: "quotes.safe.q9", category: "safe" },
  { text: "quotes.safe.q10", category: "safe" },
  { text: "quotes.safe.q11", category: "safe" },
  { text: "quotes.safe.q12", category: "safe" },
  { text: "quotes.safe.q13", category: "safe" },
  { text: "quotes.safe.q14", category: "safe" },
  { text: "quotes.safe.q15", category: "safe" },
  { text: "quotes.safe.q16", category: "safe" },

  // WARNING (Approaching budget)
  { text: "quotes.warning.q1", category: "warning" },
  { text: "quotes.warning.q2", category: "warning" },
  { text: "quotes.warning.q3", category: "warning" },
  { text: "quotes.warning.q4", category: "warning" },
  { text: "quotes.warning.q5", category: "warning" },
  { text: "quotes.warning.q6", category: "warning" },
  { text: "quotes.warning.q7", category: "warning" },
  { text: "quotes.warning.q8", category: "warning" },
  { text: "quotes.warning.q9", category: "warning" },
  { text: "quotes.warning.q10", category: "warning" },
  { text: "quotes.warning.q11", category: "warning" },
  { text: "quotes.warning.q12", category: "warning" },
  { text: "quotes.warning.q13", category: "warning" },
  { text: "quotes.warning.q14", category: "warning" },
  { text: "quotes.warning.q15", category: "warning" },
  { text: "quotes.warning.q16", category: "warning" },

  // DANGER (Near budget limit)
  { text: "quotes.danger.q1", category: "danger" },
  { text: "quotes.danger.q2", category: "danger" },
  { text: "quotes.danger.q3", category: "danger" },
  { text: "quotes.danger.q4", category: "danger" },
  { text: "quotes.danger.q5", category: "danger" },
  { text: "quotes.danger.q6", category: "danger" },
  { text: "quotes.danger.q7", category: "danger" },
  { text: "quotes.danger.q8", category: "danger" },
  { text: "quotes.danger.q9", category: "danger" },
  { text: "quotes.danger.q10", category: "danger" },
  { text: "quotes.danger.q11", category: "danger" },
  { text: "quotes.danger.q12", category: "danger" },
  { text: "quotes.danger.q13", category: "danger" },
  { text: "quotes.danger.q14", category: "danger" },
  { text: "quotes.danger.q15", category: "danger" },
  { text: "quotes.danger.q16", category: "danger" },

  // OVER (Budget exceeded)
  { text: "quotes.over.q1", category: "over" },
  { text: "quotes.over.q2", category: "over" },
  { text: "quotes.over.q3", category: "over" },
  { text: "quotes.over.q4", category: "over" },
  { text: "quotes.over.q5", category: "over" },
  { text: "quotes.over.q6", category: "over" },
  { text: "quotes.over.q7", category: "over" },
  { text: "quotes.over.q8", category: "over" },
  { text: "quotes.over.q9", category: "over" },
  { text: "quotes.over.q10", category: "over" },
  { text: "quotes.over.q11", category: "over" },
  { text: "quotes.over.q12", category: "over" },
  { text: "quotes.over.q13", category: "over" },
  { text: "quotes.over.q14", category: "over" },
  { text: "quotes.over.q15", category: "over" },
  { text: "quotes.over.q16", category: "over" },
];

export const getQuote = (percentageUsed: number): Quote => {
  let category: QuoteCategory = "safe";
  if (percentageUsed >= 100) category = "over";
  else if (percentageUsed >= 80) category = "danger";
  else if (percentageUsed >= 50) category = "warning";

  const candidates = QUOTES.filter((q) => q.category === category);
  return candidates[Math.floor(Math.random() * candidates.length)];
};
