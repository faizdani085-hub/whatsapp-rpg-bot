export class Player {
    constructor(id, name, gender, age) {
        this.id = id;
        this.name = name;
        this.gender = gender;
        this.age = age;
        this.level = 1;
        this.xp = 0;
        this.health = 100;
        this.maxHealth = 100;
        this.attack = 10;
        this.defense = 5;
        this.gold = 100;
        this.inventory = [];
        this.lastBattle = null;
        this.createdAt = new Date().toISOString();
    }
    
    addXP(amount) {
        this.xp += amount;
        const xpNeeded = this.level * 100;
        
        if (this.xp >= xpNeeded) {
            this.levelUp();
        }
    }
    
    levelUp() {
        this.level++;
        this.xp = 0;
        this.maxHealth += 20;
        this.health = this.maxHealth;
        this.attack += 5;
        this.defense += 2;
        
        return {
            newLevel: this.level,
            healthIncrease: 20,
            attackIncrease: 5,
            defenseIncrease: 2
        };
    }
    
    takeDamage(damage) {
        const actualDamage = Math.max(1, damage - this.defense);
        this.health -= actualDamage;
        
        if (this.health < 0) {
            this.health = 0;
        }
        
        return actualDamage;
    }
    
    heal(amount) {
        const oldHealth = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        return this.health - oldHealth;
    }
    
    addGold(amount) {
        this.gold += amount;
    }
    
    spendGold(amount) {
        if (this.gold >= amount) {
            this.gold -= amount;
            return true;
        }
        return false;
    }
    
    addItem(item) {
        if (this.inventory.length < 10) {
            this.inventory.push(item);
            return true;
        }
        return false;
    }
    
    removeItem(itemName) {
        const index = this.inventory.findIndex(item => item.name === itemName);
        if (index !== -1) {
            return this.inventory.splice(index, 1)[0];
        }
        return null;
    }
    
    getStats() {
        return `
*📊 STATS ${this.name.toUpperCase()}*

👤 Nama: ${this.name}
⚤ Gender: ${this.gender}
🎂 Umur: ${this.age}
⭐ Level: ${this.level}
⚡ XP: ${this.xp}/${this.level * 100}
❤️ Health: ${this.health}/${this.maxHealth}
⚔️ Attack: ${this.attack}
🛡️ Defense: ${this.defense}
💰 Gold: ${this.gold}
🎒 Inventory: ${this.inventory.length}/10 items
        `.trim();
    }
}