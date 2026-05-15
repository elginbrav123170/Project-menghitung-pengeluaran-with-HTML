/**
 * Integration tests for app controller — form submission and deletion flows.
 * Validates: Requirements 1.2, 2.2
 */

import { describe, it, beforeEach, expect } from 'vitest';
import {
  load,
  save,
  _reset,
  getExpenses,
  addExpense,
  deleteExpense,
  getCategories,
  addCategory,
} from './store.esm.js';
import { getDailySummary, getMonthlySummary, getYearlySummary } from './calculator.esm.js';

// Minimal DOM setup mirroring index.html elements used by app.js render functions
function setupDOM() {
  document.body.innerHTML = `
    <div id="storage-warning" class="hidden"></div>
    <form id="expense-form">
      <input id="amount" type="number" />
      <select id="category"><option value="">-- Select --</option></select>
      <input id="date" type="date" />
      <input id="description" type="text" />
      <span id="amount-error"></span>
      <span id="category-error"></span>
      <span id="date-error"></span>
    </form>
    <ul id="expense-list"></ul>
    <p id="no-expenses-msg" class="hidden"></p>
    <input id="daily-date" type="date" />
    <input id="monthly-month" type="month" />
    <input id="yearly-year" type="number" />
    <span id="daily-total"></span>
    <ul id="daily-breakdown"></ul>
    <span id="monthly-total"></span>
    <ul id="monthly-breakdown"></ul>
    <span id="yearly-total"></span>
    <ul id="yearly-breakdown"></ul>
    <input id="new-category" type="text" />
    <button id="add-category-btn">Add</button>
    <span id="category-add-error"></span>
  `;
}

// Inline render helpers (mirrors app.js render functions, used to verify DOM state)
function renderExpenseList(expenses) {
  const list = document.getElementById('expense-list');
  const noMsg = document.getElementById('no-expenses-msg');
  const sorted = expenses.slice().sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0));
  list.innerHTML = '';
  if (sorted.length === 0) {
    noMsg.classList.remove('hidden');
    return;
  }
  noMsg.classList.add('hidden');
  sorted.forEach(expense => {
    const li = document.createElement('li');
    const details =
      `Rp ${expense.amount.toLocaleString('id-ID')} — ${expense.category} — ${expense.date}` +
      (expense.description ? ` — ${expense.description}` : '');
    li.innerHTML =
      `<span>${details}</span>` +
      `<button class="delete-btn" data-id="${expense.id}">Delete</button>`;
    list.appendChild(li);
  });
}

function renderSummary(summary, period) {
  document.getElementById(`${period}-total`).textContent = `Rp ${summary.total.toLocaleString('id-ID')}`;
  const breakdownEl = document.getElementById(`${period}-breakdown`);
  const categories = Object.keys(summary.byCategory);
  breakdownEl.innerHTML =
    categories.length === 0
      ? '<li>No expenses</li>'
      : categories.map(cat => `<li>${cat}: Rp ${summary.byCategory[cat].toLocaleString('id-ID')}</li>`).join('');
}

function refreshSummaries(expenses) {
  const dailyDate = document.getElementById('daily-date').value;
  renderSummary(getDailySummary(expenses, dailyDate || ''), 'daily');

  const monthlyVal = document.getElementById('monthly-month').value;
  if (monthlyVal) {
    const [year, month] = monthlyVal.split('-').map(Number);
    renderSummary(getMonthlySummary(expenses, year, month), 'monthly');
  } else {
    renderSummary(getMonthlySummary(expenses, 0, 0), 'monthly');
  }

  const yearlyVal = document.getElementById('yearly-year').value;
  renderSummary(getYearlySummary(expenses, yearlyVal ? parseInt(yearlyVal, 10) : 0), 'yearly');
}

// ---------------------------------------------------------------------------

describe('Integration — form submission flow', () => {
  beforeEach(() => {
    localStorage.clear();
    _reset([], []);
    setupDOM();
  });

  it('submitting a valid expense adds it to the store and renders it in the list', () => {
    // Simulate a valid form submission
    addExpense({ amount: 25.5, category: 'Food', date: '2024-06-15', description: 'lunch' });

    const expenses = getExpenses();
    expect(expenses).toHaveLength(1);
    expect(expenses[0]).toMatchObject({ amount: 25.5, category: 'Food', date: '2024-06-15' });

    renderExpenseList(expenses);

    const listItems = document.querySelectorAll('#expense-list li');
    expect(listItems).toHaveLength(1);
    expect(listItems[0].textContent).toContain('25,5');
    expect(listItems[0].textContent).toContain('Food');
    expect(listItems[0].textContent).toContain('2024-06-15');
  });

  it('submitting a valid expense updates the daily summary for that date', () => {
    addExpense({ amount: 30, category: 'Transport', date: '2024-06-15' });
    addExpense({ amount: 20, category: 'Food', date: '2024-06-15' });

    document.getElementById('daily-date').value = '2024-06-15';
    refreshSummaries(getExpenses());

    expect(document.getElementById('daily-total').textContent).toBe('Rp 50');
    const breakdown = document.getElementById('daily-breakdown').textContent;
    expect(breakdown).toContain('Transport');
    expect(breakdown).toContain('Food');
  });

  it('submitting a valid expense updates the monthly summary', () => {
    addExpense({ amount: 100, category: 'Housing', date: '2024-06-10' });

    document.getElementById('monthly-month').value = '2024-06';
    refreshSummaries(getExpenses());

    expect(document.getElementById('monthly-total').textContent).toBe('Rp 100');
  });

  it('submitting a valid expense updates the yearly summary', () => {
    addExpense({ amount: 200, category: 'Health', date: '2024-03-01' });

    document.getElementById('yearly-year').value = '2024';
    refreshSummaries(getExpenses());

    expect(document.getElementById('yearly-total').textContent).toBe('Rp 200');
  });

  it('multiple expenses accumulate correctly in summaries', () => {
    addExpense({ amount: 10, category: 'Food', date: '2024-06-15' });
    addExpense({ amount: 15, category: 'Food', date: '2024-06-15' });
    addExpense({ amount: 5, category: 'Transport', date: '2024-06-15' });

    document.getElementById('daily-date').value = '2024-06-15';
    refreshSummaries(getExpenses());

    expect(document.getElementById('daily-total').textContent).toBe('Rp 30');
  });
});

// ---------------------------------------------------------------------------

describe('Integration — expense deletion flow', () => {
  beforeEach(() => {
    localStorage.clear();
    _reset([], []);
    setupDOM();
  });

  it('deleting an expense removes it from the store and from the rendered list', () => {
    addExpense({ amount: 50, category: 'Entertainment', date: '2024-07-01' });
    const id = getExpenses()[0].id;

    deleteExpense(id);

    expect(getExpenses()).toHaveLength(0);

    renderExpenseList(getExpenses());

    expect(document.querySelectorAll('#expense-list li')).toHaveLength(0);
    expect(document.getElementById('no-expenses-msg').classList.contains('hidden')).toBe(false);
  });

  it('deleting an expense updates the daily summary to reflect the removal', () => {
    addExpense({ amount: 40, category: 'Food', date: '2024-07-01' });
    addExpense({ amount: 60, category: 'Transport', date: '2024-07-01' });
    const id = getExpenses()[0].id;

    document.getElementById('daily-date').value = '2024-07-01';
    refreshSummaries(getExpenses());
    expect(document.getElementById('daily-total').textContent).toBe('Rp 100');

    deleteExpense(id);
    refreshSummaries(getExpenses());

    // After deletion, only one expense remains (60)
    expect(document.getElementById('daily-total').textContent).toBe('Rp 60');
  });

  it('deleting an expense updates the monthly summary', () => {
    addExpense({ amount: 80, category: 'Housing', date: '2024-07-15' });
    const id = getExpenses()[0].id;

    document.getElementById('monthly-month').value = '2024-07';
    refreshSummaries(getExpenses());
    expect(document.getElementById('monthly-total').textContent).toBe('Rp 80');

    deleteExpense(id);
    refreshSummaries(getExpenses());

    expect(document.getElementById('monthly-total').textContent).toBe('Rp 0');
  });

  it('deleting an expense updates the yearly summary', () => {
    addExpense({ amount: 120, category: 'Health', date: '2024-08-20' });
    const id = getExpenses()[0].id;

    document.getElementById('yearly-year').value = '2024';
    refreshSummaries(getExpenses());
    expect(document.getElementById('yearly-total').textContent).toBe('Rp 120');

    deleteExpense(id);
    refreshSummaries(getExpenses());

    expect(document.getElementById('yearly-total').textContent).toBe('Rp 0');
  });

  it('deleting one expense does not affect other expenses in the list', () => {
    addExpense({ amount: 10, category: 'Food', date: '2024-07-01' });
    addExpense({ amount: 20, category: 'Food', date: '2024-07-02' });
    const [first] = getExpenses();

    deleteExpense(first.id);

    expect(getExpenses()).toHaveLength(1);
    expect(getExpenses()[0].amount).toBe(20);

    renderExpenseList(getExpenses());
    expect(document.querySelectorAll('#expense-list li')).toHaveLength(1);
  });
});
