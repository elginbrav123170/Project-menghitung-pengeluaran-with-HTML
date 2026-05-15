/**
 * store.js — Data persistence and CRUD for expenses and categories.
 *
 * @typedef {Object} Expense
 * @property {string}  id          - Unique identifier (timestamp-based)
 * @property {number}  amount      - Positive number stored as float
 * @property {string}  category    - Must match an existing category name
 * @property {string}  date        - ISO 8601 date string: "YYYY-MM-DD"
 * @property {string}  [description] - Optional free text
 */

/**
 * @typedef {Object} Summary
 * @property {number}              total       - Total sum of matching expenses
 * @property {Record<string, number>} byCategory - Category name → sum
 */

/** @type {string[]} */
const DEFAULT_CATEGORIES = ["Food", "Transport", "Housing", "Entertainment", "Health", "Other"];

const EXPENSES_KEY = "spending_tracker_expenses";
const CATEGORIES_KEY = "spending_tracker_categories";
const INCOME_KEY = "spending_tracker_income";

/** @type {string[]} */
const DEFAULT_INCOME_SOURCES = ["Salary", "Freelance", "Business", "Investment", "Gift", "Other"];

/** @type {Expense[]} */
let _expenses = [];

/** @type {string[]} */
let _userCategories = [];

/**
 * @typedef {Object} Income
 * @property {string}  id          - Unique identifier
 * @property {number}  amount      - Positive number
 * @property {string}  source      - Income source label
 * @property {string}  date        - ISO 8601 date string: "YYYY-MM-DD"
 * @property {string}  [description] - Optional free text
 */

/** @type {Income[]} */
let _income = [];

/**
 * Checks whether localStorage is accessible.
 * @returns {boolean}
 */
function isStorageAvailable() {
  try {
    const test = "__storage_test__";
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Loads expenses and categories from localStorage into in-memory state.
 * Falls back to empty arrays if keys are missing or JSON is invalid.
 */
function load() {
  if (!isStorageAvailable()) return;

  try {
    const rawExpenses = localStorage.getItem(EXPENSES_KEY);
    _expenses = rawExpenses ? JSON.parse(rawExpenses) : [];
  } catch (e) {
    _expenses = [];
  }

  try {
    const rawCategories = localStorage.getItem(CATEGORIES_KEY);
    _userCategories = rawCategories ? JSON.parse(rawCategories) : [];
  } catch (e) {
    _userCategories = [];
  }

  try {
    const rawIncome = localStorage.getItem(INCOME_KEY);
    _income = rawIncome ? JSON.parse(rawIncome) : [];
  } catch (e) {
    _income = [];
  }
}

/**
 * Persists in-memory expenses and categories to localStorage.
 */
function save() {
  if (!isStorageAvailable()) return;
  localStorage.setItem(EXPENSES_KEY, JSON.stringify(_expenses));
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(_userCategories));
  localStorage.setItem(INCOME_KEY, JSON.stringify(_income));
}

/**
 * Test helper: resets in-memory state to given values.
 * @param {Expense[]} expenses
 * @param {string[]} categories
 */
function _reset(expenses, categories) {
  _expenses = expenses;
  _userCategories = categories;
  _income = [];
}

/**
 * Returns the current in-memory expenses array.
 * @returns {Expense[]}
 */
function _getExpenses() {
  return _expenses;
}

/**
 * Returns a copy of the expenses array.
 * @returns {Expense[]}
 */
function getExpenses() {
  return _expenses.slice();
}

/**
 * Adds a new expense with a unique ID, then persists.
 * @param {Omit<Expense, 'id'>} expense - Expense object without an id
 */
function addExpense(expense) {
  const id = String(Date.now() + Math.random());
  _expenses.push({ ...expense, id });
  save();
}

/**
 * Removes the expense with the given id, then persists.
 * @param {string} id
 */
function deleteExpense(id) {
  _expenses = _expenses.filter(e => e.id !== id);
  save();
}

/**
 * Returns a merged array of default and user-added categories (no duplicates).
 * @returns {string[]}
 */
function getCategories() {
  const all = DEFAULT_CATEGORIES.slice();
  for (const cat of _userCategories) {
    if (!all.includes(cat)) {
      all.push(cat);
    }
  }
  return all;
}

/**
 * Adds a new category name if it doesn't already exist, then persists.
 * @param {string} name
 */
function addCategory(name) {
  if (!getCategories().includes(name)) {
    _userCategories.push(name);
    save();
  }
}

/**
 * Returns a copy of the income array.
 * @returns {Income[]}
 */
function getIncome() {
  return _income.slice();
}

/**
 * Returns the default income sources merged with any user-added ones.
 * @returns {string[]}
 */
function getIncomeSources() {
  return DEFAULT_INCOME_SOURCES.slice();
}

/**
 * Adds a new income record with a unique ID, then persists.
 * @param {Omit<Income, 'id'>} income
 */
function addIncome(income) {
  const id = String(Date.now() + Math.random());
  _income.push({ ...income, id });
  save();
}

/**
 * Removes the income record with the given id, then persists.
 * @param {string} id
 */
function deleteIncome(id) {
  _income = _income.filter(e => e.id !== id);
  save();
}

if (typeof module !== 'undefined') {
  module.exports = { isStorageAvailable, load, save, _reset, _getExpenses, getExpenses, addExpense, deleteExpense, getCategories, addCategory, getIncome, getIncomeSources, addIncome, deleteIncome };
}
