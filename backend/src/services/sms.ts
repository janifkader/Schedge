import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioNumber = process.env.TWILIO_PHONE_NUMBER;

const client = twilio(accountSid, authToken);

/**
 * Sends a plain-text SMS message to a specified mobile number.
 * @param toPhoneNumber The recipient's number in E.164 format (e.g., '+14035550123')
 * @param messageBody The text content of the SMS (max 160 characters per standard SMS charge)
 */
export async function sendSMS(toPhoneNumber: string, messageBody: string): Promise<void> {
  try {
    if (!twilioNumber) {
      throw new Error("Missing TWILIO_PHONE_NUMBER environment configuration.");
    }

    const response = await client.messages.create({
      body: messageBody,
      from: twilioNumber,
      to: toPhoneNumber,
    });

    console.log(`SMS Sent Successfully! Message SID: ${response.sid}`);
  } catch (error) {
    console.error("Failed to dispatch Twilio SMS text:", error);
    throw error;
  }
}