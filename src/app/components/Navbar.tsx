'use client'
import React from "react";
import Image from "next/image";
import Link from "next/link";
// import Hero from "../assets/Stylus_Landing_bg.png";
import Hero from "../assets/SmartCache_logo.svg";
import Providers from "../Providers";
import { ConnectKitButton } from "connectkit";
import { useEffect, useState } from 'react'
import { X, Menu } from 'lucide-react'

const Navbar = () => {
  const [mounted, setMounted] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

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
      // Prevent scrolling when menu is open
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
      document.body.style.overflow = 'unset';
    };
  }, [mobileMenuOpen]);

  if (!mounted) return null

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setMobileMenuOpen(false)
  }

  return (
    <nav className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border-b border-slate-700/50 backdrop-blur-sm">
      <div className="py-3 px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo Section */}
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center space-x-3 group transition-all duration-300 hover:scale-105"
              onClick={closeMobileMenu}
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

          {/* Desktop Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-8">
              <Link
                href="/"
                className="relative text-slate-300 hover:text-white px-3 py-2 text-sm font-medium transition-all duration-300 group"
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

          {/* Connect Wallet Button - Desktop */}
          <div className="hidden md:flex items-center">
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
              onClick={toggleMobileMenu}
              className="mobile-menu-button bg-slate-800 inline-flex items-center justify-center p-2 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-slate-500 transition-all duration-300"
              aria-expanded={mobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {mobileMenuOpen ? (
                <X className="block h-6 w-6" />
              ) : (
                <Menu className="block h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="relative inset-0 z-50 md:hidden">
          {/* Backdrop */}
          {/* <div className="fixed inset-0 bg-black bg-opacity-50 transition-opacity duration-300" /> */}

          {/* Mobile menu panel */}
          {/* <div className="mobile-menu inset-y-0 right-0 max-w-sm w-full bg-gradient-to-b from-slate-900 to-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out"> */}
            <div className="flex flex-col h-full">

              {/* Navigation Links */}
              <div className="flex-1 px-6 py-6 space-y-4">
                <Link
                  href="/"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 text-base font-medium"
                >
                  Home
                </Link>
                <Link
                  href="/dashboard"
                  onClick={closeMobileMenu}
                  className="block px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700/50 rounded-lg transition-all duration-200 text-base font-medium"
                >
                  My Dashboard
                </Link>

              </div>

              {/* Connect Wallet Button - Mobile */}
              <div className="p-6 border-t border-slate-700">
                {mounted && (
                  <div className="w-full">
                    <ConnectKitButton />
                  </div>
                )}
              </div>
            </div>
          {/* </div> */}
        </div>
      )}

      {/* Subtle glow effect at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-slate-500 to-transparent opacity-50"></div>
    </nav>
  );
};

export default Navbar;
