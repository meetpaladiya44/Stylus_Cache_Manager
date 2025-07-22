'use client'
import React from "react";
import Image from "next/image";
import Link from "next/link";
import Hero from "../assets/SmartCache_logo.svg";
import Providers from "../../providers/Providers";
import { ConnectKitButton } from "connectkit";
import { useEffect, useState } from 'react'
import { X, Menu, Activity, Database, Brain, User } from 'lucide-react'
import ConnectWallet from "./ConnectWallet";

const Navbar = () => {
  // const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  // useEffect(() => {
  //   setMounted(true)
  // }, [])

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (mobileMenuOpen && !target.closest('.mobile-menu') && !target.closest('.mobile-menu-button')) {
        setMobileMenuOpen(false);
      }
    };

    if (mobileMenuOpen) {
      document.addEventListener('click', handleClickOutside);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  // if (!mounted) return null

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="relative bg-zinc-900/90 backdrop-blur-xl border-b border-zinc-800/60 shadow-2xl">
      <div className="py-3 px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-3 group transition-all duration-300 hover:scale-[1.02]"
              onClick={closeMobileMenu}
            >
              <div className="relative z-50 p-2.5 rounded-xl bg-zinc-800/60 border border-zinc-700/60 group-hover:border-blue-500/40 transition-all duration-300 shadow-lg">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <Image
                  src={Hero}
                  alt="SmartCache Logo"
                  width={130}
                  height={32}
                  className="transition-all duration-300 group-hover:brightness-110 relative z-10"
                />
              </div>
              {/* <div className="hidden sm:block">
                <h1 className="text-xl font-bold bg-gradient-to-r from-zinc-100 via-white to-zinc-200 bg-clip-text text-transparent">
                  Smart Cache
                </h1>
                <p className="text-xs text-zinc-500 font-medium tracking-wide">Stylus Manager</p>
              </div> */}
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="flex items-center space-x-1">
              <Link
                href="/"
                className="relative group flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-all duration-300 rounded-xl hover:bg-zinc-800/60"
              >
                <Activity className="w-4 h-4 group-hover:text-blue-400 transition-colors duration-300" />
                <span className="relative z-10">Home</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-cyan-500/10 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </Link>
              <Link
                href="/dashboard"
                className="relative group flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-all duration-300 rounded-xl hover:bg-zinc-800/60"
              >
                <Database className="w-4 h-4 group-hover:text-yellow-400 transition-colors duration-300" />
                <span className="relative z-10">Dashboard</span>
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/10 to-amber-500/10 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </Link>
              <Link
                href="/profile"
                className="relative group flex items-center gap-2.5 px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-zinc-100 transition-all duration-300 rounded-xl hover:bg-zinc-800/60"
              >
                <User className="w-4 h-4 group-hover:text-green-400 transition-colors duration-300" />
                <span className="relative z-10">My Profile</span>
                <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-emerald-500/10 rounded-xl scale-0 group-hover:scale-100 transition-transform duration-300"></div>
              </Link>

              {/* Connect Wallet Button - Desktop */}
              <div className="hidden md:flex items-center">
                {/* {mounted && ( */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur opacity-20 group-hover:opacity-40 transition duration-300"></div>
                  <div className="relative bg-zinc-800/90 border border-zinc-700/60 rounded-full p-0.5 hover:border-zinc-600/60 transition-all duration-300 shadow-lg">
                    <ConnectWallet />
                  </div>
                </div>
                {/* )} */}
              </div>
            </div>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={toggleMobileMenu}
              className="mobile-menu-button relative z-50 bg-zinc-800/90 backdrop-blur-sm inline-flex items-center justify-center p-3 rounded-xl text-zinc-400 hover:text-zinc-100 hover:bg-zinc-700/60 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all duration-300 border border-zinc-700/60 shadow-lg"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? (
                <X className="block h-5 w-5" />
              ) : (
                <Menu className="block h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-zinc-900/90 backdrop-blur-sm z-40"></div>

          {/* Mobile menu panel */}
          <div className="relative z-40 bg-zinc-900/95 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col">
              {/* Navigation Links */}
              <div className="px-6 py-6 space-y-2">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition-all duration-200 text-base font-medium border border-transparent hover:border-zinc-700/60"
                >
                  <Activity className="w-5 h-5 text-blue-400" />
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition-all duration-200 text-base font-medium border border-transparent hover:border-zinc-700/60"
                >
                  <Database className="w-5 h-5 text-yellow-400" />
                  Dashboard
                </Link>
                <Link
                  href="/profile"
                  onClick={closeMobileMenu}
                  className="flex items-center gap-3 px-4 py-3.5 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800/60 rounded-xl transition-all duration-200 text-base font-medium border border-transparent hover:border-zinc-700/60"
                >
                  <User className="w-5 h-5 text-green-400" />
                  My Profile
                </Link>
              </div>

              {/* Connect Wallet Button - Mobile */}
              <div className="p-6 border-t border-zinc-800/60">
                {/* {mounted && ( */}
                <div className="relative group w-fit">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full blur opacity-20"></div>
                  <div className="relative bg-zinc-800/90 border border-zinc-700/60 rounded-full p-0.5 shadow-lg">
                    <ConnectWallet />
                  </div>
                </div>
                {/* )} */}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced bottom glow effect */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/40 to-transparent"></div>
    </nav>
  );
};

export default Navbar;