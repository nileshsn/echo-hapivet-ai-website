import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const patientData = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'phone', 'symptoms'];
    const missingFields = requiredFields.filter(field => !patientData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Determine appointment type and urgency
    const appointmentType = determineAppointmentType(patientData);
    const urgency = determineUrgency(patientData);
    
    // Generate available time slots
    const availableSlots = generateAvailableSlots(patientData, appointmentType, urgency);
    
    // Rank options by suitability
    const rankedOptions = rankScheduleOptions(availableSlots, patientData);
    
    // Generate recommendations
    const recommendations = generateRecommendations(patientData, rankedOptions);
    
    return NextResponse.json({
      success: true,
      appointmentType,
      urgency,
      options: rankedOptions,
      recommendations
    });
    
  } catch (error) {
    console.error('Error generating schedule options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function determineAppointmentType(patientData: any): string {
  const symptoms = (patientData.symptoms || '').toLowerCase();
  
  if (symptoms.includes('emergency') || symptoms.includes('urgent') || 
      symptoms.includes('bleeding') || symptoms.includes('unconscious')) {
    return 'emergency';
  }
  
  if (symptoms.includes('surgery') || symptoms.includes('operation')) {
    return 'surgery';
  }
  
  if (symptoms.includes('vaccination') || symptoms.includes('vaccine')) {
    return 'vaccination';
  }
  
  if (symptoms.includes('follow') || symptoms.includes('check')) {
    return 'follow-up';
  }
  
  return 'consultation';
}

function determineUrgency(patientData: any): string {
  const symptoms = (patientData.symptoms || '').toLowerCase();
  const urgency = patientData.urgency || 'routine';
  
  if (urgency === 'emergency' || symptoms.includes('emergency') || 
      symptoms.includes('urgent') || symptoms.includes('critical')) {
    return 'high';
  }
  
  if (urgency === 'asap' || symptoms.includes('soon') || symptoms.includes('quickly')) {
    return 'medium';
  }
  
  return 'low';
}

function generateAvailableSlots(patientData: any, appointmentType: string, urgency: string) {
  const slots = [];
  const today = new Date();
  const startDate = patientData.preferredDate ? new Date(patientData.preferredDate) : today;
  const endDate = new Date(startDate.getTime() + (14 * 24 * 60 * 60 * 1000)); // 14 days from start
  
  // Mock veterinarians
  const veterinarians = [
    {
      id: 'vet1',
      name: 'Dr. Sarah Johnson',
      specialties: ['general', 'surgery'],
      availability: {
        monday: { start: '09:00', end: '17:00' },
        tuesday: { start: '09:00', end: '17:00' },
        wednesday: { start: '09:00', end: '17:00' },
        thursday: { start: '09:00', end: '17:00' },
        friday: { start: '09:00', end: '17:00' },
        saturday: { start: '10:00', end: '14:00' },
        sunday: null
      }
    },
    {
      id: 'vet2',
      name: 'Dr. Michael Chen',
      specialties: ['emergency', 'cardiology'],
      availability: {
        monday: { start: '08:00', end: '20:00' },
        tuesday: { start: '08:00', end: '20:00' },
        wednesday: { start: '08:00', end: '20:00' },
        thursday: { start: '08:00', end: '20:00' },
        friday: { start: '08:00', end: '20:00' },
        saturday: { start: '09:00', end: '18:00' },
        sunday: { start: '09:00', end: '18:00' }
      }
    }
  ];
  
  // Generate slots for the next 14 days
  for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
    const dayName = date.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    for (const vet of veterinarians) {
      const vetAvailability = vet.availability[dayName];
      if (!vetAvailability) continue;
      
      const startTime = new Date(`${date.toISOString().split('T')[0]} ${vetAvailability.start}`);
      const endTime = new Date(`${date.toISOString().split('T')[0]} ${vetAvailability.end}`);
      
      // Generate 30-minute slots
      for (let time = new Date(startTime); time < endTime; time.setMinutes(time.getMinutes() + 30)) {
        const slotEnd = new Date(time.getTime() + (30 * 60 * 1000));
        
        if (slotEnd > endTime) break;
        
        const slot = {
          id: `slot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          veterinarian: vet,
          date: date.toISOString().split('T')[0],
          time: time.toTimeString().slice(0, 5),
          endTime: slotEnd.toTimeString().slice(0, 5),
          duration: 30,
          appointmentType,
          urgency,
          isAvailable: true,
          score: 0
        };
        
        slots.push(slot);
      }
    }
  }
  
  return slots;
}

function rankScheduleOptions(slots: any[], patientData: any) {
  return slots.map(slot => {
    let score = 0;
    
    // Urgency scoring
    if (patientData.urgency === 'emergency' && slot.urgency === 'high') {
      score += 50;
    } else if (patientData.urgency === 'asap' && slot.urgency === 'medium') {
      score += 30;
    } else if (patientData.urgency === 'routine' && slot.urgency === 'low') {
      score += 20;
    }
    
    // Time preference scoring
    if (patientData.preferredTime) {
      const preferredTime = patientData.preferredTime.toLowerCase();
      const slotTime = new Date(`2000-01-01 ${slot.time}`);
      const hour = slotTime.getHours();
      
      if (preferredTime === 'morning' && hour < 12) {
        score += 20;
      } else if (preferredTime === 'afternoon' && hour >= 12 && hour < 17) {
        score += 20;
      } else if (preferredTime === 'evening' && hour >= 17) {
        score += 20;
      }
    }
    
    // Date preference scoring
    if (patientData.preferredDate) {
      const preferredDate = new Date(patientData.preferredDate);
      const slotDate = new Date(slot.date);
      
      if (slotDate.toDateString() === preferredDate.toDateString()) {
        score += 30;
      } else if (Math.abs(slotDate.getTime() - preferredDate.getTime()) < (7 * 24 * 60 * 60 * 1000)) {
        score += 15;
      }
    }
    
    // Veterinarian specialty scoring
    if (patientData.symptoms) {
      const symptoms = patientData.symptoms.toLowerCase();
      const vetSpecialties = slot.veterinarian.specialties;
      
      if (symptoms.includes('emergency') && vetSpecialties.includes('emergency')) {
        score += 25;
      } else if (symptoms.includes('surgery') && vetSpecialties.includes('surgery')) {
        score += 25;
      } else if (vetSpecialties.includes('general')) {
        score += 15;
      }
    }
    
    // Availability scoring (earlier slots get higher scores for urgent cases)
    if (patientData.urgency === 'emergency') {
      const slotDateTime = new Date(`${slot.date} ${slot.time}`);
      const hoursFromNow = (slotDateTime.getTime() - new Date().getTime()) / (1000 * 60 * 60);
      score += Math.max(0, 24 - hoursFromNow);
    }
    
    return { ...slot, score };
  }).sort((a, b) => b.score - a.score);
}

function generateRecommendations(patientData: any, rankedOptions: any[]) {
  const recommendations = [];
  
  if (patientData.urgency === 'emergency') {
    recommendations.push({
      type: 'urgent',
      message: 'Based on the symptoms described, we recommend scheduling an emergency appointment as soon as possible.',
      priority: 'high'
    });
  }
  
  if (rankedOptions.length > 0) {
    const bestOption = rankedOptions[0];
    recommendations.push({
      type: 'best_match',
      message: `We recommend ${bestOption.veterinarian.name} on ${new Date(bestOption.date).toLocaleDateString()} at ${bestOption.time}`,
      priority: 'medium'
    });
  }
  
  if (patientData.symptoms && patientData.symptoms.includes('vaccination')) {
    recommendations.push({
      type: 'vaccination',
      message: 'Vaccination appointments are typically quick and can be scheduled during regular hours.',
      priority: 'low'
    });
  }
  
  return recommendations;
}
