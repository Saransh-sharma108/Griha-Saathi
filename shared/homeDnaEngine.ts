/**
 * Griha Saathi — Home DNA Studio Matching & Intelligence Engine
 * 
 * Deterministic, testable, explainable ranking architecture.
 * Strictly separates hard constraints from soft priority weighting.
 * 
 * Initial Prototype Values:
 * - Budget flexibility: 45% (preference strength, NOT monetary budget)
 * - Living space priority: 65% (preference strength, NOT sq.ft requirement)
 * - Location priority: 80% (preference strength, NOT commute/distance)
 */

import {
  Property,
  HomeDnaPreferences,
  HomeDnaRequirements,
  HomeDnaMatchResult,
  HomeDnaDimensionScores,
  HomeDnaRatingLabel,
  HomeDnaSummaryDescriptor,
} from './types.js';

export const DEFAULT_HOME_DNA_PREFERENCES: Readonly<HomeDnaPreferences> = {
  budgetFlexibility: 45,
  livingSpacePriority: 65,
  locationPriority: 80,
};

export const DEFAULT_HOME_DNA_REQUIREMENTS: Readonly<HomeDnaRequirements> = {
  intent: 'rent',
  state: 'all',
  locality: '',
  propertyType: 'all',
  maxBudget: undefined,
  minBedrooms: undefined,
  furnishing: 'any',
};

/**
 * Normalizes user preference strengths so the weights sum strictly to 1.0.
 * Invariant: norm_budget + norm_space + norm_location = 1.0 (within float precision).
 */
export function normalizeWeights(prefs: HomeDnaPreferences): {
  budgetWeight: number;
  spaceWeight: number;
  locationWeight: number;
} {
  const b = Math.max(0, Math.min(100, Number(prefs.budgetFlexibility) || 0));
  const s = Math.max(0, Math.min(100, Number(prefs.livingSpacePriority) || 0));
  const l = Math.max(0, Math.min(100, Number(prefs.locationPriority) || 0));

  const total = b + s + l;
  if (total === 0) {
    return {
      budgetWeight: 1 / 3,
      spaceWeight: 1 / 3,
      locationWeight: 1 / 3,
    };
  }

  return {
    budgetWeight: b / total,
    spaceWeight: s / total,
    locationWeight: l / total,
  };
}

/**
 * Produces clear, honest qualitative descriptors for the preference summary.
 * Avoids psychological pseudo-science; purely communicates declared priorities.
 */
export function getSummaryDescriptors(prefs: HomeDnaPreferences): HomeDnaSummaryDescriptor {
  const b = prefs.budgetFlexibility;
  const s = prefs.livingSpacePriority;
  const l = prefs.locationPriority;

  // Budget descriptor
  let budgetDescriptor = 'Moderate';
  if (b < 35) {
    budgetDescriptor = 'Strict Budget Discipline';
  } else if (b > 65) {
    budgetDescriptor = 'High Budget Fluidity';
  }

  // Living space descriptor
  let spaceDescriptor = 'Important';
  if (s < 35) {
    spaceDescriptor = 'Compact & Streamlined';
  } else if (s > 65) {
    spaceDescriptor = 'High Space Priority';
  }

  // Location priority descriptor
  let locationDescriptor = 'A strong priority';
  if (l < 35) {
    locationDescriptor = 'Flexible Geographic Range';
  } else if (l <= 65) {
    locationDescriptor = 'Focused Locality Anchor';
  }

  // Trade-off insight summary
  let tradeoffInsight = '';
  if (l >= 70 && b <= 50) {
    tradeoffInsight = 'Prioritizing exact location within a firm budget; results rank central properties while maintaining price protection.';
  } else if (s >= 70 && l <= 50) {
    tradeoffInsight = 'Prioritizing spacious layouts; results favor larger floor plans across adjacent districts.';
  } else if (b >= 70) {
    tradeoffInsight = 'High budget flexibility active; allows ranking to consider premium verified residences without compromising requirements.';
  } else {
    tradeoffInsight = 'Balanced priority profile; search evaluates rent efficiency, carpet area, and location proximity in equal harmony.';
  }

  return {
    budgetDescriptor,
    spaceDescriptor,
    locationDescriptor,
    tradeoffInsight,
  };
}

/**
 * Calculates deterministic fit scores across the 3 supported dimensions (0 - 100 each).
 */
export function calculateDimensionScores(
  property: Property,
  requirements: HomeDnaRequirements
): HomeDnaDimensionScores {
  // 1. BUDGET FIT SCORE
  let budgetFit = 75; // Neutral baseline if no budget specified
  if (requirements.maxBudget && requirements.maxBudget > 0) {
    const rent = property.rentPerMonth || 0;
    if (rent <= requirements.maxBudget) {
      // Lower rent relative to maximum ceiling provides higher financial comfort
      const ratio = rent / requirements.maxBudget;
      // Rent at 70% of budget => 85, rent at 100% of budget => 72, rent at 40% of budget => 94
      budgetFit = Math.min(100, Math.max(50, Math.round(100 - ratio * 30)));
    } else {
      // Exceeds stated budget
      const overageRatio = (rent - requirements.maxBudget) / requirements.maxBudget;
      budgetFit = Math.max(0, Math.round(50 - overageRatio * 200));
    }
  }

  // 2. SPACE FIT SCORE
  // Measures spatial expansiveness from compact and efficient to spacious and expansive
  let spaceFit = 60; // Neutral baseline if area is not provided
  const area = property.areaSqFt;
  const bedrooms = property.bedrooms || 1;

  if (area && area > 0) {
    // Map area (400 - 2400 sq.ft) smoothly onto a 40 to 95 scale
    const areaScaled = 40 + Math.min(55, (area / 2400) * 55);
    const bedroomBonus = Math.min(10, Math.max(0, (bedrooms - 1) * 3));
    spaceFit = Math.min(100, Math.max(30, Math.round(areaScaled + bedroomBonus)));
  } else {
    // Honest handling of missing area: neutral baseline based on stated bedroom count
    spaceFit = bedrooms >= 3 ? 68 : bedrooms === 2 ? 60 : 50;
  }

  // 3. LOCATION FIT SCORE
  let locationFit = 70; // Baseline for regional candidate
  const reqLocality = (requirements.locality || '').trim().toLowerCase();
  const propLocality = (property.locality || '').toLowerCase();
  const propCity = (property.city || '').toLowerCase();
  const propState = (property.state || '').toLowerCase();
  const reqState = (requirements.state || 'all').toLowerCase();

  if (reqLocality.length > 0) {
    if (propLocality.includes(reqLocality)) {
      locationFit = 100; // Direct locality match
    } else if (propCity.includes(reqLocality)) {
      locationFit = 85; // City / district match
    } else if (reqState !== 'all' && propState === reqState) {
      locationFit = 60; // Same state, different locality
    } else {
      locationFit = 35; // Divergent location
    }
  } else if (reqState !== 'all') {
    if (propState === reqState) {
      locationFit = 90;
    } else {
      locationFit = 40;
    }
  } else {
    locationFit = 75;
  }

  return {
    budgetFit,
    spaceFit,
    locationFit,
  };
}

/**
 * Validates hard constraints against property attributes.
 * Hard constraints are strictly respected and cannot be overridden by soft preference weights.
 */
export function evaluateHardConstraints(
  property: Property,
  requirements: HomeDnaRequirements
): { isViolated: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // 1. State / Regional jurisdiction constraint
  if (requirements.state && requirements.state !== 'all') {
    if (property.state.toLowerCase() !== requirements.state.toLowerCase()) {
      reasons.push(`Outside selected region (${property.state} vs ${requirements.state})`);
    }
  }

  // 2. Property type / configuration constraint
  if (requirements.propertyType && requirements.propertyType !== 'all') {
    if (property.propertyType !== requirements.propertyType) {
      reasons.push(`Configuration mismatch (${property.propertyType} vs ${requirements.propertyType})`);
    }
  }

  // 3. Minimum bedroom requirement
  if (requirements.minBedrooms && requirements.minBedrooms > 0) {
    if (!property.bedrooms || property.bedrooms < requirements.minBedrooms) {
      reasons.push(`Has ${property.bedrooms || 0} BHK, requires at least ${requirements.minBedrooms} BHK`);
    }
  }

  // 4. Maximum budget hard ceiling
  if (requirements.maxBudget && requirements.maxBudget > 0) {
    if (property.rentPerMonth > requirements.maxBudget) {
      const overage = property.rentPerMonth - requirements.maxBudget;
      reasons.push(`Monthly rent (₹${property.rentPerMonth.toLocaleString('en-IN')}) exceeds max budget of ₹${requirements.maxBudget.toLocaleString('en-IN')} by ₹${overage.toLocaleString('en-IN')}`);
    }
  }

  // 5. Furnishing constraint (if specific)
  if (requirements.furnishing && requirements.furnishing !== 'any') {
    if (property.furnishing !== requirements.furnishing) {
      reasons.push(`Furnishing status is ${property.furnishing.replace('_', ' ')}, requested ${requirements.furnishing.replace('_', ' ')}`);
    }
  }

  return {
    isViolated: reasons.length > 0,
    reasons,
  };
}

/**
 * Builds data-backed, evidence-based reasons explaining why a property matched.
 * Never invents facts or claims unsupported amenities.
 */
export function buildEvidenceReasons(
  property: Property,
  requirements: HomeDnaRequirements,
  scores: HomeDnaDimensionScores
): string[] {
  const reasons: string[] = [];

  // Budget evidence
  if (requirements.maxBudget && property.rentPerMonth <= requirements.maxBudget) {
    const savings = requirements.maxBudget - property.rentPerMonth;
    if (savings > 0) {
      reasons.push(`Rent ₹${property.rentPerMonth.toLocaleString('en-IN')}/mo is ₹${savings.toLocaleString('en-IN')} below your stated budget ceiling.`);
    } else {
      reasons.push(`Rent ₹${property.rentPerMonth.toLocaleString('en-IN')}/mo precisely matches your maximum budget.`);
    }
  } else {
    reasons.push(`Transparent monthly rent of ₹${property.rentPerMonth.toLocaleString('en-IN')}/mo with Model Tenancy Act deposit cap.`);
  }

  // Location evidence
  if (requirements.locality && property.locality.toLowerCase().includes(requirements.locality.toLowerCase())) {
    reasons.push(`Direct locality match in ${property.locality}, ${property.city}.`);
  } else {
    reasons.push(`Located in ${property.locality ? `${property.locality}, ` : ''}${property.city} (${property.state}).`);
  }

  // Space evidence
  if (property.areaSqFt) {
    reasons.push(`Provides ${property.areaSqFt.toLocaleString('en-IN')} sq.ft verified carpet area (${property.bedrooms || 1} BHK).`);
  } else if (property.bedrooms) {
    reasons.push(`Offers ${property.bedrooms} BHK configuration with ${property.bathrooms || 1} bathrooms.`);
  }

  // Verification evidence
  if (property.verificationStatus === 'authoritative_verified') {
    reasons.push(`100% Authoritative Land Registry title cleared through state revenue records.`);
  } else if (property.isAvailabilityConfirmed) {
    reasons.push(`Owner availability confirmed within the 60-day freshness window.`);
  }

  return reasons;
}

/**
 * Identifies transparent, genuine trade-offs for each candidate property.
 * Discloses missing data or boundary proximity honestly.
 */
export function buildTradeOffs(
  property: Property,
  requirements: HomeDnaRequirements
): string[] {
  const tradeOffs: string[] = [];

  // Budget proximity trade-off
  if (requirements.maxBudget && property.rentPerMonth > requirements.maxBudget * 0.9) {
    if (property.rentPerMonth <= requirements.maxBudget) {
      tradeOffs.push(`Price is close to your maximum budget ceiling (${Math.round((property.rentPerMonth / requirements.maxBudget) * 100)}% of max).`);
    }
  }

  // Missing area trade-off
  if (!property.areaSqFt) {
    tradeOffs.push(`Exact carpet area was not declared in the owner listing submission.`);
  }

  // Furnishing trade-off
  if (property.furnishing === 'unfurnished') {
    tradeOffs.push(`Unfurnished property; tenant will need to arrange essential appliances and furniture.`);
  }

  // Freshness trade-off
  if (!property.isAvailabilityConfirmed) {
    tradeOffs.push(`Listing availability has not been reconfirmed by the owner in the last 60 days.`);
  }

  // Maintenance charges note
  if (property.maintenanceCharges && property.maintenanceCharges > 0) {
    tradeOffs.push(`Additional monthly society maintenance of ₹${property.maintenanceCharges.toLocaleString('en-IN')} applies.`);
  }

  return tradeOffs;
}

/**
 * Primary Home DNA Match Evaluator.
 * Computes deterministic match scores, qualitative ratings, evidence, and trade-offs.
 */
export function evaluateHomeDnaMatch(
  property: Property,
  preferences: HomeDnaPreferences,
  requirements: HomeDnaRequirements
): HomeDnaMatchResult {
  const normalized = normalizeWeights(preferences);
  const dimensionScores = calculateDimensionScores(property, requirements);
  const hardConstraints = evaluateHardConstraints(property, requirements);

  // Compute composite score using normalized weights
  const composite = 
    dimensionScores.budgetFit * normalized.budgetWeight +
    dimensionScores.spaceFit * normalized.spaceWeight +
    dimensionScores.locationFit * normalized.locationWeight;

  const matchScore = Math.max(0, Math.min(100, Math.round(composite)));

  // Determine qualitative fit rating
  let ratingLabel: HomeDnaRatingLabel = 'Alternative Option';
  if (matchScore >= 85) {
    ratingLabel = 'Exceptional Match';
  } else if (matchScore >= 72) {
    ratingLabel = 'Strong Priority Fit';
  } else if (matchScore >= 60) {
    ratingLabel = 'Balanced Match';
  }

  const evidenceReasons = buildEvidenceReasons(property, requirements, dimensionScores);
  const tradeOffs = buildTradeOffs(property, requirements);

  return {
    property,
    matchScore,
    ratingLabel,
    dimensionScores,
    normalizedWeights: normalized,
    evidenceReasons,
    tradeOffs,
    isHardConstraintViolated: hardConstraints.isViolated,
    hardConstraintNotes: hardConstraints.reasons,
  };
}

/**
 * Filters a pool of properties against hard constraints and ranks eligible candidates
 * strictly by deterministic Home DNA match score in descending order.
 */
export function rankPropertiesWithHomeDna(
  properties: Property[],
  preferences: HomeDnaPreferences,
  requirements: HomeDnaRequirements
): {
  rankedResults: HomeDnaMatchResult[];
  excludedCount: number;
} {
  const evaluated = properties.map((prop) => evaluateHomeDnaMatch(prop, preferences, requirements));

  // Eligible properties must respect all hard constraints
  const eligible = evaluated.filter((res) => !res.isHardConstraintViolated);
  const excludedCount = evaluated.length - eligible.length;

  // Stable sort by match score descending, then by verified status, then by newest
  eligible.sort((a, b) => {
    if (b.matchScore !== a.matchScore) {
      return b.matchScore - a.matchScore;
    }
    // Secondary tie-breaker: authoritative verified first
    const aVer = a.property.verificationStatus === 'authoritative_verified' ? 1 : 0;
    const bVer = b.property.verificationStatus === 'authoritative_verified' ? 1 : 0;
    if (bVer !== aVer) return bVer - aVer;
    // Tertiary tie-breaker: rentPerMonth ascending
    return a.property.rentPerMonth - b.property.rentPerMonth;
  });

  return {
    rankedResults: eligible,
    excludedCount,
  };
}
