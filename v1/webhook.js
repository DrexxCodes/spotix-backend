import crypto from "crypto";
import { adminDb } from "./firebase-admin.js";

/**
 * Paystack Webhook Handler
 * Verifies Paystack signature and updates payment status in Firestore
 */
export default async function webhookRoute(fastify, options) {

  fastify.post("/webhook", async (request, reply) => {
    try {
      // Get Paystack secret key from environment
      const paystackSecret = process.env.PAYSTACK_SECRET_KEY;

      if (!paystackSecret) {
        fastify.log.error("PAYSTACK_SECRET_KEY not configured");
        return reply.code(500).send({ error: "Server configuration error" });
      }

      // Verify Paystack signature
      const hash = crypto
        .createHmac("sha512", paystackSecret)
        .update(JSON.stringify(request.body))
        .digest("hex");

      const paystackSignature = request.headers["x-paystack-signature"];

      if (hash !== paystackSignature) {
        fastify.log.warn("Invalid Paystack signature");
        return reply.code(401).send({ error: "Invalid signature" });
      }

      // Extract event data
      const { event, data } = request.body;

      fastify.log.info(`Received Paystack event: ${event}`);

      // Handle charge events (payment success or failure)
      if (event === "charge.success" || event === "charge.failed") {
        const reference = data?.reference;

        if (!reference) {
          fastify.log.error("No reference found in webhook data");
          return reply.code(400).send({ error: "Missing reference" });
        }

        // Check transaction type from metadata
        const transactionType = data?.metadata?.custom_fields?.find(
          field => field.variable_name === "type"
        )?.value;

        fastify.log.info(`Transaction type: ${transactionType || "not specified"}`);

        // Only process if transaction type is ticket_purchase
        if (transactionType !== "ticket_purchase") {
          fastify.log.info(`Skipping non-ticket transaction: ${transactionType}`);
          return reply.code(200).send({
            success: true,
            message: "Transaction received but not a ticket purchase",
            transactionType,
            reference,
          });
        }

        // Determine payment status
        const paymentStatus = event === "charge.success" ? "successful" : "failed";

        fastify.log.info(`Processing ticket purchase ${reference} with status: ${paymentStatus}`);

        try {
          // Access Firestore Reference collection
          const referenceRef = adminDb.collection("Reference").doc(reference);
          const referenceDoc = await referenceRef.get();

          if (!referenceDoc.exists) {
            fastify.log.warn(`Reference ${reference} not found in Firestore`);
            return reply.code(404).send({ 
              error: "Reference not found",
              reference 
            });
          }

          // Update the status field
          await referenceRef.update({
            status: paymentStatus,
            updatedAt: new Date().toISOString(),
            paystackEvent: event,
            transactionType: "ticket_purchase",
            amount: data?.amount || null,
            currency: data?.currency || null,
            customer: {
              email: data?.customer?.email || null,
              customerCode: data?.customer?.customer_code || null,
            },
          });

          fastify.log.info(`Successfully updated ticket purchase reference ${reference} to ${paymentStatus}`);

          return reply.code(200).send({
            success: true,
            message: "Ticket purchase payment status updated",
            reference,
            status: paymentStatus,
            transactionType: "ticket_purchase",
          });
        } catch (firestoreError) {
          fastify.log.error("Firestore error:", firestoreError);
          return reply.code(500).send({ 
            error: "Database update failed",
            details: firestoreError.message 
          });
        }
      } else {
        // Handle other Paystack events (optional)
        fastify.log.info(`Unhandled event type: ${event}`);
        return reply.code(200).send({ 
          success: true, 
          message: "Event received but not processed",
          event 
        });
      }
    } catch (error) {
      fastify.log.error("Webhook processing error:", error);
      return reply.code(500).send({ 
        error: "Internal server error",
        details: error.message 
      });
    }
  });


  /**
   * GET /webhook/health
   * Health check endpoint for the webhook
   */
  fastify.get("/webhook/health", async (request, reply) => {
    return reply.code(200).send({ 
      status: "active",
      service: "Paystack Webhook Handler",
      developer: "Developed by Spotix Technologies",
      timestamp: new Date().toISOString()
    });
  });
}