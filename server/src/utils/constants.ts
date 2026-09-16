/**
 * APMC Mandi Regulatory Standards & Grain Procurement Constants
 * Defines statutory moisture thresholds, Fair Average Quality (FAQ) standards,
 * and vehicle classification norms in accordance with FCI & Ministry of Agriculture guidelines.
 */

export interface CropMoistureNorm {
  cropName: string;
  faqMaxMoisture: number; // Percentage threshold for Grade A (100% MSP payment without dockage)
  permissibleCutMoisture: number; // Permissible with value cut/refraction
  rejectionMoisture: number; // Immediate rejection threshold at APMC gate entry
}

export const APMC_MOISTURE_NORMS: Record<string, CropMoistureNorm> = {
  WHEAT: {
    cropName: 'Wheat (Kanak)',
    faqMaxMoisture: 12.0,
    permissibleCutMoisture: 14.0,
    rejectionMoisture: 14.0,
  },
  PADDY: {
    cropName: 'Paddy (Dhaan)',
    faqMaxMoisture: 17.0,
    permissibleCutMoisture: 19.0,
    rejectionMoisture: 20.0,
  },
  MUSTARD: {
    cropName: 'Mustard / Rapeseed',
    faqMaxMoisture: 8.0,
    permissibleCutMoisture: 9.0,
    rejectionMoisture: 10.0,
  },
  MAIZE: {
    cropName: 'Maize (Makka)',
    faqMaxMoisture: 14.0,
    permissibleCutMoisture: 15.0,
    rejectionMoisture: 16.0,
  },
  GRAM: {
    cropName: 'Gram (Chana)',
    faqMaxMoisture: 12.0,
    permissibleCutMoisture: 14.0,
    rejectionMoisture: 14.5,
  },
  SOYBEAN: {
    cropName: 'Soybean',
    faqMaxMoisture: 12.0,
    permissibleCutMoisture: 13.0,
    rejectionMoisture: 14.0,
  },
};

/**
 * Standard Quality Assay Grades for Mandi Procurements
 */
export const QUALITY_GRADES = {
  GRADE_A: 'Grade A (FAQ Passed)',
  GRADE_B: 'Grade B (Moisture Cut)',
  GRADE_C: 'Grade C (High Refraction)',
  REJECTED: 'Consignment Rejected',
} as const;

/**
 * Standard Farm Transport Vehicle Types
 */
export const APMC_VEHICLE_TYPES = [
  'Tractor Trolley',
  'Mini Truck (Pick-up)',
  'Commercial Multi-Axle Truck',
  'Bullock / Animal Cart',
  'Other / Self Transport',
] as const;

/**
 * Determine Fair Average Quality (FAQ) Grade based on Moisture Percentage
 */
export function determineQualityGrade(
  moisturePercentage: number | null | undefined,
  defaultFaqThreshold: number = 12.0
): string {
  if (moisturePercentage == null) {
    return QUALITY_GRADES.GRADE_A;
  }
  return moisturePercentage <= defaultFaqThreshold
    ? QUALITY_GRADES.GRADE_A
    : QUALITY_GRADES.GRADE_B;
}
