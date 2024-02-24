import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Jua } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Analytics } from "@vercel/analytics/react"

const inter = Inter({ subsets: ["latin"] });

const font = Jua({
    subsets: ["latin"],
    weight: "400",
    variable: "--font-jua",
});

export const metadata: Metadata = {
    title: "Wigglegrams",
    description: "Create wigglegrams in just a few clicks",\
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body className={inter.className}>{children}</body>
            <Toaster />
            <Analytics />
        </html>
    );
}
