// Script de prueba para el endpoint de confirmación de Payphone
// Basado en el ejemplo proporcionado por soporte de Payphone

const testPayphoneConfirm = async () => {
  // Datos de prueba basados en el ejemplo exitoso
  const testCases = [
    {
      name: "Ejemplo exitoso de Payphone",
      payload: {
        id: 23178284,
        clientTxId: "BR231121-1142-0215"
      }
    },
    {
      name: "Nuestro formato actual (con timestamp-random)",
      payload: {
        id: 69554590,
        clientTxId: "5daff9f6-2451387723-389rwy"
      }
    },
    {
      name: "Solo orderId original (sin timestamp-random)",
      payload: {
        id: 69554590,
        clientTxId: "5daff9f6-02c2-4588-a64e-72cd1cb57335"
      }
    },
    {
      name: "Formato similar al ejemplo (orderId corto)",
      payload: {
        id: 69554590,
        clientTxId: "5daff9f6"
      }
    }
  ];

  // Token de prueba (reemplazar con el token real)
  const token = "vNrS9x0psd2pnrcW2p3KTtF7w-3-A9qQUbm638jGCIc_MVctDTN9bE_eZ9ky14aQa3z5VAXxUyEVDUWXTicV9W31FiXbibL1Hnx6W0P3tQBasElDhPkD0A8NzDAtQJMcXOuSqZn_hSlRnH2mfVVKvJTT3hE2mBXVwJFMG5GKTz1QnFDNZi5vnJBOZQ5g51glHF9v0I91r2jx8KnfL74piZJnyv7PioC45ND8XFpFoagAr6vYuev3p4SR983YmpGdPn4pC0e03ZZWsLSn6B3c2b1FVwa8zkHpF7B-MAlRUcrJT418Vw7A2WxOjD3ZF2gGUATc9w";
  const url = "https://pay.payphonetodoesposible.com/api/button/V2/Confirm";

  console.log("=".repeat(80));
  console.log("PRUEBA DEL ENDPOINT DE CONFIRMACIÓN DE PAYPHONE");
  console.log("=".repeat(80));
  console.log("");

  for (const testCase of testCases) {
    console.log(`\n📋 Probando: ${testCase.name}`);
    console.log(`   Payload:`, JSON.stringify(testCase.payload, null, 2));

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "Referer": "http://localhost:3000" // Agregar Referer como en el ejemplo
        },
        body: JSON.stringify(testCase.payload)
      });

      console.log(`   Status: ${response.status} ${response.statusText}`);
      console.log(`   Content-Type: ${response.headers.get("content-type")}`);

      const text = await response.text();
      
      // Intentar parsear como JSON
      let data;
      try {
        data = JSON.parse(text);
        console.log(`   ✅ Respuesta JSON válida:`);
        console.log(JSON.stringify(data, null, 2));
        
        if (data.statusCode === 3 || data.transactionStatus === "Approved") {
          console.log(`   ✅✅✅ TRANSACCIÓN APROBADA ✅✅✅`);
        } else {
          console.log(`   ⚠️ Transacción no aprobada:`, {
            statusCode: data.statusCode,
            transactionStatus: data.transactionStatus,
            message: data.message
          });
        }
      } catch (parseError) {
        console.log(`   ❌ Error parseando JSON (respuesta HTML):`);
        console.log(`   Primeros 500 caracteres:`, text.substring(0, 500));
        
        // Buscar información útil en el HTML
        if (text.includes("Runtime Error")) {
          console.log(`   ⚠️ Error de runtime en el servidor de Payphone`);
        }
      }

    } catch (error) {
      console.log(`   ❌ Error de red:`, error.message);
    }

    console.log("-".repeat(80));
    
    // Esperar un poco entre pruebas
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log("\n" + "=".repeat(80));
  console.log("PRUEBA COMPLETADA");
  console.log("=".repeat(80));
};

// Ejecutar si se llama directamente
if (typeof require !== 'undefined' && require.main === module) {
  testPayphoneConfirm().catch(console.error);
}

module.exports = { testPayphoneConfirm };

