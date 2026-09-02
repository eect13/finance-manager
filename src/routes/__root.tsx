import { createRootRoute, HeadContent, Outlet, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth/provider";
import { PreviewHostBridge } from "@/components/preview-host-bridge";
import { THEME_BOOT } from "@/lib/theme";
import appCss from "../styles.css?url";

const APP_NAME = "Finance Manager";

function Frame() {
  return (
    <>
      <PreviewHostBridge />
      <AuthProvider>
        <Outlet />
      </AuthProvider>
    </>
  );
}

function isDesktopSpa() {
  return typeof document !== "undefined" && Boolean(document.getElementById("fm-root"));
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: APP_NAME },
      { name: "description", content: "Peachtree-style books: customers, vendors, receipts, bills, checks, and cash forecasts." },
      { name: "keywords", content: "finance, accounting, bank register, invoices, bills, receipts" },
      { name: "theme-color", content: "#243542" },
    ],
    links: [
      { rel: "icon", type: "image/svg+xml", href: "/favicon.svg", media: "(prefers-color-scheme: light)" },
      { rel: "icon", type: "image/svg+xml", href: "/favicon-dark.svg", media: "(prefers-color-scheme: dark)" },
      { rel: "icon", type: "image/png", sizes: "32x32", href: "/icon-32.png" },
      { rel: "icon", type: "image/png", sizes: "192x192", href: "/icon-192.png" },
      { rel: "apple-touch-icon", href: "/icon-192.png" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;1,400&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "manifest", href: "/__grok/manifest.webmanifest" },
    ],
  }),
  component: () => {
    if (isDesktopSpa()) return <Frame />;
    return (
      <html lang="en" className="antialiased" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: THEME_BOOT }} />
          <HeadContent />
        </head>
        <body>
          <Frame />
          <Scripts />
        </body>
      </html>
    );
  },
});
