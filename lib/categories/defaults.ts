export interface CategoryDef {
  name: string
  subcategories: string[]
}

export const DEFAULT_CATEGORIES: CategoryDef[] = [
  { name: 'Housing', subcategories: ['Rent', 'Mortgage', 'Utilities', 'Insurance', 'Repairs & Maintenance'] },
  { name: 'Groceries', subcategories: ['Supermarket', 'Fresh Produce', 'Specialty Food'] },
  { name: 'Dining & Takeaway', subcategories: ['Restaurants', 'Cafes', 'Fast Food', 'Delivery'] },
  { name: 'Automotive', subcategories: ['Fuel', 'Maintenance', 'Registration', 'Insurance', 'Tolls', 'Parking'] },
  { name: 'Health', subcategories: ['General Practitioner', 'Specialist Appointment', 'Pharmacy', 'Dental', 'Fitness', 'Vitamins', 'Private Health Insurance'] },
  { name: 'Shopping', subcategories: ['Clothing', 'Electronics', 'Homewares', 'Other Retail'] },
  { name: 'Entertainment', subcategories: ['Streaming', 'Events', 'Hobbies', 'Games', 'Concerts', 'Sporting Match'] },
  { name: 'Personal Care', subcategories: ['Haircut', 'Beauty', 'Gym'] },
  { name: 'Education', subcategories: ['Courses', 'Books', 'Subscriptions'] },
  { name: 'Financial', subcategories: ['Fees', 'Interest', 'Insurance', 'Super', 'Tax Advice', 'Legal Fees'] },
  { name: 'Travel', subcategories: ['Flights', 'Accommodation', 'Activities', 'Public Transport'] },
  { name: 'Giving', subcategories: ['Donations', 'Gifts'] },
  { name: 'Pets', subcategories: ['Pet Food', 'Vet', 'Insurance'] },
  { name: 'Savings', subcategories: [] },
  { name: 'Income', subcategories: ['Salary', 'Transfer In', 'Refunds', 'Centrelink', 'Child Support'] },
]

export function getSubcategories(category: string): string[] {
  return DEFAULT_CATEGORIES.find(c => c.name === category)?.subcategories ?? []
}
