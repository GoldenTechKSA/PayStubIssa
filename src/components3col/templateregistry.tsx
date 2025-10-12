import React, { useState, useEffect } from 'react';
import { FullTemplate, PayStubDetails } from './types';
import { loadAllTemplates } from '../utils/templateloader';
import TemplateSelector from './templateselector';
import Advanced3ColumnTemplate from './templates/advanced3columntemplate';

// Mock Redux store data - in a real app, this would come from Redux
const createMockStore = (): PayStubDetails => ({
  companyInfo: {
    companyName: "Acme Corporation",
    companyAddress1: "123 Business Avenue",
    companyAddress2: "",
    companyCity: "San Francisco",
    companyState: "CA",
    companyZipCode: "94107",
    companyPhone: "(555) 123-4567",
    companyEmail: "info@acmecorp.com",
    companyEIN: "12-3456789"
  },
  employeeInfo: {
    employeeFirstName: "John",
    employeeMiddleInitial: "M",
    employeeLastName: "Doe",
    employeeAddress1: "456 Residential Street",
    employeeAddress2: "Apt 789",
    employeeCity: "San Francisco",
    employeeState: "CA",
    employeeZipCode: "94108",
    employeePhone: "(555) 987-6543",
    employeeEmail: "john.doe@email.com",
    employeeSSN: "123-45-6789",
    employeeID: "EMP-12345",
    employeeMarriedStatus: "Single"
  },
  incomeDetails: {
    annualSalary: 85000,
    wageType: "Hourly",
    hourlyRate: 45.50,
    hoursWorked: 80,
    overtimeRate: 68.25,
    overtimeHours: 6,
    bonusAmount: 1000,
    deduction401k: 364,
    medicalDeduction: 225.50,
    dentalDeduction: 28.75,
    visionDeduction: 15.25,
    otherDeduction: 50,
    periodStartDate: "2023-05-01",
    periodEndDate: "2023-05-15",
    periodPayDate: "2023-05-20",
    periodType: "Bi-weekly"
  },
  generalInfo: {
    employmentType: "Full-time",
    paymentMethod: "Direct Deposit",
    paymentFrequency: "Bi-weekly",
    payStubNumber: "PS-2023-05-12345",
    payStubCount: "10",
    checkNumber: "N/A",
    extraNotes: "Thank you for your hard work!"
  }
});

const TemplateRegistry: React.FC = () => {
  const [templates, setTemplates] = useState<FullTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<FullTemplate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  
  // In a real app, this would come from Redux useSelector
  const mockStore: PayStubDetails = createMockStore();
  const canPrintStub = true;

  useEffect(() => {
    const loadTemplates = async () => {
      const loadedTemplates = await loadAllTemplates();
      setTemplates(loadedTemplates);
      if (loadedTemplates.length > 0) {
        setSelectedTemplate(loadedTemplates[0]);
      }
      setLoading(false);
    };
    
    loadTemplates();
  }, []);
  
  if (loading) {
    return <div className="text-center p-4">Loading templates...</div>;
  }
  
  return (
    <div className="template-registry max-w-7xl mx-auto p-4">
      {/* TODO: this is not needed in the final implmentation keep here for now, but commented out 
      MAYBE IN THE FUTURE WHEN WE ENABLE THE CONCEPT OF SELECTING A NEW TEMPLATE AFTER THE USER GET
      HERE WE CAN ENABLE SOME SORT OF TEMPLATE SELECTION CONTROL SO THE USER CAN PREVIEW DIFFERENT TEMPLATES*/}
      {/* <TemplateSelector 
        templates={templates} 
        onSelect={setSelectedTemplate}
        selectedTemplateId={selectedTemplate?.template_id || null}
      /> */}
      
      <div className="mt-8">
        {/* <h2 className="text-lg font-bold mb-4 text-center">Preview</h2> */}
        {selectedTemplate && ( <Advanced3ColumnTemplate template={selectedTemplate} store={mockStore} styling={selectedTemplate.styling} canPrintStub={canPrintStub} /> )}
      </div>
    </div>
  );
};

export default TemplateRegistry;