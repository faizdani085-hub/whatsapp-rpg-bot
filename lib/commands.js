import { getPlayer, savePlayer, getRandomMonster } from './database.js';
import { Player } from './player.js';
import { startBattle } from './battle.js';
import { config } from '../config.json' assert { type: 'json' };

export async function handleCommand(client, message) {
    const text = message.body.toLowerCase();
    const sender = message.from;
    
    // Dapatkan atau buat pemain
    let player = await getPlayer(sender);
    
    // Perintah: daftar
    if (text.startsWith('daftar')) {
        if (player) {
            return message.reply('Kamu sudah terdaftar! Gunakan *profile* untuk melihat profilmu.');
        }
        
        const parts = text.split('.');
        if (parts.length < 4) {
            return message.reply(
                'Format: *daftar.nama.gender.umur*\n' +
                'Contoh: *daftar.rizki.pria.20*'
            );
        }
        
        const name = parts[1].trim();
        const gender = parts[2].trim();
        const age = parseInt(parts[3].trim());
        
        if (!name || !gender || !age) {
            return message.reply('Format tidak valid! Contoh: *daftar.rizki.pria.20*');
        }
        
        player = new Player(sender, name, gender, age);
        await savePlayer(player);
        
        return message.reply(
            `🎉 *Pendaftaran Berhasil!*\n\n` +
            `👤 Nama: ${name}\n` +
            `⚤ Gender: ${gender}\n` +
            `🎂 Umur: ${age}\n\n` +
            `Gunakan *help* untuk melihat semua perintah.`
        );
    }
    
    // Jika belum terdaftar
    if (!player) {
        return message.reply(
            'Kamu belum terdaftar! Ketik:\n' +
            '*daftar.nama.gender.umur*\n' +
            'Contoh: *daftar.rizki.pria.20*'
        );
    }
    
    // Perintah: help
    if (text === 'help') {
        return message.reply(`
*📚 PERINTAH RPG BOT*

👤 *Profil & Stats*
- *profile* - Lihat profilmu
- *stats* - Lihat statistikmu

⚔️ *Petualangan & Battle*
- *petualang* - Memulai petualangan menemukan monster
- *attack* - Serang monster (saat dalam battle)
- *lari* - Kabur dari battle

🛒 *Item & Toko*
- *inventory* - Lihat inventory
- *pakai [item]* - Pakai item dari inventory
- *toko* - Lihat toko
- *beli [item]* - Beli item dari toko

💊 *Lainnya*
- *heal* - Sembuhkan diri (💰${config.game.healCost} gold)
- *leaderboard* - Lihat peringkat pemain
- *help* - Tampilkan bantuan ini

📝 *Format:* daftar.nama.gender.umur
        `.trim());
    }
    
    // Perintah: profile / stats
    if (text === 'profile' || text === 'stats') {
        return message.reply(player.getStats());
    }
    
    // Perintah: petualang
    if (text === 'petualang') {
        if (player.health <= 0) {
            return message.reply('Healthmu habis! Gunakan *heal* terlebih dahulu.');
        }
        
        const monster = await getRandomMonster(player.level);
        player.currentBattle = await startBattle(player);
        
        return message.reply(
            `🌲 *PETUALANGAN DIMULAI!*\n\n` +
            `Kamu bertemu dengan:\n` +
            `👹 *${monster.name}* (Level ${monster.level})\n` +
            `❤️ Health: ${monster.health}\n` +
            `⚔️ Attack: ${monster.attack}\n` +
            `🛡️ Defense: ${monster.defense}\n\n` +
            `Ketik *attack* untuk menyerang!`
        );
    }
    
    // Perintah: attack (dalam battle)
    if (text === 'attack') {
        if (!player.currentBattle) {
            return message.reply('Kamu tidak sedang dalam battle! Ketik *petualang* untuk memulai.');
        }
        
        const result = await player.currentBattle.battleRound();
        
        if (result.completed) {
            player.currentBattle = null;
            await savePlayer(player);
            return message.reply(result.log);
        } else {
            let response = `*Round ${result.round}*\n`;
            response += result.log + '\n\n';
            response += `❤️ ${player.name}: ${result.playerHealth}\n`;
            response += `👹 ${player.currentBattle.monster.name}: ${result.monsterHealth}\n\n`;
            response += `Ketik *attack* lagi!`;
            
            return message.reply(response);
        }
    }
    
    // Perintah: lari
    if (text === 'lari') {
        if (!player.currentBattle) {
            return message.reply('Kamu tidak sedang dalam battle!');
        }
        
        const escapeChance = Math.random();
        if (escapeChance > 0.5) {
            player.currentBattle = null;
            await savePlayer(player);
            return message.reply('🏃‍♂️ *Kamu berhasil kabur!*');
        } else {
            const result = await player.currentBattle.monsterAttack();
            await savePlayer(player);
            
            if (result.isPlayerDead) {
                player.currentBattle = null;
                await savePlayer(player);
                return message.reply('💀 *Gagal kabur! Kamu dikalahkan monster!*');
            }
            
            return message.reply(
                '😨 *Gagal kabur!* Monster menyerangmu!\n' +
                `❤️ Health: ${player.health}\n\n` +
                `Ketik *attack* untuk melawan atau *lari* lagi!`
            );
        }
    }
    
    // Perintah: heal
    if (text === 'heal') {
        if (player.health >= player.maxHealth) {
            return message.reply('Healthmu sudah penuh!');
        }
        
        if (player.spendGold(config.game.healCost)) {
            const healed = player.heal(50);
            await savePlayer(player);
            
            return message.reply(
                `💊 *Berhasil diheal!*\n` +
                `❤️ Health: +${healed}\n` +
                `💰 Gold: -${config.game.healCost}\n` +
                `❤️ Health sekarang: ${player.health}/${player.maxHealth}`
            );
        } else {
            return message.reply(
                `Gold tidak cukup! Diperlukan ${config.game.healCost} gold.\n` +
                `Gold kamu: ${player.gold}`
            );
        }
    }
    
    // Perintah: inventory
    if (text === 'inventory') {
        if (player.inventory.length === 0) {
            return message.reply('Inventory kosong!');
        }
        
        let itemsList = '*🎒 INVENTORY*\n\n';
        player.inventory.forEach((item, index) => {
            itemsList += `${index + 1}. ${item.name} (${item.type})\n`;
        });
        
        return message.reply(itemsList);
    }
    
    // Perintah: pakai [item]
    if (text.startsWith('pakai')) {
        const itemName = text.split(' ')[1];
        if (!itemName) {
            return message.reply('Format: *pakai [nama_item]*');
        }
        
        const item = player.removeItem(itemName);
        if (!item) {
            return message.reply(`Item "${itemName}" tidak ditemukan di inventory!`);
        }
        
        let effectMessage = '';
        switch (item.type) {
            case 'heal':
                const healed = player.heal(item.value);
                effectMessage = `❤️ Health +${healed}`;
                break;
            case 'buff':
                player.attack += item.value;
                effectMessage = `⚔️ Attack +${item.value}`;
                break;
        }
        
        await savePlayer(player);
        
        return message.reply(
            `✅ *${item.name} digunakan!*\n` +
            `${effectMessage}\n` +
            `❤️ Health: ${player.health}/${player.maxHealth}\n` +
            `⚔️ Attack: ${player.attack}`
        );
    }
    
    // Perintah: toko
    if (text === 'toko') {
        const shopItems = [
            { name: "Potion", price: 30, effect: "Heal 30 HP" },
            { name: "Attack Potion", price: 50, effect: "+5 Attack" },
            { name: "Defense Potion", price: 40, effect: "+3 Defense" },
            { name: "Health Elixir", price: 100, effect: "Heal 100 HP" }
        ];
        
        let shopMessage = '*🛒 TOKO*\n\n';
        shopItems.forEach(item => {
            shopMessage += `🛍️ ${item.name}\n💰 ${item.price} gold\n✨ ${item.effect}\n\n`;
        });
        
        shopMessage += 'Beli dengan: *beli [nama_item]*';
        
        return message.reply(shopMessage);
    }
    
    // Perintah: beli [item]
    if (text.startsWith('beli')) {
        const itemName = text.split(' ')[1];
        if (!itemName) {
            return message.reply('Format: *beli [nama_item]*');
        }
        
        const shopItems = {
            "potion": { name: "Potion", price: 30, type: "heal", value: 30 },
            "attack potion": { name: "Attack Potion", price: 50, type: "buff", value: 5 },
            "defense potion": { name: "Defense Potion", price: 40, type: "buff", value: 3 },
            "health elixir": { name: "Health Elixir", price: 100, type: "heal", value: 100 }
        };
        
        const itemKey = itemName.toLowerCase();
        const item = shopItems[itemKey];
        
        if (!item) {
            return message.reply(`Item "${itemName}" tidak tersedia di toko!`);
        }
        
        if (player.spendGold(item.price)) {
            if (player.addItem(item)) {
                await savePlayer(player);
                return message.reply(
                    `✅ *${item.name} dibeli!*\n` +
                    `💰 -${item.price} gold\n` +
                    `🎒 Masuk ke inventory`
                );
            } else {
                return message.reply('Inventory penuh!');
            }
        } else {
            return message.reply(
                `Gold tidak cukup! Diperlukan ${item.price} gold.\n` +
                `Gold kamu: ${player.gold}`
            );
        }
    }
    
    // Perintah: leaderboard
    if (text === 'leaderboard') {
        const { playersDB } = await import('./database.js');
        await playersDB.read();
        
        const sortedPlayers = playersDB.data.players
            .sort((a, b) => {
                const scoreA = (a.level * 1000) + a.xp + (a.gold / 100);
                const scoreB = (b.level * 1000) + b.xp + (b.gold / 100);
                return scoreB - scoreA;
            })
            .slice(0, 10);
        
        let leaderboard = '*🏆 LEADERBOARD TOP 10*\n\n';
        
        sortedPlayers.forEach((player, index) => {
            leaderboard += `${index + 1}. ${player.name}\n`;
            leaderboard += `   ⭐ Level ${player.level} | 💰 ${player.gold} gold\n\n`;
        });
        
        return message.reply(leaderboard);
    }
    
    // Jika perintah tidak dikenali
    return message.reply(
        'Perintah tidak dikenali! Ketik *help* untuk melihat semua perintah.'
    );
}