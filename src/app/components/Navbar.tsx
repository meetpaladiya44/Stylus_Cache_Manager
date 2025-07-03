'use client'
import React from "react";
import Image from "next/image";
import Link from "next/link";
// import Hero from "../assets/Stylus_Landing_bg.png";
import Hero from "../assets/SmartCache_logo.svg";
import Providers from "../Providers";
import { ConnectKitButton } from "connectkit";
import { useEffect, useState } from 'react'

const Navbar = () => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <nav className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-sm">
      <div className="py-3 px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-3 group transition-all duration-300 hover:scale-105"
            >
              <div className="relative">
                <Image
                  src={Hero}
                  alt="SmartCache Logo"
                  width={180}
                  height={45}
                  className="transition-all duration-300 group-hover:brightness-110"
                />
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/"
                className="relative text-slate-300 hover:text-white  px-3 py-2 text-sm font-medium transition-all duration-300 group"
              >
                <span className="relative z-10">Home</span>
                <div className="absolute inset-0 bg-slate-700/50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </Link>
              <Link
                href="/dashboard"
                className="relative text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-300 group"
              >
                <span className="relative z-10">My Dashboard</span>
                <div className="absolute inset-0 bg-slate-700/50 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </Link>
            </div>
          </div>

          {/* Connect Wallet Button */}
          <div className="flex items-center">
            {mounted && (
              <div className="relative">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 to-slate-600 rounded-lg blur opacity-25 group-hover:opacity-75 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative">
                  <ConnectKitButton />
                </div>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              className="bg-slate-800 inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500 transition-all duration-300"
            >
              <span className="sr-only">Open main menu</span>
              <svg
                className="block h-6 w-6"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Subtle glow effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50"></div>
    </nav>
  );
};

export default Navbar;
