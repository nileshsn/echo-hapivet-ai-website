'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, AlertCircle, Clock, User, Phone, Mail, MapPin, Heart } from 'lucide-react';
import VoiceIntegration from '../voice/VoiceIntegration';

interface PatientData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  address: string;
  petName: string;
  petType: string;
  petBreed: string;
  petAge: string;
  petWeight: string;
  symptoms: string;
  previousConditions: string;
  medications: string;
  allergies: string;
  urgency: 'routine' | 'asap' | 'emergency';
  preferredDate: string;
  preferredTime: string;
  reason: string;
}

interface IntakeProgress {
  currentStep: number;
  totalSteps: number;
  completedFields: string[];
  missingFields: string[];
  completeness: number;
}

export default function PatientIntakeForm() {
  const [patientData, setPatientData] = useState<PatientData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    address: '',
    petName: '',
    petType: '',
    petBreed: '',
    petAge: '',
    petWeight: '',
    symptoms: '',
    previousConditions: '',
    medications: '',
    allergies: '',
    urgency: 'routine',
    preferredDate: '',
    preferredTime: '',
    reason: ''
  });

  const [progress, setProgress] = useState<IntakeProgress>({
    currentStep: 1,
    totalSteps: 4,
    completedFields: [],
    missingFields: [],
    completeness: 0
  });

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const steps = [
    { id: 1, title: 'Personal Information', fields: ['firstName', 'lastName', 'phone', 'email', 'address'] },
    { id: 2, title: 'Pet Information', fields: ['petName', 'petType', 'petBreed', 'petAge', 'petWeight'] },
    { id: 3, title: 'Medical Information', fields: ['symptoms', 'previousConditions', 'medications', 'allergies'] },
    { id: 4, title: 'Appointment Preferences', fields: ['urgency', 'preferredDate', 'preferredTime', 'reason'] }
  ];

  useEffect(() => {
    calculateProgress();
  }, [patientData]);

  const calculateProgress = () => {
    const allFields = steps.flatMap(step => step.fields);
    const completedFields = allFields.filter(field => patientData[field as keyof PatientData]);
    const missingFields = allFields.filter(field => !patientData[field as keyof PatientData]);
    const completeness = Math.round((completedFields.length / allFields.length) * 100);

    setProgress({
      currentStep: Math.ceil((completedFields.length / allFields.length) * steps.length),
      totalSteps: steps.length,
      completedFields,
      missingFields,
      completeness
    });
  };

  const handleInputChange = (field: keyof PatientData, value: string) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleVoiceTranscript = (transcript: string) => {
    setVoiceTranscript(transcript);
    // Process voice transcript to extract patient information
    processVoiceTranscript(transcript);
  };

  const processVoiceTranscript = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Extract personal information
    const nameMatch = transcript.match(/(?:name is|i'm|i am)\s+([a-zA-Z\s]+)/i);
    if (nameMatch) {
      const fullName = nameMatch[1].trim();
      const nameParts = fullName.split(' ');
      if (nameParts.length >= 2) {
        setPatientData(prev => ({
          ...prev,
          firstName: nameParts[0],
          lastName: nameParts.slice(1).join(' ')
        }));
      }
    }
    
    // Extract phone number
    const phoneMatch = transcript.match(/(?:phone|number)\s*(?:is|:)?\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i);
    if (phoneMatch) {
      setPatientData(prev => ({
        ...prev,
        phone: phoneMatch[1]
      }));
    }
    
    // Extract email
    const emailMatch = transcript.match(/(?:email|e-mail)\s*(?:is|:)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i);
    if (emailMatch) {
      setPatientData(prev => ({
        ...prev,
        email: emailMatch[1]
      }));
    }
    
    // Extract pet information
    const petNameMatch = transcript.match(/(?:pet|animal|dog|cat)\s*(?:name|is|called)\s*([a-zA-Z\s]+)/i);
    if (petNameMatch) {
      setPatientData(prev => ({
        ...prev,
        petName: petNameMatch[1].trim()
      }));
    }
    
    // Extract pet type
    const petTypeMatch = transcript.match(/(?:dog|cat|bird|fish|hamster|rabbit|reptile)/i);
    if (petTypeMatch) {
      setPatientData(prev => ({
        ...prev,
        petType: petTypeMatch[0]
      }));
    }
    
    // Extract symptoms
    const symptomsMatch = transcript.match(/(?:symptoms|problems|issues|concerns)\s*(?:are|include)\s*([^.]+)/i);
    if (symptomsMatch) {
      setPatientData(prev => ({
        ...prev,
        symptoms: symptomsMatch[1].trim()
      }));
    }
    
    // Extract urgency
    if (lowerTranscript.includes('emergency') || lowerTranscript.includes('urgent')) {
      setPatientData(prev => ({
        ...prev,
        urgency: 'emergency'
      }));
    } else if (lowerTranscript.includes('asap') || lowerTranscript.includes('soon')) {
      setPatientData(prev => ({
        ...prev,
        urgency: 'asap'
      }));
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const response = await fetch('/api/patient-intake', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });
      
      if (response.ok) {
        setSubmitStatus('success');
        // Reset form or redirect
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting patient intake:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergency': return 'bg-red-500';
      case 'asap': return 'bg-yellow-500';
      default: return 'bg-green-500';
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Patient Intake Form</h1>
        <p className="text-gray-600">Complete the form below or use voice input for faster data entry</p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-gray-500">{progress.completeness}% Complete</span>
            </div>
            <Progress value={progress.completeness} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500">
              {steps.map((step) => (
                <div key={step.id} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    step.id <= progress.currentStep ? 'bg-blue-500' : 'bg-gray-300'
                  }`} />
                  <span>{step.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Integration */}
      <VoiceIntegration
        sessionType="intake"
        onTranscriptUpdate={handleVoiceTranscript}
        onSessionComplete={(data) => {
          console.log('Voice session completed:', data);
        }}
      />

      {/* Form Steps */}
      {steps.map((step) => (
        <Card key={step.id} className={step.id <= progress.currentStep ? 'opacity-100' : 'opacity-50'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white ${
                step.id < progress.currentStep ? 'bg-green-500' : 
                step.id === progress.currentStep ? 'bg-blue-500' : 'bg-gray-300'
              }`}>
                {step.id < progress.currentStep ? <CheckCircle className="h-4 w-4" /> : step.id}
              </div>
              {step.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {step.id === 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name *</Label>
                  <Input
                    id="firstName"
                    value={patientData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    placeholder="Enter your first name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name *</Label>
                  <Input
                    id="lastName"
                    value={patientData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    placeholder="Enter your last name"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number *</Label>
                  <Input
                    id="phone"
                    value={patientData.phone}
                    onChange={(e) => handleInputChange('phone', e.target.value)}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={patientData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    placeholder="your@email.com"
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    value={patientData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    placeholder="Enter your address"
                  />
                </div>
              </div>
            )}

            {step.id === 2 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="petName">Pet Name *</Label>
                  <Input
                    id="petName"
                    value={patientData.petName}
                    onChange={(e) => handleInputChange('petName', e.target.value)}
                    placeholder="Enter your pet's name"
                  />
                </div>
                <div>
                  <Label htmlFor="petType">Pet Type *</Label>
                  <Select value={patientData.petType} onValueChange={(value) => handleInputChange('petType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select pet type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dog">Dog</SelectItem>
                      <SelectItem value="cat">Cat</SelectItem>
                      <SelectItem value="bird">Bird</SelectItem>
                      <SelectItem value="fish">Fish</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="petBreed">Breed</Label>
                  <Input
                    id="petBreed"
                    value={patientData.petBreed}
                    onChange={(e) => handleInputChange('petBreed', e.target.value)}
                    placeholder="Enter breed"
                  />
                </div>
                <div>
                  <Label htmlFor="petAge">Age</Label>
                  <Input
                    id="petAge"
                    value={patientData.petAge}
                    onChange={(e) => handleInputChange('petAge', e.target.value)}
                    placeholder="e.g., 3 years, 6 months"
                  />
                </div>
                <div>
                  <Label htmlFor="petWeight">Weight</Label>
                  <Input
                    id="petWeight"
                    value={patientData.petWeight}
                    onChange={(e) => handleInputChange('petWeight', e.target.value)}
                    placeholder="e.g., 25 lbs, 12 kg"
                  />
                </div>
              </div>
            )}

            {step.id === 3 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="symptoms">Symptoms/Concerns *</Label>
                  <Textarea
                    id="symptoms"
                    value={patientData.symptoms}
                    onChange={(e) => handleInputChange('symptoms', e.target.value)}
                    placeholder="Describe your pet's symptoms or concerns"
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="previousConditions">Previous Medical Conditions</Label>
                  <Textarea
                    id="previousConditions"
                    value={patientData.previousConditions}
                    onChange={(e) => handleInputChange('previousConditions', e.target.value)}
                    placeholder="Any previous medical conditions or illnesses"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="medications">Current Medications</Label>
                  <Textarea
                    id="medications"
                    value={patientData.medications}
                    onChange={(e) => handleInputChange('medications', e.target.value)}
                    placeholder="List any current medications"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="allergies">Allergies</Label>
                  <Textarea
                    id="allergies"
                    value={patientData.allergies}
                    onChange={(e) => handleInputChange('allergies', e.target.value)}
                    placeholder="Any known allergies"
                    rows={2}
                  />
                </div>
              </div>
            )}

            {step.id === 4 && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="urgency">Urgency Level *</Label>
                  <Select value={patientData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select urgency level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="routine">Routine</SelectItem>
                      <SelectItem value="asap">ASAP</SelectItem>
                      <SelectItem value="emergency">Emergency</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="mt-2">
                    <Badge className={getUrgencyColor(patientData.urgency)}>
                      {patientData.urgency.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="preferredDate">Preferred Date</Label>
                    <Input
                      id="preferredDate"
                      type="date"
                      value={patientData.preferredDate}
                      onChange={(e) => handleInputChange('preferredDate', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="preferredTime">Preferred Time</Label>
                    <Select value={patientData.preferredTime} onValueChange={(value) => handleInputChange('preferredTime', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select time" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="morning">Morning (9 AM - 12 PM)</SelectItem>
                        <SelectItem value="afternoon">Afternoon (12 PM - 5 PM)</SelectItem>
                        <SelectItem value="evening">Evening (5 PM - 8 PM)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="reason">Reason for Visit</Label>
                  <Textarea
                    id="reason"
                    value={patientData.reason}
                    onChange={(e) => handleInputChange('reason', e.target.value)}
                    placeholder="Additional information about the visit"
                    rows={3}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      ))}

      {/* Submit Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Ready to Submit?</h3>
              <p className="text-sm text-gray-600">
                {progress.completeness}% complete - {progress.missingFields.length} fields remaining
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || progress.completeness < 50}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Submit
                  </>
                )}
              </Button>
            </div>
          </div>
          
          {submitStatus === 'success' && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700">Patient intake submitted successfully!</span>
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">Error submitting patient intake. Please try again.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
