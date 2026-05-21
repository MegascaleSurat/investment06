// Service managing bulk uploading of stock lists and watchlist pre-processing
import api from './api'

export const watchlistService = {
  uploadWatchlist: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/watchlist/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  getWatchlistPreview: () => api.get<any[]>('/watchlist/preview'),
}
