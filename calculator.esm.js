/**
 * ESM wrapper for calculator.js — used only in test environments.
 * Loads calculator.js via Function constructor so `module.exports` is populated.
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const src = readFileSync(join(__dirname, 'calculator.js'), 'utf8');

const mod = { exports: {} };
// eslint-disable-next-line no-new-func
const fn = new Function('module', 'exports', src);
fn(mod, mod.exports);

export const { getDailySummary, getMonthlySummary, getYearlySummary } = mod.exports;
