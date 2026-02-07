// api/verify.js
import fetch from "node-fetch"

export default async function verifyRoute(fastify, options) {
  fastify.get("/verify", async (request, reply) => {
    const { accountNumber, bankName } = request.query || {}

    if (!accountNumber || !bankName) {
      return reply.code(400).send({ 
        status: false, 
        message: "Account number and bank name are required" 
      })
    }

    // Comprehensive bank codes from Paystack
    const bankCodes = {
      // Traditional Banks
      "Access Bank": "044",
      "Citibank": "023",
      "Ecobank Nigeria": "050",
      "Fidelity Bank": "070",
      "First Bank of Nigeria": "011",
      "First City Monument Bank": "214",
      "FCMB": "214",
      "Globus Bank": "00103",
      "Guaranty Trust Bank": "058",
      "GTBank": "058",
      "GT Bank": "058",
      "Heritage Bank": "030",
      "Jaiz Bank": "301",
      "Keystone Bank": "082",
      "Lotus Bank": "303",
      "Parallex Bank": "526",
      "Polaris Bank": "076",
      "Providus Bank": "101",
      "Stanbic IBTC Bank": "221",
      "Stanbic IBTC": "221",
      "Standard Chartered Bank": "068",
      "Sterling Bank": "232",
      "SunTrust Bank": "100",
      "Taj Bank": "302",
      "Titan Trust Bank": "102",
      "Union Bank of Nigeria": "032",
      "Union Bank": "032",
      "United Bank For Africa": "033",
      "UBA": "033",
      "Unity Bank": "215",
      "Wema Bank": "035",
      "Zenith Bank": "057",

      // Digital Banks & Fintech
      "Opay": "999992",
      "OPay": "999992",
      "Palmpay": "999991",
      "PalmPay": "999991",
      "Moniepoint MFB": "50515",
      "Moniepoint": "50515",
      "Kuda Bank": "50211",
      "Kuda": "50211",
      "VFD Microfinance Bank": "566",
      "VFD MFB": "566",
      
      // Additional Microfinance Banks
      "Rubies MFB": "125",
      "Sparkle Microfinance Bank": "51310",
      "Infinity MFB": "50457",
      "Aso Savings and Loans": "401",
      "Covenant MFB": "551",
      "Ekondo Microfinance Bank": "562",
      "Eyowo": "50126",
      "Hasal Microfinance Bank": "50383",
      "NPF MicroFinance Bank": "552",
      "Paga": "100002",
      "FSDH Merchant Bank Limited": "501",
      "Rand Merchant Bank": "502",
      "Nova Merchant Bank": "060",
      "9mobile 9Payment Service Bank": "120001",
      "Abbey Mortgage Bank": "404",
      "Lagos Building Investment Company Plc.": "90052",
      "Mutual Trust Microfinance Bank": "090129",
      "Petra Mircofinance Bank Plc": "50746",
      "Signature Bank Ltd": "50453",
      "TCF MFB": "51211",
    }

    const bankCode = bankCodes[bankName]
    
    if (!bankCode) {
      return reply.code(400).send({ 
        status: false, 
        message: `Bank "${bankName}" is not supported. Please select a valid bank from the list.` 
      })
    }

    const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY
    if (!paystackSecretKey) {
      console.error("Paystack secret key is missing")
      return reply.code(500).send({ 
        status: false, 
        message: "Internal server error. Please contact support." 
      })
    }

    try {
      const url = `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (data.status === true && data.data && data.data.account_name) {
        return reply.send({ 
          status: true, 
          account_name: data.data.account_name,
          account_number: data.data.account_number,
          bank_code: bankCode
        })
      } else {
        return reply.code(400).send({ 
          status: false, 
          message: data.message || "Unable to verify account. Please check the account number and try again." 
        })
      }
    } catch (error) {
      console.error("Error from Paystack API:", error)
      return reply.code(500).send({ 
        status: false, 
        message: "Failed to verify account. Please try again later." 
      })
    }
  })
}