/**
 * Template Manager Component
 * Loads an XML paystub template, validates it, assembles the computed data model
 * (earnings, taxes, deductions, net + YTD) via buildPaystubModel, and renders it.
 *
 * Templates live under public/configs/ and are described by template-configs.json.
 * The data the renderer binds to is the PaystubModel produced by buildPaystubModel —
 * there is no hardcoded data here.
 */

import React, { useState, useEffect } from 'react';
import { PayStubDetails, PaystubModel } from 'assets/data/pay-stub-details';
import { PaystubRenderer } from './PaystubRenderer';
import { loadPaystubConfig, validateConfig } from './paystub/xmlParser';
import { buildPaystubModel } from '../utils/buildPaystubModel';
import type { PaystubConfig } from './paystub/types';

interface TemplateManagerProps {
  id: number;
  configPath: string;
  store: PayStubDetails;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ configPath, store }) => {
  const [config, setConfig] = useState<PaystubConfig | null>(null);
  const [data, setData] = useState<PaystubModel | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Build the computed data model from the store (taxes, earnings, deductions, net + YTD).
  useEffect(() => {
    setData(buildPaystubModel(store));
  }, [store]);

  // Load and validate the XML configuration for the selected template.
  useEffect(() => {
    const loadConfigFromFile = async () => {
      try {
        setLoading(true);
        setError(null);
        const parsedConfig = await loadPaystubConfig(configPath);
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

    loadConfigFromFile();
  }, [configPath]);

  return (
    <div className="">
      {error && (
        <div style={{ maxWidth: '1200px', margin: '0 auto 20px', padding: '15px', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #fecaca' }}>
          <strong>Error:</strong> {error}
        </div>
      )}
      {config && data && !loading && (<div><PaystubRenderer config={config} data={data} /></div>)}
    </div>
  );
};

export default TemplateManager;
