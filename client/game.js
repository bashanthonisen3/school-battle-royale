/**
 * School Battle Royale - Main Game Client
 * Three.js Game Engine with Socket.IO Multiplayer Integration
 */

class GameEngine {
    constructor() {
        this.gameState = 'menu'; // menu, waiting, playing, dead, victory
        this.playerID = null;
        this.gameMode = null; // solo, duo
        this.matchID = null;
        
        this.socket = io();
        
        // Three.js Setup
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.player = null;
        this.players = {};
        this.lootItems = {};
        
        // Game Stats
        this.xp = 0;
        this.level = 1;
        this.health = 100;
        this.maxHealth = 100;
        this.kills = 0;
        this.deaths = 0;
        
        // Player movement
        this.keys = {};
        this.velocity = new THREE.Vector3();
        this.isJumping = false;
        this.isSprinting = false;
        
        // Physics
        this.gravity = 0.3;
        this.jumpForce = 15;
        this.moveSpeed = 0.15;
        this.sprintSpeed = 0.25;
        
        this.init();
    }
    
    /**
     * Initialize the game
     */
    init() {
        this.setupThreeJS();
        this.setupEventListeners();
        this.setupSocketIO();
        this.createScene();
        this.animate();
    }
    
    /**
     * Setup Three.js scene, camera, renderer
     */
    setupThreeJS() {
        const container = document.getElementById('gameContainer');
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0e27);
        this.scene.fog = new THREE.Fog(0x0a0e27, 500, 1500);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 5000);
        this.camera.position.set(0, 1.7, 0);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(width, height);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFShadowShadowMap;
        container.appendChild(this.renderer.domElement);
        
        // Resize handler
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Create the game scene (school map)
     */
    createScene() {
        // Lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        // Neon lights
        const blueLight = new THREE.PointLight(0x00d4ff, 1, 200);
        blueLight.position.set(100, 50, 100);
        this.scene.add(blueLight);
        
        const redLight = new THREE.PointLight(0xff0066, 1, 200);
        redLight.position.set(-100, 50, -100);
        this.scene.add(redLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -500;
        directionalLight.shadow.camera.right = 500;
        directionalLight.shadow.camera.top = 500;
        directionalLight.shadow.camera.bottom = -500;
        this.scene.add(directionalLight);
        
        // Ground
        const groundGeometry = new THREE.PlaneGeometry(500, 500);
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x1a1f3a,
            roughness: 0.8,
            metalness: 0.2
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // School Buildings
        this.createBuilding(-100, 0, -100, 50, 30, 50, 0x2a2f4a);
        this.createBuilding(100, 0, -100, 50, 40, 50, 0x2a2f4a);
        this.createBuilding(0, 0, 100, 50, 35, 50, 0x2a2f4a);
        
        // Basketball court
        this.createBasketballCourt(-80, 0, 0);
        
        // Mirror customization area
        this.createMirrorArea(80, 0, 0);
        
        // Quest board
        this.createQuestBoard(0, 0, -80);
        
        // Loot spawn points
        this.spawnLoot();
    }
    
    /**
     * Create a building in the scene
     */
    createBuilding(x, y, z, width, height, depth, color) {
        const geometry = new THREE.BoxGeometry(width, height, depth);
        const material = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.7,
            metalness: 0.3
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(x, y + height / 2, z);
        building.castShadow = true;
        building.receiveShadow = true;
        this.scene.add(building);
        
        // Windows
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                const windowGeom = new THREE.BoxGeometry(8, 8, 2);
                const windowMat = new THREE.MeshStandardMaterial({
                    color: 0x00d4ff,
                    emissive: 0x00d4ff,
                    emissiveIntensity: 0.5
                });
                const windowMesh = new THREE.Mesh(windowGeom, windowMat);
                windowMesh.position.set(
                    x - width / 3 + i * 15,
                    y + height / 2 + 5,
                    z + depth / 2 + 2
                );
                this.scene.add(windowMesh);
            }
        }
    }
    
    /**
     * Create basketball court
     */
    createBasketballCourt(x, y, z) {
        // Court
        const courtGeom = new THREE.PlaneGeometry(40, 40);
        const courtMat = new THREE.MeshStandardMaterial({ color: 0xff6600 });
        const court = new THREE.Mesh(courtGeom, courtMat);
        court.position.set(x, y + 0.1, z);
        court.rotation.x = -Math.PI / 2;
        court.receiveShadow = true;
        this.scene.add(court);
        
        // Hoop
        const rimGeom = new THREE.TorusGeometry(1.5, 0.2, 16, 8);
        const rimMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff });
        const rim = new THREE.Mesh(rimGeom, rimMat);
        rim.position.set(x, y + 10, z);
        rim.rotation.y = Math.PI / 4;
        rim.castShadow = true;
        this.scene.add(rim);
        
        // Backboard
        const backboardGeom = new THREE.BoxGeometry(5, 8, 0.5);
        const backboardMat = new THREE.MeshStandardMaterial({ 
            color: 0xff0066,
            emissive: 0xff0066,
            emissiveIntensity: 0.3
        });
        const backboard = new THREE.Mesh(backboardGeom, backboardMat);
        backboard.position.set(x, y + 10, z - 2);
        backboard.castShadow = true;
        this.scene.add(backboard);
        
        // Post
        const postGeom = new THREE.CylinderGeometry(0.5, 0.5, 10, 16);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x444444 });
        const post = new THREE.Mesh(postGeom, postMat);
        post.position.set(x - 15, y + 5, z);
        post.castShadow = true;
        this.scene.add(post);
    }
    
    /**
     * Create mirror customization area
     */
    createMirrorArea(x, y, z) {
        const mirrorGeom = new THREE.BoxGeometry(20, 30, 0.5);
        const mirrorMat = new THREE.MeshStandardMaterial({
            color: 0xb700ff,
            emissive: 0xb700ff,
            emissiveIntensity: 0.4,
            metalness: 0.8,
            roughness: 0.2
        });
        const mirror = new THREE.Mesh(mirrorGeom, mirrorMat);
        mirror.position.set(x, y + 15, z);
        mirror.castShadow = true;
        this.scene.add(mirror);
        
        // Frame
        const frameGeom = new THREE.BoxGeometry(22, 32, 1);
        const frameMat = new THREE.MeshStandardMaterial({
            color: 0x00d4ff,
            emissive: 0x00d4ff,
            emissiveIntensity: 0.3
        });
        const frame = new THREE.Mesh(frameGeom, frameMat);
        frame.position.set(x, y + 15, z - 1);
        frame.castShadow = true;
        this.scene.add(frame);
    }
    
    /**
     * Create quest board
     */
    createQuestBoard(x, y, z) {
        // Board
        const boardGeom = new THREE.BoxGeometry(15, 20, 0.5);
        const boardMat = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
        const board = new THREE.Mesh(boardGeom, boardMat);
        board.position.set(x, y + 10, z);
        board.castShadow = true;
        this.scene.add(board);
        
        // Post
        const postGeom = new THREE.CylinderGeometry(1, 1, 12, 16);
        const postMat = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const post = new THREE.Mesh(postGeom, postMat);
        post.position.set(x, y + 6, z);
        post.castShadow = true;
        this.scene.add(post);
    }
    
    /**
     * Spawn loot items
     */
    spawnLoot() {
        const lootPositions = [
            [-50, 1, -50], [50, 1, -50], [-50, 1, 50], [50, 1, 50],
            [0, 1, 0], [-100, 1, 0], [100, 1, 0], [0, 1, -100]
        ];
        
        lootPositions.forEach((pos, idx) => {
            this.createLootItem(`loot-${idx}`, pos[0], pos[1], pos[2]);
        });
    }
    
    /**
     * Create a loot item
     */
    createLootItem(id, x, y, z) {
        const geometry = new THREE.BoxGeometry(1, 1, 1);
        const material = new THREE.MeshStandardMaterial({
            color: 0x39ff14,
            emissive: 0x39ff14,
            emissiveIntensity: 0.5
        });
        const loot = new THREE.Mesh(geometry, material);
        loot.position.set(x, y, z);
        loot.castShadow = true;
        
        // Rotation animation
        loot.userData = {
            isLoot: true,
            rotation: Math.random() * Math.PI * 2,
            rotationSpeed: 0.03
        };
        
        this.scene.add(loot);
        this.lootItems[id] = loot;
    }
    
    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Menu buttons
        document.getElementById('soloBtn').addEventListener('click', () => this.startGame('solo'));
        document.getElementById('duoBtn').addEventListener('click', () => this.startGame('duo'));
        document.getElementById('cancelSearchBtn').addEventListener('click', () => this.cancelSearch());
        document.getElementById('respawnBtn').addEventListener('click', () => this.respawn());
        document.getElementById('playAgainBtn').addEventListener('click', () => this.respawn());
        document.getElementById('mainMenuBtn').addEventListener('click', () => this.goToMenu());
        document.getElementById('mainMenuBtn2').addEventListener('click', () => this.goToMenu());
        
        // Keyboard input
        window.addEventListener('keydown', (e) => this.onKeyDown(e));
        window.addEventListener('keyup', (e) => this.onKeyUp(e));
        
        // Mouse input
        document.addEventListener('mousemove', (e) => this.onMouseMove(e));
        document.addEventListener('click', (e) => this.onMouseClick(e));
        
        // Window resize
        window.addEventListener('resize', () => this.onWindowResize());
    }
    
    /**
     * Setup Socket.IO events
     */
    setupSocketIO() {
        this.socket.on('connect', () => {
            console.log('Connected to server');
        });
        
        this.socket.on('playerJoined', (data) => {
            console.log('Player joined:', data);
            if (data.playerID !== this.playerID) {
                this.addRemotePlayer(data);
            }
        });
        
        this.socket.on('playerMoved', (data) => {
            if (data.playerID !== this.playerID && this.players[data.playerID]) {
                this.updateRemotePlayerPosition(data);
            }
        });
        
        this.socket.on('lootCollected', (data) => {
            if (this.lootItems[data.lootID]) {
                this.removeLoot(data.lootID);
            }
        });
        
        this.socket.on('matchStarted', (data) => {
            this.showHUD();
            this.addNotification('MATCH STARTED!');
        });
        
        this.socket.on('playerEliminated', (data) => {
            if (data.playerID === this.playerID) {
                this.onPlayerDeath(data);
            } else if (this.players[data.playerID]) {
                this.removeRemotePlayer(data.playerID);
            }
        });
        
        this.socket.on('matchEnded', (data) => {
            this.onMatchEnd(data);
        });
        
        this.socket.on('playersUpdate', (data) => {
            document.getElementById('playersAlive').textContent = `Players: ${data.playersAlive}`;
        });
    }
    
    /**
     * Start game
     */
    startGame(mode) {
        this.gameMode = mode;
        this.playerID = this.generatePlayerID();
        
        document.getElementById('mainMenu').classList.add('hidden');
        document.getElementById('waitingPanel').classList.remove('hidden');
        
        this.socket.emit('joinGame', {
            playerID: this.playerID,
            mode: mode,
            playerName: `Player ${Math.floor(Math.random() * 10000)}`
        });
        
        // Simulate player count increase
        let playerCount = 1;
        const interval = setInterval(() => {
            playerCount++;
            document.getElementById('playerCount').textContent = `Players Found: ${playerCount}/50`;
            if (playerCount >= 50) {
                clearInterval(interval);
                this.matchStart();
            }
        }, 300);
    }
    
    /**
     * Match start
     */
    matchStart() {
        this.gameState = 'playing';
        document.getElementById('waitingPanel').classList.add('hidden');
        document.getElementById('hud').classList.remove('hidden');
        
        this.socket.emit('matchReady', { playerID: this.playerID });
    }
    
    /**
     * Cancel search
     */
    cancelSearch() {
        document.getElementById('mainMenu').classList.remove('hidden');
        document.getElementById('waitingPanel').classList.add('hidden');
        
        this.socket.emit('leaveGame', { playerID: this.playerID });
    }
    
    /**
     * Go to main menu
     */
    goToMenu() {
        this.gameState = 'menu';
        document.getElementById('mainMenu').classList.remove('hidden');
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('deathScreen').classList.add('hidden');
        document.getElementById('victoryScreen').classList.add('hidden');
        
        // Reset stats
        this.xp = 0;
        this.health = 100;
        this.kills = 0;
        this.deaths = 0;
        this.level = 1;
    }
    
    /**
     * Handle player death
     */
    onPlayerDeath(data) {
        this.gameState = 'dead';
        this.deaths++;
        document.getElementById('hud').classList.add('hidden');
        document.getElementById('deathScreen').classList.remove('hidden');
        
        document.getElementById('deathRank').textContent = data.rank || 50;
        document.getElementById('deathKills').textContent = this.kills;
        document.getElementById('deathXP').textContent = this.xp;
    }
    
    /**
     * Handle match end
     */
    onMatchEnd(data) {
        if (data.winner === this.playerID) {
            this.gameState = 'victory';
            document.getElementById('hud').classList.add('hidden');
            document.getElementById('victoryScreen').classList.remove('hidden');
            
            const bonusXP = 1000;
            document.getElementById('victoryXP').textContent = this.xp;
            document.getElementById('bonusXP').textContent = bonusXP;
            document.getElementById('victoryKills').textContent = this.kills;
        }
    }
    
    /**
     * Respawn player
     */
    respawn() {
        this.startGame(this.gameMode);
    }
    
    /**
     * Add remote player
     */
    addRemotePlayer(data) {
        const playerGeom = new THREE.BoxGeometry(1, 1.8, 1);
        const playerMat = new THREE.MeshStandardMaterial({
            color: Math.random() * 0xffffff,
            roughness: 0.5
        });
        const playerMesh = new THREE.Mesh(playerGeom, playerMat);
        playerMesh.position.set(data.x || 0, data.y || 1, data.z || 0);
        playerMesh.castShadow = true;
        this.scene.add(playerMesh);
        
        this.players[data.playerID] = {
            mesh: playerMesh,
            position: new THREE.Vector3(data.x || 0, data.y || 1, data.z || 0),
            name: data.playerName
        };
    }
    
    /**
     * Update remote player position
     */
    updateRemotePlayerPosition(data) {
        if (this.players[data.playerID]) {
            this.players[data.playerID].position.set(data.x, data.y, data.z);
            this.players[data.playerID].mesh.position.lerp(
                this.players[data.playerID].position,
                0.1
            );
        }
    }
    
    /**
     * Remove remote player
     */
    removeRemotePlayer(playerID) {
        if (this.players[playerID]) {
            this.scene.remove(this.players[playerID].mesh);
            delete this.players[playerID];
        }
    }
    
    /**
     * Remove loot item
     */
    removeLoot(lootID) {
        if (this.lootItems[lootID]) {
            this.scene.remove(this.lootItems[lootID]);
            delete this.lootItems[lootID];
        }
    }
    
    /**
     * Add XP
     */
    addXP(amount) {
        this.xp += amount;
        this.updateXPDisplay();
        this.addNotification(`+${amount} XP`);
        
        // Check level up
        const levelThreshold = this.level * 1000;
        if (this.xp >= levelThreshold) {
            this.levelUp();
        }
    }
    
    /**
     * Level up
     */
    levelUp() {
        this.level++;
        this.addNotification(`LEVEL ${this.level}!`);
        document.getElementById('levelDisplay').textContent = `LEVEL ${this.level}`;
    }
    
    /**
     * Update XP display
     */
    updateXPDisplay() {
        const levelThreshold = this.level * 1000;
        const percentage = (this.xp % levelThreshold) / levelThreshold * 100;
        document.getElementById('xpFill').style.width = percentage + '%';
        document.getElementById('xpText').textContent = `${this.xp % levelThreshold} / ${levelThreshold} XP`;
    }
    
    /**
     * Update health display
     */
    updateHealthDisplay() {
        const percentage = (this.health / this.maxHealth) * 100;
        document.getElementById('healthFill').style.width = percentage + '%';
        document.getElementById('healthText').textContent = `${this.health} / ${this.maxHealth} HP`;
    }
    
    /**
     * Add notification
     */
    addNotification(text) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = text;
        document.getElementById('notifications').appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }
    
    /**
     * Show HUD
     */
    showHUD() {
        document.getElementById('hud').classList.remove('hidden');
        document.getElementById('modeDisplay').textContent = this.gameMode.toUpperCase();
        this.updateHealthDisplay();
        this.updateXPDisplay();
    }
    
    /**
     * Handle keyboard down
     */
    onKeyDown(e) {
        this.keys[e.key.toLowerCase()] = true;
        
        if (e.key === ' ') {
            e.preventDefault();
            this.jump();
        }
        
        if (e.key.toLowerCase() === 'shift') {
            this.isSprinting = true;
        }
        
        if (e.key.toLowerCase() === 'e') {
            this.interact();
        }
    }
    
    /**
     * Handle keyboard up
     */
    onKeyUp(e) {
        this.keys[e.key.toLowerCase()] = false;
        
        if (e.key.toLowerCase() === 'shift') {
            this.isSprinting = false;
        }
    }
    
    /**
     * Handle mouse move
     */
    onMouseMove(e) {
        if (this.gameState === 'playing' && this.camera) {
            // Optional: Implement mouse look
        }
    }
    
    /**
     * Handle mouse click
     */
    onMouseClick(e) {
        if (this.gameState === 'playing') {
            this.attack();
        }
    }
    
    /**
     * Jump
     */
    jump() {
        if (!this.isJumping && this.gameState === 'playing') {
            this.velocity.y = this.jumpForce;
            this.isJumping = true;
        }
    }
    
    /**
     * Attack
     */
    attack() {
        this.addNotification('ATTACK!');
        this.addXP(10);
    }
    
    /**
     * Interact
     */
    interact() {
        this.addXP(25);
        this.addNotification('Item collected!');
    }
    
    /**
     * Update player movement
     */
    updateMovement() {
        if (this.gameState !== 'playing') return;
        
        const moveSpeed = this.isSprinting ? this.sprintSpeed : this.moveSpeed;
        const moveDirection = new THREE.Vector3();
        
        if (this.keys['w']) moveDirection.z -= moveSpeed;
        if (this.keys['a']) moveDirection.x -= moveSpeed;
        if (this.keys['s']) moveDirection.z += moveSpeed;
        if (this.keys['d']) moveDirection.x += moveSpeed;
        
        // Apply gravity
        this.velocity.y -= this.gravity;
        
        // Update camera position
        this.camera.position.add(moveDirection);
        this.camera.position.y += this.velocity.y;
        
        // Ground collision
        if (this.camera.position.y <= 1.7) {
            this.camera.position.y = 1.7;
            this.velocity.y = 0;
            this.isJumping = false;
        }
        
        // Send position to server
        if (moveDirection.length() > 0 || this.velocity.y !== 0) {
            this.socket.emit('playerMoved', {
                playerID: this.playerID,
                x: this.camera.position.x,
                y: this.camera.position.y,
                z: this.camera.position.z
            });
        }
    }
    
    /**
     * Update loot rotation
     */
    updateLootRotation() {
        Object.values(this.lootItems).forEach(loot => {
            if (loot.userData.isLoot) {
                loot.userData.rotation += loot.userData.rotationSpeed;
                loot.rotation.y = loot.userData.rotation;
                loot.position.y += Math.sin(Date.now() * 0.003) * 0.01;
            }
        });
    }
    
    /**
     * Animation loop
     */
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.updateMovement();
        this.updateLootRotation();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    /**
     * Handle window resize
     */
    onWindowResize() {
        const width = window.innerWidth;
        const height = window.innerHeight;
        
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(width, height);
    }
    
    /**
     * Generate unique player ID
     */
    generatePlayerID() {
        return `player-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Initialize game when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.gameEngine = new GameEngine();
    });
} else {
    window.gameEngine = new GameEngine();
}
