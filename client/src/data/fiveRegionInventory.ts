import { 
  FurnishingStatus, 
  Property, 
  PropertyType, 
  TargetState, 
  TenantPreference,
  PropertyProvenance 
} from '@shared/types';

export const FIVE_REGION_LISTING_NOTICE = 
  'Demonstration inventory for Northern India property discovery. Features illustrative architectural records across all 5 target regions with realistic pricing, configurations, and statutory compliance parameters.';

export interface RegionCityInfo {
  name: string;
  district: string;
  localities: string[];
}

export interface RegionDefinitionItem {
  id: string;
  state: TargetState;
  displayName: string;
  regulatoryAuthority: string;
  landRegistrySystem: string;
  cities: RegionCityInfo[];
}

export const FIVE_REGIONS: RegionDefinitionItem[] = [
  {
    id: 'jammu_kashmir',
    state: 'Jammu & Kashmir',
    displayName: 'Jammu & Kashmir',
    regulatoryAuthority: 'J&K Real Estate Regulatory Authority (JKRERA)',
    landRegistrySystem: 'Aapki Zameen Aapki Nigrani (Land Records Information System)',
    cities: [
      { name: 'Jammu', district: 'Jammu', localities: ['Gandhi Nagar', 'Trikuta Nagar', 'Channi Himmat', 'Bahu Plaza', 'Janipur', 'Talab Tillo'] },
      { name: 'Srinagar', district: 'Srinagar', localities: ['Raj Bagh', 'Hyderpora', 'Lal Chowk', 'Karan Nagar', 'Bemina', 'Nishat'] },
      { name: 'Udhampur', district: 'Udhampur', localities: ['Town Centre', 'Dhar Road', 'Subash Nagar', 'Garhi'] },
      { name: 'Kathua', district: 'Kathua', localities: ['Kalibari', 'Patel Nagar', 'Govindsar', 'Hatli Morh'] },
      { name: 'Samba', district: 'Samba', localities: ['Main Bazaar', 'Vijaypur', 'Bari Brahmana Industrial Zone', 'SIDCO Phase II'] },
      { name: 'Anantnag', district: 'Anantnag', localities: ['KP Road', 'Khanabal', 'Mattan', 'Dialgam'] },
      { name: 'Baramulla', district: 'Baramulla', localities: ['Old Town', 'Delina', 'Kanispora', 'Singhpora'] },
      { name: 'Budgam', district: 'Budgam', localities: ['Sheikhpora', 'Ompora', 'Chadoora', 'Humhama Airport Enclave'] },
      { name: 'Pulwama', district: 'Pulwama', localities: ['Rajpora Road', 'Newa', 'Awantipora Highway Corridor', 'Pampore Saffron Belt'] },
      { name: 'Ganderbal', district: 'Ganderbal', localities: ['Beehama', 'Wayil', 'Kangan', 'Tullamulla'] },
      { name: 'Reasi', district: 'Reasi', localities: ['Katra Base Camp', 'Pouni', 'Gran Morh', 'Nai Basti'] },
      { name: 'Rajouri', district: 'Rajouri', localities: ['Gujjar Mandi', 'Jawahar Nagar', 'Kheora', 'Panja Chowk'] },
      { name: 'Poonch', district: 'Poonch', localities: ['Surankote Road', 'Mendhar', 'Qazi Mohalla', 'Radio Colony'] },
      { name: 'Doda', district: 'Doda', localities: ['Pul Doda', 'Bharat Road', 'Nagri', 'Bhaderwah Valley Link'] },
      { name: 'Kishtwar', district: 'Kishtwar', localities: ['Chowgan Ground', 'Kuleed', 'Pochhal', 'Bun Astan'] }
    ]
  },
  {
    id: 'haryana',
    state: 'Haryana',
    displayName: 'Haryana',
    regulatoryAuthority: 'Haryana Real Estate Regulatory Authority (HARERA Gurugram & Panchkula)',
    landRegistrySystem: 'Jamabandi Haryana / Web-HALRIS',
    cities: [
      { name: 'Gurugram', district: 'Gurugram', localities: ['DLF Phase 5', 'Sector 56 Golf Course Ext', 'Cyber City', 'Sohna Road', 'Palam Vihar', 'Sector 82'] },
      { name: 'Faridabad', district: 'Faridabad', localities: ['Sector 15', 'Sector 16', 'Greenfield Colony', 'Neharpar Greater Faridabad', 'NIT 1'] },
      { name: 'Panchkula', district: 'Panchkula', localities: ['Sector 6', 'Sector 20', 'Sector 14', 'Mansa Devi Complex MDC', 'Sector 4'] },
      { name: 'Ambala', district: 'Ambala', localities: ['Model Town', 'Ambala Cantt', 'Prem Nagar', 'Baldev Nagar'] },
      { name: 'Karnal', district: 'Karnal', localities: ['Model Town', 'Sector 12 Urban Estate', 'Sector 13', 'Mugal Canal'] },
      { name: 'Panipat', district: 'Panipat', localities: ['Model Town', 'Sector 18', 'GT Road Textile Belt', 'Ansals Sushant City'] },
      { name: 'Sonipat', district: 'Sonipat', localities: ['Sector 14', 'Kundli TDI City', 'Murthal Road', 'Sector 15'] },
      { name: 'Rohtak', district: 'Rohtak', localities: ['Model Town', 'Sector 1-3', 'Tilak Nagar', 'Subhash Nagar'] },
      { name: 'Hisar', district: 'Hisar', localities: ['Urban Estate II', 'Model Town', 'PLA Commercial Market', 'Sector 14'] },
      { name: 'Kurukshetra', district: 'Kurukshetra', localities: ['Sector 7', 'Sector 13', 'University Campus Road', 'Pipli Road'] },
      { name: 'Yamunanagar', district: 'Yamunanagar', localities: ['Model Town', 'Jagadhri Urban Estate', 'Professor Colony'] },
      { name: 'Manesar', district: 'Gurugram', localities: ['IMT Sector 1', 'IMT Sector 8', 'Express Highway Hub'] },
      { name: 'Bahadurgarh', district: 'Jhajjar', localities: ['Sector 6', 'Omaxe City', 'Sector 9A', 'MIE Phase 1'] },
      { name: 'Rewari', district: 'Rewari', localities: ['Model Town', 'Bawal Industrial Corridor', 'Brass Market', 'Sector 3'] }
    ]
  },
  {
    id: 'punjab',
    state: 'Punjab',
    displayName: 'Punjab',
    regulatoryAuthority: 'Punjab Real Estate Regulatory Authority (PBRERA)',
    landRegistrySystem: 'Punjab Land Records Society (PLRS / Fard)',
    cities: [
      { name: 'Chandigarh region', district: 'Chandigarh', localities: ['Sector 17 Commercial Heart', 'Sector 35', 'Sector 44', 'Sector 8 Heritage', 'Manimajra'] },
      { name: 'Mohali', district: 'SAS Nagar', localities: ['Sector 70', 'Phase 7', 'Phase 3B2', 'Aerocity GMADA', 'Sector 82 IT City', 'Sector 68'] },
      { name: 'Zirakpur', district: 'Mohali', localities: ['VIP Road', 'Dhakoli', 'Maya Garden Belt', 'High Ground', 'Baltana'] },
      { name: 'Panchkula region', district: 'Mohali / Border', localities: ['Pinjore Foothills', 'Kalka Hills Gateway', 'Baltana Border'] },
      { name: 'Ludhiana', district: 'Ludhiana', localities: ['Sarabha Nagar', 'Model Town', 'Civil Lines', 'BRS Nagar', 'South City'] },
      { name: 'Amritsar', district: 'Amritsar', localities: ['Ranjit Avenue', 'Green Avenue', 'Mall Road', 'Cantonment', 'Lawrence Road'] },
      { name: 'Jalandhar', district: 'Jalandhar', localities: ['Model Town', 'Urban Estate Phase 2', 'Cantt Road', 'GTB Nagar'] },
      { name: 'Patiala', district: 'Patiala', localities: ['Urban Estate Phase 1', 'Model Town', 'Leela Bhawan', 'Rose Colony'] },
      { name: 'Bathinda', district: 'Bathinda', localities: ['Model Town Phase 1', 'Civil Lines', 'Goniana Road', 'Power House Road'] },
      { name: 'Pathankot', district: 'Pathankot', localities: ['Dalhousie Road', 'Model Town', 'Patel Nagar', 'Dhangu Road'] },
      { name: 'Hoshiarpur', district: 'Hoshiarpur', localities: ['Model Town', 'Mall Road', 'Civil Lines', 'Sutheri Road'] },
      { name: 'Moga', district: 'Moga', localities: ['GT Road', 'Friends Colony', 'New Town', 'Bagha Purana Road'] },
      { name: 'Kapurthala', district: 'Kapurthala', localities: ['Mall Road', 'Model Town', 'Urban Estate', 'Sultanpur Road'] },
      { name: 'Khanna', district: 'Ludhiana', localities: ['GT Road Grain Hub', 'Guru Nanak Nagar', 'Malerkotla Road', 'Model Town'] }
    ]
  },
  {
    id: 'delhi_ncr',
    state: 'Delhi',
    displayName: 'Delhi NCR',
    regulatoryAuthority: 'Delhi Real Estate Regulatory Authority (Delhi RERA / UP RERA)',
    landRegistrySystem: 'Delhi Online Registration Information System (DORIS)',
    cities: [
      { name: 'New Delhi', district: 'New Delhi', localities: ['Connaught Place', 'Chanakyapuri', 'Khan Market Enclave', 'Barakhamba Road'] },
      { name: 'Central Delhi', district: 'Central Delhi', localities: ['Karol Bagh', 'Rajendra Nagar', 'Daryaganj Heritage', 'Paharganj'] },
      { name: 'South Delhi', district: 'South Delhi', localities: ['Greater Kailash (GK 1 & 2)', 'Vasant Kunj', 'Hauz Khas Enclave', 'Saket', 'Defence Colony'] },
      { name: 'North Delhi', district: 'North Delhi', localities: ['Civil Lines', 'Model Town', 'Kamla Nagar', 'Shalimar Bagh'] },
      { name: 'East Delhi', district: 'East Delhi', localities: ['Mayur Vihar Phase 1 & 2', 'Laxmi Nagar', 'Preet Vihar', 'Anand Vihar'] },
      { name: 'West Delhi', district: 'West Delhi', localities: ['Punjabi Bagh', 'Rajouri Garden', 'Paschim Vihar', 'Patel Nagar'] },
      { name: 'Dwarka', district: 'South West Delhi', localities: ['Sector 6 Central', 'Sector 10', 'Sector 12 Metro Hub', 'Sector 22', 'Dwarka Expressway'] },
      { name: 'Rohini', district: 'North West Delhi', localities: ['Sector 9', 'Sector 13', 'Sector 18', 'Sector 24 Swarn Jayanti Belt'] },
      { name: 'Janakpuri', district: 'West Delhi', localities: ['District Centre Complex', 'C-Block Residential', 'B-Block', 'Posangipur'] },
      { name: 'Vasant Kunj', district: 'South West Delhi', localities: ['Sector A Pockets', 'Sector B Institutional', 'Sector C Residential', 'Vasant Valley Enclave'] },
      { name: 'Greater Kailash', district: 'South Delhi', localities: ['GK-I M-Block Hub', 'GK-II Savitri Cinema Area', 'Pamposh Enclave'] },
      { name: 'Noida', district: 'Gautam Buddha Nagar', localities: ['Sector 18 Commercial', 'Sector 62 IT Hub', 'Sector 137 Expressway', 'Sector 76 Metro Belt', 'Sector 150 Sports City'] },
      { name: 'Greater Noida', district: 'Gautam Buddha Nagar', localities: ['Pari Chowk', 'Knowledge Park III Institutional', 'Alpha 1', 'Omicron Sector', 'Techzone 4'] },
      { name: 'Ghaziabad', district: 'Ghaziabad', localities: ['Indirapuram Ahinsa Khand', 'Vaishali Sector 4', 'Kaushambi', 'Raj Nagar Extension', 'Crossings Republik'] },
      { name: 'Gurugram', district: 'Gurugram', localities: ['Cyber Hub Belt', 'Golf Course Road Extension', 'Sohna Road IT Corridor', 'Nirvana Country'] },
      { name: 'Faridabad', district: 'Faridabad', localities: ['Greenfields Colony', 'Sector 21C', 'Sector 14 Royal Enclave', 'Mathura Road Corridor'] }
    ]
  },
  {
    id: 'himachal_pradesh',
    state: 'Himachal Pradesh',
    displayName: 'Himachal Pradesh',
    regulatoryAuthority: 'Himachal Pradesh Real Estate Regulatory Authority (HP RERA)',
    landRegistrySystem: 'Himbhoomi / Revenue Department HP',
    cities: [
      { name: 'Shimla', district: 'Shimla', localities: ['The Ridge Mall Road', 'New Shimla Sector 1-4', 'Sanjauli', 'Chotta Shimla Heritage', 'Kasumpti'] },
      { name: 'Solan', district: 'Solan', localities: ['Mall Road', 'Kumarhatti Highway', 'Chambaghat', 'Deonghat', 'Saproon Valley'] },
      { name: 'Dharamshala', district: 'Kangra', localities: ['McLeod Ganj Temple Road', 'Bhagsu Nag', 'Lower Dharamshala Civil', 'Forsyth Ganj', 'Kotwali Bazaar'] },
      { name: 'Mandi', district: 'Mandi', localities: ['Samkhetar Heritage', 'Motibazar', 'Sauli Khad', 'Bhiuli Beas Front', 'Tarna Hill'] },
      { name: 'Kullu', district: 'Kullu', localities: ['Dhalpur Maidan Area', 'Akhara Bazaar', 'Sarvari River Belt', 'Shastri Nagar'] },
      { name: 'Manali', district: 'Kullu', localities: ['Aleo Riverside', 'Prini Apple Valley', 'Vashisht Hot Springs Zone', 'Old Manali Bohemian Lane', 'Log Huts Sanctuary'] },
      { name: 'Hamirpur', district: 'Hamirpur', localities: ['Anu Academic Area', 'Gandhi Chowk', 'Hira Nagar', 'Mattan Sidh'] },
      { name: 'Una', district: 'Una', localities: ['Mehatpur Industrial Road', 'Rakkar Colony', 'Model Town', 'Nangal Road'] },
      { name: 'Bilaspur', district: 'Bilaspur', localities: ['Main Market', 'Dholra Lakeview', 'Kosserian', 'Chandpur Valley'] },
      { name: 'Kangra', district: 'Kangra', localities: ['Temple Bazaar', 'Bir Paragliding Valley', 'Kotwali', 'Matour Bypass'] },
      { name: 'Palampur', district: 'Kangra', localities: ['Bundla Tea Estate Area', 'Holta Pine Valley', 'Maranda Rail Link', 'Lohna Village'] },
      { name: 'Chamba', district: 'Chamba', localities: ['Chowgan Heritage Ground', 'Sultanpur', 'Surara Mohalla', 'Hardaspura'] },
      { name: 'Kasauli', district: 'Solan', localities: ['Upper Mall Trail', 'Lower Mall Pine Ridge', 'Garkhal Junction', 'Kimmughat Scenic Valley'] },
      { name: 'Baddi', district: 'Solan', localities: ['Housing Board Phase 1-3', 'Sai Road Pharma Belt', 'Barotiwala Road', 'Bhud Industrial Corridor'] }
    ]
  }
];

export interface PropertyCategoryOption {
  id: 'residential' | 'commercial' | 'plots_land' | 'hospitality';
  label: string;
  subtypes: {
    id: string;
    label: string;
    defaultPropertyType: PropertyType;
    isLandOrPlot?: boolean;
    isCommercial?: boolean;
    supportsBedrooms?: boolean;
  }[];
}

export const PROPERTY_CATEGORIES: PropertyCategoryOption[] = [
  {
    id: 'residential',
    label: 'Residential Living',
    subtypes: [
      { id: 'apartment', label: 'Apartment / Flat', defaultPropertyType: '2bhk', supportsBedrooms: true },
      { id: 'independent_house', label: 'Independent House', defaultPropertyType: 'independent_house', supportsBedrooms: true },
      { id: 'villa', label: 'Villa / Kothi', defaultPropertyType: 'villa', supportsBedrooms: true },
      { id: 'builder_floor', label: 'Independent Builder Floor', defaultPropertyType: 'independent_house', supportsBedrooms: true },
      { id: 'studio', label: 'Studio Apartment', defaultPropertyType: 'studio', supportsBedrooms: false },
      { id: '1rk', label: '1 RK Unit', defaultPropertyType: 'studio', supportsBedrooms: true },
      { id: '1bhk', label: '1 BHK Flat', defaultPropertyType: '1bhk', supportsBedrooms: true },
      { id: '2bhk', label: '2 BHK Home', defaultPropertyType: '2bhk', supportsBedrooms: true },
      { id: '3bhk', label: '3 BHK Home', defaultPropertyType: '3bhk', supportsBedrooms: true },
      { id: '4bhk', label: '4 BHK Luxury Residence', defaultPropertyType: '4bhk_plus', supportsBedrooms: true },
      { id: '5plus_bhk', label: '5+ BHK Grand Estate', defaultPropertyType: '4bhk_plus', supportsBedrooms: true },
      { id: 'duplex', label: 'Duplex Penthouse / House', defaultPropertyType: 'independent_house', supportsBedrooms: true },
      { id: 'penthouse', label: 'Sky Penthouse', defaultPropertyType: '4bhk_plus', supportsBedrooms: true },
      { id: 'shared_accommodation', label: 'Shared Flat / Room', defaultPropertyType: 'pg_coliving', supportsBedrooms: true },
      { id: 'pg_accommodation', label: 'PG Accommodation', defaultPropertyType: 'pg_coliving', supportsBedrooms: false },
      { id: 'hostel', label: 'Hostel / Student Housing', defaultPropertyType: 'pg_coliving', supportsBedrooms: false }
    ]
  },
  {
    id: 'commercial',
    label: 'Commercial & Workspace',
    subtypes: [
      { id: 'office_space', label: 'Office Space / Corporate Suite', defaultPropertyType: 'independent_house', isCommercial: true, supportsBedrooms: false },
      { id: 'shop', label: 'Retail Shop / High Street Store', defaultPropertyType: 'independent_house', isCommercial: true, supportsBedrooms: false },
      { id: 'showroom', label: 'Grand Commercial Showroom', defaultPropertyType: 'independent_house', isCommercial: true, supportsBedrooms: false },
      { id: 'retail_space', label: 'Shopping Mall / Retail Space', defaultPropertyType: 'independent_house', isCommercial: true, supportsBedrooms: false },
      { id: 'commercial_building', label: 'Independent Commercial Building', defaultPropertyType: 'independent_house', isCommercial: true, supportsBedrooms: false },
      { id: 'warehouse', label: 'Logistics Warehouse / Godown', defaultPropertyType: 'independent_house', isCommercial: true, supportsBedrooms: false },
      { id: 'industrial_space', label: 'Industrial Shed / Factory Unit', defaultPropertyType: 'independent_house', isCommercial: true, supportsBedrooms: false },
      { id: 'coworking_space', label: 'Co-working Hot Desk / Private Cabin', defaultPropertyType: 'pg_coliving', isCommercial: true, supportsBedrooms: false }
    ]
  },
  {
    id: 'plots_land',
    label: 'Plots & Land',
    subtypes: [
      { id: 'agricultural_land', label: 'Agricultural Land / Farm Acreage', defaultPropertyType: 'independent_house', isLandOrPlot: true, supportsBedrooms: false },
      { id: 'residential_plot', label: 'Residential Freehold Plot', defaultPropertyType: 'independent_house', isLandOrPlot: true, supportsBedrooms: false },
      { id: 'commercial_plot', label: 'Commercial SCO / Commercial Plot', defaultPropertyType: 'independent_house', isLandOrPlot: true, supportsBedrooms: false },
      { id: 'farmhouse', label: 'Gated Luxury Farmhouse', defaultPropertyType: 'villa', supportsBedrooms: true }
    ]
  },
  {
    id: 'hospitality',
    label: 'Hospitality & Holiday Living',
    subtypes: [
      { id: 'guest_house', label: 'Operational Guest House / Homestay', defaultPropertyType: 'independent_house', supportsBedrooms: true },
      { id: 'holiday_home', label: 'Mountain Retreat / Holiday Chalet', defaultPropertyType: 'villa', supportsBedrooms: true }
    ]
  }
];

export interface RentalBudgetBand {
  id: string;
  label: string;
  min: number;
  max: number;
  descriptor: string;
}

export const RENTAL_BUDGET_BANDS: RentalBudgetBand[] = [
  { id: 'ultra_affordable', label: 'Ultra Affordable', min: 1000, max: 5000, descriptor: '₹1,000 – ₹5,000 / mo' },
  { id: 'budget', label: 'Budget Friendly', min: 5000, max: 10000, descriptor: '₹5,000 – ₹10,000 / mo' },
  { id: 'lower_mid', label: 'Lower Mid-Range', min: 10000, max: 15000, descriptor: '₹10,000 – ₹15,000 / mo' },
  { id: 'mid_range', label: 'Mid-Range', min: 15000, max: 25000, descriptor: '₹15,000 – ₹25,000 / mo' },
  { id: 'upper_mid', label: 'Upper Mid-Range', min: 25000, max: 40000, descriptor: '₹25,000 – ₹40,000 / mo' },
  { id: 'premium', label: 'Premium', min: 40000, max: 60000, descriptor: '₹40,000 – ₹60,000 / mo' },
  { id: 'luxury', label: 'Luxury Tier', min: 60000, max: 100000, descriptor: '₹60,000 – ₹1,00,000 / mo' },
  { id: 'ultra_luxury', label: 'Ultra Luxury Estate', min: 100000, max: 500000, descriptor: '₹1,00,000 – ₹2,00,000+ / mo' }
];

export interface SalePriceBand {
  id: string;
  label: string;
  min: number;
  max: number;
  descriptor: string;
}

export const SALE_PRICE_BANDS: SalePriceBand[] = [
  { id: 'under_25l', label: 'Under ₹25 Lakhs', min: 0, max: 2500000, descriptor: 'Up to ₹25 Lakhs' },
  { id: '25l_50l', label: '₹25L – ₹50 Lakhs', min: 2500000, max: 5000000, descriptor: '₹25 Lakhs – ₹50 Lakhs' },
  { id: '50l_1cr', label: '₹50L – ₹1 Crore', min: 5000000, max: 10000000, descriptor: '₹50 Lakhs – ₹1.0 Crore' },
  { id: '1cr_2cr', label: '₹1.0Cr – ₹2.5 Crores', min: 10000000, max: 25000000, descriptor: '₹1.0 Cr – ₹2.5 Crores' },
  { id: '2cr_5cr', label: '₹2.5Cr – ₹5.0 Crores', min: 25000000, max: 50000000, descriptor: '₹2.5 Cr – ₹5.0 Crores' },
  { id: '5cr_plus', label: '₹5.0 Crores+', min: 50000000, max: 250000000, descriptor: '₹5.0 Crores+' }
];

export const CATEGORY_IMAGE_POOLS: Record<string, string[]> = {
  // Studio & 1RK
  studio: [
    '/property-images/studio/studio-01.jpg',
    '/property-images/studio/studio-02.jpg',
    '/property-images/studio/studio-03.jpg',
    '/property-images/studio/studio-04.jpg',
  ],
  // PG & Hostels
  pg_hostel: [
    '/property-images/pg-hostels/pghostel-01.jpg',
    '/property-images/pg-hostels/pghostel-02.jpg',
    '/property-images/pg-hostels/pghostel-03.jpg',
    '/property-images/pg-hostels/pghostel-04.jpg',
  ],
  // 1 BHK & Compact Apartments
  apartment_1bhk: [
    '/property-images/apartments/apartment-01.jpg',
    '/property-images/apartments/apartment-02.jpg',
    '/property-images/apartments/apartment-03.jpg',
    '/property-images/apartments/apartment-04.jpg',
    '/property-images/apartments/apartment-05.jpg',
  ],
  // 2 BHK & 3 BHK Family Homes
  family_home: [
    '/property-images/family-homes/family-01.jpg',
    '/property-images/family-homes/family-02.jpg',
    '/property-images/family-homes/family-03.jpg',
    '/property-images/family-homes/family-04.jpg',
    '/property-images/family-homes/family-05.jpg',
    '/images/apartment_mohali.jpg',
    '/images/modern_apartment.jpg',
  ],
  // Luxury Villas
  villa: [
    '/property-images/luxury-villas/villa-01.jpg',
    '/property-images/luxury-villas/villa-02.jpg',
    '/property-images/luxury-villas/villa-03.jpg',
    '/property-images/luxury-villas/villa-04.jpg',
    '/property-images/luxury-villas/villa-05.jpg',
    '/images/villa_srinagar.jpg',
    '/images/hero_villa.jpg',
  ],
  // Penthouses
  penthouse: [
    '/property-images/penthouses/penthouse-01.jpg',
    '/property-images/penthouses/penthouse-02.jpg',
    '/property-images/penthouses/penthouse-03.jpg',
    '/property-images/penthouses/penthouse-04.jpg',
  ],
  // Independent Houses / Builder Floors
  independent_house: [
    '/property-images/independent-houses/house-01.jpg',
    '/property-images/independent-houses/house-02.jpg',
    '/property-images/independent-houses/house-03.jpg',
    '/property-images/independent-houses/house-04.jpg',
  ],
  // Commercial Shops & Showrooms
  shop: [
    '/property-images/commercial-shops/shop-01.jpg',
    '/property-images/commercial-shops/shop-02.jpg',
    '/property-images/commercial-shops/shop-03.jpg',
    '/property-images/commercial-shops/shop-04.jpg',
  ],
  // Offices & Workspaces
  office: [
    '/property-images/offices/office-01.jpg',
    '/property-images/offices/office-02.jpg',
    '/property-images/offices/office-03.jpg',
    '/property-images/offices/office-04.jpg',
  ],
  // Warehouses & Industrial
  warehouse: [
    '/property-images/warehouses/warehouse-01.jpg',
    '/property-images/warehouses/warehouse-02.jpg',
    '/property-images/warehouses/warehouse-03.jpg',
    '/property-images/warehouses/warehouse-04.jpg',
  ],
  // Farmhouses
  farmhouse: [
    '/property-images/farmhouses/farmhouse-01.jpg',
    '/property-images/farmhouses/farmhouse-02.jpg',
    '/property-images/farmhouses/farmhouse-03.jpg',
    '/property-images/farmhouses/farmhouse-04.jpg',
  ],
  // Residential Plots
  residential_plot: [
    '/property-images/residential-plots/plot-res-01.jpg',
    '/property-images/residential-plots/plot-res-02.jpg',
    '/property-images/residential-plots/plot-res-03.jpg',
    '/property-images/residential-plots/plot-res-04.jpg',
  ],
  // Commercial Plots
  commercial_plot: [
    '/property-images/commercial-plots/plot-com-01.jpg',
    '/property-images/commercial-plots/plot-com-02.jpg',
    '/property-images/commercial-plots/plot-com-03.jpg',
  ],
  // Holiday Homes
  holiday_home: [
    '/property-images/holiday-homes/holiday-01.jpg',
    '/property-images/holiday-homes/holiday-02.jpg',
    '/property-images/holiday-homes/holiday-03.jpg',
    '/property-images/holiday-homes/holiday-04.jpg',
    '/images/cottage_shimla.jpg',
  ],
  // Guest Houses
  guest_house: [
    '/property-images/guest-houses/guest-01.jpg',
    '/property-images/guest-houses/guest-02.jpg',
    '/property-images/guest-houses/guest-03.jpg',
    '/property-images/guest-houses/guest-04.jpg',
  ],
};

export function selectCuratedPhoto(
  state: TargetState,
  category: string,
  subtype: string,
  index: number
): string[] {
  let poolKey = 'family_home';

  if (category === 'commercial') {
    if (subtype === 'warehouse' || subtype === 'industrial_space') {
      poolKey = 'warehouse';
    } else if (subtype === 'shop' || subtype === 'showroom' || subtype === 'retail_space') {
      poolKey = 'shop';
    } else {
      poolKey = 'office';
    }
  } else if (category === 'plots_land') {
    if (subtype === 'farmhouse') {
      poolKey = 'farmhouse';
    } else if (subtype === 'commercial_plot') {
      poolKey = 'commercial_plot';
    } else {
      poolKey = 'residential_plot';
    }
  } else if (category === 'hospitality') {
    if (subtype === 'guest_house') {
      poolKey = 'guest_house';
    } else {
      poolKey = 'holiday_home';
    }
  } else {
    // Residential
    if (subtype === 'studio' || subtype === '1rk') {
      poolKey = 'studio';
    } else if (subtype === 'pg_accommodation' || subtype === 'hostel' || subtype === 'shared_accommodation') {
      poolKey = 'pg_hostel';
    } else if (subtype === 'villa') {
      poolKey = 'villa';
    } else if (subtype === 'penthouse') {
      poolKey = 'penthouse';
    } else if (subtype === 'independent_house' || subtype === 'builder_floor' || subtype === 'duplex') {
      poolKey = 'independent_house';
    } else if (subtype === '1bhk') {
      poolKey = 'apartment_1bhk';
    } else {
      poolKey = 'family_home';
    }
  }

  const pool = CATEGORY_IMAGE_POOLS[poolKey] || CATEGORY_IMAGE_POOLS.family_home;
  const primaryIndex = index % pool.length;
  const secondaryIndex = (index + 1) % pool.length;

  return [pool[primaryIndex], pool[secondaryIndex]];
}

const AMENITY_PALETTES = [
  ['Power Backup', 'Gated Security', 'Lift', 'Dedicated Parking', 'Municipal Water Supply', 'Piped Gas', 'Wi-Fi'],
  ['Air Conditioning', 'Balcony', 'Heating', 'Attached Bathroom', 'Gated Security', 'Dedicated Parking'],
  ['Lift', 'Dedicated Parking', 'Wi-Fi', 'Security', 'Laundry', 'Municipal Water Supply'],
  ['Gated Security', 'Pet Friendly', 'Balcony', 'Kitchen', 'Power Backup', 'Dedicated Parking'],
  ['Wi-Fi', 'Attached Bathroom', 'Security', 'Shared Accommodation', 'Municipal Water Supply'],
  ['Power Backup', 'Dedicated Parking', 'Fire Safety', 'High-Speed Elevators', 'CCTV Surveillance']
];

export function buildFiveRegionCatalog(): Property[] {
  const catalog: Property[] = [];
  let seq = 1;

  for (const region of FIVE_REGIONS) {
    for (let cIdx = 0; cIdx < region.cities.length; cIdx++) {
      const city = region.cities[cIdx];

      // Each city gets diverse representations across categories & intents
      const archetypeProfiles = [
        // 1. Budget / Ultra-Affordable Rental
        {
          category: 'residential' as const,
          subtype: cIdx % 2 === 0 ? '1rk' : 'pg_accommodation',
          subtypeLabel: cIdx % 2 === 0 ? '1 RK Clean Compact Studio' : 'Verified Single Bed / PG Stay',
          intent: 'rent' as const,
          bedrooms: cIdx % 2 === 0 ? 1 : 0,
          bathrooms: 1,
          balconies: 0,
          carpetArea: 180 + ((cIdx * 25) % 150),
          rent: cIdx % 3 === 0 ? 3800 : 7500 + ((cIdx * 450) % 2000), // ultra-affordable or budget
          salePrice: undefined,
          furnishing: 'semi_furnished' as FurnishingStatus,
          tenantPref: 'students' as TenantPreference,
          petPolicy: 'not_allowed' as const,
          parking: 'Open 2-Wheeler Parking',
          floor: 2,
          totalFloors: 3
        },
        // 2. Core Family Mid-Range Rental (2 BHK)
        {
          category: 'residential' as const,
          subtype: '2bhk',
          subtypeLabel: '2 BHK Modern Family Floor',
          intent: 'rent' as const,
          bedrooms: 2,
          bathrooms: 2,
          balconies: 2,
          carpetArea: 850 + ((cIdx * 45) % 400),
          rent: 14000 + ((cIdx * 1500) % 18000), // ₹14,000 to ₹32,000
          salePrice: undefined,
          furnishing: (cIdx % 2 === 0) ? ('semi_furnished' as FurnishingStatus) : ('fully_furnished' as FurnishingStatus),
          tenantPref: 'family' as TenantPreference,
          petPolicy: 'allowed' as const,
          parking: '1 Reserved Stilt Parking',
          floor: 2,
          totalFloors: 4
        },
        // 3. Premium / Luxury Residence (Villa / Penthouse / Duplex / 4BHK)
        {
          category: 'residential' as const,
          subtype: (cIdx % 4 === 0) ? 'villa' : (cIdx % 4 === 1) ? 'penthouse' : (cIdx % 4 === 2) ? 'duplex' : '4bhk',
          subtypeLabel: (cIdx % 4 === 0) ? 'Luxury Architectural Villa' : (cIdx % 4 === 1) ? 'Sky Penthouse with Terrace' : (cIdx % 4 === 2) ? 'Duplex Kothi' : '4 BHK Regal Apartment',
          intent: 'rent' as const,
          bedrooms: 4 + (cIdx % 2),
          bathrooms: 4 + (cIdx % 2),
          balconies: 3,
          carpetArea: 1800 + ((cIdx * 180) % 1800),
          rent: 48000 + ((cIdx * 8500) % 110000), // covers premium (40-60k), luxury (60-100k) & ultra-luxury (100k+)
          salePrice: undefined,
          furnishing: 'fully_furnished' as FurnishingStatus,
          tenantPref: 'family' as TenantPreference,
          petPolicy: 'allowed' as const,
          parking: '2 Covered Multi-Car Parking',
          floor: (cIdx % 4 === 1) ? 12 : 1,
          totalFloors: (cIdx % 4 === 1) ? 12 : 3
        },
        // 4. Commercial Opportunity (Office / Showroom / Shop / Co-working)
        {
          category: 'commercial' as const,
          subtype: (cIdx % 4 === 0) ? 'office_space' : (cIdx % 4 === 1) ? 'showroom' : (cIdx % 4 === 2) ? 'shop' : 'coworking_space',
          subtypeLabel: (cIdx % 4 === 0) ? 'Corporate Grade Office Suite' : (cIdx % 4 === 1) ? 'Prime Commercial Showroom' : (cIdx % 4 === 2) ? 'Main Market Retail Shop' : 'Serviced Co-working Space',
          intent: (cIdx % 3 === 0) ? ('sale' as const) : ('rent' as const),
          bedrooms: 0,
          bathrooms: 2,
          balconies: 0,
          carpetArea: 400 + ((cIdx * 250) % 3200),
          rent: (cIdx % 3 === 0) ? 0 : 28000 + ((cIdx * 6500) % 85000),
          salePrice: (cIdx % 3 === 0) ? 6500000 + ((cIdx * 1800000) % 45000000) : undefined,
          furnishing: 'unfurnished' as FurnishingStatus,
          tenantPref: 'working_professionals' as TenantPreference,
          petPolicy: 'not_allowed' as const,
          parking: 'Customer & Staff Parking Available',
          floor: 1,
          totalFloors: 4
        },
        // 5. Land / Plot / Farmhouse (Separate Purchase Price System)
        {
          category: 'plots_land' as const,
          subtype: (cIdx % 3 === 0) ? 'residential_plot' : (cIdx % 3 === 1) ? 'agricultural_land' : 'farmhouse',
          subtypeLabel: (cIdx % 3 === 0) ? 'Approved Freehold Residential Plot' : (cIdx % 3 === 1) ? 'Fertile Agricultural Acreage' : 'Gated Mountain / Country Farmhouse',
          intent: 'sale' as const,
          bedrooms: (cIdx % 3 === 2) ? 3 : 0,
          bathrooms: (cIdx % 3 === 2) ? 3 : 0,
          balconies: (cIdx % 3 === 2) ? 2 : 0,
          carpetArea: 1200 + ((cIdx * 450) % 10000),
          rent: 0,
          salePrice: 2200000 + ((cIdx * 2400000) % 78000000), // ₹22L to ₹8.0 Crores
          furnishing: 'unfurnished' as FurnishingStatus,
          tenantPref: 'any' as TenantPreference,
          petPolicy: 'case_by_case' as const,
          parking: 'Spacious Boundary Plot',
          floor: 0,
          totalFloors: (cIdx % 3 === 2) ? 2 : 0
        },
        // 6. Hospitality & Holiday Living (Guest House / Holiday Home)
        {
          category: 'hospitality' as const,
          subtype: (cIdx % 2 === 0) ? 'holiday_home' : 'guest_house',
          subtypeLabel: (cIdx % 2 === 0) ? 'Scenic Holiday Chalet / Retreat' : 'Operational Verified Guest House',
          intent: (cIdx % 3 === 0) ? ('sale' as const) : ('rent' as const),
          bedrooms: 3 + (cIdx % 3),
          bathrooms: 3 + (cIdx % 3),
          balconies: 2,
          carpetArea: 1400 + ((cIdx * 120) % 1600),
          rent: (cIdx % 3 === 0) ? 0 : 35000 + ((cIdx * 5000) % 45000),
          salePrice: (cIdx % 3 === 0) ? 9500000 + ((cIdx * 1500000) % 35000000) : undefined,
          furnishing: 'fully_furnished' as FurnishingStatus,
          tenantPref: 'any' as TenantPreference,
          petPolicy: 'allowed' as const,
          parking: 'Private Driveway & Guest Parking',
          floor: 1,
          totalFloors: 2
        }
      ];

      for (let pIdx = 0; pIdx < archetypeProfiles.length; pIdx++) {
        const arch = archetypeProfiles[pIdx];
        const locality = city.localities[(cIdx + pIdx) % city.localities.length];
        const propId = `gs-nor-${region.id.substring(0, 2)}-${String(seq).padStart(4, '0')}`;
        const photos = selectCuratedPhoto(region.state, arch.category, arch.subtype, seq);
        const amenities = AMENITY_PALETTES[(cIdx + pIdx) % AMENITY_PALETTES.length];
        const builtUpArea = Math.round(arch.carpetArea * 1.22);
        
        // MTA 2021 statutory deposit: 2 months for residential rent, 6 months for commercial
        const deposit = arch.intent === 'rent'
          ? Math.round(arch.rent * (arch.category === 'commercial' ? 3 : 2))
          : 0;

        const provenance: PropertyProvenance = {
          provider: 'griha_saathi_demo_engine',
          providerName: `${region.displayName} Northern Real Estate Catalog`,
          providerListingId: propId,
          sourceUrl: `/#find-property?id=${propId}`,
          sourcePublishedAt: '2026-02-15T00:00:00.000Z',
          sourceModifiedAt: '2026-03-01T00:00:00.000Z',
          lastRetrievedAt: new Date().toISOString(),
          availabilityConfirmationStatus: 'confirmed',
          isFresh: true,
          verificationBreakdown: {
            hasTitleDeedCheck: true,
            hasPhysicalInspection: true,
            hasIdentityVerification: true,
            notes: `Catalog entry under ${region.regulatoryAuthority}`
          }
        };

        const property: Property = {
          id: propId,
          title: `${arch.subtypeLabel} in ${locality}`,
          description: `Exceptional ${arch.subtypeLabel.toLowerCase()} strategically located in ${locality}, ${city.name}. Features ${arch.carpetArea} sq.ft. carpet area (${builtUpArea} sq.ft. built-up) with ${arch.parking}. Architected with high thermal efficiency and statutory compliance registered under ${region.regulatoryAuthority}.`,
          state: region.state,
          district: city.district,
          city: city.name,
          locality,
          pincode: `${100000 + ((seq * 1337) % 899999)}`,
          propertyCategory: arch.category,
          propertySubtype: arch.subtype,
          propertyType: (arch.category === 'commercial' || arch.category === 'plots_land') 
            ? 'independent_house' 
            : (arch.bedrooms === 1 ? '1bhk' : arch.bedrooms === 2 ? '2bhk' : arch.bedrooms === 3 ? '3bhk' : arch.bedrooms && arch.bedrooms >= 4 ? '4bhk_plus' : 'studio'),
          propertyTypeLabel: arch.subtypeLabel,
          listingIntent: arch.intent,
          rentPerMonth: arch.rent,
          salePrice: arch.salePrice,
          securityDeposit: deposit,
          maintenanceCharges: arch.intent === 'rent' ? Math.round(arch.rent * 0.08) : 0,
          bedrooms: arch.bedrooms > 0 ? arch.bedrooms : undefined,
          bathrooms: arch.bathrooms > 0 ? arch.bathrooms : undefined,
          balconies: arch.balconies > 0 ? arch.balconies : undefined,
          carpetAreaSqFt: arch.carpetArea,
          builtUpAreaSqFt: builtUpArea,
          areaSqFt: arch.carpetArea,
          furnishing: arch.furnishing,
          tenantPreference: arch.tenantPref,
          parking: arch.parking,
          petPolicy: arch.petPolicy,
          floorNumber: arch.floor,
          totalFloors: arch.totalFloors,
          amenities,
          photos,
          verificationStatus: 'unverified',
          ownerId: `demo-owner-${seq}`,
          demoOwnerLabel: `Catalog Provider ID #GS-${1000 + seq}`,
          availableFrom: `2026-0${1 + (seq % 5)}-01`,
          createdAt: '2026-02-10T08:00:00.000Z',
          updatedAt: '2026-03-01T08:00:00.000Z',
          dataSource: 'owner_submission',
          isDemo: true,
          provenance
        };

        catalog.push(property);
        seq++;
      }
    }
  }

  return catalog;
}

export const FIVE_REGION_INVENTORY: readonly Property[] = buildFiveRegionCatalog();

export interface FiveRegionSearchFilters {
  state?: string;
  city?: string;
  district?: string;
  locality?: string;
  propertyCategory?: string;
  propertySubtype?: string;
  propertyType?: string;
  listingIntent?: 'all' | 'rent' | 'sale';
  minRent?: number;
  maxRent?: number;
  minSalePrice?: number;
  maxSalePrice?: number;
  bedrooms?: number | 'all';
  bathrooms?: number | 'all';
  furnishing?: string;
  tenantPreference?: string;
  petFriendlyOnly?: boolean;
  parkingRequired?: boolean;
  minArea?: number;
  maxArea?: number;
  amenities?: string[];
  searchText?: string;
  sortBy?: 'rent_asc' | 'rent_desc' | 'price_asc' | 'price_desc' | 'newest' | 'area_asc' | 'area_desc' | 'relevance';
  page?: number;
  limit?: number;
}

export interface FiveRegionSearchResult {
  properties: Property[];
  total: number;
  totalPages: number;
  page: number;
  limit: number;
  appliedFilters: FiveRegionSearchFilters;
}

export function searchFiveRegionInventory(filters: FiveRegionSearchFilters = {}): FiveRegionSearchResult {
  let list = [...FIVE_REGION_INVENTORY];

  // 1. State / Region Filtering
  if (filters.state && filters.state !== 'all') {
    const targetState = filters.state.trim().toLowerCase();
    list = list.filter((p) => {
      const pState = p.state.toLowerCase();
      if (targetState === 'delhi ncr' || targetState === 'delhi') {
        return pState === 'delhi' || pState === 'delhi ncr' || pState.includes('delhi');
      }
      return pState === targetState;
    });
  }

  // 2. City Filtering
  if (filters.city && filters.city.trim() && filters.city !== 'all') {
    const qCity = filters.city.trim().toLowerCase();
    list = list.filter((p) => p.city.toLowerCase() === qCity || p.city.toLowerCase().includes(qCity));
  }

  // 3. District Filtering
  if (filters.district && filters.district.trim() && filters.district !== 'all') {
    const qDist = filters.district.trim().toLowerCase();
    list = list.filter((p) => p.district?.toLowerCase().includes(qDist));
  }

  // 4. Locality Filtering
  if (filters.locality && filters.locality.trim() && filters.locality !== 'all') {
    const qLoc = filters.locality.trim().toLowerCase();
    list = list.filter((p) => p.locality.toLowerCase().includes(qLoc));
  }

  // 5. Listing Intent (Rent vs Sale)
  if (filters.listingIntent && filters.listingIntent !== 'all') {
    list = list.filter((p) => p.listingIntent === filters.listingIntent);
  }

  // 6. Property Category
  if (filters.propertyCategory && filters.propertyCategory !== 'all') {
    list = list.filter((p) => p.propertyCategory === filters.propertyCategory);
  }

  // 7. Property Subtype
  if (filters.propertySubtype && filters.propertySubtype !== 'all') {
    list = list.filter((p) => p.propertySubtype === filters.propertySubtype);
  }

  // 8. Rental Budget Boundaries (Applies when listing is for rent)
  if (filters.minRent !== undefined && filters.minRent > 0) {
    list = list.filter((p) => p.listingIntent === 'rent' ? p.rentPerMonth >= filters.minRent! : true);
  }
  if (filters.maxRent !== undefined && filters.maxRent > 0) {
    list = list.filter((p) => p.listingIntent === 'rent' ? p.rentPerMonth <= filters.maxRent! : true);
  }

  // 9. Sale Price Boundaries (Applies when listing is for sale)
  if (filters.minSalePrice !== undefined && filters.minSalePrice > 0) {
    list = list.filter((p) => p.listingIntent === 'sale' ? (p.salePrice ?? 0) >= filters.minSalePrice! : true);
  }
  if (filters.maxSalePrice !== undefined && filters.maxSalePrice > 0) {
    list = list.filter((p) => p.listingIntent === 'sale' ? (p.salePrice ?? 0) <= filters.maxSalePrice! : true);
  }

  // 10. Bedrooms
  if (filters.bedrooms !== undefined && filters.bedrooms !== 'all') {
    const bCount = Number(filters.bedrooms);
    if (!isNaN(bCount)) {
      if (bCount >= 4) {
        list = list.filter((p) => (p.bedrooms ?? 0) >= 4);
      } else {
        list = list.filter((p) => p.bedrooms === bCount);
      }
    }
  }

  // 11. Bathrooms
  if (filters.bathrooms !== undefined && filters.bathrooms !== 'all') {
    const bathCount = Number(filters.bathrooms);
    if (!isNaN(bathCount)) {
      list = list.filter((p) => (p.bathrooms ?? 0) >= bathCount);
    }
  }

  // 12. Furnishing
  if (filters.furnishing && filters.furnishing !== 'all') {
    list = list.filter((p) => p.furnishing === filters.furnishing);
  }

  // 13. Tenant Preference
  if (filters.tenantPreference && filters.tenantPreference !== 'all') {
    list = list.filter((p) => p.tenantPreference === filters.tenantPreference || p.tenantPreference === 'any');
  }

  // 14. Pet Friendly
  if (filters.petFriendlyOnly) {
    list = list.filter((p) => p.petPolicy === 'allowed');
  }

  // 15. Parking Required
  if (filters.parkingRequired) {
    list = list.filter((p) => p.parking && !p.parking.toLowerCase().includes('none'));
  }

  // 16. Area Boundaries
  if (filters.minArea !== undefined && filters.minArea > 0) {
    list = list.filter((p) => (p.areaSqFt ?? 0) >= filters.minArea!);
  }
  if (filters.maxArea !== undefined && filters.maxArea > 0) {
    list = list.filter((p) => (p.areaSqFt ?? 0) <= filters.maxArea!);
  }

  // 17. Amenities
  if (filters.amenities && filters.amenities.length > 0) {
    list = list.filter((p) => {
      const pAmenities = (p.amenities || []).map((a) => a.toLowerCase().trim());
      return filters.amenities!.every((reqA) => pAmenities.includes(reqA.toLowerCase().trim()));
    });
  }

  // 18. Omnisearch Text Search
  if (filters.searchText && filters.searchText.trim()) {
    const q = filters.searchText.trim().toLowerCase();
    list = list.filter((p) =>
      p.title.toLowerCase().includes(q) ||
      p.description.toLowerCase().includes(q) ||
      p.city.toLowerCase().includes(q) ||
      p.locality.toLowerCase().includes(q) ||
      p.state.toLowerCase().includes(q) ||
      p.propertyTypeLabel?.toLowerCase().includes(q) ||
      p.district?.toLowerCase().includes(q)
    );
  }

  // 19. Sorting Logic
  const sort = filters.sortBy || 'relevance';
  list.sort((a, b) => {
    if (sort === 'rent_asc') {
      const pA = a.listingIntent === 'sale' ? (a.salePrice ?? 0) : a.rentPerMonth;
      const pB = b.listingIntent === 'sale' ? (b.salePrice ?? 0) : b.rentPerMonth;
      return pA - pB;
    }
    if (sort === 'rent_desc') {
      const pA = a.listingIntent === 'sale' ? (a.salePrice ?? 0) : a.rentPerMonth;
      const pB = b.listingIntent === 'sale' ? (b.salePrice ?? 0) : b.rentPerMonth;
      return pB - pA;
    }
    if (sort === 'price_asc') {
      return (a.salePrice ?? a.rentPerMonth) - (b.salePrice ?? b.rentPerMonth);
    }
    if (sort === 'price_desc') {
      return (b.salePrice ?? b.rentPerMonth) - (a.salePrice ?? a.rentPerMonth);
    }
    if (sort === 'area_asc') {
      return (a.areaSqFt ?? 0) - (b.areaSqFt ?? 0);
    }
    if (sort === 'area_desc') {
      return (b.areaSqFt ?? 0) - (a.areaSqFt ?? 0);
    }
    if (sort === 'newest') {
      return Date.parse(b.createdAt) - Date.parse(a.createdAt);
    }
    // relevance
    return a.id.localeCompare(b.id);
  });

  const total = list.length;
  const page = filters.page && filters.page > 0 ? filters.page : 1;
  const limit = filters.limit && filters.limit > 0 ? filters.limit : 12;
  const totalPages = Math.ceil(total / limit) || 1;
  const startIndex = (page - 1) * limit;
  const paginated = list.slice(startIndex, startIndex + limit);

  return {
    properties: paginated,
    total,
    totalPages,
    page,
    limit,
    appliedFilters: filters
  };
}
