import { useQuery } from '@tanstack/react-query';
import apiClient from '../../services/apiClient';

export interface Stock {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
  volume: number;
  sector: string;
}

export const stockKeys = {
  all: ['stocks'] as const,
  lists: () => [...stockKeys.all, 'list'] as const,
  list: (filters: string) => [...stockKeys.lists(), { filters }] as const,
  details: (id: string) => [...stockKeys.all, 'detail', id] as const,
};

const fetchTrackedStocks = async (): Promise<Stock[]> => {
  // Simulating API call
  // const { data } = await apiClient.get('/stocks/tracked');
  // return data;

  return new Promise((resolve) => {
    setTimeout(() => {
      resolve([
        { id: '1', symbol: 'RELIANCE', name: 'Reliance Industries', price: 2950.45, change: 12.30, changePercent: 0.42, volume: 5400000, sector: 'Energy' },
        { id: '2', symbol: 'TCS', name: 'Tata Consultancy Services', price: 3850.10, change: -45.20, changePercent: -1.16, volume: 1200000, sector: 'IT' },
        { id: '3', symbol: 'HDFCBANK', name: 'HDFC Bank', price: 1450.75, change: 5.60, changePercent: 0.39, volume: 8900000, sector: 'Finance' },
        { id: '4', symbol: 'INFY', name: 'Infosys', price: 1620.30, change: 25.10, changePercent: 1.57, volume: 3400000, sector: 'IT' },
        { id: '5', symbol: 'ICICIBANK', name: 'ICICI Bank', price: 1080.20, change: -2.10, changePercent: -0.19, volume: 4500000, sector: 'Finance' },
      ]);
    }, 1000);
  });
};

export const useTrackedStocks = () => {
  return useQuery({
    queryKey: stockKeys.lists(),
    queryFn: fetchTrackedStocks,
    refetchInterval: 5000, // Refresh every 5 seconds for "live" feel
  });
};
