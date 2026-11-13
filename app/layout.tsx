// app/layout.tsx
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { ThemeProvider } from "next-themes";
import { ConvexClientProvider } from "./ConvexClientProvider";
import Navbar from "./components/Navbar";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import Provider from "./provider";
import { AppSidebar } from "./components/Appsidebar";
import { AppearanceProvider } from "./context/AppearanceContext";
import { CyberRain } from "./components/CyberRain";
import { AppPreloader } from "./components/AppPreloader";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Jones in the Fast Lane — Online",
  description:
    "Race your friends to career success, luxury living and a happy life.",
};

// Runs before first paint so the saved accent / text size show immediately
// (no flash of the default look). The key must match STORAGE_KEY in
// AppearanceContext.
const APPEARANCE_BOOT_SCRIPT = `try{var a=JSON.parse(localStorage.getItem("jones-appearance")||"null");if(a){var r=document.documentElement;if(a.accent)r.dataset.accent=a.accent;if(a.uiSize)r.dataset.size=a.uiSize;r.dataset.glow=a.glow===false?"off":"on"}}catch(e){}`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      {/* data-* defaults = the original neon look, until the saved choice loads */}
      <html
        lang="en"
        data-accent="neon"
        data-size="default"
        data-glow="on"
        suppressHydrationWarning
      >
        <head>
          <script
            dangerouslySetInnerHTML={{ __html: APPEARANCE_BOOT_SCRIPT }}
          />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
            <AppPreloader>
              <ConvexClientProvider>
                <Provider>
                  <AppearanceProvider>
                    <SidebarProvider>
                      <AppSidebar />
                      <SidebarInset className="min-w-0">
                        {/* Rain sits inside the page area only, so it can never
                          fall over the sidebar. Keep it the FIRST child. */}
                        <CyberRain />
                        <Navbar />
                        <main className="p-4 lg:p-6">{children}</main>
                      </SidebarInset>
                    </SidebarProvider>
                    <Toaster richColors />
                  </AppearanceProvider>
                </Provider>
              </ConvexClientProvider>
            </AppPreloader>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
