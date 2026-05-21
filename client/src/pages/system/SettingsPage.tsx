// Settings page displaying API connection constants and system defaults
import React, { useState } from 'react'

export function SettingsPage() {
  const [wsUrl, setWsUrl] = useState('ws://localhost:5000');
  const [apiUrl, setApiUrl] = useState('http://localhost:5000/api/v1');

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">System Settings</h2>
        <p className="text-sm text-muted-foreground">Adjust server API routes and connection intervals</p>
      </div>

      <div className="bg-card border border-border rounded-xl p-6 max-w-xl space-y-4">
        <h3 className="text-sm font-bold text-foreground">Endpoint Configuration</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">REST API Base URL</label>
            <input
              type="text"
              value={apiUrl}
              onChange={(e) => setApiUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase text-muted-foreground mb-1">WebSocket URL</label>
            <input
              type="text"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none"
            />
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-border">
          <button className="py-2 px-5 bg-primary text-primary-foreground font-semibold text-sm rounded-lg hover:bg-primary/95 transition-colors cursor-pointer">
            Save Configuration
          </button>
        </div>
      </div>
    </div>
  );
}
export default SettingsPage
