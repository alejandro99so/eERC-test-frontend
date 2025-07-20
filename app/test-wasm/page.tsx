'use client';
import { useState, useEffect, useCallback } from 'react';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSetActiveWallet } from '@privy-io/wagmi';
import { useWriteContract, useWaitForTransactionReceipt, useReadContract, usePublicClient } from 'wagmi';
import { encodeFunctionData } from 'viem';
import { generateRegistrationProof } from '../../utils/zkProof';
import { wasmLoader } from '../../utils/wasmLoader';
import eerc20Data from '../../constants/eerc20.json';
import { processPoseidonEncryption } from '@/public/eFunctions';

export default function TestWasmPage() {
  const [isClient, setIsClient] = useState(false);
  
  // Only initialize hooks on the client side
  const { ready, login, logout, authenticated, user } = usePrivy();
  const { wallets } = useWallets();
  const setActiveWallet = useSetActiveWallet();
  const [activeWalletIndex, setActiveWalletIndex] = useState<number>(0);
  const [testAddress, setTestAddress] = useState('0x1234567890123456789012345678901234567890');
  const [chainId, setChainId] = useState(43113);
  const [result, setResult] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isWasmLoading, setIsWasmLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [error, setError] = useState<string>('');
  const [wasmStatus, setWasmStatus] = useState<any>(null);
  const [tokenAmount, setTokenAmount] = useState<string>('');
  const [pendingEncryptionData, setPendingEncryptionData] = useState<any>(null);

  // Get the active wallet
  const activeWallet = wallets?.[activeWalletIndex];
  const activeWalletAddress = activeWallet?.address;

  // Contract configuration
  const REGISTRAR_ADDRESS = eerc20Data.registrar.address;
  const REGISTRAR_ABI = eerc20Data.registrar.abi;
  const ENCRYPTED_ERC_ADDRESS = eerc20Data.encryptedERC.address;
  const ENCRYPTED_ERC_ABI = eerc20Data.encryptedERC.abi;
  const TEST_ERC20_ADDRESS = eerc20Data.testERC20.address;
  const TEST_ERC20_ABI = eerc20Data.testERC20.abi;

  // Wagmi hooks for contract interaction
  const { data: writeData, writeContract: registerUser, isPending: isContractWriting, error: writeError } = useWriteContract();
  const { isLoading: isConfirming, error: transactionError } = useWaitForTransactionReceipt({
    hash: writeData,
  });
  
  // Hook for approve transaction
  const { 
    data: approveData, 
    writeContract: approveTokens, 
    isPending: isApproveWriting, 
    error: approveError 
  } = useWriteContract();
  const { isLoading: isApproveConfirming, error: approveTransactionError } = useWaitForTransactionReceipt({
    hash: approveData,
  });
  
  // Hook for deposit transaction
  const { 
    data: depositData, 
    writeContract: depositTokens, 
    isPending: isDepositWriting, 
    error: depositError 
  } = useWriteContract();
  const { isLoading: isDepositConfirming, error: depositTransactionError } = useWaitForTransactionReceipt({
    hash: depositData,
  });
  
  // Hook to check if user is already registered (only on client)
  const { data: isUserRegistered, isLoading: isCheckingRegistration } = useReadContract({
    address: REGISTRAR_ADDRESS as `0x${string}`,
    abi: REGISTRAR_ABI,
    functionName: 'isUserRegistered',
    args: [activeWalletAddress as `0x${string}`],
    query: {
      enabled: !!activeWalletAddress && isClient,
    },
  });

  // Hook to read encrypted ERC balance
  const { data: encryptedBalance, isLoading: isEncryptedBalanceLoading } = useReadContract({
    address: ENCRYPTED_ERC_ADDRESS as `0x${string}`,
    abi: ENCRYPTED_ERC_ABI,
    functionName: 'getBalanceFromTokenAddress',
    args: [activeWalletAddress as `0x${string}`, TEST_ERC20_ADDRESS as `0x${string}`],
    query: {
      enabled: !!activeWalletAddress && isClient,
    },
  });

  useEffect(() => {
    if (encryptedBalance) {
      console.log('🔍 Encrypted balance:',encryptedBalance);
    }
  }, [encryptedBalance]);

  // Hook to read original ERC20 decimals
  const { data: tokenDecimals, isLoading: isDecimalsLoading } = useReadContract({
    address: TEST_ERC20_ADDRESS as `0x${string}`,
    abi: TEST_ERC20_ABI,
    functionName: 'decimals',
    query: {
      enabled: isClient,
    },
  });

  // Hook to read user's public key from Registrar
  const { data: userPublicKey, isLoading: isPublicKeyLoading } = useReadContract({
    address: REGISTRAR_ADDRESS as `0x${string}`,
    abi: REGISTRAR_ABI,
    functionName: 'getUserPublicKey',
    args: [activeWalletAddress as `0x${string}`],
    query: {
      enabled: !!activeWalletAddress && isClient,
    },
  });

  // Hook to read original ERC20 balance
  const { data: originalBalance, isLoading: isOriginalBalanceLoading } = useReadContract({
    address: TEST_ERC20_ADDRESS as `0x${string}`,
    abi: TEST_ERC20_ABI,
    functionName: 'balanceOf',
    args: [activeWalletAddress as `0x${string}`],
    query: {
      enabled: !!activeWalletAddress && isClient,
    },
  });

  // Hook to read allowance for encryptedERC
  const { data: allowance, isLoading: isAllowanceLoading } = useReadContract({
    address: TEST_ERC20_ADDRESS as `0x${string}`,
    abi: TEST_ERC20_ABI,
    functionName: 'allowance',
    args: [activeWalletAddress as `0x${string}`, ENCRYPTED_ERC_ADDRESS as `0x${string}`],
    query: {
      enabled: !!activeWalletAddress && isClient,
    },
  });

  // Debug allowance hook
  useEffect(() => {
    console.log('🔍 Allowance Debug:', {
      activeWalletAddress,
      walletType: activeWallet?.walletClientType,
      isClient,
      isAuthenticated: authenticated,
      allowance: allowance?.toString(),
      isAllowanceLoading,
      enabled: !!activeWalletAddress && isClient
    });
  }, [activeWalletAddress, activeWallet?.walletClientType, isClient, authenticated, allowance, isAllowanceLoading]);

  // Log when allowance changes
  useEffect(() => {
    if (allowance !== undefined && allowance !== null) {
      console.log('💰 Allowance updated:', {
        allowance: allowance.toString(),
        formatted: formatBalance(allowance, tokenDecimals)
      });
    }
  }, [allowance, tokenDecimals]);

  // Public client for gas estimation
  const publicClient = usePublicClient();

  // Function to format balance with decimals
  const formatBalance = (balance: any, decimals: any) => {
    if (!balance || !decimals) return '0';
    
    try {
      const balanceBigInt = BigInt(balance);
      const decimalsNumber = Number(decimals);
      
      const divisor = BigInt(10 ** decimalsNumber);
      const wholePart = balanceBigInt / divisor;
      const fractionalPart = balanceBigInt % divisor;
      
      // Convert fractional part to string with leading zeros
      const fractionalString = fractionalPart.toString().padStart(decimalsNumber, '0');
      
      // Remove trailing zeros from fractional part
      const trimmedFractional = fractionalString.replace(/0+$/, '');
      
      if (trimmedFractional === '') {
        return wholePart.toString();
      }
      
      return `${wholePart}.${trimmedFractional}`;
    } catch (error) {
      return 'Error formatting balance';
    }
  };

  // Function to validate active wallet
  const validateActiveWallet = () => {
    if (!authenticated) {
      throw new Error('Please connect your wallet first!');
    }
    
    if (!activeWallet) {
      throw new Error('No active wallet found. Please select a wallet.');
    }
    
    if (!activeWalletAddress) {
      throw new Error('Active wallet address not available.');
    }
    
    console.log('✅ Active wallet validated:', {
      address: activeWalletAddress,
      walletType: activeWallet.walletClientType,
      index: activeWalletIndex
    });
    
    return activeWallet;
  };

  // Function to get the correct connector for the active wallet
  const getActiveWalletConnector = () => {
    if (!activeWallet) {
      throw new Error('No active wallet available');
    }
    
    // For Privy wallets, we need to use the wallet's connector
    // This ensures the transaction is sent through the correct wallet
    return activeWallet;
  };

  // Function to ensure we're using the correct wallet for transactions
  const ensureCorrectWallet = async () => {
    if (!activeWallet) {
      throw new Error('No active wallet available');
    }
    
    // Log the current wallet being used
    console.log('🔗 Using wallet for transaction:', {
      address: activeWallet.address,
      walletType: activeWallet.walletClientType,
      index: activeWalletIndex
    });
    
    return activeWallet;
  };

  // Function to switch active wallet
  const switchActiveWallet = (index: number) => {
    if (index >= 0 && index < (wallets?.length || 0)) {
      const selectedWallet = wallets[index];
      setActiveWalletIndex(index);
      
      // Set the active wallet in Privy's Wagmi wrapper
      setActiveWallet.setActiveWallet(selectedWallet);
      
      console.log('🔄 Switched to wallet:', {
        index,
        address: selectedWallet.address,
        walletType: selectedWallet.walletClientType,
        connectorType: selectedWallet.connectorType
      });
    }
  };

  // Reset active wallet index when wallets change
  useEffect(() => {
    if (wallets && wallets.length > 0) {
      // If current active wallet index is invalid, reset to 0
      if (activeWalletIndex >= wallets.length) {
        setActiveWalletIndex(0);
      }
      
      console.log('📋 Available wallets:', wallets.map((w, i) => ({
        index: i,
        address: w.address,
        walletType: w.walletClientType,
        connectorType: w.connectorType,
        isActive: i === activeWalletIndex
      })));
    }
  }, [wallets, activeWalletIndex]);



  // Set client flag on mount
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Debug loading states
  useEffect(() => {
    console.log('🔄 Loading state changed:', { isLoading, isWasmLoading, isRegistering, isContractWriting, isConfirming, isApproving, isApproveWriting, isApproveConfirming, isDepositing, isDepositWriting, isDepositConfirming });
  }, [isLoading, isWasmLoading, isRegistering, isContractWriting, isConfirming, isApproving, isApproveWriting, isApproveConfirming, isDepositing, isDepositWriting, isDepositConfirming]);

  // Handle contract write errors
  useEffect(() => {
    if (writeError) {
      console.error('❌ Contract write error:', writeError);
      
      let errorMessage = 'Error calling registration function';
      
      // Handle specific error types
      if (writeError.message?.includes('ConnectorAccountNotFoundError')) {
        errorMessage = 'Error de conexión: La cuenta de la wallet no se encuentra. Por favor, reconecta tu wallet.';
      } else if (writeError.message?.includes('UserRejectedRequestError')) {
        errorMessage = 'Transacción cancelada por el usuario.';
      } else if (writeError.message?.includes('InsufficientFundsError')) {
        errorMessage = 'Fondos insuficientes para pagar el gas de la transacción.';
      } else if (writeError.message?.includes('Unable to calculate gas limit')) {
        errorMessage = 'Error de gas: El contrato no puede calcular el límite de gas. Esto puede indicar que la prueba no es válida o que el usuario ya está registrado.';
      } else if (writeError.message?.includes('Contract function "register" reverted')) {
        errorMessage = 'Error del contrato: La función register falló. Verifica que la prueba sea válida y que el usuario no esté ya registrado.';
      } else if (writeError.message?.includes('Execution reverted for an unknown reason')) {
        errorMessage = 'Error de ejecución: El contrato falló durante la ejecución. Esto puede indicar que la prueba no es válida, el usuario ya está registrado, o hay un problema con los parámetros.';
      } else if (writeError.message) {
        errorMessage = writeError.message;
      }
      
      setError(errorMessage);
      setIsRegistering(false);
    }
  }, [writeError]);

  // Handle transaction receipt errors
  useEffect(() => {
    if (transactionError) {
      console.error('❌ Transaction error:', transactionError);
      const errorMessage = transactionError.message || 'Transaction failed';
      setError(errorMessage);
      setIsRegistering(false);
    }
  }, [transactionError]);

  // Handle successful transaction
  useEffect(() => {
    if (writeData && !isConfirming) {
      console.log('✅ Registration transaction completed!');
      setError('');
      setIsRegistering(false);
      alert('🎉 Registration completed successfully!');
    }
  }, [writeData, isConfirming]);

  // Handle deposit errors
  useEffect(() => {
    if (depositError) {
      console.error('❌ Deposit error:', depositError);
      
      let errorMessage = 'Error calling deposit function';
      
      // Handle specific error types
      if (depositError.message?.includes('ConnectorAccountNotFoundError')) {
        errorMessage = 'Error de conexión: La cuenta de la wallet no se encuentra. Por favor, reconecta tu wallet.';
      } else if (depositError.message?.includes('UserRejectedRequestError')) {
        errorMessage = 'Transacción de depósito cancelada por el usuario.';
      } else if (depositError.message?.includes('InsufficientFundsError')) {
        errorMessage = 'Fondos insuficientes para pagar el gas de la transacción de depósito.';
      } else if (depositError.message?.includes('Contract function "deposit" reverted')) {
        errorMessage = 'Error del contrato: La función deposit falló. Verifica que tengas suficientes tokens y que estés registrado.';
      } else if (depositError.message?.includes('Execution reverted for an unknown reason')) {
        errorMessage = 'Error de ejecución: El contrato falló durante el depósito. Esto puede indicar que no tienes suficientes tokens o no estás registrado.';
      } else if (depositError.message) {
        errorMessage = depositError.message;
      }
      
      setError(errorMessage);
      setIsDepositing(false);
    }
  }, [depositError]);

  // Handle deposit transaction receipt errors
  useEffect(() => {
    if (depositTransactionError) {
      console.error('❌ Deposit transaction error:', depositTransactionError);
      const errorMessage = depositTransactionError.message || 'Deposit transaction failed';
      setError(errorMessage);
      setIsDepositing(false);
    }
  }, [depositTransactionError]);

  // Handle approve errors
  useEffect(() => {
    if (approveError) {
      console.error('❌ Approve error:', approveError);
      
      let errorMessage = 'Error calling approve function';
      
      // Handle specific error types
      if (approveError.message?.includes('ConnectorAccountNotFoundError')) {
        errorMessage = 'Error de conexión: La cuenta de la wallet no se encuentra. Por favor, reconecta tu wallet.';
      } else if (approveError.message?.includes('UserRejectedRequestError')) {
        errorMessage = 'Transacción de approve cancelada por el usuario.';
      } else if (approveError.message?.includes('InsufficientFundsError')) {
        errorMessage = 'Fondos insuficientes para pagar el gas de la transacción de approve.';
      } else if (approveError.message?.includes('Contract function "approve" reverted')) {
        errorMessage = 'Error del contrato: La función approve falló. Verifica que tengas suficientes tokens.';
      } else if (approveError.message?.includes('Execution reverted for an unknown reason')) {
        errorMessage = 'Error de ejecución: El contrato falló durante el approve. Esto puede indicar que no tienes suficientes tokens.';
      } else if (approveError.message) {
        errorMessage = approveError.message;
      }
      
      setError(errorMessage);
      setIsApproving(false);
    }
  }, [approveError]);

  // Handle approve transaction receipt errors
  useEffect(() => {
    if (approveTransactionError) {
      console.error('❌ Approve transaction error:', approveTransactionError);
      const errorMessage = approveTransactionError.message || 'Approve transaction failed';
      setError(errorMessage);
      setIsApproving(false);
    }
  }, [approveTransactionError]);

  // Handle successful approve transaction
  useEffect(() => {
    if (approveData && !isApproveConfirming && pendingEncryptionData) {
      console.log('✅ Approve transaction completed!');
      setError('');
      setIsApproving(false);
      // After approve is successful, proceed with deposit
      console.log('🚀 Proceeding with deposit after successful approve...');
      setIsDepositing(true);
      
      // Call deposit with the stored encryption data
      handleDeposit(pendingEncryptionData);
      
      // Clear the pending data
      setPendingEncryptionData(null);
    }
  }, [approveData, isApproveConfirming, pendingEncryptionData]);

  // Handle successful deposit transaction
  useEffect(() => {
    if (depositData && !isDepositConfirming) {
      console.log('✅ Deposit transaction completed!');
      setError('');
      setIsDepositing(false);
      alert('🎉 Deposit completed successfully!');
    }
  }, [depositData, isDepositConfirming]);

  const testWasmLoader = async () => {
    try {
      setIsWasmLoading(true);
      setError('');
      
      console.log('🧪 Testing WASM loader...');
      const status = wasmLoader.getLoadingStatus();
      setWasmStatus(status);
      
      if (status.isLoaded) {
        console.log('✅ WASM already loaded');
        return;
      }
      
      console.log('📥 Loading WASM module...');
      const wasmModule = await wasmLoader.loadWasm();
      console.log('✅ WASM module loaded:', wasmModule);
      
      const newStatus = wasmLoader.getLoadingStatus();
      setWasmStatus(newStatus);
      
    } catch (error) {
      console.error('❌ WASM loader test failed:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsWasmLoading(false);
    }
  };

  // Function to handle approve and deposit process
  const handleEncryptTokens = async () => {
    try {
      validateActiveWallet();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return;
    }

    if (!tokenAmount || parseFloat(tokenAmount) <= 0) {
      setError('Please enter a valid amount of tokens to encrypt');
      return;
    }

    try {
      setError('');
      
      console.log('🔐 Starting encryption process...');
      console.log('User input amount:', tokenAmount);
      console.log('Active wallet address:', activeWalletAddress);
      
      if (userPublicKey && Array.isArray(userPublicKey) && userPublicKey.length >= 2) {
        console.log('User public key points:');
        console.log('x:', userPublicKey[0]?.toString());
        console.log('y:', userPublicKey[1]?.toString());
      } else {
        console.log('User public key not available or invalid format');
      }

      // Calculate amount with decimals
      const amountWithDecimals = tokenDecimals ? 
        BigInt(Math.floor(parseFloat(tokenAmount) * Math.pow(10, Number(tokenDecimals)))) : 
        BigInt(0);
      
      const { ciphertext, nonce, authKey } = processPoseidonEncryption(
          [BigInt(amountWithDecimals)],
          userPublicKey as unknown as bigint[],
        );
      console.log({ciphertext, nonce, authKey})
      
      // Create the encryption data object
      const encryptionData = {
        amount: amountWithDecimals.toString(),
        tokenAddress: TEST_ERC20_ADDRESS,
        amountPCT: [
          ...ciphertext,
          ...authKey,
          nonce,
        ] // Solo el ciphertext, que debería ser de 7 elementos
      };

      console.log('📊 Encryption data object:', encryptionData);
      
      // Check if allowance is sufficient
      console.log('🔍 Checking current allowance...');
      console.log('Current allowance:', allowance?.toString() || '0');
      console.log('Required amount:', amountWithDecimals.toString());
      console.log('Allowance type:', typeof allowance);
      console.log('Allowance raw:', allowance);
      console.log('Active wallet address when checking allowance:', activeWalletAddress);
      
      const currentAllowance = allowance ? BigInt(allowance.toString()) : BigInt(0);
      const requiredAmount = BigInt(encryptionData.amount);
      
      if (currentAllowance >= requiredAmount) {
        console.log('✅ Sufficient allowance already exists, proceeding directly to deposit...');
        // Store encryption data for use in deposit
        setPendingEncryptionData(encryptionData);
        // Proceed directly to deposit
        setIsDepositing(true);
        handleDeposit(encryptionData);
      } else {
        console.log('⚠️ Insufficient allowance, need to approve first...');
        console.log({current: currentAllowance, required:requiredAmount})
        // Store encryption data for use after approve
        setPendingEncryptionData(encryptionData);
        
        // First, call approve function
        console.log('🔐 Calling approve function...');
        console.log('Spender (encryptedERC):', ENCRYPTED_ERC_ADDRESS);
        console.log('Amount to approve:', encryptionData.amount);
        
        // Ensure we're using the correct wallet
        await ensureCorrectWallet();
        
        setIsApproving(true);
        
        approveTokens({
          address: TEST_ERC20_ADDRESS as `0x${string}`,
          abi: TEST_ERC20_ABI,
          functionName: 'approve',
          args: [
            ENCRYPTED_ERC_ADDRESS as `0x${string}`,
            BigInt(encryptionData.amount)
          ],
          account: activeWalletAddress as `0x${string}`,
        });
        
        console.log('✅ Approve transaction initiated!');
        
        // The deposit will be called automatically after approve succeeds
        // (handled in the useEffect for successful approve)
      }
      
    } catch (error) {
      console.error('❌ Encryption process failed:', error);
      setError(`Encryption process failed: ${error instanceof Error ? error.message : String(error)}`);
      setIsApproving(false);
      setIsDepositing(false);
    }
  };

  // Function to handle deposit after approve
  const handleDeposit = async (encryptionData: any) => {
    try {
      console.log('🚀 Calling deposit function...');
      console.log('Amount:', encryptionData.amount);
      console.log('Token Address:', encryptionData.tokenAddress);
      console.log('Amount PCT:', encryptionData.amountPCT);
      
      // Ensure we're using the correct wallet
      await ensureCorrectWallet();
      
      depositTokens({
        address: ENCRYPTED_ERC_ADDRESS as `0x${string}`,
        abi: ENCRYPTED_ERC_ABI,
        functionName: 'deposit',
        args: [
          BigInt(encryptionData.amount),
          encryptionData.tokenAddress as `0x${string}`,
          encryptionData.amountPCT
        ],
        account: activeWalletAddress as `0x${string}`,
      });
      
      console.log('✅ Deposit transaction initiated!');
    } catch (error) {
      console.error('❌ Deposit failed:', error);
      setError(`Deposit failed: ${error instanceof Error ? error.message : String(error)}`);
      setIsDepositing(false);
    }
  };

  const testProofGeneration = async () => {
    // Check if wallet is connected
    try {
      validateActiveWallet();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return;
    }

    try {
      console.log('🚀 Starting proof generation with loading state...');
      setIsLoading(true);
      setError('');
      setResult(null);
      
      // Add a small delay to see the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Use the active wallet address
      const walletAddress = activeWalletAddress;
      console.log('🧪 Testing proof generation...');
      console.log('Active Wallet Address:', walletAddress);
      console.log('Chain ID:', chainId);
      console.log('Loading state:', isLoading);
      
      const { proof, userKeys } = await generateRegistrationProof(walletAddress, chainId);
      
      console.log('✅ Proof generation successful');
      console.log('Proof:', proof);
      console.log('User Keys:', userKeys);
      
      setResult({ proof, userKeys });
      
    } catch (error) {
      console.error('❌ Proof generation test failed:', error);
      setError(error instanceof Error ? error.message : String(error));
    } finally {
      console.log('🏁 Finishing proof generation, clearing loading state...');
      setIsLoading(false);
    }
  };

  const validateProofOnly = async () => {
    if (!result) {
      setError('No proof available. Please generate a proof first.');
      return;
    }

    try {
      validateActiveWallet();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return;
    }

    if (!publicClient) {
      setError('Public client not available');
      return;
    }

    try {
      console.log('🔍 Validating proof structure...');
      console.log('Proof structure:', JSON.stringify(result.proof, null, 2));
      
      // Convert string values to BigInt for contract compatibility
      const convertedProof = {
        proofPoints: {
          a: result.proof.proofPoints.a.map((x: string) => BigInt(x)),
          b: result.proof.proofPoints.b.map((row: string[]) => row.map((x: string) => BigInt(x))),
          c: result.proof.proofPoints.c.map((x: string) => BigInt(x))
        },
        publicSignals: result.proof.publicSignals.map((x: string) => BigInt(x))
      };
      
      // Try to encode the function data
      const data = encodeFunctionData({
        abi: REGISTRAR_ABI,
        functionName: 'register',
        args: [convertedProof],
      });
      
      console.log('✅ Function data encoded successfully:', data);
      alert('✅ Proof validation successful! Function data encoded correctly.');
      
    } catch (error) {
      console.error('❌ Proof validation failed:', error);
      setError(`Proof validation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  const handleRegisterWithProof = async () => {
    if (!result) {
      setError('No proof available. Please generate a proof first.');
      return;
    }

    try {
      validateActiveWallet();
    } catch (error) {
      setError(error instanceof Error ? error.message : String(error));
      return;
    }

    // Check if user is already registered
    if (Boolean(isUserRegistered)) {
      setError('User is already registered!');
      return;
    }

    // Double-check registration status with a fresh call
    console.log('🔍 Double-checking registration status...');
    if (!publicClient) {
      throw new Error('Public client not available');
    }
    
    try {
      const freshRegistrationCheck = await publicClient.readContract({
        address: REGISTRAR_ADDRESS as `0x${string}`,
        abi: REGISTRAR_ABI,
        functionName: 'isUserRegistered',
        args: [activeWalletAddress as `0x${string}`],
      });
      
      if (Boolean(freshRegistrationCheck)) {
        setError('User is already registered! (Double-checked)');
        return;
      }
      
      console.log('✅ User is confirmed not registered');
    } catch (checkError) {
      console.warn('⚠️ Could not double-check registration status:', checkError);
    }

    try {
      setIsRegistering(true);
      setError('');
      
      console.log('🚀 Starting registration with proof...');
      console.log('Proof to register:', result.proof);
      console.log('Active wallet address:', activeWalletAddress);
      console.log('Is user registered:', isUserRegistered);
      
      // Estimate gas manually first
      console.log('⛽ Estimating gas for registration...');
      if (!publicClient) {
        throw new Error('Public client not available');
      }

      // Log the proof structure for debugging
      console.log('🔍 Proof structure being sent:', JSON.stringify(result.proof, null, 2));
      
      // Log individual components for detailed analysis
      console.log('📊 Proof Points A:', result.proof.proofPoints.a);
      console.log('📊 Proof Points B:', result.proof.proofPoints.b);
      console.log('📊 Proof Points C:', result.proof.proofPoints.c);
      console.log('📊 Public Signals:', result.proof.publicSignals);
      
      // Validate proof structure
      if (!result.proof.proofPoints || !result.proof.publicSignals) {
        throw new Error('Invalid proof structure: missing proofPoints or publicSignals');
      }
      
      if (!Array.isArray(result.proof.proofPoints.a) || result.proof.proofPoints.a.length !== 2) {
        throw new Error('Invalid proof structure: proofPoints.a should be an array of 2 elements');
      }
      
      if (!Array.isArray(result.proof.proofPoints.b) || result.proof.proofPoints.b.length !== 2) {
        throw new Error('Invalid proof structure: proofPoints.b should be an array of 2 arrays');
      }
      
      if (!Array.isArray(result.proof.proofPoints.c) || result.proof.proofPoints.c.length !== 2) {
        throw new Error('Invalid proof structure: proofPoints.c should be an array of 2 elements');
      }
      
      if (!Array.isArray(result.proof.publicSignals) || result.proof.publicSignals.length !== 5) {
        throw new Error('Invalid proof structure: publicSignals should be an array of 5 elements');
      }
      
      console.log('✅ Proof structure validation passed');

      // Convert string values to BigInt for contract compatibility
      const convertedProof = {
        proofPoints: {
          a: result.proof.proofPoints.a.map((x: string) => BigInt(x)),
          b: result.proof.proofPoints.b.map((row: string[]) => row.map((x: string) => BigInt(x))),
          c: result.proof.proofPoints.c.map((x: string) => BigInt(x))
        },
        publicSignals: result.proof.publicSignals.map((x: string) => BigInt(x))
      };
      
      console.log('🔄 Converted proof to BigInt format:', JSON.stringify(convertedProof, (key, value) => 
        typeof value === 'bigint' ? value.toString() : value, 2
      ));
      
      // Check if the address in publicSignals is correct
      const addressFromProof = convertedProof.publicSignals[2]; // Assuming address is at index 2
      const expectedAddress = BigInt(activeWalletAddress);
      
      console.log('🏠 Address from proof:', addressFromProof.toString());
      console.log('🏠 Expected address:', expectedAddress.toString());
      console.log('🏠 Addresses match:', addressFromProof === expectedAddress);
      
      if (addressFromProof !== expectedAddress) {
        console.warn('⚠️ Warning: Address in proof does not match connected wallet address');
      }

      // Encode the function data using viem
      const data = encodeFunctionData({
        abi: REGISTRAR_ABI,
        functionName: 'register',
        args: [convertedProof],
      });

      console.log('📄 Encoded function data:', data);

      try {
        // Estimate gas using the public client
        const estimatedGas = await publicClient.estimateGas({
          to: REGISTRAR_ADDRESS as `0x${string}`,
          data,
          account: activeWalletAddress as `0x${string}`,
        });

        console.log('✅ Gas estimated:', estimatedGas.toString());

        // Add 50% buffer to estimated gas for safety
        const gasWithBuffer = (estimatedGas * BigInt(150)) / BigInt(100);
        console.log('⛽ Gas with 50% buffer:', gasWithBuffer.toString());

        // Call the register function on the contract with estimated gas
        registerUser({
          address: REGISTRAR_ADDRESS as `0x${string}`,
          abi: REGISTRAR_ABI,
          functionName: 'register',
          args: [convertedProof],
          account: activeWalletAddress as `0x${string}`,
          gas: gasWithBuffer,
        });
      } catch (gasError) {
        console.error('❌ Gas estimation failed:', gasError);
        
        // If gas estimation fails, try with a reasonable gas limit as fallback
        console.log('🔄 Trying with reasonable gas limit as fallback...');
        registerUser({
          address: REGISTRAR_ADDRESS as `0x${string}`,
          abi: REGISTRAR_ABI,
          functionName: 'register',
          args: [convertedProof],
          account: activeWalletAddress as `0x${string}`,
          gas: BigInt(5000000), // 5M gas as fallback
        });
      }
      
    } catch (error) {
      console.error('❌ Registration failed:', error);
      setError(error instanceof Error ? error.message : String(error));
      setIsRegistering(false);
    }
  };

  // Fun loading animation component
  const FunLoadingSpinner = ({ type = 'proof' }: { type?: 'proof' | 'wasm' | 'register' | 'deposit' }) => {
    const [currentEmoji, setCurrentEmoji] = useState(0);
    const proofEmojis = ['🔮', '✨', '🌟', '💫', '⭐', '🎆', '🎇', '🎉', '🎊', '🎋', '🎍', '🎎', '🎏', '🎐', '🎀', '🎁'];
    const wasmEmojis = ['⚙️', '🔧', '🛠️', '📦', '📥', '📦', '🔨', '⚡', '🚀', '💻', '🔌', '🔋', '💾', '🖥️', '📱', '💡'];
    const registerEmojis = ['📝', '✍️', '📋', '📄', '📜', '📚', '📖', '📗', '📘', '📙', '📕', '📓', '📔', '📒', '📑', '🔖'];
    const depositEmojis = ['💰', '💎', '🔐', '🛡️', '⚡', '🚀', '💫', '🌟', '✨', '🎯', '🎪', '🎨', '🎭', '🎪', '🎯', '💎'];
    
    const emojis = type === 'proof' ? proofEmojis : type === 'wasm' ? wasmEmojis : type === 'deposit' ? depositEmojis : registerEmojis;
    const isActive = type === 'proof' ? isLoading : type === 'wasm' ? isWasmLoading : type === 'deposit' ? (isDepositing || isDepositWriting || isDepositConfirming) : (isRegistering || isContractWriting || isConfirming);
    
    useEffect(() => {
      if (!isActive) return;
      
      const interval = setInterval(() => {
        setCurrentEmoji((prev) => (prev + 1) % emojis.length);
      }, 200);
      
      return () => clearInterval(interval);
    }, [isActive, emojis.length]);
    
    return (
      <div className="flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          {/* Main spinning emoji */}
          <div className="text-6xl animate-spin">
            {emojis[currentEmoji]}
          </div>
          
          {/* Orbiting emojis */}
          <div className="absolute inset-0 animate-ping">
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-2xl">
              🔐
            </div>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '0.5s' }}>
            <div className="absolute top-1/2 right-0 transform translate-x-1/2 -translate-y-1/2 text-2xl">
              🧮
            </div>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '1s' }}>
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 text-2xl">
              ⚡
            </div>
          </div>
          <div className="absolute inset-0 animate-ping" style={{ animationDelay: '1.5s' }}>
            <div className="absolute top-1/2 left-0 transform -translate-x-1/2 -translate-y-1/2 text-2xl">
              🔢
            </div>
          </div>
        </div>
        
                 {/* Loading text with typing animation */}
         <div className="text-center">
           <div className="text-lg font-semibold text-gray-700 mb-2">
             {type === 'proof' ? (
               <>
                 <span className="inline-block animate-bounce">G</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>e</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>n</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>e</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>r</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>a</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>t</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.7s' }}>i</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.8s' }}>n</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.9s' }}>g</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1s' }}> </span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.1s' }}>Z</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.2s' }}>K</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.3s' }}> </span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.4s' }}>P</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.5s' }}>r</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.6s' }}>o</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.7s' }}>o</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.8s' }}>f</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.9s' }}>s</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '2s' }}>.</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '2.1s' }}>.</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '2.2s' }}>.</span>
               </>
             ) : type === 'wasm' ? (
               <>
                 <span className="inline-block animate-bounce">L</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>o</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>a</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>d</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>i</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>n</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>g</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.7s' }}> </span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.8s' }}>W</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.9s' }}>A</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1s' }}>S</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.1s' }}>M</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.2s' }}>.</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.3s' }}>.</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.4s' }}>.</span>
               </>
             ) : type === 'deposit' ? (
               <>
                 <span className="inline-block animate-bounce">D</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>e</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>p</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>o</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>s</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>i</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>t</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.7s' }}>i</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.8s' }}>n</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.9s' }}>g</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1s' }}>.</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.1s' }}>.</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.2s' }}>.</span>
               </>
             ) : (
               <>
                 <span className="inline-block animate-bounce">R</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.1s' }}>e</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.2s' }}>g</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.3s' }}>i</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.4s' }}>s</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.5s' }}>t</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.6s' }}>e</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.7s' }}>r</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.8s' }}>i</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '0.9s' }}>n</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1s' }}>g</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.1s' }}>.</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.2s' }}>.</span>
                 <span className="inline-block animate-bounce" style={{ animationDelay: '1.3s' }}>.</span>
               </>
             )}
           </div>
           
           {/* Fun loading messages */}
           <div className="text-sm text-gray-500 space-y-1">
             {type === 'proof' ? (
               <>
                 <div className="animate-pulse">🔮 Summoning cryptographic spirits...</div>
                 <div className="animate-pulse" style={{ animationDelay: '0.5s' }}>✨ Casting zero-knowledge spells...</div>
                 <div className="animate-pulse" style={{ animationDelay: '1s' }}>🌟 Brewing mathematical potions...</div>
                 <div className="animate-pulse" style={{ animationDelay: '1.5s' }}>💫 Weaving blockchain magic...</div>
               </>
             ) : type === 'wasm' ? (
               <>
                 <div className="animate-pulse">⚙️ Compiling Go to WebAssembly...</div>
                 <div className="animate-pulse" style={{ animationDelay: '0.5s' }}>🔧 Loading cryptographic modules...</div>
                 <div className="animate-pulse" style={{ animationDelay: '1s' }}>📦 Initializing WASM runtime...</div>
                 <div className="animate-pulse" style={{ animationDelay: '1.5s' }}>🚀 Preparing for takeoff...</div>
               </>
             ) : type === 'deposit' ? (
               <>
                 <div className="animate-pulse">💰 Encrypting your tokens...</div>
                 <div className="animate-pulse" style={{ animationDelay: '0.5s' }}>🔐 Applying cryptographic protection...</div>
                 <div className="animate-pulse" style={{ animationDelay: '1s' }}>🛡️ Securing your deposit...</div>
                 <div className="animate-pulse" style={{ animationDelay: '1.5s' }}>💎 Adding to encrypted balance...</div>
               </>
             ) : (
               <>
                 <div className="animate-pulse">📝 Preparing registration documents...</div>
                 <div className="animate-pulse" style={{ animationDelay: '0.5s' }}>✍️ Signing blockchain papers...</div>
                 <div className="animate-pulse" style={{ animationDelay: '1s' }}>📋 Submitting to smart contract...</div>
                 <div className="animate-pulse" style={{ animationDelay: '1.5s' }}>📚 Recording in blockchain ledger...</div>
               </>
             )}
           </div>
         </div>
        
        {/* Progress bar */}
        <div className="w-64 bg-gray-200 rounded-full h-2 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 rounded-full animate-pulse"></div>
        </div>
      </div>
    );
  };

      return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-8">🧪 WASM & zkProof Test</h1>
            
            {/* Client-side loading indicator */}
            {!isClient && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-8">
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-yellow-600 mr-3"></div>
                  <p className="text-yellow-800 font-medium">🔄 Loading client-side components...</p>
                </div>
              </div>
            )}
            
            {/* Wallet Connection Section */}
            <div className="bg-blue-50 rounded-lg p-6 mb-8">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">🔗 Wallet Connection</h2>
              
              <div className="text-center mb-4">
                {ready ? (
                  <div className="text-green-600 font-semibold text-lg">✅ Privy is ready!</div>
                ) : (
                  <div className="text-blue-600 font-semibold text-lg">⏳ Loading...</div>
                )}
              </div>

              {!authenticated ? (
                <div className="text-center">
                                <button
                onClick={login}
                disabled={!isClient}
                className="bg-purple-600 text-white py-3 px-6 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                {!isClient ? '⏳ Loading...' : '🔗 Connect Wallet'}
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
                          {/* Registration status */}
                          {isCheckingRegistration ? (
                            <p className="text-blue-600 text-sm">🔄 Checking registration status...</p>
                          ) : Boolean(isUserRegistered) ? (
                            <p className="text-orange-600 text-sm font-medium">⚠️ Already registered!</p>
                          ) : (
                            <p className="text-green-600 text-sm">✅ Not registered yet</p>
                          )}
                        </div>
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
              )}
            </div>
            
            {/* Wallet Selection Section */}
            {authenticated && wallets && wallets.length > 0 && (
              <div className="bg-yellow-50 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-yellow-900 mb-4">🔗 Wallet Selection</h2>
                
                <div className="space-y-4">
                  <div className="text-sm text-yellow-800 mb-3">
                    <strong>Connected Wallets:</strong> {wallets.length} wallet{wallets.length !== 1 ? 's' : ''}
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wallets.map((wallet, index) => (
                      <div 
                        key={wallet.address}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          index === activeWalletIndex 
                            ? 'border-green-500 bg-green-50' 
                            : 'border-gray-300 bg-white hover:border-gray-400'
                        }`}
                        onClick={() => switchActiveWallet(index)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              index === activeWalletIndex ? 'bg-green-500' : 'bg-gray-300'
                            }`}></div>
                            <span className="font-medium text-sm">
                              {wallet.walletClientType || 'Unknown'}
                            </span>
                          </div>
                          {index === activeWalletIndex && (
                            <span className="text-green-600 text-xs font-medium">ACTIVE</span>
                          )}
                        </div>
                        <div className="text-xs text-gray-600 font-mono break-all">
                          {wallet.address}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {index === activeWalletIndex ? '✅ Selected for transactions' : 'Click to select'}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {activeWallet && (
                    <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
                      <div className="text-sm text-blue-800">
                        <strong>Active Wallet:</strong> {activeWallet.walletClientType || 'Unknown'} 
                        ({activeWalletAddress?.slice(0, 6)}...{activeWalletAddress?.slice(-4)})
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* User Information Section */}
            {authenticated && activeWalletAddress && (
              <div className="bg-indigo-50 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-indigo-900 mb-4">👤 User Information</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Wallet Info */}
                  <div className="bg-white rounded-md p-4 border">
                    <h3 className="font-medium text-gray-900 mb-2">🔗 Wallet Details</h3>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>Address:</strong> {activeWalletAddress}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Registration Status:</strong> 
                        {isCheckingRegistration ? (
                          <span className="text-blue-600 ml-1">🔄 Checking...</span>
                        ) : Boolean(isUserRegistered) ? (
                          <span className="text-green-600 ml-1">✅ Registered</span>
                        ) : (
                          <span className="text-orange-600 ml-1">⚠️ Not Registered</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Public Key Info */}
                  {Boolean(isUserRegistered) && (
                    <div className="bg-white rounded-md p-4 border">
                      <h3 className="font-medium text-gray-900 mb-2">🔐 Public Key</h3>
                      <div className="space-y-2">
                        {isPublicKeyLoading ? (
                          <div className="text-sm text-blue-600">🔄 Loading public key...</div>
                        ) : userPublicKey && Array.isArray(userPublicKey) && userPublicKey.length >= 2 ? (
                          <>
                            <div className="text-sm text-gray-600">
                              <strong>X Coordinate:</strong> 
                              <div className="font-mono text-xs mt-1 break-all">
                                {userPublicKey[0]?.toString()}
                              </div>
                            </div>
                            <div className="text-sm text-gray-600">
                              <strong>Y Coordinate:</strong> 
                              <div className="font-mono text-xs mt-1 break-all">
                                {userPublicKey[1]?.toString()}
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="text-sm text-orange-600">⚠️ Public key not available</div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {/* Token Balances Section */}
            {authenticated && activeWalletAddress && (
              <div className="bg-purple-50 rounded-lg p-6 mb-8">
                <h2 className="text-xl font-semibold text-purple-900 mb-4">💰 Token Balances</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Original ERC20 Balance */}
                  <div className="bg-white rounded-md p-4 border">
                    <h3 className="font-medium text-gray-900 mb-2">🪙 Original ERC20 Token</h3>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>Token Address:</strong> {TEST_ERC20_ADDRESS}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Status:</strong> 
                        {isOriginalBalanceLoading ? (
                          <span className="text-blue-600 ml-1">🔄 Loading...</span>
                        ) : (
                          <span className="text-green-600 ml-1">✅ Loaded</span>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        <strong>Balance:</strong> 
                        {isOriginalBalanceLoading || isDecimalsLoading ? (
                          <span className="text-blue-600 ml-2">Loading...</span>
                        ) : originalBalance ? (
                          <span className="text-green-600 ml-2">
                            {formatBalance(originalBalance, tokenDecimals)} tokens
                          </span>
                        ) : (
                          <span className="text-gray-500 ml-2">0 tokens</span>
                        )}
                      </div>
                      {tokenDecimals && (
                        <div className="text-xs text-gray-500">
                          <strong>Decimals:</strong> {tokenDecimals}
                        </div>
                      )}
                      {allowance !== undefined && allowance !== null && (
                        <div className="text-xs text-gray-500">
                          <strong>Allowance for eERC:</strong> {isAllowanceLoading ? 'Loading...' : formatBalance(allowance, tokenDecimals)} tokens
                        </div>
                      )}
                      
                      {/* Token Encryption Section */}
                      <div className="mt-4 pt-4 border-t border-gray-200">
                        <h4 className="font-medium text-gray-900 mb-3">🔐 Encrypt Tokens</h4>
                        
                        {/* Amount Input */}
                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Amount to Encrypt
                          </label>
                          <input
                            type="number"
                            step="0.000001"
                            value={tokenAmount}
                            onChange={(e) => setTokenAmount(e.target.value)}
                            placeholder="Enter amount (e.g., 1.5)"
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                          />
                        </div>
                        
                        {/* Encrypt Button */}
                        <button
                          onClick={handleEncryptTokens}
                          disabled={!authenticated || !activeWalletAddress || !tokenAmount || parseFloat(tokenAmount) <= 0 || isApproving || isApproveWriting || isApproveConfirming || isDepositing || isDepositWriting || isDepositConfirming}
                          className="w-full bg-purple-600 text-white py-2 px-4 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                        >
                          {isApproving || isApproveWriting || isApproveConfirming ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {isApproving ? 'Approving...' : isApproveWriting ? 'Signing Approve...' : 'Confirming Approve...'}
                            </div>
                          ) : isDepositing || isDepositWriting || isDepositConfirming ? (
                            <div className="flex items-center justify-center">
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                              {isDepositing ? 'Encrypting...' : isDepositWriting ? 'Signing...' : 'Confirming...'}
                            </div>
                          ) : (
                            '🔐 Encrypt My Tokens'
                          )}
                        </button>
                        
                        {/* Fun loading overlay for approve and deposit */}
                        {(isApproving || isApproveWriting || isApproveConfirming || isDepositing || isDepositWriting || isDepositConfirming) && (
                          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg p-8 max-w-md mx-4">
                              <FunLoadingSpinner type="deposit" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Encrypted ERC Balance */}
                  <div className="bg-white rounded-md p-4 border">
                    <h3 className="font-medium text-gray-900 mb-2">🔐 Encrypted eERC Token</h3>
                    <div className="space-y-2">
                      <div className="text-sm text-gray-600">
                        <strong>Contract Address:</strong> {ENCRYPTED_ERC_ADDRESS}
                      </div>
                      <div className="text-sm text-gray-600">
                        <strong>Status:</strong> 
                        {isEncryptedBalanceLoading ? (
                          <span className="text-blue-600 ml-1">🔄 Loading...</span>
                        ) : (
                          <span className="text-green-600 ml-1">✅ Loaded</span>
                        )}
                      </div>
                      <div className="text-lg font-semibold text-gray-900">
                        <strong>Balance:</strong> 
                        {isEncryptedBalanceLoading ? (
                          <span className="text-blue-600 ml-2">Loading...</span>
                        ) : encryptedBalance ? (
                          <span className="text-purple-600 ml-2">
                            {(() => {
                              try {
                                if (Array.isArray(encryptedBalance) && encryptedBalance.length >= 4) {
                                  const balancePCT = encryptedBalance[3]; // balancePCT está en el índice 3
                                  if (Array.isArray(balancePCT)) {
                                    return `[${balancePCT.map((pct: any) => pct?.toString() || '0').join(', ')}]`;
                                  }
                                }
                                return 'Encrypted balance available';
                              } catch (error) {
                                return 'Error parsing balance';
                              }
                            })()}
                          </span>
                        ) : (
                          <span className="text-gray-500 ml-2">No encrypted balance</span>
                        )}
                      </div>
                      {encryptedBalance && Array.isArray(encryptedBalance) && (
                        <div className="text-xs text-gray-500 mt-2">
                          <div><strong>Nonce:</strong> {encryptedBalance[1]?.toString() || 'N/A'}</div>
                          <div><strong>Transaction Index:</strong> {encryptedBalance[4]?.toString() || 'N/A'}</div>
                          <div><strong>Amount PCTs:</strong> {Array.isArray(encryptedBalance[2]) ? encryptedBalance[2].length : 0} items</div>
                          {encryptedBalance[0] && typeof encryptedBalance[0] === 'object' && (
                            <>
                              <div><strong>c1:</strong> x: {encryptedBalance[0].c1?.x?.toString() || 'N/A'}, y: {encryptedBalance[0].c1?.y?.toString() || 'N/A'}</div>
                              <div><strong>c2:</strong> x: {encryptedBalance[0].c2?.x?.toString() || 'N/A'}, y: {encryptedBalance[0].c2?.y?.toString() || 'N/A'}</div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* WASM Loader Test */}
            <div className="bg-blue-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-blue-900 mb-4">WASM Loader Test</h2>
              
              <button
                onClick={testWasmLoader}
                disabled={isWasmLoading || !isClient}
                className="w-full bg-blue-600 text-white py-3 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium mb-4 cursor-pointer"
              >
                {!isClient ? '⏳ Loading...' : isWasmLoading ? 'Testing...' : 'Test WASM Loader'}
              </button>
              
              {/* Fun loading overlay for WASM */}
              {isWasmLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md mx-4">
                    <FunLoadingSpinner type="wasm" />
                  </div>
                </div>
              )}
              
              {wasmStatus && (
                <div className="bg-white rounded-md p-4 border">
                  <h3 className="font-medium text-gray-900 mb-2">WASM Status:</h3>
                  <div className="space-y-1 text-sm">
                    <div>Loading: {wasmStatus.isLoading ? '🔄 Yes' : '❌ No'}</div>
                    <div>Loaded: {wasmStatus.isLoaded ? '✅ Yes' : '❌ No'}</div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Proof Generation Test */}
            <div className="bg-green-50 rounded-lg p-6">
              <h2 className="text-xl font-semibold text-green-900 mb-4">🔐 Proof Generation Test</h2>
              
              {authenticated && activeWalletAddress ? (
                <div className="mb-4 p-3 bg-green-100 rounded-md">
                  <p className="text-sm text-green-800">
                    <strong>Active Wallet Address:</strong> {activeWalletAddress}
                  </p>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-yellow-100 rounded-md">
                  <p className="text-sm text-yellow-800">
                    ⚠️ Please connect your wallet first to generate a proof with your address
                  </p>
                </div>
              )}
              
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Chain ID
                  </label>
                  <input
                    type="number"
                    value={chainId}
                    onChange={(e) => setChainId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <button
                onClick={testProofGeneration}
                disabled={isLoading || !authenticated || !activeWalletAddress || !isClient}
                className="w-full bg-green-600 text-white py-3 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
              >
                {!isClient ? '⏳ Loading...' : isLoading ? 'Generating...' : 'Generate Proof with Connected Wallet'}
              </button>
              
              {/* Fun loading overlay */}
              {isLoading && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md mx-4">
                    <FunLoadingSpinner />
                  </div>
                </div>
              )}
              
              {/* Fun loading overlay for registration */}
              {isRegistering && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-8 max-w-md mx-4">
                    <FunLoadingSpinner type="register" />
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {/* Error Display */}
          {error && (
            <div className="mt-8 bg-red-50 border border-red-200 rounded-md p-4">
              <h3 className="text-red-800 font-medium mb-2">❌ Error</h3>
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}
          
          {/* Result Display */}
          {result && (
            <div className="mt-8 bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">✅ Test Results</h3>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">User Keys:</h4>
                  <div className="bg-white rounded-md p-4 border text-sm font-mono">
                    <div>Address: {result.userKeys.address}</div>
                    <div>Private Key (raw): {result.userKeys.privateKey.raw.slice(0, 20)}...</div>
                    <div>Private Key (formatted): {result.userKeys.privateKey.formatted.slice(0, 20)}...</div>
                    <div>Public Key X: {result.userKeys.publicKey.x.slice(0, 20)}...</div>
                    <div>Public Key Y: {result.userKeys.publicKey.y.slice(0, 20)}...</div>
                    <div>Registration Hash: {result.userKeys.registrationHash.slice(0, 20)}...</div>
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Proof Structure:</h4>
                  <div className="bg-white rounded-md p-4 border text-sm font-mono">
                    <div>Proof Points A: [{result.proof.proofPoints.a[0].slice(0, 20)}..., {result.proof.proofPoints.a[1].slice(0, 20)}...]</div>
                    <div>Proof Points B: [[{result.proof.proofPoints.b[0][0].slice(0, 20)}..., {result.proof.proofPoints.b[0][1].slice(0, 20)}...], [{result.proof.proofPoints.b[1][0].slice(0, 20)}..., {result.proof.proofPoints.b[1][1].slice(0, 20)}...]]</div>
                    <div>Proof Points C: [{result.proof.proofPoints.c[0].slice(0, 20)}..., {result.proof.proofPoints.c[1].slice(0, 20)}...]</div>
                    <div>Public Signals: [{result.proof.publicSignals.map((s: string) => s.slice(0, 20) + '...').join(', ')}]</div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="text-center space-y-4">
                {/* Validate Proof Button */}
                <button
                  onClick={validateProofOnly}
                  disabled={isRegistering || isContractWriting || isConfirming || !isClient}
                  className="bg-blue-600 text-white py-2 px-6 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium cursor-pointer"
                >
                  {!isClient ? '⏳ Loading...' : '🔍 Validate Proof Only'}
                </button>
                
                {/* Register Button */}
                <div>
                  <button
                    onClick={handleRegisterWithProof}
                    disabled={isRegistering || isContractWriting || isConfirming || Boolean(isUserRegistered) || !isClient || !activeWalletAddress}
                    className="bg-purple-600 text-white py-3 px-8 rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg transform hover:scale-105 active:scale-95 cursor-pointer"
                  >
                    {isRegistering || isContractWriting || isConfirming ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        {isRegistering ? 'Preparing...' : isContractWriting ? 'Signing...' : 'Confirming...'}
                      </div>
                    ) : (
                      '📝 Register with Proof'
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* Navigation */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <a
              href="/"
              className="text-blue-600 hover:text-blue-800 font-medium"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    </div>
  );
} 