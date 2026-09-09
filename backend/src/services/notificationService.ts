/**
 * Notification Service Abstraction
 * Currently stubs SMS for hackathon demo.
 * Replace sendSMS implementation with a real provider (Twilio, etc.) later.
 */

export interface ISMSAlert {
    phoneNumber: string;
    message: string;
}

// In-memory store to simulate "delivered" SMS for the frontend to poll during demo
const mockSMSInbox: ISMSAlert[] = [];

export const sendSMS = async (phoneNumber: string, message: string) => {
    console.log(`[SMS BRIDGE] Sending to ${phoneNumber}: ${message}`);
    
    mockSMSInbox.push({ phoneNumber, message });
    
    // Stub success
    return { success: true, messageId: 'mock_' + Date.now() };
};

// Expose mock for frontend demo/dashboard check
export const getMockSMSInbox = () => mockSMSInbox;
