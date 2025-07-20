'use client';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const config = createConfig({
  chains: [avalancheFuji],
  transports: {
    [avalancheFuji.id]: http(),
  },
});

const queryClient = new QueryClient();

interface WagmiProviderWrapperProps {
  children: React.ReactNode;
}

export default function WagmiProviderWrapper({ children }: WagmiProviderWrapperProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
} 