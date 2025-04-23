import Fastify from "fastify"
import fastifyCors from "@fastify/cors"
import fastifyStatic from "@fastify/static"
import { fileURLToPath } from "url"
import path, { dirname } from "path"
import fs from "fs"
import dotenv from "dotenv"

// Import route handlers
import enhanceRoute from "./gemini/enhance.js"
import paymentRoute from "./payment.js"
import webhookRoute from "./webhook.js"

// Configure dotenv
dotenv.config()

// ESM __dirname workaround
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Initialize Fastify app
const fastify = Fastify({ logger: true })

// Register CORS (allowing your Vercel frontend)
await fastify.register(fastifyCors, {
  origin: ["https://spotix-orcin.vercel.app", /^https?:\/\/localhost(:\d+)?$/],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
})

// Test route
fastify.get("/api/test", async () => {
  return { message: "Server is working!" }
})

// Register your routes
fastify.register(enhanceRoute, { prefix: "/gemini" })
fastify.register(paymentRoute, { prefix: "/" })
fastify.register(webhookRoute, { prefix: "/payment" })

// Serve static frontend if dist exists
const distPath = path.join(__dirname, "dist")
if (fs.existsSync(distPath)) {
  await fastify.register(fastifyStatic, {
    root: distPath,
    prefix: "/",
    decorateReply: false,
  })

  // Fallback to index.html for frontend routing
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api/") || request.url.startsWith("/gemini") || request.url.startsWith("/payment")) {
      return reply.code(404).send({ error: "API route not found" })
    }
    return reply.sendFile("index.html")
  })
}

// Start server
const start = async () => {
  try {
    const PORT = process.env.PORT || 5000
    await fastify.listen({ port: PORT, host: "0.0.0.0" })
    console.log(`🚀 Server running on http://localhost:${PORT}`)
  } catch (err) {
    fastify.log.error(err)
    process.exit(1)
  }
}

start()
