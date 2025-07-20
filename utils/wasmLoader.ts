// WASM Loader for zkProof generation
// This file handles loading and caching of the Go WASM module

interface WasmModule {
  generateRegistrationProof: (inputJSON: string) => any;
}

class WasmLoader {
  private static instance: WasmLoader;
  private wasmModule: WasmModule | null = null;
  private isLoading = false;
  private loadPromise: Promise<WasmModule> | null = null;

  private constructor() {}

  static getInstance(): WasmLoader {
    if (!WasmLoader.instance) {
      WasmLoader.instance = new WasmLoader();
    }
    return WasmLoader.instance;
  }

  async loadWasm(): Promise<WasmModule> {
    // Return cached module if already loaded
    if (this.wasmModule) {
      console.log("✅ WASM module already loaded, using cached version");
      return this.wasmModule;
    }

    // Return existing promise if loading
    if (this.loadPromise) {
      console.log("⏳ WASM module is loading, waiting for existing promise");
      return this.loadPromise;
    }

    // Start loading
    this.isLoading = true;
    console.log("🚀 Starting WASM module load...");

    this.loadPromise = this.loadWasmModule();
    
    try {
      this.wasmModule = await this.loadPromise;
      console.log("✅ WASM module loaded successfully");
      return this.wasmModule;
    } catch (error) {
      console.error("❌ Failed to load WASM module:", error);
      this.loadPromise = null;
      this.isLoading = false;
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  private async loadWasmModule(): Promise<WasmModule> {
    try {
      // Check if we're in a browser environment
      if (typeof window === 'undefined') {
        throw new Error("WASM can only be loaded in browser environment");
      }

      // Check if Go runtime is available
      if (!(window as any).Go) {
        console.log("📥 Loading Go WASM runtime...");
        await this.loadGoRuntime();
      }

      // Load the WASM file
      console.log("📥 Loading WASM file...");
      const wasmResponse = await fetch('/zkproof.wasm');
      
      if (!wasmResponse.ok) {
        throw new Error(`Failed to load WASM file: ${wasmResponse.status} ${wasmResponse.statusText}`);
      }

      const wasmBuffer = await wasmResponse.arrayBuffer();
      console.log("✅ WASM file downloaded, size:", wasmBuffer.byteLength, "bytes");

      // Initialize Go runtime
      const go = new (window as any).Go();
      
      // Instantiate WASM module
      console.log("🔧 Instantiating WASM module...");
      const result = await WebAssembly.instantiate(wasmBuffer, go.importObject);
      
      // Run the Go program
      console.log("▶️ Running Go WASM program...");
      go.run(result.instance);

      // Check if the function is available
      if (!(window as any).generateRegistrationProof) {
        throw new Error("generateRegistrationProof function not found in WASM module");
      }

      console.log("✅ WASM module initialized successfully");
      
      return {
        generateRegistrationProof: (window as any).generateRegistrationProof
      };

    } catch (error) {
      console.error("❌ Error loading WASM module:", error);
      throw new Error(`WASM loading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async loadGoRuntime(): Promise<void> {
    try {
      const runtimeResponse = await fetch('/wasm_exec.js');
      
      if (!runtimeResponse.ok) {
        throw new Error(`Failed to load Go runtime: ${runtimeResponse.status} ${runtimeResponse.statusText}`);
      }

      const runtimeScript = await runtimeResponse.text();
      
      // Create and execute script
      const script = document.createElement('script');
      script.textContent = runtimeScript;
      document.head.appendChild(script);
      
      console.log("✅ Go WASM runtime loaded");
    } catch (error) {
      console.error("❌ Error loading Go runtime:", error);
      throw new Error(`Go runtime loading failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Method to check if WASM is available
  isWasmAvailable(): boolean {
    return this.wasmModule !== null;
  }

  // Method to get loading status
  getLoadingStatus(): { isLoading: boolean; isLoaded: boolean } {
    return {
      isLoading: this.isLoading,
      isLoaded: this.wasmModule !== null
    };
  }

  // Method to reset (for testing)
  reset(): void {
    this.wasmModule = null;
    this.isLoading = false;
    this.loadPromise = null;
  }
}

// Export singleton instance
export const wasmLoader = WasmLoader.getInstance();

// Export types
export type { WasmModule }; 