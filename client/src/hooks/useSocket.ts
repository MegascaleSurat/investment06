import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '@/services/socket.service';

export interface TickData {
  instrument_token: number;
  last_price: number;
  change: number;
  volume: number;
  buy_quantity: number;
  sell_quantity: number;
  ohlc: {
    open: number;
    high: number;
    low: number;
    close: number;
  };
  [key: string]: any;
}

export const useSocket = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isKiteConnected, setIsKiteConnected] = useState(false);
  const [ticksMap, setTicksMap] = useState<Record<number, TickData>>({});
  const [ticksCount, setTicksCount] = useState(0);

  // Buffer for high-frequency updates to prevent React bottleneck
  const ticksBuffer = useRef<Record<number, TickData>>({});
  const lastUpdateTime = useRef<number>(0);

  useEffect(() => {
    const socket = socketService.connect();

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => {
      setIsConnected(false);
      setIsKiteConnected(false);
    };
    
    const onStatus = (status: { connected: boolean }) => {
      setIsKiteConnected(status.connected);
    };
    const onTicks = (newTicks: TickData[]) => {
      if (newTicks && newTicks.length > 0) {
        // Update the buffer immediately (very fast)
        newTicks.forEach((tick) => {
          ticksBuffer.current[tick.instrument_token] = tick;
        });
        setTicksCount((prev) => prev + newTicks.length);

        // Throttle UI updates to once every 250ms
        const now = Date.now();
        if (now - lastUpdateTime.current > 250) {
          setTicksMap((prev) => ({
            ...prev,
            ...ticksBuffer.current
          }));
          ticksBuffer.current = {}; // Clear buffer after applying
          lastUpdateTime.current = now;
        }
      }
    };

    setIsConnected(socket.connected);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('market:ticks', onTicks);
    socket.on('ticker:status', onStatus);
    socket.on('ticker:initial-status', onStatus);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('market:ticks', onTicks);
      socket.off('ticker:status', onStatus);
      socket.off('ticker:initial-status', onStatus);
    };
  }, []);

  const subscribe = useCallback((tokens: number[]) => {
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ticker/subscribe`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tokens }),
    });
  }, []);

  const unsubscribe = useCallback((tokens: number[]) => {
    const token = localStorage.getItem('token');
    fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/ticker/unsubscribe`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ tokens }),
    });
  }, []);

  return { isConnected, isKiteConnected, ticksMap, ticksCount, subscribe, unsubscribe };
};
