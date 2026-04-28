const { Router } = require('express');

const engine = require('./engine');
const market = require('./market');
const order = require('./order');
const sector = require('./sector');
const stock = require('./stock');
const trade = require('./trade');
const users = require('./users');

const apiRouter = Router();

apiRouter.use('/stocks', stock.router);
apiRouter.use('/markets', market.router);
apiRouter.use('/sectors', sector.router);
apiRouter.use('/trades', trade.router);
apiRouter.use('/orders', order.router);
apiRouter.use('/engines', engine.router);
apiRouter.use('/users', users.router);

module.exports = { apiRouter };
