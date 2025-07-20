# Frontend Web3 - Next.js + Privy + Wagmi

## 🇺🇸 English

This is a [Next.js](https://nextjs.org) project that integrates wallet authentication with Privy and smart contract interaction using Wagmi, configured to work with Avalanche Fuji Testnet.

**Repository:** https://github.com/alejandro99so/front-privy

### 🚀 Features

- **Wallet Authentication**: Complete integration with Privy for wallet connection
- **Smart Contract Interaction**: Read and write smart contracts using Wagmi
- **Avalanche Fuji Network**: Configured to work with Avalanche Fuji Testnet
- **Modern UI**: Clean and responsive interface with Tailwind CSS
- **TypeScript**: Fully typed code

### 📋 Prerequisites

- Node.js 18+
- npm
- Compatible wallet (MetaMask, Core Wallet, etc.)

### 🔧 Setup

#### 1. Environment Variables

Copy the `env.example` file to `.env` and update the variables:

```bash
cp env.example .env
```

Then edit the `.env` file with your credentials:

```bash
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id_here
```

**Get Privy credentials:**
1. Go to [dashboard.privy.io](https://dashboard.privy.io)
2. Create a new application
3. Copy the App ID and Client ID

#### 2. Contract Configuration

The project includes a sample contract configured. If you want to use your own contract, update the `constants/index.ts` file:

```typescript
export const CONTRACT_ADDRESS = "0x..."; // Your contract address
export const CONTRACT_ABI = [...]; // Your contract ABI
```

### 🏗️ Project Architecture

#### File Structure

```
frontend-web3/
├── app/
│   ├── components/
│   │   ├── PrivyProviderWrapper.tsx  # Privy configuration
│   │   └── WagmiProvider.tsx         # Wagmi configuration
│   ├── layout.tsx                    # Main layout with providers
│   └── page.tsx                      # Main component
├── constants/
│   └── index.ts                      # Contract configuration
└── ...
```

#### Providers and Configuration

##### Layout (`app/layout.tsx`)
```typescript
// Provider order: Wagmi → Privy → App
<WagmiProviderWrapper>
  <PrivyProviderWrapper>
    {children}
  </PrivyProviderWrapper>
</WagmiProviderWrapper>
```

##### WagmiProvider (`app/components/WagmiProvider.tsx`)
- Avalanche Fuji configuration
- QueryClient for caching
- RPC configured by default

##### PrivyProvider (`app/components/PrivyProviderWrapper.tsx`)
- Wallet authentication
- Embedded wallets enabled
- Supported networks: Avalanche Fuji

#### Main Component (`app/page.tsx`)

##### Hooks Used
```typescript
// Privy hooks
const { ready, login, logout, authenticated, user } = usePrivy();
const { wallets } = useWallets();

// Wagmi hooks
const { data: currentName, refetch: refetchName } = useReadContract({...});
const { data: writeData, writeContract: updateName, isPending } = useWriteContract();
const { isLoading: isConfirming } = useWaitForTransactionReceipt({...});
```

##### Implemented Features

1. **Wallet Connection**
   - Privy connection button
   - Wallet information display
   - Disconnect button

2. **Contract Reading**
   - `useReadContract` hook for `sayName()`
   - Auto-refresh after transactions
   - Loading state

3. **Contract Writing**
   - `useWriteContract` hook for `updateName()`
   - Input validation
   - Pending and confirming states
   - Error handling

4. **User Interface**
   - Responsive design with Tailwind
   - Visual loading states
   - Form validations
   - Enter key support

### 🚀 Installation and Execution

```bash
# Install dependencies
npm install

# Run in development
npm run dev

# Build for production
npm run build

# Run in production
npm start
```

Open [http://localhost:3000](http://localhost:3000) to see the result.

### 📚 Main Dependencies

- **Next.js 15**: React framework
- **Privy**: Wallet authentication
- **Wagmi**: Smart contract interaction
- **Viem**: Ethereum client
- **Tailwind CSS**: Styling

### 🔗 Supported Networks

- **Avalanche Fuji Testnet** (Chain ID: 43113)
- RPC configured by default

### 🎯 Contract Features

The project includes a sample contract with the following functions:

- `sayName()`: Read function that returns a string
- `updateName(string)`: Write function that updates the name

### 🛠️ Customization

#### Change Contract
To use your own contract, modify the `constants/index.ts` file:

```typescript
export const CONTRACT_ADDRESS = "0x..."; // Your contract address
export const CONTRACT_ABI = [...]; // Your contract ABI
```

#### Add New Networks
```typescript
// In WagmiProvider.tsx
import { avalancheFuji, mainnet } from 'wagmi/chains';

const config = createConfig({
  chains: [avalancheFuji, mainnet],
  // ...
});
```

### 📖 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Documentation](https://docs.privy.io/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Avalanche Documentation](https://build.avax.network/docs/)

### 🤝 Contributing

1. Fork the project
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 🇪🇸 Español

Este es un proyecto [Next.js](https://nextjs.org) que integra autenticación de wallet con Privy y interacción con contratos inteligentes usando Wagmi, configurado para trabajar con Avalanche Fuji Testnet.

**Repositorio:** https://github.com/alejandro99so/front-privy

## 🚀 Características

- **Autenticación de Wallet**: Integración completa con Privy para conexión de wallets
- **Interacción con Contratos**: Lectura y escritura de contratos inteligentes usando Wagmi
- **Red Avalanche Fuji**: Configurado para trabajar con Avalanche Fuji Testnet
- **UI Moderna**: Interfaz limpia y responsive con Tailwind CSS
- **TypeScript**: Código completamente tipado

## 📋 Prerrequisitos

- Node.js 18+ 
- npm
- Wallet compatible (MetaMask, Core Wallet, etc.)

## 🔧 Configuración

### 1. Variables de Entorno

Copia el archivo `env.example` a `.env` y actualiza las variables:

```bash
cp env.example .env
```

Luego edita el archivo `.env` con tus credenciales:

```bash
# Privy Configuration
NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id_here
NEXT_PUBLIC_PRIVY_CLIENT_ID=your_privy_client_id_here
```

**Obtener credenciales de Privy:**
1. Ve a [dashboard.privy.io](https://dashboard.privy.io)
2. Crea una nueva aplicación
3. Copia el App ID y Client ID

### 2. Configuración del Contrato

El proyecto incluye un contrato de ejemplo configurado. Si quieres usar tu propio contrato, actualiza el archivo `constants/index.ts`:

```typescript
export const CONTRACT_ADDRESS = "0x..."; // Dirección de tu contrato
export const CONTRACT_ABI = [...]; // ABI de tu contrato
```

## 🏗️ Arquitectura del Proyecto

### Estructura de Archivos

```
frontend-web3/
├── app/
│   ├── components/
│   │   ├── PrivyProviderWrapper.tsx  # Configuración de Privy
│   │   └── WagmiProvider.tsx         # Configuración de Wagmi
│   ├── layout.tsx                    # Layout principal con providers
│   └── page.tsx                      # Componente principal
├── constants/
│   └── index.ts                      # Configuración del contrato
└── ...
```

### Providers y Configuración

#### Layout (`app/layout.tsx`)
```typescript
// Orden de providers: Wagmi → Privy → App
<WagmiProviderWrapper>
  <PrivyProviderWrapper>
    {children}
  </PrivyProviderWrapper>
</WagmiProviderWrapper>
```

#### WagmiProvider (`app/components/WagmiProvider.tsx`)
- Configuración de Avalanche Fuji
- QueryClient para cache
- RPC configurado por defecto

#### PrivyProvider (`app/components/PrivyProviderWrapper.tsx`)
- Autenticación de wallet
- Embedded wallets habilitadas
- Redes soportadas: Avalanche Fuji

### Componente Principal (`app/page.tsx`)

#### Hooks Utilizados
```typescript
// Privy hooks
const { ready, login, logout, authenticated, user } = usePrivy();
const { wallets } = useWallets();

// Wagmi hooks
const { data: currentName, refetch: refetchName } = useReadContract({...});
const { data: writeData, writeContract: updateName, isPending } = useWriteContract();
const { isLoading: isConfirming } = useWaitForTransactionReceipt({...});
```

#### Funcionalidades Implementadas

1. **Conexión de Wallet**
   - Botón de conexión con Privy
   - Visualización de información de wallet
   - Botón de desconexión

2. **Lectura del Contrato**
   - Hook `useReadContract` para `sayName()`
   - Auto-refresh después de transacciones
   - Estado de loading

3. **Escritura del Contrato**
   - Hook `useWriteContract` para `updateName()`
   - Validación de entrada
   - Estados de pending y confirming
   - Manejo de errores

4. **Interfaz de Usuario**
   - Diseño responsive con Tailwind
   - Estados visuales para loading
   - Validaciones de formulario
   - Soporte para Enter key

## 🚀 Instalación y Ejecución

```bash
# Instalar dependencias
npm install

# Ejecutar en desarrollo
npm run dev

# Construir para producción
npm run build

# Ejecutar en producción
npm start
```

Abre [http://localhost:3000](http://localhost:3000) para ver el resultado.

## 📚 Dependencias Principales

- **Next.js 15**: Framework de React
- **Privy**: Autenticación de wallet
- **Wagmi**: Interacción con contratos inteligentes
- **Viem**: Cliente Ethereum
- **Tailwind CSS**: Estilos

## 🔗 Redes Soportadas

- **Avalanche Fuji Testnet** (Chain ID: 43113)
- RPC configurado por defecto

## 🎯 Funcionalidades del Contrato

El proyecto incluye un contrato de ejemplo con las siguientes funciones:

- `sayName()`: Función de lectura que retorna un string
- `updateName(string)`: Función de escritura que actualiza el nombre

## 🛠️ Personalización

### Cambiar de Contrato
Para usar tu propio contrato, modifica el archivo `constants/index.ts`:

```typescript
export const CONTRACT_ADDRESS = "0x..."; // Tu dirección de contrato
export const CONTRACT_ABI = [...]; // Tu ABI
```

### Agregar Nuevas Redes
```typescript
// En WagmiProvider.tsx
import { avalancheFuji, mainnet } from 'wagmi/chains';

const config = createConfig({
  chains: [avalancheFuji, mainnet],
  // ...
});
```

## 📖 Recursos Adicionales

- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Documentation](https://docs.privy.io/)
- [Wagmi Documentation](https://wagmi.sh/)
- [Avalanche Documentation](https://build.avax.network/docs/)

## 🤝 Contribuir

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request
