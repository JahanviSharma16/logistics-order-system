'use strict';

const PRODUCTS = [
  ['Cardboard Box - Small', 25.0, 200],
  ['Cardboard Box - Medium', 40.0, 150],
  ['Cardboard Box - Large', 65.0, 100],
  ['Bubble Wrap Roll 50m', 450.0, 60],
  ['Packing Tape 48mm', 35.0, 5],
  ['Stretch Film Roll', 520.0, 40],
  ['Shipping Labels (100 pcs)', 180.0, 80],
  ['Thermal Label Printer', 8999.0, 10],
  ['Barcode Scanner', 2499.0, 15],
  ['Hand Pallet Truck', 18500.0, 3],
  ['Wooden Pallet', 750.0, 50],
  ['Plastic Pallet', 1450.0, 30],
  ['Strapping Band Roll', 980.0, 25],
  ['Strapping Tool', 1650.0, 12],
  ['Safety Gloves (Pair)', 120.0, 300],
  ['Safety Helmet', 350.0, 75],
  ['Reflective Vest', 220.0, 120],
  ['Steel Toe Boots', 2200.0, 20],
  ['Corner Protectors (50 pcs)', 400.0, 45],
  ['Fragile Stickers (500 pcs)', 260.0, 90],
  ['Poly Mailer Bags (100 pcs)', 550.0, 70],
  ['Air Pillow Packaging', 300.0, 0],
  ['Pallet Wrap Dispenser', 1200.0, 8],
  ['Box Cutter', 90.0, 150],
  ['Weighing Scale 100kg', 3200.0, 9],
  ['Trolley Cart', 4500.0, 6],
  ['Storage Rack 5-Tier', 7800.0, 4],
  ['Forklift Battery Charger', 24500.0, 2],
  ['Dock Bumper', 2900.0, 14],
  ['Cargo Net', 1100.0, 22],
];

module.exports = {
  async up(queryInterface) {
    const now = new Date();
    await queryInterface.bulkInsert(
      'products',
      PRODUCTS.map(([name, price, stock_qty], i) => ({
        name,
        sku: `SKU${String(i + 1).padStart(3, '0')}`,
        price,
        stock_qty,
        created_at: now,
      }))
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('products', null, {});
  },
};
