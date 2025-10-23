import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const soapData = await request.json();
    
    // Validate required SOAP components
    const requiredComponents = {
      subjective: ['chiefComplaint', 'symptoms'],
      objective: ['vitalSigns', 'physicalExam'],
      assessment: ['primaryDiagnosis'],
      plan: ['treatment']
    };
    
    const missingComponents = [];
    for (const [section, fields] of Object.entries(requiredComponents)) {
      for (const field of fields) {
        if (!soapData[section]?.[field]) {
          missingComponents.push(`${section}.${field}`);
        }
      }
    }
    
    if (missingComponents.length > 0) {
      return NextResponse.json(
        { error: `Missing required SOAP components: ${missingComponents.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Process SOAP data
    const processedData = {
      id: `diagnosis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...soapData,
      createdAt: new Date().toISOString(),
      status: 'draft',
      completeness: calculateSOAPCompleteness(soapData)
    };
    
    // Generate SOAP note text
    const soapNote = generateSOAPNote(processedData);
    
    // In a real application, you would save this to a database
    console.log('Diagnosis data:', processedData);
    
    return NextResponse.json({
      success: true,
      diagnosisId: processedData.id,
      message: 'SOAP note created successfully',
      data: processedData,
      soapNote
    });
    
  } catch (error) {
    console.error('Error processing diagnosis:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateSOAPCompleteness(soapData: any): number {
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
      if (soapData[section]?.[field]) {
        completedFields++;
      }
    }
  }
  
  return Math.round((completedFields / totalFields) * 100);
}

function generateSOAPNote(diagnosisData: any) {
  const soap = diagnosisData;
  
  return `
SOAP NOTE - ${new Date().toLocaleDateString()}

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
}
