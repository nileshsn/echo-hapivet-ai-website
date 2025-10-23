const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class PatientIntakeService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.patientsFile = path.join(this.dataPath, 'patients.json');
    this.initializeDataDirectory();
  }

  initializeDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    
    if (!fs.existsSync(this.patientsFile)) {
      fs.writeFileSync(this.patientsFile, JSON.stringify([], null, 2));
    }
  }

  // Process intake transcript in real-time
  async processIntakeTranscript(transcript) {
    try {
      // Extract structured data from transcript
      const extractedData = await this.extractPatientInformation(transcript);
      
      // Validate and clean data
      const validatedData = await this.validatePatientData(extractedData);
      
      // Suggest next questions based on missing information
      const nextQuestions = await this.generateNextQuestions(validatedData);
      
      return {
        extractedData: validatedData,
        nextQuestions,
        completeness: this.calculateCompleteness(validatedData),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error processing intake transcript:', error);
      throw error;
    }
  }

  // Extract patient information using NLP
  async extractPatientInformation(transcript) {
    const patterns = {
      // Personal Information
      firstName: /(?:first name|given name)\s*(?:is|:)?\s*([a-zA-Z]+)/i,
      lastName: /(?:last name|surname|family name)\s*(?:is|:)?\s*([a-zA-Z]+)/i,
      fullName: /(?:name is|i'm|i am)\s+([a-zA-Z\s]+)/i,
      
      // Contact Information
      phone: /(?:phone|telephone|mobile)\s*(?:number|is|:)?\s*(\d{3}[-.\s]?\d{3}[-.\s]?\d{4})/i,
      email: /(?:email|e-mail)\s*(?:address|is|:)?\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/i,
      address: /(?:address|live at|located at)\s*([^.]+)/i,
      
      // Pet Information
      petName: /(?:pet|animal|dog|cat|bird|fish)\s*(?:name|is|called)\s*([a-zA-Z\s]+)/i,
      petType: /(?:dog|cat|bird|fish|hamster|rabbit|reptile|bird|ferret)/i,
      petBreed: /(?:breed|type)\s*(?:is|of)\s*([a-zA-Z\s]+)/i,
      petAge: /(?:age|old)\s*(?:is|of)\s*(\d+)\s*(?:years?|months?|weeks?)/i,
      petWeight: /(?:weight|weighs?)\s*(?:is|of)\s*(\d+(?:\.\d+)?)\s*(?:pounds?|lbs?|kg|kilograms?)/i,
      
      // Medical Information
      symptoms: /(?:symptoms|problems|issues|concerns)\s*(?:are|include)\s*([^.]+)/i,
      previousConditions: /(?:previous|past|history)\s*(?:conditions|illnesses|problems)\s*(?:are|include)\s*([^.]+)/i,
      medications: /(?:medications|meds|drugs)\s*(?:are|include)\s*([^.]+)/i,
      allergies: /(?:allergies|allergic)\s*(?:to|are)\s*([^.]+)/i,
      
      // Appointment Information
      urgency: /(?:urgent|emergency|asap|soon|routine|checkup)/i,
      preferredDate: /(?:prefer|want|need)\s*(?:appointment|visit)\s*(?:on|for)\s*([^.]+)/i,
      preferredTime: /(?:morning|afternoon|evening|am|pm)/i,
      reason: /(?:reason|why|because)\s*(?:for|of)\s*(?:visit|appointment)\s*(?:is|:)\s*([^.]+)/i
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

  // Validate and clean patient data
  async validatePatientData(data) {
    const validatedData = { ...data };
    
    // Clean and format phone number
    if (validatedData.phone) {
      validatedData.phone = validatedData.phone.replace(/\D/g, '');
      if (validatedData.phone.length === 10) {
        validatedData.phone = `+1${validatedData.phone}`;
      }
    }
    
    // Clean and format email
    if (validatedData.email) {
      validatedData.email = validatedData.email.toLowerCase().trim();
    }
    
    // Parse pet age
    if (validatedData.petAge) {
      const ageMatch = validatedData.petAge.match(/(\d+)\s*(years?|months?|weeks?)/i);
      if (ageMatch) {
        const value = parseInt(ageMatch[1]);
        const unit = ageMatch[2].toLowerCase();
        
        if (unit.includes('year')) {
          validatedData.petAgeMonths = value * 12;
        } else if (unit.includes('month')) {
          validatedData.petAgeMonths = value;
        } else if (unit.includes('week')) {
          validatedData.petAgeMonths = Math.round(value / 4);
        }
      }
    }
    
    // Parse pet weight
    if (validatedData.petWeight) {
      const weightMatch = validatedData.petWeight.match(/(\d+(?:\.\d+)?)\s*(pounds?|lbs?|kg|kilograms?)/i);
      if (weightMatch) {
        const value = parseFloat(weightMatch[1]);
        const unit = weightMatch[2].toLowerCase();
        
        if (unit.includes('pound') || unit.includes('lb')) {
          validatedData.petWeightKg = value * 0.453592;
        } else {
          validatedData.petWeightKg = value;
        }
      }
    }
    
    return validatedData;
  }

  // Generate next questions based on missing information
  async generateNextQuestions(data) {
    const requiredFields = [
      'firstName', 'lastName', 'phone', 'email', 'petName', 'petType', 'symptoms'
    ];
    
    const missingFields = requiredFields.filter(field => !data[field]);
    
    const questionMap = {
      firstName: "What is your first name?",
      lastName: "What is your last name?",
      phone: "What is your phone number?",
      email: "What is your email address?",
      petName: "What is your pet's name?",
      petType: "What type of animal is your pet?",
      symptoms: "What symptoms or concerns do you have about your pet?"
    };
    
    const nextQuestions = missingFields.map(field => ({
      field,
      question: questionMap[field],
      priority: this.getFieldPriority(field)
    }));
    
    // Sort by priority
    nextQuestions.sort((a, b) => a.priority - b.priority);
    
    return nextQuestions.slice(0, 3); // Return top 3 questions
  }

  // Get field priority for question ordering
  getFieldPriority(field) {
    const priorities = {
      firstName: 1,
      lastName: 2,
      phone: 3,
      email: 4,
      petName: 5,
      petType: 6,
      symptoms: 7
    };
    
    return priorities[field] || 10;
  }

  // Calculate completeness percentage
  calculateCompleteness(data) {
    const requiredFields = [
      'firstName', 'lastName', 'phone', 'email', 'petName', 'petType', 'symptoms'
    ];
    
    const completedFields = requiredFields.filter(field => data[field]);
    return Math.round((completedFields.length / requiredFields.length) * 100);
  }

  // Finalize intake process
  async finalizeIntake(session) {
    try {
      const patientData = {
        id: uuidv4(),
        ...session.extractedData,
        intakeDate: new Date(),
        sessionId: session.sessionId,
        status: 'pending_review',
        completeness: this.calculateCompleteness(session.extractedData)
      };
      
      // Save to database
      await this.savePatient(patientData);
      
      // Generate intake summary
      const summary = await this.generateIntakeSummary(patientData);
      
      return {
        patientId: patientData.id,
        summary,
        nextSteps: await this.generateNextSteps(patientData),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error finalizing intake:', error);
      throw error;
    }
  }

  // Save patient to database
  async savePatient(patientData) {
    try {
      const patients = JSON.parse(fs.readFileSync(this.patientsFile, 'utf8'));
      patients.push(patientData);
      fs.writeFileSync(this.patientsFile, JSON.stringify(patients, null, 2));
      
      console.log(`Patient saved: ${patientData.id}`);
      return patientData.id;
    } catch (error) {
      console.error('Error saving patient:', error);
      throw error;
    }
  }

  // Generate intake summary
  async generateIntakeSummary(patientData) {
    const summary = {
      patientName: `${patientData.firstName || ''} ${patientData.lastName || ''}`.trim(),
      petName: patientData.petName,
      petType: patientData.petType,
      symptoms: patientData.symptoms,
      urgency: patientData.urgency || 'routine',
      completeness: patientData.completeness
    };
    
    return summary;
  }

  // Generate next steps
  async generateNextSteps(patientData) {
    const steps = [];
    
    if (patientData.completeness < 100) {
      steps.push({
        action: 'complete_intake',
        description: 'Complete missing information',
        priority: 'high'
      });
    }
    
    if (patientData.symptoms) {
      steps.push({
        action: 'schedule_appointment',
        description: 'Schedule appointment based on symptoms',
        priority: 'high'
      });
    }
    
    steps.push({
      action: 'send_confirmation',
      description: 'Send confirmation email/SMS',
      priority: 'medium'
    });
    
    return steps;
  }

  // Get patient by ID
  async getPatient(patientId) {
    try {
      const patients = JSON.parse(fs.readFileSync(this.patientsFile, 'utf8'));
      return patients.find(p => p.id === patientId);
    } catch (error) {
      console.error('Error getting patient:', error);
      throw error;
    }
  }

  // Get all patients
  async getAllPatients() {
    try {
      const patients = JSON.parse(fs.readFileSync(this.patientsFile, 'utf8'));
      return patients;
    } catch (error) {
      console.error('Error getting patients:', error);
      throw error;
    }
  }

  // Update patient
  async updatePatient(patientId, updateData) {
    try {
      const patients = JSON.parse(fs.readFileSync(this.patientsFile, 'utf8'));
      const patientIndex = patients.findIndex(p => p.id === patientId);
      
      if (patientIndex === -1) {
        throw new Error('Patient not found');
      }
      
      patients[patientIndex] = { ...patients[patientIndex], ...updateData };
      fs.writeFileSync(this.patientsFile, JSON.stringify(patients, null, 2));
      
      return patients[patientIndex];
    } catch (error) {
      console.error('Error updating patient:', error);
      throw error;
    }
  }
}

module.exports = new PatientIntakeService();
