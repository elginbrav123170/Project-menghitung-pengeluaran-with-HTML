// app.js — App controller and UI rendering

// ── Helpers ──────────────────────────────────────────────────────────────────

function rp(amount) {
  return `Rp ${amount.toLocaleString('id-ID')}`;
}

// ── Expense rendering ─────────────────────────────────────────────────────────

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

  sorted.forEach(function (expense) {
    const li = document.createElement('li');
    const details = `${rp(expense.amount)} — ${expense.category} — ${expense.date}` +
      (expense.description ? ` — ${expense.description}` : '');
    li.innerHTML = `<span>${details}</span><button class="delete-btn" data-id="${expense.id}">Hapus</button>`;
    list.appendChild(li);
  });
}

// ── Income rendering ──────────────────────────────────────────────────────────

function renderIncomeList(incomeList) {
  const list = document.getElementById('income-list');
  const noMsg = document.getElementById('no-income-msg');

  const sorted = incomeList.slice().sort((a, b) => (b.date < a.date ? -1 : b.date > a.date ? 1 : 0));
  list.innerHTML = '';

  if (sorted.length === 0) {
    noMsg.classList.remove('hidden');
    return;
  }
  noMsg.classList.add('hidden');

  sorted.forEach(function (item) {
    const li = document.createElement('li');
    const details = `${rp(item.amount)} — ${item.source} — ${item.date}` +
      (item.description ? ` — ${item.description}` : '');
    li.classList.add('income-item');
    li.innerHTML = `<span>${details}</span><button class="delete-btn delete-income-btn" data-id="${item.id}">Hapus</button>`;
    list.appendChild(li);
  });
}

function renderIncomeSourceOptions(sources) {
  const select = document.getElementById('income-source');
  while (select.options.length > 1) select.remove(1);
  sources.forEach(function (src) {
    const opt = document.createElement('option');
    opt.value = src;
    opt.textContent = src;
    select.appendChild(opt);
  });
}

// ── Summary rendering ─────────────────────────────────────────────────────────

function renderSummary(summary, period) {
  const totalEl = document.getElementById(`${period}-total`);
  const breakdownEl = document.getElementById(`${period}-breakdown`);

  totalEl.textContent = rp(summary.total);

  const categories = Object.keys(summary.byCategory);
  breakdownEl.innerHTML = categories.length === 0
    ? '<li>Tidak ada pengeluaran</li>'
    : categories.map(cat => `<li>${cat}: ${rp(summary.byCategory[cat])}</li>`).join('');
}

function renderIncomeSummary(incomeList, period, filterFn) {
  const filtered = incomeList.filter(filterFn);
  const total = filtered.reduce((sum, i) => sum + i.amount, 0);
  document.getElementById(`${period}-income-total`).textContent = rp(total);
  return total;
}

function renderNet(period, incomeTotal, expenseTotal) {
  const net = incomeTotal - expenseTotal;
  const el = document.getElementById(`${period}-net`);
  el.textContent = rp(Math.abs(net));
  el.className = 'summary-value net-value ' + (net >= 0 ? 'net-positive' : 'net-negative');
}

function refreshSummaries() {
  const expenses = getExpenses();
  const incomeList = getIncome();

  // Daily
  const dailyDate = document.getElementById('daily-date').value;
  const dailySummary = getDailySummary(expenses, dailyDate || '');
  renderSummary(dailySummary, 'daily');
  const dailyIncome = renderIncomeSummary(incomeList, 'daily', i => i.date === (dailyDate || ''));
  renderNet('daily', dailyIncome, dailySummary.total);

  // Monthly
  const monthlyVal = document.getElementById('monthly-month').value;
  let monthlySummary;
  let monthlyIncome;
  if (monthlyVal) {
    const [year, month] = monthlyVal.split('-').map(Number);
    monthlySummary = getMonthlySummary(expenses, year, month);
    monthlyIncome = renderIncomeSummary(incomeList, 'monthly', i => {
      const d = new Date(i.date);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });
  } else {
    monthlySummary = getMonthlySummary(expenses, 0, 0);
    monthlyIncome = renderIncomeSummary(incomeList, 'monthly', () => false);
  }
  renderSummary(monthlySummary, 'monthly');
  renderNet('monthly', monthlyIncome, monthlySummary.total);

  // Yearly
  const yearlyVal = document.getElementById('yearly-year').value;
  const year = yearlyVal ? parseInt(yearlyVal, 10) : 0;
  const yearlySummary = getYearlySummary(expenses, year);
  renderSummary(yearlySummary, 'yearly');
  const yearlyIncome = renderIncomeSummary(incomeList, 'yearly', i => new Date(i.date).getFullYear() === year);
  renderNet('yearly', yearlyIncome, yearlySummary.total);
}

// ── Category options ──────────────────────────────────────────────────────────

function renderCategoryOptions(categories) {
  const select = document.getElementById('category');
  while (select.options.length > 1) select.remove(1);
  categories.forEach(function (cat) {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat;
    select.appendChild(opt);
  });
}

// ── Validation ────────────────────────────────────────────────────────────────

function showValidationError(field, message) {
  const span = document.getElementById(`${field}-error`);
  if (span) span.textContent = message || '';
}

function clearValidationErrors() {
  ['amount', 'date', 'category'].forEach(f => showValidationError(f, ''));
}

function validateExpenseForm(amount, date, category) {
  let valid = true;
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) { showValidationError('amount', 'Jumlah harus angka positif.'); valid = false; }
  else showValidationError('amount', '');
  if (!date || isNaN(new Date(date).getTime())) { showValidationError('date', 'Masukkan tanggal yang valid.'); valid = false; }
  else showValidationError('date', '');
  if (!category) { showValidationError('category', 'Pilih kategori.'); valid = false; }
  else showValidationError('category', '');
  return valid;
}

function validateIncomeForm(amount, source, date) {
  let valid = true;
  const parsed = parseFloat(amount);
  if (isNaN(parsed) || parsed <= 0) { showValidationError('income-amount', 'Jumlah harus angka positif.'); valid = false; }
  else showValidationError('income-amount', '');
  if (!source) { showValidationError('income-source', 'Pilih sumber pemasukan.'); valid = false; }
  else showValidationError('income-source', '');
  if (!date || isNaN(new Date(date).getTime())) { showValidationError('income-date', 'Masukkan tanggal yang valid.'); valid = false; }
  else showValidationError('income-date', '');
  return valid;
}

// ── Tab switching ─────────────────────────────────────────────────────────────

document.querySelectorAll('.tab-btn').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(t => t.classList.add('hidden'));
    btn.classList.add('active');
    document.getElementById('tab-' + btn.dataset.tab).classList.remove('hidden');
  });
});

// ── Expense form ──────────────────────────────────────────────────────────────

document.getElementById('expense-form').addEventListener('submit', function (event) {
  event.preventDefault();
  const amount = document.getElementById('amount').value;
  const category = document.getElementById('category').value;
  const date = document.getElementById('date').value;
  const description = document.getElementById('description').value.trim();

  clearValidationErrors();
  if (!validateExpenseForm(amount, date, category)) return;

  addExpense({ amount: parseFloat(amount), category, date, description });
  event.target.reset();
  renderExpenseList(getExpenses());
  refreshSummaries();
});

document.getElementById('expense-list').addEventListener('click', function (event) {
  if (!event.target.classList.contains('delete-btn')) return;
  deleteExpense(event.target.dataset.id);
  renderExpenseList(getExpenses());
  refreshSummaries();
});

// ── Income form ───────────────────────────────────────────────────────────────

document.getElementById('income-form').addEventListener('submit', function (event) {
  event.preventDefault();
  const amount = document.getElementById('income-amount').value;
  const source = document.getElementById('income-source').value;
  const date = document.getElementById('income-date').value;
  const description = document.getElementById('income-description').value.trim();

  if (!validateIncomeForm(amount, source, date)) return;

  addIncome({ amount: parseFloat(amount), source, date, description });
  event.target.reset();
  renderIncomeList(getIncome());
  refreshSummaries();
});

document.getElementById('income-list').addEventListener('click', function (event) {
  if (!event.target.classList.contains('delete-income-btn')) return;
  deleteIncome(event.target.dataset.id);
  renderIncomeList(getIncome());
  refreshSummaries();
});

// ── Period selectors ──────────────────────────────────────────────────────────

document.getElementById('daily-date').addEventListener('change', refreshSummaries);
document.getElementById('monthly-month').addEventListener('change', refreshSummaries);
document.getElementById('yearly-year').addEventListener('change', refreshSummaries);

// ── Category creation ─────────────────────────────────────────────────────────

document.getElementById('add-category-btn').addEventListener('click', function () {
  const input = document.getElementById('new-category');
  const name = input.value.trim();
  const errorEl = document.getElementById('category-add-error');
  if (!name) { errorEl.textContent = 'Nama kategori tidak boleh kosong.'; return; }
  errorEl.textContent = '';
  addCategory(name);
  renderCategoryOptions(getCategories());
  input.value = '';
});

// ── Init ──────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', function () {
  load();

  if (!isStorageAvailable()) {
    document.getElementById('storage-warning').classList.remove('hidden');
  }

  const today = new Date().toISOString().slice(0, 10);
  document.getElementById('daily-date').value = today;
  document.getElementById('income-date').value = today;
  document.getElementById('monthly-month').value = today.slice(0, 7);
  document.getElementById('yearly-year').value = new Date().getFullYear();

  renderExpenseList(getExpenses());
  renderCategoryOptions(getCategories());
  renderIncomeList(getIncome());
  renderIncomeSourceOptions(getIncomeSources());
  refreshSummaries();
});
