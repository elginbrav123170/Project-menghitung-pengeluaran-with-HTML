/**
 * ESM wrapper for store.js — used only in test environments.
 * Loads store.js via Function constructor so `module.exports` is populated,
 * while the store functions still reference the global `localStorage` (jsdom).
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, 'store.js'), 'utf8');

const mod = { exports: {} };
// eslint-disable-next-line no-new-func
const fn = new Function('module', 'exports', src);
fn(mod, mod.exports);

export const { isStorageAvailable, load, save, _reset, _getExpenses, getExpenses, addExpense, deleteExpense, getCategories, addCategory, getIncome, getIncomeSources, addIncome, deleteIncome } = mod.exports;
