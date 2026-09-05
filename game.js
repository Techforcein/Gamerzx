// ============================================
// MOB RUSH - Complete Game Implementation
// ============================================

class GameManager {
    constructor() {
        this.state = 'MENU';
        this.level = 1;
        this.coins = 0;
        this.bestScore = 0;
        this.soundEnabled = true;
        
        // Initialize systems
        this.initThreeJS();
        this.initUI();
        this.loadSaveData();
        
        // Start game loop
        this.animate();
    }
    
    initThreeJS() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x87ceeb, 50, 150);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 15, -15);
        this.camera.lookAt(0, 0, 20);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            canvas: document.getElementById('game-canvas'),
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 30, 10);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);
        
        // Window resize handler
        window.addEventListener('resize', () => this.onResize());
    }
    
    initUI() {
        // UI Elements
        this.startScreen = document.getElementById('start-screen');
        this.winScreen = document.getElementById('win-screen');
        this.loseScreen = document.getElementById('lose-screen');
        this.hud = document.getElementById('hud');
        this.battleDisplay = document.getElementById('battle-display');
        
        // Buttons
        document.getElementById('play-button').addEventListener('click', () => this.startGame());
        document.getElementById('next-level-button').addEventListener('click', () => this.nextLevel());
        document.getElementById('retry-button').addEventListener('click', () => this.retryLevel());
        document.getElementById('menu-button').addEventListener('click', () => this.goToMenu());
        document.getElementById('sound-toggle').addEventListener('click', () => this.toggleSound());
        
        // Update menu display
        this.updateMenuUI();
    }
    
    loadSaveData() {
        const saved = localStorage.getItem('mobRushSave');
        if (saved) {
            const data = JSON.parse(saved);
            this.coins = data.coins || 0;
            this.level = data.level || 1;
            this.bestScore = data.bestScore || 0;
        }
    }
    
    saveData() {
        const data = {
            coins: this.coins,
            level: this.level,
            bestScore: this.bestScore
        };
        localStorage.setItem('mobRushSave', JSON.stringify(data));
    }
    
    updateMenuUI() {
        document.getElementById('menu-level').textContent = this.level;
        document.getElementById('menu-coins').textContent = this.coins;
        document.getElementById('menu-best').textContent = this.bestScore;
    }
    
    startGame() {
        this.state = 'PLAYING';
        this.startScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');
        this.initLevel(this.level);
    }
    
    initLevel(level) {
        // Clear previous level
        this.clearLevel();
        
        // Initialize systems
        this.crowdManager = new CrowdManager(this);
        this.gateManager = new GateManager(this);
        this.enemyManager = new EnemyManager(this);
        this.playerController = new PlayerController(this);
        
        // Set up level
        this.crowdManager.createInitialCrowd(5);
        this.gateManager.generateGates(level);
        this.enemyManager.createEnemy(level);
        
        // Update HUD
        this.updateHUD();
    }
    
    clearLevel() {
        // Remove all game objects
        if (this.crowdManager) this.crowdManager.dispose();
        if (this.gateManager) this.gateManager.dispose();
        if (this.enemyManager) this.enemyManager.dispose();
    }
    
    nextLevel() {
        this.level++;
        this.saveData();
        this.winScreen.classList.add('hidden');
        this.initLevel(this.level);
        this.state = 'PLAYING';
    }
    
    retryLevel() {
        this.loseScreen.classList.add('hidden');
        this.initLevel(this.level);
        this.state = 'PLAYING';
    }
    
    goToMenu() {
        this.state = 'MENU';
        this.loseScreen.classList.add('hidden');
        this.winScreen.classList.add('hidden');
        this.hud.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.updateMenuUI();
        this.clearLevel();
    }
    
    toggleSound() {
        this.soundEnabled = !this.soundEnabled;
        const btn = document.getElementById('sound-toggle');
        btn.textContent = this.soundEnabled ? '🔊 Sound: ON' : '🔇 Sound: OFF';
        if (this.audioManager) {
            this.audioManager.toggleSound(this.soundEnabled);
        }
    }
    
    updateHUD() {
        document.getElementById('level-number').textContent = this.level;
        document.getElementById('crowd-count').textContent = this.crowdManager?.count || 0;
        document.getElementById('coin-count').textContent = this.coins;
    }
    
    showWinScreen() {
        this.state = 'WIN';
        const survivors = this.crowdManager.count;
        const coinsEarned = 100 + survivors;
        this.coins += coinsEarned;
        this.bestScore = Math.max(this.bestScore, survivors);
        this.saveData();
        
        document.getElementById('win-survivors').textContent = survivors;
        document.getElementById('win-coins').textContent = coinsEarned;
        this.winScreen.classList.remove('hidden');
    }
    
    showLoseScreen() {
        this.state = 'LOSE';
        this.loseScreen.classList.remove('hidden');
    }
    
    showBattleUI() {
        this.battleDisplay.classList.remove('hidden');
        document.getElementById('player-battle-count').textContent = this.crowdManager.count;
        document.getElementById('enemy-battle-count').textContent = this.enemyManager.count;
    }
    
    updateBattleUI() {
        document.getElementById('player-battle-count').textContent = this.crowdManager.count;
        document.getElementById('enemy-battle-count').textContent = this.enemyManager.count;
    }
    
    hideBattleUI() {
        this.battleDisplay.classList.add('hidden');
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        if (this.state === 'PLAYING' || this.state === 'BATTLE') {
            if (this.crowdManager) this.crowdManager.update();
            if (this.gateManager) this.gateManager.update();
            if (this.enemyManager) this.enemyManager.update();
            if (this.playerController) this.playerController.update();
            
            // Check for battle trigger
            if (this.state === 'PLAYING' && this.crowdManager && this.enemyManager) {
                if (this.crowdManager.position.z >= this.enemyManager.position.z - 5) {
                    this.startBattle();
                }
            }
        }
        
        this.renderer.render(this.scene, this.camera);
    }
    
    startBattle() {
        this.state = 'BATTLE';
        this.showBattleUI();
        
        // Battle simulation
        this.battleInterval = setInterval(() => {
            const playerPower = this.crowdManager.count;
            const enemyPower = this.enemyManager.count;
            
            // Calculate losses
            const playerLoss = Math.ceil(enemyPower * 0.1) + Math.floor(Math.random() * 3);
            const enemyLoss = Math.ceil(playerPower * 0.1) + Math.floor(Math.random() * 3);
            
            this.crowdManager.removeUnits(playerLoss);
            this.enemyManager.removeUnits(enemyLoss);
            this.updateBattleUI();
            
            // Check battle end
            if (this.crowdManager.count <= 0) {
                clearInterval(this.battleInterval);
                this.hideBattleUI();
                this.showLoseScreen();
            } else if (this.enemyManager.count <= 0) {
                clearInterval(this.battleInterval);
                this.hideBattleUI();
                this.showWinScreen();
            }
        }, 500);
    }
}

// ============================================
// Crowd Manager
// ============================================

class CrowdManager {
    constructor(game) {
        this.game = game;
        this.count = 0;
        this.position = new THREE.Vector3(0, 0, 0);
        this.units = [];
        
        // Create instanced mesh for performance
        this.geometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
        this.material = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
        this.instancedMesh = new THREE.InstancedMesh(
            this.geometry,
            this.material,
            1000
        );
        this.instancedMesh.castShadow = true;
        this.game.scene.add(this.instancedMesh);
    }
    
    createInitialCrowd(count) {
        for (let i = 0; i < count; i++) {
            this.addUnit();
        }
    }
    
    addUnit() {
        this.count++;
        const index = this.units.length;
        this.units.push({
            offset: new THREE.Vector3(
                (Math.random() - 0.5) * 3,
                0,
                (Math.random() - 0.5) * 3
            ),
            bobPhase: Math.random() * Math.PI * 2
        });
        
        // Update instanced mesh
        this.updateInstancedMesh();
    }
    
    removeUnits(count) {
        const removed = Math.min(count, this.count);
        this.count -= removed;
        
        // Remove from units array
        for (let i = 0; i < removed; i++) {
            this.units.pop();
        }
        
        this.updateInstancedMesh();
    }
    
    updateInstancedMesh() {
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);
        
        this.units.forEach((unit, i) => {
            position.set(
                unit.offset.x,
                unit.offset.y + Math.sin(Date.now() * 0.005 + unit.bobPhase) * 0.1,
                unit.offset.z
            );
            quaternion.setFromEuler(new THREE.Euler(0, 0, 0));
            matrix.compose(position, quaternion, scale);
            this.instancedMesh.setMatrixAt(i, matrix);
        });
        
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.instancedMesh.count = this.units.length;
    }
    
    update() {
        // Update crowd position
        this.position.z += 0.1;
        this.instancedMesh.position.copy(this.position);
        this.updateInstancedMesh();
    }
    
    dispose() {
        this.game.scene.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        this.instancedMesh.material.dispose();
    }
}

// ============================================
// Gate Manager
// ============================================

class GateManager {
    constructor(game) {
        this.game = game;
        this.gates = [];
        this.gateMeshes = [];
    }
    
    generateGates(level) {
        const numGates = Math.min(3 + Math.floor(level / 2), 6);
        const spacing = 20;
        
        for (let i = 0; i < numGates; i++) {
            const z = 30 + i * spacing;
            const xOffset = (Math.random() - 0.5) * 8;
            this.createGate(xOffset, z, this.getRandomOperation());
        }
    }
    
    getRandomOperation() {
        const operations = [
            { type: 'multiply', value: 2, display: '×2', color: 0x10b981 },
            { type: 'multiply', value: 3, display: '×3', color: 0x10b981 },
            { type: 'add', value: 10, display: '+10', color: 0x3b82f6 },
            { type: 'multiply', value: 5, display: '×5', color: 0x8b5cf6 },
            { type: 'add', value: 25, display: '+25', color: 0x3b82f6 },
            { type: 'divide', value: 2, display: '÷2', color: 0xef4444 },
            { type: 'subtract', value: 10, display: '-10', color: 0xef4444 },
            { type: 'multiply', value: 10, display: '×10', color: 0x8b5cf6 }
        ];
        
        // Weight towards positive operations
        const weights = [20, 15, 15, 10, 10, 10, 10, 10];
        const totalWeight = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * totalWeight;
        
        for (let i = 0; i < operations.length; i++) {
            random -= weights[i];
            if (random <= 0) {
                return operations[i];
            }
        }
        
        return operations[0];
    }
    
    createGate(x, z, operation) {
        // Create gate frame
        const frameGeometry = new THREE.BoxGeometry(6, 8, 1);
        const frameMaterial = new THREE.MeshStandardMaterial({ 
            color: operation.color,
            transparent: true,
            opacity: 0.7
        });
        const frame = new THREE.Mesh(frameGeometry, frameMaterial);
        frame.position.set(x, 4, z);
        frame.castShadow = true;
        
        // Create gate opening
        const openingGeometry = new THREE.BoxGeometry(4, 6, 1.2);
        const openingMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.3
        });
        const opening = new THREE.Mesh(openingGeometry, openingMaterial);
        opening.position.set(x, 4, z);
        
        this.game.scene.add(frame);
        this.game.scene.add(opening);
        
        this.gates.push({
            x: x,
            z: z,
            operation: operation,
            triggered: false,
            frame: frame,
            opening: opening
        });
        this.gateMeshes.push(frame, opening);
    }
    
    update() {
        if (!this.game.crowdManager) return;
        
        const crowdPos = this.game.crowdManager.position;
        
        this.gates.forEach(gate => {
            if (!gate.triggered && 
                Math.abs(crowdPos.x - gate.x) < 3 &&
                Math.abs(crowdPos.z - gate.z) < 2) {
                this.triggerGate(gate);
            }
        });
    }
    
    triggerGate(gate) {
        gate.triggered = true;
        const operation = gate.operation;
        const crowdManager = this.game.crowdManager;
        
        switch (operation.type) {
            case 'multiply':
                const newCount = crowdManager.count * operation.value;
                const difference = newCount - crowdManager.count;
                crowdManager.addUnits(difference);
                this.showFloatingText(`×${operation.value}`, gate.x, gate.z);
                break;
                
            case 'add':
                crowdManager.addUnits(operation.value);
                this.showFloatingText(`+${operation.value}`, gate.x, gate.z);
                break;
                
            case 'divide':
                const removedDivide = Math.floor(crowdManager.count / operation.value);
                crowdManager.removeUnits(removedDivide);
                this.showFloatingText(`÷${operation.value}`, gate.x, gate.z);
                break;
                
            case 'subtract':
                crowdManager.removeUnits(operation.value);
                this.showFloatingText(`-${operation.value}`, gate.x, gate.z);
                break;
        }
        
        this.game.updateHUD();
        
        // Visual effect - flash gate
        gate.frame.material.opacity = 1;
        setTimeout(() => {
            gate.frame.material.opacity = 0.7;
        }, 200);
    }
    
    showFloatingText(text, x, z) {
        const div = document.createElement('div');
        div.className = 'floating-text';
        div.textContent = text;
        div.style.left = '50%';
        div.style.top = '40%';
        document.getElementById('floating-texts').appendChild(div);
        
        setTimeout(() => {
            div.remove();
        }, 1500);
    }
    
    dispose() {
        this.gateMeshes.forEach(mesh => {
            this.game.scene.remove(mesh);
            mesh.geometry.dispose();
            mesh.material.dispose();
        });
        this.gates = [];
        this.gateMeshes = [];
    }
}

// ============================================
// Enemy Manager
// ============================================

class EnemyManager {
    constructor(game) {
        this.game = game;
        this.count = 0;
        this.position = new THREE.Vector3(0, 0, 100);
        this.units = [];
        
        // Create instanced mesh for enemy
        this.geometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
        this.material = new THREE.MeshStandardMaterial({ color: 0xef4444 });
        this.instancedMesh = new THREE.InstancedMesh(
            this.geometry,
            this.material,
            1000
        );
        this.instancedMesh.castShadow = true;
        this.game.scene.add(this.instancedMesh);
    }
    
    createEnemy(level) {
        const baseCount = 30 + level * 20;
        this.count = baseCount;
        
        for (let i = 0; i < this.count; i++) {
            this.units.push({
                offset: new THREE.Vector3(
                    (Math.random() - 0.5) * 3,
                    0,
                    (Math.random() - 0.5) * 3
                ),
                bobPhase: Math.random() * Math.PI * 2
            });
        }
        
        this.updateInstancedMesh();
    }
    
    removeUnits(count) {
        const removed = Math.min(count, this.count);
        this.count -= removed;
        
        for (let i = 0; i < removed; i++) {
            this.units.pop();
        }
        
        this.updateInstancedMesh();
    }
    
    updateInstancedMesh() {
        const matrix = new THREE.Matrix4();
        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3(1, 1, 1);
        
        this.units.forEach((unit, i) => {
            position.set(
                unit.offset.x,
                unit.offset.y + Math.sin(Date.now() * 0.005 + unit.bobPhase) * 0.1,
                unit.offset.z
            );
            quaternion.setFromEuler(new THREE.Euler(0, 0, 0));
            matrix.compose(position, quaternion, scale);
            this.instancedMesh.setMatrixAt(i, matrix);
        });
        
        this.instancedMesh.instanceMatrix.needsUpdate = true;
        this.instancedMesh.count = this.units.length;
    }
    
    update() {
        this.instancedMesh.position.copy(this.position);
        this.updateInstancedMesh();
    }
    
    dispose() {
        this.game.scene.remove(this.instancedMesh);
        this.instancedMesh.geometry.dispose();
        this.instancedMesh.material.dispose();
    }
}

// ============================================
// Player Controller
// ============================================

class PlayerController {
    constructor(game) {
        this.game = game;
        this.targetX = 0;
        this.currentX = 0;
        this.moveSpeed = 0.15;
        
        this.setupControls();
    }
    
    setupControls() {
        // Touch controls
        let touchStartX = 0;
        let touchCurrentX = 0;
        let isTouching = false;
        
        document.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchCurrentX = touchStartX;
            isTouching = true;
        });
        
        document.addEventListener('touchmove', (e) => {
            if (!isTouching) return;
            touchCurrentX = e.touches[0].clientX;
            const deltaX = touchCurrentX - touchStartX;
            this.targetX = (deltaX / window.innerWidth) * 20;
            this.targetX = Math.max(-10, Math.min(10, this.targetX));
        });
        
        document.addEventListener('touchend', () => {
            isTouching = false;
            this.targetX = 0;
        });
        
        // Mouse controls
        let mouseDown = false;
        let mouseStartX = 0;
        
        document.addEventListener('mousedown', (e) => {
            mouseDown = true;
            mouseStartX = e.clientX;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!mouseDown) return;
            const deltaX = e.clientX - mouseStartX;
            this.targetX = (deltaX / window.innerWidth) * 20;
            this.targetX = Math.max(-10, Math.min(10, this.targetX));
        });
        
        document.addEventListener('mouseup', () => {
            mouseDown = false;
            this.targetX = 0;
        });
        
        // Keyboard controls
        const keys = {};
        
        document.addEventListener('keydown', (e) => {
            keys[e.key] = true;
            this.updateKeyboardTarget(keys);
        });
        
        document.addEventListener('keyup', (e) => {
            keys[e.key] = false;
            this.updateKeyboardTarget(keys);
        });
    }
    
    updateKeyboardTarget(keys) {
        if (keys['ArrowLeft'] || keys['a'] || keys['A']) {
            this.targetX = -5;
        } else if (keys['ArrowRight'] || keys['d'] || keys['D']) {
            this.targetX = 5;
        } else {
            this.targetX = 0;
        }
    }
    
    update() {
        if (!this.game.crowdManager) return;
        
        // Smooth movement
        this.currentX += (this.targetX - this.currentX) * this.moveSpeed;
        this.game.crowdManager.position.x = this.currentX;
    }
}

// ============================================
// Audio Manager
// ============================================

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.soundEnabled = true;
        this.initAudio();
    }
    
    initAudio() {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    
    toggleSound(enabled) {
        this.soundEnabled = enabled;
    }
    
    playSound(type) {
        if (!this.soundEnabled || !this.audioContext) return;
        
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        switch (type) {
            case 'gate':
                oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.2);
                break;
                
            case 'battle':
                oscillator.type = 'sawtooth';
                oscillator.frequency.setValueAtTime(200, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
                break;
                
            case 'victory':
                oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.3);
                gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
                break;
                
            case 'defeat':
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(400, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(100, this.audioContext.currentTime + 0.5);
                gainNode.gain.setValueAtTime(0.4, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);
                oscillator.start(this.audioContext.currentTime);
                oscillator.stop(this.audioContext.currentTime + 0.5);
                break;
        }
    }
}

// ============================================
// Environment Setup
// ============================================

class Environment {
    constructor(game) {
        this.game = game;
        this.createRoad();
        this.createDecorations();
    }
    
    createRoad() {
        // Road
        const roadGeometry = new THREE.PlaneGeometry(20, 200);
        const roadMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x64748b,
            roughness: 0.8
        });
        const road = new THREE.Mesh(roadGeometry, roadMaterial);
        road.rotation.x = -Math.PI / 2;
        road.position.set(0, 0, 50);
        road.receiveShadow = true;
        this.game.scene.add(road);
        
        // Road lines
        const lineGeometry = new THREE.PlaneGeometry(0.5, 200);
        const lineMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xfbbf24,
            roughness: 0.5
        });
        
        const leftLine = new THREE.Mesh(lineGeometry, lineMaterial);
        leftLine.rotation.x = -Math.PI / 2;
        leftLine.position.set(-5, 0.01, 50);
        this.game.scene.add(leftLine);
        
        const rightLine = new THREE.Mesh(lineGeometry, lineMaterial);
        rightLine.rotation.x = -Math.PI / 2;
        rightLine.position.set(5, 0.01, 50);
        this.game.scene.add(rightLine);
    }
    
    createDecorations() {
        // Create random rocks and cacti
        for (let i = 0; i < 20; i++) {
            const x = (Math.random() - 0.5) * 40;
            const z = Math.random() * 150;
            
            if (Math.abs(x) < 10) continue; // Don't place on road
            
            if (Math.random() > 0.5) {
                this.createRock(x, z);
            } else {
                this.createCactus(x, z);
            }
        }
    }
    
    createRock(x, z) {
        const geometry = new THREE.DodecahedronGeometry(Math.random() * 1 + 0.5);
        const material = new THREE.MeshStandardMaterial({ color: 0x78716c });
        const rock = new THREE.Mesh(geometry, material);
        rock.position.set(x, 0, z);
        rock.castShadow = true;
        rock.receiveShadow = true;
        this.game.scene.add(rock);
    }
    
    createCactus(x, z) {
        const geometry = new THREE.CylinderGeometry(0.3, 0.4, 3, 8);
        const material = new THREE.MeshStandardMaterial({ color: 0x22c55e });
        const cactus = new THREE.Mesh(geometry, material);
        cactus.position.set(x, 1.5, z);
        cactus.castShadow = true;
        cactus.receiveShadow = true;
        this.game.scene.add(cactus);
    }
}

// ============================================
// Initialize Game
// ============================================

window.addEventListener('DOMContentLoaded', () => {
    const game = new GameManager();
    game.audioManager = new AudioManager();
    
    // Create environment
    const environment = new Environment(game);
    
    // Expose game for debugging
    window.game = game;
});
