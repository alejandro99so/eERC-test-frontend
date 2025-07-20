import type { SnarkjsInputs, SnarkjsProof, ContractProof, WorkerMessage, WorkerResponse } from './zkProof';
//import { Worker } from "../public/zkeERC/worker.js"

export const generateProofRegistrationWithWorker = (inputs: SnarkjsInputs): Promise<ContractProof> => {
  return new Promise((resolve, reject) => {
    console.log("Justo antes de cargar el worker")
    const worker = new Worker('/zkeERC/registrationWorker.js');
    console.log({worker})
    // Timeout de 30 segundos
    const timeout = setTimeout(() => {
      worker.terminate();
      reject(new Error('Timeout: La generación de proof tomó más de 30 segundos'));
    }, 30000);
    
    worker.onmessage = function(e: MessageEvent<WorkerResponse>) {
      clearTimeout(timeout);
      worker.terminate();
      
      if (e.data.success && e.data.proof && e.data.publicSignals) {
        // Convertir formato de snarkjs al formato del contrato
        const contractProof: ContractProof = {
          proofPoints: {
            a: [e.data.proof.pi_a[0], e.data.proof.pi_a[1]],
            b: [
              [e.data.proof.pi_b[0][1], e.data.proof.pi_b[0][0]],
              [e.data.proof.pi_b[1][1], e.data.proof.pi_b[1][0]]
            ],
            c: [e.data.proof.pi_c[0], e.data.proof.pi_c[1]]
          },
          publicSignals: e.data.publicSignals as [string, string, string, string, string]
        };
        
        resolve(contractProof);
      } else {
        reject(new Error(e.data.error || 'Error desconocido en el worker'));
      }
    };
    
    worker.onerror = function(error: ErrorEvent) {
      clearTimeout(timeout);
      worker.terminate();
      reject(new Error(`Error del worker: ${error.message}`));
    };
    
    // Enviar datos al worker
    const message: WorkerMessage = { inputs };
    worker.postMessage(message);
  });
};