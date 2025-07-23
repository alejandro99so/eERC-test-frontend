'use client';
import { PrivyProvider } from '@privy-io/react-auth';
import { avalancheFuji } from 'wagmi/chains';

interface PrivyProviderWrapperProps {
  children: React.ReactNode;
}

export default function PrivyProviderWrapper({ children }: PrivyProviderWrapperProps) {
  return (
    <PrivyProvider
      appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
      clientId={process.env.NEXT_PUBLIC_PRIVY_CLIENT_ID!}
      config={{
        embeddedWallets: {
          ethereum: {
            createOnLogin: 'users-without-wallets'
          }
        },
        supportedChains: [avalancheFuji]
      }}
    >
      {children}
    </PrivyProvider>
  );
} 