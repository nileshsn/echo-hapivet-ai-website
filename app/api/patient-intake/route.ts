import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const patientData = await request.json();
    
    // Validate required fields
    const requiredFields = ['firstName', 'lastName', 'phone', 'email', 'symptoms'];
    const missingFields = requiredFields.filter(field => !patientData[field]);
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Process patient intake data
    const processedData = {
      id: `patient_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...patientData,
      createdAt: new Date().toISOString(),
      status: 'pending_review',
      completeness: calculateCompleteness(patientData)
    };
    
    // In a real application, you would save this to a database
    console.log('Patient intake data:', processedData);
    
    // Send confirmation email/SMS (simulated)
    await sendConfirmation(processedData);
    
    return NextResponse.json({
      success: true,
      patientId: processedData.id,
      message: 'Patient intake submitted successfully',
      data: processedData
    });
    
  } catch (error) {
    console.error('Error processing patient intake:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function calculateCompleteness(patientData: any): number {
  const requiredFields = [
    'firstName', 'lastName', 'phone', 'email', 'petName', 'petType', 'symptoms'
  ];
  
  const completedFields = requiredFields.filter(field => patientData[field]);
  return Math.round((completedFields.length / requiredFields.length) * 100);
}

async function sendConfirmation(patientData: any) {
  // Simulate sending confirmation email/SMS
  console.log(`Sending confirmation to ${patientData.email} and ${patientData.phone}`);
  
  // In a real application, you would:
  // 1. Send email using a service like SendGrid, AWS SES, etc.
  // 2. Send SMS using Twilio
  // 3. Store the patient data in a database
  
  return Promise.resolve();
}
