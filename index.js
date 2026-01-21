import { Client, LocalAuth } from 'whatsapp-web.js';
import qrcode from 'qrcode-terminal';
import { initializeDatabase } from './lib/database.js';
import { handleCommand } from './lib/commands.js';
import { config } from './config.json' assert { type: 'json' };

// Inisialisasi database
initializeDatabase();

// Inisialisasi client WhatsApp
const client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    }
});

// Event ketika QR code diperlukan
client.on('qr', qr => {
    console.log('Scan QR code ini dengan WhatsApp:');
    qrcode.generate(qr, { small: true });
});

// Event ketika client siap
client.on('ready', () => {
    console.log('Bot RPG WhatsApp siap!');
    console.log(`Owner: ${config.ownerNumber}`);
});

// Event ketika menerima pesan
client.on('message', async message => {
    try {
        // Cek apakah pesan berasal dari chat pribadi atau grup yang diizinkan
        const isGroup = message.from.endsWith('@g.us');
        const isOwner = message.from.includes(config.ownerNumber.replace('+', ''));
        
        // Jika hanya mengizinkan owner dan bukan owner, skip
        if (config.ownerOnly && !isOwner && !isGroup) return;
        
        // Jika hanya mengizinkan grup tertentu
        if (config.allowedGroups.length > 0 && isGroup) {
            const groupId = message.from;
            if (!config.allowedGroups.includes(groupId)) return;
        }
        
        // Proses pesan
        await handleCommand(client, message);
        
    } catch (error) {
        console.error('Error:', error);
        message.reply('Terjadi kesalahan dalam memproses perintah.');
    }
});

// Event error handling
client.on('auth_failure', () => {
    console.error('Autentikasi gagal! Silakan restart bot.');
});

client.on('disconnected', (reason) => {
    console.log('Client disconnected:', reason);
    console.log('Menghubungkan ulang...');
    client.initialize();
});

// Mulai client
client.initialize();