const { Router } = require('express');

const engine = require('./modules/engine/engine.routes');
const market = require('./modules/market/market.routes');
const order = require('./modules/order/order.routes');
const sector = require('./modules/sector/sector.routes');
const stock = require('./modules/stock/stock.routes');
const trade = require('./modules/trade/trade.routes');
const users = require('./modules/users/user.routes');
const kite = require('./modules/kite/kite.routes');
const watchlist = require('./modules/watchlist/watchlist.routes');
const auth = require('./modules/auth/auth.routes.js');
const health = require('./routes/health.route');

const apiRouter = Router();

// done
apiRouter.use('/health', health);

// pending
apiRouter.use('/auth', auth);

// todo
apiRouter.use('/stocks', stock);
apiRouter.use('/markets', market);
apiRouter.use('/sectors', sector);
apiRouter.use('/trades', trade);
apiRouter.use('/orders', order);
apiRouter.use('/engines', engine);
apiRouter.use('/users', users);
apiRouter.use('/kite', kite);
apiRouter.use('/watchlists', watchlist);

module.exports = { apiRouter };
