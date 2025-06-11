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
    <div className="p-[1.5rem] pl-[2.4rem] pr-[3rem]">
      <div className="relative flex items-center justify-between ml-[1rem]">
        <a
          href="/"
          aria-label="CacheManager"
          title="CacheManager"
          className="flex items-center"
        >
          <Image src={Hero} alt="hero_img" width={300} height={300} />
          <h2 className="text-white text-2xl -mt-[6px]"></h2>
        </a>
        <div className="flex items-center gap-6">
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href="/" 
              className="text-white hover:text-blue-300 transition-colors duration-200 font-medium"
            >
              Home
            </Link>
            <Link 
              href="/dashboard" 
              className="text-white hover:text-blue-300 transition-colors duration-200 font-medium"
            >
              My Dashboard
            </Link>
          </nav>
          {/* <Providers> */}
          {mounted && <ConnectKitButton />}
          {/* </Providers> */}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
