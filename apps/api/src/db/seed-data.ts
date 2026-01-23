export const DEFAULT_CATEGORIES = [
  // Needs (50%)
  {
    name: "Rent/Mortgage",
    type: "expense",
    allocationBucket: "needs",
    icon: "🏠",
  },
  { name: "Groceries", type: "expense", allocationBucket: "needs", icon: "🛒" },
  { name: "Utilities", type: "expense", allocationBucket: "needs", icon: "⚡" },
  { name: "Insurance", type: "expense", allocationBucket: "needs", icon: "🛡️" },
  {
    name: "Transportation",
    type: "expense",
    allocationBucket: "needs",
    icon: "🚗",
  },
  {
    name: "Healthcare",
    type: "expense",
    allocationBucket: "needs",
    icon: "🏥",
  },

  // Wants (30%)
  {
    name: "Dining Out",
    type: "expense",
    allocationBucket: "wants",
    icon: "🍽️",
  },
  {
    name: "Entertainment",
    type: "expense",
    allocationBucket: "wants",
    icon: "🎬",
  },
  { name: "Shopping", type: "expense", allocationBucket: "wants", icon: "🛍️" },
  {
    name: "Subscriptions",
    type: "expense",
    allocationBucket: "wants",
    icon: "📺",
  },
  { name: "Hobbies", type: "expense", allocationBucket: "wants", icon: "🎨" },

  // Future (20%)
  { name: "Savings", type: "expense", allocationBucket: "future", icon: "💰" },
  {
    name: "Investments",
    type: "expense",
    allocationBucket: "future",
    icon: "📈",
  },
  {
    name: "Emergency Fund",
    type: "expense",
    allocationBucket: "future",
    icon: "🏦",
  },
  {
    name: "Debt Repayment",
    type: "expense",
    allocationBucket: "future",
    icon: "💳",
  },

  // Income (no allocation)
  { name: "Salary", type: "income", allocationBucket: null, icon: "💵" },
  { name: "Freelance", type: "income", allocationBucket: null, icon: "💼" },
  { name: "Other Income", type: "income", allocationBucket: null, icon: "💸" },
] as const;
