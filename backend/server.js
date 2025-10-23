const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import our custom modules
const twilioHandler = require('./services/twilioHandler');
const speechService = require('./services/speechService');
const patientIntakeService = require('./services/patientIntakeService');
const diagnosisService = require('./services/diagnosisService');
const schedulingService = require('./services/schedulingService');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Store active sessions
const activeSessions = new Map();

// WebSocket connection handling
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  // Handle voice session initialization
  socket.on('start-voice-session', async (data) => {
    try {
      const sessionId = data.sessionId || generateSessionId();
      const sessionData = {
        socketId: socket.id,
        sessionId,
        type: data.type, // 'intake' or 'diagnosis'
        startTime: new Date(),
        transcript: '',
        status: 'active'
      };
      
      activeSessions.set(sessionId, sessionData);
      socket.join(sessionId);
      
      socket.emit('session-started', { sessionId, status: 'ready' });
      console.log(`Voice session started: ${sessionId}`);
    } catch (error) {
      console.error('Error starting voice session:', error);
      socket.emit('error', { message: 'Failed to start voice session' });
    }
  });

  // Handle real-time transcription updates
  socket.on('transcription-update', async (data) => {
    try {
      const { sessionId, transcript, confidence } = data;
      const session = activeSessions.get(sessionId);
      
      if (session) {
        session.transcript = transcript;
        session.lastUpdate = new Date();
        
        // Process based on session type
        if (session.type === 'intake') {
          const intakeData = await patientIntakeService.processIntakeTranscript(transcript);
          socket.emit('intake-data', intakeData);
        } else if (session.type === 'diagnosis') {
          const diagnosisData = await diagnosisService.processDiagnosisTranscript(transcript);
          socket.emit('diagnosis-data', diagnosisData);
        }
        
        // Broadcast to all clients in the session
        io.to(sessionId).emit('transcript-updated', {
          sessionId,
          transcript,
          confidence,
          timestamp: new Date()
        });
      }
    } catch (error) {
      console.error('Error processing transcription:', error);
      socket.emit('error', { message: 'Failed to process transcription' });
    }
  });

  // Handle session end
  socket.on('end-voice-session', async (data) => {
    try {
      const { sessionId } = data;
      const session = activeSessions.get(sessionId);
      
      if (session) {
        session.status = 'completed';
        session.endTime = new Date();
        
        // Process final data based on session type
        if (session.type === 'intake') {
          const finalData = await patientIntakeService.finalizeIntake(session);
          socket.emit('intake-completed', finalData);
        } else if (session.type === 'diagnosis') {
          const finalData = await diagnosisService.finalizeDiagnosis(session);
          socket.emit('diagnosis-completed', finalData);
        }
        
        activeSessions.delete(sessionId);
        socket.leave(sessionId);
      }
    } catch (error) {
      console.error('Error ending voice session:', error);
      socket.emit('error', { message: 'Failed to end voice session' });
    }
  });

  // Handle scheduling requests
  socket.on('request-scheduling', async (data) => {
    try {
      const { patientData, preferences } = data;
      const scheduleOptions = await schedulingService.generateScheduleOptions(patientData, preferences);
      socket.emit('schedule-options', scheduleOptions);
    } catch (error) {
      console.error('Error generating schedule options:', error);
      socket.emit('error', { message: 'Failed to generate schedule options' });
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Clean up any active sessions for this socket
    for (const [sessionId, session] of activeSessions.entries()) {
      if (session.socketId === socket.id) {
        activeSessions.delete(sessionId);
      }
    }
  });
});

// API Routes

// Twilio webhook for incoming calls
app.post('/webhook/voice', (req, res) => {
  const twiml = twilioHandler.handleIncomingCall(req.body);
  res.type('text/xml');
  res.send(twiml);
});

// Twilio webhook for media streams
app.post('/webhook/media', (req, res) => {
  twilioHandler.handleMediaStream(req.body, io);
  res.status(200).send('OK');
});

// Get active sessions
app.get('/api/sessions', (req, res) => {
  const sessions = Array.from(activeSessions.values());
  res.json({ sessions });
});

// Get session details
app.get('/api/sessions/:sessionId', (req, res) => {
  const session = activeSessions.get(req.params.sessionId);
  if (session) {
    res.json(session);
  } else {
    res.status(404).json({ error: 'Session not found' });
  }
});

// Patient intake endpoints
app.post('/api/patient-intake', async (req, res) => {
  try {
    const intakeData = await patientIntakeService.createIntakeRecord(req.body);
    res.json(intakeData);
  } catch (error) {
    console.error('Error creating patient intake:', error);
    res.status(500).json({ error: 'Failed to create patient intake' });
  }
});

// Diagnosis endpoints
app.post('/api/diagnosis', async (req, res) => {
  try {
    const diagnosisData = await diagnosisService.createDiagnosisRecord(req.body);
    res.json(diagnosisData);
  } catch (error) {
    console.error('Error creating diagnosis:', error);
    res.status(500).json({ error: 'Failed to create diagnosis' });
  }
});

// Scheduling endpoints
app.post('/api/schedule', async (req, res) => {
  try {
    const scheduleData = await schedulingService.createAppointment(req.body);
    res.json(scheduleData);
  } catch (error) {
    console.error('Error creating appointment:', error);
    res.status(500).json({ error: 'Failed to create appointment' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date(),
    activeSessions: activeSessions.size
  });
});

// Utility function
function generateSessionId() {
  return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 HapiVet AI Backend Server running on port ${PORT}`);
  console.log(`📞 Twilio webhook: http://localhost:${PORT}/webhook/voice`);
  console.log(`🎤 Media webhook: http://localhost:${PORT}/webhook/media`);
  console.log(`🔗 WebSocket server ready for connections`);
});

module.exports = { app, server, io };
