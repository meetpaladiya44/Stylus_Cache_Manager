import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import RootProvider from "./providers/RootProvider";
import Footer from "./components/Footer";
import Navbar from "./components/Navbar";
import FeedbackModal from './components/FeedbackModal'
import { Toaster } from 'react-hot-toast'

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
    <html lang="en">
      <body className={inter.className}>
        <RootProvider>
          <Navbar />
          {children}
          <Footer />
          <FeedbackModal />
          <Toaster position="top-center" />
        </RootProvider>
      </body>
    </html>
  );
}
