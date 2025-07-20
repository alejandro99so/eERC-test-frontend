# WASM-based zkProof Generation / Generación de zkProof con WASM

This project implements zkProof generation directly in the frontend using WebAssembly (WASM).

Este proyecto implementa la generación de zkProofs directamente en el frontend usando WebAssembly (WASM).

## 🏗️ Architecture / Arquitectura

### 1. **WASM Compilation / Compilación WASM**
- **Go → WASM**: Go code is compiled to WebAssembly using `GOOS=js GOARCH=wasm`
- **Binary**: `zk/cmd/wasm.go` → `public/zkproof.wasm`
- **Runtime**: Uses local `wasm_exec.js` to execute WASM in the browser

- **Go → WASM**: El código Go se compila a WebAssembly usando `GOOS=js GOARCH=wasm`
- **Binario**: `zk/cmd/wasm.go` → `public/zkproof.wasm`
- **Runtime**: Usa `wasm_exec.js` local de Go para ejecutar el WASM en el navegador

### 2. **Data Flow / Flujo de Datos**
```
Frontend (TypeScript) → WASM Loader → Go WASM → zkProof → Smart Contract
```

### 3. **Key Files / Archivos Clave**

#### **Go WASM Entry Point / Punto de Entrada WASM de Go**
- `zk/cmd/wasm.go`: WASM entry point that exposes `generateRegistrationProof` to JavaScript
- `zk/cmd/wasm.go`: Punto de entrada WASM que expone `generateRegistrationProof` a JavaScript

#### **TypeScript Wrapper / Wrapper de TypeScript**
- `utils/wasmLoader.ts`: Loads and caches the WASM module
- `utils/zkProof.ts`: Generates inputs and handles communication with WASM
- `utils/wasmLoader.ts`: Carga y cachea el módulo WASM
- `utils/zkProof.ts`: Genera inputs y maneja la comunicación con WASM

#### **Configuration / Configuración**
- `next.config.ts`: Headers to serve WASM files
- `scripts/copy-wasm.js`: Copies compiled WASM to public directory
- `next.config.ts`: Headers para servir archivos WASM
- `scripts/copy-wasm.js`: Copia el WASM compilado al directorio público

## 🚀 Usage / Uso

### **Compilation / Compilación**
```bash
# Compile Go to WASM and copy to public directory
# Compila Go a WASM y copia al directorio público
npm run build:wasm

# Complete build (includes WASM)
# Build completo (incluye WASM)
npm run build
```

### **In the Frontend / En el Frontend**
```typescript
import { generateRegistrationProof } from '../utils/zkProof';

// Automatically generates proof
// Genera proof automáticamente
const { proof, userKeys } = await generateRegistrationProof(
  userAddress,
  chainId
);
```

## 🔧 Features / Características

### **Cache and Lazy Loading / Cache y Lazy Loading**
- ✅ **WASM downloads once** and caches in memory
- ✅ **Lazy loading**: Only loads when needed
- ✅ **Reuse**: Reused between operations
- ✅ **Persistence**: During browser session

- ✅ **WASM se descarga una sola vez** y se cachea en memoria
- ✅ **Lazy loading**: Solo se carga cuando se necesita
- ✅ **Reutilización**: Se reutiliza entre operaciones
- ✅ **Persistencia**: Durante la sesión del navegador

### **Error Handling / Manejo de Errores**
- ✅ **WASM loading errors** handled gracefully
- ✅ **Fallback** if WASM is not available
- ✅ **Detailed logs** for debugging

- ✅ **Errores de carga WASM** manejados graciosamente
- ✅ **Fallback** si WASM no está disponible
- ✅ **Logs detallados** para debugging

### **Performance / Rendimiento**
- ✅ **Native execution** in browser
- ✅ **No network calls** for proof generation
- ✅ **Optimized memory** with singleton pattern

- ✅ **Ejecución nativa** en el navegador
- ✅ **Sin llamadas de red** para proof generation
- ✅ **Memoria optimizada** con singleton pattern

## 📁 Estructura de Archivos

```
front-privy/
├── zk/
│   ├── cmd/
│   │   ├── main.go          # CLI binary
│   │   └── wasm.go          # WASM entry point
│   ├── pkg/
│   │   ├── circuits/        # Circuitos ZK
│   │   ├── utils/           # Utilidades Go
│   │   └── helpers/         # Helpers
│   └── build/
│       └── zkproof.wasm     # WASM compilado
├── public/
│   ├── zkproof.wasm         # WASM served by Next.js
│   └── wasm_exec.js         # Go WASM runtime
│   ├── zkproof.wasm         # WASM servido por Next.js
│   └── wasm_exec.js         # Runtime WASM de Go
├── utils/
│   ├── wasmLoader.ts        # Cargador WASM
│   └── zkProof.ts           # Generador de proofs
└── scripts/
    └── copy-wasm.js         # Script de copia
```

## 🔄 Flujo de Registro

1. **Usuario hace clic en "Register"**
2. **Frontend genera claves criptográficas** (BabyJubJub)
3. **Se calcula registration hash** (Poseidon3)
4. **Se preparan inputs para el circuito**
5. **WASM genera la zkProof** (Groth16)
6. **Se envía proof al contrato**
7. **Se actualiza el estado del usuario**

## 🛠️ Desarrollo

### **Modificar Circuitos**
1. Edita `zk/pkg/circuits/`
2. Recompila: `cd zk && make build-wasm`
3. Copia: `node scripts/copy-wasm.js`

### **Debugging WASM**
```javascript
// En la consola del navegador
window.generateRegistrationProof // Función expuesta por WASM
```

### **Logs**
- **Frontend**: Console logs en `utils/zkProof.ts`
- **WASM**: Logs en `zk/cmd/wasm.go`
- **Go**: Logs en `zk/pkg/` (si hay errores)

## ⚠️ Consideraciones

### **File Sizes / Tamaño de Archivos**
- **WASM**: ~20MB (includes gnark and circuits)
- **wasm_exec.js**: ~16KB (Go runtime)
- **Cache**: Persists during browser session

- **WASM**: ~20MB (incluye gnark y circuitos)
- **wasm_exec.js**: ~16KB (runtime de Go)
- **Cache**: Persiste durante la sesión

### **Compatibilidad**
- ✅ **Chrome/Edge**: Soporte completo
- ✅ **Firefox**: Soporte completo
- ✅ **Safari**: Soporte completo
- ❌ **IE**: No soportado

### **Performance**
- **Primera carga**: ~2-5 segundos (descarga WASM)
- **Subsiguientes**: ~100-500ms (proof generation)
- **Memoria**: ~50-100MB adicional

## 🎯 Advantages vs Alternatives / Ventajas vs Alternativas

### **vs Backend API**
- ✅ **No network latency** for proof generation
- ✅ **No server dependency**
- ✅ **Privacy**: Everything on client
- ❌ **Larger initial size**

- ✅ **Sin latencia de red** para proof generation
- ✅ **Sin dependencia de servidor**
- ✅ **Privacidad**: Todo en el cliente
- ❌ **Tamaño inicial mayor**

### **vs Temporary Files / vs Archivos Temporales**
- ✅ **Everything in memory** (no files)
- ✅ **More secure** (no file I/O)
- ✅ **Better UX** (no write delays)
- ✅ **Works in browser**

- ✅ **Todo en memoria** (sin archivos)
- ✅ **Más seguro** (sin I/O de archivos)
- ✅ **Mejor UX** (sin delays de escritura)
- ✅ **Funciona en navegador**

### **vs CDN**
- ✅ **Total control** of code
- ✅ **No external dependencies**
- ✅ **Local versioning**
- ❌ **Own maintenance**

- ✅ **Control total** del código
- ✅ **Sin dependencias externas**
- ✅ **Versionado local**
- ❌ **Mantenimiento propio**

---

## 📋 Summary / Resumen

### English
This implementation provides a complete WASM-based zkProof generation system that runs entirely in the browser. It offers privacy, performance, and security while maintaining a smooth user experience.

### Español
Esta implementación proporciona un sistema completo de generación de zkProof basado en WASM que se ejecuta completamente en el navegador. Ofrece privacidad, rendimiento y seguridad mientras mantiene una experiencia de usuario fluida. 