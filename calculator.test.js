/**
 * Property-based tests for calculator.js daily summary correctness.
 *
 * Property 2: Sum of all byCategory values equals total for any expense array and date.
 * Validates: Requirements 3.1, 3.3
 */

import { describe, it } from 'vitest';
import { expect } from 'vitest';
import fc from 'fast-check';
import { getDailySummary, getMonthlySummary, getYearlySummary } from './calculator.esm.js';

// Date arbitrary using string construction to avoid RangeError
const dateArb = fc
  .tuple(
    fc.integer({ min: 2000, max: 2099 }),
    fc.integer({ min: 1, max: 12 }),
    fc.integer({ min: 1, max: 28 })
  )
  .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`);

// Expense arbitrary
const expenseArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  amount: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  category: fc.constantFrom('Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Other'),
  date: dateArb,
});

describe('calculator.js — daily summary correctness', () => {
  it(
    /**
     * Property 2: Sum of all byCategory values equals total for any expense array and date.
     * Validates: Requirements 3.1, 3.3
     */
    'Property 2: sum of byCategory values equals total for any expenses and date',
    () => {
      fc.assert(
        fc.property(fc.array(expenseArb, { maxLength: 20 }), dateArb, (expenses, date) => {
          const summary = getDailySummary(expenses, date);

          const categorySum = Object.values(summary.byCategory).reduce((a, b) => a + b, 0);

          // Both should equal the same total; use tolerance for floating-point arithmetic
          expect(Math.abs(categorySum - summary.total)).toBeLessThanOrEqual(
            Math.max(summary.total, categorySum) * 1e-6 + 1e-9
          );
        }),
        { numRuns: 100 }
      );
    }
  );
});

// Year/month arbitraries for Properties 3 & 4
const yearArb = fc.integer({ min: 2000, max: 2099 });
const monthArb = fc.integer({ min: 1, max: 12 });

// Returns the number of days in a given year/month (safe: uses days 1-28 to avoid edge cases)
function daysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

describe('calculator.js — monthly summary correctness', () => {
  it(
    /**
     * Property 3: Monthly summary total equals sum of daily totals for all days in that month.
     * Validates: Requirements 4.1, 4.3
     */
    'Property 3: monthly total equals sum of daily totals for every day in that month',
    () => {
      fc.assert(
        fc.property(
          fc.array(expenseArb, { maxLength: 30 }),
          yearArb,
          monthArb,
          (expenses, year, month) => {
            const monthly = getMonthlySummary(expenses, year, month);

            const days = daysInMonth(year, month);
            let dailySum = 0;
            for (let d = 1; d <= days; d++) {
              const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              dailySum += getDailySummary(expenses, dateStr).total;
            }

            const tolerance = Math.max(monthly.total, dailySum) * 1e-6 + 1e-9;
            expect(Math.abs(monthly.total - dailySum)).toBeLessThanOrEqual(tolerance);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});

describe('calculator.js — yearly summary correctness', () => {
  it(
    /**
     * Property 4: Yearly summary total equals sum of monthly totals for all months in that year.
     * Validates: Requirements 5.1, 5.3
     */
    'Property 4: yearly total equals sum of monthly totals for all 12 months',
    () => {
      fc.assert(
        fc.property(
          fc.array(expenseArb, { maxLength: 30 }),
          yearArb,
          (expenses, year) => {
            const yearly = getYearlySummary(expenses, year);

            let monthlySum = 0;
            for (let m = 1; m <= 12; m++) {
              monthlySum += getMonthlySummary(expenses, year, m).total;
            }

            const tolerance = Math.max(yearly.total, monthlySum) * 1e-6 + 1e-9;
            expect(Math.abs(yearly.total - monthlySum)).toBeLessThanOrEqual(tolerance);
          }
        ),
        { numRuns: 100 }
      );
    }
  );
});
