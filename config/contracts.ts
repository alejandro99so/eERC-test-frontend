// Contract addresses
export const CONTRACTS = {
	EERC_STANDALONE: "0x5E9c6F952fB9615583182e70eDDC4e6E4E0aC0e0",
	EERC_CONVERTER: "0x6769d6e7DC84aA9bCba1FD88449e5f23Ef3557c6",
	ERC20: "0xC6337Da27B4Fc2b62B17214b5fAEa7fad1f37598",
} as const;

// Circuit configuration
export const CIRCUIT_CONFIG = {
	register: {
		wasm: "/circuit/RegistrationCircuit.wasm",
		zkey: "/circuit/RegistrationCircuit.groth16.zkey",
	},
	mint: {
		wasm: "/circuit/MintCircuit.wasm",
		zkey: "/circuit/MintCircuit.groth16.zkey",
	},
	transfer: {
		wasm: "/circuit/TransferCircuit.wasm",
		zkey: "/circuit/TransferCircuit.groth16.zkey",
	},
	withdraw: {
		wasm: "/circuit/WithdrawCircuit.wasm",
		zkey: "/circuit/WithdrawCircuit.groth16.zkey",
	},
} as const;

// Explorer URL
export const EXPLORER_BASE_URL = "https://testnet.snowtrace.io/address/";
export const EXPLORER_BASE_URL_TX = "https://testnet.snowtrace.io/tx/";

// Mode types
export type EERCMode = "standalone" | "converter";
