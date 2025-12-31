import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { PlanProvider } from "@/contexts/plan-context";
import { OnboardingProvider } from "@/contexts/onboarding-context";
import { Toaster } from 'sonner';

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "FlowStruktur - Din karrierecoach",
  description: "Få overblik over dine kompetencer, find dit næste karrierespor og match med de bedste jobs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="da" suppressHydrationWarning>
      <body className={inter.className}>
        <PlanProvider>
          <OnboardingProvider>
            {children}
            <Toaster position="bottom-right" />
          </OnboardingProvider>
        </PlanProvider>
      </body>
    </html>
  );
}
