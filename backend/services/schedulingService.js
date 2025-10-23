const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const moment = require('moment');

class SchedulingService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.appointmentsFile = path.join(this.dataPath, 'appointments.json');
    this.availabilityFile = path.join(this.dataPath, 'availability.json');
    this.initializeDataDirectory();
  }

  initializeDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    
    if (!fs.existsSync(this.appointmentsFile)) {
      fs.writeFileSync(this.appointmentsFile, JSON.stringify([], null, 2));
    }
    
    if (!fs.existsSync(this.availabilityFile)) {
      // Initialize with default availability
      const defaultAvailability = {
        veterinarians: [
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
          ],
          timeSlots: [
            '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
            '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
            '15:00', '15:30', '16:00', '16:30', '17:00', '17:30'
          ],
          appointmentTypes: [
            { type: 'consultation', duration: 30, priority: 'normal' },
            { type: 'emergency', duration: 60, priority: 'high' },
            { type: 'surgery', duration: 120, priority: 'normal' },
            { type: 'follow-up', duration: 20, priority: 'normal' },
            { type: 'vaccination', duration: 15, priority: 'normal' }
          ]
        };
        
        fs.writeFileSync(this.availabilityFile, JSON.stringify(defaultAvailability, null, 2));
      }
    }

    // Generate smart schedule options
    async generateScheduleOptions(patientData, preferences = {}) {
      try {
        const availability = JSON.parse(fs.readFileSync(this.availabilityFile, 'utf8'));
        const appointments = JSON.parse(fs.readFileSync(this.appointmentsFile, 'utf8'));
        
        // Determine appointment type based on symptoms
        const appointmentType = this.determineAppointmentType(patientData);
        const urgency = this.determineUrgency(patientData);
        
        // Get available time slots
        const availableSlots = await this.getAvailableSlots(
          availability,
          appointments,
          appointmentType,
          urgency,
          preferences
        );
        
        // Rank options by suitability
        const rankedOptions = await this.rankScheduleOptions(
          availableSlots,
          patientData,
          preferences
        );
        
        return {
          appointmentType,
          urgency,
          options: rankedOptions,
          recommendations: await this.generateRecommendations(patientData, rankedOptions)
        };
      } catch (error) {
        console.error('Error generating schedule options:', error);
        throw error;
      }
    }

    // Determine appointment type based on symptoms
    determineAppointmentType(patientData) {
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

    // Determine urgency level
    determineUrgency(patientData) {
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

    // Get available time slots
    async getAvailableSlots(availability, appointments, appointmentType, urgency, preferences) {
      const slots = [];
      const today = moment();
      const startDate = preferences.startDate ? moment(preferences.startDate) : today;
      const endDate = preferences.endDate ? moment(preferences.endDate) : today.clone().add(14, 'days');
      
      // Get appointment duration
      const appointmentTypeData = availability.appointmentTypes.find(
        type => type.type === appointmentType
      );
      const duration = appointmentTypeData ? appointmentTypeData.duration : 30;
      
      // Iterate through each day
      for (let date = startDate.clone(); date.isBefore(endDate); date.add(1, 'day')) {
        const dayName = date.format('dddd').toLowerCase();
        
        // Check each veterinarian
        for (const vet of availability.veterinarians) {
          const vetAvailability = vet.availability[dayName];
          if (!vetAvailability) continue;
          
          const startTime = moment(`${date.format('YYYY-MM-DD')} ${vetAvailability.start}`);
          const endTime = moment(`${date.format('YYYY-MM-DD')} ${vetAvailability.end}`);
          
          // Generate time slots
          for (let time = startTime.clone(); time.isBefore(endTime); time.add(30, 'minutes')) {
            const slotEnd = time.clone().add(duration, 'minutes');
            
            if (slotEnd.isAfter(endTime)) break;
            
            // Check if slot is available
            const isAvailable = await this.isSlotAvailable(
              appointments,
              vet.id,
              time.format('YYYY-MM-DD HH:mm'),
              duration
            );
            
            if (isAvailable) {
              const slot = {
                id: uuidv4(),
                veterinarian: vet,
                date: time.format('YYYY-MM-DD'),
                time: time.format('HH:mm'),
                endTime: slotEnd.format('HH:mm'),
                duration,
                appointmentType,
                urgency,
                isAvailable: true
              };
              
              slots.push(slot);
            }
          }
        }
      }
      
      return slots;
    }

    // Check if time slot is available
    async isSlotAvailable(appointments, vetId, startTime, duration) {
      const slotStart = moment(startTime);
      const slotEnd = slotStart.clone().add(duration, 'minutes');
      
      for (const appointment of appointments) {
        if (appointment.veterinarianId === vetId && appointment.status !== 'cancelled') {
          const appointmentStart = moment(appointment.startTime);
          const appointmentEnd = moment(appointment.endTime);
          
          // Check for overlap
          if (slotStart.isBefore(appointmentEnd) && slotEnd.isAfter(appointmentStart)) {
            return false;
          }
        }
      }
      
      return true;
    }

    // Rank schedule options
    async rankScheduleOptions(slots, patientData, preferences) {
      const rankedSlots = slots.map(slot => {
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
        if (preferences.preferredTime) {
          const preferredTime = preferences.preferredTime.toLowerCase();
          const slotTime = moment(slot.time, 'HH:mm');
          
          if (preferredTime === 'morning' && slotTime.hour() < 12) {
            score += 20;
          } else if (preferredTime === 'afternoon' && slotTime.hour() >= 12 && slotTime.hour() < 17) {
            score += 20;
          } else if (preferredTime === 'evening' && slotTime.hour() >= 17) {
            score += 20;
          }
        }
        
        // Date preference scoring
        if (preferences.preferredDate) {
          const preferredDate = moment(preferences.preferredDate);
          const slotDate = moment(slot.date);
          
          if (slotDate.isSame(preferredDate, 'day')) {
            score += 30;
          } else if (slotDate.isSame(preferredDate, 'week')) {
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
          const slotDateTime = moment(`${slot.date} ${slot.time}`);
          const hoursFromNow = slotDateTime.diff(moment(), 'hours');
          score += Math.max(0, 24 - hoursFromNow);
        }
        
        return { ...slot, score };
      });
      
      // Sort by score (highest first)
      return rankedSlots.sort((a, b) => b.score - a.score);
    }

    // Generate recommendations
    async generateRecommendations(patientData, rankedOptions) {
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
          message: `We recommend ${bestOption.veterinarian.name} on ${bestOption.date} at ${bestOption.time}`,
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

    // Create appointment
    async createAppointment(appointmentData) {
      try {
        const appointment = {
          id: uuidv4(),
          ...appointmentData,
          createdAt: new Date(),
          status: 'scheduled'
        };
        
        const appointments = JSON.parse(fs.readFileSync(this.appointmentsFile, 'utf8'));
        appointments.push(appointment);
        fs.writeFileSync(this.appointmentsFile, JSON.stringify(appointments, null, 2));
        
        console.log(`Appointment created: ${appointment.id}`);
        return appointment;
      } catch (error) {
        console.error('Error creating appointment:', error);
        throw error;
      }
    }

    // Get appointment by ID
    async getAppointment(appointmentId) {
      try {
        const appointments = JSON.parse(fs.readFileSync(this.appointmentsFile, 'utf8'));
        return appointments.find(a => a.id === appointmentId);
      } catch (error) {
        console.error('Error getting appointment:', error);
        throw error;
      }
    }

    // Get all appointments
    async getAllAppointments() {
      try {
        const appointments = JSON.parse(fs.readFileSync(this.appointmentsFile, 'utf8'));
        return appointments;
      } catch (error) {
        console.error('Error getting appointments:', error);
        throw error;
      }
    }

    // Update appointment
    async updateAppointment(appointmentId, updateData) {
      try {
        const appointments = JSON.parse(fs.readFileSync(this.appointmentsFile, 'utf8'));
        const appointmentIndex = appointments.findIndex(a => a.id === appointmentId);
        
        if (appointmentIndex === -1) {
          throw new Error('Appointment not found');
        }
        
        appointments[appointmentIndex] = { ...appointments[appointmentIndex], ...updateData };
        fs.writeFileSync(this.appointmentsFile, JSON.stringify(appointments, null, 2));
        
        return appointments[appointmentIndex];
      } catch (error) {
        console.error('Error updating appointment:', error);
        throw error;
      }
    }

    // Cancel appointment
    async cancelAppointment(appointmentId, reason) {
      try {
        const appointment = await this.getAppointment(appointmentId);
        if (!appointment) {
          throw new Error('Appointment not found');
        }
        
        const updatedAppointment = await this.updateAppointment(appointmentId, {
          status: 'cancelled',
          cancellationReason: reason,
          cancelledAt: new Date()
        });
        
        return updatedAppointment;
      } catch (error) {
        console.error('Error cancelling appointment:', error);
        throw error;
      }
    }

    // Get appointments for a specific date
    async getAppointmentsByDate(date) {
      try {
        const appointments = JSON.parse(fs.readFileSync(this.appointmentsFile, 'utf8'));
        const targetDate = moment(date).format('YYYY-MM-DD');
        
        return appointments.filter(appointment => 
          moment(appointment.startTime).format('YYYY-MM-DD') === targetDate
        );
      } catch (error) {
        console.error('Error getting appointments by date:', error);
        throw error;
      }
    }

    // Get appointments for a specific veterinarian
    async getAppointmentsByVeterinarian(veterinarianId) {
      try {
        const appointments = JSON.parse(fs.readFileSync(this.appointmentsFile, 'utf8'));
        return appointments.filter(appointment => 
          appointment.veterinarianId === veterinarianId
        );
      } catch (error) {
        console.error('Error getting appointments by veterinarian:', error);
        throw error;
      }
    }
  }

  module.exports = new SchedulingService();
