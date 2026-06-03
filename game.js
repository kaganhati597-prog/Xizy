let player = { x: 192, y: 90, speed: 4, normalSpeed: 4, hp: 200, maxHp: 200 };
let keys = {};
let bossData = null;
let projectiles = []; 
let lasers = []; // Aktif lazer ışınlarını takip eder
let attackInterval = null;
let waveTimer = null;
let isPlayerTurn = false;

// Boss Ayarları (3 Farklı Saldırı Fazı: blaster, bone_trap, spear)
let bossHp = 100; 
let maxBossHp = 100;
let phaseList = ['blaster', 'bone_trap', 'spear'];
let phaseIndex = 0;

// Geliştirilmiş Mobil Joystick Yönetimi
let mobileMovement = { x: 0, y: 0, active: false };
let joystickInstance = null;

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
    // Sabit 200 HP Ayarı
    player.maxHp = 200; 
    player.hp = player.maxHp;
    updateHPUI();
    
    window.addEventListener('keydown', (e) => { keys[e.key.toLowerCase()] = true; });
    window.addEventListener('keyup', (e) => { keys[e.key.toLowerCase()] = false; });

    // Mobil joystick sistemini başlat
    initJoystickSystem();

    gameLoop();
    startDialogueRoutine();
    startBossTurn(); 
}

function startBossTurn() {
    if(bossHp <= 0) return;
    isPlayerTurn = false;
    menu.classList.add('hidden'); // Çift tıklama hilesini engellemek için anında gizle
    soul.style.display = 'block';
    keys = {}; // Tuş hafızasını sıfırla

    let currentPhase = phaseList[phaseIndex];

    if (currentPhase === 'blaster') {
        // --- GERÇEK SANS USULÜ ŞARJLI LAZER BLASTER ---
        attackInterval = setInterval(() => {
            if(!isPlayerTurn) createRealGasterBlaster();
        }, 1500);
    } else if (currentPhase === 'bone_trap') {
        // --- ADİL VE BOŞLUKLU KEMİK TUZAĞI ---
        triggerBoneTrap();
    } else if (currentPhase === 'spear') {
        // --- 8 YÖNLÜ OKLAR / MIZRAKLAR ---
        attackInterval = setInterval(() => {
            if(!isPlayerTurn) createSpearProjectile();
        }, 700);
    }

    // 20 Saniye sonra turu bitir
    waveTimer = setTimeout(() => {
        endBossTurn();
    }, 20000); 
}

function endBossTurn() {
    clearInterval(attackInterval);
    clearTimeout(waveTimer);
    
    // Ekranı temizle
    projectiles.forEach(p => p.element.remove());
    projectiles = [];
    lasers.forEach(l => l.element.remove());
    lasers = [];
    document.querySelectorAll('.warning-line').forEach(el => el.remove());
    
    isPlayerTurn = true;
    soul.style.display = 'none';
    menu.classList.remove('hidden');
    speechBubble.innerText = "Sıra sende! Hamleni yap.";
    
    // Bir sonraki tura geçiş yap
    phaseIndex = (phaseIndex + 1) % phaseList.length;
}

// OYUNCU SEÇİMLERİ (FIGHT & HEAL)
document.getElementById('btn-fight').addEventListener('click', () => {
    if(!isPlayerTurn) return;
    isPlayerTurn = false; 
    menu.classList.add('hidden');
    
    bossHp -= 10;
    if(bossHp < 0) bossHp = 0;
    bossHpBar.style.width = (bossHp / maxBossHp * 100) + '%';
    
    if(bossHp === 0) {
        speechBubble.innerText = "Kazandın! Xizy yenildi!";
        return;
    }
    speechBubble.innerText = "Xizy'ye saldırdın! 10 Hasar verildi!";
    setTimeout(() => { startBossTurn(); }, 2000);
});

document.getElementById('btn-heal').addEventListener('click', () => {
    if(!isPlayerTurn) return;
    isPlayerTurn = false; 
    menu.classList.add('hidden');

    player.hp += 150;
    if (player.hp > player.maxHp) player.hp = player.maxHp;
    updateHPUI();
    speechBubble.innerText = "150 HP Yenilendi!";
    setTimeout(() => { startBossTurn(); }, 2000);
});

// --- 1. GERÇEK GASTER BLASTER MEKANİĞİ (KİLİTLENİR, ŞARJ OLUR VE LAZER ATAR) ---
function createRealGasterBlaster() {
    if (isPlayerTurn || player.hp <= 0) return;

    const blaster = document.createElement('div');
    blaster.classList.add('projectile', 'blaster');
    
    // Rastgele bir kenardan doğsun
    let pX = Math.random() * (battleBox.clientWidth - 40);
    let pY = Math.random() > 0.

