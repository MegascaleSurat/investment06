// Watchlist upload dashboard page enabling uploading CSV files and previewing processed lists
import React, { useState } from 'react'
import UploadForm from './UploadForm'
import UploadPreviewTable from './UploadPreviewTable'

export function WatchlistUploadPage() {
  const [previewData, setPreviewData] = useState<any[]>([]);

  const handleUploadSuccess = (data: any[]) => {
    setPreviewData(data);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Upload Watchlist</h2>
        <p className="text-sm text-muted-foreground">Upload stock CSV watchlists to update the tracking list</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="md:col-span-1 bg-card border border-border rounded-xl p-6 h-fit">
          <h3 className="text-sm font-bold text-foreground mb-4">Watchlist Source CSV</h3>
          <UploadForm onUploadSuccess={handleUploadSuccess} />
        </div>

        <div className="md:col-span-2 bg-card border border-border rounded-xl p-6">
          <h3 className="text-sm font-bold text-foreground mb-4">Processed Preview</h3>
          <UploadPreviewTable data={previewData} />
        </div>
      </div>
    </div>
  );
}
export default WatchlistUploadPage
