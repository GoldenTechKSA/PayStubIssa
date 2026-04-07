/**
 * Template Manager Component
 * Main component with print-ready paystub display
 * This is the file that handles loading templates, selecting templates, and rendering the paystub
 * It also includes print-specific styles to ensure the paystub prints correctly
 * 
 * Features: Loads available templates from the public folder, these templates should match the TemplateConfiguration interface
 * and is one to one with the number of templates images in the public/templates/thumbnails folder
 * it will loads the selected template configuration and validate it
 * and render the paystub using the TemplateRenderer component.
 */

import React, { useState, useEffect } from 'react';
import { PayStubDetails, YearToDateTotals, FlatPayStubData } from 'assets/data/pay-stub-details';

import { PaystubRenderer } from './PaystubRenderer';
import { loadPaystubConfig, processDynamicValues, validateConfig } from './paystub/xmlParser';
import type { PaystubConfig } from './paystub/types';

interface TemplateManagerProps {
  id: number;
  configPath: string;
  store: PayStubDetails;
}

const yearToDate: YearToDateTotals = { 
    grossPay: 118750.00,
    netPay: 67303.47,
    federalTax: 17812.60,
    stateTax: 5937.50,
    localTax: 2375.00,
    sdi: 1187.50,
    socialSecurity: 7362.63,
    medicare: 1721.80,
    additionalMedicare: 0.00,
    totalTaxes: 35221.53,
    retirement401k: 7125.00,
    healthInsurance: 3000.00,
    dentalInsurance: 500.00,
    visionInsurance: 300.00,
    hsa: 2000.00,
    fsa: 1000.00,
    lifeInsurance: 200.00,
    stdInsurance: 300.00,
    ltdInsurance: 500.00,
    unionDues: 900.00,
    parking: 400.00,
    totalDeductions: 16225.00,
    effectiveTaxRate: 29.65,
    deductionRate: 13.67,
    netPayRate: 56.68
};

export const TemplateManager: React.FC<TemplateManagerProps> = ({id, configPath, store}) => {
  const [config, setConfig] = useState<PaystubConfig | null>(null);
  const [data, setData] = useState<FlatPayStubData>({} as FlatPayStubData);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const paystubConfigPath = configPath;

  // Load XML configuration from file using fetch
  useEffect(() => {
    const loadConfigFromFile = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetch(paystubConfigPath);

        if (!response.ok) {
          throw new Error(`Failed to load XML file: ${response.statusText}`);
        }

        const parsedConfig = await loadPaystubConfig(paystubConfigPath);
        const validation = validateConfig(parsedConfig);
        if (!validation.valid) {
          setError(`Configuration errors: ${validation.errors.join(', ')}`);
          return;
        }
        setConfig(parsedConfig);
      } catch (err) {
        setError(`Error loading configuration: ${err instanceof Error ? err.message : 'Unknown error'}`);
        console.error('Failed to load XML:', err);
      } finally {
        setLoading(false);
      }
    };

    const loadDataFromStore = async () => {
      setData({...store,...yearToDate});
    };

    loadDataFromStore();
    loadConfigFromFile();
  }, []);

  console.log('Loaded Data:', data);
  return (
    <div className="">
      {error && (<div style={{maxWidth: '1200px',margin: '0 auto 20px',padding: '15px',backgroundColor: '#fee2e2',color: '#991b1b',borderRadius: '8px',border: '1px solid #fecaca'}}><strong>Error:</strong> {error}</div>)}
      {config && !loading && (<div> <PaystubRenderer config={config} data={data}/></div>)}
    </div>
  );
};

export default TemplateManager;