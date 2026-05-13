/**
 * School Battle Royale - Multiplayer Game Logic
 * Handles player joining, movement sync, and game state
 */

const { v4: uuidv4 } = require('uuid');

/**
 * Game Match Class
 */
class GameMatch {
    constructor(matchID, mode) {
        this.matchID = matchID;
        this.mode = mode; // solo, duo
        this.players = {};
        this.maxPlayers = 50;
        this.startTime = null;
        this.status = 'waiting'; // waiting, active, ended
        this.playersAlive = 0;
        this.loot = {};
        this.initializeLoot();
    }
    
    /**
     * Initialize loot items
     */
    initializeLoot() {
        const lootCount = 20;
        for (let i = 0; i < lootCount; i++) {
            this.loot[`loot-${i}`] = {
                id: `loot-${i}`,
                x: (Math.random() - 0.5) * 400,
                y: 1,
                z: (Math.random() - 0.5) * 400,
                type: ['book', 'potion', 'weapon'][Math.floor(Math.random() * 3)],
                collected: false
            };
        }
    }
    
    /**
     * Add player to match
     */
    addPlayer(playerID, playerData) {
        this.players[playerID] = {
            id: playerID,
            name: playerData.name,
            socket: playerData.socket,
            x: (Math.random() - 0.5) * 400,
            y: 1,
            z: (Math.random() - 0.5) * 400,
            xp: 0,
            health: 100,
            kills: 0,
            eliminated: false,
            team: playerData.team || null
        };
        this.playersAlive = Object.keys(this.players).length;
        return this.players[playerID];
    }
    
    /**
     * Remove player from match
     */
    removePlayer(playerID) {
        if (this.players[playerID]) {
            delete this.players[playerID];
            this.playersAlive = Object.keys(this.players).length;
        }
    }
    
    /**
     * Update player position
     */
    updatePlayerPosition(playerID, x, y, z) {
        if (this.players[playerID]) {
            this.players[playerID].x = x;
            this.players[playerID].y = y;
            this.players[playerID].z = z;
        }
    }
    
    /**
     * Eliminate player
     */
    eliminatePlayer(playerID, killedBy = null) {
        if (this.players[playerID]) {
            this.players[playerID].eliminated = true;
            if (killedBy && this.players[killedBy]) {
                this.players[killedBy].kills++;
            }
            this.playersAlive = Object.keys(this.players).filter(id => !this.players[id].eliminated).length;
        }
    }
    
    /**
     * Get match data
     */
    getMatchData() {
        return {
            matchID: this.matchID,
            mode: this.mode,
            status: this.status,
            playersAlive: this.playersAlive,
            totalPlayers: Object.keys(this.players).length,
            players: this.players
        };
    }
}

/**
 * Game Manager Class
 */
class GameManager {
    constructor(io) {
        this.io = io;
        this.matches = {};
        this.waitingQueues = {
            solo: [],
            duo: []
        };
        this.playerToMatch = {};
        this.playerSockets = {};
        
        // Start match creation interval
        this.startMatchMaker();
    }
    
    /**
     * Player joins game
     */
    playerJoin(socket, data) {
        const { playerID, mode, playerName } = data;
        
        console.log(`[JOIN] Player ${playerID} joining ${mode} mode`);
        
        this.playerSockets[playerID] = socket;
        this.waitingQueues[mode].push({
            playerID,
            socket,
            name: playerName,
            timestamp: Date.now()
        });
        
        // Emit joined confirmation
        socket.emit('gameJoined', {
            playerID,
            message: `Searching for ${mode} match...`
        });
    }
    
    /**
     * Player leaves game
     */
    playerLeave(playerID) {
        console.log(`[LEAVE] Player ${playerID} leaving`);
        
        // Remove from waiting queue
        ['solo', 'duo'].forEach(mode => {
            this.waitingQueues[mode] = this.waitingQueues[mode].filter(p => p.playerID !== playerID);
        });
        
        // Remove from active match
        if (this.playerToMatch[playerID]) {
            const matchID = this.playerToMatch[playerID];
            const match = this.matches[matchID];
            if (match) {
                match.removePlayer(playerID);
                this.broadcastMatchUpdate(matchID);
            }
            delete this.playerToMatch[playerID];
        }
        
        delete this.playerSockets[playerID];
    }
    
    /**
     * Player disconnect
     */
    playerDisconnect(socketID) {
        console.log(`[DISCONNECT] Socket ${socketID}`);
        
        // Find and remove player
        Object.keys(this.playerSockets).forEach(playerID => {
            if (this.playerSockets[playerID].id === socketID) {
                this.playerLeave(playerID);
            }
        });
    }
    
    /**
     * Match maker - creates matches when enough players are waiting
     */
    startMatchMaker() {
        setInterval(() => {
            ['solo', 'duo'].forEach(mode => {
                while (this.waitingQueues[mode].length >= 2) {
                    this.createMatch(mode);
                }
            });
        }, 1000);
    }
    
    /**
     * Create a new match
     */
    createMatch(mode) {
        const matchID = uuidv4();
        const match = new GameMatch(matchID, mode);
        
        console.log(`[MATCH CREATE] ${matchID} (${mode})`);
        
        // Add players from queue
        let maxPlayers = mode === 'solo' ? 50 : 25;
        while (this.waitingQueues[mode].length > 0 && Object.keys(match.players).length < maxPlayers) {
            const playerData = this.waitingQueues[mode].shift();
            const player = match.addPlayer(playerData.playerID, {
                name: playerData.name,
                socket: playerData.socket
            });
            
            this.playerToMatch[playerData.playerID] = matchID;
            
            // Send match start notification
            if (Object.keys(match.players).length >= 10) {
                match.status = 'active';
                match.startTime = Date.now();
                
                playerData.socket.emit('matchStarted', match.getMatchData());
            }
        }
        
        this.matches[matchID] = match;
        this.broadcastMatchUpdate(matchID);
    }
    
    /**
     * Player ready
     */
    playerReady(playerID) {
        const matchID = this.playerToMatch[playerID];
        if (!matchID) return;
        
        const match = this.matches[matchID];
        if (match && match.players[playerID]) {
            match.players[playerID].ready = true;
            console.log(`[READY] Player ${playerID} ready`);
        }
    }
    
    /**
     * Update player position
     */
    updatePlayerPosition(data) {
        const { playerID, x, y, z } = data;
        const matchID = this.playerToMatch[playerID];
        
        if (!matchID || !this.matches[matchID]) return;
        
        const match = this.matches[matchID];
        match.updatePlayerPosition(playerID, x, y, z);
        
        // Broadcast to match
        this.io.to(matchID).emit('playerMoved', {
            playerID,
            x,
            y,
            z
        });
    }
    
    /**
     * Collect loot
     */
    collectLoot(data) {
        const { playerID, lootID, xpReward } = data;
        const matchID = this.playerToMatch[playerID];
        
        if (!matchID || !this.matches[matchID]) return;
        
        const match = this.matches[matchID];
        if (match.loot[lootID]) {
            match.loot[lootID].collected = true;
            
            // Broadcast loot collected
            this.io.to(matchID).emit('lootCollected', { lootID });
            
            // Update player XP
            if (match.players[playerID]) {
                match.players[playerID].xp += xpReward || 25;
            }
        }
    }
    
    /**
     * Player attack
     */
    playerAttack(data) {
        const { playerID, targetID, damage } = data;
        const matchID = this.playerToMatch[playerID];
        
        if (!matchID || !this.matches[matchID]) return;
        
        const match = this.matches[matchID];
        const target = match.players[targetID];
        
        if (target && !target.eliminated) {
            target.health -= damage || 10;
            
            // Broadcast damage
            this.io.to(matchID).emit('playerDamaged', {
                playerID: targetID,
                health: target.health,
                damageDealer: playerID
            });
            
            // Check if eliminated
            if (target.health <= 0) {
                match.eliminatePlayer(targetID, playerID);
                
                this.io.to(matchID).emit('playerEliminated', {
                    playerID: targetID,
                    killedBy: playerID,
                    rank: match.playersAlive + 1
                });
                
                // Check win condition
                if (match.playersAlive === 1) {
                    this.endMatch(matchID);
                }
            }
        }
    }
    
    /**
     * End match
     */
    endMatch(matchID) {
        const match = this.matches[matchID];
        if (!match) return;
        
        match.status = 'ended';
        
        // Find winner
        let winner = null;
        Object.values(match.players).forEach(player => {
            if (!player.eliminated) {
                winner = player.id;
            }
        });
        
        console.log(`[MATCH END] ${matchID} - Winner: ${winner}`);
        
        this.io.to(matchID).emit('matchEnded', {
            matchID,
            winner,
            players: match.players
        });
        
        // Clean up
        setTimeout(() => {
            delete this.matches[matchID];
        }, 5000);
    }
    
    /**
     * Broadcast match update
     */
    broadcastMatchUpdate(matchID) {
        const match = this.matches[matchID];
        if (!match) return;
        
        Object.values(match.players).forEach(player => {
            if (this.playerSockets[player.id]) {
                this.playerSockets[player.id].emit('matchUpdate', match.getMatchData());
            }
        });
    }
}

module.exports = { GameManager, GameMatch };
