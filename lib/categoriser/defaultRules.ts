import type { MappingRule } from './types'

export const DEFAULT_RULES: MappingRule[] = [
  // Groceries — Supermarket
  { id: 'default-woolworths', pattern: 'Woolworths', category: 'Groceries', subcategory: 'Supermarket', userMapped: false },
  { id: 'default-coles', pattern: 'Coles', category: 'Groceries', subcategory: 'Supermarket', userMapped: false },
  { id: 'default-aldi', pattern: 'Aldi', category: 'Groceries', subcategory: 'Supermarket', userMapped: false },
  { id: 'default-iga', pattern: 'IGA', category: 'Groceries', subcategory: 'Supermarket', userMapped: false },
  { id: 'default-costco', pattern: 'Costco', category: 'Groceries', subcategory: 'Supermarket', userMapped: false },

  // Groceries — Fresh Produce
  { id: 'default-harris-farm', pattern: 'Harris Farm', category: 'Groceries', subcategory: 'Fresh Produce', userMapped: false },

  // Entertainment — Streaming
  { id: 'default-netflix', pattern: 'Netflix', category: 'Entertainment', subcategory: 'Streaming', userMapped: false },
  { id: 'default-stan', pattern: 'Stan', category: 'Entertainment', subcategory: 'Streaming', userMapped: false },
  { id: 'default-foxtel', pattern: 'Foxtel', category: 'Entertainment', subcategory: 'Streaming', userMapped: false },
  { id: 'default-spotify', pattern: 'Spotify', category: 'Entertainment', subcategory: 'Streaming', userMapped: false },
  { id: 'default-disney', pattern: 'Disney', category: 'Entertainment', subcategory: 'Streaming', userMapped: false },
  { id: 'default-hbo', pattern: 'HBO', category: 'Entertainment', subcategory: 'Streaming', userMapped: false },
  { id: 'default-apple-tv', pattern: 'Apple TV', category: 'Entertainment', subcategory: 'Streaming', userMapped: false },
  { id: 'default-amazon-prime', pattern: 'Amazon Prime', category: 'Entertainment', subcategory: 'Streaming', userMapped: false },
  { id: 'default-youtube-premium', pattern: 'YouTube Premium', category: 'Entertainment', subcategory: 'Streaming', userMapped: false },
  { id: 'default-audible', pattern: 'Audible', category: 'Entertainment', subcategory: 'Streaming', userMapped: false },

  // Dining & Takeaway — Fast Food
  { id: 'default-mcdonalds', pattern: 'McDonalds', category: 'Dining & Takeaway', subcategory: 'Fast Food', userMapped: false },
  { id: 'default-kfc', pattern: 'KFC', category: 'Dining & Takeaway', subcategory: 'Fast Food', userMapped: false },
  { id: 'default-hungry-jacks', pattern: 'Hungry Jacks', category: 'Dining & Takeaway', subcategory: 'Fast Food', userMapped: false },
  { id: 'default-dominos', pattern: 'Dominos', category: 'Dining & Takeaway', subcategory: 'Fast Food', userMapped: false },
  { id: 'default-pizza-hut', pattern: 'Pizza Hut', category: 'Dining & Takeaway', subcategory: 'Fast Food', userMapped: false },
  { id: 'default-subway', pattern: 'Subway', category: 'Dining & Takeaway', subcategory: 'Fast Food', userMapped: false },
  { id: 'default-guzman', pattern: 'Guzman', category: 'Dining & Takeaway', subcategory: 'Fast Food', userMapped: false },
  { id: 'default-nandos', pattern: 'Nandos', category: 'Dining & Takeaway', subcategory: 'Restaurants', userMapped: false },

  // Dining & Takeaway — Delivery
  { id: 'default-uber-eats', pattern: 'Uber Eats', category: 'Dining & Takeaway', subcategory: 'Delivery', userMapped: false },
  { id: 'default-menulog', pattern: 'Menulog', category: 'Dining & Takeaway', subcategory: 'Delivery', userMapped: false },
  { id: 'default-doordash', pattern: 'DoorDash', category: 'Dining & Takeaway', subcategory: 'Delivery', userMapped: false },

  // Travel — Public Transport
  { id: 'default-uber', pattern: 'Uber', category: 'Travel', subcategory: 'Public Transport', userMapped: false },

  // Automotive — Fuel
  { id: 'default-bp', pattern: 'BP', category: 'Automotive', subcategory: 'Fuel', userMapped: false },
  { id: 'default-shell', pattern: 'Shell', category: 'Automotive', subcategory: 'Fuel', userMapped: false },
  { id: 'default-ampol', pattern: 'Ampol', category: 'Automotive', subcategory: 'Fuel', userMapped: false },

  // Health — Pharmacy
  { id: 'default-chemist-warehouse', pattern: 'Chemist Warehouse', category: 'Health', subcategory: 'Pharmacy', userMapped: false },
  { id: 'default-priceline', pattern: 'Priceline', category: 'Health', subcategory: 'Pharmacy', userMapped: false },

  // Shopping
  { id: 'default-kmart', pattern: 'Kmart', category: 'Shopping', subcategory: 'Other Retail', userMapped: false },
  { id: 'default-bigw', pattern: 'Big W', category: 'Shopping', subcategory: 'Other Retail', userMapped: false },
  { id: 'default-jbhifi', pattern: 'JB Hi-Fi', category: 'Shopping', subcategory: 'Electronics', userMapped: false },
  { id: 'default-amazon', pattern: 'Amazon', category: 'Shopping', subcategory: 'Other Retail', userMapped: false },
  { id: 'default-apple-com', pattern: 'APPLE.COM', category: 'Shopping', subcategory: 'Other Retail', userMapped: false },
]
