'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Stethoscope, 
  Pill, 
  Calendar,
  User,
  Heart
} from 'lucide-react';
import VoiceIntegration from '../voice/VoiceIntegration';

interface SOAPData {
  subjective: {
    chiefComplaint: string;
    history: string;
    symptoms: string;
    duration: string;
    severity: string;
    triggers: string;
    ownerObservations: string;
  };
  objective: {
    vitalSigns: string;
    physicalExam: string;
    bodyCondition: string;
    behavior: string;
    mobility: string;
    skinCondition: string;
    eyes: string;
    ears: string;
    mouth: string;
    abdomen: string;
    lymphNodes: string;
  };
  assessment: {
    primaryDiagnosis: string;
    differentialDiagnosis: string;
    severity: string;
    prognosis: string;
    riskFactors: string;
  };
  plan: {
    treatment: string;
    medications: string;
    procedures: string;
    followUp: string;
    clientEducation: string;
    restrictions: string;
    emergencyInstructions: string;
  };
}

interface DiagnosisProgress {
  currentSection: string;
  completedSections: string[];
  missingSections: string[];
  completeness: number;
}

export default function DiagnosisDocumentation() {
  const [soapData, setSOAPData] = useState<SOAPData>({
    subjective: {
      chiefComplaint: '',
      history: '',
      symptoms: '',
      duration: '',
      severity: '',
      triggers: '',
      ownerObservations: ''
    },
    objective: {
      vitalSigns: '',
      physicalExam: '',
      bodyCondition: '',
      behavior: '',
      mobility: '',
      skinCondition: '',
      eyes: '',
      ears: '',
      mouth: '',
      abdomen: '',
      lymphNodes: ''
    },
    assessment: {
      primaryDiagnosis: '',
      differentialDiagnosis: '',
      severity: '',
      prognosis: '',
      riskFactors: ''
    },
    plan: {
      treatment: '',
      medications: '',
      procedures: '',
      followUp: '',
      clientEducation: '',
      restrictions: '',
      emergencyInstructions: ''
    }
  });

  const [progress, setProgress] = useState<DiagnosisProgress>({
    currentSection: 'subjective',
    completedSections: [],
    missingSections: [],
    completeness: 0
  });

  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [activeTab, setActiveTab] = useState('subjective');

  const sections = [
    { id: 'subjective', title: 'Subjective (S)', icon: User, color: 'bg-blue-500' },
    { id: 'objective', title: 'Objective (O)', icon: Stethoscope, color: 'bg-green-500' },
    { id: 'assessment', title: 'Assessment (A)', icon: FileText, color: 'bg-yellow-500' },
    { id: 'plan', title: 'Plan (P)', icon: Pill, color: 'bg-purple-500' }
  ];

  useEffect(() => {
    calculateProgress();
  }, [soapData]);

  const calculateProgress = () => {
    const allSections = sections.map(section => section.id);
    const completedSections = allSections.filter(section => {
      const sectionData = soapData[section as keyof SOAPData];
      const requiredFields = getRequiredFields(section);
      return requiredFields.every(field => sectionData[field as keyof typeof sectionData]);
    });
    const missingSections = allSections.filter(section => !completedSections.includes(section));
    const completeness = Math.round((completedSections.length / allSections.length) * 100);

    setProgress({
      currentSection: missingSections[0] || 'completed',
      completedSections,
      missingSections,
      completeness
    });
  };

  const getRequiredFields = (section: string) => {
    const requiredFields = {
      subjective: ['chiefComplaint', 'symptoms'],
      objective: ['vitalSigns', 'physicalExam'],
      assessment: ['primaryDiagnosis'],
      plan: ['treatment']
    };
    return requiredFields[section as keyof typeof requiredFields] || [];
  };

  const handleInputChange = (section: keyof SOAPData, field: string, value: string) => {
    setSOAPData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleVoiceTranscript = (transcript: string) => {
    setVoiceTranscript(transcript);
    // Process voice transcript to extract SOAP components
    processVoiceTranscript(transcript);
  };

  const processVoiceTranscript = (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase();
    
    // Extract subjective information
    if (lowerTranscript.includes('chief complaint') || lowerTranscript.includes('main concern')) {
      const match = transcript.match(/(?:chief complaint|main concern|primary issue)\s*(?:is|:)?\s*([^.]+)/i);
      if (match) {
        handleInputChange('subjective', 'chiefComplaint', match[1].trim());
      }
    }
    
    if (lowerTranscript.includes('symptoms') || lowerTranscript.includes('signs')) {
      const match = transcript.match(/(?:symptoms|signs|problems)\s*(?:are|include)\s*([^.]+)/i);
      if (match) {
        handleInputChange('subjective', 'symptoms', match[1].trim());
      }
    }
    
    // Extract objective information
    if (lowerTranscript.includes('vital signs') || lowerTranscript.includes('temperature')) {
      const match = transcript.match(/(?:vital signs|temperature|heart rate|respiratory rate)\s*(?:are|:)?\s*([^.]+)/i);
      if (match) {
        handleInputChange('objective', 'vitalSigns', match[1].trim());
      }
    }
    
    if (lowerTranscript.includes('physical exam') || lowerTranscript.includes('examination')) {
      const match = transcript.match(/(?:physical exam|examination|findings)\s*(?:shows|reveals|indicates)\s*([^.]+)/i);
      if (match) {
        handleInputChange('objective', 'physicalExam', match[1].trim());
      }
    }
    
    // Extract assessment information
    if (lowerTranscript.includes('diagnosis') || lowerTranscript.includes('condition')) {
      const match = transcript.match(/(?:primary diagnosis|main diagnosis|condition)\s*(?:is|:)?\s*([^.]+)/i);
      if (match) {
        handleInputChange('assessment', 'primaryDiagnosis', match[1].trim());
      }
    }
    
    // Extract plan information
    if (lowerTranscript.includes('treatment') || lowerTranscript.includes('therapy')) {
      const match = transcript.match(/(?:treatment|therapy|management)\s*(?:plan|includes|is)\s*([^.]+)/i);
      if (match) {
        handleInputChange('plan', 'treatment', match[1].trim());
      }
    }
    
    if (lowerTranscript.includes('medications') || lowerTranscript.includes('drugs')) {
      const match = transcript.match(/(?:medications|drugs|prescriptions)\s*(?:are|include)\s*([^.]+)/i);
      if (match) {
        handleInputChange('plan', 'medications', match[1].trim());
      }
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    try {
      const response = await fetch('/api/diagnosis', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(soapData),
      });
      
      if (response.ok) {
        setSubmitStatus('success');
        // Reset form or redirect
      } else {
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Error submitting diagnosis:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const generateSOAPNote = () => {
    const soapNote = `
SOAP NOTE - ${new Date().toLocaleDateString()}

SUBJECTIVE:
Chief Complaint: ${soapData.subjective.chiefComplaint}
History: ${soapData.subjective.history}
Symptoms: ${soapData.subjective.symptoms}
Duration: ${soapData.subjective.duration}
Severity: ${soapData.subjective.severity}
Owner Observations: ${soapData.subjective.ownerObservations}

OBJECTIVE:
Vital Signs: ${soapData.objective.vitalSigns}
Physical Exam: ${soapData.objective.physicalExam}
Body Condition: ${soapData.objective.bodyCondition}
Behavior: ${soapData.objective.behavior}
Mobility: ${soapData.objective.mobility}
Skin Condition: ${soapData.objective.skinCondition}
Eyes: ${soapData.objective.eyes}
Ears: ${soapData.objective.ears}
Mouth: ${soapData.objective.mouth}
Abdomen: ${soapData.objective.abdomen}
Lymph Nodes: ${soapData.objective.lymphNodes}

ASSESSMENT:
Primary Diagnosis: ${soapData.assessment.primaryDiagnosis}
Differential Diagnosis: ${soapData.assessment.differentialDiagnosis}
Severity: ${soapData.assessment.severity}
Prognosis: ${soapData.assessment.prognosis}
Risk Factors: ${soapData.assessment.riskFactors}

PLAN:
Treatment: ${soapData.plan.treatment}
Medications: ${soapData.plan.medications}
Procedures: ${soapData.plan.procedures}
Follow-up: ${soapData.plan.followUp}
Client Education: ${soapData.plan.clientEducation}
Restrictions: ${soapData.plan.restrictions}
Emergency Instructions: ${soapData.plan.emergencyInstructions}
    `.trim();
    
    return soapNote;
  };

  const getSectionColor = (section: string) => {
    const sectionData = sections.find(s => s.id === section);
    return sectionData?.color || 'bg-gray-500';
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Diagnosis Documentation</h1>
        <p className="text-gray-600">Create SOAP notes using voice input or manual entry</p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">SOAP Progress</span>
              <span className="text-sm text-gray-500">{progress.completeness}% Complete</span>
            </div>
            <Progress value={progress.completeness} className="w-full" />
            <div className="flex justify-between text-xs text-gray-500">
              {sections.map((section) => (
                <div key={section.id} className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full ${
                    progress.completedSections.includes(section.id) ? 'bg-green-500' : 
                    progress.missingSections.includes(section.id) ? 'bg-yellow-500' : 'bg-gray-300'
                  }`} />
                  <span>{section.title}</span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Voice Integration */}
      <VoiceIntegration
        sessionType="diagnosis"
        onTranscriptUpdate={handleVoiceTranscript}
        onSessionComplete={(data) => {
          console.log('Voice session completed:', data);
        }}
      />

      {/* SOAP Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          {sections.map((section) => (
            <TabsTrigger key={section.id} value={section.id} className="flex items-center gap-2">
              <section.icon className="h-4 w-4" />
              {section.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* Subjective Tab */}
        <TabsContent value="subjective">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Subjective (S) - Patient's Symptoms and Concerns
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
                <Textarea
                  id="chiefComplaint"
                  value={soapData.subjective.chiefComplaint}
                  onChange={(e) => handleInputChange('subjective', 'chiefComplaint', e.target.value)}
                  placeholder="What is the main concern or reason for the visit?"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="history">History</Label>
                <Textarea
                  id="history"
                  value={soapData.subjective.history}
                  onChange={(e) => handleInputChange('subjective', 'history', e.target.value)}
                  placeholder="Background history and story"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="symptoms">Symptoms *</Label>
                <Textarea
                  id="symptoms"
                  value={soapData.subjective.symptoms}
                  onChange={(e) => handleInputChange('subjective', 'symptoms', e.target.value)}
                  placeholder="What specific symptoms has the pet been showing?"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration">Duration</Label>
                  <Input
                    id="duration"
                    value={soapData.subjective.duration}
                    onChange={(e) => handleInputChange('subjective', 'duration', e.target.value)}
                    placeholder="How long have symptoms been present?"
                  />
                </div>
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Input
                    id="severity"
                    value={soapData.subjective.severity}
                    onChange={(e) => handleInputChange('subjective', 'severity', e.target.value)}
                    placeholder="How severe are the symptoms?"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="triggers">Triggers</Label>
                <Textarea
                  id="triggers"
                  value={soapData.subjective.triggers}
                  onChange={(e) => handleInputChange('subjective', 'triggers', e.target.value)}
                  placeholder="What triggers or makes the condition worse?"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="ownerObservations">Owner Observations</Label>
                <Textarea
                  id="ownerObservations"
                  value={soapData.subjective.ownerObservations}
                  onChange={(e) => handleInputChange('subjective', 'ownerObservations', e.target.value)}
                  placeholder="What has the owner observed or noticed?"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Objective Tab */}
        <TabsContent value="objective">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Objective (O) - Physical Examination Findings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="vitalSigns">Vital Signs *</Label>
                <Textarea
                  id="vitalSigns"
                  value={soapData.objective.vitalSigns}
                  onChange={(e) => handleInputChange('objective', 'vitalSigns', e.target.value)}
                  placeholder="Temperature, heart rate, respiratory rate, etc."
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="physicalExam">Physical Examination *</Label>
                <Textarea
                  id="physicalExam"
                  value={soapData.objective.physicalExam}
                  onChange={(e) => handleInputChange('objective', 'physicalExam', e.target.value)}
                  placeholder="Detailed physical examination findings"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bodyCondition">Body Condition</Label>
                  <Input
                    id="bodyCondition"
                    value={soapData.objective.bodyCondition}
                    onChange={(e) => handleInputChange('objective', 'bodyCondition', e.target.value)}
                    placeholder="Body condition score, weight, appearance"
                  />
                </div>
                <div>
                  <Label htmlFor="behavior">Behavior</Label>
                  <Input
                    id="behavior"
                    value={soapData.objective.behavior}
                    onChange={(e) => handleInputChange('objective', 'behavior', e.target.value)}
                    placeholder="Behavior, demeanor, attitude"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="mobility">Mobility</Label>
                  <Input
                    id="mobility"
                    value={soapData.objective.mobility}
                    onChange={(e) => handleInputChange('objective', 'mobility', e.target.value)}
                    placeholder="Gait, movement, lameness"
                  />
                </div>
                <div>
                  <Label htmlFor="skinCondition">Skin Condition</Label>
                  <Input
                    id="skinCondition"
                    value={soapData.objective.skinCondition}
                    onChange={(e) => handleInputChange('objective', 'skinCondition', e.target.value)}
                    placeholder="Skin, coat, fur condition"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="eyes">Eyes</Label>
                  <Input
                    id="eyes"
                    value={soapData.objective.eyes}
                    onChange={(e) => handleInputChange('objective', 'eyes', e.target.value)}
                    placeholder="Eye examination findings"
                  />
                </div>
                <div>
                  <Label htmlFor="ears">Ears</Label>
                  <Input
                    id="ears"
                    value={soapData.objective.ears}
                    onChange={(e) => handleInputChange('objective', 'ears', e.target.value)}
                    placeholder="Ear examination findings"
                  />
                </div>
                <div>
                  <Label htmlFor="mouth">Mouth</Label>
                  <Input
                    id="mouth"
                    value={soapData.objective.mouth}
                    onChange={(e) => handleInputChange('objective', 'mouth', e.target.value)}
                    placeholder="Oral examination findings"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="abdomen">Abdomen</Label>
                  <Input
                    id="abdomen"
                    value={soapData.objective.abdomen}
                    onChange={(e) => handleInputChange('objective', 'abdomen', e.target.value)}
                    placeholder="Abdominal examination findings"
                  />
                </div>
                <div>
                  <Label htmlFor="lymphNodes">Lymph Nodes</Label>
                  <Input
                    id="lymphNodes"
                    value={soapData.objective.lymphNodes}
                    onChange={(e) => handleInputChange('objective', 'lymphNodes', e.target.value)}
                    placeholder="Lymph node examination findings"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Assessment Tab */}
        <TabsContent value="assessment">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Assessment (A) - Diagnosis and Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="primaryDiagnosis">Primary Diagnosis *</Label>
                <Textarea
                  id="primaryDiagnosis"
                  value={soapData.assessment.primaryDiagnosis}
                  onChange={(e) => handleInputChange('assessment', 'primaryDiagnosis', e.target.value)}
                  placeholder="What is the primary diagnosis or condition?"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="differentialDiagnosis">Differential Diagnosis</Label>
                <Textarea
                  id="differentialDiagnosis"
                  value={soapData.assessment.differentialDiagnosis}
                  onChange={(e) => handleInputChange('assessment', 'differentialDiagnosis', e.target.value)}
                  placeholder="Other conditions to consider or rule out"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="severity">Severity</Label>
                  <Input
                    id="severity"
                    value={soapData.assessment.severity}
                    onChange={(e) => handleInputChange('assessment', 'severity', e.target.value)}
                    placeholder="Severity or stage of condition"
                  />
                </div>
                <div>
                  <Label htmlFor="prognosis">Prognosis</Label>
                  <Input
                    id="prognosis"
                    value={soapData.assessment.prognosis}
                    onChange={(e) => handleInputChange('assessment', 'prognosis', e.target.value)}
                    placeholder="Expected outcome or prognosis"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="riskFactors">Risk Factors</Label>
                <Textarea
                  id="riskFactors"
                  value={soapData.assessment.riskFactors}
                  onChange={(e) => handleInputChange('assessment', 'riskFactors', e.target.value)}
                  placeholder="Risk factors, complications, or concerns"
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Plan Tab */}
        <TabsContent value="plan">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pill className="h-5 w-5" />
                Plan (P) - Treatment and Follow-up
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="treatment">Treatment Plan *</Label>
                <Textarea
                  id="treatment"
                  value={soapData.plan.treatment}
                  onChange={(e) => handleInputChange('plan', 'treatment', e.target.value)}
                  placeholder="What is the treatment plan?"
                  rows={3}
                />
              </div>
              <div>
                <Label htmlFor="medications">Medications</Label>
                <Textarea
                  id="medications"
                  value={soapData.plan.medications}
                  onChange={(e) => handleInputChange('plan', 'medications', e.target.value)}
                  placeholder="Medications, dosages, and administration instructions"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="procedures">Procedures</Label>
                <Textarea
                  id="procedures"
                  value={soapData.plan.procedures}
                  onChange={(e) => handleInputChange('plan', 'procedures', e.target.value)}
                  placeholder="Procedures, tests, or interventions"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="followUp">Follow-up</Label>
                <Textarea
                  id="followUp"
                  value={soapData.plan.followUp}
                  onChange={(e) => handleInputChange('plan', 'followUp', e.target.value)}
                  placeholder="Follow-up instructions and next visit"
                  rows={2}
                />
              </div>
              <div>
                <Label htmlFor="clientEducation">Client Education</Label>
                <Textarea
                  id="clientEducation"
                  value={soapData.plan.clientEducation}
                  onChange={(e) => handleInputChange('plan', 'clientEducation', e.target.value)}
                  placeholder="Education and instructions for the client"
                  rows={2}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="restrictions">Restrictions</Label>
                  <Textarea
                    id="restrictions"
                    value={soapData.plan.restrictions}
                    onChange={(e) => handleInputChange('plan', 'restrictions', e.target.value)}
                    placeholder="Activity restrictions or limitations"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyInstructions">Emergency Instructions</Label>
                  <Textarea
                    id="emergencyInstructions"
                    value={soapData.plan.emergencyInstructions}
                    onChange={(e) => handleInputChange('plan', 'emergencyInstructions', e.target.value)}
                    placeholder="When to call or seek emergency care"
                    rows={2}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Submit Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Ready to Submit SOAP Note?</h3>
              <p className="text-sm text-gray-600">
                {progress.completeness}% complete - {progress.missingSections.length} sections remaining
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const soapNote = generateSOAPNote();
                  navigator.clipboard.writeText(soapNote);
                }}
                variant="outline"
                className="min-w-[120px]"
              >
                <FileText className="h-4 w-4 mr-2" />
                Copy SOAP
              </Button>
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
              <span className="text-green-700">SOAP note submitted successfully!</span>
            </div>
          )}
          
          {submitStatus === 'error' && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <span className="text-red-700">Error submitting SOAP note. Please try again.</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
