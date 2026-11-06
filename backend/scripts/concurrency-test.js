require('dotenv').config({ quiet: true });

const API = process.env.API_URL || `http://localhost:${process.env.PORT || 5000}`;
const SKU = process.env.SKU || 'SKU005';
const REQUESTS = Number(process.env.REQUESTS || 20);
const QTY = Number(process.env.QTY || 1);
const EMAIL = process.env.TEST_EMAIL || 'user@example.com';
const PASSWORD = process.env.TEST_PASSWORD || 'User@123';

const json = async (res) => ({ status: res.status, body: await res.json() });

const getStock = async (token) => {
  const { body } = await json(
    await fetch(`${API}/products?search=${SKU}`, { headers: { Authorization: `Bearer ${token}` } })
  );
  const product = body.data.find((p) => p.sku === SKU);
  if (!product) throw new Error(`Product ${SKU} not found`);
  return product.stock_qty;
};

(async () => {
  const login = await json(
    await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
    })
  );
  if (login.status !== 200) throw new Error(`Login failed: ${JSON.stringify(login.body)}`);
  const { token } = login.body.data;

  const before = await getStock(token);
  console.log(`${SKU} stock before: ${before}`);
  console.log(`Firing ${REQUESTS} concurrent orders of qty ${QTY}...`);

  const results = await Promise.all(
    Array.from({ length: REQUESTS }, () =>
      fetch(`${API}/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ items: [{ sku: SKU, qty: QTY }] }),
      }).then(json)
    )
  );

  const succeeded = results.filter((r) => r.status === 201).length;
  const rejected = results.filter((r) => r.status === 409).length;
  const other = results.length - succeeded - rejected;
  const after = await getStock(token);
  const expectedSuccess = Math.min(REQUESTS, Math.floor(before / QTY));

  console.log(`Created: ${succeeded} | Insufficient stock: ${rejected} | Other: ${other}`);
  console.log(`${SKU} stock after: ${after}`);

  const ok =
    after >= 0 &&
    succeeded === expectedSuccess &&
    after === before - succeeded * QTY &&
    other === 0;

  console.log(ok ? '\nPASS: no overselling, stock is consistent' : '\nFAIL: inconsistent result');
  if (other)
    console.log(
      'Unexpected responses:',
      results.filter((r) => ![201, 409].includes(r.status))
    );
  process.exit(ok ? 0 : 1);
})().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
