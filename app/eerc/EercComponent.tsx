'use client';
import React, { useState } from "react";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import eerc20 from '../../config/eerc20.json';
import { useReadContract, useWriteContract, useSignMessage, usePublicClient, useWalletClient } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';
import {
  type CompatiblePublicClient,
  type CompatibleWalletClient,
  useEERC,
} from "@avalabs/eerc-sdk";
import { CONTRACTS, CIRCUIT_CONFIG } from '../../config/contracts';

const registrarAddress = eerc20.registrar.address;
const registrarAbi = eerc20.registrar.abi;

export default function EercComponent() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const { ready, login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const userAddress = wallets && wallets.length > 0 ? wallets[0].address : undefined;
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  
  // Setup for eERC SDK
  const publicClient = usePublicClient({ chainId: avalancheFuji.id });
  const { data: walletClient } = useWalletClient();
  
  // use eerc SDK
  const {
    owner: sdkOwner,
    symbol: sdkSymbol,
    isAuditorKeySet: sdkIsAuditorKeySet,
    auditorPublicKey: sdkAuditorPublicKey,
    isRegistered: sdkIsRegistered,
    isDecryptionKeySet: sdkIsDecryptionKeySet,
    generateDecryptionKey: sdkGenerateDecryptionKey,
    register: sdkRegister,
    useEncryptedBalance,
    isAddressRegistered,
    publicKey: sdkPublicKey,
  } = useEERC(
    publicClient as CompatiblePublicClient,
    walletClient as CompatibleWalletClient,
    CONTRACTS.EERC_CONVERTER, // Using converter mode for now
    CIRCUIT_CONFIG
  );

  // use encrypted balance from SDK
  const {
    privateMint,
    privateBurn,
    privateTransfer,
    deposit,
    withdraw,
    decimals,
    encryptedBalance: sdkEncryptedBalance,
    decryptedBalance: sdkDecryptedBalance,
    refetchBalance: sdkRefetchBalance,
  } = useEncryptedBalance(CONTRACTS.ERC20);

  // Consulta si el usuario está registrado
  const { data: isRegistered, isLoading: isLoadingRegistered } = useReadContract({
    address: registrarAddress as `0x${string}`,
    abi: registrarAbi,
    functionName: 'isUserRegistered',
    args: userAddress ? [userAddress] : [],
    query: { enabled: !!userAddress },
  });

  // Consulta la clave pública si está registrado
  const { data: publicKey, isLoading: isLoadingKey } = useReadContract({
    address: registrarAddress as `0x${string}`,
    abi: registrarAbi,
    functionName: 'getUserPublicKey',
    args: userAddress ? [userAddress] : [],
    query: { enabled: !!userAddress && isRegistered === true },
  });

  // Token comparison data
  const testERC20Address = eerc20.testERC20.address;
  const testERC20Abi = eerc20.testERC20.abi;
  const encryptedERCAddress = eerc20.encryptedERC.address;
  const encryptedERCAbi = eerc20.encryptedERC.abi;

  // Traditional ERC20 token data
  const { data: erc20Balance, refetch: refetchErc20Balance } = useReadContract({
    address: testERC20Address as `0x${string}`,
    abi: testERC20Abi,
    functionName: 'balanceOf',
    args: userAddress ? [userAddress] : [],
    query: { enabled: !!userAddress },
  });

  const { data: erc20Decimals } = useReadContract({
    address: testERC20Address as `0x${string}`,
    abi: testERC20Abi,
    functionName: 'decimals',
    args: [],
    query: { enabled: !!userAddress },
  });

  const { data: erc20Symbol } = useReadContract({
    address: testERC20Address as `0x${string}`,
    abi: testERC20Abi,
    functionName: 'symbol',
    args: [],
    query: { enabled: !!userAddress },
  });

  // Encrypted ERC20 token data
  const { data: encryptedBalanceData, refetch: refetchEncryptedBalance } = useReadContract({
    address: encryptedERCAddress as `0x${string}`,
    abi: encryptedERCAbi,
    functionName: 'getBalanceFromTokenAddress',
    args: userAddress ? [userAddress, testERC20Address] : [],
    query: { enabled: !!userAddress },
  });

  // Use SDK encrypted balance data
  const encryptedBalance = sdkEncryptedBalance || [];

  // ElGamal decryption function
  const decryptElGamal = (c1x: bigint, c1y: bigint, c2x: bigint, c2y: bigint, privateKey: bigint): bigint => {
    try {
      // This is a simplified implementation
      // In a real implementation, you would use proper elliptic curve operations
      // For now, we'll simulate the decryption process
      
      // ElGamal decryption: M = C₂ - xC₁
      // Where x is the private key
      
      // Since we don't have the full elliptic curve library, we'll simulate
      // the result based on the encrypted points
      
      if (c1x === BigInt(0) && c1y === BigInt(0) && c2x === BigInt(0) && c2y === BigInt(0)) {
        return BigInt(0); // No balance
      }
      
      // For demonstration purposes, we'll calculate a simulated balance
      // In reality, this would require proper elliptic curve arithmetic
      const simulatedBalance = (c2x + c2y) % (BigInt(10) ** BigInt(18)); // Simulate 18 decimals
      
      return simulatedBalance;
    } catch (error) {
      console.error('Error decrypting ElGamal:', error);
      return BigInt(0);
    }
  };

  // Debug logs
  console.log('User Address:', userAddress);
  console.log('Is Registered:', isRegistered);
  console.log('Public Key:', publicKey);
  console.log('Public Key Type:', typeof publicKey);

  // Helper functions
  const serializeData = (data: unknown): string => {
    try {
      return JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      );
    } catch (error) {
      return 'Error serializing data';
    }
  };

  const formatDisplayAmount = (amount: bigint | undefined, decimals: number | undefined): string => {
    if (amount === undefined || decimals === undefined) return '0';
    
    const amountStr = amount.toString();
    const decimalsNum = Number(decimals);
    
    if (amountStr.length <= decimalsNum) {
      const padded = amountStr.padStart(decimalsNum + 1, '0');
      return `0.${padded.slice(-decimalsNum)}`;
    }
    
    const whole = amountStr.slice(0, -decimalsNum);
    const fraction = amountStr.slice(-decimalsNum);
    const fractionStr = fraction.replace(/0+$/, '') || '0';
    
    return `${whole}.${fractionStr}`;
  };

  // State for token comparison
  const [isSignatureCreated, setIsSignatureCreated] = useState(false);
  const [isDecryptionKeyGenerated, setIsDecryptionKeyGenerated] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  
  // Use SDK data
  const decryptedBalance = sdkDecryptedBalance || BigInt(0);
  const isDecryptionKeySet = sdkIsDecryptionKeySet || false;

  const handleRequestTokens = async () => {
    if (!userAddress) return;
    
    try {
      await writeContractAsync({
        address: testERC20Address as `0x${string}`,
        abi: testERC20Abi,
        functionName: 'requestTokens',
        args: [],
        account: userAddress as `0x${string}`,
      });
      await refetchErc20Balance();
      alert(lang === 'es' ? 'Tokens ERC-20 solicitados exitosamente' : 'ERC-20 tokens requested successfully');
    } catch (error) {
      alert(lang === 'es' ? 'Error al solicitar tokens' : 'Failed to request tokens');
    }
  };

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    alert(`${type} ${lang === 'es' ? 'dirección copiada al portapapeles' : 'address copied to clipboard'}`);
  };

  const openExplorer = (address: string) => {
    window.open(`https://testnet.snowtrace.io/address/${address}`, '_blank');
  };

  const generateDecryptionKey = async () => {
    if (!userAddress) return;
    
    setIsGeneratingKey(true);
    try {
      // Use SDK to generate decryption key
      await sdkGenerateDecryptionKey();
      
      // Mark as completed
      setIsDecryptionKeyGenerated(true);
      setIsSignatureCreated(true);
      
      // Refresh balance to get decrypted amount
      await sdkRefetchBalance();
      
      alert(lang === 'es' ? 'Clave de desencriptación generada exitosamente' : 'Decryption key generated successfully');
    } catch (error) {
      console.error('Error generating decryption key:', error);
      alert(lang === 'es' ? 'Error al generar la clave de desencriptación' : 'Failed to generate decryption key');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-green-50 to-green-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl font-bold text-green-800">
              🔐 {lang === 'es' ? 'Token Encriptado ERC-20' : 'Encrypted ERC-20 Token'}
            </h1>
            <div className="flex gap-2">
              <button
                onClick={() => setLang('es')}
                className={`px-3 py-1 rounded text-sm ${lang === 'es' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                ES
              </button>
              <button
                onClick={() => setLang('en')}
                className={`px-3 py-1 rounded text-sm ${lang === 'en' ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-700'}`}
              >
                EN
              </button>
            </div>
          </div>
          
          <p className="text-gray-600 mb-4">
            {lang === 'es' 
              ? 'Compara un token ERC-20 tradicional con un token ERC-20 encriptado usando criptografía ElGamal.'
              : 'Compare a traditional ERC-20 token with an encrypted ERC-20 token using ElGamal cryptography.'
            }
          </p>
        </div>

        {/* Main Content */}
        {authenticated && userAddress ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Traditional ERC-20 Token */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-blue-800 mb-4">
                🪙 {lang === 'es' ? 'Token ERC-20 Tradicional' : 'Traditional ERC-20 Token'}
              </h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-mono text-sm">
                    {lang === 'es' ? 'Balance:' : 'Balance:'}
                  </span>
                  <span className="text-blue-800 font-mono font-semibold">
                    {formatDisplayAmount(erc20Balance, erc20Decimals as number | undefined)} {(erc20Symbol as string) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-blue-600 font-mono text-sm">
                    {lang === 'es' ? 'Dirección:' : 'Address:'}
                  </span>
                  <span className="text-blue-800 font-mono text-xs">
                    {testERC20Address.slice(0, 6)}...{testERC20Address.slice(-4)}
                  </span>
                </div>
              </div>

              <div className="border-t border-blue-300 pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={handleRequestTokens}
                    className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 transition-colors"
                  >
                    🪙 {lang === 'es' ? 'Solicitar Tokens' : 'Request Tokens'}
                  </button>
                  <button
                    onClick={() => copyToClipboard(testERC20Address, 'ERC-20')}
                    className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors"
                  >
                    📋 {lang === 'es' ? 'Copiar Dirección' : 'Copy Address'}
                  </button>
                  <button
                    onClick={() => openExplorer(testERC20Address)}
                    className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors"
                  >
                    🔍 {lang === 'es' ? 'Ver en Explorer' : 'View on Explorer'}
                  </button>
                </div>
              </div>
            </div>

            {/* Encrypted ERC-20 Token */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold text-green-800 mb-4">
                🔐 {lang === 'es' ? 'Token ERC-20 Encriptado' : 'Encrypted ERC-20 Token'}
              </h2>
              
              {/* Registration Status */}
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <h4 className="text-yellow-800 font-semibold text-sm mb-2">
                  📋 {lang === 'es' ? 'Estado de Registro' : 'Registration Status'}
                </h4>
                <div className="text-yellow-700 text-xs space-y-1">
                  <div>
                    <span className="font-semibold">{lang === 'es' ? 'Registrado:' : 'Registered:'}</span> {isRegistered ? '✅ Sí' : '❌ No'}
                  </div>
                  <div>
                    <span className="font-semibold">{lang === 'es' ? 'Clave Pública:' : 'Public Key:'}</span> {publicKey ? '✅ Configurada' : '❌ No configurada'}
                  </div>
                </div>
              </div>

              {/* Encrypted Balance */}
              {encryptedBalance.length > 0 && encryptedBalance.some(balance => balance !== BigInt(0)) && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-md">
                  <h4 className="text-green-800 font-semibold text-sm mb-2">
                    🔐 {lang === 'es' ? 'Puntos Encriptados' : 'Encrypted Points'}
                  </h4>
                  <div className="text-green-700 text-xs font-mono space-y-1">
                    <div>
                      <span className="font-semibold">C1:</span> ({encryptedBalance[0]?.toString() || '0'}, {encryptedBalance[1]?.toString() || '0'})
                    </div>
                    <div>
                      <span className="font-semibold">C2:</span> ({encryptedBalance[2]?.toString() || '0'}, {encryptedBalance[3]?.toString() || '0'})
                    </div>
                  </div>
                </div>
              )}

              {/* Decrypted Balance Display */}
              {isDecryptionKeySet && (
                <div className="space-y-3 mb-4">
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-mono text-sm">
                      {lang === 'es' ? 'Balance Desencriptado:' : 'Decrypted Balance:'}
                    </span>
                    <span className="text-green-800 font-mono font-semibold">
                      {!isDecryptionKeySet 
                        ? (lang === 'es' ? 'No calculado' : 'Not calculated')
                        : decryptedBalance === BigInt(0)
                        ? '0'
                        : `${formatDisplayAmount(decryptedBalance, erc20Decimals as number | undefined)} e.${(erc20Symbol as string) || 'N/A'}`
                      }
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-green-600 font-mono text-sm">
                      {lang === 'es' ? 'Dirección:' : 'Address:'}
                    </span>
                    <span className="text-green-800 font-mono text-xs">
                      {encryptedERCAddress.slice(0, 6)}...{encryptedERCAddress.slice(-4)}
                    </span>
                  </div>
                </div>
              )}

              <div className="border-t border-green-300 pt-4">
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(encryptedERCAddress, 'Encrypted')}
                    className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors"
                  >
                    📋 {lang === 'es' ? 'Copiar Dirección' : 'Copy Address'}
                  </button>
                  <button
                    onClick={() => openExplorer(encryptedERCAddress)}
                    className="flex-1 bg-gray-200 text-gray-700 px-3 py-2 rounded text-sm hover:bg-gray-300 transition-colors"
                  >
                    🔍 {lang === 'es' ? 'Ver en Explorer' : 'View on Explorer'}
                  </button>
                </div>
              </div>

              {/* Generate Decryption Key Button */}
              {!isDecryptionKeySet && (
                <div className="mt-4 pt-4 border-t border-green-300">
                  <button
                    onClick={generateDecryptionKey}
                    disabled={isGeneratingKey || !userAddress}
                    className="w-full bg-green-600 text-white px-4 py-3 rounded-md hover:bg-green-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGeneratingKey 
                      ? (lang === 'es' ? 'Generando clave...' : 'Generating key...')
                      : (lang === 'es' ? '🔑 Generar Clave de Desencriptación' : '🔑 Generate Decryption Key')
                    }
                  </button>
                  <p className="text-xs text-gray-600 mt-2">
                    {lang === 'es' 
                      ? '1. Se solicitará una firma de tu wallet'
                      : '1. A signature from your wallet will be requested'
                    }
                  </p>
                  <p className="text-xs text-gray-600">
                    {lang === 'es' 
                      ? '2. La firma se usará para derivar la clave de desencriptación'
                      : '2. The signature will be used to derive the decryption key'
                    }
                  </p>
                  <p className="text-xs text-gray-600">
                    {lang === 'es' 
                      ? '3. El balance desencriptado se calculará cuando sea necesario'
                      : '3. The decrypted balance will be calculated when needed'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : authenticated ? (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto mb-8">
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg mb-4">
                🔗 {lang === 'es' ? 'Conectando wallet...' : 'Connecting wallet...'}
              </div>
              <p className="text-gray-600">
                {lang === 'es' 
                  ? 'Esperando que se complete la conexión de la wallet...'
                  : 'Waiting for wallet connection to complete...'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto mb-8">
            <div className="text-center py-8">
              <div className="text-gray-500 text-lg mb-4">
                🔐 {lang === 'es' ? 'Wallet no conectada' : 'Wallet not connected'}
              </div>
              <p className="text-gray-600 mb-4">
                {lang === 'es' 
                  ? 'Necesitas conectar tu wallet para ver la comparación de tokens y generar la clave de desencriptación.'
                  : 'You need to connect your wallet to view token comparison and generate the decryption key.'
                }
              </p>
              <button
                onClick={login}
                className="bg-green-600 text-white px-6 py-3 rounded-md hover:bg-green-700 transition-colors font-medium"
              >
                🔗 {lang === 'es' ? 'Conectar Wallet' : 'Connect Wallet'}
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
} 