export function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function calculateDamage(attackerAttack, defenderDefense) {
    const baseDamage = Math.max(1, attackerAttack - defenderDefense);
    const variance = Math.floor(baseDamage * 0.2);
    return getRandomInt(baseDamage - variance, baseDamage + variance);
}
