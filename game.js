// ==================== GAME STATE ====================
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let animationId;
let currentUser = null;
let players = {};

// Player ship
let player = {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    speed: 5,
    health: 100,
    maxHealth: 100,
    shield: 3
};

// Game objects
let bullets = [];
let enemies = [];
let enemyBullets = [];
let powerups = [];
let particles = [];

// Timers
let bulletTimer = 0;
let enemySpawnTimer = 0;
let invulnerableTimer = 0;

// Game stats
let score = 0;
let wave = 1;
let enemiesKilled = 0;

// Controls
let keys = {
    left: false,
    right: false,
    space: false
};

// ==================== RANK DATA ====================
const ranks = [
    { name: 'Bronze', division: ['III', 'II', 'I'], minRP: 0, icon: '🥉' },
    { name: 'Gold', division: ['III', 'II', 'I'], minRP: 100, icon: '🥈' },
    { name: 'Platinum', division: ['III', 'II', 'I'], minRP: 200, icon: '🔷' },
    { name: 'Diamond', division: ['III', 'II', 'I'], minRP: 300, icon: '💎' },
    { name: 'Heroic', division: ['III', 'II', 'I'], minRP: 400, icon: '⭐' },
    { name: 'Master', division: ['III', 'II', 'I'], minRP: 500, icon: '👑' },
    { name: 'Grand Master', division: ['III', 'II', 'I'], minRP: 600, icon: '🔥' },
    { name: 'Ultra Grand Master', division: ['III', 'II', 'I'], minRP: 700, icon: '✨' }
];

// ==================== BUNDLE ITEMS ====================
const bundleItems = [
    { id: 1, name: 'Pulse Rifle', type: 'weapon', rarity: 'common', icon: '🔫' },
    { id: 2, name: 'Plasma Cannon', type: 'weapon', rarity: 'rare', icon: '🔫' },
    { id: 3, name: 'Nova Blaster', type: 'weapon', rarity: 'epic', icon: '🔫' },
    { id: 4, name: 'Void Cannon', type: 'weapon', rarity: 'legendary', icon: '🔫' },
    { id: 5, name: 'Cyber Skin', type: 'skin', rarity: 'rare', icon: '👕' },
    { id: 6, name: 'Phantom Skin', type: 'skin', rarity: 'epic', icon: '👕' },
    { id: 7, name: 'Dragon Skin', type: 'skin', rarity: 'legendary', icon: '👑' },
    { id: 8, name: 'Shield Boost', type: 'powerup', rarity: 'rare', icon: '🛡️' },
    { id: 9, name: 'Rapid Fire', type: 'powerup', rarity: 'epic', icon: '⚡' },
    { id: 10, name: 'Double Score', type: 'powerup', rarity: 'legendary', icon: '💯' }
];

// ==================== DEFAULT PLAYER ====================
const defaultPlayer = {
    id: 'guest_' + Math.random().toString(36).substr(2, 9),
    name: 'Guest_' + Math.floor(Math.random() * 10000),
    loginMethod: 'guest',
    level: 1,
    xp: 0,
    xpToNextLevel: 1000,
    rank: 'Bronze',
    division: 'III',
    rankPoints: 0,
    gold: 1000,
    diamonds: 500,
    crystals: 200,
    nameChanges: 0,
    stats: {
        kills: 0,
        deaths: 0,
        wins: 0,
        matches: 0
    },
    inventory: [],
    spinHistory: [],
    joinDate: new Date().toLocaleDateString()
};

// ==================== INITIALIZATION ====================
document.addEventListener('DOMContentLoaded', () => {
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    loadUserData();
    setupCanvas();
    setupControls();
    updateUI();
    renderBundleGrid();
    
    window.addEventListener('resize', setupCanvas);
});

function setupCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 100;
}

function setupControls() {
    document.addEventListener('keydown', (e) => {
        if (!gameRunning || gamePaused) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                keys.left = true;
                e.preventDefault();
                break;
            case 'ArrowRight':
                keys.right = true;
                e.preventDefault();
                break;
            case ' ':
                keys.space = true;
                e.preventDefault();
                break;
            case 'p':
            case 'P':
                gamePaused = !gamePaused;
                showNotif(gamePaused ? '⏸️ Paused' : '▶️ Resumed');
                break;
        }
    });

    document.addEventListener('keyup', (e) => {
        switch(e.key) {
            case 'ArrowLeft':
                keys.left = false;
                e.preventDefault();
                break;
            case 'ArrowRight':
                keys.right = false;
                e.preventDefault();
                break;
            case ' ':
                keys.space = false;
                e.preventDefault();
                break;
        }
    });
}

// ==================== LOGIN SYSTEM ====================
function login(method) {
    let userData;
    
    if (method === 'guest') {
        userData = { ...defaultPlayer };
    } else {
        userData = {
            ...defaultPlayer,
            id: method + '_' + Math.random().toString(36).substr(2, 9),
            name: method.charAt(0).toUpperCase() + method.slice(1) + 'User_' + Math.floor(Math.random() * 1000),
            loginMethod: method
        };
    }
    
    currentUser = userData;
    saveUserData();
    
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('gameHUD').classList.remove('hidden');
    
    showNotif(`Selamat datang, ${currentUser.name}!`);
    updateUI();
    resetGame();
    startGame();
}

function logout() {
    currentUser = null;
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('gameHUD').classList.add('hidden');
    document.getElementById('sideMenu').classList.add('hidden');
}

// ==================== GAME FUNCTIONS ====================
function startGame() {
    resetGame();
    gameRunning = true;
    gamePaused = false;
    animationId = requestAnimationFrame(gameLoop);
}

function resetGame() {
    player.health = player.maxHealth;
    player.shield = 3;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 100;
    
    bullets = [];
    enemies = [];
    enemyBullets = [];
    powerups = [];
    particles = [];
    
    score = 0;
    wave = 1;
    enemiesKilled = 0;
    bulletTimer = 0;
    enemySpawnTimer = 0;
    invulnerableTimer = 0;
    
    updateGameUI();
}

function gameLoop() {
    if (!gameRunning) return;
    
    if (!gamePaused) {
        update();
    }
    
    render();
    animationId = requestAnimationFrame(gameLoop);
}

function update() {
    // Move player
    if (keys.left && player.x > 0) player.x -= player.speed;
    if (keys.right && player.x < canvas.width - player.width) player.x += player.speed;
    
    // Shoot
    if (keys.space && bulletTimer <= 0) {
        bullets.push({
            x: player.x + player.width/2 - 2,
            y: player.y - 10,
            w: 4,
            h: 10,
            speed: 8
        });
        bulletTimer = 10;
    }
    if (bulletTimer > 0) bulletTimer--;
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) bullets.splice(i, 1);
    }
    
    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += 4;
        if (enemyBullets[i].y > canvas.height) enemyBullets.splice(i, 1);
    }
    
    // Spawn enemies
    if (enemySpawnTimer <= 0) {
        enemies.push({
            x: Math.random() * (canvas.width - 30),
            y: -30,
            w: 30,
            h: 30,
            speed: 1 + wave * 0.2,
            color: wave % 2 === 0 ? '#ff4444' : '#ffaa00'
        });
        enemySpawnTimer = Math.max(60 - wave * 2, 20);
    } else {
        enemySpawnTimer--;
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        
        // Enemy shoot
        if (Math.random() < 0.02) {
            enemyBullets.push({
                x: enemy.x + enemy.w/2 - 2,
                y: enemy.y + enemy.h,
                w: 4,
                h: 10
            });
        }
        
        // Bullet collision
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            if (bullet.x < enemy.x + enemy.w &&
                bullet.x + bullet.w > enemy.x &&
                bullet.y < enemy.y + enemy.h &&
                bullet.y + bullet.h > enemy.y) {
                
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                score += 10;
                enemiesKilled++;
                
                // Add XP and stats
                if (currentUser) {
                    currentUser.xp += 5;
                    currentUser.stats.kills++;
                    
                    // Level up
                    while (currentUser.xp >= currentUser.xpToNextLevel && currentUser.level < 100) {
                        currentUser.xp -= currentUser.xpToNextLevel;
                        currentUser.level++;
                        currentUser.xpToNextLevel = Math.floor(currentUser.xpToNextLevel * 1.2);
                        showNotif(`⬆️ Level Up! ${currentUser.level}`);
                    }
                    
                    saveUserData();
                    updateUI();
                }
                
                // Particles
                for (let p = 0; p < 5; p++) {
                    particles.push({
                        x: enemy.x + enemy.w/2,
                        y: enemy.y + enemy.h/2,
                        vx: (Math.random() - 0.5) * 3,
                        vy: (Math.random() - 0.5) * 3,
                        life: 20
                    });
                }
                
                // Powerup chance
                if (Math.random() < 0.1) {
                    powerups.push({
                        x: enemy.x,
                        y: enemy.y,
                        w: 20,
                        h: 20,
                        type: ['health', 'shield', 'rapid'][Math.floor(Math.random() * 3)],
                        color: ['#ff4444', '#4ae5ff', '#ffff00'][Math.floor(Math.random() * 3)]
                    });
                }
                
                break;
            }
        }
        
        // Enemy reaches bottom
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            player.health -= 10;
            if (player.health < 0) player.health = 0;
            updateGameUI();
            
            if (player.health <= 0) gameOver();
        }
    }
    
    // Update powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const p = powerups[i];
        p.y += 2;
        
        // Collision with player
        if (player.x < p.x + p.w &&
            player.x + player.width > p.x &&
            player.y < p.y + p.h &&
            player.y + player.height > p.y) {
            
            if (p.type === 'health') {
                player.health = Math.min(player.health + 20, player.maxHealth);
                showNotif('❤️ Health +20');
            } else if (p.type === 'shield') {
                player.shield++;
                showNotif('🛡️ Shield +1');
            } else if (p.type === 'rapid') {
                bulletTimer = -10; // Rapid fire
                setTimeout(() => { bulletTimer = 0; }, 3000);
                showNotif('⚡ Rapid Fire!');
            }
            
            powerups.splice(i, 1);
            updateGameUI();
        }
        
        if (p.y > canvas.height) powerups.splice(i, 1);
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life--;
        if (particles[i].life <= 0) particles.splice(i, 1);
    }
    
    // Bullet collision with player
    if (invulnerableTimer <= 0) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const bullet = enemyBullets[i];
            if (bullet.x < player.x + player.width &&
                bullet.x + bullet.w > player.x &&
                bullet.y < player.y + player.height &&
                bullet.y + bullet.h > player.y) {
                
                enemyBullets.splice(i, 1);
                
                if (player.shield > 0) {
                    player.shield--;
                    invulnerableTimer = 60;
                    showNotif('🛡️ Shield hit!');
                } else {
                    player.health -= 10;
                    invulnerableTimer = 60;
                }
                
                updateGameUI();
                
                if (player.health <= 0) gameOver();
            }
        }
    } else {
        invulnerableTimer--;
    }
    
    // Wave progression
    if (enemiesKilled >= wave * 10) {
        wave++;
        enemiesKilled = 0;
        showNotif(`🌊 Wave ${wave}!`);
        
        if (currentUser) {
            currentUser.gold += wave * 50;
            saveUserData();
            updateUI();
        }
    }
    
    updateGameUI();
}

function render() {
    // Clear canvas
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Stars
    if (!window.stars) {
        window.stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 1
            });
        }
    }
    
    ctx.fillStyle = '#fff';
    stars.forEach(s => {
        ctx.fillRect(s.x, s.y, s.size, s.size);
        s.y += s.speed;
        if (s.y > canvas.height) {
            s.y = 0;
            s.x = Math.random() * canvas.width;
        }
    });
    
    // Player
    ctx.fillStyle = invulnerableTimer > 0 && Math.floor(Date.now() / 200) % 2 === 0 ? '#aaa' : '#4ae5ff';
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Player wings
    ctx.fillStyle = '#2979ff';
    ctx.fillRect(player.x - 10, player.y + 10, 10, 20);
    ctx.fillRect(player.x + player.width, player.y + 10, 10, 20);
    
    // Player cockpit
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + 10, player.y - 5, 20, 5);
    
    // Bullets
    ctx.fillStyle = '#ffff00';
    bullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    
    // Enemy bullets
    ctx.fillStyle = '#ff4444';
    enemyBullets.forEach(b => ctx.fillRect(b.x, b.y, b.w, b.h));
    
    // Enemies
    enemies.forEach(e => {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.w, e.h);
        
        // Eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(e.x + 5, e.y + 5, 5, 5);
        ctx.fillRect(e.x + e.w - 10, e.y + 5, 5, 5);
    });
    
    // Powerups
    powerups.forEach(p => {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x + p.w/2, p.y + p.h/2, p.w/2, 0, Math.PI*2);
        ctx.fill();
    });
    
    // Particles
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, 100, 0, ${p.life/20})`;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
}

function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    if (currentUser) {
        currentUser.stats.matches++;
        if (score > 500) currentUser.stats.wins++;
        currentUser.stats.deaths++;
        
        // Add rank points
        if (score > 1000) {
            currentUser.rankPoints += 20;
            updateRank();
        } else if (score > 500) {
            currentUser.rankPoints += 10;
            updateRank();
        }
        
        saveUserData();
        updateUI();
    }
    
    showNotif(`💀 Game Over! Score: ${score}`);
    
    setTimeout(() => {
        if (confirm(`Game Over! Score: ${score}\nMain lagi?`)) {
            resetGame();
            startGame();
        }
    }, 1000);
}

// ==================== RANKED FUNCTIONS ====================
function startRanked() {
    if (!currentUser) return;
    
    hidePanel('ranked');
    resetGame();
    startGame();
    
    // Ranked match simulation
    setTimeout(() => {
        if (!gameRunning) return;
        
        const won = Math.random() > 0.5;
        
        if (won) {
            currentUser.rankPoints += 20;
            showNotif('🏆 Victory! +20 RP');
        } else {
            currentUser.rankPoints = Math.max(0, currentUser.rankPoints - 10);
            showNotif('💔 Defeat! -10 RP');
        }
        
        updateRank();
        saveUserData();
        updateUI();
    }, 30000); // 30 detik simulasi match
}

function updateRank() {
    if (!currentUser) return;
    
    for (let i = 0; i < ranks.length; i++) {
        if (currentUser.rankPoints >= ranks[i].minRP) {
            if (i === ranks.length - 1) {
                currentUser.rank = ranks[i].name;
                // Ultra Grand Master division
                const progress = currentUser.rankPoints - ranks[i].minRP;
                if (progress >= 66) currentUser.division = 'I';
                else if (progress >= 33) currentUser.division = 'II';
                else currentUser.division = 'III';
            } else {
                const nextRankRP = ranks[i + 1]?.minRP || ranks[i].minRP + 100;
                const progress = currentUser.rankPoints - ranks[i].minRP;
                const divisionSize = (nextRankRP - ranks[i].minRP) / 3;
                
                currentUser.rank = ranks[i].name;
                if (progress >= divisionSize * 2) currentUser.division = 'I';
                else if (progress >= divisionSize) currentUser.division = 'II';
                else currentUser.division = 'III';
            }
        }
    }
}

// ==================== SPIN FUNCTIONS ====================
function spin(count) {
    if (!currentUser) return;
    
    const cost = count === 1 ? 19 : 180;
    
    if (currentUser.crystals < cost) {
        showNotif('❌ Crystals tidak cukup!');
        return;
    }
    
    currentUser.crystals -= cost;
    
    for (let i = 0; i < count; i++) {
        // Random item
        const rand = Math.random();
        let rarity;
        if (rand < 0.5) rarity = 'common';
        else if (rand < 0.8) rarity = 'rare';
        else if (rand < 0.95) rarity = 'epic';
        else rarity = 'legendary';
        
        const possible = bundleItems.filter(item => item.rarity === rarity);
        const item = possible[Math.floor(Math.random() * possible.length)];
        
        currentUser.inventory.push(item);
        
        // History
        currentUser.spinHistory.unshift({
            item: item.name,
            rarity: item.rarity,
            time: new Date().toLocaleTimeString()
        });
        if (currentUser.spinHistory.length > 10) currentUser.spinHistory.pop();
        
        showNotif(`✨ Dapat: ${item.name} (${item.rarity})`);
    }
    
    saveUserData();
    updateUI();
    renderSpinHistory();
}

function renderBundleGrid() {
    const grid = document.getElementById('bundleGrid');
    if (!grid) return;
    
    grid.innerHTML = bundleItems.map(item => `
        <div class="bundle-item">
            <div>${item.icon}</div>
            <div>${item.name}</div>
            <div style="font-size:10px">${item.rarity}</div>
        </div>
    `).join('');
}

function renderSpinHistory() {
    const history = document.getElementById('spinHistory');
    if (!history || !currentUser) return;
    
    history.innerHTML = (currentUser.spinHistory || []).map(item => `
        <div>${item.time} - ${item.item} (${item.rarity})</div>
    `).join('');
}

// ==================== TOP UP FUNCTIONS ====================
let selectedPayment = 'google';

function selectPayment(method) {
    selectedPayment = method;
    document.querySelectorAll('.payment-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    const qris = document.getElementById('qrisSection');
    if (method === 'qris') {
        qris.classList.remove('hidden');
    } else {
        qris.classList.add('hidden');
    }
}

function buyCrystals(amount) {
    if (selectedPayment === 'qris') {
        showNotif('📱 Scan QRIS untuk membayar');
    } else {
        showNotif(`✅ Pembayaran via ${selectedPayment} berhasil! +${amount} crystals`);
    }
    
    if (currentUser) {
        currentUser.crystals += amount;
        saveUserData();
        updateUI();
    }
}

// ==================== NAME CHANGE ====================
function showChangeName() {
    if (!currentUser) return;
    
    const cost = currentUser.nameChanges === 0 ? 0 : 200;
    document.getElementById('nameCost').innerText = 
        cost === 0 ? 'Gratis (Pertama)' : `Biaya: ${cost} 💎`;
    document.getElementById('nameModal').classList.remove('hidden');
}

function changeName() {
    const newName = document.getElementById('newName').value.trim();
    if (!newName || newName.length < 3 || newName.length > 20) {
        showNotif('Nama harus 3-20 karakter');
        return;
    }
    
    const cost = currentUser.nameChanges === 0 ? 0 : 200;
    
    if (cost > 0 && currentUser.diamonds < cost) {
        showNotif('💎 Diamond tidak cukup!');
        return;
    }
    
    if (cost > 0) currentUser.diamonds -= cost;
    
    currentUser.name = newName;
    currentUser.nameChanges++;
    
    saveUserData();
    updateUI();
    hideModal('nameModal');
    showNotif('✅ Nama berhasil diubah!');
}

// ==================== UI FUNCTIONS ====================
function toggleMenu() {
    document.getElementById('sideMenu').classList.toggle('hidden');
}

function showPanel(panel) {
    document.getElementById('sideMenu').classList.add('hidden');
    document.getElementById(panel + 'Panel').classList.remove('hidden');
}

function hidePanel(panel) {
    document.getElementById(panel + 'Panel').classList.add('hidden');
}

function showModal(modal) {
    document.getElementById(modal).classList.remove('hidden');
}

function hideModal(modal) {
    document.getElementById(modal).classList.add('hidden');
}

function showNotif(msg) {
    const notif = document.getElementById('notification');
    notif.innerText = msg;
    notif.classList.remove('hidden');
    
    setTimeout(() => {
        notif.classList.add('hidden');
    }, 2000);
}

function updateUI() {
    if (!currentUser) return;
    
    document.getElementById('playerName').innerText = currentUser.name;
    document.getElementById('playerRank').innerText = `${currentUser.rank} ${currentUser.division}`;
    document.getElementById('level').innerText = currentUser.level;
    document.getElementById('gold').innerText = currentUser.gold;
    document.getElementById('diamond').innerText = currentUser.diamonds;
    document.getElementById('crystal').innerText = currentUser.crystals;
    
    // Profile
    document.getElementById('profileName').innerText = currentUser.name;
    document.getElementById('profileLevel').innerText = currentUser.level;
    document.getElementById('profileXP').innerText = currentUser.xp;
    document.getElementById('profileXPNext').innerText = currentUser.xpToNextLevel;
    document.getElementById('profileRank').innerText = `${currentUser.rank} ${currentUser.division}`;
    document.getElementById('profileKills').innerText = currentUser.stats.kills;
    document.getElementById('profileWins').innerText = currentUser.stats.wins;
    document.getElementById('profileMatches').innerText = currentUser.stats.matches;
    
    // XP Bar
    const xpPercent = (currentUser.xp / currentUser.xpToNextLevel) * 100;
    document.getElementById('xpFill').style.width = xpPercent + '%';
    
    // Rank
    document.getElementById('rankBadge').innerText = ranks.find(r => r.name === currentUser.rank)?.icon || '🥉';
    document.getElementById('rankName').innerText = `${currentUser.rank} ${currentUser.division}`;
    document.getElementById('rankRP').innerText = currentUser.rankPoints;
    
    // Rank progress
    const currentRankIndex = ranks.findIndex(r => r.name === currentUser.rank);
    const nextRankRP = ranks[currentRankIndex + 1]?.minRP || ranks[currentRankIndex].minRP + 100;
    const progress = ((currentUser.rankPoints - ranks[currentRankIndex].minRP) / 
                     (nextRankRP - ranks[currentRankIndex].minRP)) * 100;
    document.getElementById('rankProgress').style.width = Math.min(progress, 100) + '%';
    
    // Spin
    document.getElementById('crystalSpin').innerText = currentUser.crystals;
}

function updateGameUI() {
    document.getElementById('score').innerText = score;
    document.getElementById('wave').innerText = wave;
    document.getElementById('health').innerText = player.health;
    document.getElementById('shield').innerText = player.shield;
}

// ==================== DATA STORAGE ====================
function loadUserData() {
    const saved = localStorage.getItem('novaStriker_user');
    if (saved) {
        currentUser = JSON.parse(saved);
    }
    
    const savedPlayers = localStorage.getItem('novaStriker_players');
    if (savedPlayers) {
        players = JSON.parse(savedPlayers);
    }
}

function saveUserData() {
    if (currentUser) {
        players[currentUser.id] = currentUser;
        localStorage.setItem('novaStriker_players', JSON.stringify(players));
        localStorage.setItem('novaStriker_user', JSON.stringify(currentUser));
    }
}
