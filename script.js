const STORAGE_KEY = "shopStockItems";

const form = document.getElementById("stockForm");
const formCard = document.querySelector(".form-card");
const listCard = document.querySelector(".list-card");
const itemIdInput = document.getElementById("itemId");
const nameInput = document.getElementById("itemName");
const priceInput = document.getElementById("itemPrice");
const quantityInput = document.getElementById("itemQuantity");
const submitBtnText = document.getElementById("submitBtnText");
const formTitle = document.getElementById("formTitle");
const cancelEditBtn = document.getElementById("cancelEditBtn");

const searchInput = document.getElementById("searchInput");
const clearSearchBtn = document.getElementById("clearSearchBtn");

const itemsContainer = document.getElementById("itemsContainer");
const emptyState = document.getElementById("emptyState");
const emptyTitle = document.getElementById("emptyTitle");
const emptyMessage = document.getElementById("emptyMessage");

const totalCount = document.getElementById("totalCount");
const quantityCount = document.getElementById("quantityCount");
const valueCount = document.getElementById("valueCount");

const currency = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

let items = loadItems();

function loadItems() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    const parsed = saved ? JSON.parse(saved) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveItems() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (error) {
    console.error("Could not save stock items:", error);
  }
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function highlightName(name, query) {
  const safeName = escapeHtml(name);
  if (!query) return safeName;

  const safeQuery = escapeHtml(query);
  const pattern = safeQuery.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return safeName.replace(
    new RegExp(pattern, "ig"),
    (match) => `<mark class="search-highlight">${match}</mark>`
  );
}

function getQuantityClass(quantity) {
  if (quantity <= 0) return "out";
  if (quantity <= 5) return "low";
  return "";
}

function renderStats() {
  const totalItems = items.length;
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);
  const stockValue = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  totalCount.textContent = totalItems;
  quantityCount.textContent = totalQuantity;
  valueCount.textContent = currency.format(stockValue);
}

function renderItems() {
  const query = searchInput.value.trim().toLowerCase();
  const filtered = query
    ? items.filter((item) => item.name.toLowerCase().includes(query))
    : items;

  itemsContainer.innerHTML = "";

  if (filtered.length === 0) {
    itemsContainer.style.display = "none";
    emptyState.style.display = "block";

    if (items.length === 0) {
      emptyTitle.textContent = "No stock items yet";
      emptyMessage.textContent = "Use the form to add your first stock item.";
    } else {
      emptyTitle.textContent = "No matching items";
      emptyMessage.textContent = "Try a different search term.";
    }
    return;
  }

  itemsContainer.style.display = "flex";
  emptyState.style.display = "none";

  filtered.forEach((item) => {
    const quantityClass = getQuantityClass(item.quantity);
    const quantityLabel =
      item.quantity <= 0
        ? "Out of stock"
        : `${item.quantity} in stock`;

    const element = document.createElement("div");
    element.className = "item";
    element.innerHTML = `
      <div class="item-info">
        <span class="item-name">${highlightName(item.name, query)}</span>
        <div class="item-meta">
          <span class="item-price">${currency.format(item.price)}</span>
          <span class="qty-badge ${quantityClass}">${quantityLabel}</span>
        </div>
      </div>
      <div class="item-actions">
        <button type="button" class="action-btn edit-btn" data-action="edit" data-id="${item.id}">Edit</button>
        <button type="button" class="action-btn delete-btn" data-action="delete" data-id="${item.id}">Delete</button>
      </div>
    `;
    itemsContainer.appendChild(element);
  });
}

function render() {
  renderStats();
  renderItems();
  syncListHeight();
}

function syncListHeight() {
  if (window.innerWidth <= 860) {
    listCard.style.minHeight = "";
    return;
  }
  listCard.style.minHeight = `${formCard.offsetHeight}px`;
}

function resetForm() {
  form.reset();
  itemIdInput.value = "";
  formTitle.textContent = "Add Stock Item";
  submitBtnText.textContent = "Add Item";
  cancelEditBtn.style.display = "none";
  syncListHeight();
}

function startEdit(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  itemIdInput.value = item.id;
  nameInput.value = item.name;
  priceInput.value = item.price;
  quantityInput.value = item.quantity;

  formTitle.textContent = "Edit Stock Item";
  submitBtnText.textContent = "Update Item";
  cancelEditBtn.style.display = "inline-flex";

  form.scrollIntoView({ behavior: "smooth", block: "start" });
  nameInput.focus();
  syncListHeight();
}

function deleteItem(id) {
  const item = items.find((entry) => entry.id === id);
  if (!item) return;

  const confirmed = window.confirm(
    `Delete "${item.name}"? This action cannot be undone.`
  );
  if (!confirmed) return;

  items = items.filter((entry) => entry.id !== id);
  saveItems();

  if (itemIdInput.value === id) {
    resetForm();
  }

  render();
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const name = nameInput.value.trim();
  const price = parseFloat(priceInput.value);
  const quantity = parseInt(quantityInput.value, 10);

  if (!name || Number.isNaN(price) || Number.isNaN(quantity)) {
    return;
  }
  if (price < 0 || quantity < 0) {
    return;
  }

  const editingId = itemIdInput.value;

  if (editingId) {
    items = items.map((item) =>
      item.id === editingId ? { ...item, name, price, quantity } : item
    );
  } else {
    items.push({
      id: Date.now().toString(),
      name,
      price: Math.round(price * 100) / 100,
      quantity,
    });
  }

  saveItems();
  resetForm();
  render();
  searchInput.value = "";
  clearSearchBtn.style.display = "none";
});

cancelEditBtn.addEventListener("click", resetForm);

searchInput.addEventListener("input", () => {
  clearSearchBtn.style.display = searchInput.value ? "block" : "none";
  renderItems();
});

clearSearchBtn.addEventListener("click", () => {
  searchInput.value = "";
  clearSearchBtn.style.display = "none";
  renderItems();
  searchInput.focus();
});

itemsContainer.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-action]");
  if (!button) return;

  const { action, id } = button.dataset;
  if (action === "edit") {
    startEdit(id);
  } else if (action === "delete") {
    deleteItem(id);
  }
});

window.addEventListener("resize", syncListHeight);

render();
