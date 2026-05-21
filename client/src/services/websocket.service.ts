// Service managing real-time WebSocket communication, auto-reconnection and stock feed subscriptions
import { useMarketStore } from '../store/useMarketStore'
import { CONSTANTS } from '../utils/constants'

let ws: WebSocket | null = null;
let reconnectCount = 0;
let subscribedStocks: string[] = [];

export const websocketService = {
  connect: () => {
    if (ws) return;
    const url = import.meta.env.VITE_WS_URL || 'ws://localhost:4000';
    ws = new WebSocket(url);

    ws.onopen = () => {
      reconnectCount = 0;
      if (subscribedStocks.length > 0) {
        websocketService.subscribe(subscribedStocks);
      }
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && data.stockCode) {
          useMarketStore.getState().updateLivePrice(data);
        }
      } catch (err) {
        // Silently capture errors
      }
    };

    ws.onclose = () => {
      ws = null;
      if (reconnectCount < CONSTANTS.MAX_WS_RECONNECT_ATTEMPTS) {
        const delay = CONSTANTS.WS_RECONNECT_DELAY_MS * Math.pow(2, reconnectCount);
        reconnectCount++;
        setTimeout(() => {
          websocketService.connect();
        }, delay);
      }
    };

    ws.onerror = () => {
      if (ws) {
        ws.close();
      }
    };
  },

  disconnect: () => {
    if (ws) {
      ws.close();
      ws = null;
    }
  },

  subscribe: (stockCodes: string[]) => {
    subscribedStocks = stockCodes;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ action: 'subscribe', stockCodes }));
    }
  },
}
