const { connectMySQL } = require('../db');

async function main() {
  try {
    const connection = await connectMySQL();
    const [rows] = await connection.execute('SELECT 1 + 1 AS resultado');
    console.log('✅ Conexión a MySQL exitosa:', rows[0].resultado); // Debería imprimir 2
    await connection.end();
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error);
  }
}

main();
// Este script se utiliza para probar la conexión a MySQL y verificar que la configuración es correcta.