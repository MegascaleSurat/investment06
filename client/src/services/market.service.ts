import axios from '@/lib/axios';

export interface WatchlistItem {
  item_id: string;
  symbol_id: string;
  trading_symbol: string;
  instrument_token: string;
  stock_name: string;
  exchange: string;
}

export interface Watchlist {
  id: string;
  name: string;
  is_default: boolean;
  items: WatchlistItem[];
}

export const getWatchlists = async (): Promise<Watchlist[]> => {
  const res = await axios.get('/watchlists');
  return res.data.data;
};

export const createWatchlist = async (name: string, isDefault: boolean = false) => {
  const res = await axios.post('/watchlists', { name, isDefault });
  return res.data.data;
};

export const deleteWatchlist = async (watchlistId: string) => {
  await axios.delete(`/watchlists/${watchlistId}`);
};

export const addItemToWatchlist = async (watchlistId: string, symbolId: string) => {
  await axios.post(`/watchlists/${watchlistId}/items`, { symbolId });
};

export const removeItemFromWatchlist = async (watchlistId: string, symbolId: string) => {
  await axios.delete(`/watchlists/${watchlistId}/items/${symbolId}`);
};

export const searchStocks = async (query: string) => {
  const res = await axios.get(`/stocks?search=${query}&limit=10`);
  return res.data.data;
};

export interface Sector {
  id: string;
  name: string;
  description: string;
  stock_count: number;
}

export const getSectors = async (): Promise<Sector[]> => {
  const res = await axios.get('/sectors');
  return res.data.data;
};

export const getSectorStocks = async (sectorId: string) => {
  const res = await axios.get(`/sectors/${sectorId}/stocks`);
  return res.data.data;
};
