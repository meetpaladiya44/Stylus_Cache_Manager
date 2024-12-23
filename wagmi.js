
import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  arbitrumSepolia
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'arbitrum nitro stylus',
  projectId: process.env.NEXT_PUBLIC_WALLET_CONNECT_ID,
  chains: [
    mainnet,
    arbitrumSepolia
  ],
  ssr: true,
});