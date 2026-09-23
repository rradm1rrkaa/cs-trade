const CART_KEY = 'csTradeCart';
const THEME_KEY = 'csTradeTheme';
const SALE_KEY = 'csTradeSaleSkins';

const productGrid = document.getElementById('productGrid');
const searchInput = document.getElementById('searchInput');
const rarityFilter = document.getElementById('rarityFilter');
const wearFilter = document.getElementById('wearFilter');
const sortSelect = document.getElementById('sortSelect');
const cartToggle = document.getElementById('cartToggle');
const cartDrawer = document.getElementById('cartDrawer');
const closeCart = document.getElementById('closeCart');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cartCount');
const cartTotal = document.getElementById('cartTotal');
const checkoutLink = document.getElementById('checkoutLink');
const themeToggle = document.getElementById('themeToggle');
const themeIcon = document.querySelector('.theme-icon');
const themeLabel = document.querySelector('.theme-label');
const productModal = document.getElementById('productModal');
const modalContent = document.getElementById('modalContent');
const toastContainer = document.getElementById('toastContainer');
const saleForm = document.getElementById('saleForm');

const state = {
  cart: loadCart(),
  selectedTheme: loadTheme(),
  allProducts: [...allSkins]
};

function safeParseJSON(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch (error) {
    return fallback;
  }
}

function loadCart() {
  const saved = safeParseJSON(localStorage.getItem(CART_KEY), []);
  return Array.isArray(saved) ? saved : [];
}

function saveCart() {
  localStorage.setItem(CART_KEY, JSON.stringify(state.cart));
}

function loadTheme() {
  return localStorage.getItem(THEME_KEY) || 'dark';
}

function saveTheme() {
  localStorage.setItem(THEME_KEY, state.selectedTheme);
}

function normalizeProductId(item, index) {
  const idNumber = Number(item.id);
  return Number.isFinite(idNumber) ? idNumber : Date.now() + index + 1;
}

function loadSaleSkins() {
  const saved = safeParseJSON(localStorage.getItem(SALE_KEY), defaultSaleSkins);
  if (!Array.isArray(saved) || !saved.length) return defaultSaleSkins;
  return saved.map((item, index) => ({
    ...item,
    id: normalizeProductId(item, index)
  }));
}

function saveSaleSkins(items) {
  localStorage.setItem(SALE_KEY, JSON.stringify(items));
}

function getWearCategory(floatValue) {
  if (floatValue >= 0 && floatValue <= 0.07) return 'Factory New';
  if (floatValue > 0.07 && floatValue <= 0.15) return 'Minimal Wear';
  if (floatValue > 0.15 && floatValue <= 0.38) return 'Field-Tested';
  if (floatValue > 0.38 && floatValue <= 0.45) return 'Well-Worn';
  return 'Battle-Scarred';
}

function formatPrice(value) {
  return `${Number(value).toLocaleString('ru-RU')} ₸`;
}

function getRarityStyle(rarity) {
  const color = rarityColors[rarity] || '#ffffff';
  return {
    background: `rgba(15, 20, 17, 0.8)`,
    border: `1px solid ${color}55`,
    boxShadow: `0 0 16px ${color}22`,
    color
  };
}

function applyTheme(theme) {
  const resolved = theme === 'light' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', resolved);
  state.selectedTheme = resolved;
  const isLight = resolved === 'light';
  themeIcon.textContent = isLight ? '🌙' : '☀';
  themeLabel.textContent = isLight ? 'Тёмная тема' : 'Светлая тема';
  saveTheme();
}

function showToast(message) {
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => {
    toast.remove();
  }, 2200);
}

function addToCart(productId) {
  const normalizedId = Number(productId);
  const product = state.allProducts.find((item) => Number(item.id) === normalizedId || String(item.id) === String(productId));
  if (!product) return;

  const existing = state.cart.find((item) => Number(item.id) === normalizedId || String(item.id) === String(productId));
  if (existing) {
    existing.quantity += 1;
  } else {
    state.cart.push({ ...product, id: normalizedId || product.id, quantity: 1 });
  }

  saveCart();
  renderCart();
  showToast('✓ Скин добавлен в корзину');
}

function removeFromCart(productId) {
  const normalizedId = String(productId);
  state.cart = state.cart.filter((item) => String(item.id) !== normalizedId);
  saveCart();
  renderCart();
}

function updateQuantity(productId, delta) {
  const normalizedId = String(productId);
  const item = state.cart.find((entry) => String(entry.id) === normalizedId);
  if (!item) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    removeFromCart(productId);
    return;
  }

  saveCart();
  renderCart();
}

function calculateCartTotal() {
  return state.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

function renderCart() {
  cartCount.textContent = state.cart.reduce((sum, item) => sum + item.quantity, 0);
  const total = calculateCartTotal();
  cartTotal.textContent = formatPrice(total);

  if (!state.cart.length) {
    cartItems.innerHTML = '<div class="empty-state">Корзина пуста. Добавьте скин из каталога.</div>';
    checkoutLink.classList.add('disabled');
    checkoutLink.setAttribute('aria-disabled', 'true');
    return;
  }

  checkoutLink.classList.remove('disabled');
  checkoutLink.setAttribute('aria-disabled', 'false');

  cartItems.innerHTML = state.cart
    .map(
      (item) => `
        <div class="cart-item" data-id="${item.id}">
          <img class="cart-item__thumb" src="${item.image}" alt="${item.name}" />
          <div class="cart-item__content">
            <h4 class="cart-item__title">${item.name}</h4>
            <p class="cart-item__meta">${item.weapon} · ${item.rarity}</p>
            <div class="cart-item__controls">
              <div class="qty-controls" aria-label="Управление количеством">
                <button class="qty-btn" type="button" data-action="decrease" data-id="${item.id}">−</button>
                <span class="cart-item__qty">${item.quantity}</span>
                <button class="qty-btn" type="button" data-action="increase" data-id="${item.id}">+</button>
              </div>
              <button class="cart-item__remove" type="button" data-action="remove" data-id="${item.id}">Удалить</button>
            </div>
          </div>
          <div class="cart-item__price">
            <span class="cart-item__value">${formatPrice(item.price * item.quantity)}</span>
          </div>
        </div>
      `
    )
    .join('');

  cartItems.querySelectorAll('[data-action="increase"]').forEach((button) => {
    button.addEventListener('click', () => updateQuantity(button.dataset.id, 1));
  });

  cartItems.querySelectorAll('[data-action="decrease"]').forEach((button) => {
    button.addEventListener('click', () => updateQuantity(button.dataset.id, -1));
  });

  cartItems.querySelectorAll('[data-action="remove"]').forEach((button) => {
    button.addEventListener('click', () => removeFromCart(button.dataset.id));
  });
}

function openCart() {
  cartDrawer.classList.add('open');
}

function closeCartDrawer() {
  cartDrawer.classList.remove('open');
}

function buildProductCard(product) {
  const wear = getWearCategory(product.float);
  const rarityStyle = getRarityStyle(product.rarity);
  return `
    <article class="product-card product-card--rarity" style="border-color:${rarityStyle.border.includes('solid') ? rarityStyle.border : 'rgba(255,255,255,0.08)'}; box-shadow: var(--shadow), 0 0 20px ${rarityColors[product.rarity] || '#ffffff'}22;">
      <div class="product-card__image-box">
        <span class="product-card__badge" style="color:${rarityStyle.color}; border-color:${rarityStyle.color}66; background: rgba(8, 10, 12, 0.7);">${product.rarity}</span>
        <img class="product-card__image" src="${product.image}" alt="${product.name}" />
      </div>
      <div class="product-card__body">
        <div class="product-card__top">
          <h3 class="product-card__title">${product.name}</h3>
        </div>
        <div class="product-card__weapon">${product.weapon}</div>
        <div class="product-card__meta">
          <span>Float: ${product.float.toFixed(2)}</span>
          <span>${wear}</span>
          <span>Seed: ${product.seed}</span>
        </div>
        <p class="product-card__desc">${product.description}</p>
        <div class="product-card__footer">
          <div class="product-card__price">${formatPrice(product.price)}</div>
          <div class="product-card__actions">
            <button type="button" class="product-card__detail" data-detail-id="${product.id}">Подробнее</button>
            <button type="button" class="product-card__add" data-add-id="${product.id}">Добавить</button>
          </div>
        </div>
      </div>
    </article>
  `;
}

function renderProducts() {
  const query = searchInput.value.trim().toLowerCase();
  const rarityValue = rarityFilter.value;
  const wearValue = wearFilter.value;
  const sortValue = sortSelect.value;

  let filtered = [...state.allProducts];

  if (query) {
    filtered = filtered.filter((product) => {
      const searchable = [
        product.name,
        product.weapon,
        product.rarity,
        product.description,
        product.wear
      ]
        .join(' ')
        .toLowerCase();
      return searchable.includes(query);
    });
  }

  if (rarityValue !== 'Все') {
    filtered = filtered.filter((product) => product.rarity === rarityValue);
  }

  if (wearValue !== 'Все') {
    filtered = filtered.filter((product) => product.wear === wearValue);
  }

  switch (sortValue) {
    case 'price-asc':
      filtered.sort((a, b) => a.price - b.price);
      break;
    case 'price-desc':
      filtered.sort((a, b) => b.price - a.price);
      break;
    case 'name':
      filtered.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'float-desc':
      filtered.sort((a, b) => b.float - a.float);
      break;
    default:
      filtered.sort((a, b) => a.id - b.id);
      break;
  }

  if (!filtered.length) {
    productGrid.innerHTML = '<div class="empty-state">Ничего не найдено. Попробуйте изменить фильтры или поиск.</div>';
    return;
  }

  productGrid.innerHTML = filtered.map(buildProductCard).join('');

  productGrid.querySelectorAll('[data-add-id]').forEach((button) => {
    button.addEventListener('click', () => addToCart(button.dataset.addId));
  });

  productGrid.querySelectorAll('[data-detail-id]').forEach((button) => {
    button.addEventListener('click', () => openProductModal(button.dataset.detailId));
  });
}

function openProductModal(productId) {
  const product = state.allProducts.find((item) => item.id === productId);
  if (!product) return;

  const wear = getWearCategory(product.float);
  modalContent.innerHTML = `
    <img class="modal-content__image" src="${product.image}" alt="${product.name}" />
    <div>
      <h3 class="modal-content__title">${product.name}</h3>
      <div class="modal-content__meta">
        <span>${product.weapon}</span>
        <span>${product.rarity}</span>
        <span>Float: ${product.float.toFixed(2)}</span>
        <span>${wear}</span>
      </div>
      <p class="modal-content__description">${product.description}</p>
      <p class="modal-content__description"><strong>Pattern / Seed:</strong> ${product.seed}</p>
      <p class="modal-content__description"><strong>StatTrak:</strong> ${product.stattrak ? '★ StatTrak™ · Счётчик убийств' : 'Нет'}</p>
      <div class="modal-content__price">${formatPrice(product.price)}</div>
    </div>
  `;

  productModal.classList.remove('hidden');
}

function closeProductModal() {
  productModal.classList.add('hidden');
}

function handleSaleSubmit(event) {
  event.preventDefault();

  const formData = new FormData(saleForm);
  const name = formData.get('saleName').toString().trim();
  const weapon = formData.get('saleWeapon').toString().trim();
  const price = Number(formData.get('salePrice'));
  const floatValue = Number(formData.get('saleFloat'));
  const seed = Number(formData.get('saleSeed'));
  const rarity = formData.get('saleRarity').toString();
  const description = formData.get('saleDescription').toString().trim();
  const stattrak = document.getElementById('saleStatTrak').checked;

  if (!name || !weapon || !Number.isFinite(price) || price <= 0 || !Number.isFinite(floatValue) || floatValue < 0 || floatValue > 1 || !Number.isFinite(seed) || seed < 1 || seed > 1000 || !description) {
    showToast('Заполните все поля корректно');
    return;
  }

  const imageInput = document.getElementById('saleImage');
  let image = 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?auto=format&fit=crop&w=900&q=80';

  if (imageInput && imageInput.files && imageInput.files[0]) {
    const file = imageInput.files[0];
    const reader = new FileReader();
    reader.onload = function (event) {
      const customItem = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        name,
        weapon,
        image: event.target.result,
        price,
        rarity,
        float: floatValue,
        wear: getWearCategory(floatValue),
        seed,
        stattrak,
        description
      };
      const current = loadSaleSkins();
      current.unshift(customItem);
      saveSaleSkins(current);
      state.allProducts = [...allSkins, ...current];
      renderProducts();
      showToast('Скин успешно выставлен на продажу');
      saleForm.reset();
      document.getElementById('salePreviewWrap').hidden = true;
      document.getElementById('salePreview').src = '';
    };
    reader.readAsDataURL(file);
    return;
  }

  const customItem = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    name,
    weapon,
    image,
    price,
    rarity,
    float: floatValue,
    wear: getWearCategory(floatValue),
    seed,
    stattrak,
    description
  };

  const current = loadSaleSkins();
  current.unshift(customItem);
  saveSaleSkins(current);
  state.allProducts = [...allSkins, ...current];
  renderProducts();
  showToast('Скин успешно выставлен на продажу');
  saleForm.reset();
}

function handleSaleImagePreview() {
  const input = document.getElementById('saleImage');
  const preview = document.getElementById('salePreview');
  const previewWrap = document.getElementById('salePreviewWrap');

  if (!input || !input.files || !input.files[0]) {
    previewWrap.hidden = true;
    preview.src = '';
    return;
  }

  const file = input.files[0];
  const reader = new FileReader();
  reader.onload = function (event) {
    preview.src = event.target.result;
    previewWrap.hidden = false;
  };
  reader.readAsDataURL(file);
}

function wireEvents() {
  searchInput.addEventListener('input', renderProducts);
  rarityFilter.addEventListener('change', renderProducts);
  wearFilter.addEventListener('change', renderProducts);
  sortSelect.addEventListener('change', renderProducts);

  cartToggle.addEventListener('click', openCart);
  closeCart.addEventListener('click', closeCartDrawer);
  checkoutLink.addEventListener('click', (event) => {
    if (checkoutLink.classList.contains('disabled')) {
      event.preventDefault();
      showToast('Корзина пуста');
    }
  });

  document.addEventListener('click', (event) => {
    const clicked = event.target;
    if (clicked instanceof Element && clicked.classList.contains('modal-backdrop')) {
      closeProductModal();
    }
    if (clicked instanceof Element && clicked.classList.contains('modal-close')) {
      closeProductModal();
    }
    if (clicked instanceof Element && clicked.dataset.closeModal === 'true') {
      closeProductModal();
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeProductModal();
      closeCartDrawer();
    }
  });

  themeToggle.addEventListener('click', () => {
    const nextTheme = state.selectedTheme === 'light' ? 'dark' : 'light';
    applyTheme(nextTheme);
  });

  saleForm.addEventListener('submit', handleSaleSubmit);
  document.getElementById('saleImage').addEventListener('change', handleSaleImagePreview);

  const navLinks = document.querySelectorAll('.nav-link');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      navLinks.forEach((item) => item.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function initialize() {
  applyTheme(state.selectedTheme);
  state.allProducts = [...allSkins, ...loadSaleSkins()];
  renderProducts();
  renderCart();
  wireEvents();
}

initialize();
