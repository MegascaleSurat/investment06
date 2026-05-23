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
import { IconSchema, IconLayoutDashboard, IconChartBar, IconActivity, IconUpload, IconListSearch, IconBellRinging, IconBriefcase ,IconArrowsExchange, IconReceipt, IconTarget, IconVersions, IconFlask, IconChartLine, IconChartPie2, IconWaveSawTool, IconRobot, IconShieldCheck, IconFileDescription,  IconBell , IconSettings ,  IconUsers  } from '@tabler/icons-react';

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
      icon: <IconLayoutDashboard />,
    },
    {
      name: "Sector Dashboard",
      url: "/sector-dashboard",
      icon: <IconChartBar />,
    },
    {
      name: "Market Status",
      url: "/market-status",
      icon: <IconActivity />,
    },
  ],
  watchlistAndSignals: [
    {
      name: "Watchlist Upload",
      url: "/watchlist",
      icon: <IconUpload  />,
    },
    {
      name: "Tracked Stocks",
      url: "/tracked-stocks",
      icon: <IconListSearch  />,
    },
    {
      name: "Entry Signals",
      url: "/entry-signals",
      icon: <IconBellRinging />,
    },
  ],
  trading: [
    {
      name: "Invested Positions",
      url: "/invested-positions",
      icon: <IconBriefcase />,
    },
    {
      name: "Open Orders",
      url: "/open-orders",
      icon: <IconArrowsExchange />,
    },
    {
      name: "Trade History",
      url: "/trade-history",
      icon: <IconReceipt />,
    },
    {
      name: "Exit Engine",
      url: "/exit-engine",
      icon: <IconTarget />,
    },
  ],
  strategy: [
    {
      name: "Strategy Builder",
      url: "/strategy/builder",
      icon: <IconSchema />,
    },
    {
      name: "Strategy Library",
      url: "/strategy/library",
      icon: <IconVersions />,
    },
    {
      name: "Backtesting",
      url: "/backtesting",
      icon: <IconFlask />,
    },
  ],
  analytics: [
    {
      name: "Performance Report",
      url: "/performance",
      icon: <IconChartLine />,
    },
    {
      name: "P&L Analytics",
      url: "/performance/pnl",
      icon: <IconChartPie2 />,
    },
    {
      name: "Volume Intelligence",
      url: "/performance/volume",
      icon: <IconWaveSawTool />,
    },
  ],
  system: [
    {
      name: "Broker Connection",
      url: "/system/broker",
      icon: <IconRobot />,
    },
    {
      name: "Risk Controls",
      url: "/system/risk",
      icon: <IconShieldCheck />,
    },
    {
      name: "System Logs",
      url: "/system/logs",
      icon: <IconFileDescription />,
    },
    {
      name: "Alerts",
      url: "/system/alerts",
      icon: <IconBell />,
    },
    {
      name: "Settings",
      url: "/system/settings",
      icon: <IconSettings />,
    },
    {
      name: "User Management",
      url: "/system/users",
      icon: <IconUsers />,
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
