import { KiteConnect } from 'kiteconnect';
import kiteRepository from '../broker/kite.repository.js';
import instrumentsRepository from './instruments.repository.js';
import ApiError from '../../core/errors/ApiError.js';
import logger from '../../config/logger.js';

const INSTRUMENT_TYPE_MAP = {
  EQ: 'EQUITY',
  FUT: 'FUTURE',
  OPT: 'OPTION',
  INDICES: 'INDEX',
  COM: 'COMMODITY',
  CUR: 'CURRENCY',
};

const EXCHANGE_SEGMENT_MAP = {
  NSE: 'CASH',
  BSE: 'CASH',
  NFO: 'FNO',
  CDS: 'FNO',
  MCX: 'COMMODITY',
};

class InstrumentsService {
  async _getKiteInstance(userId) {
    const [creds, session] = await Promise.all([
      kiteRepository.getCredentials(userId),
      kiteRepository.getSession(userId),
    ]);

    if (!creds || !session || !session.accessToken) {
      throw new ApiError(401, 'Kite session not found or expired. Please login again.');
    }

    return new KiteConnect({
      api_key: creds.apiKey,
      access_token: session.accessToken,
    });
  }

  _mapInstrumentType(type) {
    return INSTRUMENT_TYPE_MAP[type] || 'EQUITY';
  }

  _mapSegment(exchange) {
    return EXCHANGE_SEGMENT_MAP[exchange] || 'CASH';
  }

  async downloadInstruments(userId, exchange) {
    const kc = await this._getKiteInstance(userId);

    let instruments;
    try {
      instruments = exchange
        ? await kc.getInstruments(exchange)
        : await kc.getInstruments();
    } catch (error) {
      logger.error({
        module: 'instruments',
        action: 'downloadInstruments',
        userId,
        exchange,
        error: error.message,
      }, 'Failed to fetch instruments from Kite');
      throw new ApiError(502, `Kite API error: ${error.message}`);
    }

    if (!instruments || instruments.length === 0) {
      return { total: 0, message: 'No instruments returned from Kite' };
    }

    let created = 0;
    const errors = [];

    for (const inst of instruments) {
      try {
        const symbol = inst.tradingsymbol || inst.trading_symbol;
        const exchangeName = inst.exchange || 'NSE';

        const stock = await instrumentsRepository.upsertStock({
          instrumentKey: String(inst.instrument_token) || null,
          symbol,
          exchange: exchangeName,
          name: inst.name || symbol,
          instrumentType: this._mapInstrumentType(inst.instrument_type),
          segment: this._mapSegment(exchangeName),
          isin: inst.isin || null,
          lotSize: inst.lot_size || 1,
          tickSize: inst.tick_size ? String(inst.tick_size) : null,
        });

        await instrumentsRepository.upsertStockSymbol(stock.id, {
          tradingSymbol: symbol,
          exchange: exchangeName,
          kiteToken: inst.instrument_token,
          instrumentToken: String(inst.instrument_token),
          exchangeToken: String(inst.exchange_token),
          expiry: inst.expiry || null,
          strikePrice: inst.strike || null,
          optionType: inst.option_type || null,
        });

        created++;
      } catch (err) {
        errors.push({ symbol: inst.tradingsymbol, error: err.message });
        logger.warn({
          module: 'instruments',
          action: 'downloadInstruments',
          symbol: inst.tradingsymbol,
          error: err.message,
        }, 'Failed to upsert instrument');
      }
    }

    logger.info({
      module: 'instruments',
      action: 'downloadInstruments',
      userId,
      exchange: exchange || 'ALL',
      total: instruments.length,
      created,
      errors: errors.length,
    }, 'Instruments download completed');

    return {
      total: instruments.length,
      created,
      errors: errors.length,
      errorDetails: errors.length > 0 ? errors.slice(0, 10) : [],
    };
  }

  async getQuote(userId, instrumentsStr) {
    const kc = await this._getKiteInstance(userId);
    const instrumentList = instrumentsStr.split(',').map((s) => s.trim()).filter(Boolean);

    if (instrumentList.length === 0) {
      throw new ApiError(400, 'No valid instruments provided');
    }

    if (instrumentList.length > 500) {
      throw new ApiError(400, 'Maximum 500 instruments allowed per request');
    }

    try {
      const quote = await kc.getQuote(instrumentList);
      return quote;
    } catch (error) {
      logger.error({
        module: 'instruments',
        action: 'getQuote',
        userId,
        count: instrumentList.length,
        error: error.message,
      }, 'Failed to fetch quote');
      throw new ApiError(502, `Kite quote error: ${error.message}`);
    }
  }

  async getLtp(userId, instrumentsStr) {
    const kc = await this._getKiteInstance(userId);
    const instrumentList = instrumentsStr.split(',').map((s) => s.trim()).filter(Boolean);

    if (instrumentList.length === 0) {
      throw new ApiError(400, 'No valid instruments provided');
    }

    if (instrumentList.length > 500) {
      throw new ApiError(400, 'Maximum 500 instruments allowed per request');
    }

    try {
      const ltp = await kc.getLTP(instrumentList);
      return ltp;
    } catch (error) {
      logger.error({
        module: 'instruments',
        action: 'getLtp',
        userId,
        count: instrumentList.length,
        error: error.message,
      }, 'Failed to fetch LTP');
      throw new ApiError(502, `Kite LTP error: ${error.message}`);
    }
  }

  async getOhlc(userId, instrumentsStr) {
    const kc = await this._getKiteInstance(userId);
    const instrumentList = instrumentsStr.split(',').map((s) => s.trim()).filter(Boolean);

    if (instrumentList.length === 0) {
      throw new ApiError(400, 'No valid instruments provided');
    }

    if (instrumentList.length > 500) {
      throw new ApiError(400, 'Maximum 500 instruments allowed per request');
    }

    try {
      const ohlc = await kc.getOHLC(instrumentList);
      return ohlc;
    } catch (error) {
      logger.error({
        module: 'instruments',
        action: 'getOhlc',
        userId,
        count: instrumentList.length,
        error: error.message,
      }, 'Failed to fetch OHLC');
      throw new ApiError(502, `Kite OHLC error: ${error.message}`);
    }
  }

  async getHistorical(userId, instrumentToken, query) {
    const kc = await this._getKiteInstance(userId);
    const { from, to, interval } = query;

    let historical;
    try {
      historical = await kc.getHistoricalData(instrumentToken, from, to, interval);
    } catch (error) {
      logger.error({
        module: 'instruments',
        action: 'getHistorical',
        userId,
        instrumentToken,
        interval,
        error: error.message,
      }, 'Failed to fetch historical data');
      throw new ApiError(502, `Kite historical error: ${error.message}`);
    }

    if (!historical || historical.length === 0) {
      return { instrumentToken, interval, candles: [] };
    }

    const stockSymbol = await instrumentsRepository.findStockSymbolByKiteToken(
      parseInt(instrumentToken, 10)
    );

    if (stockSymbol) {
      try {
        if (interval === 'day') {
          const records = historical.map((candle) => ({
            stockId: stockSymbol.stockId,
            date: new Date(candle.date || candle.time || candle.timestamp),
            open: String(candle.open),
            high: String(candle.high),
            low: String(candle.low),
            close: String(candle.close),
            volume: candle.volume || 0,
          }));
          await instrumentsRepository.bulkInsertDailyData(records);
        } else {
          const records = historical.map((candle) => ({
            stockId: stockSymbol.stockId,
            candleTime: new Date(candle.date || candle.time || candle.timestamp),
            open: String(candle.open),
            high: String(candle.high),
            low: String(candle.low),
            close: String(candle.close),
            volume: candle.volume || 0,
          }));
          await instrumentsRepository.bulkInsertIntradayData(records);
        }
      } catch (dbError) {
        logger.warn({
          module: 'instruments',
          action: 'getHistorical',
          userId,
          instrumentToken,
          error: dbError.message,
        }, 'Failed to store historical candles in DB (non-blocking)');
      }
    }

    return {
      instrumentToken,
      interval,
      from,
      to,
      candles: historical,
    };
  }
}

export default new InstrumentsService();
