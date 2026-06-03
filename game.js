// Oyun Değişkenleri
let player = { x: 192, y: 90, speed: 4, normalSpeed: 4, slowSpeed: 2, hp: 500, maxHp: 500 };
let keys = {};
let bossData = null;
let projectiles = []; 
let attackInterval = null;

// HTML Elementleri
const soul = document.getElementById('player-soul');
const battleBox = document.getElementById('battle-box');
const dialogueBox = document.getElementById('dialogue-box');
const hpBar = document.getElementById('hp-bar');
const hpText = document.getElementById('hp-text');

// 1. JSON VERİLERİNİ BAĞLAMA VE ÇEKME
fetch('Xizy.json')
    .then(response => response.json())
    .then(data => {
        bossData = data;
        initGame();
    })
    .catch(err => {
        console.error("JSON yüklenemedi!", err);
        dialogueBox.innerText = "Hata: Xizy.json dosyası okunamadı!";
    });

function initGame() {
    if(!bossData) return;

    // JSON dosyasındaki can değerini (500) otomatik senkronize et
    player.maxHp = bossData.dfg4554fg22.aaabgfb;
    player.hp = player.maxHp;
    updateHPUI();

    // Savaş alanının üstüne JSON'dan gelen Boss ismini (Xizy) yerleştir
    createBossElement();

    // Sistemleri ve Döngüleri Başlat
    gameLoop();
    startDialogueRoutine();
    startAttackWaves(); 
}

function createBossElement() {
    const boss = document.createElement('div');
    boss.id = 'boss-character';
    boss.style.position = 'absolute';
    boss.style.top = '20px';
    boss.style.left = '50%';
    boss.style.transform = 'translateX(-50%)';
    boss.style.fontSize = '24px';
    boss.style.fontWeight = 'bold';
    boss.style.color = '#fff';
    boss.innerText = bossData.b; // JSON dosyasındaki "Xizy" ismi
    document.getElementById('game-container').prepend(boss);
}

// 2. KONTROLLER (Klavye & Mobil)
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function handleInputs() {
    // X tuşuna basılı tutulursa ruh yavaşlar (Undertale Focus modu)
    player.speed = keys['x'] ? player.slowSpeed : player.normalSpeed;

    if (keys['arrowup'] || keys['w']) player.y -= player.speed;
    if (keys['arrowdown'] || keys['s']) player.y += player.speed;
    if (keys['arrowleft'] || keys['a']) player.x -= player.speed;
    if (keys['arrowright'] || keys['d']) player.x += player.speed;
}

// Mobil Joystick (Nipple.js)
const joystick = nipplejs.create({
    zone: document.getElementById('joystick-zone'),
    mode: 'static',
    position: { left: '50%', top: '50%' },
    color: 'red'
});
let joystickData = null;
joystick.on('move', (evt, data) => { joystickData = data; });
joystick.on('end', () => { joystickData = null; });

function handleJoystick() {
    if (!joystickData || !joystickData.vector) return;
    player.x += joystickData.vector.x * player.speed;
    player.y -= joystickData.vector.y * player.speed;
}

// Z ve X Mobil Butonları Dinleyicileri
document.getElementById('btn-x').addEventListener('touchstart', () => { keys['x'] = true; });
document.getElementById('btn-x').addEventListener('touchend', () => { keys['x'] = false; });

// 3. DOSYADAN DİYALOG ÇEKME RUTİNİ
function startDialogueRoutine() {
    // İlk açılışta JSON'daki ilk cümleyi yazdır
    if(bossData.f && bossData.f.length > 0) {
        dialogueBox.innerText = bossData.b + ": " + bossData.f[0];
    }
    
    // Her 5 saniyede bir JSON dosyasındaki rastgele bir lafı ekrana getirir
    setInterval(() => {
        if(player.hp <= 0) return;
        const dialogues = bossData.f; 
        const randomText = dialogues[Math.floor(Math.random() * dialogues.length)];
        dialogueBox.innerText = bossData.b + ": " + randomText;
    }, 5000);
}

// 4. TÜM SALDIRILARIN YÖNETİMİ (Kemik, Blaster, Mızrak)
function startAttackWaves() {
    attackInterval = setInterval(() => {
        if(player.hp <= 0) return;
        
        // Rastgele bir saldırı tipi seçiliyor
        const rand = Math.random();
        let type = 'bone';
        if (rand > 0.33 && rand < 0.66) {
            type = 'blaster';
        } else if (rand >= 0.66) {
            type = 'spear';
        }
        
        createProjectile(type);
    }, 1200); // Saldırı hızı zamanlaması (1.2 saniye)
}

function createProjectile(type) {
    const projectile = document.createElement('div');
    projectile.classList.add('projectile', type);
    
    let pX, pY, speedX, speedY;
    let w, h;

    if (type === 'bone') {
        // Aşağıdan yukarı çıkan BEYAZ KEMİK
        pX = Math.random() * (battleBox.clientWidth - 15);
        pY = battleBox.clientHeight;
        speedX = 0;
        speedY = -3.5; 
        w = 12;
        h = 50;
    } else if (type === 'blaster') {
        // Sağdan sola uçan MAVİ LAZER (Blaster mermisi)
        pX = battleBox.clientWidth;
        pY = Math.random() * (battleBox.clientHeight - 20);
        speedX = -6; 
        speedY = 0;
        w = 30;
        h = 12;
    } else {
        // Yukarıdan aşağıya inen GRİ OK (Mızrak / Spear)
        pX = Math.random() * (battleBox.clientWidth - 10);
        pY = -40;
        speedX = 0;
        speedY = 4;
        w = 4;
        h = 25;
    }

    projectile.style.width = w + 'px';
    projectile.style.height = h + 'px';
    projectile.style.left = pX + 'px';
    projectile.style.top = pY + 'px';
    battleBox.appendChild(projectile);

    projectiles.push({
        element: projectile,
        x: pX,
        y: pY,
        sx: speedX,
        sy: speedY,
        width: type === 'spear' ? 14 : w, 
        height: h
    });
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.x += p.sx;
        p.y += p.sy;
        p.element.style.left = p.x + 'px';
        p.element.style.top = p.y + 'px';

        // Kalp Çarpışma Testi
        if (player.x < p.x + p.width && player.x + 16 > p.x &&
            player.y < p.y + p.height && player.y + 16 > p.y) {
            
            takeDamage(15); // İsabet halinde hasar miktarı
            p.element.remove();
            projectiles.splice(i, 1);
            continue;
        }

        // Ekrandan çıkan mermileri bellekten silme
        if (p.x < -60 || p.x > battleBox.clientWidth + 60 || p.y < -60 || p.y > battleBox.clientHeight + 60) {
            p.element.remove();
            projectiles.splice(i, 1);
        }
    }
}

// 5. CAN VE OYUN BİTTİ SİSTEMLERİ
function takeDamage(amount) {
    if(player.hp <= 0) return;
    player.hp -= amount;
    if (player.hp < 0) player.hp = 0;
    updateHPUI();

    // Kalbin hasar alınca beyaz yanıp sönmesi
    soul.style.backgroundColor = '#fff';
    setTimeout(() => { soul.style.backgroundColor = '#ff0000'; }, 100);

    if (player.hp === 0) {
        gameOver();
    }
}

function updateHPUI() {
    hpText.innerText = `${player.hp} / ${player.maxHp}`;
    const percentage = (player.hp / player.maxHp) * 150; 
    hpBar.style.width = percentage + 'px';
}

function gameOver() {
    clearInterval(attackInterval);
    // JSON dosyasında ayarladığın o özel Game Over lafını ("İt was hard, right?") buraya çeker
    dialogueBox.innerHTML = `<span style="color:red; font-weight:bold;">GAME OVER</span><br>${bossData.goMsg}`;
    soul.style.display = 'none';
}

function checkBoundaries() {
    const soulSize = 16;
    if (player.x < 0) player.x = 0;
    if (player.x > battleBox.clientWidth - soulSize) player.x = battleBox.clientWidth - soulSize;
    if (player.y < 0) player.y = 0;
    if (player.y > battleBox.clientHeight - soulSize) player.y = battleBox.clientHeight - soulSize;
}

function gameLoop() {
    if (player.hp > 0) {
        handleInputs();
        handleJoystick();
        updateProjectiles();
        checkBoundaries();

        soul.style.left = player.x + 'px';
        soul.style.top = player.y + 'px';
        
        requestAnimationFrame(gameLoop);
    }
}

