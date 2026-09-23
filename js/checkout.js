const cartKey = 'csTradeCart';
const themeKey = 'csTradeTheme';

const checkoutItems = document.getElementById('checkoutItems');
const checkoutTotal = document.getElementById('checkoutTotal');
const paymentForm = document.getElementById('paymentForm');
const successModal = document.getElementById('successModal');
const toastContainer = document.getElementById('toastContainer');
const themeToggle = document.getElementById('themeToggle');

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function loadCart() {
  const saved = safeParseJSON(localStorage.getItem(cartKey), []);
  return Array.isArray(saved) ? saved : [];
}

function saveCart() {
  localStorage.setItem(cartKey, JSON.stringify([]));
}

function getTheme() {
  return localStorage.getItem(themeKey) || 'dark';
}

function applyTheme(theme) {
  const resolved = theme === 'light' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', resolved);
  const icon = document.querySelector('.theme-icon');
  const label = document.querySelector('.theme-label');
  if (icon && label) {
    icon.textContent = resolved === 'light' ? '🌙' : '☀';
    label.textContent = resolved === 'light' ? 'Тёмная тема' : 'Светлая тема';
  }
}

function formatPrice(value) {
  return `${Number(value).toLocaleString('ru-RU')} ₸`;
}

function renderCheckoutItems() {
  const items = loadCart();

  if (!items.length) {
    checkoutItems.innerHTML = '<div class="empty-state">Корзина пуста. Для оформления заказа добавьте хотя бы один предмет.</div>';
    checkoutTotal.textContent = '0 ₸';
    return;
  }

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  checkoutTotal.textContent = formatPrice(total);

  checkoutItems.innerHTML = items
    .map(
      (item) => `
        <div class="checkout-item">
          <img class="checkout-item__thumb" src="${item.image}" alt="${item.name}" />
          <div class="checkout-item__text">
            <h3 class="checkout-item__title">${item.name}</h3>
            <div class="checkout-item__meta">${item.weapon} · ${item.quantity} шт.</div>
          </div>
          <div class="checkout-item__total">${formatPrice(item.price * item.quantity)}</div>
        </div>
      `
    )
    .join('');
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  const container = document.getElementById('toastContainer');
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 2200);
}

function setFieldError(fieldId, message) {
  const field = document.getElementById(fieldId);
  const wrapper = field.closest('.field-group');
  const errorEl = document.querySelector(`[data-error-for="${fieldId}"]`);

  if (wrapper) wrapper.classList.add('invalid');
  if (errorEl) errorEl.textContent = message;
}

function clearFieldError(fieldId) {
  const field = document.getElementById(fieldId);
  const wrapper = field.closest('.field-group');
  const errorEl = document.querySelector(`[data-error-for="${fieldId}"]`);

  if (wrapper) wrapper.classList.remove('invalid');
  if (errorEl) errorEl.textContent = '';
}

function validateCardNumber() {
  const field = document.getElementById('cardNumber');
  const value = field.value.replace(/\s+/g, '');
  if (!/^\d{16}$/.test(value)) {
    setFieldError('cardNumber', 'Введите корректный 16-значный номер карты');
    return false;
  }
  clearFieldError('cardNumber');
  return true;
}

function validateExpiryDate() {
  const field = document.getElementById('expiryDate');
  const value = field.value.trim();
  const match = /^\d{2}\/\d{2}$/.exec(value);

  if (!match) {
    setFieldError('expiryDate', 'Введите корректный срок действия карты');
    return false;
  }

  const month = Number(value.slice(0, 2));
  const year = Number(value.slice(3, 5));
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear() % 100;
  const currentMonth = currentDate.getMonth() + 1;

  if (month < 1 || month > 12 || year < currentYear || (year === currentYear && month < currentMonth)) {
    setFieldError('expiryDate', 'Введите корректный срок действия карты');
    return false;
  }

  clearFieldError('expiryDate');
  return true;
}

function validateCVV() {
  const field = document.getElementById('cvv');
  const value = field.value.trim();
  if (!/^\d{3}$/.test(value)) {
    setFieldError('cvv', 'CVV должен содержать 3 цифры');
    return false;
  }
  clearFieldError('cvv');
  return true;
}

function validateName(fieldId) {
  const field = document.getElementById(fieldId);
  const value = field.value.trim();
  if (!value || value.length < 2 || !/^[a-zA-Zа-яА-Я\s-]+$/.test(value)) {
    setFieldError(fieldId, 'Поле должно содержать минимум 2 символа');
    return false;
  }
  clearFieldError(fieldId);
  return true;
}

function formatCardNumber(value) {
  return value.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
}

function formatExpiryDate(value) {
  const digits = value.replace(/\D/g, '').slice(0, 4);
  if (digits.length <= 2) return digits;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}`;
}

function formatCVV(value) {
  return value.replace(/\D/g, '').slice(0, 3);
}

function handlePaymentSubmit(event) {
  event.preventDefault();

  const cart = loadCart();
  if (!cart.length) {
    showToast('Корзина пуста');
    window.location.href = 'index.html';
    return;
  }

  const isValid = [
    validateCardNumber(),
    validateExpiryDate(),
    validateCVV(),
    validateName('firstName'),
    validateName('lastName')
  ].every(Boolean);

  if (!isValid) {
    showToast('Проверьте правильность данных');
    return;
  }

  successModal.classList.remove('hidden');
  setTimeout(() => {
    saveCart();
    window.location.href = 'index.html';
  }, 1800);
}

function initializeCheckout() {
  const theme = getTheme();
  applyTheme(theme);
  renderCheckoutItems();

  if (window.location.pathname.endsWith('checkout.html') && !loadCart().length) {
    showToast('Корзина пуста');
  }

  const cardNumberInput = document.getElementById('cardNumber');
  const expiryInput = document.getElementById('expiryDate');
  const cvvInput = document.getElementById('cvv');

  cardNumberInput.addEventListener('input', (event) => {
    event.target.value = formatCardNumber(event.target.value);
    clearFieldError('cardNumber');
  });

  expiryInput.addEventListener('input', (event) => {
    event.target.value = formatExpiryDate(event.target.value);
    clearFieldError('expiryDate');
  });

  cvvInput.addEventListener('input', (event) => {
    event.target.value = formatCVV(event.target.value);
    clearFieldError('cvv');
  });

  document.getElementById('firstName').addEventListener('input', () => clearFieldError('firstName'));
  document.getElementById('lastName').addEventListener('input', () => clearFieldError('lastName'));

  paymentForm.addEventListener('submit', handlePaymentSubmit);

  themeToggle.addEventListener('click', () => {
    const nextTheme = document.body.getAttribute('data-theme') === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
    localStorage.setItem(themeKey, nextTheme);
  });

  document.querySelectorAll('[data-close-success]').forEach((element) => {
    element.addEventListener('click', () => {
      successModal.classList.add('hidden');
    });
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') successModal.classList.add('hidden');
  });
}

initializeCheckout();
