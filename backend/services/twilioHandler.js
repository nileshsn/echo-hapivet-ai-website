const twilio = require('twilio');
const speechService = require('./speechService');

class TwilioHandler {
  constructor() {
    this.client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    this.phoneNumber = process.env.TWILIO_PHONE_NUMBER;
  }

  // Handle incoming phone calls
  handleIncomingCall(callData) {
    const twiml = new twilio.twiml.VoiceResponse();
    
    // Greet the caller
    twiml.say({
      voice: 'Polly.Joanna',
      language: 'en-US'
    }, 'Hello! Welcome to HapiVet AI. Please hold while we connect you to our voice assistant.');
    
    // Start media stream for real-time transcription
    const start = twiml.start();
    start.stream({
      url: `wss://${process.env.NGROK_URL || 'localhost:3001'}/webhook/media`,
      track: 'both_tracks'
    });
    
    // Keep the call active
    twiml.pause({ length: 3600 }); // 1 hour max
    
    return twiml.toString();
  }

  // Handle media stream from Twilio
  async handleMediaStream(mediaData, io) {
    try {
      const { event, streamSid, media } = mediaData;
      
      if (event === 'start') {
        console.log(`Media stream started: ${streamSid}`);
        // Initialize speech recognition for this stream
        await speechService.initializeStream(streamSid, io);
      } else if (event === 'media') {
        // Process audio data
        const audioBuffer = Buffer.from(media.payload, 'base64');
        await speechService.processAudioChunk(streamSid, audioBuffer, io);
      } else if (event === 'stop') {
        console.log(`Media stream stopped: ${streamSid}`);
        await speechService.finalizeStream(streamSid, io);
      }
    } catch (error) {
      console.error('Error handling media stream:', error);
    }
  }

  // Make outbound calls (for appointment reminders, etc.)
  async makeOutboundCall(toNumber, message, appointmentData = null) {
    try {
      const twiml = new twilio.twiml.VoiceResponse();
      
      // Greet the caller
      twiml.say({
        voice: 'Polly.Joanna',
        language: 'en-US'
      }, message);
      
      // If appointment data is provided, offer to reschedule
      if (appointmentData) {
        twiml.say('Would you like to reschedule your appointment? Please say yes or no.');
        
        const gather = twiml.gather({
          numDigits: 1,
          action: '/webhook/outbound-response',
          method: 'POST'
        });
        
        // Store appointment data for later processing
        // In a real implementation, you'd store this in a database
      }
      
      const call = await this.client.calls.create({
        twiml: twiml.toString(),
        to: toNumber,
        from: this.phoneNumber
      });
      
      console.log(`Outbound call initiated: ${call.sid}`);
      return call.sid;
    } catch (error) {
      console.error('Error making outbound call:', error);
      throw error;
    }
  }

  // Send SMS notifications
  async sendSMS(toNumber, message) {
    try {
      const messageResponse = await this.client.messages.create({
        body: message,
        from: this.phoneNumber,
        to: toNumber
      });
      
      console.log(`SMS sent: ${messageResponse.sid}`);
      return messageResponse.sid;
    } catch (error) {
      console.error('Error sending SMS:', error);
      throw error;
    }
  }

  // Get call logs
  async getCallLogs(limit = 50) {
    try {
      const calls = await this.client.calls.list({ limit });
      return calls;
    } catch (error) {
      console.error('Error fetching call logs:', error);
      throw error;
    }
  }

  // Get call details
  async getCallDetails(callSid) {
    try {
      const call = await this.client.calls(callSid).fetch();
      return call;
    } catch (error) {
      console.error('Error fetching call details:', error);
      throw error;
    }
  }
}

module.exports = new TwilioHandler();
