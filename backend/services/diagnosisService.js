const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class DiagnosisService {
  constructor() {
    this.dataPath = path.join(__dirname, '../data');
    this.diagnosesFile = path.join(this.dataPath, 'diagnoses.json');
    this.initializeDataDirectory();
  }

  initializeDataDirectory() {
    if (!fs.existsSync(this.dataPath)) {
      fs.mkdirSync(this.dataPath, { recursive: true });
    }
    
    if (!fs.existsSync(this.diagnosesFile)) {
      fs.writeFileSync(this.diagnosesFile, JSON.stringify([], null, 2));
    }
  }

  // Process diagnosis transcript in real-time
  async processDiagnosisTranscript(transcript) {
    try {
      // Extract SOAP components from transcript
      const soapData = await this.extractSOAPComponents(transcript);
      
      // Validate and structure data
      const structuredData = await this.structureSOAPData(soapData);
      
      // Generate suggestions for missing components
      const suggestions = await this.generateSOAPSuggestions(structuredData);
      
      return {
        soapData: structuredData,
        suggestions,
        completeness: this.calculateSOAPCompleteness(structuredData),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error processing diagnosis transcript:', error);
      throw error;
    }
  }

  // Extract SOAP components from transcript
  async extractSOAPComponents(transcript) {
    const patterns = {
      // Subjective (S) - Patient's symptoms and concerns
      subjective: {
        chiefComplaint: /(?:chief complaint|main concern|primary issue)\s*(?:is|:)?\s*([^.]+)/i,
        history: /(?:history|background|story)\s*(?:is|:)?\s*([^.]+)/i,
        symptoms: /(?:symptoms|signs|problems)\s*(?:are|include)\s*([^.]+)/i,
        duration: /(?:duration|how long|since when)\s*(?:is|has been)\s*([^.]+)/i,
        severity: /(?:severity|how bad|pain level)\s*(?:is|:)?\s*([^.]+)/i,
        triggers: /(?:triggers|causes|makes worse)\s*(?:are|include)\s*([^.]+)/i,
        ownerObservations: /(?:owner|pet parent|client)\s*(?:noticed|observed|reported)\s*([^.]+)/i
      },
      
      // Objective (O) - Physical examination findings
      objective: {
        vitalSigns: /(?:vital signs|temperature|heart rate|respiratory rate)\s*(?:are|:)?\s*([^.]+)/i,
        physicalExam: /(?:physical exam|examination|findings)\s*(?:shows|reveals|indicates)\s*([^.]+)/i,
        bodyCondition: /(?:body condition|weight|appearance)\s*(?:is|:)?\s*([^.]+)/i,
        behavior: /(?:behavior|demeanor|attitude)\s*(?:is|:)?\s*([^.]+)/i,
        mobility: /(?:mobility|movement|gait)\s*(?:is|:)?\s*([^.]+)/i,
        skinCondition: /(?:skin|coat|fur)\s*(?:condition|appearance)\s*(?:is|:)?\s*([^.]+)/i,
        eyes: /(?:eyes|vision|pupils)\s*(?:are|:)?\s*([^.]+)/i,
        ears: /(?:ears|hearing)\s*(?:are|:)?\s*([^.]+)/i,
        mouth: /(?:mouth|teeth|gums)\s*(?:are|:)?\s*([^.]+)/i,
        abdomen: /(?:abdomen|belly|stomach)\s*(?:is|:)?\s*([^.]+)/i,
        lymphNodes: /(?:lymph nodes|nodes)\s*(?:are|:)?\s*([^.]+)/i
      },
      
      // Assessment (A) - Diagnosis and differentials
      assessment: {
        primaryDiagnosis: /(?:primary diagnosis|main diagnosis|condition)\s*(?:is|:)?\s*([^.]+)/i,
        differentialDiagnosis: /(?:differential|rule out|consider)\s*(?:diagnoses|conditions)\s*(?:are|include)\s*([^.]+)/i,
        severity: /(?:severity|stage|grade)\s*(?:is|:)?\s*([^.]+)/i,
        prognosis: /(?:prognosis|outlook|expected outcome)\s*(?:is|:)?\s*([^.]+)/i,
        riskFactors: /(?:risk factors|complications|concerns)\s*(?:are|include)\s*([^.]+)/i
      },
      
      // Plan (P) - Treatment and follow-up
      plan: {
        treatment: /(?:treatment|therapy|management)\s*(?:plan|includes|is)\s*([^.]+)/i,
        medications: /(?:medications|drugs|prescriptions)\s*(?:are|include)\s*([^.]+)/i,
        procedures: /(?:procedures|tests|interventions)\s*(?:are|include)\s*([^.]+)/i,
        followUp: /(?:follow.?up|next visit|monitoring)\s*(?:is|should be)\s*([^.]+)/i,
        clientEducation: /(?:education|instructions|advice)\s*(?:for|to)\s*(?:client|owner)\s*(?:is|:)?\s*([^.]+)/i,
        restrictions: /(?:restrictions|limitations|avoid)\s*(?:are|include)\s*([^.]+)/i,
        emergencyInstructions: /(?:emergency|urgent|call if)\s*(?:instructions|situations)\s*(?:are|include)\s*([^.]+)/i
      }
    };

    const extractedData = {};
    
    for (const [section, fields] of Object.entries(patterns)) {
      extractedData[section] = {};
      for (const [field, pattern] of Object.entries(fields)) {
        const match = transcript.match(pattern);
        if (match) {
          extractedData[section][field] = match[1] ? match[1].trim() : true;
        }
      }
    }

    return extractedData;
  }

  // Structure SOAP data
  async structureSOAPData(soapData) {
    const structuredData = {
      subjective: {
        chiefComplaint: soapData.subjective?.chiefComplaint || '',
        history: soapData.subjective?.history || '',
        symptoms: soapData.subjective?.symptoms || '',
        duration: soapData.subjective?.duration || '',
        severity: soapData.subjective?.severity || '',
        triggers: soapData.subjective?.triggers || '',
        ownerObservations: soapData.subjective?.ownerObservations || ''
      },
      objective: {
        vitalSigns: soapData.objective?.vitalSigns || '',
        physicalExam: soapData.objective?.physicalExam || '',
        bodyCondition: soapData.objective?.bodyCondition || '',
        behavior: soapData.objective?.behavior || '',
        mobility: soapData.objective?.mobility || '',
        skinCondition: soapData.objective?.skinCondition || '',
        eyes: soapData.objective?.eyes || '',
        ears: soapData.objective?.ears || '',
        mouth: soapData.objective?.mouth || '',
        abdomen: soapData.objective?.abdomen || '',
        lymphNodes: soapData.objective?.lymphNodes || ''
      },
      assessment: {
        primaryDiagnosis: soapData.assessment?.primaryDiagnosis || '',
        differentialDiagnosis: soapData.assessment?.differentialDiagnosis || '',
        severity: soapData.assessment?.severity || '',
        prognosis: soapData.assessment?.prognosis || '',
        riskFactors: soapData.assessment?.riskFactors || ''
      },
      plan: {
        treatment: soapData.plan?.treatment || '',
        medications: soapData.plan?.medications || '',
        procedures: soapData.plan?.procedures || '',
        followUp: soapData.plan?.followUp || '',
        clientEducation: soapData.plan?.clientEducation || '',
        restrictions: soapData.plan?.restrictions || '',
        emergencyInstructions: soapData.plan?.emergencyInstructions || ''
      }
    };

    return structuredData;
  }

  // Generate SOAP suggestions
  async generateSOAPSuggestions(soapData) {
    const suggestions = [];
    
    // Subjective suggestions
    if (!soapData.subjective.chiefComplaint) {
      suggestions.push({
        section: 'subjective',
        field: 'chiefComplaint',
        suggestion: 'What is the main concern or reason for the visit?',
        priority: 'high'
      });
    }
    
    if (!soapData.subjective.symptoms) {
      suggestions.push({
        section: 'subjective',
        field: 'symptoms',
        suggestion: 'What specific symptoms has the pet been showing?',
        priority: 'high'
      });
    }
    
    // Objective suggestions
    if (!soapData.objective.vitalSigns) {
      suggestions.push({
        section: 'objective',
        field: 'vitalSigns',
        suggestion: 'What are the vital signs (temperature, heart rate, respiratory rate)?',
        priority: 'high'
      });
    }
    
    if (!soapData.objective.physicalExam) {
      suggestions.push({
        section: 'objective',
        field: 'physicalExam',
        suggestion: 'What were the physical examination findings?',
        priority: 'high'
      });
    }
    
    // Assessment suggestions
    if (!soapData.assessment.primaryDiagnosis) {
      suggestions.push({
        section: 'assessment',
        field: 'primaryDiagnosis',
        suggestion: 'What is the primary diagnosis or condition?',
        priority: 'high'
      });
    }
    
    // Plan suggestions
    if (!soapData.plan.treatment) {
      suggestions.push({
        section: 'plan',
        field: 'treatment',
        suggestion: 'What is the treatment plan?',
        priority: 'high'
      });
    }
    
    if (!soapData.plan.followUp) {
      suggestions.push({
        section: 'plan',
        field: 'followUp',
        suggestion: 'What are the follow-up instructions?',
        priority: 'medium'
      });
    }
    
    return suggestions;
  }

  // Calculate SOAP completeness
  calculateSOAPCompleteness(soapData) {
    const requiredFields = {
      subjective: ['chiefComplaint', 'symptoms'],
      objective: ['vitalSigns', 'physicalExam'],
      assessment: ['primaryDiagnosis'],
      plan: ['treatment']
    };
    
    let totalFields = 0;
    let completedFields = 0;
    
    for (const [section, fields] of Object.entries(requiredFields)) {
      for (const field of fields) {
        totalFields++;
        if (soapData[section][field]) {
          completedFields++;
        }
      }
    }
    
    return Math.round((completedFields / totalFields) * 100);
  }

  // Finalize diagnosis process
  async finalizeDiagnosis(session) {
    try {
      const diagnosisData = {
        id: uuidv4(),
        patientId: session.patientId,
        veterinarianId: session.veterinarianId,
        soapData: session.soapData,
        completeness: this.calculateSOAPCompleteness(session.soapData),
        diagnosisDate: new Date(),
        sessionId: session.sessionId,
        status: 'draft'
      };
      
      // Save to database
      await this.saveDiagnosis(diagnosisData);
      
      // Generate SOAP summary
      const summary = await this.generateSOAPSummary(diagnosisData);
      
      return {
        diagnosisId: diagnosisData.id,
        summary,
        nextSteps: await this.generateNextSteps(diagnosisData),
        timestamp: new Date()
      };
    } catch (error) {
      console.error('Error finalizing diagnosis:', error);
      throw error;
    }
  }

  // Save diagnosis to database
  async saveDiagnosis(diagnosisData) {
    try {
      const diagnoses = JSON.parse(fs.readFileSync(this.diagnosesFile, 'utf8'));
      diagnoses.push(diagnosisData);
      fs.writeFileSync(this.diagnosesFile, JSON.stringify(diagnoses, null, 2));
      
      console.log(`Diagnosis saved: ${diagnosisData.id}`);
      return diagnosisData.id;
    } catch (error) {
      console.error('Error saving diagnosis:', error);
      throw error;
    }
  }

  // Generate SOAP summary
  async generateSOAPSummary(diagnosisData) {
    const soap = diagnosisData.soapData;
    
    const summary = {
      chiefComplaint: soap.subjective.chiefComplaint,
      primaryDiagnosis: soap.assessment.primaryDiagnosis,
      treatment: soap.plan.treatment,
      followUp: soap.plan.followUp,
      completeness: diagnosisData.completeness
    };
    
    return summary;
  }

  // Generate next steps
  async generateNextSteps(diagnosisData) {
    const steps = [];
    
    if (diagnosisData.completeness < 100) {
      steps.push({
        action: 'complete_soap',
        description: 'Complete missing SOAP components',
        priority: 'high'
      });
    }
    
    if (diagnosisData.soapData.plan.medications) {
      steps.push({
        action: 'prescribe_medications',
        description: 'Generate prescription for medications',
        priority: 'high'
      });
    }
    
    if (diagnosisData.soapData.plan.followUp) {
      steps.push({
        action: 'schedule_followup',
        description: 'Schedule follow-up appointment',
        priority: 'medium'
      });
    }
    
    steps.push({
      action: 'send_summary',
      description: 'Send SOAP summary to client',
      priority: 'medium'
    });
    
    return steps;
  }

  // Get diagnosis by ID
  async getDiagnosis(diagnosisId) {
    try {
      const diagnoses = JSON.parse(fs.readFileSync(this.diagnosesFile, 'utf8'));
      return diagnoses.find(d => d.id === diagnosisId);
    } catch (error) {
      console.error('Error getting diagnosis:', error);
      throw error;
    }
  }

  // Get all diagnoses
  async getAllDiagnoses() {
    try {
      const diagnoses = JSON.parse(fs.readFileSync(this.diagnosesFile, 'utf8'));
      return diagnoses;
    } catch (error) {
      console.error('Error getting diagnoses:', error);
      throw error;
    }
  }

  // Update diagnosis
  async updateDiagnosis(diagnosisId, updateData) {
    try {
      const diagnoses = JSON.parse(fs.readFileSync(this.diagnosesFile, 'utf8'));
      const diagnosisIndex = diagnoses.findIndex(d => d.id === diagnosisId);
      
      if (diagnosisIndex === -1) {
        throw new Error('Diagnosis not found');
      }
      
      diagnoses[diagnosisIndex] = { ...diagnoses[diagnosisIndex], ...updateData };
      fs.writeFileSync(this.diagnosesFile, JSON.stringify(diagnoses, null, 2));
      
      return diagnoses[diagnosisIndex];
    } catch (error) {
      console.error('Error updating diagnosis:', error);
      throw error;
    }
  }

  // Generate SOAP note text
  async generateSOAPNote(diagnosisData) {
    const soap = diagnosisData.soapData;
    
    const soapNote = `
SOAP NOTE - ${diagnosisData.diagnosisDate.toLocaleDateString()}

SUBJECTIVE:
Chief Complaint: ${soap.subjective.chiefComplaint}
History: ${soap.subjective.history}
Symptoms: ${soap.subjective.symptoms}
Duration: ${soap.subjective.duration}
Severity: ${soap.subjective.severity}
Owner Observations: ${soap.subjective.ownerObservations}

OBJECTIVE:
Vital Signs: ${soap.objective.vitalSigns}
Physical Exam: ${soap.objective.physicalExam}
Body Condition: ${soap.objective.bodyCondition}
Behavior: ${soap.objective.behavior}
Mobility: ${soap.objective.mobility}
Skin Condition: ${soap.objective.skinCondition}
Eyes: ${soap.objective.eyes}
Ears: ${soap.objective.ears}
Mouth: ${soap.objective.mouth}
Abdomen: ${soap.objective.abdomen}
Lymph Nodes: ${soap.objective.lymphNodes}

ASSESSMENT:
Primary Diagnosis: ${soap.assessment.primaryDiagnosis}
Differential Diagnosis: ${soap.assessment.differentialDiagnosis}
Severity: ${soap.assessment.severity}
Prognosis: ${soap.assessment.prognosis}
Risk Factors: ${soap.assessment.riskFactors}

PLAN:
Treatment: ${soap.plan.treatment}
Medications: ${soap.plan.medications}
Procedures: ${soap.plan.procedures}
Follow-up: ${soap.plan.followUp}
Client Education: ${soap.plan.clientEducation}
Restrictions: ${soap.plan.restrictions}
Emergency Instructions: ${soap.plan.emergencyInstructions}
    `.trim();
    
    return soapNote;
  }
}

module.exports = new DiagnosisService();
