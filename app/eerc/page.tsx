'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import eerc20Data from '../../constants/eerc20.json';

// Get the EERC contract address and ABI
const TESTNET_EERC_ADDRESS = eerc20Data.encryptedERC.address;
const REGISTRAR_ADDRESS = eerc20Data.registrar.address;

export default function EercPage() {
  const { ready, login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleDisconnect = () => {
    console.log('🔌 Disconnecting from Privy...');
    logout();
    console.log('✅ Disconnected from Privy');
  };

  const handleRefresh = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Simulate loading contract data
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log('Contract data refreshed');
    } catch (err) {
      setError('Error fetching contract data');
      console.error('Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <div className="flex justify-center mb-6">
          <Link
            href="/"
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors font-medium cursor-pointer"
          >
            ← Back to Home
          </Link>
        </div>
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">EERC Dashboard</h1>
          <p className="text-lg text-gray-600">Encrypted ERC-20 Contract Information</p>
        </div>

        {/* Wallet Connection Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Wallet Connection</h2>
          
          <div className="text-center mb-4">
            {ready ? (
              authenticated ? (
                <div className="text-green-600 font-semibold text-lg">✅ Wallet Connected!</div>
              ) : (
                <div className="text-blue-600 font-semibold text-lg">🔗 Ready to Connect</div>
              )
            ) : (
              <div className="text-blue-600 font-semibold text-lg">⏳ Loading...</div>
            )}
          </div>

          {!authenticated ? (
            <div className="text-center">
              <button
                onClick={login}
                className="bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium cursor-pointer"
              >
                🔗 Connect Wallet
              </button>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-medium">✅ Connected!</p>
                  {user?.email && (
                    <p className="text-green-600 text-sm">{user.email.address}</p>
                  )}
                  {wallets && wallets.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-green-600 text-sm font-mono">
                        {wallets[0].address.slice(0, 6)}...{wallets[0].address.slice(-4)}
                      </p>
                    </div>
                  )}
                </div>
                <button
                  onClick={handleDisconnect}
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors cursor-pointer"
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Contract Information Section */}
        {authenticated && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Contract Information</h2>
              <button
                onClick={handleRefresh}
                disabled={isLoading}
                className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                {isLoading ? (
                  <div className="flex items-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Loading...
                  </div>
                ) : (
                  '🔄 Refresh'
                )}
              </button>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Field
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200">
                      Value
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Contract Address
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {TESTNET_EERC_ADDRESS}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Registrar Address
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                      {REGISTRAR_ADDRESS}
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      Connected Wallet
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {wallets && wallets.length > 0 ? (
                        <div className="font-mono bg-gray-50 p-3 rounded border">
                          {wallets[0].address}
                        </div>
                      ) : (
                        <div className="text-gray-500 italic">
                          No wallet connected
                        </div>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 text-sm text-gray-600">
              <p><strong>Note:</strong> This is a simplified view. For full contract interaction, use the test page.</p>
            </div>
          </div>
        )}

        {!authenticated && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-6 text-center">
            <p className="text-blue-800 font-medium">Please connect your wallet to view contract information</p>
          </div>
        )}
      </div>
    </div>
  );
} 