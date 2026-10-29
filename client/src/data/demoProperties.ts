import { DemoPropertyType, FurnishingStatus, Property, PropertyType, TargetState } from '../../../shared/types.js';

export const DEMO_LISTING_NOTICE =
  'This is a fictional demonstration listing created to demonstrate Griha Saathi property search. It is not a real property and is not available for rent.';

export const DEMO_PROPERTY_TYPES: { id: DemoPropertyType; label: string; category: PropertyType }[] = [
  { id: 'apartment_flat', label: 'Apartment / flat', category: '2bhk' },
  { id: 'independent_house', label: 'Independent house', category: 'independent_house' },
  { id: 'builder_floor', label: 'Builder floor', category: 'independent_house' },
  { id: 'studio_apartment', label: 'Studio apartment', category: 'studio' },
  { id: 'single_room', label: 'Single room', category: 'pg_coliving' },
  { id: 'shared_room', label: 'Shared room', category: 'pg_coliving' },
  { id: 'pg_accommodation', label: 'PG accommodation', category: 'pg_coliving' },
  { id: 'hostel', label: 'Hostel', category: 'pg_coliving' },
  { id: 'villa', label: 'Villa', category: 'villa' },
  { id: 'duplex', label: 'Duplex home', category: 'independent_house' },
  { id: 'penthouse', label: 'Penthouse', category: '4bhk_plus' },
  { id: 'cottage', label: 'Cottage', category: 'independent_house' },
  { id: 'farmhouse', label: 'Farmhouse', category: 'independent_house' },
  { id: 'serviced_apartment', label: 'Serviced apartment', category: '2bhk' },
  { id: 'student_accommodation', label: 'Student accommodation', category: 'pg_coliving' },
  { id: 'family_rental_home', label: 'Family rental home', category: '3bhk' },
];

const REGIONS: {
  state: TargetState;
  cities: { name: string; localities: [string, string] }[];
}[] = [
  {
    state: 'Jammu & Kashmir',
    cities: [
      { name: 'Srinagar', localities: ['Raj Bagh area (illustrative)', 'Hyderpora area (illustrative)'] },
      { name: 'Jammu', localities: ['Gandhi Nagar area (illustrative)', 'Trikuta Nagar area (illustrative)'] },
      { name: 'Udhampur', localities: ['Town centre area (illustrative)', 'Dhar Road area (illustrative)'] },
    ],
  },
  {
    state: 'Haryana',
    cities: [
      { name: 'Gurugram', localities: ['Sector 56 area (illustrative)', 'Palam Vihar area (illustrative)'] },
      { name: 'Faridabad', localities: ['Sector 15 area (illustrative)', 'Greenfield area (illustrative)'] },
      { name: 'Panipat', localities: ['Model Town area (illustrative)', 'Sector 18 area (illustrative)'] },
    ],
  },
  {
    state: 'Punjab',
    cities: [
      { name: 'Ludhiana', localities: ['Sarabha Nagar area (illustrative)', 'Model Town area (illustrative)'] },
      { name: 'Amritsar', localities: ['Ranjit Avenue area (illustrative)', 'Green Avenue area (illustrative)'] },
      { name: 'Jalandhar', localities: ['Model Town area (illustrative)', 'Urban Estate area (illustrative)'] },
      { name: 'Chandigarh', localities: ['Sector 35 area (illustrative)', 'Sector 44 area (illustrative)'] },
    ],
  },
  {
    state: 'Delhi',
    cities: [
      { name: 'New Delhi', localities: ['Dwarka area (illustrative)', 'Rohini area (illustrative)'] },
      { name: 'Delhi', localities: ['Saket area (illustrative)', 'Mayur Vihar area (illustrative)'] },
    ],
  },
  {
    state: 'Himachal Pradesh',
    cities: [
      { name: 'Shimla', localities: ['New Shimla area (illustrative)', 'Sanjauli area (illustrative)'] },
      { name: 'Dharamshala', localities: ['Lower Dharamshala area (illustrative)', 'McLeod Ganj area (illustrative)'] },
      { name: 'Solan', localities: ['Mall Road area (illustrative)', 'Kumarhatti area (illustrative)'] },
      { name: 'Manali', localities: ['Aleo area (illustrative)', 'Prini area (illustrative)'] },
    ],
  },
];

const AMENITY_SETS = [
  ['Wi-Fi', 'Kitchen', 'Security', 'Gated Security'],
  ['Lift', 'Power Backup', 'Balcony', 'Dedicated Parking'],
  ['Air Conditioning', 'Attached Bathroom', 'Laundry', 'Municipal Water Supply'],
  ['Heating', 'Kitchen', 'Parking', 'Piped Gas'],
  ['Wi-Fi', 'Shared Accommodation', 'Security'],
  ['Power Backup', 'Kitchen', 'Pet Friendly'],
  ['Lift', 'Air Conditioning', 'Parking'],
  ['Heating', 'Balcony', 'Laundry'],
];

const FURNISHING: FurnishingStatus[] = ['unfurnished', 'semi_furnished', 'fully_furnished'];

export function isValidDemoProperty(value: unknown): value is Property {
  if (!value || typeof value !== 'object') return false;
  const property = value as Partial<Property>;
  return property.isDemo === true &&
    typeof property.id === 'string' &&
    /^demo-property-\d{4}$/.test(property.id) &&
    typeof property.title === 'string' &&
    property.title.startsWith('DEMO LISTING — NOT A REAL PROPERTY:') &&
    property.demoOwnerLabel?.startsWith('Demo Owner ') === true &&
    property.submissionStatus === undefined &&
    property.verificationStatus === 'unverified' &&
    !property.ownerMaskedContact &&
    !property.coordinates &&
    !property.availabilityConfirmedAt &&
    property.demoPropertyType !== undefined &&
    typeof property.rentPerMonth === 'number' &&
    Number.isFinite(property.rentPerMonth) &&
    property.rentPerMonth > 0;
}

function buildDemoCatalog(): Property[] {
  const listings: Property[] = [];
  let cityOrdinal = 0;

  for (const region of REGIONS) {
    for (const city of region.cities) {
      for (let recordIndex = 0; recordIndex < 15; recordIndex++) {
        const typeIndex = (recordIndex + cityOrdinal) % DEMO_PROPERTY_TYPES.length;
        const type = DEMO_PROPERTY_TYPES[typeIndex];
        const number = listings.length + 1;
        const bedrooms = type.category === 'studio' || type.id === 'single_room' || type.id === 'shared_room' || type.category === 'pg_coliving'
          ? (type.id === 'studio_apartment' ? 0 : undefined)
          : 1 + ((typeIndex + cityOrdinal) % 4);
        const rent = 8_000 + ((number * 3_750) % 92_000);
        const amenities = AMENITY_SETS[(typeIndex + cityOrdinal) % AMENITY_SETS.length];
        const isShared = type.id === 'shared_room' || type.id === 'hostel' || type.id === 'student_accommodation';
        const locality = city.localities[(typeIndex + cityOrdinal) % city.localities.length];
        const label = DEMO_PROPERTY_TYPES.find((entry) => entry.id === type.id)?.label ?? type.label;
        const propertyId = `demo-property-${String(number).padStart(4, '0')}`;
        const property: Property = {
          id: propertyId,
          title: `DEMO LISTING — NOT A REAL PROPERTY: ${label}`,
          description: `Fictional ${label.toLowerCase()} record for offline search demonstrations only. No real address, owner, or rental offer is represented.`,
          state: region.state,
          city: city.name,
          locality,
          pincode: '',
          propertyType: type.category,
          propertyTypeLabel: label,
          demoPropertyType: type.id,
          bedrooms,
          bathrooms: type.id === 'single_room' || type.id === 'shared_room' || type.id === 'hostel' ? undefined : 1 + ((typeIndex + cityOrdinal) % 3),
          areaSqFt: 250 + ((number * 47) % 2_500),
          rentPerMonth: rent,
          securityDeposit: rent * (1 + (number % 2)),
          furnishing: FURNISHING[number % FURNISHING.length],
          tenantPreference: type.id === 'student_accommodation' ? 'students' : type.id === 'family_rental_home' ? 'family' : 'any',
          amenities,
          photos: [],
          verificationStatus: 'unverified',
          ownerId: `demo-owner-${String(number).padStart(4, '0')}`,
          demoOwnerLabel: `Demo Owner ${String(number).padStart(3, '0')}`,
          demoAvailabilityStatus: number % 7 === 0 ? 'simulated_unavailable' : 'simulated_available',
          demoListingMode: isShared ? 'shared_room' : type.id === 'single_room' ? 'private_room' : 'entire_place',
          demoParking: amenities.includes('Parking'),
          demoPetFriendly: amenities.includes('Pet Friendly'),
          demoSuitableFor: type.id === 'student_accommodation' || type.id === 'hostel' ? ['students'] :
            type.id === 'family_rental_home' ? ['families'] :
              isShared ? ['students', 'shared accommodation'] : ['families', 'working professionals'],
          availableFrom: `2026-${String(1 + (number % 12)).padStart(2, '0')}-01`,
          createdAt: '2026-01-01T00:00:00.000Z',
          updatedAt: '2026-01-01T00:00:00.000Z',
          dataSource: 'owner_submission',
          isDemo: true,
        };
        if (!isValidDemoProperty(property)) {
          throw new Error(`Invalid synthetic demo property: ${propertyId}`);
        }
        listings.push(property);
      }
      cityOrdinal++;
    }
  }

  return listings;
}

export const DEMO_PROPERTIES: readonly Property[] = buildDemoCatalog();

export interface DemoPropertyFilters {
  state?: string;
  city?: string;
  locality?: string;
  propertyType?: string;
  demoPropertyType?: string;
  searchText?: string;
  minRent?: number;
  maxRent?: number;
  minBedrooms?: number;
  maxBedrooms?: number;
  minBathrooms?: number;
  minArea?: number;
  maxArea?: number;
  furnishing?: string;
  preference?: string;
  amenities?: string[];
  petFriendlyOnly?: boolean;
  availableFrom?: string;
  sortBy?: string;
}

function normalized(value: string | undefined): string {
  return (value ?? '').trim().toLocaleLowerCase();
}

export function searchDemoProperties(filters: DemoPropertyFilters = {}): Property[] {
  const search = normalized(filters.searchText);
  const amenities = (filters.amenities ?? []).map(normalized);

  const results = DEMO_PROPERTIES.filter((property) => {
    if (filters.state && filters.state !== 'all' && property.state !== filters.state) return false;
    if (filters.city && !normalized(property.city).includes(normalized(filters.city))) return false;
    if (filters.locality && !normalized(property.locality).includes(normalized(filters.locality))) return false;
    if (filters.propertyType && filters.propertyType !== 'all' && property.propertyType !== filters.propertyType) return false;
    if (filters.demoPropertyType && filters.demoPropertyType !== 'all' && property.demoPropertyType !== filters.demoPropertyType) return false;
    if (search && !normalized(`${property.title} ${property.city} ${property.locality} ${property.state} ${property.description}`).includes(search)) return false;
    if (filters.minRent !== undefined && property.rentPerMonth < filters.minRent) return false;
    if (filters.maxRent !== undefined && property.rentPerMonth > filters.maxRent) return false;
    if (filters.minBedrooms !== undefined && (property.bedrooms ?? 0) < filters.minBedrooms) return false;
    if (filters.maxBedrooms !== undefined && (property.bedrooms ?? 0) > filters.maxBedrooms) return false;
    if (filters.minBathrooms !== undefined && (property.bathrooms ?? 0) < filters.minBathrooms) return false;
    if (filters.minArea !== undefined && (property.areaSqFt ?? 0) < filters.minArea) return false;
    if (filters.maxArea !== undefined && (property.areaSqFt ?? 0) > filters.maxArea) return false;
    if (filters.furnishing && filters.furnishing !== 'all' && property.furnishing !== filters.furnishing) return false;
    if (filters.preference && filters.preference !== 'all' &&
      property.tenantPreference !== filters.preference && !property.demoSuitableFor?.includes(filters.preference)) return false;
    if (filters.petFriendlyOnly && !property.demoPetFriendly) return false;
    if (filters.availableFrom && property.availableFrom > filters.availableFrom) return false;
    const propertyAmenities = (property.amenities ?? []).map(normalized);
    if (!amenities.every((amenity) => propertyAmenities.includes(amenity))) return false;
    return true;
  });

  const relevanceScore = (property: Property) => {
    let score = 0;
    if (filters.state && filters.state !== 'all' && property.state === filters.state) score += 10;
    if (filters.city && normalized(property.city) === normalized(filters.city)) score += 8;
    if (filters.locality && normalized(property.locality) === normalized(filters.locality)) score += 6;
    if (filters.demoPropertyType && property.demoPropertyType === filters.demoPropertyType) score += 5;
    if (filters.preference && filters.preference !== 'all' && property.demoSuitableFor?.includes(filters.preference)) score += 3;
    if (filters.petFriendlyOnly && property.demoPetFriendly) score += 2;
    score += amenities.filter((amenity) => (property.amenities ?? []).map(normalized).includes(amenity)).length;
    return score;
  };

  return results.sort((a, b) => {
    switch (filters.sortBy) {
      case 'rent_desc':
        return b.rentPerMonth - a.rentPerMonth || a.id.localeCompare(b.id);
      case 'area_asc':
        return (a.areaSqFt ?? Number.MAX_SAFE_INTEGER) - (b.areaSqFt ?? Number.MAX_SAFE_INTEGER) || a.id.localeCompare(b.id);
      case 'area_desc':
        return (b.areaSqFt ?? -1) - (a.areaSqFt ?? -1) || a.id.localeCompare(b.id);
      case 'relevance':
        return relevanceScore(b) - relevanceScore(a) || a.rentPerMonth - b.rentPerMonth || a.id.localeCompare(b.id);
      case 'verified_first':
      case 'newest':
      case 'rent_asc':
      default:
        return a.rentPerMonth - b.rentPerMonth || a.id.localeCompare(b.id);
    }
  });
}

export function isValidDemoCatalog(records: readonly Property[]): boolean {
  return records.length === 240 && records.every(isValidDemoProperty) &&
    new Set(records.map((record) => record.id)).size === records.length &&
    DEMO_PROPERTY_TYPES.every((type) => records.some((record) => record.demoPropertyType === type.id)) &&
    REGIONS.every((region) => records.some((record) => record.state === region.state));
}
