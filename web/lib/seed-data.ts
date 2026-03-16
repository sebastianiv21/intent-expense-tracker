export type SeedCategory = {
  name: string;
  type: "expense" | "income";
  allocationBucket?: "needs" | "wants" | "future";
  icon: string;
};

export const DEFAULT_CATEGORIES: SeedCategory[] = [
  // Needs (6)
  { name: "Rent/Mortgage", type: "expense", allocationBucket: "needs", icon: "🏠" },
  { name: "Groceries", type: "expense", allocationBucket: "needs", icon: "🛒" },
  { name: "Utilities", type: "expense", allocationBucket: "needs", icon: "💡" },
  { name: "Insurance", type: "expense", allocationBucket: "needs", icon: "🛡️" },
  { name: "Transportation", type: "expense", allocationBucket: "needs", icon: "🚗" },
  { name: "Healthcare", type: "expense", allocationBucket: "needs", icon: "🏥" },

  // Wants (5)
  { name: "Dining Out", type: "expense", allocationBucket: "wants", icon: "🍽️" },
  { name: "Entertainment", type: "expense", allocationBucket: "wants", icon: "🎬" },
  { name: "Shopping", type: "expense", allocationBucket: "wants", icon: "🛍️" },
  { name: "Subscriptions", type: "expense", allocationBucket: "wants", icon: "📺" },
  { name: "Hobbies", type: "expense", allocationBucket: "wants", icon: "🎨" },

  // Future (4)
  { name: "Savings", type: "expense", allocationBucket: "future", icon: "💰" },
  { name: "Investments", type: "expense", allocationBucket: "future", icon: "📈" },
  { name: "Emergency Fund", type: "expense", allocationBucket: "future", icon: "🏦" },
  { name: "Debt Repayment", type: "expense", allocationBucket: "future", icon: "💳" },

  // Income (3)
  { name: "Salary", type: "income", icon: "💼" },
  { name: "Freelance", type: "income", icon: "💻" },
  { name: "Other Income", type: "income", icon: "💵" },
];
