import axios from "axios";

class SMSService {
  private apiToken: string;
  private senderId: string;

  constructor() {
    this.apiToken = process.env.GIANT_SMS_API_KEY || "";
    this.senderId = process.env.GIANT_SMS_SENDER_ID || "";
  }

  async sendSMS(phoneNumber: string, message: string) {
    try {
      const response = await axios.post(
        "https://api.giantsms.com/api/v1/send",
        {
          to: phoneNumber,
          from: this.senderId,
          msg: message,
        },
        {
          headers: {
            Authorization: `Basic ${this.apiToken}`,
            "Content-Type": "application/json",
          },
        },
      );
      return response.data;
    } catch (error: any) {
      console.error("SMS Error:", error.response?.data || error.message);
      throw error;
    }
  }
}

export default new SMSService();
