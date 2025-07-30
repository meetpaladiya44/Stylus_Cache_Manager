import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "../providers/Providers";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import FeedbackModal from './components/FeedbackModal'
import { Toaster } from 'react-hot-toast'
import { Suspense } from "react";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Smart Cache",
  description: "Smart Cache App",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }} suppressHydrationWarning={true}>
      <body className={inter.className}>
        <Suspense fallback={<div>Loading...</div>}>
          <Providers>
            <Navbar />
            {children}
            <Footer />
            <FeedbackModal />
            <Toaster position="top-center" />
          </Providers>
        </Suspense>
      </body>
    </html>
  );
}
