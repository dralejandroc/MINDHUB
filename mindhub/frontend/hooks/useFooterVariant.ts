"use client"

import { usePathname } from "next/navigation"
import { useMemo } from "react"

export type FooterVariant = "full" | "minimal" | "hidden"

export function useFooterVariant(): FooterVariant {
  const pathname = usePathname()

  return useMemo(() => {
    // Hidden footer for auth pages
    if (pathname?.startsWith("/auth/")) {
      return "hidden"
    }

    // Minimal footer for app/hub pages (expedix, clinimetrix, formx, etc.)
    if (
      pathname?.startsWith("/hubs/") || 
      pathname?.includes("/expedix/") ||
      pathname?.includes("/clinimetrix/") ||
      pathname?.includes("/formx/") ||
      pathname?.includes("/agenda/") ||
      pathname?.includes("/finance/") ||
      pathname?.includes("/resources/") ||
      pathname?.includes("/frontdesk/") ||
      pathname?.includes("/patient/") ||
      pathname?.includes("/assessment/") ||
      pathname?.includes("/form/")
    ) {
      return "minimal"
    }

    // Full footer for landing pages and dashboard
    if (
      pathname === "/" || 
      pathname === "/dashboard" ||
      pathname?.startsWith("/about") ||
      pathname?.startsWith("/contact") ||
      pathname?.startsWith("/pricing") ||
      pathname?.startsWith("/features") ||
      pathname?.startsWith("/help") ||
      pathname?.startsWith("/support")
    ) {
      return "full"
    }

    // Default to minimal for unknown pages
    return "minimal"
  }, [pathname])
}

// Alternative hook to get specific footer configuration
export function useFooterConfig() {
  const pathname = usePathname()
  const variant = useFooterVariant()

  return useMemo(() => {
    const config = {
      variant,
      show: variant !== "hidden",
      isFullWidth: variant === "full",
      isMinimal: variant === "minimal",
      className: ""
    }

    // Add specific classes based on context
    if (pathname?.startsWith("/hubs/")) {
      config.className = "border-t-muted/20 bg-background/95"
    }

    return config
  }, [pathname, variant])
}