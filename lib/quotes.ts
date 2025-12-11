export type QuoteCategory = 'safe' | 'warning' | 'danger' | 'over';

export interface Quote {
  text: string;
  category: QuoteCategory;
}

const QUOTES: Quote[] = [
  // SAFE (Under 30m)
  { text: "Future you is politely clapping.", category: 'safe' },
  { text: "Your screen time is lower than your GPA. Good job.", category: 'safe' },
  { text: "You have time to actually live today.", category: 'safe' },
  { text: "Look at you, being a productive member of society.", category: 'safe' },
  { text: "Your thumb is resting. It thanks you.", category: 'safe' },

  // WARNING (Approaching budget)
  { text: "Your thumb did more cardio than you today.", category: 'warning' },
  { text: "Careful, you're entering the doom zone.", category: 'warning' },
  { text: "Is this reel really worth your future?", category: 'warning' },
  { text: "Tick tock. The algorithm is winning.", category: 'warning' },
  { text: "You're one cat video away from regret.", category: 'warning' },

  // DANGER (Near budget limit)
  { text: "You unlocked the 'Pro Scroller' achievement.", category: 'danger' },
  { text: "Stop. Touch grass. Now.", category: 'danger' },
  { text: "The sunlight misses you.", category: 'danger' },
  { text: "Blinking is not enough of a break.", category: 'danger' },
  { text: "Your battery is draining, and so is your soul.", category: 'danger' },

  // OVER (Budget exceeded)
  { text: "You are now in debt to your future self.", category: 'over' },
  { text: "Hope that dopamine hit was worth it.", category: 'over' },
  { text: "Imagine what you could have done in this time.", category: 'over' },
  { text: "Scroll Debt collector is knocking.", category: 'over' },
  { text: "Game Over. Insert coin (time) to continue.", category: 'over' },
];

export const getQuote = (percentageUsed: number): Quote => {
  let category: QuoteCategory = 'safe';
  if (percentageUsed >= 100) category = 'over';
  else if (percentageUsed >= 80) category = 'danger';
  else if (percentageUsed >= 50) category = 'warning';

  const candidates = QUOTES.filter(q => q.category === category);
  return candidates[Math.floor(Math.random() * candidates.length)];
};
