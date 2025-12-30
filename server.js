/* 
This server isn't deployed from this frontend. The backend is developed and maintained by Drexx Codes and the Spotix Team 
2025 - till date
*/
import Fastify from "fastify";
import fastifyCors from "@fastify/cors";
import fastifyStatic from "@fastify/static";
import { fileURLToPath } from "url";
import path, { dirname } from "path";
import fs from "fs";
import dotenv from "dotenv";
// Import route handlers
import enhanceRoute from "./api/gemini/enhance.js";
import paymentRoute from "./api/payment.js";
import verifyRoute from "./api/verify.js";
import sendMailRoutes from "./api/mail.js";
import notifyRoutes from "./api/notify.js";
import webhookRoute from "./api/webhook.js";
import verifyPaymentRoute from "./api/verify-payment.js";
import ticketRoute from "./api/ticket.js";

// Configure dotenv
dotenv.config()
// Debug: Check if env vars are loaded
console.log("🔍 Environment Variables Check:")
console.log("FIREBASE_PROJECT_ID:", process.env.FIREBASE_PROJECT_ID ? "✅ Set" : "❌ Missing")
console.log("FIREBASE_CLIENT_EMAIL:", process.env.FIREBASE_CLIENT_EMAIL ? "✅ Set" : "❌ Missing")
console.log("FIREBASE_PRIVATE_KEY:", process.env.FIREBASE_PRIVATE_KEY ? "✅ Set" : "❌ Missing")
// __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// Initialize Fastify
const fastify = Fastify({ logger: true });
// Register CORS
await fastify.register(fastifyCors, {
  origin: (origin, cb) => {
    if (!origin || /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error("Not allowed"), false);
    }
  },
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  credentials: true,
});

// Handle favicon requests (prevents 404 errors)
fastify.get("/favicon.ico", (request, reply) => {
  reply.code(204).send(); // 204 = No Content
});

// Test route
fastify.get("/api/test", async (request, reply) => {
  return { message: "Server is working!" };
});
// Register API routes
fastify.register(enhanceRoute, { prefix: "/api/gemini" });
fastify.register(paymentRoute, { prefix: "/api" });
fastify.register(verifyRoute, { prefix: "/api" });
fastify.register(sendMailRoutes, { prefix: "/api/mail" });
fastify.register(notifyRoutes, { prefix: "/api/notify" });
fastify.register(webhookRoute, { prefix: "/api" });
fastify.register(ticketRoute, { prefix: "/api" });
fastify.register(verifyPaymentRoute, { prefix: "/api" });
// Serve frontend (if dist exists)
const distPath = path.join(__dirname, "dist");
if (fs.existsSync(distPath)) {
  await fastify.register(fastifyStatic, {
    root: distPath,
    prefix: "/",
    decorateReply: false,
  });
  fastify.setNotFoundHandler((request, reply) => {
    if (request.url.startsWith("/api/")) {
      return reply.code(404).send({ error: "API route not found" });
    }
    return reply.sendFile("index.html");
  });
}
// Start the server
const start = async () => {
  try {
    const PORT = process.env.PORT || 5000;
    await fastify.listen({ port: PORT, host: "0.0.0.0" });
    console.log(`🚀 Server running on port ${PORT}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();