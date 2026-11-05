const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const notFound = require('./middlewares/notFound');
const errorHandler = require('./middlewares/errorHandler');

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json({ limit: '100kb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.json({ success: true, message: 'API is running' });
});

// Routes
app.use('/auth', require('./routes/auth.routes'));
app.use('/products', require('./routes/product.routes'));
app.use('/orders', require('./routes/order.routes'));

app.use(notFound);
app.use(errorHandler);

module.exports = app;