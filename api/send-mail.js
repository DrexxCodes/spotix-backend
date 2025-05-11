import { MailerSend } from "mailersend"
import dotenv from "dotenv"

// Load environment variables
dotenv.config()

// Initialize MailerSend with API key
const mailersend = new MailerSend({
  apiKey: process.env.MAILERSEND_API_KEY ,
})

/**
 * Send email route handler for Fastify
 * @param {FastifyInstance} fastify - Fastify instance
 * @param {Object} options - Route options
 */
export default async function sendMailRoutes(fastify, options) {
  // Route for password reset emails
  fastify.post("/password-reset", async (request, reply) => {
    try {
      const { email, name, resetUrl } = request.body

      if (!email || !name || !resetUrl) {
        return reply.code(400).send({
          success: false,
          message: "Missing required fields: email, name, or resetUrl",
        })
      }

      const emailParams = {
        from: {
          email: "auth@spotix.com.ng",
          name: "Spotix Security",
        },
        to: [
          {
            email: email,
            name: name,
          },
        ],
        subject: "Password Change",
        template_id: "vywj2lpx7ek47oqz",
        personalization: [
          {
            email: email,
            data: {
              name: name,
              action_url: resetUrl,
              support_url: "support@spotix.com.ng",
              account_name: name,
            },
          },
        ],
      }

      const response = await mailersend.email.send(emailParams)

      fastify.log.info("Password reset email sent successfully")
      return reply.code(200).send({
        success: true,
        message: "Password reset email sent successfully",
      })
    } catch (error) {
      fastify.log.error("Error sending password reset email:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to send password reset email",
        error: error.message,
      })
    }
  })

  // Route for booker confirmation emails
  fastify.post("/booker-confirmation", async (request, reply) => {
    try {
      const { email, name } = request.body

      if (!email || !name) {
        return reply.code(400).send({
          success: false,
          message: "Missing required fields: email or name",
        })
      }

      const emailParams = {
        from: {
          email: "auth@spotix.com.ng",
          name: "Spotix Events",
        },
        to: [
          {
            email: email,
            name: name,
          },
        ],
        subject: "Welcome to Spotix Bookers",
        template_id: "zr6ke4n8j3e4on12",
        personalization: [
          {
            email: email,
            data: {
              name: name,
            },
          },
        ],
      }

      const response = await mailersend.email.send(emailParams)

      fastify.log.info("Booker confirmation email sent successfully")
      return reply.code(200).send({
        success: true,
        message: "Booker confirmation email sent successfully",
      })
    } catch (error) {
      fastify.log.error("Error sending booker confirmation email:", error)
      return reply.code(500).send({
        success: false,
        message: "Failed to send booker confirmation email",
        error: error.message,
      })
    }
  })
}
