"use client";

import {
  ArrowDownLeft,
  ArrowUpRight,
  LayoutDashboard,
  List,
  LogOut,
  User,
} from "lucide-react";
import { NavLink } from "@dashboard/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@banking/shared/ui/components/sidebar";
import { useAuth } from "@banking/shared/auth";
import { useLanguage } from "@dashboard/contexts/LanguageContext";
import { BrandLinkText } from "@banking/shared/ui/styles/shared";
import { usePrefetchDashboardRoute } from "@dashboard/routes/usePrefetchDashboardRoute";

import type { AppSidebarProps } from "./interface";
import { BrandArea, LogoutButton } from "./styled";

export function AppSidebar({ "data-testid": dataTestId }: AppSidebarProps) {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { t } = useLanguage();
  const { logout } = useAuth();
  const prefetchRoute = usePrefetchDashboardRoute();

  const items = [
    { title: t("sidebar.overview"), url: "/dashboard", icon: LayoutDashboard },
    { title: t("sidebar.statement"), url: "/dashboard/statement", icon: List },
    {
      title: t("sidebar.income"),
      url: "/dashboard/income",
      icon: ArrowDownLeft,
    },
    {
      title: t("sidebar.expenses"),
      url: "/dashboard/expenses",
      icon: ArrowUpRight,
    },
    { title: t("sidebar.profile"), url: "/dashboard/profile", icon: User },
  ];

  const handleLogout = async () => {
    await logout();
    window.history.pushState({}, "", "/");
    window.dispatchEvent(new PopStateEvent("popstate"));
  };

  return (
    <Sidebar collapsible="icon" data-testid={dataTestId}>
      <SidebarContent>
        <BrandArea>
          <a href="/">
            <BrandLinkText>{collapsed ? "BT" : "ByteBank"}</BrandLinkText>
          </a>
        </BrandArea>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton asChild tooltip={item.title}>
                    <NavLink
                      to={item.url}
                      end={item.url === "/dashboard"}
                      aria-label={collapsed ? item.title : undefined}
                      onMouseEnter={() => prefetchRoute(item.url)}
                      onFocus={() => prefetchRoute(item.url)}
                    >
                      <item.icon aria-hidden="true" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={t("sidebar.logout")}>
                  <LogoutButton
                    type="button"
                    onClick={handleLogout}
                    aria-label={collapsed ? t("sidebar.logout") : undefined}
                  >
                    <LogOut aria-hidden="true" />
                    {!collapsed && <span>{t("sidebar.logout")}</span>}
                  </LogoutButton>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
