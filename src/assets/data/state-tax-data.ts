import { StateTaxInfo, TaxRates } from "../../types/tax-rate-types";

// 2024 Tax Year Data
const FEDERAL_TAX_RATES: TaxRates['federalIncomeTax'] = {
  brackets: [
    { min: 0, max: 11000, rate: 0.10 },
    { min: 11000, max: 44725, rate: 0.12 },
    { min: 44725, max: 95375, rate: 0.22 },
    { min: 95375, max: 182050, rate: 0.24 },
    { min: 182050, max: 231250, rate: 0.32 },
    { min: 231250, max: 578125, rate: 0.35 },
    { min: 578125, max: null, rate: 0.37 }
  ],
  standardDeduction: {
    single: 13850,
    marriedFilingJointly: 27700,
    marriedFilingSeparately: 13850,
    headOfHousehold: 20800
  }
};

const SOCIAL_SECURITY_TAX = {
  rate: 0.062, // 6.2%
  wageBase: 160200 // 2024 wage base
};

const MEDICARE_TAX = {
  rate: 0.0145, // 1.45%
  additionalRate: 0.009, // 0.9% additional
  additionalThreshold: {
    single: 200000,
    marriedFilingJointly: 250000,
    marriedFilingSeparately: 125000
  }
};

export const STATE_TAX_DATA: Record<string, StateTaxInfo> = {
  AL: {
    stateName: 'Alabama',
    stateCode: 'AL',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 500, rate: 0.02 },
          { min: 500, max: 3000, rate: 0.04 },
          { min: 3000, max: null, rate: 0.05 }
        ],
        standardDeduction: {
          single: 2500,
          marriedFilingJointly: 7500,
          marriedFilingSeparately: 3750,
          headOfHousehold: 2500
        }
      }
    }
  },
  
  AK: {
    stateName: 'Alaska',
    stateCode: 'AK',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: false
      }
    }
  },
  
  AZ: {
    stateName: 'Arizona',
    stateCode: 'AZ',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.025 // 2.5% flat rate as of 2023
      }
    }
  },
  
  AR: {
    stateName: 'Arkansas',
    stateCode: 'AR',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 4300, rate: 0.02 },
          { min: 4300, max: 8500, rate: 0.04 },
          { min: 8500, max: 12800, rate: 0.059 },
          { min: 12800, max: null, rate: 0.065 }
        ],
        standardDeduction: {
          single: 2340,
          marriedFilingJointly: 4680,
          marriedFilingSeparately: 2340,
          headOfHousehold: 3490
        }
      }
    }
  },
  
  CA: {
    stateName: 'California',
    stateCode: 'CA',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 10099, rate: 0.01 },
          { min: 10099, max: 23942, rate: 0.02 },
          { min: 23942, max: 37788, rate: 0.04 },
          { min: 37788, max: 52455, rate: 0.06 },
          { min: 52455, max: 66295, rate: 0.08 },
          { min: 66295, max: 338639, rate: 0.093 },
          { min: 338639, max: 406364, rate: 0.103 },
          { min: 406364, max: 677278, rate: 0.113 },
          { min: 677278, max: null, rate: 0.123 }
        ],
        standardDeduction: {
          single: 5202,
          marriedFilingJointly: 10404,
          marriedFilingSeparately: 5202,
          headOfHousehold: 10404
        }
      }
    }
  },
  
  CO: {
    stateName: 'Colorado',
    stateCode: 'CO',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.044 // 4.4% flat rate
      }
    }
  },
  
  CT: {
    stateName: 'Connecticut',
    stateCode: 'CT',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 10000, rate: 0.03 },
          { min: 10000, max: 50000, rate: 0.05 },
          { min: 50000, max: 100000, rate: 0.055 },
          { min: 100000, max: 200000, rate: 0.06 },
          { min: 200000, max: 250000, rate: 0.065 },
          { min: 250000, max: null, rate: 0.0699 }
        ]
      }
    }
  },
  
  DE: {
    stateName: 'Delaware',
    stateCode: 'DE',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 2000, rate: 0 },
          { min: 2000, max: 5000, rate: 0.022 },
          { min: 5000, max: 10000, rate: 0.039 },
          { min: 10000, max: 20000, rate: 0.048 },
          { min: 20000, max: null, rate: 0.052 }
        ],
        standardDeduction: {
          single: 3250,
          marriedFilingJointly: 6500,
          marriedFilingSeparately: 3250,
          headOfHousehold: 3250
        }
      }
    }
  },
  
  FL: {
    stateName: 'Florida',
    stateCode: 'FL',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: false
      }
    }
  },
  
  GA: {
    stateName: 'Georgia',
    stateCode: 'GA',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 750, rate: 0.01 },
          { min: 750, max: 2250, rate: 0.02 },
          { min: 2250, max: 3750, rate: 0.03 },
          { min: 3750, max: 5250, rate: 0.04 },
          { min: 5250, max: 7000, rate: 0.05 },
          { min: 7000, max: null, rate: 0.0575 }
        ],
        standardDeduction: {
          single: 5400,
          marriedFilingJointly: 10800,
          marriedFilingSeparately: 5400,
          headOfHousehold: 8000
        }
      }
    }
  },
  
  HI: {
    stateName: 'Hawaii',
    stateCode: 'HI',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 2400, rate: 0.014 },
          { min: 2400, max: 4800, rate: 0.032 },
          { min: 4800, max: 9600, rate: 0.055 },
          { min: 9600, max: 14400, rate: 0.064 },
          { min: 14400, max: 19200, rate: 0.068 },
          { min: 19200, max: 24000, rate: 0.072 },
          { min: 24000, max: 36000, rate: 0.076 },
          { min: 36000, max: 48000, rate: 0.079 },
          { min: 48000, max: 175000, rate: 0.0825 },
          { min: 175000, max: 200000, rate: 0.09 },
          { min: 200000, max: null, rate: 0.11 }
        ],
        standardDeduction: {
          single: 2200,
          marriedFilingJointly: 4400,
          marriedFilingSeparately: 2200,
          headOfHousehold: 3212
        }
      }
    }
  },
  
  ID: {
    stateName: 'Idaho',
    stateCode: 'ID',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.058 // 5.8% flat rate
      }
    }
  },
  
  IL: {
    stateName: 'Illinois',
    stateCode: 'IL',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.0495 // 4.95% flat rate
      }
    }
  },
  
  IN: {
    stateName: 'Indiana',
    stateCode: 'IN',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.032 // 3.2% flat rate
      }
    }
  },
  
  IA: {
    stateName: 'Iowa',
    stateCode: 'IA',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.038 // 3.8% flat rate (transitioning from brackets)
      }
    }
  },
  
  KS: {
    stateName: 'Kansas',
    stateCode: 'KS',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 15000, rate: 0.031 },
          { min: 15000, max: 30000, rate: 0.0525 },
          { min: 30000, max: null, rate: 0.057 }
        ],
        standardDeduction: {
          single: 3500,
          marriedFilingJointly: 8000,
          marriedFilingSeparately: 4000,
          headOfHousehold: 5800
        }
      }
    }
  },
  
  KY: {
    stateName: 'Kentucky',
    stateCode: 'KY',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.04 // 4% flat rate
      }
    }
  },
  
  LA: {
    stateName: 'Louisiana',
    stateCode: 'LA',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 12500, rate: 0.0185 },
          { min: 12500, max: 50000, rate: 0.035 },
          { min: 50000, max: null, rate: 0.0425 }
        ],
        standardDeduction: {
          single: 4500,
          marriedFilingJointly: 9000,
          marriedFilingSeparately: 4500,
          headOfHousehold: 6750
        }
      }
    }
  },
  
  ME: {
    stateName: 'Maine',
    stateCode: 'ME',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 24500, rate: 0.058 },
          { min: 24500, max: 58050, rate: 0.0675 },
          { min: 58050, max: null, rate: 0.0715 }
        ],
        standardDeduction: {
          single: 14200,
          marriedFilingJointly: 28400,
          marriedFilingSeparately: 14200,
          headOfHousehold: 21300
        }
      }
    }
  },
  
  MD: {
    stateName: 'Maryland',
    stateCode: 'MD',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 1000, rate: 0.02 },
          { min: 1000, max: 2000, rate: 0.03 },
          { min: 2000, max: 3000, rate: 0.04 },
          { min: 3000, max: 100000, rate: 0.0475 },
          { min: 100000, max: 125000, rate: 0.05 },
          { min: 125000, max: 150000, rate: 0.0525 },
          { min: 150000, max: 250000, rate: 0.055 },
          { min: 250000, max: null, rate: 0.0575 }
        ],
        standardDeduction: {
          single: 2400,
          marriedFilingJointly: 4850,
          marriedFilingSeparately: 2400,
          headOfHousehold: 3200
        }
      }
    }
  },
  
  MA: {
    stateName: 'Massachusetts',
    stateCode: 'MA',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.05 // 5% flat rate
      }
    }
  },
  
  MI: {
    stateName: 'Michigan',
    stateCode: 'MI',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.0405 // 4.05% flat rate
      }
    }
  },
  
  MN: {
    stateName: 'Minnesota',
    stateCode: 'MN',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 30070, rate: 0.0535 },
          { min: 30070, max: 98760, rate: 0.068 },
          { min: 98760, max: 183340, rate: 0.0785 },
          { min: 183340, max: null, rate: 0.0985 }
        ],
        standardDeduction: {
          single: 14200,
          marriedFilingJointly: 28400,
          marriedFilingSeparately: 14200,
          headOfHousehold: 21300
        }
      }
    }
  },
  
  MS: {
    stateName: 'Mississippi',
    stateCode: 'MS',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 5000, rate: 0.03 },
          { min: 5000, max: 10000, rate: 0.04 },
          { min: 10000, max: null, rate: 0.05 }
        ],
        standardDeduction: {
          single: 2300,
          marriedFilingJointly: 4600,
          marriedFilingSeparately: 2300,
          headOfHousehold: 3400
        }
      }
    }
  },
  
  MO: {
    stateName: 'Missouri',
    stateCode: 'MO',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 1121, rate: 0.015 },
          { min: 1121, max: 2242, rate: 0.02 },
          { min: 2242, max: 3363, rate: 0.025 },
          { min: 3363, max: 4484, rate: 0.03 },
          { min: 4484, max: 5605, rate: 0.035 },
          { min: 5605, max: 6726, rate: 0.04 },
          { min: 6726, max: 7847, rate: 0.045 },
          { min: 7847, max: 8968, rate: 0.05 },
          { min: 8968, max: null, rate: 0.054 }
        ],
        standardDeduction: {
          single: 14200,
          marriedFilingJointly: 28400,
          marriedFilingSeparately: 14200,
          headOfHousehold: 21300
        }
      }
    }
  },
  
  MT: {
    stateName: 'Montana',
    stateCode: 'MT',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 3100, rate: 0.01 },
          { min: 3100, max: 5500, rate: 0.02 },
          { min: 5500, max: 8400, rate: 0.03 },
          { min: 8400, max: 11300, rate: 0.04 },
          { min: 11300, max: 14500, rate: 0.05 },
          { min: 14500, max: 18700, rate: 0.06 },
          { min: 18700, max: null, rate: 0.0675 }
        ],
        standardDeduction: {
          single: 5350,
          marriedFilingJointly: 10700,
          marriedFilingSeparately: 5350,
          headOfHousehold: 7850
        }
      }
    }
  },
  
  NE: {
    stateName: 'Nebraska',
    stateCode: 'NE',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 3570, rate: 0.0246 },
          { min: 3570, max: 21330, rate: 0.0351 },
          { min: 21330, max: 34330, rate: 0.0501 },
          { min: 34330, max: null, rate: 0.0684 }
        ],
        standardDeduction: {
          single: 8050,
          marriedFilingJointly: 16100,
          marriedFilingSeparately: 8050,
          headOfHousehold: 11850
        }
      }
    }
  },
  
  NV: {
    stateName: 'Nevada',
    stateCode: 'NV',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: false
      }
    }
  },
  
  NH: {
    stateName: 'New Hampshire',
    stateCode: 'NH',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: false
      }
    }
  },
  
  NJ: {
    stateName: 'New Jersey',
    stateCode: 'NJ',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 20000, rate: 0.014 },
          { min: 20000, max: 35000, rate: 0.0175 },
          { min: 35000, max: 40000, rate: 0.035 },
          { min: 40000, max: 75000, rate: 0.0525 },
          { min: 75000, max: 500000, rate: 0.0637 },
          { min: 500000, max: 1000000, rate: 0.0897 },
          { min: 1000000, max: null, rate: 0.1075 }
        ]
      }
    }
  },
  
  NM: {
    stateName: 'New Mexico',
    stateCode: 'NM',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 5500, rate: 0.017 },
          { min: 5500, max: 11000, rate: 0.032 },
          { min: 11000, max: 16000, rate: 0.047 },
          { min: 16000, max: 210000, rate: 0.049 },
          { min: 210000, max: null, rate: 0.059 }
        ],
        standardDeduction: {
          single: 14200,
          marriedFilingJointly: 28400,
          marriedFilingSeparately: 14200,
          headOfHousehold: 21300
        }
      }
    }
  },
  
  NY: {
    stateName: 'New York',
    stateCode: 'NY',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 8500, rate: 0.04 },
          { min: 8500, max: 11700, rate: 0.045 },
          { min: 11700, max: 13900, rate: 0.0525 },
          { min: 13900, max: 80650, rate: 0.055 },
          { min: 80650, max: 215400, rate: 0.06 },
          { min: 215400, max: 1077550, rate: 0.0685 },
          { min: 1077550, max: 5000000, rate: 0.0965 },
          { min: 5000000, max: 25000000, rate: 0.103 },
          { min: 25000000, max: null, rate: 0.109 }
        ],
        standardDeduction: {
          single: 8000,
          marriedFilingJointly: 16050,
          marriedFilingSeparately: 8000,
          headOfHousehold: 11200
        }
      }
    }
  },
  
  NC: {
    stateName: 'North Carolina',
    stateCode: 'NC',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.045 // 4.5% flat rate
      }
    }
  },
  
  ND: {
    stateName: 'North Dakota',
    stateCode: 'ND',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 44725, rate: 0.0108 },
          { min: 44725, max: 108375, rate: 0.0254 },
          { min: 108375, max: 200000, rate: 0.027 },
          { min: 200000, max: 458350, rate: 0.029 }
        ],
        standardDeduction: {
          single: 14200,
          marriedFilingJointly: 28400,
          marriedFilingSeparately: 14200,
          headOfHousehold: 21300
        }
      }
    }
  },
  
  OH: {
    stateName: 'Ohio',
    stateCode: 'OH',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 26050, rate: 0.0285 },
          { min: 26050, max: 41200, rate: 0.0333 },
          { min: 41200, max: 82650, rate: 0.0380 },
          { min: 82650, max: 110650, rate: 0.0428 },
          { min: 110650, max: null, rate: 0.0475 }
        ]
      }
    }
  },
  
  OK: {
    stateName: 'Oklahoma',
    stateCode: 'OK',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 1000, rate: 0.0025 },
          { min: 1000, max: 2500, rate: 0.0075 },
          { min: 2500, max: 3750, rate: 0.0175 },
          { min: 3750, max: 4900, rate: 0.0275 },
          { min: 4900, max: 7200, rate: 0.0375 },
          { min: 7200, max: null, rate: 0.05 }
        ],
        standardDeduction: {
          single: 6350,
          marriedFilingJointly: 12700,
          marriedFilingSeparately: 6350,
          headOfHousehold: 9350
        }
      }
    }
  },
  
  OR: {
    stateName: 'Oregon',
    stateCode: 'OR',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 4050, rate: 0.0475 },
          { min: 4050, max: 10200, rate: 0.0675 },
          { min: 10200, max: 25550, rate: 0.0875 },
          { min: 25550, max: 64000, rate: 0.099 },
          { min: 64000, max: 160000, rate: 0.109 },
          { min: 160000, max: null, rate: 0.119 }
        ],
        standardDeduction: {
          single: 2700,
          marriedFilingJointly: 5400,
          marriedFilingSeparately: 2700,
          headOfHousehold: 4050
        }
      }
    }
  },
  
  PA: {
    stateName: 'Pennsylvania',
    stateCode: 'PA',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.0307 // 3.07% flat rate
      }
    }
  },
  
  RI: {
    stateName: 'Rhode Island',
    stateCode: 'RI',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 68200, rate: 0.0375 },
          { min: 68200, max: 155050, rate: 0.0475 },
          { min: 155050, max: null, rate: 0.0599 }
        ],
        standardDeduction: {
          single: 9600,
          marriedFilingJointly: 19200,
          marriedFilingSeparately: 9600,
          headOfHousehold: 14250
        }
      }
    }
  },
  
  SC: {
    stateName: 'South Carolina',
    stateCode: 'SC',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 3200, rate: 0 },
          { min: 3200, max: 6370, rate: 0.03 },
          { min: 6370, max: 9540, rate: 0.04 },
          { min: 9540, max: 12710, rate: 0.05 },
          { min: 12710, max: 15880, rate: 0.06 },
          { min: 15880, max: null, rate: 0.07 }
        ],
        standardDeduction: {
          single: 12760,
          marriedFilingJointly: 25520,
          marriedFilingSeparately: 12760,
          headOfHousehold: 18760
        }
      }
    }
  },
  
  SD: {
    stateName: 'South Dakota',
    stateCode: 'SD',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: false
      }
    }
  },
  
  TN: {
    stateName: 'Tennessee',
    stateCode: 'TN',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: false
      }
    }
  },
  
  TX: {
    stateName: 'Texas',
    stateCode: 'TX',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: false
      }
    }
  },
  
  UT: {
    stateName: 'Utah',
    stateCode: 'UT',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        flatRate: 0.0465 // 4.65% flat rate
      }
    }
  },
  
  VT: {
    stateName: 'Vermont',
    stateCode: 'VT',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 42150, rate: 0.0335 },
          { min: 42150, max: 102050, rate: 0.066 },
          { min: 102050, max: 213150, rate: 0.076 },
          { min: 213150, max: null, rate: 0.0875 }
        ],
        standardDeduction: {
          single: 7100,
          marriedFilingJointly: 14200,
          marriedFilingSeparately: 7100,
          headOfHousehold: 10550
        }
      }
    }
  },
  
  VA: {
    stateName: 'Virginia',
    stateCode: 'VA',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 3000, rate: 0.02 },
          { min: 3000, max: 5000, rate: 0.03 },
          { min: 5000, max: 17000, rate: 0.05 },
          { min: 17000, max: null, rate: 0.0575 }
        ],
        standardDeduction: {
          single: 4500,
          marriedFilingJointly: 9000,
          marriedFilingSeparately: 4500,
          headOfHousehold: 6750
        }
      }
    }
  },
  
  WA: {
    stateName: 'Washington',
    stateCode: 'WA',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: false
      }
    }
  },
  
  WV: {
    stateName: 'West Virginia',
    stateCode: 'WV',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 10000, rate: 0.03 },
          { min: 10000, max: 25000, rate: 0.04 },
          { min: 25000, max: 40000, rate: 0.045 },
          { min: 40000, max: 60000, rate: 0.06 },
          { min: 60000, max: null, rate: 0.065 }
        ],
        standardDeduction: {
          single: 2000,
          marriedFilingJointly: 4000,
          marriedFilingSeparately: 2000,
          headOfHousehold: 2000
        }
      }
    }
  },
  
  WI: {
    stateName: 'Wisconsin',
    stateCode: 'WI',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 13810, rate: 0.0354 },
          { min: 13810, max: 27630, rate: 0.0465 },
          { min: 27630, max: 304170, rate: 0.0627 },
          { min: 304170, max: null, rate: 0.0765 }
        ],
        standardDeduction: {
          single: 12760,
          marriedFilingJointly: 23620,
          marriedFilingSeparately: 11810,
          headOfHousehold: 18760
        }
      }
    }
  },
  
  WY: {
    stateName: 'Wyoming',
    stateCode: 'WY',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: false
      }
    }
  },
  
  DC: {
    stateName: 'District of Columbia',
    stateCode: 'DC',
    taxRates: {
      federalIncomeTax: FEDERAL_TAX_RATES,
      socialSecurityTax: SOCIAL_SECURITY_TAX,
      medicareTax: MEDICARE_TAX,
      stateIncomeTax: {
        hasIncomeTax: true,
        brackets: [
          { min: 0, max: 10000, rate: 0.04 },
          { min: 10000, max: 40000, rate: 0.06 },
          { min: 40000, max: 60000, rate: 0.065 },
          { min: 60000, max: 350000, rate: 0.085 },
          { min: 350000, max: 1000000, rate: 0.0925 },
          { min: 1000000, max: null, rate: 0.0975 }
        ],
        standardDeduction: {
          single: 14200,
          marriedFilingJointly: 28400,
          marriedFilingSeparately: 14200,
          headOfHousehold: 21300
        }
      }
    }
  }
};

export default STATE_TAX_DATA;