/**
 * NIKE SHOP FRONTEND CONTROLLER
 * Handles all UI events, API integrations, and Shopping Cart calculations.
 */
console.log("[NIKE SHOP] Frontend Controller Loaded Successfully (Dynamic API Version).");

// Application State
const state = {
    products: [],
    cart: {}, // key: category_id (e.g. 'men-1'), value: { product, qty }
    selectedCategory: 'all',
    searchQuery: '',
    discountPercent: 10,
    discountLimit: 100000,
    bagPrice: 50,
    carryBagEnabled: true
};

// API Base URL (Dynamic according to how you load the page)
const API_BASE = window.location.protocol.startsWith('http') ? window.location.origin : 'http://localhost:5000';

// DOM Elements
const elements = {
    productsGrid: document.getElementById('products-grid'),
    loadingSpinner: document.getElementById('loading-spinner'),
    emptyState: document.getElementById('empty-state-view'),
    searchInput: document.getElementById('search-input'),
    categoryFilters: document.getElementById('category-filters'),
    navMenu: document.getElementById('nav-menu'),
    cartBadgeCount: document.getElementById('cart-badge-count'),
    cartCountLabel: document.getElementById('cart-count-label'),
    cartToggleBtn: document.getElementById('cart-toggle-btn'),
    cartDrawer: document.getElementById('cart-drawer'),
    cartDrawerOverlay: document.getElementById('cart-drawer-overlay'),
    closeCartBtn: document.getElementById('close-cart-btn'),
    cartEmptyView: document.getElementById('cart-empty-view'),
    cartItemsList: document.getElementById('cart-items-list'),
    cartSummaryPanel: document.getElementById('cart-summary-panel'),
    cartSubtotal: document.getElementById('cart-subtotal'),
    cartDiscount: document.getElementById('cart-discount'),
    cartBagCharge: document.getElementById('cart-bag-charge'),
    cartFinalTotal: document.getElementById('cart-final-total'),
    carryBagCheckbox: document.getElementById('carry-bag-checkbox'),
    proceedCheckoutBtn: document.getElementById('proceed-checkout-btn'),
    cartStartShopping: document.getElementById('cart-start-shopping'),

    // Checkout Modal
    checkoutModal: document.getElementById('checkout-modal'),
    closeCheckoutBtn: document.getElementById('close-checkout-btn'),
    cancelCheckoutBtn: document.getElementById('cancel-checkout-btn'),
    checkoutForm: document.getElementById('checkout-form'),
    recapSubtotal: document.getElementById('recap-subtotal'),
    recapDiscountRow: document.getElementById('recap-discount-row'),
    recapDiscount: document.getElementById('recap-discount'),
    recapBagCharge: document.getElementById('recap-bag-charge'),
    recapTotal: document.getElementById('recap-total'),
    checkoutPayment: document.getElementById('checkout-payment'),

    // Hero
    heroShoeImg: document.getElementById('hero-shoe-img'),
    heroShopNow: document.getElementById('hero-shop-now'),
    heroLearnMore: document.getElementById('hero-learn-more'),

    // Invoice
    invoiceModal: document.getElementById('invoice-modal'),
    invoiceShoeName: document.getElementById('inv-shoe-name'),
    invoiceQty: document.getElementById('inv-qty'),
    invoiceUnitPrice: document.getElementById('inv-unit-price'),
    invoiceTotalPrice: document.getElementById('inv-total-price'),
    invoiceBagRow: document.getElementById('inv-bag-row'),
    invoiceBagQty: document.getElementById('inv-bag-qty'),
    invoiceBagTotal: document.getElementById('inv-bag-total'),
    invoiceSubtotal: document.getElementById('inv-subtotal'),
    invoiceDiscountRow: document.getElementById('inv-discount-row'),
    invoiceDiscount: document.getElementById('inv-discount'),
    invoiceFinalTotal: document.getElementById('inv-final-total'),
    invoicePayment: document.getElementById('inv-payment'),
    invoiceDate: document.getElementById('inv-date'),
    closeInvoiceBtn: document.getElementById('close-invoice-btn'),

    // Admin Panel
    adminPanelLink: document.getElementById('admin-panel-link'),
    adminModal: document.getElementById('admin-modal'),
    closeAdminBtn: document.getElementById('close-admin-btn'),
    adminStockForm: document.getElementById('admin-stock-form'),
    adminPriceForm: document.getElementById('admin-price-form'),
    stockSelectProduct: document.getElementById('stock-select-product'),
    priceSelectProduct: document.getElementById('price-select-product'),
    stockQuantity: document.getElementById('stock-quantity'),
    newPriceVal: document.getElementById('new-price-val')
};

// ==========================================================================
// INITIALIZATION & API FETCH
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    fetchProducts();
    setupEventListeners();
});

// Fetch all products from Backend
async function fetchProducts() {
    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/api/products`);
        if (!response.ok) throw new Error('Failed to fetch products');

        state.products = await response.json();

        renderCatalog();
        populateAdminSelects();
        setHeroShoe();
    } catch (error) {
        console.error('Error fetching products:', error);
        alert('Could not connect to the Nike Shop server. Please ensure the Python server is running.');
    } finally {
        showLoading(false);
    }
}

// Show/Hide catalog loading spinner
function showLoading(isLoading) {
    if (isLoading) {
        elements.loadingSpinner.classList.remove('hidden');
        elements.productsGrid.classList.add('hidden');
        elements.emptyState.classList.add('hidden');
    } else {
        elements.loadingSpinner.classList.add('hidden');
    }
}

// Configure Hero banner image
function setHeroShoe() {
    // Try to find the Nike Air Max DN or Nike Jordan
    const airMax = state.products.find(p => p.name.toLowerCase().includes('air max dn') && p.category === 'men');
    if (airMax && elements.heroShoeImg) {
        elements.heroShoeImg.src = airMax.image;
        elements.heroShoeImg.alt = airMax.name;
    } else if (state.products.length > 0 && elements.heroShoeImg) {
        elements.heroShoeImg.src = state.products[0].image;
        elements.heroShoeImg.alt = state.products[0].name;
    }
}

// ==========================================================================
// RENDER CATALOG & FILTERS
// ==========================================================================

function renderCatalog() {
    elements.productsGrid.innerHTML = '';

    // Apply filters
    const filtered = state.products.filter(product => {
        const matchesCategory = state.selectedCategory === 'all' || product.category === state.selectedCategory;
        const matchesSearch = product.name.toLowerCase().includes(state.searchQuery.toLowerCase()) ||
            product.category.toLowerCase().includes(state.searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    if (filtered.length === 0) {
        elements.productsGrid.classList.add('hidden');
        elements.emptyState.classList.remove('hidden');
        return;
    }

    elements.emptyState.classList.add('hidden');
    elements.productsGrid.classList.remove('hidden');

    filtered.forEach(product => {
        const card = document.createElement('article');
        card.className = 'product-card';
        card.id = `product-card-${product.category}-${product.id}`;

        let stockStatusText = `${product.stock} in Stock`;
        let stockClass = 'in-stock';
        if (product.stock === 0) {
            stockStatusText = 'Out of Stock';
            stockClass = 'out-of-stock';
        } else if (product.stock <= 5) {
            stockStatusText = `Only ${product.stock} left`;
            stockClass = 'low-stock';
        }

        const isOutOfStock = product.stock === 0;

        card.innerHTML = `
            <div class="card-image-container">
                <span class="category-tag">${product.category}</span>
                <span class="rating-tag"><i class="fa-solid fa-star"></i> ${product.rating}</span>
                <img src="${product.image}" alt="${product.name}" onerror="this.src='/static/images/nike_air_max.png'">
            </div>
            <div class="product-details">
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price-stock">
                    <span class="product-price">₹${product.price.toLocaleString('en-IN')}</span>
                    <span class="product-stock ${stockClass}">${stockStatusText}</span>
                </div>
            </div>
            <div class="card-buttons">
                <button class="card-action-btn add-to-bag-btn" data-id="${product.id}" data-category="${product.category}" ${isOutOfStock ? 'disabled' : ''}>
                    <i class="fa-solid fa-bag-shopping"></i> Add
                </button>
                <button class="card-action-btn buy-now-btn" data-id="${product.id}" data-category="${product.category}" ${isOutOfStock ? 'disabled' : ''}>
                    <i class="fa-solid fa-bolt"></i> Buy Now
                </button>
            </div>
        `;

        // Add to Bag Event Listener
        card.querySelector('.add-to-bag-btn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const pid = btn.dataset.id;
            const pcat = btn.dataset.category;
            addToCart(pcat, pid);
        });

        // Buy Now Event Listener
        card.querySelector('.buy-now-btn').addEventListener('click', (e) => {
            const btn = e.currentTarget;
            const pid = btn.dataset.id;
            const pcat = btn.dataset.category;
            buyNow(pcat, pid);
        });

        elements.productsGrid.appendChild(card);
    });
}

// Update Active Category Pill / Menu Item
function handleCategoryChange(category) {
    state.selectedCategory = category;

    // Update menu links styling
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.toggle('active', el.dataset.category === category);
    });

    // Update filter pills styling
    document.querySelectorAll('.filter-pill').forEach(el => {
        el.classList.toggle('active', el.dataset.category === category);
    });

    renderCatalog();
}

// ==========================================================================
// SHOPPING CART LOGIC
// ==========================================================================

function addToCart(category, id) {
    const key = `${category}-${id}`;
    const product = state.products.find(p => p.id === parseInt(id) && p.category === category);

    if (!product) return;

    if (state.cart[key]) {
        if (state.cart[key].qty + 1 <= product.stock) {
            state.cart[key].qty += 1;
            showNotification(`Added another ${product.name} to bag!`);
        } else {
            alert(`Sorry, only ${product.stock} items are in stock.`);
        }
    } else {
        state.cart[key] = {
            product: product,
            qty: 1
        };
        showNotification(`${product.name} added to bag!`);
    }

    updateCartUI();
}

function buyNow(category, id) {
    const key = `${category}-${id}`;
    const product = state.products.find(p => p.id === parseInt(id) && p.category === category);
    
    if (!product) return;

    if (!state.cart[key]) {
        state.cart[key] = {
            product: product,
            qty: 1
        };
    }

    updateCartUI();

    // Directly open Checkout Modal
    elements.cartDrawer.classList.remove('open');
    elements.checkoutModal.classList.remove('hidden');
}

function updateCartQuantity(key, newQty) {
    if (newQty <= 0) {
        delete state.cart[key];
    } else {
        const item = state.cart[key];
        if (newQty <= item.product.stock) {
            item.qty = newQty;
        } else {
            alert(`Sorry, only ${item.product.stock} items are in stock.`);
        }
    }
    updateCartUI();
}

function removeFromCart(key) {
    delete state.cart[key];
    updateCartUI();
}

// Recalculate totals and refresh Cart drawer list
function updateCartUI() {
    const cartKeys = Object.keys(state.cart);
    const totalItems = cartKeys.reduce((acc, key) => acc + state.cart[key].qty, 0);

    // Update Navbar Badge count
    elements.cartBadgeCount.textContent = totalItems;
    elements.cartCountLabel.textContent = `(${totalItems})`;

    if (totalItems === 0) {
        elements.cartEmptyView.classList.remove('hidden');
        elements.cartItemsList.classList.add('hidden');
        elements.cartSummaryPanel.classList.add('hidden');
        return;
    }

    elements.cartEmptyView.classList.add('hidden');
    elements.cartItemsList.classList.remove('hidden');
    elements.cartSummaryPanel.classList.remove('hidden');

    // Render list
    elements.cartItemsList.innerHTML = '';

    let subtotal = 0;

    cartKeys.forEach(key => {
        const item = state.cart[key];
        const itemTotal = item.product.price * item.qty;
        subtotal += itemTotal;

        const cartItemEl = document.createElement('div');
        cartItemEl.className = 'cart-item';
        cartItemEl.innerHTML = `
            <button class="remove-item-btn" data-key="${key}" aria-label="Remove item">
                <i class="fa-solid fa-trash-can"></i>
            </button>
            <div class="cart-item-img-box">
                <img src="${item.product.image}" alt="${item.product.name}" onerror="this.src='/static/images/nike_air_max.png'">
            </div>
            <div class="cart-item-info">
                <div>
                    <span class="cart-item-cat">${item.product.category}</span>
                    <h4 class="cart-item-name">${item.product.name}</h4>
                </div>
                <div class="cart-item-actions">
                    <button class="qty-btn dec-qty" data-key="${key}">-</button>
                    <span class="qty-val">${item.qty}</span>
                    <button class="qty-btn inc-qty" data-key="${key}">+</button>
                    <span class="cart-item-price">₹${itemTotal.toLocaleString('en-IN')}</span>
                </div>
            </div>
        `;

        // Event listeners for quantity edits
        cartItemEl.querySelector('.dec-qty').addEventListener('click', () => updateCartQuantity(key, item.qty - 1));
        cartItemEl.querySelector('.inc-qty').addEventListener('click', () => updateCartQuantity(key, item.qty + 1));
        cartItemEl.querySelector('.remove-item-btn').addEventListener('click', () => removeFromCart(key));

        elements.cartItemsList.appendChild(cartItemEl);
    });

    // Discount Calculation (10% if subtotal >= 100,000 Rupees)
    const discount = subtotal >= state.discountLimit ? (subtotal * state.discountPercent) / 100 : 0;

    // Carry Bag Calculation
    state.carryBagEnabled = elements.carryBagCheckbox.checked;
    const bagCharge = state.carryBagEnabled ? totalItems * state.bagPrice : 0;

    // Final total
    const finalTotal = subtotal - discount + bagCharge;

    // Update summary text
    elements.cartSubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    elements.cartBagCharge.textContent = `₹${bagCharge.toLocaleString('en-IN')}`;
    elements.cartFinalTotal.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;

    if (discount > 0) {
        elements.summaryDiscountRow.classList.remove('hidden');
        elements.cartDiscount.textContent = `-₹${discount.toLocaleString('en-IN')}`;
    } else {
        elements.summaryDiscountRow.classList.add('hidden');
    }

    // Populate Checkout recap elements as well
    elements.recapSubtotal.textContent = `₹${subtotal.toLocaleString('en-IN')}`;
    elements.recapBagCharge.textContent = `₹${bagCharge.toLocaleString('en-IN')}`;
    elements.recapTotal.textContent = `₹${finalTotal.toLocaleString('en-IN')}`;
    if (discount > 0) {
        elements.recapDiscountRow.classList.remove('hidden');
        elements.recapDiscount.textContent = `-₹${discount.toLocaleString('en-IN')}`;
    } else {
        elements.recapDiscountRow.classList.add('hidden');
    }
}

// Show a temporary snackbar notification at top right
function showNotification(message) {
    const notify = document.createElement('div');
    notify.className = 'custom-notification';
    notify.innerHTML = `<i class="fa-solid fa-circle-check" style="color: var(--success)"></i> ${message}`;
    document.body.appendChild(notify);

    // Styling snackbar programmatically
    Object.assign(notify.style, {
        position: 'fixed',
        top: '100px',
        right: '24px',
        background: 'var(--bg-secondary)',
        border: '1px solid var(--accent-primary)',
        color: 'var(--text-primary)',
        padding: '12px 24px',
        borderRadius: '8px',
        boxShadow: 'var(--card-shadow)',
        zIndex: '1000',
        fontFamily: 'var(--font-heading)',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s ease',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        opacity: '0',
        transform: 'translateY(-10px)'
    });

    // Animate
    setTimeout(() => {
        notify.style.opacity = '1';
        notify.style.transform = 'translateY(0)';
    }, 10);

    // Remove
    setTimeout(() => {
        notify.style.opacity = '0';
        notify.style.transform = 'translateY(-10px)';
        setTimeout(() => notify.remove(), 300);
    }, 3000);
}

// ==========================================================================
// CHECKOUT FORM SUBMISSION
// ==========================================================================

async function handleCheckoutSubmit(e) {
    e.preventDefault();

    const cartKeys = Object.keys(state.cart);
    if (cartKeys.length === 0) return;

    // For simplicity, the backend takes one item purchase details per `/api/buy` endpoint request.
    // So we will process the checkout of the primary item in the cart, or process all sequentially.
    // For realistic simulation matching the CLI database state, we will submit the first item in the bag.
    const primaryKey = cartKeys[0];
    const item = state.cart[primaryKey];

    const payload = {
        category: item.product.category,
        id: item.product.id,
        qty: item.qty,
        carry_bag: state.carryBagEnabled,
        payment_mode: elements.checkoutPayment.options[elements.checkoutPayment.selectedIndex].text
    };

    try {
        // Disable submit button
        const submitBtn = elements.checkoutForm.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Processing...';

        const response = await fetch(`${API_BASE}/api/buy`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const resData = await response.json();

        if (resData.success) {
            // Show Invoice success details
            const bill = resData.bill;
            bill.new_stock = resData.new_stock;
            renderInvoice(bill);

            // Clear cart
            state.cart = {};
            updateCartUI();

            // Close checkout modal
            elements.checkoutModal.classList.add('hidden');

            // Fetch updated products catalog (to refresh stock levels)
            fetchProducts();
        } else {
            alert(resData.message || 'Transaction failed. Please try again.');
        }
    } catch (err) {
        console.error('Checkout error:', err);
        alert('Server communication error during checkout. Please check the python console.');
    } finally {
        const submitBtn = elements.checkoutForm.querySelector('button[type="submit"]');
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Place Order <i class="fa-solid fa-arrow-right"></i>';
    }
}

// Render the final PDF-like digital invoice modal
function renderInvoice(bill) {
    elements.invoiceShoeName.textContent = bill.name;
    elements.invoiceQty.textContent = bill.qty;
    elements.invoiceUnitPrice.textContent = `₹${bill.price.toLocaleString('en-IN')}`;
    elements.invoiceTotalPrice.textContent = `₹${bill.total.toLocaleString('en-IN')}`;

    if (bill.bag_charge > 0) {
        elements.invoiceBagRow.classList.remove('hidden');
        elements.invoiceBagQty.textContent = bill.qty;
        elements.invoiceBagTotal.textContent = `₹${bill.bag_charge.toLocaleString('en-IN')}`;
    } else {
        elements.invoiceBagRow.classList.add('hidden');
    }

    elements.invoiceSubtotal.textContent = `₹${bill.total.toLocaleString('en-IN')}`;

    if (bill.discount > 0) {
        elements.invoiceDiscountRow.classList.remove('hidden');
        elements.invoiceDiscount.textContent = `-₹${bill.discount.toLocaleString('en-IN')}`;
    } else {
        elements.invoiceDiscountRow.classList.add('hidden');
    }

    elements.invoiceFinalTotal.textContent = `₹${bill.final_amount.toLocaleString('en-IN')}`;
    elements.invoicePayment.textContent = bill.payment_mode;
    elements.invoiceDate.textContent = new Date().toLocaleDateString('en-IN', {
        year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });

    const remainingStockEl = document.getElementById('inv-remaining-stock');
    if (remainingStockEl && typeof bill.new_stock !== 'undefined') {
        remainingStockEl.textContent = `Remaining Stock: ${bill.new_stock} items left`;
    } else if (remainingStockEl) {
        remainingStockEl.textContent = '';
    }

    elements.invoiceModal.classList.remove('hidden');
}

// ==========================================================================
// ADMIN PANEL ACTIONS
// ==========================================================================

function populateAdminSelects() {
    elements.stockSelectProduct.innerHTML = '';
    elements.priceSelectProduct.innerHTML = '';

    state.products.forEach(p => {
        const option = document.createElement('option');
        option.value = JSON.stringify({ id: p.id, category: p.category });
        option.textContent = `[${p.category.toUpperCase()}] ${p.name} (Stock: ${p.stock}, Price: ₹${p.price})`;

        elements.stockSelectProduct.appendChild(option.cloneNode(true));
        elements.priceSelectProduct.appendChild(option);
    });
}

async function handleAdminStockSubmit(e) {
    e.preventDefault();
    const productInfo = JSON.parse(elements.stockSelectProduct.value);
    const qty = parseInt(elements.stockQuantity.value);

    try {
        const response = await fetch(`${API_BASE}/api/admin/stock`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category: productInfo.category,
                id: productInfo.id,
                qty: qty
            })
        });
        const res = await response.json();
        if (res.success) {
            alert('Stock updated successfully!');
            elements.stockQuantity.value = '';
            fetchProducts(); // reload
        } else {
            alert(res.message);
        }
    } catch (err) {
        alert('Could not update stock.');
    }
}

async function handleAdminPriceSubmit(e) {
    e.preventDefault();
    const productInfo = JSON.parse(elements.priceSelectProduct.value);
    const price = parseInt(elements.newPriceVal.value);

    try {
        const response = await fetch(`${API_BASE}/api/admin/price`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                category: productInfo.category,
                id: productInfo.id,
                price: price
            })
        });
        const res = await response.json();
        if (res.success) {
            alert('Price updated successfully!');
            elements.newPriceVal.value = '';
            fetchProducts(); // reload
        } else {
            alert(res.message);
        }
    } catch (err) {
        alert('Could not update price.');
    }
}

// ==========================================================================
// EVENT LISTENERS BINDINGS
// ==========================================================================

function setupEventListeners() {
    // Search event
    elements.searchInput.addEventListener('input', (e) => {
        state.searchQuery = e.target.value;
        renderCatalog();
    });

    // Category navigation events
    elements.navMenu.addEventListener('click', (e) => {
        if (e.target.classList.contains('nav-item')) {
            e.preventDefault();
            handleCategoryChange(e.target.dataset.category);
        }
    });

    elements.categoryFilters.addEventListener('click', (e) => {
        if (e.target.classList.contains('filter-pill')) {
            handleCategoryChange(e.target.dataset.category);
        }
    });

    // Footer categories quick link
    document.querySelectorAll('.foot-cat-link').forEach(el => {
        el.addEventListener('click', (e) => {
            e.preventDefault();
            handleCategoryChange(e.target.dataset.cat);
            document.getElementById('catalog-section').scrollIntoView({ behavior: 'smooth' });
        });
    });

    // Cart Drawer Toggle
    elements.cartToggleBtn.addEventListener('click', () => {
        elements.cartDrawer.classList.add('open');
    });

    const closeCart = () => elements.cartDrawer.classList.remove('open');
    elements.closeCartBtn.addEventListener('click', closeCart);
    elements.cartDrawerOverlay.addEventListener('click', closeCart);
    elements.cartStartShopping.addEventListener('click', closeCart);

    // Carry bag toggling recalculates totals
    elements.carryBagCheckbox.addEventListener('change', updateCartUI);

    // Checkout modal actions
    elements.proceedCheckoutBtn.addEventListener('click', () => {
        elements.cartDrawer.classList.remove('open');
        elements.checkoutModal.classList.remove('hidden');
    });

    const closeCheckout = () => elements.checkoutModal.classList.add('hidden');
    elements.closeCheckoutBtn.addEventListener('click', closeCheckout);
    elements.cancelCheckoutBtn.addEventListener('click', closeCheckout);
    elements.checkoutForm.addEventListener('submit', handleCheckoutSubmit);

    // Hero Section buttons
    elements.heroShopNow.addEventListener('click', () => {
        document.getElementById('catalog-section').scrollIntoView({ behavior: 'smooth' });
    });
    elements.heroLearnMore.addEventListener('click', () => {
        state.searchQuery = 'Air Max';
        elements.searchInput.value = 'Air Max';
        handleCategoryChange('all');
        document.getElementById('catalog-section').scrollIntoView({ behavior: 'smooth' });
    });

    // Success Invoice Modal closing
    elements.closeInvoiceBtn.addEventListener('click', () => {
        elements.invoiceModal.classList.add('hidden');
    });

    // Admin Panel Modal actions
    elements.adminPanelLink.addEventListener('click', (e) => {
        e.preventDefault();
        elements.adminModal.classList.remove('hidden');
    });

    const closeAdmin = () => elements.adminModal.classList.add('hidden');
    elements.closeAdminBtn.addEventListener('click', closeAdmin);
    elements.adminStockForm.addEventListener('submit', handleAdminStockSubmit);
    elements.adminPriceForm.addEventListener('submit', handleAdminPriceSubmit);
}
