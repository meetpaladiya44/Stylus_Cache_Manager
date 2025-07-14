"use client";

import React from "react";
import Web3Provider from "./Web3Provider";

interface RootProviderProps {
  children: React.ReactNode;
}

function RootProvider({ children }: RootProviderProps) {
  return <Web3Provider>{children}</Web3Provider>;
}

export default RootProvider;
