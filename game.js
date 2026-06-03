// Oyun Değişkenleri
let player = { x: 192, y: 90, speed: 4, normalSpeed: 4, slowSpeed: 2, hp: 500, maxHp: 500 };
let keys = {};
let bossData = null;
let projectiles = []; // Ekrandaki mermiler (kemikler, blasterlar)
let attackInterval = null;

// HTML Elementleri
const soul = document.getElementById('player-soul');
const battleBox = document.getElementById('battle-box');
const dialogueBox = document.getElementById('dialogue-box');
const hpBar = document.getElementById('hp-bar');
const hpText = document.getElementById('hp-text');

// 1. JSON VERİLERİNİ ÇEKME
fetch('Xizy.json')
    .then(response => response.json())
    .then(data => {
        bossData = data;
        initGame();
    })
    .catch(err => {
        console.error("JSON yüklenemedi!", err);
        dialogueBox.innerText = "Hata: JSON dosyası bulunamadı!";
    });

function initGame() {
    if(!bossData) return;

    // JSON'dan can değerlerini senkronize et (aaabgfb = 500)
    player.maxHp = bossData.dfg4554fg22.aaabgfb;
    player.hp = player.maxHp;
    updateHPUI();

    // Savaş alanına Xizy'yi (Boss) görsel veya yazı olarak ekle
    createBossElement();

    // Döngüleri Başlat
    gameLoop();
    startDialogueRoutine();
    startAttackWaves(); // Saldırıları başlatır
}

// Boss'un ekrandaki varlığı
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
    boss.innerText = bossData.b; // JSON içindeki "b": "Xizy" ismi
    document.getElementById('game-container').prepend(boss);
}

// 2. KONTROLLER (PC & Mobil)
window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

function handleInputs() {
    // X tuşu veya yavaşlatma modu
    player.speed = keys['x'] ? player.slowSpeed : player.normalSpeed;

    if (keys['arrowup'] || keys['w']) player.y -= player.speed;
    if (keys['arrowdown'] || keys['s']) player.y += player.speed;
    if (keys['arrowleft'] || keys['a']) player.x -= player.speed;
    if (keys['arrowright'] || keys['d']) player.x += player.speed;
}

// Mobil Joystick Entegrasyonu (Nipple.js)
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

// 3. DİYALOG SİSTEMİ (JSON'dan rastgele konuşma)
function startDialogueRoutine() {
    setInterval(() => {
        if(player.hp <= 0) return;
        const dialogues = bossData.f; // JSON'daki laf sokma listesi
        const randomText = dialogues[Math.floor(Math.random() * dialogues.length)];
        dialogueBox.innerText = "Xizy: " + randomText;
    }, 6000); // Her 6 saniyede bir laf değiştirir
}

// 4. SALDIRI MEKANİĞİ (Kemikler ve Blasterlar)
function startAttackWaves() {
    // JSON dosyasında belirttiğin "I can control blasters, spears and bones" mantığı
    attackInterval = setInterval(() => {
        if(player.hp <= 0) return;
        
        // Rastgele mermi (Saldırı türü) oluştur
        const type = Math.random() > 0.5 ? 'bone' : 'blaster';
        createProjectile(type);
    }, 1500); // Her 1.5 saniyede bir yeni mermi fırlatır
}

function createProjectile(type) {
    const projectile = document.createElement('div');
    projectile.classList.add('projectile', type);
    projectile.style.position = 'absolute';
    
    let pX, pY, speedX, speedY;

    if (type === 'bone') {
        // Aşağıdan yukarı çıkan kemik saldırısı
        pX = Math.random() * (battleBox.clientWidth - 10);
        pY = battleBox.clientHeight;
        speedX = 0;
        speedY = -3; // Yukarı doğru hareket
        projectile.style.width = '10px';
        projectile.style.height = '40px';
        projectile.style.backgroundColor = '#fff'; // Beyaz Kemik
    } else {
        // Gaster Blaster / Lazer mermisi (Sağdan sola hızlı geçer)
        pX = battleBox.clientWidth;
        pY = Math.random() * (battleBox.clientHeight - 15);
        speedX = -5; // Sola doğru hızlı
        speedY = 0;
        projectile.style.width = '25px';
        projectile.style.height = '15px';
        projectile.style.backgroundColor = '#00ffff'; // Açık Mavi Lazer
    }

    projectile.style.left = pX + 'px';
    projectile.style.top = pY + 'px';
    battleBox.appendChild(projectile);

    projectiles.push({
        element: projectile,
        x: pX,
        y: pY,
        sx: speedX,
        sy: speedY,
        width: parseInt(projectile.style.width),
        height: parseInt(projectile.style.height)
    });
}

// Mermileri hareket ettir ve çarpışmayı kontrol et
function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.x += p.sx;
        p.y += p.sy;
        p.element.style.left = p.x + 'px';
        p.element.style.top = p.y + 'px';

        // Çarpışma Testi (AABB Hitbox)
        if (player.x < p.x + p.width && player.x + 16 > p.x &&
            player.y < p.y + p.height && player.y + 16 > p.y) {
            
            // Oyuncu hasar aldı!
            takeDamage(10); 
            p.element.remove();
            projectiles.splice(i, 1);
            continue;
        }

        // Ekran dışına çıkan mermileri temizle (Kasmasın diye)
        if (p.x < -50 || p.x > battleBox.clientWidth + 50 || p.y < -50 || p.y > battleBox.clientHeight + 50) {
            p.element.remove();
            projectiles.splice(i, 1);
        }
    }
}

// 5. HASAR VE CAN SİSTEMİ
function takeDamage(amount) {
    if(player.hp <= 0) return;
    player.hp -= amount;
    if (player.hp < 0) player.hp = 0;
    updateHPUI();

    // Ruh hasar alınca kısa süre kırmızı-beyaz yanıp sönsün
    soul.style.backgroundColor = '#fff';
    setTimeout(() => { soul.style.backgroundColor = '#ff0000'; }, 100);

    if (player.hp === 0) {
        gameOver();
    }
}

function updateHPUI() {
    hpText.innerText = `${player.hp} / ${player.maxHp}`;
    const percentage = (player.hp / player.maxHp) * 150; // Kutu genişliği 150px
    hpBar.style.width = percentage + 'px';
}

function gameOver() {
    clearInterval(attackInterval);
    // JSON dosyasındaki Game Over Mesajını bas: "İt was hard, right?"
    dialogueBox.innerHTML = `<span style="color:red; font-weight:bold;">GAME OVER</span><br>${bossData.goMsg}`;
    soul.style.display = 'none';
}

// 6. SINIRLAR VE ANA DÖNGÜ
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
