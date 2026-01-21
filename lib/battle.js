import { getRandomMonster } from './database.js';

export class BattleSystem {
    constructor(player, monster) {
        this.player = player;
        this.monster = monster;
        this.battleLog = [];
        this.isPlayerTurn = Math.random() > 0.5;
        this.round = 0;
    }
    
    playerAttack() {
        const damage = Math.floor(this.player.attack * (0.8 + Math.random() * 0.4));
        const actualDamage = Math.max(1, damage - this.monster.defense);
        this.monster.health -= actualDamage;
        
        this.battleLog.push(`⚔️ ${this.player.name} menyerang ${this.monster.name} dan menyebabkan ${actualDamage} damage!`);
        
        return {
            damage: actualDamage,
            isMonsterDead: this.monster.health <= 0
        };
    }
    
    monsterAttack() {
        const damage = Math.floor(this.monster.attack * (0.8 + Math.random() * 0.4));
        const actualDamage = this.player.takeDamage(damage);
        
        this.battleLog.push(`👹 ${this.monster.name} menyerang ${this.player.name} dan menyebabkan ${actualDamage} damage!`);
        
        return {
            damage: actualDamage,
            isPlayerDead: this.player.health <= 0
        };
    }
    
    async battleRound() {
        this.round++;
        
        if (this.isPlayerTurn) {
            const result = this.playerAttack();
            this.isPlayerTurn = false;
            
            if (result.isMonsterDead) {
                return await this.endBattle(true);
            }
        } else {
            const result = this.monsterAttack();
            this.isPlayerTurn = true;
            
            if (result.isPlayerDead) {
                return await this.endBattle(false);
            }
        }
        
        return {
            completed: false,
            round: this.round,
            playerHealth: this.player.health,
            monsterHealth: this.monster.health,
            log: this.battleLog[this.battleLog.length - 1]
        };
    }
    
    async endBattle(playerWon) {
        let rewards = {};
        
        if (playerWon) {
            // Player menang
            const xpGain = this.monster.xp;
            const goldGain = this.monster.gold;
            
            this.player.addXP(xpGain);
            this.player.addGold(goldGain);
            
            // Chance untuk mendapatkan item
            const itemChance = Math.random();
            let itemDrop = null;
            
            if (itemChance > 0.7) {
                const items = [
                    { name: "Potion", type: "heal", value: 30 },
                    { name: "Attack Potion", type: "buff", value: 5 },
                    { name: "Defense Potion", type: "buff", value: 3 }
                ];
                itemDrop = items[Math.floor(Math.random() * items.length)];
                
                if (this.player.addItem(itemDrop)) {
                    this.battleLog.push(`🎁 Kamu menemukan ${itemDrop.name}!`);
                }
            }
            
            rewards = {
                xp: xpGain,
                gold: goldGain,
                item: itemDrop
            };
            
            this.battleLog.push(`\n🎉 *KAMU MENANG!*`);
            this.battleLog.push(`✨ +${xpGain} XP`);
            this.battleLog.push(`💰 +${goldGain} Gold`);
            
            if (this.player.xp >= this.player.level * 100) {
                const levelUp = this.player.levelUp();
                this.battleLog.push(`\n⭐ *LEVEL UP!* Level ${this.player.level - 1} → ${this.player.level}`);
                this.battleLog.push(`❤️ Health +${levelUp.healthIncrease}`);
                this.battleLog.push(`⚔️ Attack +${levelUp.attackIncrease}`);
                this.battleLog.push(`🛡️ Defense +${levelUp.defenseIncrease}`);
            }
        } else {
            // Player kalah
            const goldLost = Math.floor(this.player.gold * 0.2);
            this.player.gold = Math.max(0, this.player.gold - goldLost);
            this.player.health = Math.floor(this.player.maxHealth * 0.3); // Reset health to 30%
            
            rewards = {
                goldLost: goldLost
            };
            
            this.battleLog.push(`\n💀 *KAMU KALAH!*`);
            this.battleLog.push(`💸 -${goldLost} Gold`);
            this.battleLog.push(`🏥 Health dipulihkan ke 30%`);
        }
        
        this.player.lastBattle = new Date().toISOString();
        
        return {
            completed: true,
            playerWon: playerWon,
            round: this.round,
            rewards: rewards,
            log: this.battleLog.join('\n')
        };
    }
}

export async function startBattle(player) {
    const monster = await getRandomMonster(player.level);
    return new BattleSystem(player, monster);
}
