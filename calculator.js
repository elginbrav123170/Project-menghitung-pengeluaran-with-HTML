// calculator.js — Pure summary calculation functions (implemented in Task 3)

/**
 * Returns a daily spending summary for the given date.
 *
 * @param {Array<{id: string, amount: number, category: string, date: string, description?: string}>} expenses
 * @param {string} date - ISO 8601 date string "YYYY-MM-DD"
 * @returns {{ total: number, byCategory: Record<string, number> }}
 */
function getDailySummary(expenses, date) {
  const filtered = expenses.filter(e => e.date === date);

  const byCategory = {};
  let total = 0;

  for (const expense of filtered) {
    total += expense.amount;
    byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
  }

  return { total, byCategory };
}

/**
 * Returns a monthly spending summary for the given year and month.
 *
 * @param {Array<{id: string, amount: number, category: string, date: string, description?: string}>} expenses
 * @param {number} year - Full year (e.g. 2024)
 * @param {number} month - 1-indexed month (1=January, 12=December)
 * @returns {{ total: number, byCategory: Record<string, number> }}
 */
function getMonthlySummary(expenses, year, month) {
  const filtered = expenses.filter(e => {
    const y = parseInt(e.date.slice(0, 4), 10);
    const m = parseInt(e.date.slice(5, 7), 10);
    return y === year && m === month;
  });

  const byCategory = {};
  let total = 0;

  for (const expense of filtered) {
    total += expense.amount;
    byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
  }

  return { total, byCategory };
}

/**
 * Returns a yearly spending summary for the given year.
 *
 * @param {Array<{id: string, amount: number, category: string, date: string, description?: string}>} expenses
 * @param {number} year - Full year (e.g. 2024)
 * @returns {{ total: number, byCategory: Record<string, number> }}
 */
function getYearlySummary(expenses, year) {
  const filtered = expenses.filter(e => parseInt(e.date.slice(0, 4), 10) === year);

  const byCategory = {};
  let total = 0;

  for (const expense of filtered) {
    total += expense.amount;
    byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount;
  }

  return { total, byCategory };
}

if (typeof module !== 'undefined') {
  module.exports = { getDailySummary, getMonthlySummary, getYearlySummary };
}
