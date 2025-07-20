/* worker.js */
importScripts(
  "https://cdn.jsdelivr.net/npm/snarkjs@0.7.3/build/snarkjs.min.js"
);

self.onmessage = async ({ data }) => {
  const { inputs } = data;              // ① inputs = objeto { signal: valor }

  try {
    // ② fullProve hace: fetch WASM, fetch ZKey, witness + proof
    const { proof, publicSignals } = await snarkjs.groth16.fullProve(
      inputs,
      "/zkeERC/circuits/RegistrationCircuit.wasm",
      "/zkeERC/circuits/RegistrationCircuit.groth16.zkey"
    );

    self.postMessage({ success: true, proof, publicSignals });
  } catch (err) {
    self.postMessage({ success: false, error: err.message ?? String(err) });
  }
};
