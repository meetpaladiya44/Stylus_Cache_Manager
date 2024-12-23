import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import {
  mainnet,
  holesky
} from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'ConnectKit demo',
  projectId: 'f8a6524307e28135845a9fe5811fcaa2',
  chains: [
    mainnet,
    holesky
  ],
  ssr: true,
});