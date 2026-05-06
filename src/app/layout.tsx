import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { Poppins } from "next/font/google";
import { AuthProvider } from "@/components/providers/AuthProvider";
import { PagesBootstrap } from "@/components/providers/PagesBootstrap";
import { CampaignCreationOverlay } from "@/components/campaign";
import { LayoutShell } from "@/components/layout/LayoutShell";
import { ToastContainer } from "@/components/ui/Toast";
import { ThemeInitializer } from "@/components/providers/ThemeInitializer";

const poppins = Poppins({
  subsets: ["latin"],
  display: "block",
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-poppins",
});

const publicAssetBase = (process.env.NEXT_PUBLIC_BASE_PATH ?? "").replace(/\/$/, "");

function customFontFaceCss(base: string) {
  const b = `${base}/fonts`;
  return `
@font-face{font-family:"Salesforce Sans";src:local("Salesforce Sans Light"),local("SalesforceSans-Light"),url("${b}/SalesforceSans-Light.woff2") format("woff2"),url("${b}/SalesforceSans-Light.woff") format("woff");font-weight:300;font-style:normal;font-display:block;}
@font-face{font-family:"Salesforce Sans";src:local("Salesforce Sans"),local("SalesforceSans-Regular"),url("${b}/SalesforceSans-Regular.woff2") format("woff2"),url("${b}/SalesforceSans-Regular.woff") format("woff");font-weight:400;font-style:normal;font-display:block;}
@font-face{font-family:"Salesforce Sans";src:local("Salesforce Sans Bold"),local("SalesforceSans-Bold"),url("${b}/SalesforceSans-Bold.woff2") format("woff2"),url("${b}/SalesforceSans-Bold.woff") format("woff");font-weight:700;font-style:normal;font-display:block;}
@font-face{font-family:"Avant Garde for Salesforce";src:local("Avant Garde for Salesforce Light"),local("AvantGardeForSalesforce-Light"),url("${b}/AvantGardeForSalesforce-Light.woff2") format("woff2"),url("${b}/AvantGardeForSalesforce-Light.woff") format("woff");font-weight:300;font-style:normal;font-display:block;}
@font-face{font-family:"Avant Garde for Salesforce";src:local("Avant Garde for Salesforce"),local("AvantGardeForSalesforce-Regular"),url("${b}/AvantGardeForSalesforce-Regular.woff2") format("woff2"),url("${b}/AvantGardeForSalesforce-Regular.woff") format("woff");font-weight:400;font-style:normal;font-display:block;}
@font-face{font-family:"Avant Garde for Salesforce";src:local("Avant Garde for Salesforce Medium"),local("AvantGardeForSalesforce-Medium"),url("${b}/AvantGardeForSalesforce-Medium.woff2") format("woff2"),url("${b}/AvantGardeForSalesforce-Medium.woff") format("woff");font-weight:500;font-style:normal;font-display:block;}
@font-face{font-family:"Avant Garde for Salesforce";src:local("Avant Garde for Salesforce Bold"),local("AvantGardeForSalesforce-Bold"),url("${b}/AvantGardeForSalesforce-Bold.woff2") format("woff2"),url("${b}/AvantGardeForSalesforce-Bold.woff") format("woff");font-weight:700;font-style:normal;font-display:block;}
`;
}

export const metadata: Metadata = {
  title: "Salesforce Palette",
  description: "Create marketing content at the speed of AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${poppins.variable} h-full`} suppressHydrationWarning>
      <head>
        <Script id="palette-theme-init" strategy="beforeInteractive">
          {`(function(){try{var t=localStorage.getItem("palette-theme");if(t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches)){document.documentElement.dataset.theme="dark"}}catch(e){}})()`}
        </Script>
        <style
          dangerouslySetInnerHTML={{ __html: customFontFaceCss(publicAssetBase) }}
        />
        <link
          rel="preload"
          href={`${publicAssetBase}/fonts/SalesforceSans-Regular.woff2`}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="preload"
          href={`${publicAssetBase}/fonts/SalesforceSans-Bold.woff2`}
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col antialiased bg-[var(--background)] text-[var(--text-primary)]">
        <AuthProvider>
          <ThemeInitializer />
          <PagesBootstrap />
          <LayoutShell>
            {children}
          </LayoutShell>
          <CampaignCreationOverlay />
          <ToastContainer />
        </AuthProvider>
      </body>
    </html>
  );
}
