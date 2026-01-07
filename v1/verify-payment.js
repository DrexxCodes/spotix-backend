import { adminDb } from "./firebase-admin.js";

/**
 * Verify Payment Route
 * Checks payment status from Firestore Reference collection
 */
export default async function verifyPaymentRoute(fastify, options) {
  /**
   * GET /verify-payment
   * Query parameter: ref (payment reference)
   * Returns payment status and details
   */
  fastify.get("/verify-payment", async (request, reply) => {
    try {
      // Get query parameters
      const { ref } = request.query;

      // Check for foreign/extra parameters
      const allowedParams = ["ref"];
      const queryKeys = Object.keys(request.query);
      const foreignParams = queryKeys.filter((key) => !allowedParams.includes(key));

      if (foreignParams.length > 0) {
        return reply.code(400).send({
          error: "Bad Request",
          message: `Invalid parameter(s): ${foreignParams.join(", ")}`,
          allowedParameters: allowedParams,
          developer: "API developed and maintained by Spotix Technologies",
        });
      }

      // Validate ref parameter
      if (!ref) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Missing required parameter: ref",
          developer: "API developed and maintained by Spotix Technologies",
        });
      }

      // Validate ref format (should start with SPTX-REF-)
      if (!ref.startsWith("SPTX-REF-")) {
        return reply.code(400).send({
          error: "Bad Request",
          message: "Invalid reference format. Expected format: SPTX-REF-{timestamp}",
          developer: "API developed and maintained by Spotix Technologies",
        });
      }

      // Query Firestore for the reference
      const referenceDocRef = adminDb.collection("Reference").doc(ref);
      const referenceDoc = await referenceDocRef.get();

      // Check if reference exists
      if (!referenceDoc.exists) {
        return reply.code(404).send({
          error: "Not Found",
          message: "Payment reference not found",
          reference: ref,
          developer: "API developed and maintained by Spotix Technologies",
        });
      }

      // Get payment data
      const paymentData = referenceDoc.data();

      // Prepare response with additional fields
      const response = {
        success: true,
        reference: ref,
        eventId: paymentData.eventId || null,
        eventCreatorId: paymentData.eventCreatorId || null,
        eventName: paymentData.eventName || null,
        ticketPrice: paymentData.ticketPrice || 0,
        ticketType: paymentData.ticketType || null,
        totalAmount: paymentData.totalAmount || 0,
        transactionFee: paymentData.transactionFee || 0,
        status: paymentData.status || "pending",
        userId: paymentData.userId || null,
        
        // Discount information (if applicable)
        discountCode: paymentData.discountCode || null,
        discountData: paymentData.discountData || null,
        
        // Referral information (if applicable)
        referralCode: paymentData.referralCode || null,
        referralName: paymentData.referralName || null,
        
        // Event details
        eventVenue: paymentData.eventVenue || null,
        eventType: paymentData.eventType || null,
        eventDate: paymentData.eventDate || null,
        eventEndDate: paymentData.eventEndDate || null,
        eventStart: paymentData.eventStart || null,
        eventEnd: paymentData.eventEnd || null,
        bookerName: paymentData.bookerName || null,
        bookerEmail: paymentData.bookerEmail || null,
        
        // Ticket ID (if already generated)
        ticketId: paymentData.ticketId || null,
        
        developer: "API developed and maintained by Spotix Technologies",
      };

      // Return successful response
      return reply.code(200).send(response);
    } catch (error) {
      fastify.log.error("Error verifying payment:", error);
      return reply.code(500).send({
        error: "Internal Server Error",
        message: "Failed to verify payment",
        details: error.message,
        developer: "API developed and maintained by Spotix Technologies",
      });
    }
  });

  /**
   * Health check for verify-payment endpoint
   */
  fastify.get("/verify-payment/health", async (request, reply) => {
    return reply.code(200).send({
      status: "healthy",
      service: "Payment Verification API",
      timestamp: new Date().toISOString(),
      developer: "API developed and maintained by Spotix Technologies",
    });
  });
}