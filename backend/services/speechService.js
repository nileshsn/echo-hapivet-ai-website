const speech = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');

class SpeechService {
  constructor() {
    // Initialize Google Cloud Speech client
    this.client = new speech.SpeechClient({
      keyFilename: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      projectId: process.env.GOOGLE_CLOUD_PROJECT_ID
    });
    
    this.activeStreams = new Map();
    this.recognitionConfig = {
      encoding: 'MULAW',
      sampleRateHertz: 8000,
      languageCode: 'en-US',
      enableAutomaticPunctuation: true,
      enableSpeakerDiarization: true,
      diarizationSpeakerCount: 2,
      model: 'phone_call',
      useEnhanced: true,
      enableWordTimeOffsets: true
    };
  }

  // Initialize a new speech recognition stream
  async initializeStream(streamSid, io) {
    try {
      const request = {
        config: this.recognitionConfig,
        interimResults: true,
        singleUtterance: false
      };

      const recognizeStream = this.client
        .streamingRecognize(request)
        .on('error', (error) => {
          console.error('Speech recognition error:', error);
          this.activeStreams.delete(streamSid);
        })
        .on('data', (data) => {
          this.handleRecognitionResult(streamSid, data, io);
        });

      this.activeStreams.set(streamSid, {
        stream: recognizeStream,
        startTime: new Date(),
        transcript: '',
        confidence: 0,
        isActive: true
      });

      console.log(`Speech recognition stream initialized: ${streamSid}`);
    } catch (error) {
      console.error('Error initializing speech stream:', error);
      throw error;
    }
  }

  // Process audio chunk from Twilio
  async processAudioChunk(streamSid, audioBuffer, io) {
    try {
      const streamData = this.activeStreams.get(streamSid);
      if (!streamData || !streamData.isActive) {
        return;
      }

      // Send audio data to Google Speech-to-Text
      streamData.stream.write(audioBuffer);
    } catch (error) {
      console.error('Error processing audio chunk:', error);
    }
  }

  // Handle recognition results
  handleRecognitionResult(streamSid, data, io) {
    try {
      const streamData = this.activeStreams.get(streamSid);
      if (!streamData) return;

      const result = data.results[0];
      if (!result) return;

      const transcript = result.alternatives[0].transcript;
      const confidence = result.alternatives[0].confidence;

      // Update stream data
      streamData.transcript = transcript;
      streamData.confidence = confidence;
      streamData.lastUpdate = new Date();

      // Emit real-time transcription to connected clients
      io.emit('live-transcription', {
        streamSid,
        transcript,
        confidence,
        isFinal: result.isFinal,
        timestamp: new Date()
      });

      // If this is a final result, process it further
      if (result.isFinal) {
        this.processFinalTranscript(streamSid, transcript, confidence, io);
      }

      console.log(`Transcription [${streamSid}]: ${transcript} (${confidence})`);
    } catch (error) {
      console.error('Error handling recognition result:', error);
    }
  }

  // Process final transcript
  async processFinalTranscript(streamSid, transcript, confidence, io) {
    try {
      // Analyze the transcript for intent
      const intent = await this.analyzeIntent(transcript);
      
      // Emit intent analysis
      io.emit('intent-analysis', {
        streamSid,
        transcript,
        intent,
        confidence,
        timestamp: new Date()
      });

      // Process based on intent
      switch (intent.type) {
        case 'patient_intake':
          await this.processPatientIntake(streamSid, transcript, io);
          break;
        case 'diagnosis':
          await this.processDiagnosis(streamSid, transcript, io);
          break;
        case 'scheduling':
          await this.processScheduling(streamSid, transcript, io);
          break;
        default:
          console.log(`Unknown intent: ${intent.type}`);
      }
    } catch (error) {
      console.error('Error processing final transcript:', error);
    }
  }

  // Analyze transcript intent using simple keyword matching
  async analyzeIntent(transcript) {
    const lowerTranscript = transcript.toLowerCase();
    
    // Patient intake keywords
    const intakeKeywords = ['new patient', 'intake', 'registration', 'appointment', 'first time'];
    const intakeScore = intakeKeywords.reduce((score, keyword) => 
      score + (lowerTranscript.includes(keyword) ? 1 : 0), 0);

    // Diagnosis keywords
    const diagnosisKeywords = ['diagnosis', 'symptoms', 'condition', 'treatment', 'medical'];
    const diagnosisScore = diagnosisKeywords.reduce((score, keyword) => 
      score + (lowerTranscript.includes(keyword) ? 1 : 0), 0);

    // Scheduling keywords
    const schedulingKeywords = ['schedule', 'appointment', 'book', 'available', 'time'];
    const schedulingScore = schedulingKeywords.reduce((score, keyword) => 
      score + (lowerTranscript.includes(keyword) ? 1 : 0), 0);

    // Determine intent based on highest score
    const scores = {
      patient_intake: intakeScore,
      diagnosis: diagnosisScore,
      scheduling: schedulingScore
    };

    const maxScore = Math.max(...Object.values(scores));
    const intent = Object.keys(scores).find(key => scores[key] === maxScore);

    return {
      type: intent || 'unknown',
      confidence: maxScore / Math.max(intakeKeywords.length, diagnosisKeywords.length, schedulingKeywords.length),
      scores
    };
  }

  // Process patient intake transcript
  async processPatientIntake(streamSid, transcript, io) {
    try {
      // Extract patient information using NLP
      const patientData = await this.extractPatientData(transcript);
      
      io.emit('patient-intake-data', {
        streamSid,
        patientData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error processing patient intake:', error);
    }
  }

  // Process diagnosis transcript
  async processDiagnosis(streamSid, transcript, io) {
    try {
      // Extract diagnosis information
      const diagnosisData = await this.extractDiagnosisData(transcript);
      
      io.emit('diagnosis-data', {
        streamSid,
        diagnosisData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error processing diagnosis:', error);
    }
  }

  // Process scheduling transcript
  async processScheduling(streamSid, transcript, io) {
    try {
      // Extract scheduling preferences
      const schedulingData = await this.extractSchedulingData(transcript);
      
      io.emit('scheduling-data', {
        streamSid,
        schedulingData,
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error processing scheduling:', error);
    }
  }

  // Extract patient data from transcript
  async extractPatientData(transcript) {
    // Simple regex-based extraction (in production, use proper NLP)
    const patterns = {
      name: /(?:name is|i'm|i am)\s+([a-zA-Z\s]+)/i,
      phone: /(?:phone|number)\s*(?:is|:)?\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i,
      email: /(?:email|e-mail)\s*(?:is|:)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      petName: /(?:pet|animal|dog|cat)\s*(?:name|is)\s*([a-zA-Z\s]+)/i,
      petType: /(?:dog|cat|bird|fish|hamster|rabbit|reptile)/i,
      symptoms: /(?:symptoms|problems|issues)\s*(?:are|is)\s*([^.]+)/i
    };

    const extractedData = {};
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = transcript.match(pattern);
      if (match) {
        extractedData[key] = match[1].trim();
      }
    }

    return extractedData;
  }

  // Extract diagnosis data from transcript
  async extractDiagnosisData(transcript) {
    const patterns = {
      symptoms: /(?:symptoms|signs)\s*(?:are|include)\s*([^.]+)/i,
      diagnosis: /(?:diagnosis|condition)\s*(?:is|appears to be)\s*([^.]+)/i,
      treatment: /(?:treatment|therapy|medication)\s*(?:is|includes)\s*([^.]+)/i,
      followUp: /(?:follow.?up|next appointment)\s*(?:is|should be)\s*([^.]+)/i
    };

    const extractedData = {};
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = transcript.match(pattern);
      if (match) {
        extractedData[key] = match[1].trim();
      }
    }

    return extractedData;
  }

  // Extract scheduling data from transcript
  async extractSchedulingData(transcript) {
    const patterns = {
      preferredDate: /(?:prefer|want|need)\s*(?:appointment|visit)\s*(?:on|for)\s*([^.]+)/i,
      preferredTime: /(?:morning|afternoon|evening|am|pm)/i,
      urgency: /(?:urgent|emergency|asap|soon)/i,
      duration: /(?:how long|duration|time)\s*(?:will|does)\s*(?:it take|this take)/i
    };

    const extractedData = {};
    
    for (const [key, pattern] of Object.entries(patterns)) {
      const match = transcript.match(pattern);
      if (match) {
        extractedData[key] = match[1] ? match[1].trim() : true;
      }
    }

    return extractedData;
  }

  // Finalize stream
  async finalizeStream(streamSid, io) {
    try {
      const streamData = this.activeStreams.get(streamSid);
      if (streamData) {
        streamData.stream.end();
        streamData.isActive = false;
        
        // Emit final transcript
        io.emit('stream-finalized', {
          streamSid,
          finalTranscript: streamData.transcript,
          duration: new Date() - streamData.startTime,
          timestamp: new Date()
        });
        
        this.activeStreams.delete(streamSid);
      }
    } catch (error) {
      console.error('Error finalizing stream:', error);
    }
  }

  // Get active streams
  getActiveStreams() {
    return Array.from(this.activeStreams.entries()).map(([streamSid, data]) => ({
      streamSid,
      startTime: data.startTime,
      transcript: data.transcript,
      confidence: data.confidence,
      isActive: data.isActive
    }));
  }
}

module.exports = new SpeechService();
