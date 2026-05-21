"use client"

import * as React from "react"

import { NavMain } from "@/components/nav-main"
// import { NavProjects } from "@/components/nav-projects"
import { NavUser } from "@/components/nav-user"
import { TeamSwitcher } from "@/components/team-switcher"
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarRail,
} from "@/components/ui/sidebar"
import {
    BarChart3Icon,
    BrainCircuitIcon,
    CandlestickChartIcon,
    FileTextIcon,
    FrameIcon,
    GalleryVerticalEndIcon,
    LayoutDashboardIcon,
    LineChartIcon,
    MapIcon,
    PieChartIcon,
    RadarIcon,
    SettingsIcon,
} from "lucide-react"
import { useMe } from "@/features/auth/hooks"

// This is sample data.
const data = {
    user: {
        name: "shadcn",
        email: "m@example.com",
        avatar: "/avatars/shadcn.jpg",
    },
    teams: [
        {
            name: "Acme Inc",
            logo: (
                <GalleryVerticalEndIcon
                />
            ),
            plan: "Enterprise",
        },
    ],
    navMain: [
        {
            title: "Dashboard",
            url: "/dashboard",
            icon: LayoutDashboardIcon,
        },

        {
            title: "Connect Zerodha",
            url: "#",
            icon: LineChartIcon,
            items: [
                { title: "Connect", url: "/kite/connect" },
                { title: "Profile", url: "/zerodha/profile" }
            ],
        },
        {
            title: "Market Watch",
            url: "/market",
            icon: LineChartIcon,
            items: [
                { title: "Live Prices", url: "/market/live" },
                { title: "Watchlist", url: "/market/watchlist" },
                { title: "Sectors", url: "/market/sectors" },
            ],
        },

        {
            title: "Signals",
            url: "/signals",
            icon: RadarIcon,
            items: [
                { title: "New Signals", url: "/signals/new" },
                { title: "Waiting Confirmation", url: "/signals/waiting" },
                { title: "Ready to Trade", url: "/signals/ready" },
            ],
        },

        {
            title: "Trades",
            url: "/trades",
            icon: CandlestickChartIcon,
            items: [
                { title: "Active Trades", url: "/trades/active" },
                { title: "Orders", url: "/trades/orders" },
                { title: "Trade History", url: "/trades/history" },
            ],
        },

        {
            title: "Strategy",
            url: "/strategy",
            icon: BrainCircuitIcon,
            items: [
                { title: "Model 1 (Swing)", url: "/strategy/model-1" },
                { title: "Model 2 (Trailing)", url: "/strategy/model-2" },
            ],
        },

        {
            title: "Analytics",
            url: "/analytics",
            icon: BarChart3Icon,
            items: [
                { title: "Performance", url: "/analytics/performance" },
                { title: "Win Rate", url: "/analytics/win-rate" },
                { title: "PnL Reports", url: "/analytics/pnl" },
            ],
        },

        {
            title: "Logs",
            url: "/logs",
            icon: FileTextIcon,
            items: [
                { title: "Execution Logs", url: "/logs/execution" },
                { title: "System Logs", url: "/logs/system" },
            ],
        },

        {
            title: "Settings",
            url: "/settings",
            icon: SettingsIcon,
            items: [
                { title: "Risk Settings", url: "/settings/risk" },
                { title: "Broker Config", url: "/settings/broker" },
                { title: "User Profile", url: "/settings/profile" },
            ],
        },
    ],
    projects: [
        {
            name: "Design Engineering",
            url: "#",
            icon: (
                <FrameIcon
                />
            ),
        },
        {
            name: "Sales & Marketing",
            url: "#",
            icon: (
                <PieChartIcon
                />
            ),
        },
        {
            name: "Travel",
            url: "#",
            icon: (
                <MapIcon
                />
            ),
        },
    ],
}

export function UserAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const me = useMe()
    const currentUser = me.data?.data
    const navUser = {
        name: currentUser?.name ?? (currentUser as any)?.full_name ?? data.user.name,
        email: currentUser?.email ?? data.user.email,
        avatar: data.user.avatar,
    }

    return (
        <Sidebar collapsible="icon" {...props}>
            <SidebarHeader>
                <TeamSwitcher teams={data.teams} />
            </SidebarHeader>
            <SidebarContent>
                <NavMain items={data.navMain} />
                {/* <NavProjects projects={data.projects} /> */}
            </SidebarContent>
            <SidebarFooter>
                <NavUser user={navUser} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
