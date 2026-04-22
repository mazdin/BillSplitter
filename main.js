import { api } from './src/utils/api.js';
import { calculateBill, formatCurrency } from './src/utils/calculator.js';

// State Management
let state = {
  view: 'home', // 'home' or 'session'
  session: null,
  members: [],
  items: [],
  assignments: [],
  id: null,
  isSyncing: false
};

// DOM Elements
const views = {
  home: document.getElementById('home-view'),
  session: document.getElementById('session-view')
};

const elements = {
  sessionNameInput: document.getElementById('session-name'),
  btnCreateSession: document.getElementById('btn-create-session'),
  displaySessionName: document.getElementById('display-session-name'),
  displaySessionDate: document.getElementById('display-session-date'),
  membersList: document.getElementById('members-list'),
  itemsList: document.getElementById('items-list'),
  memberBreakdown: document.getElementById('member-breakdown'),
  summarySubtotal: document.getElementById('summary-subtotal'),
  summaryCharges: document.getElementById('summary-charges'),
  summaryTotal: document.getElementById('summary-total'),
  memberCount: document.getElementById('member-count'),
  configTax: document.getElementById('config-tax'),
  configService: document.getElementById('config-service'),
  configRounding: document.getElementById('config-rounding')
};

// --- Initialization ---
function init() {
  // Check URL for session ID
  const urlParams = new URLSearchParams(window.location.search);
  const sessionId = urlParams.get('s');

  if (sessionId) {
    loadSession(sessionId);
  }

  // Event Listeners
  elements.btnCreateSession.onclick = handleCreateSession;
  document.getElementById('btn-back-home').onclick = () => navigate('home');
  document.getElementById('btn-add-member').onclick = () => toggleModal('modal-member', true);
  document.getElementById('btn-add-item').onclick = () => openItemModal();
  document.getElementById('btn-save-member').onclick = handleAddMember;
  document.getElementById('btn-save-item').onclick = handleSaveItem;
  document.getElementById('btn-copy-wa').onclick = copyToWA;
  
  // Close modals
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.onclick = () => {
      document.querySelectorAll('.modal').forEach(m => m.classList.remove('active'));
    };
  });

  // Config changes
  const updateConfig = () => {
    if (!state.id) return;
    api.dispatch(state.id, 'UPDATE_CONFIG', {
      tax_type: 'percentage',
      tax_value: parseFloat(elements.configTax.value) || 0,
      service_charge: parseFloat(elements.configService.value) || 0,
      rounding_type: elements.configRounding.value,
      rounding_value: elements.configRounding.value === 'none' ? 0 : 1000 // Default 1000 for IDR
    }).then(fetchData);
  };

  elements.configTax.onchange = updateConfig;
  elements.configService.onchange = updateConfig;
  elements.configRounding.onchange = updateConfig;

  // Initial Lucide Icons
  lucide.createIcons();
  
  // Auto-Sync Polling
  setInterval(() => {
    if (state.id && !state.isSyncing) {
      fetchData();
    }
  }, 10000); // Sync every 10s
}

// --- Navigation ---
function navigate(viewName) {
  state.view = viewName;
  Object.keys(views).forEach(v => {
    views[v].classList.toggle('active', v === viewName);
  });
  if (viewName === 'home') {
    window.history.pushState({}, '', '/');
    state.id = null;
  }
}

// --- Logic functions ---
async function handleCreateSession() {
  const name = elements.sessionNameInput.value || 'WFC Tanpa Nama';
  const res = await api.createSession(name);
  if (res.id) {
    window.history.pushState({}, '', `?s=${res.id}`);
    loadSession(res.id);
  }
}

async function loadSession(id) {
  state.id = id;
  navigate('session');
  await fetchData();
}

async function fetchData() {
  if (state.isSyncing) return;
  state.isSyncing = true;
  try {
    const data = await api.syncFull(state.id);
    state.members = data.members;
    state.items = data.items;
    state.assignments = data.assignments;
    state.session = data.config;
    render();
  } finally {
    state.isSyncing = false;
  }
}

async function handleAddMember() {
  const input = document.getElementById('input-member-name');
  if (!input.value) return;
  
  await api.dispatch(state.id, 'ADD_MEMBER', { name: input.value });
  input.value = '';
  toggleModal('modal-member', false);
  fetchData();
}

async function handleSaveItem() {
  const name = document.getElementById('input-item-name').value;
  const price = parseFloat(document.getElementById('input-item-price').value);
  const assignees = Array.from(document.querySelectorAll('.selectable-member.selected'))
                        .map(el => el.dataset.id);

  if (!name || isNaN(price)) return;

  await api.dispatch(state.id, 'ADD_ITEM', { name, price, assignees });
  toggleModal('modal-item', false);
  fetchData();
}

// --- Rendering ---
function render() {
  if (!state.session) return;

  // Header info
  elements.displaySessionName.innerText = state.session.name;
  elements.displaySessionDate.innerText = state.session.date;

  // Config inputs
  elements.configTax.value = state.session.tax_value;
  elements.configService.value = state.session.service_charge;
  elements.configRounding.value = state.session.rounding_type;

  // Members list
  elements.memberCount.innerText = state.members.length;
  elements.membersList.innerHTML = state.members.map(m => `
    <div class="chip">
      ${m.name}
      <button onclick="window.deleteMember('${m.id}')" title="Hapus"><i data-lucide="x" style="width: 14px;"></i></button>
    </div>
  `).join('');

  // Items list
  elements.itemsList.innerHTML = state.items.map(item => {
    const itemAssignees = state.assignments.filter(a => a.item_id === item.id)
                          .map(a => state.members.find(m => m.id === a.member_id)?.name)
                          .filter(Boolean);
    
    return `
      <div class="item-card glass">
        <div class="item-info">
          <h4>${item.name}</h4>
          <span class="item-price">${formatCurrency(item.price)}</span>
          <div class="item-assignees">
            ${itemAssignees.map(name => `<span class="tiny-badge">${name}</span>`).join('')}
          </div>
        </div>
        <button class="btn-icon btn-sm" onclick="window.deleteItem('${item.id}')"><i data-lucide="trash-2"></i></button>
      </div>
    `;
  }).join('');

  // Summary
  const bill = calculateBill(state.session, state.members, state.items, state.assignments);
  
  elements.summarySubtotal.innerText = formatCurrency(bill.subtotal);
  elements.summaryCharges.innerText = formatCurrency(bill.taxAmount + bill.serviceAmount);
  elements.summaryTotal.innerText = formatCurrency(bill.totalAfterRounding);

  elements.memberBreakdown.innerHTML = bill.memberBreakdown.map(mb => `
    <div class="member-total-card">
      <div class="name">${mb.name}</div>
      <div class="amount">${formatCurrency(mb.finalAmount)}</div>
    </div>
  `).join('');

  lucide.createIcons();
}

// --- Helpers ---
function toggleModal(id, show) {
  document.getElementById(id).classList.toggle('active', show);
}

function openItemModal() {
  document.getElementById('input-item-name').value = '';
  document.getElementById('input-item-price').value = '';
  const list = document.getElementById('member-selection-list');
  list.innerHTML = state.members.map(m => `
    <div class="selectable-member" data-id="${m.id}" onclick="this.classList.toggle('selected')">
      ${m.name}
    </div>
  `).join('');
  toggleModal('modal-item', true);
}

// Window functions for HTML onclick
window.deleteMember = async (id) => {
  if (confirm('Hapus anggota ini?')) {
    await api.dispatch(state.id, 'DELETE_MEMBER', { id });
    fetchData();
  }
};

window.deleteItem = async (id) => {
  if (confirm('Hapus item ini?')) {
    await api.dispatch(state.id, 'DELETE_ITEM', { id });
    fetchData();
  }
};

function copyToWA() {
  const bill = calculateBill(state.session, state.members, state.items, state.assignments);
  let text = `🍽️ *${state.session.name}*\n\n`;
  
  bill.memberBreakdown.forEach(mb => {
    text += `• ${mb.name}: *${formatCurrency(mb.finalAmount)}*\n`;
  });
  
  text += `\nSubtotal: ${formatCurrency(bill.subtotal)}`;
  if (bill.taxAmount > 0) text += `\nPajak: ${formatCurrency(bill.taxAmount)}`;
  if (bill.serviceAmount > 0) text += `\nService: ${formatCurrency(bill.serviceAmount)}`;
  
  text += `\n*TOTAL: ${formatCurrency(bill.totalAfterRounding)}*\n\n_Silakan transfer ya 🙏_`;
  
  navigator.clipboard.writeText(text).then(() => {
    alert('Summary disalin ke clipboard! Silakan paste di WhatsApp.');
  });
}

init();
