const toCents = (amount) => Math.round(Number(amount) * 100);
const fromCents = (cents) => (cents / 100).toFixed(2);

module.exports = { toCents, fromCents };
