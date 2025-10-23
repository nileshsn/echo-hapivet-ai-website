'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface VoiceIntegrationProps {
  sessionType: 'intake' | 'diagnosis';
  onTranscriptUpdate?: (transcript: string) => void;
  onSessionComplete?: (data: any) => void;
}

interface VoiceSession {
  sessionId: string;
  isActive: boolean;
  transcript: string;
  confidence: number;
  status: 'idle' | 'listening' | 'processing' | 'completed';
}

export default function VoiceIntegration({ 
  sessionType, 
  onTranscriptUpdate, 
  onSessionComplete 
}: VoiceIntegrationProps) {
  const [session, setSession] = useState<VoiceSession>({
    sessionId: '',
    isActive: false,
    transcript: '',
    confidence: 0,
    status: 'idle'
  });
  
  const [isConnected, setIsConnected] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState('');
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(50);
  
  const socketRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    initializeVoiceSession();
    return () => {
      cleanup();
    };
  }, []);

  const initializeVoiceSession = async () => {
    try {
      // Initialize WebSocket connection
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://your-domain.com' 
        : 'ws://localhost:3001';
      
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      };
      
      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
      socketRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      };
      
      socketRef.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };
      
      // Initialize browser speech recognition as fallback
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onresult = (event: any) => {
          let interimTranscript = '';
          let finalTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
          
          const fullTranscript = finalTranscript + interimTranscript;
          setLiveTranscript(fullTranscript);
          
          if (finalTranscript) {
            handleTranscriptUpdate(finalTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
        };
      }
      
    } catch (error) {
      console.error('Error initializing voice session:', error);
    }
  };

  const handleWebSocketMessage = (data: any) => {
    switch (data.type) {
      case 'live-transcription':
        setLiveTranscript(data.transcript);
        setSession(prev => ({
          ...prev,
          transcript: data.transcript,
          confidence: data.confidence
        }));
        break;
        
      case 'intake-data':
        if (onTranscriptUpdate) {
          onTranscriptUpdate(data.intakeData);
        }
        break;
        
      case 'diagnosis-data':
        if (onTranscriptUpdate) {
          onTranscriptUpdate(data.diagnosisData);
        }
        break;
        
      case 'session-started':
        setSession(prev => ({
          ...prev,
          sessionId: data.sessionId,
          isActive: true,
          status: 'listening'
        }));
        break;
        
      case 'session-completed':
        setSession(prev => ({
          ...prev,
          isActive: false,
          status: 'completed'
        }));
        if (onSessionComplete) {
          onSessionComplete(data.data);
        }
        break;
    }
  };

  const startVoiceSession = async () => {
    try {
      if (!isConnected || !socketRef.current) {
        throw new Error('WebSocket not connected');
      }
      
      // Start browser speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.start();
      }
      
      // Start media stream for phone integration
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true
          } 
        });
        
        mediaStreamRef.current = stream;
        
        // Initialize audio context for processing
        audioContextRef.current = new AudioContext();
        const source = audioContextRef.current.createMediaStreamSource(stream);
        // Add audio processing nodes here if needed
      }
      
      // Send session start message
      socketRef.current.send(JSON.stringify({
        type: 'start-voice-session',
        sessionType,
        timestamp: new Date()
      }));
      
      setSession(prev => ({
        ...prev,
        isActive: true,
        status: 'listening'
      }));
      
    } catch (error) {
      console.error('Error starting voice session:', error);
    }
  };

  const stopVoiceSession = () => {
    try {
      // Stop browser speech recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      
      // Stop media stream
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      
      // Close audio context
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }
      
      // Send session end message
      if (socketRef.current && session.sessionId) {
        socketRef.current.send(JSON.stringify({
          type: 'end-voice-session',
          sessionId: session.sessionId
        }));
      }
      
      setSession(prev => ({
        ...prev,
        isActive: false,
        status: 'completed'
      }));
      
    } catch (error) {
      console.error('Error stopping voice session:', error);
    }
  };

  const handleTranscriptUpdate = (transcript: string) => {
    setSession(prev => ({
      ...prev,
      transcript: prev.transcript + ' ' + transcript
    }));
    
    if (onTranscriptUpdate) {
      onTranscriptUpdate(transcript);
    }
    
    // Send transcript to backend
    if (socketRef.current && session.sessionId) {
      socketRef.current.send(JSON.stringify({
        type: 'transcription-update',
        sessionId: session.sessionId,
        transcript,
        confidence: session.confidence
      }));
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    // Implement mute/unmute logic
  };

  const adjustVolume = (newVolume: number) => {
    setVolume(newVolume);
    // Implement volume adjustment logic
  };

  const cleanup = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    
    if (socketRef.current) {
      socketRef.current.close();
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'listening': return 'bg-green-500';
      case 'processing': return 'bg-yellow-500';
      case 'completed': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mic className="h-5 w-5" />
          Voice {sessionType === 'intake' ? 'Intake' : 'Diagnosis'} Assistant
        </CardTitle>
        <div className="flex items-center gap-2">
          <Badge 
            variant={isConnected ? 'default' : 'destructive'}
            className={isConnected ? 'bg-green-500' : 'bg-red-500'}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </Badge>
          <Badge 
            variant="outline"
            className={getStatusColor(session.status)}
          >
            {session.status}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Voice Controls */}
        <div className="flex items-center justify-center gap-4">
          <Button
            onClick={session.isActive ? stopVoiceSession : startVoiceSession}
            variant={session.isActive ? 'destructive' : 'default'}
            size="lg"
            className="rounded-full w-16 h-16"
          >
            {session.isActive ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
          
          <Button
            onClick={toggleMute}
            variant="outline"
            size="sm"
            className="rounded-full"
          >
            {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
          </Button>
        </div>
        
        {/* Volume Control */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Volume</label>
          <input
            type="range"
            min="0"
            max="100"
            value={volume}
            onChange={(e) => adjustVolume(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
        
        {/* Live Transcript */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Live Transcript</label>
          <div className="p-4 bg-gray-50 rounded-lg min-h-[100px] max-h-[200px] overflow-y-auto">
            <p className="text-sm text-gray-700">
              {liveTranscript || 'Start speaking to see live transcription...'}
            </p>
          </div>
        </div>
        
        {/* Confidence Indicator */}
        {session.confidence > 0 && (
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Confidence: {Math.round(session.confidence * 100)}%
            </label>
            <Progress value={session.confidence * 100} className="w-full" />
          </div>
        )}
        
        {/* Session Info */}
        {session.sessionId && (
          <div className="text-xs text-gray-500">
            Session ID: {session.sessionId}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
