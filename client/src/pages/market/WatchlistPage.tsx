import React, { useState, useEffect } from "react";
import { useSocket } from "@/hooks/useSocket";
import {
  getWatchlists,
  createWatchlist,
  deleteWatchlist,
  addItemToWatchlist,
  removeItemFromWatchlist,
  searchStocks,
  type Watchlist,
  type WatchlistItem
} from "@/services/market.service";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Plus,
  Trash2,
  Search,
  Star,
  StarOff,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Bookmark
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const WatchlistPage = () => {
  const { isConnected, isKiteConnected, ticksMap, subscribe, unsubscribe } = useSocket();
  const [watchlists, setWatchlists] = useState<Watchlist[]>([]);
  const [activeWatchlistId, setActiveWatchlistId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [newWatchlistName, setNewWatchlistName] = useState("");

  useEffect(() => {
    fetchWatchlists();
  }, []);

  useEffect(() => {
    // When active watchlist changes, subscribe to its tokens
    const activeWl = watchlists.find(w => w.id === activeWatchlistId);
    if (activeWl && activeWl.items.length > 0) {
      const tokens = activeWl.items.map(item => parseInt(item.instrument_token)).filter(t => !isNaN(t));
      if (tokens.length > 0) {
        subscribe(tokens);
      }
    }
  }, [activeWatchlistId, watchlists]);

  const fetchWatchlists = async () => {
    try {
      setIsLoading(true);
      const data = await getWatchlists();
      setWatchlists(data);
      if (data.length > 0 && !activeWatchlistId) {
        setActiveWatchlistId(data[0].id);
      }
    } catch (err) {
      toast.error("Failed to fetch watchlists");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateWatchlist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWatchlistName.trim()) return;
    try {
      const nw = await createWatchlist(newWatchlistName);
      setWatchlists([...watchlists, { ...nw, items: [] }]);
      setNewWatchlistName("");
      setActiveWatchlistId(nw.id);
      toast.success("Watchlist created");
    } catch (err) {
      toast.error("Failed to create watchlist");
    }
  };

  const handleDeleteWatchlist = async (id: string) => {
    if (!confirm("Are you sure you want to delete this watchlist?")) return;
    try {
      await deleteWatchlist(id);
      const updated = watchlists.filter(w => w.id !== id);
      setWatchlists(updated);
      if (activeWatchlistId === id) {
        setActiveWatchlistId(updated[0]?.id || null);
      }
      toast.success("Watchlist deleted");
    } catch (err) {
      toast.error("Failed to delete watchlist");
    }
  };

  const handleSearch = async (val: string) => {
    setSearchQuery(val);
    if (val.length < 2) {
      setSearchResults([]);
      return;
    }
    setIsSearching(true);
    try {
      const results = await searchStocks(val);
      setSearchResults(results);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleAddItem = async (stock: any) => {
    if (!activeWatchlistId) return;
    try {
      await addItemToWatchlist(activeWatchlistId, stock.symbol_id);
      
      // Update local state to show the new item immediately
      const newItem: WatchlistItem = {
        item_id: Math.random().toString(), // Temporary ID until refresh
        symbol_id: stock.symbol_id,
        trading_symbol: stock.symbol,
        instrument_token: stock.instrument_token,
        stock_name: stock.name,
        exchange: stock.exchange
      };

      const updated = watchlists.map(w => {
        if (w.id === activeWatchlistId) {
          return { ...w, items: [...w.items, newItem] };
        }
        return w;
      });
      setWatchlists(updated);
      setSearchQuery("");
      setSearchResults([]);
      toast.success(`${stock.symbol} added to watchlist`);
    } catch (err) {
      toast.error("Failed to add item");
    }
  };

  const handleRemoveItem = async (symbolId: string) => {
    if (!activeWatchlistId) return;
    try {
      await removeItemFromWatchlist(activeWatchlistId, symbolId);
      const updated = watchlists.map(w => {
        if (w.id === activeWatchlistId) {
          return { ...w, items: w.items.filter(item => item.symbol_id !== symbolId) };
        }
        return w;
      });
      setWatchlists(updated);
      toast.success("Item removed");
    } catch (err) {
      toast.error("Failed to remove item");
    }
  };

  const activeWatchlist = watchlists.find(w => w.id === activeWatchlistId);

  return (
    <div className="flex flex-col gap-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Watchlists</h1>
          <p className="text-muted-foreground">Manage your favorite stocks and track them live.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 rounded-full border text-xs font-medium">
            <div className={cn("w-2 h-2 rounded-full", isKiteConnected ? "bg-emerald-500" : "bg-rose-500")} />
            {isKiteConnected ? "Kite Active" : "Kite Inactive"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar: Watchlist List & Creation */}
        <Card className="lg:col-span-1 h-fit">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Bookmark className="w-4 h-4" /> My Lists
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <form onSubmit={handleCreateWatchlist} className="flex gap-2">
              <Input
                placeholder="New List..."
                value={newWatchlistName}
                onChange={(e) => setNewWatchlistName(e.target.value)}
                className="h-8 text-xs"
              />
              <Button type="submit" size="sm" className="h-8 px-2">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </form>

            <div className="flex flex-col gap-1">
              {watchlists.map((wl) => (
                <div
                  key={wl.id}
                  onClick={() => setActiveWatchlistId(wl.id)}
                  className={cn(
                    "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer transition-colors text-sm",
                    activeWatchlistId === wl.id ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <span className="truncate">{wl.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] opacity-70">{wl.items.length}</span>
                    {activeWatchlistId === wl.id && (
                      <Trash2
                        className="w-3.5 h-3.5 hover:text-rose-400"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWatchlist(wl.id);
                        }}
                      />
                    )}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-center p-4">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Main Content: Watchlist Items & Live Feed */}
        <div className="lg:col-span-3 flex flex-col gap-6">
          <Card>
            <CardHeader className="pb-3 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>{activeWatchlist?.name || "Select a Watchlist"}</CardTitle>
                  <CardDescription>Live streaming prices for this list.</CardDescription>
                </div>
                <div className="relative w-64">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search stocks to add..."
                    className="pl-9 h-9"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-11 w-full bg-popover border rounded-md shadow-lg z-50 p-1 flex flex-col gap-1">
                      {searchResults.map((s) => (
                        <div
                          key={s.id}
                          className="flex items-center justify-between px-3 py-2 hover:bg-muted rounded-sm cursor-pointer text-sm"
                          onClick={() => handleAddItem(s)}
                        >
                          <div className="flex flex-col">
                            <span className="font-bold">{s.symbol}</span>
                            <span className="text-[10px] text-muted-foreground">{s.name}</span>
                          </div>
                          <Plus className="w-4 h-4 text-primary" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="pl-6">Symbol</TableHead>
                    <TableHead className="text-right">LTP</TableHead>
                    <TableHead className="text-right">Change</TableHead>
                    <TableHead className="text-right">Volume</TableHead>
                    <TableHead className="text-right pr-6">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(!activeWatchlist || activeWatchlist.items.length === 0) ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        {activeWatchlist ? "This watchlist is empty. Add some stocks!" : "Select or create a watchlist to get started."}
                      </TableCell>
                    </TableRow>
                  ) : (
                    activeWatchlist.items.map((item) => {
                      const tick = ticksMap[parseInt(item.instrument_token)];
                      const isPositive = (tick?.change || 0) >= 0;

                      return (
                        <TableRow key={item.item_id} className="hover:bg-muted/30">
                          <TableCell className="pl-6 font-medium">
                            <div className="flex flex-col">
                              <span>{item.trading_symbol}</span>
                              <span className="text-[10px] text-muted-foreground uppercase">{item.exchange}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            {tick ? (
                              <span className={cn(
                                "animate-in fade-in duration-300",
                                isPositive ? "text-emerald-600" : "text-rose-600"
                              )}>
                                ₹{tick.last_price?.toFixed(2)}
                              </span>
                            ) : "---"}
                          </TableCell>
                          <TableCell className="text-right">
                            {tick ? (
                              <div className={cn(
                                "inline-flex items-center gap-1 text-xs font-medium",
                                isPositive ? "text-emerald-600" : "text-rose-600"
                              )}>
                                {isPositive ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {tick.change?.toFixed(2)}%
                              </div>
                            ) : "---"}
                          </TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {tick?.volume?.toLocaleString('en-IN') || "---"}
                          </TableCell>
                          <TableCell className="text-right pr-6">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-muted-foreground hover:text-rose-500"
                              onClick={() => handleRemoveItem(item.symbol_id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default WatchlistPage;
