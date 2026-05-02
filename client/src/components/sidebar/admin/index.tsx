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
    GalleryVerticalEndIcon,
    FrameIcon, 
    PieChartIcon, 
    MapIcon, 
    BarChart3Icon,
    BrainCircuitIcon,
    CandlestickChartIcon,
    FileTextIcon,
    LayoutDashboardIcon,
    LineChartIcon,
    RadarIcon,
    SettingsIcon,
    Users,
    Cpu
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
            title: "Admin Dashboard",
            url: "/admin/dashboard",
            icon: LayoutDashboardIcon,
        },

        {
            title: "User Management",
            url: "/admin/users",
            icon: Users,
            items: [
                { title: "All Users", url: "/admin/users" },
                { title: "Create User", url: "/admin/users/create" },
                { title: "User Activity", url: "/admin/users/activity" },
            ],
        },

        {
            title: "Market Control",
            url: "/admin/market",
            icon: LineChartIcon,
            items: [
                { title: "Stocks Master", url: "/admin/market/stocks" },
                { title: "Sector Mapping", url: "/admin/market/sectors" },
                { title: "Global Filters", url: "/admin/market/filters" },
            ],
        },

        {
            title: "Signal Engine",
            url: "/admin/signals",
            icon: RadarIcon,
            items: [
                { title: "All Signals", url: "/admin/signals" },
                { title: "Rejected Signals", url: "/admin/signals/rejected" },
                { title: "Manual Override", url: "/admin/signals/override" },
            ],
        },

        {
            title: "Trade Management",
            url: "/admin/trades",
            icon: CandlestickChartIcon,
            items: [
                { title: "All Trades", url: "/admin/trades" },
                { title: "Active Trades", url: "/admin/trades/active" },
                { title: "Force Exit", url: "/admin/trades/force-exit" },
            ],
        },

        {
            title: "Broker & Execution",
            url: "/admin/execution",
            icon: Cpu,
            items: [
                { title: "Order Queue", url: "/admin/execution/orders" },
                { title: "Execution Logs", url: "/admin/execution/logs" },
                { title: "API Failures", url: "/admin/execution/errors" },
            ],
        },

        {
            title: "Strategy Control",
            url: "/admin/strategy",
            icon: BrainCircuitIcon,
            items: [
                { title: "Model 1 Config", url: "/admin/strategy/model-1" },
                { title: "Model 2 Config", url: "/admin/strategy/model-2" },
                { title: "Risk Rules", url: "/admin/strategy/risk" },
            ],
        },

        {
            title: "Analytics",
            url: "/admin/analytics",
            icon: BarChart3Icon,
            items: [
                { title: "System Performance", url: "/admin/analytics/performance" },
                { title: "User Performance", url: "/admin/analytics/users" },
                { title: "PnL Reports", url: "/admin/analytics/pnl" },
            ],
        },

        {
            title: "Logs & Audit",
            url: "/admin/logs",
            icon: FileTextIcon,
            items: [
                { title: "System Logs", url: "/admin/logs/system" },
                { title: "Trade Logs", url: "/admin/logs/trades" },
                { title: "Audit Trail", url: "/admin/logs/audit" },
            ],
        },

        {
            title: "System Settings",
            url: "/admin/settings",
            icon: SettingsIcon,
            items: [
                { title: "Global Settings", url: "/admin/settings/global" },
                { title: "Broker Config", url: "/admin/settings/broker" },
                { title: "Notifications", url: "/admin/settings/notifications" },
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

export function AdminAppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
    const me = useMe()
    const currentUser = me.data?.data
    const navUser = {
        name: currentUser?.full_name ?? data.user.name,
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
