import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Inisialisasi database
export let playersDB;
export let monstersDB;

export function initializeDatabase() {
    // Buat folder data jika belum ada
    const dataDir = join(__dirname, '..', 'data');
    if (!existsSync(dataDir)) {
        mkdirSync(dataDir, { recursive: true });
    }

    // Database pemain
    const playersFile = join(dataDir, 'players.json');
    const playersAdapter = new JSONFile(playersFile);
    playersDB = new Low(playersAdapter);
    
    // Database monster
    const monstersFile = join(dataDir, 'monsters.json');
    const monstersAdapter = new JSONFile(monstersFile);
    monstersDB = new Low(monstersAdapter);
    
    // Inisialisasi data default
    initializeDefaultData();
}

async function initializeDefaultData() {
    // Inisialisasi data pemain
    await playersDB.read();
    playersDB.data ||= { players: [] };
    await playersDB.write();
    
    // Inisialisasi data monster
    await monstersDB.read();
    if (!monstersDB.data || !monstersDB.data.monsters) {
        monstersDB.data = {
            monsters: [
                {
                    id: 1,
                    name: "Goblin",
                    level: 1,
                    health: 30,
                    attack: 8,
                    defense: 3,
                    gold: 10,
                    xp: 15
                },
                {
                    id: 2,
                    name: "Orc",
                    level: 2,
                    health: 50,
                    attack: 12,
                    defense: 6,
                    gold: 20,
                    xp: 30
                },
                {
                    id: 3,
                    name: "Wolf",
                    level: 1,
                    health: 25,
                    attack: 10,
                    defense: 2,
                    gold: 8,
                    xp: 12
                },
                {
                    id: 4,
                    name: "Skeleton",
                    level: 3,
                    health: 40,
                    attack: 15,
                    defense: 4,
                    gold: 25,
                    xp: 40
                },
                {
                    id: 5,
                    name: "Dragon",
                    level: 10,
                    health: 200,
                    attack: 30,
                    defense: 15,
                    gold: 100,
                    xp: 200
                }
            ]
        };
        await monstersDB.write();
    }
}

// Fungsi helper untuk database
export async function getPlayer(userId) {
    await playersDB.read();
    return playersDB.data.players.find(p => p.id === userId);
}

export async function savePlayer(player) {
    await playersDB.read();
    const index = playersDB.data.players.findIndex(p => p.id === player.id);
    
    if (index !== -1) {
        playersDB.data.players[index] = player;
    } else {
        playersDB.data.players.push(player);
    }
    
    await playersDB.write();
}

export async function getRandomMonster(level = 1) {
    await monstersDB.read();
    const availableMonsters = monstersDB.data.monsters.filter(m => m.level <= level + 2);
    
    if (availableMonsters.length === 0) {
        return monstersDB.data.monsters[0];
    }
    
    const randomIndex = Math.floor(Math.random() * availableMonsters.length);
    return { ...availableMonsters[randomIndex] };
}