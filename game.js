let player = { x: 192, y: 90, speed: 4, normalSpeed: 4, slowSpeed: 2, hp: 500, maxHp: 500 };
let keys = {};
let bossData = null;
let projectiles = []; 
let attackInterval = null;
let waveTimer = null;
let isPlayerTurn = false;

const soul = document.getElementById('player-soul');
const battleBox = document.getElementById('battle-box');
const speechBubble = document.getElementById('speech-bubble');
const hpBar = document.getElementById('hp-bar');
const hpText = document.getElementById('hp-text');
const menu = document.getElementById('undertale-menu');

fetch('Xizy.json')
    .then(response => response.json())
    .then(data => {
        bossData = data;
        initGame();
    });

function initGame() {
    player.maxHp = bossData.dfg4554fg22.aaabgfb;
    player.hp = player.maxHp;
    updateHPUI();
    
    window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

    gameLoop();
    startDialogueRoutine();
    startBossTurn(); 
}

function startBossTurn() {
    isPlayerTurn = false;
    menu.classList.add('hidden');
    soul.style.display = 'block';
    
    attackInterval = setInterval(() => {
        let types = ['bone', 'blaster', 'spear'];
        let randomType = types[Math.floor(Math.random() * types.length)];
        createProjectile(randomType);
    }, 800); 

    waveTimer = setTimeout(() => {
        endBossTurn();
    }, 20000); 
}

function endBossTurn() {
    clearInterval(attackInterval);
    clearTimeout(waveTimer);
    projectiles.forEach(p => p.element.remove());
    projectiles = [];
    
    isPlayerTurn = true;
    soul.style.display = 'none';
    menu.classList.remove('hidden');
    speechBubble.innerText = "Sıra sende, ne yapacaksın?";
}

document.getElementById('btn-fight').addEventListener('click', () => {
    if(!isPlayerTurn) return;
    speechBubble.innerText = "Xizy'ye saldırdın! 150 Hasar verildi!";
    setTimeout(() => { startBossTurn(); }, 2000);
});

document.getElementById('btn-heal').addEventListener('click', () => {
    if(!isPlayerTurn) return;
    player.hp += 150;
    if (player.hp > player.maxHp) player.hp = player.maxHp;
    updateHPUI();
    speechBubble.innerText = "150 HP Yenilendi! Kendini kararlı hissediyorsun.";
    setTimeout(() => { startBossTurn(); }, 2000);
});

function createProjectile(type) {
    const projectile = document.createElement('div');
    projectile.classList.add('projectile', type);
    
    let pX, pY, speedX, speedY;
    let w = 15, h = 15;

    if (type === 'bone') {
        w = 12; h = 40;
        pX = Math.random() * (battleBox.clientWidth - w);
        pY = battleBox.clientHeight;
        speedX = 0; speedY = -3;
    } else if (type === 'blaster') {
        w = 20; h = 20;
        pX = battleBox.clientWidth;
        pY = Math.random() * (battleBox.clientHeight - h);
        speedX = -5; speedY = 0;
    } else if (type === 'spear') {
        // --- 8 YÖNLÜ DOĞMA VE KALBE KİLİTLENME SİSTEMİ ---
        w = 6; h = 25;
        let direction = Math.floor(Math.random() * 8); 
        
        // Okun başlangıç koordinatlarını 8 köşeye göre ayarla
        switch(direction) {
            case 0: pX = battleBox.clientWidth / 2; pY = -30; break; // Üst
            case 1: pX = battleBox.clientWidth + 30; pY = battleBox.clientHeight / 2; break; // Sağ
            case 2: pX = battleBox.clientWidth / 2; pY = battleBox.clientHeight + 30; break; // Alt
            case 3: pX = -30; pY = battleBox.clientHeight / 2; break; // Sol
            case 4: pX = -30; pY = -30; break; // Sol Üst Çapraz
            case 5: pX = battleBox.clientWidth + 30; pY = -30; break; // Sağ Üst Çapraz
            case 6: pX = battleBox.clientWidth + 30; pY = battleBox.clientHeight + 30; break; // Sağ Alt Çapraz
            case 7: pX = -30; pY = battleBox.clientHeight + 30; break; // Sol Alt Çapraz
        }

        // Okun merkezini hesapla
        let arrowCenterX = pX + w / 2;
        let arrowCenterY = pY + h / 2;
        
        // Kalbin (Ruhun) o anki konumunu merkez al
        let targetX = player.x + 8;
        let targetY = player.y + 8;

        // Matematiksel Açı Hesaplama (Aimbot Mantığı)
        let angle = Math.atan2(targetY - arrowCenterY, targetX - arrowCenterX);

        // Sabit hız vektörü (Hız: 3.5 birim)
        let arrowSpeed = 3.5;
        speedX = Math.cos(angle) * arrowSpeed;
        speedY = Math.sin(angle) * arrowSpeed;

        // Görsel olarak okun ucunu kalbe doğru döndürme (Radyanı dereceye çevirip +90 derece ekleme)
        let degrees = angle * (180 / Math.PI) + 90;
        projectile.style.transform = `rotate(${degrees}deg)`;
    }

    projectile.style.width = w + 'px';
    projectile.style.height = h + 'px';
    projectile.style.left = pX + 'px';
    projectile.style.top = pY + 'px';
    battleBox.appendChild(projectile);

    projectiles.push({ element: projectile, x: pX, y: pY, sx: speedX, sy: speedY, width: w, height: h });
}

let joystickManager = null;
window.addEventListener('touchstart', (e) => {
    if (isPlayerTurn) return;
    if (e.target.closest('#action-buttons')) return;

    if (joystickManager) joystickManager.destroy();

    let touch = e.touches[0];
    const zone = document.getElementById('joystick-zone');
    zone.style.left = (touch.clientX - 50) + 'px';
    zone.style.top = (touch.clientY - 50) + 'px';

    joystickManager = nipplejs.create({
        zone: zone, mode: 'static',
        position: { left: '50%', top: '50%' }, color: 'red'
    });

    joystickManager.on('move', (evt, data) => { window.joystickData = data; });
    joystickManager.on('end', () => { window.joystickData = null; });
});

function handleInputs() {
    if (isPlayerTurn) return;
    let speed = keys['x'] ? player.slowSpeed : player.normalSpeed;

    if (keys['arrowup'] || keys['w']) player.y -= speed;
    if (keys['arrowdown'] || keys['s']) player.y += speed;
    if (keys['arrowleft'] || keys['a']) player.x -= speed;
    if (keys['arrowright'] || keys['d']) player.x += speed;

    if (window.joystickData && window.joystickData.vector) {
        player.x += window.joystickData.vector.x * speed;
        player.y -= window.joystickData.vector.y * speed;
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.x += p.sx; p.y += p.sy;
        p.element.style.left = p.x + 'px'; p.element.style.top = p.y + 'px';

        if (!isPlayerTurn && player.x < p.x + p.width && player.x + 16 > p.x &&
            player.y < p.y + p.height && player.y + 16 > p.y) {
            takeDamage(10);
            p.element.remove();
            projectiles.splice(i, 1);
            continue;
        }

        if (p.x < -120 || p.x > battleBox.clientWidth + 120 || p.y < -120 || p.y > battleBox.clientHeight + 120) {
            p.element.remove();
            projectiles.splice(i, 1);
        }
    }
}

function startDialogueRoutine() {
    setInterval(() => {
        if(player.hp <= 0 || isPlayerTurn) return;
        const dialogues = bossData.f;
        speechBubble.innerText = dialogues[Math.floor(Math.random() * dialogues.length)];
    }, 4000);
}

function takeDamage(amount) {
    player.hp -= amount;
    if (player.hp < 0) player.hp = 0;
    updateHPUI();
    soul.style.backgroundColor = '#fff';
    setTimeout(() => { soul.style.backgroundColor = '#ff0000'; }, 100);
    if (player.hp === 0) gameOver();
}

function updateHPUI() {
    hpText.innerText = `${player.hp} / ${player.maxHp}`;
    hpBar.style.width = ((player.hp / player.maxHp) * 150) + 'px';
}

function gameOver() {
    clearInterval(attackInterval);
    clearTimeout(waveTimer);
    speechBubble.innerHTML = `<span style="color:red;">GAME OVER</span><br>${bossData.goMsg}`;
    soul.style.display = 'none';
}

function checkBoundaries() {
    if (player.x < 0) player.x = 0;
    if (player.x > battleBox.clientWidth - 16) player.x = battleBox.clientWidth - 16;
    if (player.y < 0) player.y = 0;
    if (player.y > battleBox.clientHeight - 16) player.y = battleBox.clientHeight - 16;
}

function gameLoop() {
    handleInputs();
    updateProjectiles();
    checkBoundaries();
    soul.style.left = player.x + 'px';
    soul.style.top = player.y + 'px';
    requestAnimationFrame(gameLoop);
}

