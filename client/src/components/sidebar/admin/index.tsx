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
import { GalleryVerticalEndIcon, TerminalSquareIcon, BotIcon, FrameIcon, PieChartIcon, MapIcon } from "lucide-react"

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
            url: "/admin/dashboard",
            icon: TerminalSquareIcon,
            isActive: true,
            items: [],
        },
        {
            title: "Users",
            url: "/admin/users",
            icon: BotIcon,
            items: [],
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
                <NavUser user={data.user} />
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
