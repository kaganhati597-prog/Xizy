let player = { x: 192, y: 90, speed: 4, normalSpeed: 4, slowSpeed: 2, hp: 500, maxHp: 500 };
let keys = {};
let bossData = null;
let projectiles = []; 
let attackInterval = null;
let waveTimer = null;
let isPlayerTurn = false;

// Boss Ayarları (100 HP ve Faz Yönetimi)
let bossHp = 100; 
let maxBossHp = 100;
let currentPhase = 'blaster'; 

// Mobil Joystick Veri Nesnesi
let mobileMovement = { x: 0, y: 0, active: false };
let joystickManager = null;

const soul = document.getElementById('player-soul');
const battleBox = document.getElementById('battle-box');
const speechBubble = document.getElementById('speech-bubble');
const hpBar = document.getElementById('hp-bar');
const hpText = document.getElementById('hp-text');
const menu = document.getElementById('undertale-menu');
const bossHpBar = document.getElementById('boss-hp-bar');

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
    if(bossHp <= 0) return;
    isPlayerTurn = false;
    menu.classList.add('hidden');
    soul.style.display = 'block';
    
    // Sıra boss'a geçince klavye takılmalarını engellemek için temizlik yapıyoruz
    keys = {};

    if (currentPhase === 'blaster') {
        // FAZ 1: 8 YÖNLÜ BLASTER SALDIRISI
        attackInterval = setInterval(() => {
            createBlasterProjectile();
        }, 900);
    } else if (currentPhase === 'bone_trap') {
        // FAZ 2: UYARILI SANS KEMİK TUZAĞI
        triggerBoneTrap();
    }

    // 20 Saniye Kuralı
    waveTimer = setTimeout(() => {
        endBossTurn();
    }, 20000); 
}

function endBossTurn() {
    clearInterval(attackInterval);
    clearTimeout(waveTimer);
    
    // Ekrandaki mermileri ve eski uyarı çizgilerini sıfırla
    projectiles.forEach(p => p.element.remove());
    projectiles = [];
    document.querySelectorAll('.warning-line').forEach(el => el.remove());
    
    isPlayerTurn = true;
    soul.style.display = 'none';
    menu.classList.remove('hidden');
    speechBubble.innerText = "Sıra sende! Kararlı ol.";
}

// OYUNCU SEÇİMLERİ (FIGHT & HEAL)
document.getElementById('btn-fight').addEventListener('click', () => {
    if(!isPlayerTurn) return;
    
    bossHp -= 10; // 150 yerine tam 10 hasar vuruyor
    if(bossHp < 0) bossHp = 0;
    
    // Boss Can Çubuğunu Güncelle
    bossHpBar.style.width = (bossHp / maxBossHp * 100) + '%';
    
    if(bossHp === 0) {
        clearInterval(attackInterval);
        clearTimeout(waveTimer);
        document.querySelectorAll('.warning-line').forEach(el => el.remove());
        speechBubble.innerText = "Kazandın! Xizy yenildi!";
        menu.classList.add('hidden');
        return;
    }

    speechBubble.innerText = "Xizy'ye saldırdın! 10 Hasar verildi!";
    
    // Sırayla faz değiştirme (Blaster -> Bone Trap -> Blaster...)
    currentPhase = (currentPhase === 'blaster') ? 'bone_trap' : 'blaster';
    
    setTimeout(() => { startBossTurn(); }, 2000);
});

document.getElementById('btn-heal').addEventListener('click', () => {
    if(!isPlayerTurn) return;
    player.hp += 150;
    if (player.hp > player.maxHp) player.hp = player.maxHp;
    updateHPUI();
    speechBubble.innerText = "150 HP Yenilendi!";
    
    currentPhase = (currentPhase === 'blaster') ? 'bone_trap' : 'blaster';
    setTimeout(() => { startBossTurn(); }, 2000);
});

// 8 YÖNLÜ GASTER BLASTER MEKANİĞİ
function createBlasterProjectile() {
    if (isPlayerTurn || player.hp <= 0) return;
    
    const blaster = document.createElement('div');
    blaster.classList.add('projectile', 'blaster');
    
    let pX, pY;
    let direction = Math.floor(Math.random() * 8); 
    
    switch(direction) {
        case 0: pX = battleBox.clientWidth / 2; pY = -40; break; // Üst
        case 1: pX = battleBox.clientWidth + 40; pY = battleBox.clientHeight / 2; break; // Sağ
        case 2: pX = battleBox.clientWidth / 2; pY = battleBox.clientHeight + 40; break; // Alt
        case 3: pX = -40; pY = battleBox.clientHeight / 2; break; // Sol
        case 4: pX = -40; pY = -40; break; // Sol Üst
        case 5: pX = battleBox.clientWidth + 40; pY = -40; break; // Sağ Üst
        case 6: pX = battleBox.clientWidth + 40; pY = battleBox.clientHeight + 40; break; // Sağ Alt
        case 7: pX = -40; pY = battleBox.clientHeight + 40; break; // Sol Alt
    }

    let targetX = player.x + 8;
    let targetY = player.y + 8;
    let angle = Math.atan2(targetY - (pY + 22), targetX - (pX + 22));
    
    let speed = 4.5;
    let speedX = Math.cos(angle) * speed;
    let speedY = Math.sin(angle) * speed;

    let degrees = angle * (180 / Math.PI) + 90;
    blaster.style.transform = `rotate(${degrees}deg)`;
    blaster.style.left = pX + 'px';
    blaster.style.top = pY + 'px';
    
    battleBox.appendChild(blaster);
    projectiles.push({ element: blaster, x: pX, y: pY, sx: speedX, sy: speedY, width: 35, height: 35, type: 'blaster' });
}

// UYARILI KEMİK TUZAĞI SİSTEMİ
function triggerBoneTrap() {
    if (isPlayerTurn || player.hp <= 0) return;

    let sides = ['top', 'bottom', 'left', 'right'];
    let chosenSide = sides[Math.floor(Math.random() * sides.length)];

    const warning = document.createElement('div');
    warning.classList.add('warning-line');
    warning.innerText = "⚠️";

    if (chosenSide === 'top') {
        warning.style.width = '100%'; warning.style.height = '40px'; warning.style.top = '0'; warning.style.left = '0';
    } else if (chosenSide === 'bottom') {
        warning.style.width = '100%'; warning.style.height = '40px'; warning.style.bottom = '0'; warning.style.left = '0';
    } else if (chosenSide === 'left') {
        warning.style.width = '40px'; warning.style.height = '100%'; warning.style.top = '0'; warning.style.left = '0';
    } else if (chosenSide === 'right') {
        warning.style.width = '40px'; warning.style.height = '100%'; warning.style.top = '0'; warning.style.right = '0';
    }

    battleBox.appendChild(warning);

    // 2 Saniye Kuralı (Ünlem söner, kemikler çıkar)
    setTimeout(() => {
        warning.remove();
        if (!isPlayerTurn && player.hp > 0) {
            spawnTrapBones(chosenSide);
        }
    }, 2000);

    // Her 3.5 saniyede bir yeni tuzak kurar
    attackInterval = setTimeout(() => {
        triggerBoneTrap();
    }, 3500);
}

function spawnTrapBones(side) {
    let count = (side === 'left' || side === 'right') ? 4 : 8;
    
    for (let i = 0; i < count; i++) {
        const bone = document.createElement('div');
        bone.classList.add('projectile', 'bone');
        
        let pX, pY, sx = 0, sy = 0, w = 15, h = 40;

        if (side === 'top') {
            w = 15; h = 40; pX = i * 50; pY = -40; sy = 4;
            bone.style.transform = 'rotate(180deg)';
        } else if (side === 'bottom') {
            w = 15; h = 40; pX = i * 50; pY = battleBox.clientHeight; sy = -4;
        } else if (side === 'left') {
            w = 40; h = 15; pX = -40; pY = i * 50; sx = 4;
            bone.style.transform = 'rotate(90deg)';
        } else if (side === 'right') {
            w = 40; h = 15; pX = battleBox.clientWidth; pY = i * 50; sx = -4;
            bone.style.transform = 'rotate(-90deg)';
        }

        bone.style.width = w + 'px';
        bone.style.height = h + 'px';
        bone.style.left = pX + 'px';
        bone.style.top = pY + 'px';
        
        battleBox.appendChild(bone);
        projectiles.push({ element: bone, x: pX, y: pY, sx: sx, sy: sy, width: w, height: h, type: 'bone' });
    }
}

/* ==========================================================================
   YENİLENEN KUSURSUZ JOYSTICK SİSTEMİ (SAVAŞTA VE MENÜDE TAM UYUMLU)
   ========================================================================== */
window.addEventListener('touchstart', (e) => {
    // Menü butonlarına basarken joystick'in açılmasını önlüyoruz
    if (e.target.closest('.menu-btn')) return;

    if (joystickManager) joystickManager.destroy();

    let touch = e.touches[0];
    const zone = document.getElementById('joystick-zone');
    zone.style.left = (touch.clientX - 50) + 'px';
    zone.style.top = (touch.clientY - 50) + 'px';

    joystickManager = nipplejs.create({
        zone: zone,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'red'
    });

    joystickManager.on('move', (evt, data) => {
        if (data && data.vector) {
            mobileMovement.x = data.vector.x;
            mobileMovement.y = data.vector.y;
            mobileMovement.active = true;
        }
    });

    joystickManager.on('end', () => {
        mobileMovement.x = 0;
        mobileMovement.y = 0;
        mobileMovement.active = false;
    });
});

function handleInputs() {
    if (isPlayerTurn) return; // Sıra bizdeyken kalp hareket etmez
    
    let speed = player.normalSpeed;

    // Klavye Kontrolleri
    if (keys['arrowup'] || keys['w']) player.y -= speed;
    if (keys['arrowdown'] || keys['s']) player.y += speed;
    if (keys['arrowleft'] || keys['a']) player.x -= speed;
    if (keys['arrowright'] || keys['d']) player.x += speed;

    // Mobil Joystick Hareketi (Savaş alanında tamamen akıcı hale getirildi)
    if (mobileMovement.active) {
        player.x += mobileMovement.x * speed;
        player.y -= mobileMovement.y * speed; 
    }
}

function updateProjectiles() {
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.x += p.sx; p.y += p.sy;
        p.element.style.left = p.x + 'px'; p.element.style.top = p.y + 'px';

        // Hitbox Çarpışma Algılama alanı
        if (!isPlayerTurn && player.x < p.x + p.width && player.x + 16 > p.x &&
            player.y < p.y + p.height && player.y + 16 > p.y) {
            
            takeDamage(10); // İsabet halinde tam 10 HP siler
            p.element.remove();
            projectiles.splice(i, 1);
            continue;
        }

        // Kutudan taşan mermileri siler
        if (p.x < -100 || p.x > battleBox.clientWidth + 100 || p.y < -100 || p.y > battleBox.clientHeight + 100) {
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
    document.querySelectorAll('.warning-line').forEach(el => el.remove());
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
