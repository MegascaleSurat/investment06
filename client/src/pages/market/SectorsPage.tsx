import React, { useEffect, useState, useMemo } from "react";
import {
  getSectors,
  getSectorStocks,
  type Sector
} from "@/services/market.service";
import { useSocket } from "@/hooks/useSocket";
import {
  TrendingUp,
  LayoutGrid,
  ArrowLeft,
  Activity,
  ChevronRight,
  Database
} from "lucide-react";
import { toast } from "sonner";

const SectorsPage: React.FC = () => {
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [selectedSector, setSelectedSector] = useState<Sector | null>(null);
  const [sectorStocks, setSectorStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { isKiteConnected, ticksMap, subscribe, unsubscribe } = useSocket();

  useEffect(() => {
    fetchSectors();
  }, []);

  const fetchSectors = async () => {
    try {
      const data = await getSectors();
      setSectors(data);
    } catch (err) {
      toast.error("Failed to fetch sectors");
    } finally {
      setLoading(false);
    }
  };

  const handleSectorSelect = async (sector: Sector) => {
    setLoading(true);
    setSelectedSector(sector);
    try {
      const stocks = await getSectorStocks(sector.id);
      setSectorStocks(stocks);

      // Subscribe to live ticks for all stocks in this sector
      const tokens = stocks.map((s: any) => parseInt(s.instrument_token));
      subscribe(tokens);
    } catch (err) {
      toast.error("Failed to fetch sector stocks");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (sectorStocks.length > 0) {
      const tokens = sectorStocks.map((s: any) => parseInt(s.instrument_token));
      unsubscribe(tokens);
    }
    setSelectedSector(null);
    setSectorStocks([]);
  };

  const renderSectorList = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {sectors.map((sector) => (
        <div
          key={sector.id}
          onClick={() => handleSectorSelect(sector)}
          className="group relative bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 hover:border-primary/50 hover:shadow-xl hover:shadow-primary/5 transition-all cursor-pointer"
        >
          <div className="flex items-start justify-between">
            <div className="p-3 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
              <Activity className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xs font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
              {sector.stock_count} Stocks
            </span>
          </div>

          <div className="mt-6">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
              {sector.name}
            </h3>
            <p className="mt-2 text-slate-500 text-sm line-clamp-2">
              {sector.description || `Real-time tracking for all major stocks in the ${sector.name} sector.`}
            </p>
          </div>

          <div className="mt-6 flex items-center text-primary font-medium text-sm">
            View Live Market <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </div>
        </div>
      ))}
    </div>
  );

  const renderLiveTable = () => (
    <div className="animate-in fade-in slide-in-from-right-4 duration-500">
      <button
        onClick={handleBack}
        className="flex items-center text-slate-500 hover:text-primary mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Sectors
      </button>

      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{selectedSector?.name} Sector</h2>
            <p className="text-slate-500 text-sm">Live streaming prices for all tracked stocks in this category.</p>
          </div>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${isKiteConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
            <span className={`w-2 h-2 rounded-full ${isKiteConnected ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`} />
            {isKiteConnected ? 'Kite Live' : 'Kite Disconnected'}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-slate-800/50 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                <th className="px-6 py-4">Symbol</th>
                <th className="px-6 py-4">Company</th>
                <th className="px-6 py-4 text-right">LTP</th>
                <th className="px-6 py-4 text-right">Change %</th>
                <th className="px-6 py-4 text-right">Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {sectorStocks.map((stock) => {
                const tick = ticksMap[parseInt(stock.instrument_token)];
                return (
                  <tr key={stock.stock_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="font-bold text-slate-900 dark:text-white">{stock.symbol}</span>
                      <span className="ml-2 text-[10px] bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded text-slate-500">
                        {stock.exchange}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-sm">{stock.name}</td>
                    <td className="px-6 py-4 text-right font-mono font-medium">
                      {tick?.last_price ? `₹${tick.last_price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : '---'}
                    </td>
                    <td className={`px-6 py-4 text-right font-mono font-bold ${tick?.change >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {tick?.change ? `${tick.change > 0 ? '+' : ''}${tick.change.toFixed(2)}%` : '0.00%'}
                    </td>
                    <td className="px-6 py-4 text-right text-slate-500 text-sm font-mono">
                      {tick?.volume ? tick.volume.toLocaleString('en-IN') : '---'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {sectorStocks.length === 0 && !loading && (
            <div className="p-20 text-center flex flex-col items-center">
              <Database className="w-12 h-12 text-slate-300 mb-4" />
              <p className="text-slate-500">No stocks found in this sector.</p>
              <p className="text-xs text-slate-400 mt-1">Use the stock manager to assign stocks to {selectedSector?.name}.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-6 py-8 min-h-screen">
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-primary font-bold text-sm mb-2">
            <LayoutGrid className="w-4 h-4" /> Market Explorer
          </div>
          <h1 className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Sector Watch
          </h1>
          <p className="text-slate-500 mt-2 text-lg">
            Monitor industry performance with real-time streaming data.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center gap-2 px-4 py-2 border-r border-slate-100 dark:border-slate-800">
            <Activity className="w-4 h-4 text-primary" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold leading-none">Total Sectors</div>
              <div className="text-sm font-bold text-slate-900 dark:text-white">{sectors.length}</div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" />
            <div>
              <div className="text-[10px] text-slate-500 uppercase font-bold leading-none">System Status</div>
              <div className="text-sm font-bold text-emerald-500">Optimized</div>
            </div>
          </div>
        </div>
      </div>

      {loading && !selectedSector ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
        </div>
      ) : (
        selectedSector ? renderLiveTable() : renderSectorList()
      )}
    </div>
  );
};

export default SectorsPage;
