'use client';
import { WagmiProvider } from '@privy-io/wagmi';
import { createConfig } from '@privy-io/wagmi';
import { avalancheFuji } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http } from 'wagmi';

const queryClient = new QueryClient();

// Create a Wagmi config using Privy's wrapper
const wagmiConfig = createConfig({
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http(),
  },
});

interface WagmiConfigProviderProps {
  children: React.ReactNode;
}

export default function WagmiConfigProvider({ children }: WagmiConfigProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <WagmiProvider config={wagmiConfig}>
        {children}
      </WagmiProvider>
    </QueryClientProvider>
  );
} 