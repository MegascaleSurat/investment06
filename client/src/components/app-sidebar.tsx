import * as React from "react"

import { NavDocuments } from "@/components/nav-documents"
import { NavMain } from "@/components/nav-main"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { LayoutDashboardIcon, ListIcon, ChartBarIcon, FolderIcon, UsersIcon, CameraIcon, FileTextIcon, Settings2Icon, CircleHelpIcon, SearchIcon, DatabaseIcon, FileChartColumnIcon, FileIcon, CommandIcon } from "lucide-react"

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "#",
      icon: LayoutDashboardIcon,
    },
    {
      title: "Lifecycle",
      url: "#",
      icon: ListIcon,
    },
    {
      title: "Analytics",
      url: "#",
      icon: ChartBarIcon,
    },
    {
      title: "Projects",
      url: "#",
      icon: FolderIcon,
    },
    {
      title: "Team",
      url: "#",
      icon: UsersIcon,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: CameraIcon,
      isActive: true,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Proposal",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
    {
      title: "Prompts",
      icon: FileTextIcon,
      url: "#",
      items: [
        {
          title: "Active Proposals",
          url: "#",
        },
        {
          title: "Archived",
          url: "#",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "#",
      icon: <Settings2Icon />,
    },
    {
      title: "Get Help",
      url: "#",
      icon: <CircleHelpIcon />,
    },
    {
      title: "Search",
      url: "#",
      icon: <SearchIcon />,
    },
  ],
  overview: [
    {
      name: "Dashboard",
      url: "/",
      icon: <DatabaseIcon />,
    },
    {
      name: "Sector Dashboard",
      url: "/sector-dashboard",
      icon: <FileChartColumnIcon />,
    },
    {
      name: "Market Status",
      url: "/market-status",
      icon: <FileIcon />,
    },
  ],
  watchlistAndSignals: [
    {
      name: "Watchlist Upload",
      url: "/watchlist",
      icon: <ListIcon />,
    },
    {
      name: "Tracked Stocks",
      url: "/tracked-stocks",
      icon: <ChartBarIcon />,
    },
    {
      name: "Entry Signals",
      url: "/entry-signals",
      icon: <ChartBarIcon />,
    },
  ],
  trading: [
    {
      name: "Invested Positions",
      url: "/invested-positions",
      icon: <ListIcon />,
    },
    {
      name: "Open Orders",
      url: "/open-orders",
      icon: <ChartBarIcon />,
    },
    {
      name: "Trade History",
      url: "/trade-history",
      icon: <ChartBarIcon />,
    },
    {
      name: "Exit Engine",
      url: "/exit-engine",
      icon: <ChartBarIcon />,
    },
  ],
  strategy: [
    {
      name: "Strategy Builder",
      url: "/strategy/builder",
      icon: <ListIcon />,
    },
    {
      name: "Strategy Library",
      url: "/strategy/library",
      icon: <ChartBarIcon />,
    },
    {
      name: "Backtesting",
      url: "/backtesting",
      icon: <ChartBarIcon />,
    },
  ],
  analytics: [
    {
      name: "Performance Report",
      url: "/performance",
      icon: <ListIcon />,
    },
    {
      name: "P&L Analytics",
      url: "/performance/pnl",
      icon: <ChartBarIcon />,
    },
    {
      name: "Volume Intelligence",
      url: "/performance/volume",
      icon: <ChartBarIcon />,
    },
  ],
  system: [
    {
      name: "Broker Connection",
      url: "/system/broker",
      icon: <ListIcon />,
    },
    {
      name: "Risk Controls",
      url: "/system/risk",
      icon: <ChartBarIcon />,
    },
    {
      name: "System Logs",
      url: "/system/logs",
      icon: <ChartBarIcon />,
    },
    {
      name: "Alerts",
      url: "/system/alerts",
      icon: <ChartBarIcon />,
    },
    {
      name: "Settings",
      url: "/system/settings",
      icon: <ChartBarIcon />,
    },
    {
      name: "User Management",
      url: "/system/users",
      icon: <ChartBarIcon />,
    },
  ]
}

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <a href="#">
                <CommandIcon className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {/* <NavMain items={data.navMain} />
        <NavDocuments title="Overview" items={data.documents} /> */}
        <NavDocuments title="Overview" items={data.overview} />
        <NavDocuments title="Watchlist & Signals" items={data.watchlistAndSignals} />
        <NavDocuments title="Trading" items={data.trading} />
        <NavDocuments title="Strategy" items={data.strategy} />
        <NavDocuments title="Analytics" items={data.analytics} />
        <NavDocuments title="System" items={data.system} />
        {/* <NavSecondary items={data.navSecondary} className="mt-auto" /> */}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  )
}
