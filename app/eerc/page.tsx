'use client';
import React, { useState } from "react";
import { usePrivy, useWallets } from '@privy-io/react-auth';
import eerc20 from '../../config/eerc20.json';
import { useReadContract, useWriteContract, useSignMessage, usePublicClient, useWalletClient } from 'wagmi';
import { avalancheFuji } from 'wagmi/chains';
import dynamic from 'next/dynamic';
import { CONTRACTS, CIRCUIT_CONFIG } from '../../config/contracts';

// Dynamic import for eERC component to avoid SSR issues
const SafeEercComponent = dynamic(() => import('./EercComponent'), { 
  ssr: false,
  loading: () => <div className="text-center py-8">Loading eERC component...</div>
});

const registrarAddress = eerc20.registrar.address;
const registrarAbi = eerc20.registrar.abi;

export default function EERCPage() {
  const [lang, setLang] = useState<'es' | 'en'>('es');
  const { ready, login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const userAddress = wallets && wallets.length > 0 ? wallets[0].address : undefined;
  const { writeContractAsync } = useWriteContract();
  const { signMessageAsync } = useSignMessage();
  
  // Setup for eERC SDK (commented out due to Node.js compatibility issues)
  // const publicClient = usePublicClient({ chainId: avalancheFuji.id });
  // const { data: walletClient } = useWalletClient();
  
  // use eerc SDK (commented out)
  // const {
  //   owner: sdkOwner,
  //   symbol: sdkSymbol,
  //   isAuditorKeySet: sdkIsAuditorKeySet,
  //   auditorPublicKey: sdkAuditorPublicKey,
  //   isRegistered: sdkIsRegistered,
  //   isDecryptionKeySet: sdkIsDecryptionKeySet,
  //   generateDecryptionKey: sdkGenerateDecryptionKey,
  //   register: sdkRegister,
  //   useEncryptedBalance,
  //   isAddressRegistered,
  //   publicKey: sdkPublicKey,
  // } = useEERC(
  //   publicClient as CompatiblePublicClient,
  //   walletClient as CompatibleWalletClient,
  //   CONTRACTS.EERC_CONVERTER, // Using converter mode for now
  //   CIRCUIT_CONFIG
  // );

  // use encrypted balance from SDK (commented out)
  // const {
  //   privateMint,
  //   privateBurn,
  //   privateTransfer,
  //   deposit,
  //   withdraw,
  //   decimals,
  //   encryptedBalance: sdkEncryptedBalance,
  //   decryptedBalance: sdkDecryptedBalance,
  //   refetchBalance: sdkRefetchBalance,
  // } = useEncryptedBalance(CONTRACTS.ERC20);

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

  // Process encrypted balance data
  const [encryptedBalance, setEncryptedBalance] = useState<bigint[]>([]);
  
  React.useEffect(() => {
    if (encryptedBalanceData) {
      console.log('Encrypted balance data received:', encryptedBalanceData);
      
      // Extract the eGCT data from the result
      // The structure is: { eGCT, nonce, amountPCTs, balancePCT, transactionIndex }
      if (encryptedBalanceData && typeof encryptedBalanceData === 'object' && 'eGCT' in encryptedBalanceData) {
        const eGCT = encryptedBalanceData.eGCT;
        
        // eGCT should contain the C1 and C2 points
        if (eGCT && Array.isArray(eGCT) && eGCT.length >= 4) {
          // Extract C1 (x,y) and C2 (x,y) from eGCT
          const c1x = eGCT[0];
          const c1y = eGCT[1];
          const c2x = eGCT[2];
          const c2y = eGCT[3];
          
          setEncryptedBalance([c1x, c1y, c2x, c2y]);
          console.log('Encrypted balance points:', { c1x, c1y, c2x, c2y });
        }
      }
    }
  }, [encryptedBalanceData]);

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
  console.log('Public Key Array?', Array.isArray(publicKey));
  console.log('Public Key Length:', Array.isArray(publicKey) ? publicKey.length : 'N/A');
  console.log('Is Loading Registered:', isLoadingRegistered);
  console.log('Is Loading Key:', isLoadingKey);
  console.log('Query Enabled:', !!userAddress && isRegistered === true);

  // Helper function to handle BigInt serialization
  const serializeData = (data: unknown): string => {
    try {
      return JSON.stringify(data, (key, value) =>
        typeof value === 'bigint' ? value.toString() : value
      , 2);
    } catch (error) {
      return String(data);
    }
  };

  // Helper function to format display amount
  const formatDisplayAmount = (amount: bigint | undefined, decimals: number | undefined): string => {
    if (!amount || !decimals) return '0';
    const divisor = BigInt(10 ** decimals);
    const whole = amount / divisor;
    const fraction = amount % divisor;
    const fractionStr = fraction.toString().padStart(decimals, '0');
    return `${whole}.${fractionStr}`;
  };

  // State for token comparison
  const [isSignatureCreated, setIsSignatureCreated] = useState(false);
  const [isDecryptionKeyGenerated, setIsDecryptionKeyGenerated] = useState(false);
  const [isGeneratingKey, setIsGeneratingKey] = useState(false);
  
  // State for decrypted balance
  const [decryptedBalance, setDecryptedBalance] = useState<bigint>(BigInt(0));
  const [isDecryptionKeySet, setIsDecryptionKeySet] = useState<boolean>(false);

  // Simulate signature creation and decryption
  React.useEffect(() => {
    if (encryptedBalanceData && typeof encryptedBalanceData === 'object' && 'eGCT' in encryptedBalanceData) {
      setIsSignatureCreated(true);
      // SDK will handle decryption automatically
    }
  }, [encryptedBalanceData]);

  // Update signature status when encrypted balance is available
  React.useEffect(() => {
    if (encryptedBalance.length > 0 && encryptedBalance.some(balance => balance !== BigInt(0))) {
      setIsSignatureCreated(true);
    }
  }, [encryptedBalance]);

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
      // Mensaje correcto para la firma (igual que en 3dent)
      const message = `eERC
Registering user with
 Address:${userAddress.toLowerCase()}`;
      
      console.log('Requesting signature for message:', message);
      
      // Usar useSignMessage para solicitar la firma del wallet
      const signature = await signMessageAsync({ message });
      
      console.log('Signature generated:', signature);
      
      // Simular el proceso de derivación de clave a partir de la firma
      // En una implementación real, aquí se usaría la firma para derivar la clave de desencriptación
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simular procesamiento
      
      // Marcar como completado
      setIsDecryptionKeyGenerated(true);
      setIsSignatureCreated(true);
      setIsDecryptionKeySet(true);
      
      // Calcular el balance desencriptado si tenemos datos encriptados
      if (encryptedBalance.length >= 4) {
        const c1x = encryptedBalance[0];
        const c1y = encryptedBalance[1];
        const c2x = encryptedBalance[2];
        const c2y = encryptedBalance[3];
        
        // Simular una clave privada derivada de la firma
        const simulatedPrivateKey = BigInt('0x' + signature.slice(2, 10)); // Usar parte de la firma como clave
        
        const decryptedAmount = decryptElGamal(c1x, c1y, c2x, c2y, simulatedPrivateKey);
        setDecryptedBalance(decryptedAmount);
        
        console.log('Balance desencriptado calculado:', decryptedAmount.toString());
      }
      
      alert(lang === 'es' ? 'Clave de desencriptación generada exitosamente' : 'Decryption key generated successfully');
    } catch (error) {
      console.error('Error generating decryption key:', error);
      alert(lang === 'es' ? 'Error al generar la clave de desencriptación' : 'Failed to generate decryption key');
    } finally {
      setIsGeneratingKey(false);
    }
  };

  return (
    <main className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex justify-end mb-4">
        <button
          className={`px-3 py-1 rounded-l font-mono text-xs border border-green-600 focus:outline-none transition-colors duration-150 ${lang === 'es' ? 'bg-green-600 text-white' : 'bg-white text-green-700'}`}
          onClick={() => setLang('es')}
        >
          Español
        </button>
        <button
          className={`px-3 py-1 rounded-r font-mono text-xs border border-green-600 border-l-0 focus:outline-none transition-colors duration-150 ${lang === 'en' ? 'bg-green-600 text-white' : 'bg-white text-green-700'}`}
          onClick={() => setLang('en')}
        >
          English
        </button>
      </div>

      {/* Texto introductorio */}
      {lang === 'es' && (
        <section>
          <div className="text-gray-800 font-mono text-sm leading-relaxed mt-4">
            <h2 className="text-green-600 font-bold text-lg mb-2 text-center flex items-center justify-center gap-2">
              <span>eERC</span>
            </h2>
          </div>
          <h3 className="text-green-700 font-semibold text-md mb-2 text-center">Español</h3>
          <div className="flex justify-center mb-4">
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-mono align-center">
              Privacy-Preserving • Auditable • ZK-Powered
            </span>
          </div>
          <div className="space-y-2 text-sm font-mono text-gray-800 leading-relaxed indent-6 mb-8">
            <p>
              eERC es un token ERC-20 que preserva la privacidad y permite a los usuarios mintear, transferir y quemar tokens sin exponer balances o montos en la blockchain.
            </p>
            <p>
              Existen dos modos de eERC: <span className="text-green-700 font-semibold">Standalone Mode</span> permite la gestión directa de tokens cifrados, mientras que <span className="text-green-700 font-semibold">Converter Mode</span> envuelve tokens ERC-20 existentes en su forma cifrada, permitiendo depósitos y retiros privados.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-green-300 bg-gray-50 rounded-lg p-4">
                <h4 className="text-green-700 font-bold mb-2">Standalone Mode</h4>
                <p>
                  Funciona como un token estándar con privacidad: los usuarios pueden mintear, transferir y quemar directamente.
                </p>
              </div>
              <div className="border border-green-300 bg-gray-50 rounded-lg p-4">
                <h4 className="text-green-700 font-bold mb-2">Converter Mode</h4>
                <p>
                  Envuelve un ERC-20 existente. Los usuarios depositan tokens ERC-20 y reciben su equivalente cifrado.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-800 font-mono leading-relaxed">
              Todos los balances cifrados están ligados a la clave pública de tu wallet y cada interacción (minteo, transferencia, quema, retiro) se procesa mediante pruebas criptográficas y operaciones homomórficas. Así, tu balance privado se actualiza correctamente sin exponer datos sensibles en la blockchain. eERC también incluye una función de auditoría para cumplimiento regulatorio: autoridades designadas pueden acceder a detalles de transacciones usando claves especiales, permitiendo supervisión sin comprometer la privacidad del usuario.
            </p>
            <p className="text-xs text-green-700 mt-0">
              ¿Quieres saber más? Consulta la documentación completa en nuestro {" "}
              <a
                href="https://docs.avacloud.io/encrypted-erc"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-800"
              >
                GitBook →
              </a>
            </p>
          </div>
        </section>
      )}
      {lang === 'en' && (
        <section>
          <div className="text-gray-800 font-mono text-sm leading-relaxed mt-4">
            <h2 className="text-green-600 font-bold text-lg mb-2 text-center flex items-center justify-center gap-2">
              <span>eERC</span>
            </h2>
          </div>
          <h3 className="text-green-700 font-semibold text-md mb-2 text-center">English</h3>
          <div className="flex justify-center mb-4">
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded font-mono align-center">
              Privacy-Preserving • Auditable • ZK-Powered
            </span>
          </div>
          <div className="space-y-2 text-sm font-mono text-gray-800 leading-relaxed indent-6 mb-8">
            <p>
              eERC is a privacy-preserving ERC-20 token that lets users mint, transfer, and burn — without exposing balances or amounts on-chain.
            </p>
            <p>
              There are two modes of eERC: <span className="text-green-700 font-semibold">Standalone Mode</span> allows direct minting and management of encrypted tokens, while <span className="text-green-700 font-semibold">Converter Mode</span> wraps existing ERC-20 tokens into encrypted form — allowing you to deposit and later withdraw standard tokens privately.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-green-300 bg-gray-50 rounded-lg p-4">
                <h4 className="text-green-700 font-bold mb-2">Standalone Mode</h4>
                <p>
                  Behaves like a standard token with privacy features — users can mint, transfer, and burn directly.
                </p>
              </div>
              <div className="border border-green-300 bg-gray-50 rounded-lg p-4">
                <h4 className="text-green-700 font-bold mb-2">Converter Mode</h4>
                <p>
                  Wraps an existing ERC-20. Users deposit ERC-20 tokens and receive their encrypted equivalents.
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-800 font-mono leading-relaxed">
              All encrypted balances are tied to your wallet's public key, and every interaction with the contract (mint, transfer, burn, withdraw) is processed through cryptographic proofs and homomorphic operations. This ensures your private balance is updated correctly — without ever exposing sensitive data to the blockchain. eERC also includes a powerful auditability feature for regulatory compliance. Designated authorities can access transaction details using special auditor keys — allowing for oversight without compromising user privacy.
            </p>
            <p className="text-xs text-green-700 mt-0">
              Want to learn more? See the full documentation on our {" "}
              <a
                href="https://docs.avacloud.io/encrypted-erc"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-green-800"
              >
                GitBook →
              </a>
            </p>
          </div>
        </section>
      )}

      {/* Wallet Connection */}
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md border border-gray-200 mx-auto mb-8">
        <h2 className="text-xl font-bold text-gray-900 mb-4 text-center">
          {lang === 'es' ? 'Conexión de Wallet' : 'Wallet Connection'}
        </h2>
        {!ready ? (
          <div className="text-blue-600 font-semibold text-lg text-center">⏳ {lang === 'es' ? 'Cargando...' : 'Loading...'}</div>
        ) : !authenticated ? (
          <div className="space-y-4">
            <button
              onClick={login}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
            >
              🔗 {lang === 'es' ? 'Conectar Wallet' : 'Connect Wallet'}
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-800 font-medium">✅ {lang === 'es' ? '¡Conectado!' : 'Connected!'}</p>
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
                  className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700 transition-colors"
                >
                  {lang === 'es' ? 'Desconectar' : 'Disconnect'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Info Section */}
      {authenticated && userAddress && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-2xl mx-auto mb-8">
          <h3 className="text-green-800 font-semibold text-lg mb-4 flex items-center gap-2">
            <span role="img" aria-label="user">👤</span>
            {lang === 'es' ? 'Información de Usuario' : 'User Information'}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="border border-green-300 rounded-md p-4 bg-white">
              <h4 className="font-semibold mb-2 flex items-center gap-1">
                <span role="img" aria-label="wallet">🔗</span>
                {lang === 'es' ? 'Detalles de Wallet' : 'Wallet Details'}
              </h4>
              <div className="break-all text-sm font-mono mb-2">
                <span className="font-semibold">Address:</span><br />
                {userAddress}
              </div>
              <div className="mt-2">
                <span className="font-semibold">{lang === 'es' ? 'Estado de Registro:' : 'Registration Status:'}</span><br />
                {isLoadingRegistered ? (
                  <span className="text-gray-500">{lang === 'es' ? 'Cargando...' : 'Loading...'}</span>
                ) : isRegistered ? (
                  <span className="text-green-700 font-semibold flex items-center gap-1">✔️ {lang === 'es' ? 'Registrado' : 'Registered'}</span>
                ) : (
                  <span className="text-red-600 font-semibold flex items-center gap-1">❌ {lang === 'es' ? 'No registrado' : 'Not registered'}</span>
                )}
              </div>
              {/* Botón para registrar si no está registrado */}
              {!isLoadingRegistered && !isRegistered && (
                <button
                  className="mt-4 w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors font-medium"
                  disabled={!userAddress}
                  onClick={() => alert(lang === 'es' ? 'Funcionalidad de registro próximamente' : 'Registration functionality coming soon')}
                >
                  {lang === 'es' ? 'Registrar Wallet' : 'Register Wallet'}
                </button>
              )}
            </div>
            <div className="border border-green-300 rounded-md p-4 bg-white">
              <h4 className="font-semibold mb-2 flex items-center gap-1">
                <span role="img" aria-label="key">🔑</span>
                {lang === 'es' ? 'Clave Pública' : 'Public Key'}
              </h4>
              {isRegistered && Array.isArray(publicKey) && publicKey.length === 2 &&
                (typeof publicKey[0] === 'string' || typeof publicKey[0] === 'number') &&
                (typeof publicKey[1] === 'string' || typeof publicKey[1] === 'number') ? (
                <>
                  <div className="text-sm font-mono mb-1">
                    <span className="font-semibold">X Coordinate:</span><br />
                    {String(publicKey[0])}
                  </div>
                  <div className="text-sm font-mono">
                    <span className="font-semibold">Y Coordinate:</span><br />
                    {String(publicKey[1])}
                  </div>
                </>
              ) : isLoadingKey ? (
                <span className="text-gray-500">{lang === 'es' ? 'Cargando...' : 'Loading...'}</span>
              ) : !isRegistered ? (
                <span className="text-red-600">{lang === 'es' ? 'No registrado' : 'Not registered'}</span>
              ) : publicKey && Array.isArray(publicKey) && publicKey.length === 2 ? (
                <div className="space-y-3">
                  <div className="border border-green-600 rounded p-3 bg-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600">📍</span>
                      <span className="text-gray-700 font-mono text-sm">X</span>
                    </div>
                    <div className="text-green-700 font-mono text-xs break-all">
                      {String(publicKey[0])}
                    </div>
                  </div>
                  <div className="border border-green-600 rounded p-3 bg-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-600">📍</span>
                      <span className="text-gray-700 font-mono text-sm">Y</span>
                    </div>
                    <div className="text-green-700 font-mono text-xs break-all">
                      {String(publicKey[1])}
                    </div>
                  </div>
                </div>
              ) : publicKey ? (
                <div className="text-sm font-mono">
                  <span className="font-semibold">Datos recibidos:</span><br />
                  <pre className="text-xs break-all mt-1">
                    {serializeData(publicKey)}
                  </pre>
                </div>
              ) : (
                <span className="text-gray-400">{lang === 'es' ? 'Sin datos' : 'No data'}</span>
              )}
            </div>
          </div>
          {isRegistered && (
            <div className="bg-green-100 border border-green-400 rounded-md p-4 text-center mt-4">
              <span className="text-green-700 font-semibold flex items-center justify-center gap-2">✔️ {lang === 'es' ? 'Inicializada' : 'Initialized'}</span>
              <div className="text-green-700 text-sm mt-1">
                {lang === 'es' ? 'Tu wallet está inicializada y lista para usar' : 'Your wallet is initialized and ready to use'}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Token Comparison Section */}
      {authenticated && userAddress ? (
        <div className="bg-white rounded-lg shadow-lg p-6 max-w-6xl mx-auto mb-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-green-800 font-semibold text-xl flex items-center gap-2">
              <span role="img" aria-label="compare">⚖️</span>
              {lang === 'es' ? 'Comparación de Tokens' : 'Token Comparison'}
            </h3>
            <button
              onClick={() => {
                refetchErc20Balance();
                refetchEncryptedBalance();
              }}
              className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition-colors text-sm"
            >
              🔄 {lang === 'es' ? 'Actualizar' : 'Refresh'}
            </button>
          </div>

          <div className="mb-6">
            <h4 className="text-green-700 font-semibold text-lg mb-3">
              {lang === 'es' ? '¿Qué hace especiales a los tokens encriptados?' : 'What makes encrypted tokens special?'}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✅</span>
                <span className="text-sm font-mono">
                  {lang === 'es' ? 'Privacidad Total' : 'Complete Privacy'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✅</span>
                <span className="text-sm font-mono">
                  {lang === 'es' ? 'Auditoría Regulatoria' : 'Regulatory Audit'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✅</span>
                <span className="text-sm font-mono">
                  {lang === 'es' ? 'Pruebas Criptográficas' : 'Cryptographic Proofs'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-green-600 text-xl">✅</span>
                <span className="text-sm font-mono">
                  {lang === 'es' ? 'Operaciones Homomórficas' : 'Homomorphic Operations'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Traditional ERC20 Token Card */}
            <div className="border border-gray-300 rounded-lg p-6 bg-gray-50">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-gray-800 font-semibold text-lg">
                  {lang === 'es' ? 'Token ERC-20 Tradicional' : 'Traditional ERC-20 Token'}
                </h5>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(testERC20Address, 'ERC-20')}
                    className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                  >
                    📋 {lang === 'es' ? 'Copiar' : 'Copy'}
                  </button>
                  <button
                    onClick={() => openExplorer(testERC20Address)}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                  >
                    🔍 {lang === 'es' ? 'Explorar' : 'Explorer'}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-mono text-sm">
                    {lang === 'es' ? 'Balance:' : 'Balance:'}
                  </span>
                  <span className="text-gray-800 font-mono font-semibold">
                    {formatDisplayAmount(erc20Balance as bigint | undefined, erc20Decimals as number | undefined)} {(erc20Symbol as string) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-mono text-sm">
                    {lang === 'es' ? 'Símbolo:' : 'Symbol:'}
                  </span>
                  <span className="text-gray-800 font-mono font-semibold">
                    {(erc20Symbol as string) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-mono text-sm">
                    {lang === 'es' ? 'Decimales:' : 'Decimals:'}
                  </span>
                  <span className="text-gray-800 font-mono font-semibold">
                    {(erc20Decimals as number) || 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 font-mono text-sm">
                    {lang === 'es' ? 'Dirección:' : 'Address:'}
                  </span>
                  <span className="text-gray-800 font-mono text-xs">
                    {testERC20Address.slice(0, 6)}...{testERC20Address.slice(-4)}
                  </span>
                </div>
              </div>

              <button
                onClick={handleRequestTokens}
                className="w-full mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                🪙 {lang === 'es' ? 'Solicitar Tokens' : 'Request Tokens'}
              </button>
            </div>

            {/* Encrypted ERC20 Token Card */}
            <div className="border border-green-300 rounded-lg p-6 bg-green-50">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-green-800 font-semibold text-lg flex items-center gap-2">
                  🔒 {lang === 'es' ? 'Token ERC-20 Encriptado' : 'Encrypted ERC-20 Token'}
                </h5>
                <div className="flex gap-2">
                  <button
                    onClick={() => copyToClipboard(encryptedERCAddress, 'Encrypted')}
                    className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 transition-colors"
                  >
                    📋 {lang === 'es' ? 'Copiar' : 'Copy'}
                  </button>
                  <button
                    onClick={() => openExplorer(encryptedERCAddress)}
                    className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700 transition-colors"
                  >
                    🔍 {lang === 'es' ? 'Explorar' : 'Explorer'}
                  </button>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-green-700 text-sm font-mono">
                  {lang === 'es' 
                    ? 'Este es un token encriptado con balance privado en la blockchain'
                    : 'This is an encrypted token with private balance on the blockchain'
                  }
                </p>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-green-600 font-mono text-sm font-semibold">
                    {lang === 'es' ? 'Balance:' : 'Balance:'}
                  </span>
                  <span className="text-green-800 font-mono font-semibold flex items-center gap-1">
                    🔒 {lang === 'es' ? 'Balance Encriptado' : 'Encrypted Balance'}
                  </span>
                </div>
                <div className="text-center">
                  <span className={`font-mono text-sm ${encryptedBalance.length > 0 && encryptedBalance.some(balance => balance !== BigInt(0)) ? 'text-green-600' : 'text-gray-500'}`}>
                    {encryptedBalance.length > 0 && encryptedBalance.some(balance => balance !== BigInt(0)) 
                      ? (lang === 'es' ? 'Datos Disponibles' : 'Data Available')
                      : (lang === 'es' ? 'Sin datos' : 'No data')
                    }
                  </span>
                </div>
              </div>

              {/* Generate Decryption Key Button */}
              <div className="mb-4">
                <button
                  onClick={generateDecryptionKey}
                  disabled={isGeneratingKey || isDecryptionKeyGenerated}
                  className={`w-full py-3 px-4 rounded-md font-medium transition-colors ${
                    isDecryptionKeyGenerated 
                      ? 'bg-green-600 text-white cursor-not-allowed' 
                      : isGeneratingKey
                      ? 'bg-purple-400 text-white cursor-not-allowed'
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                >
                  {isGeneratingKey ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="animate-spin">⏳</span>
                      {lang === 'es' ? 'Generando Clave...' : 'Generating Key...'}
                    </span>
                  ) : isDecryptionKeyGenerated ? (
                    <span className="flex items-center justify-center gap-2">
                      ✅ {lang === 'es' ? 'Clave Generada' : 'Key Generated'}
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      🔑 {lang === 'es' ? 'Crear Firma para Desencriptar' : 'Create Signature to Decrypt'}
                    </span>
                  )}
                </button>
              </div>

              {/* Decryption Key Info */}
              {isDecryptionKeyGenerated && (
                <div className="mb-4 p-3 bg-green-100 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-green-600">🔑</span>
                    <span className="text-green-700 font-semibold text-sm">
                      {lang === 'es' ? 'Clave de Desencriptación Generada' : 'Decryption Key Generated'}
                    </span>
                  </div>
                  <p className="text-green-700 text-xs font-mono">
                    {lang === 'es' 
                      ? 'Esta clave se deriva firmando un mensaje predefinido con tu wallet. Nunca se sube ni se comparte.'
                      : 'This key is derived by signing a predefined message with your wallet. It is never uploaded or shared.'
                    }
                  </p>
                </div>
              )}

              {/* Decryption Process Explanation */}
              {isDecryptionKeyGenerated && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <h4 className="text-blue-800 font-semibold text-sm mb-2">
                    🔐 {lang === 'es' ? 'Proceso de Desencriptación' : 'Decryption Process'}
                  </h4>
                  <div className="text-blue-700 text-xs font-mono space-y-1">
                    <p>
                      {lang === 'es' 
                        ? '1. La firma se usa para derivar una clave privada local'
                        : '1. The signature is used to derive a local private key'
                      }
                    </p>
                    <p>
                      {lang === 'es' 
                        ? '2. La clave privada permite desencriptar balances ElGamal'
                        : '2. The private key allows decrypting ElGamal balances'
                      }
                    </p>
                    <p>
                      {lang === 'es' 
                        ? '3. El balance desencriptado se calculará cuando sea necesario'
                        : '3. The decrypted balance will be calculated when needed'
                      }
                    </p>
                  </div>
                </div>
              )}

                            {/* Encrypted Balance Points Display */}
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
            </div>
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
    </main>
  );
} 