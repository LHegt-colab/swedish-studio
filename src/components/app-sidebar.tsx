"use client"

import {
    BookOpen,
    FileText,
    Home,
    Mic,
    Settings,
    Upload,
    Download,
    Dumbbell,
    LogOut
} from "lucide-react"

import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarRail,
} from "@/components/ui/sidebar"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

const items = [
    {
        title: "Dashboard",
        url: "/dashboard",
        icon: Home,
    },
    {
        title: "Notities",
        url: "/notities",
        icon: FileText,
    },
    {
        title: "Woordjes",
        url: "/woordjes",
        icon: BookOpen,
    },
    {
        title: "Oefenen",
        url: "/oefenen",
        icon: Dumbbell,
    },
    {
        title: "Uitspraak",
        url: "/uitspraak",
        icon: Mic,
    },
    {
        title: "Grammatica",
        url: "/grammatica",
        icon: BookOpen,
    },
    {
        title: "Lezen",
        url: "/lezen",
        icon: FileText,
    },
    {
        title: "Importeren",
        url: "/importeren",
        icon: Upload,
    },
    {
        title: "Exporteren",
        url: "/exporteren",
        icon: Download,
    },
    {
        title: "Instellingen",
        url: "/instellingen",
        icon: Settings,
    },
]

export function AppSidebar() {
    const router = useRouter()
    const supabase = createClient()

    const handleLogout = async () => {
        await supabase.auth.signOut()
        router.push("/login")
    }

    return (
        <Sidebar collapsible="icon">
            <SidebarHeader className="flex flex-row items-center gap-2 p-4">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-sm bg-primary text-primary-foreground">
                    <span className="font-bold">S</span>
                </div>
                <span className="font-bold truncate group-data-[collapsible=icon]:hidden">
                    Swedish Studio
                </span>
            </SidebarHeader>
            <SidebarContent>
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            {items.map((item) => (
                                <SidebarMenuItem key={item.title}>
                                    <SidebarMenuButton asChild tooltip={item.title}>
                                        <a href={item.url}>
                                            <item.icon />
                                            <span>{item.title}</span>
                                        </a>
                                    </SidebarMenuButton>
                                </SidebarMenuItem>
                            ))}
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>
            <SidebarFooter>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton onClick={handleLogout} tooltip="Uitloggen">
                            <LogOut />
                            <span>Uitloggen</span>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarFooter>
            <SidebarRail />
        </Sidebar>
    )
}
