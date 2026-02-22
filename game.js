// Game State
let currentUser = null;
let players = JSON.parse(localStorage.getItem('players')) || {};

// Game variables
let canvas, ctx;
let gameRunning = false;
let gamePaused = false;
let animationId;
let lastTime = 0;
let score = 0;
let wave = 1;
let enemiesKilled = 0;

// Player ship
let player = {
    x: 0,
    y: 0,
    width: 40,
    height: 40,
    speed: 5,
    health: 100,
    maxHealth: 100,
    shield: 3,
    invulnerable: false,
    invulnerableTime: 0
};

// Bullets
let bullets = [];
let enemyBullets = [];
const bulletSpeed = 7;
const bulletCooldown = 10;
let bulletTimer = 0;

// Enemies
let enemies = [];
let enemySpawnTimer = 0;
const enemySpawnDelay = 60; // frames

// Power ups
let powerups = [];
let powerupTimer = 0;

// Particles
let particles = [];
let particleTimer = 0;

// Controls
let keys = {
    left: false,
    right: false,
    space: false
};

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
    { id: 1, name: 'Pulse Rifle', type: 'weapons', rarity: 'common', image: '🔫', cost: 19, damage: 10 },
    { id: 2, name: 'Plasma Cannon', type: 'weapons', rarity: 'rare', image: '🔫', cost: 19, damage: 15 },
    { id: 3, name: 'Nova Blaster', type: 'weapons', rarity: 'epic', image: '🔫', cost: 19, damage: 20 },
    { id: 4, name: 'Void Cannon', type: 'weapons', rarity: 'legendary', image: '🔫', cost: 19, damage: 30 },
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
    canvas = document.getElementById('gameCanvas');
    ctx = canvas.getContext('2d');
    
    loadUserData();
    setupEventListeners();
    updateUI();
    renderBundleGrid();
    
    // Set canvas size
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);
    
    // Initialize player position
    resetGame();
});

// Reset game
function resetGame() {
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 100;
    player.health = player.maxHealth;
    player.shield = 3;
    player.invulnerable = false;
    
    bullets = [];
    enemyBullets = [];
    enemies = [];
    powerups = [];
    particles = [];
    
    score = 0;
    wave = 1;
    enemiesKilled = 0;
    bulletTimer = 0;
    enemySpawnTimer = 0;
    
    updateScore();
    updateHealth();
    updateWave();
}

// Resize canvas
function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    player.x = canvas.width / 2 - player.width / 2;
    player.y = canvas.height - 100;
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

    // Keyboard controls
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
                showToast(gamePaused ? 'Game Paused' : 'Game Resumed');
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

    // Play ranked button
    const playRankedBtn = document.getElementById('playRankedBtn');
    if (playRankedBtn) {
        playRankedBtn.addEventListener('click', () => {
            if (!currentUser) return;
            
            // Close all panels
            document.querySelectorAll('.side-panel').forEach(p => p.classList.add('hidden'));
            mainMenu.classList.remove('active');
            
            // Start game
            startGame();
        });
    }
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

// Start game
function startGame() {
    resetGame();
    gameRunning = true;
    gamePaused = false;
    lastTime = performance.now();
    animationId = requestAnimationFrame(gameLoop);
}

// Game loop
function gameLoop(currentTime) {
    if (!gameRunning) return;
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    if (!gamePaused) {
        update();
    }
    
    render();
    
    animationId = requestAnimationFrame(gameLoop);
}

// Update game
function update() {
    // Move player
    if (keys.left && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys.right && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }
    
    // Shoot bullets
    if (keys.space && bulletTimer <= 0) {
        bullets.push({
            x: player.x + player.width / 2 - 2,
            y: player.y - 10,
            width: 4,
            height: 10,
            speed: bulletSpeed
        });
        bulletTimer = bulletCooldown;
    }
    if (bulletTimer > 0) bulletTimer--;
    
    // Update bullets
    for (let i = bullets.length - 1; i >= 0; i--) {
        bullets[i].y -= bullets[i].speed;
        if (bullets[i].y < 0) {
            bullets.splice(i, 1);
        }
    }
    
    // Update enemy bullets
    for (let i = enemyBullets.length - 1; i >= 0; i--) {
        enemyBullets[i].y += enemyBullets[i].speed;
        if (enemyBullets[i].y > canvas.height) {
            enemyBullets.splice(i, 1);
        }
    }
    
    // Spawn enemies
    if (enemySpawnTimer <= 0) {
        spawnEnemy();
        enemySpawnTimer = enemySpawnDelay - (wave * 2);
        if (enemySpawnTimer < 20) enemySpawnTimer = 20;
    } else {
        enemySpawnTimer--;
    }
    
    // Update enemies
    for (let i = enemies.length - 1; i >= 0; i--) {
        const enemy = enemies[i];
        enemy.y += enemy.speed;
        
        // Enemy shoots
        if (Math.random() < 0.02) {
            enemyBullets.push({
                x: enemy.x + enemy.width / 2 - 2,
                y: enemy.y + enemy.height,
                width: 4,
                height: 10,
                speed: 4
            });
        }
        
        // Check collision with player bullets
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            if (bullet.x < enemy.x + enemy.width &&
                bullet.x + bullet.width > enemy.x &&
                bullet.y < enemy.y + enemy.height &&
                bullet.y + bullet.height > enemy.y) {
                
                // Hit enemy
                bullets.splice(j, 1);
                enemies.splice(i, 1);
                score += 10;
                enemiesKilled++;
                
                // Add XP
                if (currentUser) {
                    currentUser.stats.kills++;
                    currentUser.xp += 10;
                    
                    // Level up
                    while (currentUser.xp >= currentUser.xpToNextLevel && currentUser.level < 100) {
                        currentUser.xp -= currentUser.xpToNextLevel;
                        currentUser.level++;
                        currentUser.xpToNextLevel = Math.floor(currentUser.xpToNextLevel * 1.2);
                        showToast(`Level Up! Now level ${currentUser.level}`);
                    }
                    
                    saveUserData();
                    updateUI();
                }
                
                // Create explosion particles
                createExplosion(enemy.x + enemy.width/2, enemy.y + enemy.height/2);
                
                // Chance to spawn powerup
                if (Math.random() < 0.1) {
                    spawnPowerup(enemy.x, enemy.y);
                }
                
                updateScore();
                break;
            }
        }
        
        // Check if enemy passed the bottom
        if (enemy.y > canvas.height) {
            enemies.splice(i, 1);
            player.health -= 10;
            updateHealth();
            
            if (player.health <= 0) {
                gameOver();
            }
        }
    }
    
    // Update powerups
    for (let i = powerups.length - 1; i >= 0; i--) {
        const powerup = powerups[i];
        powerup.y += 2;
        
        // Check collision with player
        if (player.x < powerup.x + powerup.width &&
            player.x + player.width > powerup.x &&
            player.y < powerup.y + powerup.height &&
            player.y + player.height > powerup.y) {
            
            applyPowerup(powerup.type);
            powerups.splice(i, 1);
        }
        
        // Remove if off screen
        if (powerup.y > canvas.height) {
            powerups.splice(i, 1);
        }
    }
    
    // Update particles
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].x += particles[i].vx;
        particles[i].y += particles[i].vy;
        particles[i].life--;
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
    
    // Check collision with enemy bullets
    if (!player.invulnerable) {
        for (let i = enemyBullets.length - 1; i >= 0; i--) {
            const bullet = enemyBullets[i];
            if (bullet.x < player.x + player.width &&
                bullet.x + bullet.width > player.x &&
                bullet.y < player.y + player.height &&
                bullet.y + bullet.height > player.y) {
                
                enemyBullets.splice(i, 1);
                
                if (player.shield > 0) {
                    player.shield--;
                    player.invulnerable = true;
                    player.invulnerableTime = 60; // 1 second at 60fps
                } else {
                    player.health -= 10;
                }
                
                updateHealth();
                updateShield();
                
                if (player.health <= 0) {
                    gameOver();
                }
            }
        }
    }
    
    // Update invulnerability
    if (player.invulnerable) {
        player.invulnerableTime--;
        if (player.invulnerableTime <= 0) {
            player.invulnerable = false;
        }
    }
    
    // Check wave completion
    if (enemiesKilled >= wave * 10) {
        wave++;
        enemiesKilled = 0;
        updateWave();
        showToast(`Wave ${wave} Started!`);
        
        // Give reward
        if (currentUser) {
            currentUser.gold += wave * 50;
            saveUserData();
            updateUI();
        }
    }
}

// Render game
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw stars background
    drawStars();
    
    // Draw player
    drawPlayer();
    
    // Draw bullets
    ctx.fillStyle = '#ffff00';
    bullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Draw enemy bullets
    ctx.fillStyle = '#ff4444';
    enemyBullets.forEach(bullet => {
        ctx.fillRect(bullet.x, bullet.y, bullet.width, bullet.height);
    });
    
    // Draw enemies
    enemies.forEach(enemy => {
        // Enemy body
        ctx.fillStyle = enemy.color;
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        
        // Enemy eyes
        ctx.fillStyle = '#fff';
        ctx.fillRect(enemy.x + 5, enemy.y + 5, 5, 5);
        ctx.fillRect(enemy.x + enemy.width - 10, enemy.y + 5, 5, 5);
    });
    
    // Draw powerups
    powerups.forEach(powerup => {
        ctx.fillStyle = powerup.color;
        ctx.beginPath();
        ctx.arc(powerup.x + powerup.width/2, powerup.y + powerup.height/2, powerup.width/2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(powerup.symbol, powerup.x + powerup.width/2, powerup.y + powerup.height/2 + 4);
    });
    
    // Draw particles
    particles.forEach(p => {
        ctx.fillStyle = `rgba(255, ${p.color}, 0, ${p.life / 20})`;
        ctx.fillRect(p.x, p.y, 3, 3);
    });
    
    // Draw UI
    drawGameUI();
}

// Draw stars background
function drawStars() {
    if (!window.stars) {
        window.stars = [];
        for (let i = 0; i < 100; i++) {
            stars.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                size: Math.random() * 2 + 1,
                speed: Math.random() * 2 + 0.5
            });
        }
    }
    
    ctx.fillStyle = '#fff';
    stars.forEach(star => {
        ctx.fillRect(star.x, star.y, star.size, star.size);
        star.y += star.speed;
        if (star.y > canvas.height) {
            star.y = 0;
            star.x = Math.random() * canvas.width;
        }
    });
}

// Draw player
function drawPlayer() {
    // Flash if invulnerable
    if (player.invulnerable && Math.floor(Date.now() / 200) % 2 === 0) {
        ctx.fillStyle = '#fff';
    } else {
        ctx.fillStyle = '#4AE5FF';
    }
    
    // Player body
    ctx.fillRect(player.x, player.y, player.width, player.height);
    
    // Wings
    ctx.fillStyle = '#2979ff';
    ctx.fillRect(player.x - 10, player.y + 10, 10, 20);
    ctx.fillRect(player.x + player.width, player.y + 10, 10, 20);
    
    // Cockpit
    ctx.fillStyle = '#fff';
    ctx.fillRect(player.x + 10, player.y - 5, 20, 5);
}

// Draw game UI
function drawGameUI() {
    ctx.fillStyle = '#fff';
    ctx.font = '20px Arial';
    ctx.textAlign = 'left';
    ctx.fillText(`Score: ${score}`, 10, 30);
    
    ctx.textAlign = 'right';
    ctx.fillText(`Wave: ${wave}`, canvas.width - 10, 30);
    
    // Health bar
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(10, 50, player.health * 2, 10);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(10, 50, player.maxHealth * 2, 10);
    
    // Shield indicator
    for (let i = 0; i < player.shield; i++) {
        ctx.fillStyle = '#4AE5FF';
        ctx.beginPath();
        ctx.arc(10 + i * 25, 70, 8, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Spawn enemy
function spawnEnemy() {
    const enemy = {
        x: Math.random() * (canvas.width - 30),
        y: -30,
        width: 30,
        height: 30,
        speed: 1 + (wave * 0.2),
        color: wave % 2 === 0 ? '#ff4444' : '#ffaa00'
    };
    enemies.push(enemy);
}

// Spawn powerup
function spawnPowerup(x, y) {
    const types = ['health', 'shield', 'rapidfire'];
    const type = types[Math.floor(Math.random() * types.length)];
    
    let powerup = {
        x: x,
        y: y,
        width: 20,
        height: 20,
        type: type
    };
    
    switch(type) {
        case 'health':
            powerup.color = '#ff4444';
            powerup.symbol = '+';
            break;
        case 'shield':
            powerup.color = '#4AE5FF';
            powerup.symbol = 'S';
            break;
        case 'rapidfire':
            powerup.color = '#ffff00';
            powerup.symbol = 'R';
            break;
    }
    
    powerups.push(powerup);
}

// Apply powerup
function applyPowerup(type) {
    switch(type) {
        case 'health':
            player.health = Math.min(player.health + 20, player.maxHealth);
            showToast('Health +20');
            break;
        case 'shield':
            player.shield = Math.min(player.shield + 1, 5);
            showToast('Shield +1');
            break;
        case 'rapidfire':
            bulletCooldown = 5;
            setTimeout(() => {
                bulletCooldown = 10;
            }, 5000);
            showToast('Rapid Fire!');
            break;
    }
    
    updateHealth();
    updateShield();
}

// Create explosion particles
function createExplosion(x, y) {
    for (let i = 0; i < 10; i++) {
        particles.push({
            x: x,
            y: y,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            color: Math.random() * 255,
            life: 20
        });
    }
}

// Game over
function gameOver() {
    gameRunning = false;
    cancelAnimationFrame(animationId);
    
    showToast(`Game Over! Score: ${score}`);
    
    // Update stats
    if (currentUser) {
        currentUser.stats.matches++;
        if (score > 1000) currentUser.stats.wins++;
        else currentUser.stats.losses++;
        
        // Add rank points
        if (score > 500) {
            currentUser.rankPoints += 10;
            updateRank();
        }
        
        saveUserData();
        updateUI();
    }
    
    // Show game over screen (you can add this)
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
    if (rankIndex >= 0) {
        const currentRank = rankThresholds[rankIndex];
        const progress = (currentUser.rankPoints - currentRank.minRP) / (currentRank.maxRP - currentRank.minRP) * 100;
        document.getElementById('rankProgressFill').style.width = progress + '%';
        document.getElementById('currentRP').textContent = currentUser.rankPoints;
        document.getElementById('maxRP').textContent = currentRank.maxRP;
    }
}

// Update score display
function updateScore() {
    document.getElementById('playerScore').textContent = score;
}

// Update health display
function updateHealth() {
    const healthPercent = (player.health / player.maxHealth) * 100;
    document.getElementById('healthFill').style.width = healthPercent + '%';
}

// Update shield display
function updateShield() {
    document.getElementById('shieldCounter').innerHTML = `🛡️ ${player.shield}`;
}

// Update wave display
function updateWave() {
    document.getElementById('wave').innerHTML = `WAVE <span>${wave}</span>`;
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
