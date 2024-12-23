'use client'
import React from "react";
import Image from "next/image";
import Hero from "../assets/Stylus_Landing_bg.png";
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
    <div className="pt-5 pb-5 mx-auto  w-[90%] ">
      <div className="relative flex items-center justify-between">
        <a
          href="/"
          aria-label="CacheManager"
          title="CacheManager"
          className="flex items-center"
        >
          <Image src={Hero} alt="hero_img" width={70} height={70} />
          <h2 className="text-white text-2xl -mt-[6px]">Stylus</h2>
        </a>
        <div className="flex items-center">
          {/* <Providers> */}
          {mounted && <ConnectKitButton />}
          {/* </Providers> */}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
