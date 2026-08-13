import * as dotenv from 'dotenv';
// Cargar variables de entorno del archivo .env.local o .env antes de cualquier otro import
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

import { runMetaSync } from '../src/lib/sync';

async function main() {
  try {
    const result = await runMetaSync();
    console.log('\n--- Resultado de Sincronización ---');
    console.log(`Estado: ${result.success ? 'ÉXITO' : 'FALLO'}`);
    console.log(`Mensaje: ${result.message}`);
    console.log('Estadísticas:', result.stats);
  } catch (err: unknown) {
    const errorObj = err as Error;
    console.error('Error durante la sincronización de meta:', errorObj.message || errorObj);
    process.exit(1);
  }
}

main();
