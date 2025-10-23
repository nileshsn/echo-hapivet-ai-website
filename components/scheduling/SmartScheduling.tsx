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
import { 
  Calendar, 
  Clock, 
  User, 
  MapPin, 
  Phone, 
  CheckCircle, 
  AlertCircle, 
  Star,
  Heart,
  Stethoscope,
  Zap
} from 'lucide-react';

interface ScheduleOption {
  id: string;
  veterinarian: {
    id: string;
    name: string;
    specialties: string[];
  };
  date: string;
  time: string;
  endTime: string;
  duration: number;
  appointmentType: string;
  urgency: string;
  score: number;
  isAvailable: boolean;
}

interface PatientData {
  firstName: string;
  lastName: string;
  phone: string;
  email: string;
  petName: string;
  petType: string;
  symptoms: string;
  urgency: 'routine' | 'asap' | 'emergency';
  preferredDate: string;
  preferredTime: string;
  reason: string;
}

interface SchedulingData {
  appointmentType: string;
  urgency: string;
  options: ScheduleOption[];
  recommendations: Array<{
    type: string;
    message: string;
    priority: string;
  }>;
}

export default function SmartScheduling() {
  const [patientData, setPatientData] = useState<PatientData>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    petName: '',
    petType: '',
    symptoms: '',
    urgency: 'routine',
    preferredDate: '',
    preferredTime: '',
    reason: ''
  });

  const [schedulingData, setSchedulingData] = useState<SchedulingData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedOption, setSelectedOption] = useState<ScheduleOption | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleInputChange = (field: keyof PatientData, value: string) => {
    setPatientData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const generateScheduleOptions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/schedule-options', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(patientData),
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchedulingData(data);
      } else {
        console.error('Error generating schedule options');
      }
    } catch (error) {
      console.error('Error generating schedule options:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppointmentBooking = async () => {
    if (!selectedOption) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const appointmentData = {
        ...selectedOption,
        patientData,
        bookingDate: new Date().toISOString(),
        status: 'scheduled'
      };
      
      const response = await fetch('/api/schedule', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });
      
      if (response.ok) {
        setSubmitStatus('success');
        // Reset form or redirect
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error booking appointment:', error);
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

  const getAppointmentTypeColor = (type: string) => {
    switch (type) {
      case 'emergency': return 'bg-red-100 text-red-800';
      case 'surgery': return 'bg-purple-100 text-purple-800';
      case 'consultation': return 'bg-blue-100 text-blue-800';
      case 'follow-up': return 'bg-green-100 text-green-800';
      case 'vaccination': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    const [hours, minutes] = timeString.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Smart Scheduling</h1>
        <p className="text-gray-600">AI-powered appointment scheduling with predictive optimization</p>
      </div>

      {/* Patient Information Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Patient Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="firstName">First Name *</Label>
              <Input
                id="firstName"
                value={patientData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
                placeholder="Enter first name"
              />
            </div>
            <div>
              <Label htmlFor="lastName">Last Name *</Label>
              <Input
                id="lastName"
                value={patientData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
                placeholder="Enter last name"
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
            <div>
              <Label htmlFor="petName">Pet Name *</Label>
              <Input
                id="petName"
                value={patientData.petName}
                onChange={(e) => handleInputChange('petName', e.target.value)}
                placeholder="Enter pet's name"
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
          </div>
          
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="urgency">Urgency Level *</Label>
              <Select value={patientData.urgency} onValueChange={(value) => handleInputChange('urgency', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select urgency" />
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
              rows={2}
            />
          </div>
          
          <Button
            onClick={generateScheduleOptions}
            disabled={isLoading || !patientData.firstName || !patientData.lastName || !patientData.phone || !patientData.symptoms}
            className="w-full"
          >
            {isLoading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                Generating Options...
              </>
            ) : (
              <>
                <Zap className="h-4 w-4 mr-2" />
                Generate Smart Schedule Options
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Schedule Options */}
      {schedulingData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Available Appointments
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge className={getUrgencyColor(schedulingData.urgency)}>
                {schedulingData.urgency.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {schedulingData.appointmentType}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Recommendations */}
            {schedulingData.recommendations.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-semibold">Recommendations:</h4>
                {schedulingData.recommendations.map((rec, index) => (
                  <div key={index} className={`p-3 rounded-lg ${
                    rec.priority === 'high' ? 'bg-red-50 border border-red-200' :
                    rec.priority === 'medium' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-blue-50 border border-blue-200'
                  }`}>
                    <p className="text-sm">{rec.message}</p>
                  </div>
                ))}
              </div>
            )}
            
            {/* Schedule Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {schedulingData.options.map((option) => (
                <Card 
                  key={option.id} 
                  className={`cursor-pointer transition-all ${
                    selectedOption?.id === option.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50' 
                      : 'hover:shadow-md'
                  }`}
                  onClick={() => setSelectedOption(option)}
                >
                  <CardContent className="p-4">
                    <div className="space-y-3">
                      {/* Veterinarian Info */}
                      <div className="flex items-center gap-2">
                        <Stethoscope className="h-4 w-4 text-blue-500" />
                        <div>
                          <p className="font-semibold text-sm">{option.veterinarian.name}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {option.veterinarian.specialties.map((specialty) => (
                              <Badge key={specialty} variant="outline" className="text-xs">
                                {specialty}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                      
                      {/* Date & Time */}
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="font-medium">{formatDate(option.date)}</p>
                          <p className="text-sm text-gray-600">
                            {formatTime(option.time)} - {formatTime(option.endTime)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Appointment Type */}
                      <div className="flex items-center gap-2">
                        <Badge className={getAppointmentTypeColor(option.appointmentType)}>
                          {option.appointmentType}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {option.duration} min
                        </span>
                      </div>
                      
                      {/* Score */}
                      <div className="flex items-center gap-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className="text-sm font-medium">
                          Match Score: {Math.round(option.score)}%
                        </span>
                      </div>
                      
                      {/* Availability */}
                      <div className="flex items-center gap-2">
                        {option.isAvailable ? (
                          <CheckCircle className="h-4 w-4 text-green-500" />
                        ) : (
                          <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                        <span className={`text-sm ${
                          option.isAvailable ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {option.isAvailable ? 'Available' : 'Unavailable'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {/* Booking Button */}
            {selectedOption && (
              <div className="flex justify-center pt-4">
                <Button
                  onClick={handleAppointmentBooking}
                  disabled={isSubmitting || !selectedOption.isAvailable}
                  size="lg"
                  className="min-w-[200px]"
                >
                  {isSubmitting ? (
                    <>
                      <Clock className="h-4 w-4 mr-2 animate-spin" />
                      Booking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Book Appointment
                    </>
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Submit Status */}
      {submitStatus === 'success' && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="text-green-700 font-medium">
                Appointment booked successfully!
              </span>
            </div>
            <p className="text-green-600 text-sm mt-1">
              You will receive a confirmation email and SMS shortly.
            </p>
          </CardContent>
        </Card>
      )}
      
      {submitStatus === 'error' && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700 font-medium">
                Error booking appointment. Please try again.
              </span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
