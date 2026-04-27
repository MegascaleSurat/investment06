import React from 'react';
import { useTrackedStocks } from '../features/stock/stockApi';
import { StockTable } from '../features/stock/StockTable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const TrackedStocksPage: React.FC = () => {
  const { data: stocks = [], isLoading } = useTrackedStocks();

  const marketMood = stocks.filter(s => s.changePercent > 0).length / stocks.length;
  const isBullish = marketMood > 0.5;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Total Tracked</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{stocks.length}</div>
            <p className="text-xs text-gray-500 mt-1">Across 4 sectors</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Market Mood</CardTitle>
            {isBullish ? <ArrowUpRight className="h-4 w-4 text-emerald-500" /> : <ArrowDownRight className="h-4 w-4 text-red-500" />}
          </CardHeader>
          <CardContent>
            <div className={isBullish ? "text-2xl font-bold text-emerald-400" : "text-2xl font-bold text-red-400"}>
              {isBullish ? 'Bullish' : 'Bearish'}
            </div>
            <p className="text-xs text-gray-500 mt-1">{(marketMood * 100).toFixed(0)}% stocks advancing</p>
          </CardContent>
        </Card>

        <Card className="bg-[#0f0f0f] border-white/10">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Top Gainer</CardTitle>
            <div className="h-4 w-4 bg-emerald-500/20 rounded text-emerald-500 text-[10px] flex items-center justify-center font-bold">HOT</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {stocks.length > 0 ? stocks.reduce((prev, current) => (prev.changePercent > current.changePercent) ? prev : current).symbol : 'N/A'}
            </div>
            <p className="text-xs text-emerald-500 mt-1">
              +{stocks.length > 0 ? stocks.reduce((prev, current) => (prev.changePercent > current.changePercent) ? prev : current).changePercent : 0}%
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="bg-[#0f0f0f] border border-white/10 rounded-xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-white">Stock Watchlist</h3>
          <div className="text-xs text-gray-500 flex items-center">
            <span className="relative flex h-2 w-2 mr-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Live Updates
          </div>
        </div>
        <StockTable stocks={stocks} isLoading={isLoading} />
      </div>
    </div>
  );
};

export default TrackedStocksPage;
