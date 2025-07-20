/**
 * ZK Files Configuration
 *
 * Central configuration for all ZK circuit files used in the application.
 * Defines the base CDN URL and generates all circuit URLs from it.
 */

// CDN Base URL for all circuit files
const CDN_BASE_URL = "https://d30f1urb9i1c13.cloudfront.net/zk_files";

// Circuit URLs for EERC operations
export const circuitURLs = {
    register: {
        wasm: `${CDN_BASE_URL}/registration/registration.wasm`,
        zkey: `${CDN_BASE_URL}/registration/circuit_final.zkey`
    },
    transfer: {
        wasm: `${CDN_BASE_URL}/transfer/transfer.wasm`,
        zkey: `${CDN_BASE_URL}/transfer/transfer.zkey`
    },
    mint: {
        wasm: `${CDN_BASE_URL}/mint/mint.wasm`,
        zkey: `${CDN_BASE_URL}/mint/mint.zkey`
    },
    withdraw: {
        wasm: `${CDN_BASE_URL}/withdraw/withdraw.wasm`,
        zkey: `${CDN_BASE_URL}/withdraw/circuit_final.zkey`
    },
    burn: {
        wasm: `${CDN_BASE_URL}/burn/burn.wasm`,
        zkey: `${CDN_BASE_URL}/burn/burn.zkey`
    },
};

// Wasm URLs for hook initialization
export const wasmURLs = {
    transferURL: `${CDN_BASE_URL}/transfer/transfer.wasm`,
    multiWasmURL: `${CDN_BASE_URL}/registration/registration.wasm`,
};