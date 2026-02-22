// Game State
let currentUser = null;
let players = JSON.parse(localStorage.getItem('players')) || {};

// Default player data
const defaultPlayer = {
    id: 'guest_' + Math.random().toString(36).substr(2, 9),
    name: 'Guest_' + Math.floor(Math.random() * 10000),
    loginMethod: 'guest',
    level: 1,
    xp: 0,
    xpToNextLevel: 1000,
    rank: 'BRONZE',
    division: 'III',
    rankPoints: 0,
    gold: 1000,
    diamonds: 500,
    crystals: 500,
    stats: {
        wins: 0,
        losses: 0,
        kills: 0,
        deaths: 0,
        matches: 0
    },
    inventory: {
        weapons: ['pulse'],
        skins: ['default'],
        charms: [],
        effects: []
    },
    equipped: {
        weapon: 'pulse',
        skin: 'default',
        charm: null,
        effect: null
    },
    nameChanges: 0,
    joinDate: new Date().toISOString().split('T')[0],
    lastLogin: new Date().toISOString(),
    spinHistory: []
};

// Rank thresholds
const rankThresholds = [
    { rank: 'BRONZE', minRP: 0, maxRP: 100, icon: 'fa-shield-alt', color: '#cd7f32' },
    { rank: 'GOLD', minRP: 100, maxRP: 200, icon: 'fa-shield-alt', color: '#ffd700' },
    { rank: 'PLATINUM', minRP: 200, maxRP: 300, icon: 'fa-shield-alt', color: '#e5e4e2' },
    { rank: 'DIAMOND', minRP: 300, maxRP: 400, icon: 'fa-gem', color: '#b9f2ff' },
    { rank: 'HEROIC', minRP: 400, maxRP: 500, icon: 'fa-star', color: '#ff69b4' },
    { rank: 'MASTER', minRP: 500, maxRP: 600, icon: 'fa-crown', color: '#9370db' },
    { rank: 'GRANDMASTER', minRP: 600, maxRP: 700, icon: 'fa-crown', color: '#ff4500' },
    { rank: 'ULTRAGRANDMASTER', minRP: 700, maxRP: 800, icon: 'fa-crown', color: '#ff0000' }
];

// Bundle items
const bundleItems = [
    { id: 1, name: 'Pulse Rifle', type: 'weapons', rarity: 'common', image: '🔫', cost: 19 },
    { id: 2, name: 'Plasma Cannon', type: 'weapons', rarity: 'rare', image: '🔫', cost: 19 },
    { id: 3, name: 'Nova Blaster', type: 'weapons', rarity: 'epic', image: '🔫', cost: 19 },
    { id: 4, name: 'Void Cannon', type: 'weapons', rarity: 'legendary', image: '🔫', cost: 19 },
    { id: 5, name: 'Cyber Skin', type: 'skins', rarity: 'rare', image: '👕', cost: 19 },
    { id: 6, name: 'Phantom Skin', type: 'skins', rarity: 'epic', image: '👕', cost: 19 },
    { id: 7, name: 'Legendary Skin', type: 'skins', rarity: 'legendary', image: '👑', cost: 19 },
    { id: 8, name: 'Dragon Charm', type: 'charms', rarity: 'epic', image: '🐉', cost: 19 },
    { id: 9, name: 'Skull Charm', type: 'charms', rarity: 'rare', image: '💀', cost: 19 },
    { id: 10, name: 'Neon Effect', type: 'effects', rarity: 'epic', image: '✨', cost: 19 }
];

// DOM Elements
const loginScreen = document.getElementById('loginScreen');
const gameUI = document.getElementById('gameUI');
const fbLogin = document.getElementById('fbLogin');
const googleLogin = document.getElementById('googleLogin');
const xLogin = document.getElementById('xLogin');
const guestLogin = document.getElementById('guestLogin');
const menuToggle = document.getElementById('menuToggle');
const mainMenu = document.getElementById('mainMenu');
const closeMenu = document.getElementById('closeMenu');
const profileBtn = document.getElementById('profileBtn');
const profilePanel = document.getElementById('profilePanel');
const topUpBtn = document.getElementById('topUpBtn');
const topUpModal = document.getElementById('topUpModal');
const modalClose = document.querySelector('.modal-close');
const editNameBtn = document.getElementById('editNameBtn');
const editNameModal = document.getElementById('editNameModal');
const cancelNameBtn = document.getElementById('cancelNameBtn');
const confirmNameBtn = document.getElementById('confirmNameBtn');
const newNameInput = document.getElementById('newNameInput');
const nameCostValue = document.getElementById('nameCostValue');
const nameChangeInfo = document.getElementById('nameChangeInfo');
const spin1x = document.getElementById('spin1x');
const spin10x = document.getElementById('spin10x');
const bundleGrid = document.getElementById('bundleGrid');
const spinHistory = document.getElementById('spinHistory');
const toast = document.getElementById('notificationToast');
const toastMessage = document.getElementById('toastMessage');
const closePanels = document.querySelectorAll('.close-panel');
const paymentMethods = document.querySelectorAll('.payment-method');
const bundlePreview = document.getElementById('bundlePreview');
const closePreview = document.getElementById('closePreview');

// Initialize game
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();
    setupEventListeners();
    updateUI();
    renderBundleGrid();
});

// Load user data from localStorage
function loadUserData() {
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
        currentUser = JSON.parse(savedUser);
    }
}

// Save user data
function saveUserData() {
    if (currentUser) {
        players[currentUser.id] = currentUser;
        localStorage.setItem('players', JSON.stringify(players));
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
    }
}

// Setup event listeners
function setupEventListeners() {
    // Login buttons
    fbLogin.addEventListener('click', () => socialLogin('facebook'));
    googleLogin.addEventListener('click', () => socialLogin('google'));
    xLogin.addEventListener('click', () => socialLogin('x'));
    guestLogin.addEventListener('click', () => socialLogin('guest'));

    // Menu toggle
    menuToggle.addEventListener('click', () => {
        mainMenu.classList.toggle('active');
    });

    closeMenu.addEventListener('click', () => {
        mainMenu.classList.remove('active');
    });

    // Profile button
    profileBtn.addEventListener('click', () => {
        profilePanel.classList.remove('hidden');
        updateProfilePanel();
    });

    // Top up button
    topUpBtn.addEventListener('click', () => {
        topUpModal.classList.remove('hidden');
    });

    if (modalClose) {
        modalClose.addEventListener('click', () => {
            topUpModal.classList.add('hidden');
        });
    }

    // Close panels
    closePanels.forEach(btn => {
        btn.addEventListener('click', () => {
            const panel = btn.closest('.side-panel');
            if (panel) panel.classList.add('hidden');
        });
    });

    // Edit name
    if (editNameBtn) {
        editNameBtn.addEventListener('click', () => {
            showEditNameModal();
        });
    }

    if (cancelNameBtn) {
        cancelNameBtn.addEventListener('click', () => {
            editNameModal.classList.add('hidden');
        });
    }

    if (confirmNameBtn) {
        confirmNameBtn.addEventListener('click', () => {
            changeUsername();
        });
    }

    // Spin buttons
    if (spin1x) {
        spin1x.addEventListener('click', () => spin(1));
    }

    if (spin10x) {
        spin10x.addEventListener('click', () => spin(10));
    }

    // Payment methods
    paymentMethods.forEach(method => {
        method.addEventListener('click', () => {
            paymentMethods.forEach(m => m.classList.remove('active'));
            method.classList.add('active');
        });
    });

    // Bundle preview close
    if (closePreview) {
        closePreview.addEventListener('click', () => {
            bundlePreview.classList.add('hidden');
        });
    }

    // Menu items
    document.querySelectorAll('.menu-item').forEach(item => {
        item.addEventListener('click', (e) => {
            const menu = e.currentTarget.dataset.menu;
            handleMenuClick(menu);
        });
    });
}

// Social login
function socialLogin(method) {
    let userData;
    
    if (method === 'guest') {
        userData = {
            ...defaultPlayer,
            id: 'guest_' + Math.random().toString(36).substr(2, 9),
            name: 'Guest_' + Math.floor(Math.random() * 10000)
        };
    } else {
        // Simulate social login
        userData = {
            ...defaultPlayer,
            id: method + '_' + Math.random().toString(36).substr(2, 9),
            name: method.charAt(0).toUpperCase() + method.slice(1) + 'User_' + Math.floor(Math.random() * 1000),
            loginMethod: method
        };
    }
    
    currentUser = userData;
    saveUserData();
    
    // Show game UI
    loginScreen.classList.remove('active');
    gameUI.classList.remove('hidden');
    
    showToast(`Welcome, ${currentUser.name}!`);
    updateUI();
}

// Show edit name modal
function showEditNameModal() {
    if (!currentUser) return;
    
    const nameChanges = currentUser.nameChanges || 0;
    const cost = nameChanges === 0 ? 0 : 200;
    
    nameCostValue.textContent = cost;
    nameChangeInfo.textContent = nameChanges === 0 ? 
        'First name change is FREE!' : 
        `Name changes: ${nameChanges} (Cost: 200 diamonds)`;
    
    newNameInput.value = currentUser.name;
    editNameModal.classList.remove('hidden');
}

// Change username
function changeUsername() {
    if (!currentUser) return;
    
    const newName = newNameInput.value.trim();
    if (!newName || newName.length < 3 || newName.length > 20) {
        showToast('Username must be 3-20 characters');
        return;
    }
    
    const nameChanges = currentUser.nameChanges || 0;
    const cost = nameChanges === 0 ? 0 : 200;
    
    if (cost > 0 && (currentUser.diamonds || 0) < cost) {
        showToast('Not enough diamonds!');
        return;
    }
    
    // Deduct diamonds if needed
    if (cost > 0) {
        currentUser.diamonds -= cost;
    }
    
    // Update name
    currentUser.name = newName;
    currentUser.nameChanges = (currentUser.nameChanges || 0) + 1;
    
    saveUserData();
    updateUI();
    updateProfilePanel();
    
    editNameModal.classList.add('hidden');
    showToast('Username changed successfully!');
}

// Spin function
function spin(count) {
    if (!currentUser) return;
    
    const cost = count === 1 ? 19 : 180;
    
    if ((currentUser.crystals || 0) < cost) {
        showToast('Not enough crystals!');
        return;
    }
    
    currentUser.crystals -= cost;
    
    // Perform spins
    for (let i = 0; i < count; i++) {
        performSingleSpin();
    }
    
    saveUserData();
    updateUI();
    renderSpinHistory();
}

// Perform single spin
function performSingleSpin() {
    // Random bundle item with rarity chances
    const rarityRand = Math.random();
    let possibleItems;
    
    if (rarityRand < 0.5) { // 50% common
        possibleItems = bundleItems.filter(item => item.rarity === 'common');
    } else if (rarityRand < 0.8) { // 30% rare
        possibleItems = bundleItems.filter(item => item.rarity === 'rare');
    } else if (rarityRand < 0.95) { // 15% epic
        possibleItems = bundleItems.filter(item => item.rarity === 'epic');
    } else { // 5% legendary
        possibleItems = bundleItems.filter(item => item.rarity === 'legendary');
    }
    
    if (possibleItems.length === 0) {
        possibleItems = bundleItems;
    }
    
    const item = possibleItems[Math.floor(Math.random() * possibleItems.length)];
    
    // Add to inventory
    if (!currentUser.inventory[item.type].includes(item.name)) {
        currentUser.inventory[item.type].push(item.name);
    }
    
    // Add to history
    const historyItem = {
        item: item.name,
        rarity: item.rarity,
        timestamp: new Date().toLocaleTimeString()
    };
    
    if (!currentUser.spinHistory) currentUser.spinHistory = [];
    currentUser.spinHistory.unshift(historyItem);
    if (currentUser.spinHistory.length > 10) currentUser.spinHistory.pop();
    
    showToast(`Got ${item.name} (${item.rarity})!`);
}

// Render bundle grid
function renderBundleGrid(category = 'all') {
    if (!bundleGrid) return;
    
    const filtered = category === 'all' ? 
        bundleItems : 
        bundleItems.filter(item => item.type === category);
    
    bundleGrid.innerHTML = filtered.map(item => `
        <div class="bundle-item" data-id="${item.id}">
            <div class="bundle-rarity ${item.rarity}">${item.rarity}</div>
            <div class="bundle-icon">${item.image}</div>
            <div class="bundle-name">${item.name}</div>
            <div class="bundle-cost"><i class="fas fa-gem"></i> ${item.cost}</div>
        </div>
    `).join('');
    
    // Add click handlers
    document.querySelectorAll('.bundle-item').forEach(item => {
        item.addEventListener('click', () => {
            const id = parseInt(item.dataset.id);
            const bundle = bundleItems.find(b => b.id === id);
            if (bundle) showBundlePreview(bundle);
        });
    });
}

// Show bundle preview
function showBundlePreview(bundle) {
    document.getElementById('previewTitle').textContent = bundle.name;
    document.getElementById('previewImage').innerHTML = `<div style="font-size: 80px;">${bundle.image}</div>`;
    document.getElementById('previewDescription').textContent = `A ${bundle.rarity} ${bundle.type} item`;
    document.getElementById('previewRarity').innerHTML = `<span class="bundle-rarity ${bundle.rarity}">${bundle.rarity}</span>`;
    bundlePreview.classList.remove('hidden');
}

// Render spin history
function renderSpinHistory() {
    if (!spinHistory || !currentUser || !currentUser.spinHistory) return;
    
    spinHistory.innerHTML = currentUser.spinHistory.map(item => `
        <div class="history-item">
            <span class="bundle-rarity ${item.rarity}">●</span>
            <span>${item.item}</span>
            <span style="margin-left: auto; font-size: 10px;">${item.timestamp}</span>
        </div>
    `).join('');
}

// Handle menu click
function handleMenuClick(menu) {
    mainMenu.classList.remove('active');
    
    switch(menu) {
        case 'ranked':
            document.getElementById('rankedPanel').classList.remove('hidden');
            break;
        case 'spin':
            document.getElementById('spinPanel').classList.remove('hidden');
            renderSpinHistory();
            break;
        case 'profile':
            profilePanel.classList.remove('hidden');
            updateProfilePanel();
            break;
    }
}

// Update profile panel
function updateProfilePanel() {
    if (!currentUser) return;
    
    document.getElementById('profileDisplayName').textContent = currentUser.name;
    document.getElementById('profileRank').textContent = `${currentUser.rank} ${currentUser.division}`;
    document.getElementById('profileLevel').textContent = currentUser.level;
    document.getElementById('profileXP').textContent = currentUser.xp;
    document.getElementById('profileWins').textContent = currentUser.stats.wins;
    document.getElementById('profileKills').textContent = currentUser.stats.kills;
    document.getElementById('profileJoinDate').textContent = currentUser.joinDate;
    document.getElementById('nameChangeCount').textContent = currentUser.nameChanges || 0;
    
    const winRate = currentUser.stats.matches > 0 
        ? Math.round((currentUser.stats.wins / currentUser.stats.matches) * 100) 
        : 0;
    document.getElementById('profileWinRate').textContent = winRate + '%';
}

// Update UI
function updateUI() {
    if (!currentUser) return;
    
    // Update top bar
    document.getElementById('playerLevel').textContent = currentUser.level;
    document.getElementById('levelXp').textContent = `${currentUser.xp}/${currentUser.xpToNextLevel} XP`;
    document.getElementById('levelProgress').style.width = (currentUser.xp / currentUser.xpToNextLevel * 100) + '%';
    
    document.getElementById('currentRank').textContent = currentUser.rank;
    document.getElementById('currentDivision').textContent = currentUser.division;
    
    document.getElementById('sidebarName').textContent = currentUser.name;
    document.getElementById('sidebarRank').textContent = `${currentUser.rank} ${currentUser.division}`;
    
    document.getElementById('goldAmount').textContent = currentUser.gold || 0;
    document.getElementById('diamondAmount').textContent = currentUser.diamonds || 0;
    document.getElementById('crystalBalance').textContent = currentUser.crystals || 0;
    
    // Update rank progress
    const rankIndex = rankThresholds.findIndex(r => r.rank === currentUser.rank);
    const currentRank = rankThresholds[rankIndex];
    const progress = (currentUser.rankPoints - currentRank.minRP) / (currentRank.maxRP - currentRank.minRP) * 100;
    document.getElementById('rankProgressFill').style.width = progress + '%';
    document.getElementById('currentRP').textContent = currentUser.rankPoints;
    document.getElementById('maxRP').textContent = currentRank.maxRP;
}

// Show toast notification
function showToast(message) {
    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 3000);
}

// Category filter for bundles
document.querySelectorAll('.bundle-cat').forEach(cat => {
    cat.addEventListener('click', () => {
        document.querySelectorAll('.bundle-cat').forEach(c => c.classList.remove('active'));
        cat.classList.add('active');
        renderBundleGrid(cat.dataset.cat);
    });
});

// Buy package buttons
document.querySelectorAll('.buy-package').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const packageItem = e.target.closest('.package-item');
        const crystals = parseInt(packageItem.dataset.crystals);
        const price = packageItem.dataset.price;
        
        if (currentUser) {
            currentUser.crystals = (currentUser.crystals || 0) + crystals;
            saveUserData();
            updateUI();
            showToast(`Added ${crystals} crystals!`);
            topUpModal.classList.add('hidden');
        }
    });
});

// Play ranked button
const playRankedBtn = document.getElementById('playRankedBtn');
if (playRankedBtn) {
    playRankedBtn.addEventListener('click', () => {
        if (!currentUser) return;
        
        // Simulate ranked match
        const won = Math.random() > 0.5;
        const rpChange = won ? 20 : -10;
        
        currentUser.rankPoints = Math.max(0, (currentUser.rankPoints || 0) + rpChange);
        currentUser.stats.matches++;
        
        if (won) {
            currentUser.stats.wins++;
            showToast('Victory! +20 RP');
        } else {
            currentUser.stats.losses++;
            showToast('Defeat! -10 RP');
        }
        
        // Check for rank up/down
        updateRank();
        
        // Give XP
        const xpGain = won ? 100 : 50;
        currentUser.xp = (currentUser.xp || 0) + xpGain;
        
        // Check level up
        while (currentUser.xp >= currentUser.xpToNextLevel && currentUser.level < 100) {
            currentUser.xp -= currentUser.xpToNextLevel;
            currentUser.level++;
            currentUser.xpToNextLevel = Math.floor(currentUser.xpToNextLevel * 1.2);
            showToast(`Level Up! Now level ${currentUser.level}`);
        }
        
        saveUserData();
        updateUI();
        updateProfilePanel();
    });
}

// Update rank based on RP
function updateRank() {
    if (!currentUser) return;
    
    for (let i = 0; i < rankThresholds.length; i++) {
        if (currentUser.rankPoints >= rankThresholds[i].minRP && 
            currentUser.rankPoints < rankThresholds[i].maxRP) {
            
            if (currentUser.rank !== rankThresholds[i].rank) {
                currentUser.rank = rankThresholds[i].rank;
                currentUser.division = 'III';
                showToast(`Rank Up! Now ${currentUser.rank}`);
            }
            
            // Update division
            const progress = currentUser.rankPoints - rankThresholds[i].minRP;
            const divisionSize = (rankThresholds[i].maxRP - rankThresholds[i].minRP) / 3;
            
            if (progress >= divisionSize * 2) {
                currentUser.division = 'I';
            } else if (progress >= divisionSize) {
                currentUser.division = 'II';
            } else {
                currentUser.division = 'III';
            }
            
            break;
        }
    }
}
