/**
 * Property-based tests for store.js storage round-trip consistency.
 *
 * Property 1: Any set of expenses saved and reloaded produces an identical array.
 * Validates: Requirements 7.1, 7.2
 */

import { describe, it, beforeEach } from 'vitest';
import { expect } from 'vitest';
import fc from 'fast-check';
import { load, save, _reset, _getExpenses, getExpenses, addExpense, deleteExpense, getCategories, addCategory } from './store.esm.js';

// Arbitrary for a single Expense object
const expenseArb = fc.record({
  id: fc.string({ minLength: 1, maxLength: 20 }),
  amount: fc.float({ min: Math.fround(0.01), max: Math.fround(100000), noNaN: true }),
  category: fc.constantFrom('Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Other'),
  date: fc
    .tuple(
      fc.integer({ min: 2000, max: 2099 }),
      fc.integer({ min: 1, max: 12 }),
      fc.integer({ min: 1, max: 28 })
    )
    .map(([y, m, d]) => `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`),
  description: fc.option(fc.string({ maxLength: 100 }), { nil: undefined }),
});

describe('store.js — storage round-trip consistency', () => {
  beforeEach(() => {
    // Clear localStorage and reset in-memory state between runs
    localStorage.clear();
    _reset([], []);
  });

  it(
    /**
     * Property 1: Any set of expenses saved and reloaded produces an identical array.
     * Validates: Requirements 7.1, 7.2
     */
    'Property 1: save() then load() round-trips any expense array identically',
    () => {
      fc.assert(
        fc.property(fc.array(expenseArb, { maxLength: 20 }), (expenses) => {
          // Set in-memory state to the generated expenses
          _reset(expenses, []);

          // Persist to (mock) localStorage
          save();

          // Reset in-memory state to simulate a fresh page load
          _reset([], []);

          // Reload from (mock) localStorage
          load();

          // The reloaded expenses must deeply equal the original array
          expect(_getExpenses()).toEqual(expenses);
        }),
        { numRuns: 100 }
      );
    }
  );
});

// ---------------------------------------------------------------------------
// Unit tests — Store CRUD operations
// Validates: Requirements 1.2, 2.2, 6.2, 6.3
// ---------------------------------------------------------------------------

const DEFAULT_CATEGORIES = ['Food', 'Transport', 'Housing', 'Entertainment', 'Health', 'Other'];

describe('store.js — CRUD operations', () => {
  beforeEach(() => {
    localStorage.clear();
    _reset([], []);
  });

  // --- addExpense ---

  it('addExpense adds an expense that appears in getExpenses()', () => {
    addExpense({ amount: 10.5, category: 'Food', date: '2024-01-15', description: 'lunch' });
    const expenses = getExpenses();
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({ amount: 10.5, category: 'Food', date: '2024-01-15', description: 'lunch' });
  });

  it('addExpense assigns a unique string id to each expense', () => {
    addExpense({ amount: 5, category: 'Transport', date: '2024-02-01' });
    addExpense({ amount: 8, category: 'Food', date: '2024-02-02' });
    const expenses = getExpenses();
    expect(typeof expenses[0].id).toBe('string');
    expect(typeof expenses[1].id).toBe('string');
    expect(expenses[0].id).not.toBe(expenses[1].id);
  });

  // --- deleteExpense ---

  it('deleteExpense removes the expense with the matching id', () => {
    addExpense({ amount: 20, category: 'Health', date: '2024-03-01' });
    const id = getExpenses()[0].id;
    deleteExpense(id);
    expect(getExpenses()).toHaveLength(0);
  });

  it('deleteExpense does not affect other expenses', () => {
    addExpense({ amount: 1, category: 'Food', date: '2024-01-01' });
    addExpense({ amount: 2, category: 'Food', date: '2024-01-02' });
    const [first, second] = getExpenses();
    deleteExpense(first.id);
    const remaining = getExpenses();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(second.id);
  });

  // --- getCategories ---

  it('getCategories returns all DEFAULT_CATEGORIES by default', () => {
    expect(getCategories()).toEqual(DEFAULT_CATEGORIES);
  });

  // --- addCategory ---

  it('addCategory adds a new category to getCategories()', () => {
    addCategory('Pets');
    expect(getCategories()).toContain('Pets');
  });

  it('addCategory does not add duplicate categories', () => {
    addCategory('Pets');
    addCategory('Pets');
    const cats = getCategories();
    expect(cats.filter(c => c === 'Pets')).toHaveLength(1);
  });

  it('addCategory persists: after save() + load(), the new category is still present', () => {
    addCategory('Pets');
    save();
    _reset([], []);
    load();
    expect(getCategories()).toContain('Pets');
  });
});
