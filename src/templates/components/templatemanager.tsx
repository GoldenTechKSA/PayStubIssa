/**
 * Template Manager Component
 * Loads an XML paystub template, validates it, assembles the computed data model
 * (earnings, taxes, deductions, net + YTD) via buildPaystubModel, and renders it.
 *
 * Templates live under public/configs/ and are described by template-configs.json.
 * The data the renderer binds to is the PaystubModel produced by buildPaystubModel —
 * there is no hardcoded data here.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { PayStubDetails } from 'assets/data/pay-stub-details';
import { PaystubRenderer } from './PaystubRenderer';
import { loadPaystubConfig, validateConfig } from './paystub/xmlParser';
import { buildPaystubModels } from '../utils/buildPaystubModel';
import type { PaystubConfig } from './paystub/types';

interface TemplateManagerProps {
  id: number;
  configPath: string;
  store: PayStubDetails;
  /**
   * Cap how many stubs to render. The gallery preview passes 1 so that picking a template
   * doesn't render a 12-page document; the Review step omits it and renders the whole run.
   */
  maxStubs?: number;
}

export const TemplateManager: React.FC<TemplateManagerProps> = ({ configPath, store, maxStubs }) => {
  const [config, setConfig] = useState<PaystubConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // One computed model per purchased stub (taxes, earnings, deductions, net + YTD).
  // The XML config is fetched once below and reused for every page in the run.
  const models = useMemo(() => {
    const all = buildPaystubModels(store);
    return maxStubs && maxStubs > 0 ? all.slice(0, maxStubs) : all;
  }, [store, maxStubs]);

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
      {config && !loading && models.map((model) => (
        // Each stub is its own page: `paystub-page` is what the printer and the PDF exporter
        // break on (see wizard/print.css and pdf/pdf-button-comp).
        <div className="paystub-page" key={model.stubIndex}>
          <PaystubRenderer config={config} data={model} />
        </div>
      ))}
    </div>
  );
};

export default TemplateManager;
