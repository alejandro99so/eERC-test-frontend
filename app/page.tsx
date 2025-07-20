'use client';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useState, useEffect } from 'react';
import { CONTRACT_ADDRESS, CONTRACT_ABI } from '../constants/index';

export default function Home() {
  const [newName, setNewName] = useState('');
  const [currentName, setCurrentName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { ready, login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();

  // Simple contract interaction using Privy's wallet
  const handleUpdateName = async () => {
    if (!newName.trim() || !wallets?.[0]) return;
    
    setIsUpdating(true);
    try {
      const wallet = wallets[0];
      console.log('Using wallet:', wallet.address);
      
      // For now, just log the action since we need to implement contract calls
      console.log('Would update name to:', newName);
      console.log('Contract address:', CONTRACT_ADDRESS);
      
      // TODO: Implement actual contract call using Privy's wallet
      // This would require using the wallet's provider to call the contract
      
      setNewName('');
      alert('Name update functionality will be implemented with contract calls');
    } catch (error) {
      console.error('Error updating name:', error);
      alert('Error updating name. Check console for details.');
    } finally {
      setIsUpdating(false);
    }
  };
  
  return (
    <div className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start">
        {/* Navigation */}
        <div className="flex gap-4 items-center mb-4">
          <a
            href="/eerc"
            className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors font-medium"
          >
            🔐 EERC Dashboard
          </a>
          <a
            href="/test-wasm"
            className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
          >
            🧪 Test WASM
          </a>
        </div>
        
        <div className="flex gap-4 items-center flex-col sm:flex-row">
          <h1 className="text-4xl font-bold text-gray-900">Hello World!</h1>
        </div>
        
        <div className="text-center">
          {ready ? (
            <div className="text-green-600 font-semibold text-lg">✅ Privy is ready!</div>
          ) : (
            <div className="text-blue-600 font-semibold text-lg">⏳ Loading...</div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Wallet Connection</h2>
          
          {!authenticated ? (
            <div className="space-y-4">
              <button
                onClick={login}
                className="w-full bg-purple-600 text-white py-3 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 transition-colors font-medium cursor-pointer"
              >
                🔗 Connect Wallet
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-800 font-medium">✅ Connected!</p>
                    {user?.email && (
                      <p className="text-green-600 text-sm">{user.email.address}</p>
                    )}
                    {wallets && wallets.length > 0 && (
                      <p className="text-green-600 text-sm font-mono">
                        {wallets[0].address.slice(0, 6)}...{wallets[0].address.slice(-4)}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={logout}
                    className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors cursor-pointer"
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {authenticated && (
          <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">Smart Contract</h2>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Name
              </label>
              <div className="bg-gray-50 border border-gray-300 rounded-md p-3">
                <p className="text-gray-900 font-medium">
                  {currentName ? String(currentName) : "Loading..."}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="newName" className="block text-sm font-medium text-gray-700 mb-2">
                  New Name
                </label>
                <input
                  id="newName"
                  type="text"
                  placeholder="Enter new name"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && newName.trim() && !isUpdating) {
                      handleUpdateName();
                    }
                  }}
                  disabled={isUpdating}
                  className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
              
              <button
                onClick={handleUpdateName}
                disabled={!newName.trim() || isUpdating}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                {isUpdating ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Updating...
                  </div>
                ) : (
                  'Update Name'
                )}
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
