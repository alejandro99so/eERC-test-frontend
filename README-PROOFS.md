# Sistema de Generación de Proofs para EERC

Este documento explica cómo funciona el sistema de generación de proofs para el registro de usuarios en el contrato EERC.

## Arquitectura Actual

El sistema actual está configurado para generar proofs usando las mismas librerías que el código de referencia que proporcionaste:

### Librerías Utilizadas

- `@zk-kit/baby-jubjub`: Para operaciones criptográficas con curvas elípticas
- `maci-crypto`: Para generación de claves privadas
- `poseidon-lite`: Para hashing con función Poseidon
- `snarkjs`: Para generación de proofs ZK (cuando los archivos estén disponibles)

### Flujo de Generación de Proofs

1. **Generación de Claves**: Se genera una clave privada usando `maci-crypto`
2. **Formateo de Clave**: La clave se formatea para BabyJubJub
3. **Generación de Clave Pública**: Se calcula la clave pública usando BabyJubJub
4. **Cálculo de Hash de Registro**: Se usa Poseidon3 para generar el hash de registro
5. **Generación de Proof**: Se genera la proof usando snarkjs (actualmente mock)

## Estado Actual

### ✅ Implementado

- Generación de claves criptográficas
- Cálculo de hash de registro
- Estructura de datos para proofs
- Integración con el contrato
- Manejo de errores y estados de carga

### ⚠️ Pendiente

- Archivos de snarkjs para generación de proofs reales
- Archivos WASM del circuito
- Archivos ZKey para Groth16

## Archivos Requeridos para snarkjs

Para que el sistema funcione completamente con snarkjs, necesitas los siguientes archivos:

```
zk/
└── artifacts/
    └── circom/
        └── registration.circom/
            ├── RegistrationCircuit_js/
            │   └── RegistrationCircuit.wasm
            └── RegistrationCircuit.groth16.zkey
```

## Configuración del Circuito

El circuito debe tener los siguientes inputs públicos:
- `SenderPublicKey[0]`: Coordenada X de la clave pública
- `SenderPublicKey[1]`: Coordenada Y de la clave pública  
- `SenderAddress`: Dirección del usuario
- `ChainID`: ID de la cadena
- `RegistrationHash`: Hash de registro calculado

Y el siguiente input privado:
- `SenderPrivateKey`: Clave privada formateada

## Cómo Actualizar a snarkjs Real

Cuando tengas los archivos de snarkjs, simplemente reemplaza la función `generateSnarkjsProof` en `utils/zkProof.ts` con la implementación real:

```typescript
async function generateSnarkjsProof(snarkjsInputs: any): Promise<any> {
  console.log("🔐 Generating proof using snarkjs...");
  
  try {
    // Create temporary directory for files
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write snarkjs inputs to file
    const snarkjsInputsPath = path.join(tempDir, "snarkjs-inputs.json");
    fs.writeFileSync(snarkjsInputsPath, JSON.stringify(snarkjsInputs, null, 2));
    
    // Paths for snarkjs files
    const wasmPath = path.join(process.cwd(), "zk/artifacts/circom/registration.circom/RegistrationCircuit_js/RegistrationCircuit.wasm");
    const witnessPath = path.join(tempDir, "snarkjs-witness.wtns");
    const zkeyPath = path.join(process.cwd(), "zk/artifacts/circom/registration.circom/RegistrationCircuit.groth16.zkey");
    const proofPath = path.join(tempDir, "register-proof.json");
    const publicPath = path.join(tempDir, "register-public.json");
    
    // Execute snarkjs wtns calculate
    console.log("📊 Calculating witness...");
    execSync(`npx snarkjs wtns calculate "${wasmPath}" "${snarkjsInputsPath}" "${witnessPath}"`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Execute snarkjs groth16 prove
    console.log("🔐 Generating proof...");
    execSync(`npx snarkjs groth16 prove "${zkeyPath}" "${witnessPath}" "${proofPath}" "${publicPath}"`, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    // Read proof and public signals
    const proofData = JSON.parse(fs.readFileSync(proofPath, "utf8"));
    
    // Clean up temporary files
    try {
      fs.unlinkSync(snarkjsInputsPath);
      fs.unlinkSync(witnessPath);
      fs.unlinkSync(proofPath);
      fs.unlinkSync(publicPath);
    } catch (cleanupError) {
      console.warn("⚠️ Warning: Could not clean up temporary files:", cleanupError);
    }
    
    console.log("✅ Snarkjs proof generated successfully");
    return proofData;
    
  } catch (error) {
    console.error("❌ Error generating snarkjs proof:", error);
    throw new Error(`Failed to generate snarkjs proof: ${error}`);
  }
}
```

## Uso en el Frontend

El sistema ya está integrado en la página EERC (`app/eerc/page.tsx`). Cuando un usuario hace clic en "Register":

1. Se valida que esté conectado
2. Se genera la proof usando `generateRegistrationProof`
3. Se llama al contrato con la proof generada
4. Se maneja el estado de carga y errores

## Testing

Para probar el sistema actual:

1. Conecta tu wallet usando Privy
2. Ve a la página EERC
3. Haz clic en "Register"
4. Verifica que se genere la proof (actualmente mock)
5. Verifica que se llame al contrato

## Notas Importantes

- El sistema actual usa proofs mock para testing
- Las claves se generan correctamente usando las mismas librerías que el código de referencia
- El hash de registro se calcula usando la misma fórmula
- La estructura de la proof coincide con lo esperado por el contrato
- Solo falta reemplazar la generación mock con snarkjs real 