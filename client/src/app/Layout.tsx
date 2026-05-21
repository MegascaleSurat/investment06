// Shell Layout rendering AppSidebar, Topbar, and standard page Outlet routes
import React from 'react'
import { Outlet } from 'react-router-dom'
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar'
import {AppSidebar} from '../components/app-sidebar'
import Topbar from '../components/layout/Topbar'

export function Layout() {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden bg-background font-sans">
        <AppSidebar />
        <SidebarInset className="flex-1 flex flex-col h-full overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-y-auto bg-background/50 p-6">
            <Outlet />
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}
export default Layout
