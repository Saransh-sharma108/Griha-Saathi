import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, 
  MapPin, 
  SlidersHorizontal, 
  Filter, 
  RotateCcw, 
  Home, 
  Building2, 
  LandPlot, 
  Palmtree, 
  Bed, 
  Bath, 
  Square, 
  CheckCircle2, 
  Info, 
  Car, 
  Dog, 
  X, 
  ChevronRight, 
  ExternalLink, 
  LayoutGrid, 
  List, 
  Sparkles,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowUpDown,
  Tag
} from 'lucide-react';
import { 
  Property, 
  SupportedLanguage, 
  UserProfile, 
  FurnishingStatus, 
  TenantPreference 
} from '@shared/types';
import { NavSection } from '../components/Header';
import { 
  FIVE_REGIONS, 
  PROPERTY_CATEGORIES, 
  RENTAL_BUDGET_BANDS, 
  SALE_PRICE_BANDS, 
  searchFiveRegionInventory, 
  FiveRegionSearchFilters 
} from '../data/fiveRegionInventory';

export interface FindPropertyPageProps {
  initialFilters?: { 
    state?: string; 
    propertyType?: string; 
    maxRent?: string; 
    city?: string; 
    locality?: string; 
  };
  language?: SupportedLanguage;
  onNavigate?: (section: NavSection) => void;
  user?: UserProfile | null;
  token?: string | null;
  onOpenAuth?: () => void;
}

const COMMON_AMENITY_OPTIONS = [
  'Power Backup',
  'Gated Security',
  'Lift',
  'Dedicated Parking',
  'Municipal Water Supply',
  'Piped Gas',
  'Air Conditioning',
  'Balcony',
  'Wi-Fi',
  'Heating'
];

export const FindPropertyPage: React.FC<FindPropertyPageProps> = ({
  initialFilters,
  onNavigate,
  onOpenAuth,
}) => {
  // Discovery Mode: Five-Region Catalog vs First-Party Live Registry
  const [catalogMode, setCatalogMode] = useState<'five_region' | 'first_party'>('five_region');

  // Core Geographic & Category Filters
  const [selectedState, setSelectedState] = useState<string>(initialFilters?.state || 'all');
  const [selectedCity, setSelectedCity] = useState<string>(initialFilters?.city || 'all');
  const [localityQuery, setLocalityQuery] = useState<string>(initialFilters?.locality || '');
  const [searchText, setSearchText] = useState<string>('');
  const [listingIntent, setListingIntent] = useState<'all' | 'rent' | 'sale'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedSubtype, setSelectedSubtype] = useState<string>('all');

  // Budget & Financial Filters
  const [minRent, setMinRent] = useState<number | ''>('');
  const [maxRent, setMaxRent] = useState<number | ''>(
    initialFilters?.maxRent ? Number(initialFilters.maxRent) : ''
  );
  const [minSalePrice, setMinSalePrice] = useState<number | ''>('');
  const [maxSalePrice, setMaxSalePrice] = useState<number | ''>('');
  const [activeRentalBudgetBand, setActiveRentalBudgetBand] = useState<string | null>(null);
  const [activeSalePriceBand, setActiveSalePriceBand] = useState<string | null>(null);

  // Configuration Filters
  const [selectedBedrooms, setSelectedBedrooms] = useState<number | 'all'>('all');
  const [selectedBathrooms, setSelectedBathrooms] = useState<number | 'all'>('all');
  const [selectedFurnishing, setSelectedFurnishing] = useState<string>('all');
  const [selectedTenantPref, setSelectedTenantPref] = useState<string>('all');
  const [petFriendlyOnly, setPetFriendlyOnly] = useState<boolean>(false);
  const [parkingRequired, setParkingRequired] = useState<boolean>(false);
  const [minArea, setMinArea] = useState<number | ''>('');
  const [maxArea, setMaxArea] = useState<number | ''>('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  // View & Pagination
  const [sortBy, setSortBy] = useState<
    'relevance' | 'rent_asc' | 'rent_desc' | 'price_asc' | 'price_desc' | 'newest' | 'area_asc' | 'area_desc'
  >('relevance');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [selectedPropertyModal, setSelectedPropertyModal] = useState<Property | null>(null);
  const [modalPhotoIndex, setModalPhotoIndex] = useState<number>(0);

  // First-Party Backend Registry State (when user toggles to live submissions)
  const [firstPartyProperties, setFirstPartyProperties] = useState<Property[]>([]);
  const [firstPartyLoading, setFirstPartyLoading] = useState<boolean>(false);
  const [firstPartyError, setFirstPartyError] = useState<string | null>(null);

  // Dynamic Cities derived from selected state
  const availableCities = useMemo(() => {
    if (selectedState === 'all') {
      return FIVE_REGIONS.flatMap((r) => r.cities);
    }
    const region = FIVE_REGIONS.find((r) => {
      const s = r.state.toLowerCase();
      const target = selectedState.toLowerCase();
      if (target === 'delhi' || target === 'delhi ncr') {
        return s === 'delhi';
      }
      return s === target;
    });
    return region ? region.cities : [];
  }, [selectedState]);

  // Handle State Change with Automatic City Validation
  const handleStateChange = (newState: string) => {
    setSelectedState(newState);
    if (newState !== 'all') {
      const region = FIVE_REGIONS.find((r) => {
        const s = r.state.toLowerCase();
        const target = newState.toLowerCase();
        if (target === 'delhi' || target === 'delhi ncr') {
          return s === 'delhi';
        }
        return s === target;
      });
      if (region && !region.cities.some((c) => c.name.toLowerCase() === selectedCity.toLowerCase())) {
        setSelectedCity('all');
      }
    }
    setCurrentPage(1);
  };

  // Dynamic Subtypes based on selected Category
  const availableSubtypes = useMemo(() => {
    if (selectedCategory === 'all') {
      return PROPERTY_CATEGORIES.flatMap((c) => c.subtypes);
    }
    const cat = PROPERTY_CATEGORIES.find((c) => c.id === selectedCategory);
    return cat ? cat.subtypes : [];
  }, [selectedCategory]);

  // Quick Rental Budget Band Click
  const handleSelectRentalBudgetBand = (bandId: string) => {
    if (activeRentalBudgetBand === bandId) {
      setActiveRentalBudgetBand(null);
      setMinRent('');
      setMaxRent('');
    } else {
      const band = RENTAL_BUDGET_BANDS.find((b) => b.id === bandId);
      if (band) {
        setActiveRentalBudgetBand(bandId);
        setMinRent(band.min);
        setMaxRent(band.max);
        setListingIntent('rent');
      }
    }
    setCurrentPage(1);
  };

  // Quick Sale Price Band Click
  const handleSelectSalePriceBand = (bandId: string) => {
    if (activeSalePriceBand === bandId) {
      setActiveSalePriceBand(null);
      setMinSalePrice('');
      setMaxSalePrice('');
    } else {
      const band = SALE_PRICE_BANDS.find((b) => b.id === bandId);
      if (band) {
        setActiveSalePriceBand(bandId);
        setMinSalePrice(band.min);
        setMaxSalePrice(band.max);
        setListingIntent('sale');
      }
    }
    setCurrentPage(1);
  };

  // Toggle Amenity Selection
  const toggleAmenity = (amenity: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
    setCurrentPage(1);
  };

  // Reset All Filters
  const handleResetFilters = () => {
    setSelectedState('all');
    setSelectedCity('all');
    setLocalityQuery('');
    setSearchText('');
    setListingIntent('all');
    setSelectedCategory('all');
    setSelectedSubtype('all');
    setMinRent('');
    setMaxRent('');
    setMinSalePrice('');
    setMaxSalePrice('');
    setActiveRentalBudgetBand(null);
    setActiveSalePriceBand(null);
    setSelectedBedrooms('all');
    setSelectedBathrooms('all');
    setSelectedFurnishing('all');
    setSelectedTenantPref('all');
    setPetFriendlyOnly(false);
    setParkingRequired(false);
    setMinArea('');
    setMaxArea('');
    setSelectedAmenities([]);
    setSortBy('relevance');
    setCurrentPage(1);
  };

  // Fetch First-Party registry listings when user switches mode
  useEffect(() => {
    if (catalogMode === 'first_party') {
      setFirstPartyLoading(true);
      setFirstPartyError(null);
      fetch('/api/properties?limit=50&onlyVerified=false')
        .then((res) => res.json())
        .then((data) => {
          if (data.success && Array.isArray(data.properties)) {
            setFirstPartyProperties(data.properties);
          } else {
            setFirstPartyProperties([]);
          }
        })
        .catch((err) => {
          setFirstPartyError('Unable to connect to live property registry API.');
        })
        .finally(() => setFirstPartyLoading(false));
    }
  }, [catalogMode]);

  // Execute Five-Region Search
  const searchResults = useMemo(() => {
    if (catalogMode === 'first_party') {
      // Filter the first party properties on client
      let filtered = [...firstPartyProperties];
      if (selectedState !== 'all') {
        filtered = filtered.filter((p) => p.state.toLowerCase() === selectedState.toLowerCase());
      }
      if (selectedCity !== 'all') {
        filtered = filtered.filter((p) => p.city.toLowerCase().includes(selectedCity.toLowerCase()));
      }
      return {
        properties: filtered,
        total: filtered.length,
        totalPages: Math.ceil(filtered.length / 12) || 1,
        page: currentPage,
        limit: 12
      };
    }

    const filters: FiveRegionSearchFilters = {
      state: selectedState,
      city: selectedCity === 'all' ? undefined : selectedCity,
      locality: localityQuery.trim() || undefined,
      searchText: searchText.trim() || undefined,
      listingIntent,
      propertyCategory: selectedCategory === 'all' ? undefined : selectedCategory,
      propertySubtype: selectedSubtype === 'all' ? undefined : selectedSubtype,
      minRent: typeof minRent === 'number' ? minRent : undefined,
      maxRent: typeof maxRent === 'number' ? maxRent : undefined,
      minSalePrice: typeof minSalePrice === 'number' ? minSalePrice : undefined,
      maxSalePrice: typeof maxSalePrice === 'number' ? maxSalePrice : undefined,
      bedrooms: selectedBedrooms,
      bathrooms: selectedBathrooms,
      furnishing: selectedFurnishing === 'all' ? undefined : selectedFurnishing,
      tenantPreference: selectedTenantPref === 'all' ? undefined : selectedTenantPref,
      petFriendlyOnly,
      parkingRequired,
      minArea: typeof minArea === 'number' ? minArea : undefined,
      maxArea: typeof maxArea === 'number' ? maxArea : undefined,
      amenities: selectedAmenities.length > 0 ? selectedAmenities : undefined,
      sortBy,
      page: currentPage,
      limit: 12
    };

    return searchFiveRegionInventory(filters);
  }, [
    catalogMode,
    firstPartyProperties,
    selectedState,
    selectedCity,
    localityQuery,
    searchText,
    listingIntent,
    selectedCategory,
    selectedSubtype,
    minRent,
    maxRent,
    minSalePrice,
    maxSalePrice,
    selectedBedrooms,
    selectedBathrooms,
    selectedFurnishing,
    selectedTenantPref,
    petFriendlyOnly,
    parkingRequired,
    minArea,
    maxArea,
    selectedAmenities,
    sortBy,
    currentPage
  ]);

  // Formatter for INR Currency
  const formatPrice = (property: Property) => {
    if (property.listingIntent === 'sale' && property.salePrice) {
      if (property.salePrice >= 10000000) {
        return `₹${(property.salePrice / 10000000).toFixed(2)} Cr`;
      }
      if (property.salePrice >= 100000) {
        return `₹${(property.salePrice / 100000).toFixed(1)} Lakhs`;
      }
      return `₹${property.salePrice.toLocaleString('en-IN')}`;
    }
    return `₹${property.rentPerMonth.toLocaleString('en-IN')}`;
  };

  // Active Filter Badges list
  const activeFilters = useMemo(() => {
    const list: { label: string; onRemove: () => void }[] = [];
    if (selectedState !== 'all') {
      list.push({ label: `State: ${selectedState}`, onRemove: () => handleStateChange('all') });
    }
    if (selectedCity !== 'all') {
      list.push({ label: `City: ${selectedCity}`, onRemove: () => setSelectedCity('all') });
    }
    if (listingIntent !== 'all') {
      list.push({ label: `Intent: ${listingIntent.toUpperCase()}`, onRemove: () => setListingIntent('all') });
    }
    if (selectedCategory !== 'all') {
      const cat = PROPERTY_CATEGORIES.find((c) => c.id === selectedCategory);
      list.push({ label: `Category: ${cat?.label || selectedCategory}`, onRemove: () => setSelectedCategory('all') });
    }
    if (selectedSubtype !== 'all') {
      const sub = availableSubtypes.find((s) => s.id === selectedSubtype);
      list.push({ label: `Type: ${sub?.label || selectedSubtype}`, onRemove: () => setSelectedSubtype('all') });
    }
    if (selectedBedrooms !== 'all') {
      list.push({ label: `${selectedBedrooms} BHK`, onRemove: () => setSelectedBedrooms('all') });
    }
    if (selectedFurnishing !== 'all') {
      list.push({ label: `Furnishing: ${selectedFurnishing.replace('_', ' ')}`, onRemove: () => setSelectedFurnishing('all') });
    }
    if (minRent || maxRent) {
      list.push({
        label: `Rent: ₹${minRent || 0} - ₹${maxRent || '∞'}`,
        onRemove: () => { setMinRent(''); setMaxRent(''); setActiveRentalBudgetBand(null); }
      });
    }
    if (minSalePrice || maxSalePrice) {
      list.push({
        label: `Price: ₹${minSalePrice || 0} - ₹${maxSalePrice || '∞'}`,
        onRemove: () => { setMinSalePrice(''); setMaxSalePrice(''); setActiveSalePriceBand(null); }
      });
    }
    if (petFriendlyOnly) {
      list.push({ label: 'Pet Friendly', onRemove: () => setPetFriendlyOnly(false) });
    }
    if (parkingRequired) {
      list.push({ label: 'Parking Required', onRemove: () => setParkingRequired(false) });
    }
    selectedAmenities.forEach((a) => {
      list.push({ label: a, onRemove: () => toggleAmenity(a) });
    });
    return list;
  }, [
    selectedState,
    selectedCity,
    listingIntent,
    selectedCategory,
    selectedSubtype,
    selectedBedrooms,
    selectedFurnishing,
    minRent,
    maxRent,
    minSalePrice,
    maxSalePrice,
    petFriendlyOnly,
    parkingRequired,
    selectedAmenities,
    availableSubtypes
  ]);

  return (
    <div className="gs-page-shell" style={{ padding: '2rem 0 5rem', minHeight: '85vh' }}>
      <div className="gs-container">
        
        {/* =========================================================================
            HEADER & REGION SELECTION PANEL
            ========================================================================= */}
        <div style={{ marginBottom: '1.75rem' }}>
          {/* Top Row: Title + Discovery Catalog Switcher */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                <span className="gs-badge gs-badge-forest" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Sparkles size={13} />
                  <span>Northern India Multi-Region Network</span>
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)' }}>
                  Model Tenancy Act 2021 & RERA Framework
                </span>
              </div>
              <h1 style={{ fontFamily: 'var(--gs-font-heading)', fontSize: '1.85rem', fontWeight: 800, color: 'var(--gs-text-primary)', margin: 0, letterSpacing: '-0.02em' }}>
                Find Your Ideal Space
              </h1>
            </div>

            {/* Catalog Mode Selector (Demonstration 5-Region Catalog vs First-Party Live Registry) */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(7, 20, 15, 0.75)', padding: '0.3rem', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
              <button
                type="button"
                onClick={() => setCatalogMode('five_region')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--gs-radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: catalogMode === 'five_region' ? 700 : 500,
                  backgroundColor: catalogMode === 'five_region' ? 'var(--gs-forest-mid)' : 'transparent',
                  color: catalogMode === 'five_region' ? '#FFFFFF' : 'var(--gs-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Five-Region Catalog (438 Listings)
              </button>
              <button
                type="button"
                onClick={() => setCatalogMode('first_party')}
                style={{
                  padding: '0.4rem 0.85rem',
                  borderRadius: 'var(--gs-radius-sm)',
                  fontSize: '0.82rem',
                  fontWeight: catalogMode === 'first_party' ? 700 : 500,
                  backgroundColor: catalogMode === 'first_party' ? 'var(--gs-forest-mid)' : 'transparent',
                  color: catalogMode === 'first_party' ? '#FFFFFF' : 'var(--gs-text-secondary)',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                Verified Direct Registry
              </button>
            </div>
          </div>

          {/* Quick 5-Region Pill Tabs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.4rem' }}>
            <button
              type="button"
              onClick={() => handleStateChange('all')}
              style={{
                padding: '0.45rem 0.95rem',
                borderRadius: '24px',
                fontSize: '0.85rem',
                fontWeight: selectedState === 'all' ? 700 : 500,
                backgroundColor: selectedState === 'all' ? 'var(--gs-accent)' : 'rgba(255, 255, 255, 0.05)',
                color: selectedState === 'all' ? '#FFFFFF' : 'var(--gs-text-primary)',
                border: selectedState === 'all' ? '1px solid var(--gs-accent-bright)' : '1px solid var(--gs-border)',
                whiteSpace: 'nowrap',
                cursor: 'pointer'
              }}
            >
              All 5 Regions
            </button>
            {FIVE_REGIONS.map((region) => {
              const isSelected = selectedState.toLowerCase() === region.state.toLowerCase() ||
                (selectedState.toLowerCase() === 'delhi ncr' && region.state === 'Delhi');
              return (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => handleStateChange(region.state)}
                  style={{
                    padding: '0.45rem 0.95rem',
                    borderRadius: '24px',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    backgroundColor: isSelected ? 'var(--gs-accent)' : 'rgba(255, 255, 255, 0.05)',
                    color: isSelected ? '#FFFFFF' : 'var(--gs-text-primary)',
                    border: isSelected ? '1px solid var(--gs-accent-bright)' : '1px solid var(--gs-border)',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem'
                  }}
                >
                  <MapPin size={13} color={isSelected ? '#FFFFFF' : 'var(--gs-accent-bright)'} />
                  <span>{region.displayName}</span>
                  <span style={{ fontSize: '0.72rem', opacity: 0.8, background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.35rem', borderRadius: '10px' }}>
                    {region.cities.length} cities
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* =========================================================================
            SEARCH & FILTERING CONSOLE CARD
            ========================================================================= */}
        <div 
          style={{
            backgroundColor: 'rgba(11, 30, 22, 0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid var(--gs-border)',
            borderRadius: 'var(--gs-radius-lg)',
            padding: '1.25rem',
            marginBottom: '1.75rem',
            boxShadow: 'var(--gs-shadow-md)'
          }}
        >
          {/* Row 1: Omnisearch + Intent Switch + Category Selector */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {/* Search Input */}
            <div style={{ position: 'relative', gridColumn: 'span 2' }}>
              <Search size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--gs-text-muted)' }} />
              <input
                type="text"
                placeholder="Search by locality, city, landmark, or features (e.g. Raj Bagh, Cyber City, 2 BHK, Villa...)"
                value={searchText}
                onChange={(e) => { setSearchText(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--gs-border)',
                  borderRadius: 'var(--gs-radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.9rem'
                }}
              />
              {searchText && (
                <button
                  type="button"
                  onClick={() => setSearchText('')}
                  style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--gs-text-muted)', cursor: 'pointer' }}
                >
                  <X size={15} />
                </button>
              )}
            </div>

            {/* Listing Intent Toggle: Rent vs Buy / Sale */}
            <div style={{ display: 'flex', alignItems: 'center', background: 'rgba(0, 0, 0, 0.25)', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)', padding: '0.2rem' }}>
              {(['all', 'rent', 'sale'] as const).map((intent) => (
                <button
                  key={intent}
                  type="button"
                  onClick={() => { setListingIntent(intent); setCurrentPage(1); }}
                  style={{
                    flex: 1,
                    padding: '0.5rem',
                    border: 'none',
                    borderRadius: 'var(--gs-radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: listingIntent === intent ? 700 : 500,
                    backgroundColor: listingIntent === intent ? 'var(--gs-forest-mid)' : 'transparent',
                    color: listingIntent === intent ? '#FFFFFF' : 'var(--gs-text-secondary)',
                    cursor: 'pointer',
                    textTransform: 'capitalize'
                  }}
                >
                  {intent === 'all' ? 'All Intent' : intent === 'rent' ? 'For Rent' : 'For Sale'}
                </button>
              ))}
            </div>

            {/* Property Category */}
            <div>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setSelectedSubtype('all'); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.75rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--gs-border)',
                  borderRadius: 'var(--gs-radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.88rem'
                }}
              >
                <option value="all" style={{ background: '#0B2016' }}>All Property Categories</option>
                {PROPERTY_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id} style={{ background: '#0B2016' }}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Cascading Region & City + Subtype + Bedroom Quick Filter */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
            {/* State Dropdown */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Region / State
              </label>
              <select
                value={selectedState}
                onChange={(e) => handleStateChange(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.65rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--gs-border)',
                  borderRadius: 'var(--gs-radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.85rem'
                }}
              >
                <option value="all" style={{ background: '#0B2016' }}>All 5 Regions</option>
                {FIVE_REGIONS.map((r) => (
                  <option key={r.id} value={r.state} style={{ background: '#0B2016' }}>
                    {r.displayName}
                  </option>
                ))}
              </select>
            </div>

            {/* City Dropdown (Cascades Dynamically based on State) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                City / District ({availableCities.length})
              </label>
              <select
                value={selectedCity}
                onChange={(e) => { setSelectedCity(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.65rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--gs-border)',
                  borderRadius: 'var(--gs-radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.85rem'
                }}
              >
                <option value="all" style={{ background: '#0B2016' }}>All Cities in Region</option>
                {availableCities.map((city, idx) => (
                  <option key={`${city.name}-${idx}`} value={city.name} style={{ background: '#0B2016' }}>
                    {city.name} ({city.district})
                  </option>
                ))}
              </select>
            </div>

            {/* Property Subtype (Filtered by Category) */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Property Subtype
              </label>
              <select
                value={selectedSubtype}
                onChange={(e) => { setSelectedSubtype(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.65rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--gs-border)',
                  borderRadius: 'var(--gs-radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.85rem'
                }}
              >
                <option value="all" style={{ background: '#0B2016' }}>All Subtypes</option>
                {availableSubtypes.map((sub) => (
                  <option key={sub.id} value={sub.id} style={{ background: '#0B2016' }}>
                    {sub.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Bedroom Filter */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Bedrooms (BHK)
              </label>
              <div style={{ display: 'flex', gap: '0.25rem' }}>
                {(['all', 1, 2, 3, 4] as const).map((bhk) => (
                  <button
                    key={bhk}
                    type="button"
                    onClick={() => { setSelectedBedrooms(bhk); setCurrentPage(1); }}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.2rem',
                      borderRadius: 'var(--gs-radius-sm)',
                      fontSize: '0.8rem',
                      fontWeight: selectedBedrooms === bhk ? 700 : 500,
                      backgroundColor: selectedBedrooms === bhk ? 'var(--gs-forest-mid)' : 'rgba(255, 255, 255, 0.05)',
                      color: selectedBedrooms === bhk ? '#FFFFFF' : 'var(--gs-text-secondary)',
                      border: selectedBedrooms === bhk ? '1px solid var(--gs-accent)' : '1px solid var(--gs-border)',
                      cursor: 'pointer'
                    }}
                  >
                    {bhk === 'all' ? 'Any' : bhk === 4 ? '4+' : `${bhk}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Furnishing Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginBottom: '0.25rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Furnishing
              </label>
              <select
                value={selectedFurnishing}
                onChange={(e) => { setSelectedFurnishing(e.target.value); setCurrentPage(1); }}
                style={{
                  width: '100%',
                  padding: '0.55rem 0.65rem',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  border: '1px solid var(--gs-border)',
                  borderRadius: 'var(--gs-radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.85rem'
                }}
              >
                <option value="all" style={{ background: '#0B2016' }}>Any Furnishing</option>
                <option value="fully_furnished" style={{ background: '#0B2016' }}>Fully Furnished</option>
                <option value="semi_furnished" style={{ background: '#0B2016' }}>Semi-Furnished</option>
                <option value="unfurnished" style={{ background: '#0B2016' }}>Unfurnished</option>
              </select>
            </div>
          </div>

          {/* Row 3: Quick Budget Bands (Rental or Sale) */}
          <div style={{ marginBottom: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--gs-border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--gs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {listingIntent === 'sale' ? 'Purchase Budget Bands' : 'Rental Budget Bands'}
              </span>
              <span style={{ fontSize: '0.72rem', color: 'var(--gs-accent-bright)' }}>
                {listingIntent === 'sale' ? 'Freehold plots & properties for sale' : 'Model Tenancy Act 2021 statutory rent bands'}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
              {listingIntent === 'sale' ? (
                SALE_PRICE_BANDS.map((band) => {
                  const isActive = activeSalePriceBand === band.id;
                  return (
                    <button
                      key={band.id}
                      type="button"
                      onClick={() => handleSelectSalePriceBand(band.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '16px',
                        fontSize: '0.78rem',
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? 'var(--gs-accent)' : 'rgba(255, 255, 255, 0.04)',
                        color: isActive ? '#FFFFFF' : 'var(--gs-text-secondary)',
                        border: isActive ? '1px solid var(--gs-accent-bright)' : '1px solid var(--gs-border-subtle)',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      {band.descriptor}
                    </button>
                  );
                })
              ) : (
                RENTAL_BUDGET_BANDS.map((band) => {
                  const isActive = activeRentalBudgetBand === band.id;
                  return (
                    <button
                      key={band.id}
                      type="button"
                      onClick={() => handleSelectRentalBudgetBand(band.id)}
                      style={{
                        padding: '0.35rem 0.75rem',
                        borderRadius: '16px',
                        fontSize: '0.78rem',
                        fontWeight: isActive ? 700 : 500,
                        backgroundColor: isActive ? 'var(--gs-accent)' : 'rgba(255, 255, 255, 0.04)',
                        color: isActive ? '#FFFFFF' : 'var(--gs-text-secondary)',
                        border: isActive ? '1px solid var(--gs-accent-bright)' : '1px solid var(--gs-border-subtle)',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer'
                      }}
                    >
                      {band.label} ({band.descriptor})
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Row 4: Expandable Advanced Filters Toggle + Reset Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.5rem' }}>
            <button
              type="button"
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.82rem',
                fontWeight: 600,
                color: 'var(--gs-accent-bright)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem 0'
              }}
            >
              <SlidersHorizontal size={14} />
              <span>{showAdvancedFilters ? 'Hide Advanced Filters' : 'Show Advanced Filters (Area, Amenities, Parking, Pets)'}</span>
            </button>

            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                fontSize: '0.82rem',
                color: 'var(--gs-text-muted)',
                background: 'none',
                border: 'none',
                cursor: 'pointer'
              }}
            >
              <RotateCcw size={13} />
              <span>Reset Filters</span>
            </button>
          </div>

          {/* Advanced Filters Expandable Drawer */}
          {showAdvancedFilters && (
            <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--gs-border-subtle)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
                {/* Min / Max Rent Numerical Inputs */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginBottom: '0.25rem' }}>
                    Custom Rent Range (₹ / mo)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      placeholder="Min"
                      value={minRent}
                      onChange={(e) => { setMinRent(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }}
                      style={{ width: '100%', padding: '0.45rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-sm)', color: '#fff', fontSize: '0.82rem' }}
                    />
                    <span style={{ color: 'var(--gs-text-muted)' }}>-</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={maxRent}
                      onChange={(e) => { setMaxRent(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }}
                      style={{ width: '100%', padding: '0.45rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-sm)', color: '#fff', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* Min / Max Area Inputs */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginBottom: '0.25rem' }}>
                    Carpet Area Range (sq.ft.)
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <input
                      type="number"
                      placeholder="Min Area"
                      value={minArea}
                      onChange={(e) => { setMinArea(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }}
                      style={{ width: '100%', padding: '0.45rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-sm)', color: '#fff', fontSize: '0.82rem' }}
                    />
                    <span style={{ color: 'var(--gs-text-muted)' }}>-</span>
                    <input
                      type="number"
                      placeholder="Max Area"
                      value={maxArea}
                      onChange={(e) => { setMaxArea(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }}
                      style={{ width: '100%', padding: '0.45rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-sm)', color: '#fff', fontSize: '0.82rem' }}
                    />
                  </div>
                </div>

                {/* Tenant Preference */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginBottom: '0.25rem' }}>
                    Tenant Preference
                  </label>
                  <select
                    value={selectedTenantPref}
                    onChange={(e) => { setSelectedTenantPref(e.target.value); setCurrentPage(1); }}
                    style={{ width: '100%', padding: '0.45rem', backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-sm)', color: '#fff', fontSize: '0.82rem' }}
                  >
                    <option value="all" style={{ background: '#0B2016' }}>Any Preference</option>
                    <option value="family" style={{ background: '#0B2016' }}>Families Preferred</option>
                    <option value="bachelors" style={{ background: '#0B2016' }}>Bachelors Friendly</option>
                    <option value="working_professionals" style={{ background: '#0B2016' }}>Working Professionals</option>
                    <option value="students" style={{ background: '#0B2016' }}>Students Welcome</option>
                  </select>
                </div>

                {/* Quick Checkbox Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', justifyContent: 'center' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--gs-text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={petFriendlyOnly}
                      onChange={(e) => { setPetFriendlyOnly(e.target.checked); setCurrentPage(1); }}
                    />
                    <span>Pet-Friendly Units Only</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--gs-text-primary)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={parkingRequired}
                      onChange={(e) => { setParkingRequired(e.target.checked); setCurrentPage(1); }}
                    />
                    <span>Dedicated / Stilt Parking Required</span>
                  </label>
                </div>
              </div>

              {/* Amenities Checklist Pills */}
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: 'var(--gs-text-muted)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Essential Amenities (Select to require)
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                  {COMMON_AMENITY_OPTIONS.map((amenity) => {
                    const isChecked = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        style={{
                          padding: '0.3rem 0.65rem',
                          borderRadius: '14px',
                          fontSize: '0.78rem',
                          fontWeight: isChecked ? 600 : 500,
                          backgroundColor: isChecked ? 'rgba(82, 183, 136, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                          color: isChecked ? '#52B788' : 'var(--gs-text-secondary)',
                          border: isChecked ? '1px solid #52B788' : '1px solid var(--gs-border-subtle)',
                          cursor: 'pointer'
                        }}
                      >
                        {isChecked ? `✓ ${amenity}` : `+ ${amenity}`}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            RESULTS SUMMARY & SORTING BAR
            ========================================================================= */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <span style={{ fontSize: '1rem', fontWeight: 700, color: '#FFFFFF' }}>
              {searchResults.total} Properties Found
            </span>
            <span style={{ fontSize: '0.85rem', color: 'var(--gs-text-secondary)', marginLeft: '0.5rem' }}>
              across {selectedState === 'all' ? '5 Northern Indian Regions' : selectedState}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Sort Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowUpDown size={14} color="var(--gs-text-muted)" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                style={{
                  padding: '0.45rem 0.65rem',
                  backgroundColor: 'rgba(11, 30, 22, 0.85)',
                  border: '1px solid var(--gs-border)',
                  borderRadius: 'var(--gs-radius-sm)',
                  color: '#FFFFFF',
                  fontSize: '0.82rem'
                }}
              >
                <option value="relevance" style={{ background: '#0B2016' }}>Relevance</option>
                <option value="rent_asc" style={{ background: '#0B2016' }}>Price: Low to High</option>
                <option value="rent_desc" style={{ background: '#0B2016' }}>Price: High to Low</option>
                <option value="newest" style={{ background: '#0B2016' }}>Newest Listed</option>
                <option value="area_desc" style={{ background: '#0B2016' }}>Area: Large to Small</option>
                <option value="area_asc" style={{ background: '#0B2016' }}>Area: Small to Large</option>
              </select>
            </div>

            {/* View Mode Toggle: Grid vs List */}
            <div style={{ display: 'flex', background: 'rgba(11, 30, 22, 0.85)', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-sm)', padding: '0.15rem' }}>
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                title="Grid View"
                style={{
                  padding: '0.35rem 0.55rem',
                  background: viewMode === 'grid' ? 'var(--gs-forest-mid)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--gs-radius-xs)',
                  color: viewMode === 'grid' ? '#FFFFFF' : 'var(--gs-text-muted)',
                  cursor: 'pointer'
                }}
              >
                <LayoutGrid size={15} />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                title="List View"
                style={{
                  padding: '0.35rem 0.55rem',
                  background: viewMode === 'list' ? 'var(--gs-forest-mid)' : 'transparent',
                  border: 'none',
                  borderRadius: 'var(--gs-radius-xs)',
                  color: viewMode === 'list' ? '#FFFFFF' : 'var(--gs-text-muted)',
                  cursor: 'pointer'
                }}
              >
                <List size={15} />
              </button>
            </div>
          </div>
        </div>

        {/* Active Filter Chips Bar */}
        {activeFilters.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center', marginBottom: '1.5rem' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)', marginRight: '0.25rem' }}>
              Active filters:
            </span>
            {activeFilters.map((af, i) => (
              <span
                key={i}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                  padding: '0.2rem 0.55rem',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(82, 183, 136, 0.15)',
                  border: '1px solid rgba(82, 183, 136, 0.35)',
                  color: '#A3E635',
                  fontSize: '0.75rem'
                }}
              >
                {af.label}
                <button
                  type="button"
                  onClick={af.onRemove}
                  style={{ background: 'none', border: 'none', color: '#A3E635', cursor: 'pointer', padding: 0 }}
                >
                  <X size={12} />
                </button>
              </span>
            ))}
            <button
              type="button"
              onClick={handleResetFilters}
              style={{ background: 'none', border: 'none', color: 'var(--gs-text-muted)', fontSize: '0.75rem', textDecoration: 'underline', cursor: 'pointer', marginLeft: '0.5rem' }}
            >
              Clear all
            </button>
          </div>
        )}

        {/* =========================================================================
            PROPERTY RESULTS SECTION (GRID OR LIST)
            ========================================================================= */}
        {firstPartyLoading ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid rgba(82, 183, 136, 0.3)', borderTopColor: '#52B788', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: 'var(--gs-text-secondary)', fontSize: '0.9rem' }}>
              Querying verified first-party registry records...
            </p>
          </div>
        ) : searchResults.properties.length === 0 ? (
          /* Zero Results State */
          <div 
            style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'rgba(11, 30, 22, 0.65)',
              border: '1px dashed var(--gs-border)',
              borderRadius: 'var(--gs-radius-lg)',
              maxWidth: '640px',
              margin: '2rem auto'
            }}
          >
            <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(82, 183, 136, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: 'var(--gs-accent-bright)' }}>
              <Filter size={24} />
            </div>
            <h3 style={{ fontSize: '1.25rem', color: '#FFFFFF', fontWeight: 700, marginBottom: '0.5rem' }}>
              No properties matched your criteria
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              Try broadening your budget range, removing specific amenity requirements, or selecting another city across our 5 Northern Indian regions.
            </p>
            <button
              type="button"
              onClick={handleResetFilters}
              className="gs-btn gs-btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <RotateCcw size={15} />
              <span>Reset All Filters</span>
            </button>
          </div>
        ) : (
          /* Active Results Render */
          <div 
            style={{
              display: 'grid',
              gridTemplateColumns: viewMode === 'grid' 
                ? 'repeat(auto-fill, minmax(320px, 1fr))' 
                : '1fr',
              gap: '1.5rem',
              marginBottom: '2.5rem'
            }}
          >
            {searchResults.properties.map((property) => {
              const photoUrl = property.photos && property.photos.length > 0 
                ? property.photos[0] 
                : '/images/modern_apartment.jpg';
              
              const isSale = property.listingIntent === 'sale';

              return (
                <div
                  key={property.id}
                  className={viewMode === 'grid' ? 'gs-property-card-editorial' : 'gs-property-card-list-editorial'}
                  style={{ cursor: 'pointer' }}
                  onClick={() => { setSelectedPropertyModal(property); setModalPhotoIndex(0); }}
                >
                  {/* Photo Container with Overlay Badges */}
                  <div className={viewMode === 'grid' ? 'gs-property-card-media' : 'gs-property-card-list-media'}>
                    <img
                      src={photoUrl}
                      alt={property.title}
                      loading="lazy"
                      decoding="async"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.src.includes('modern_apartment.jpg')) {
                          target.src = '/images/modern_apartment.jpg';
                        }
                      }}
                    />
                    
                    {/* Top Left Badge: Intent & Category */}
                    <div className="gs-property-card-badge-top">
                      <span 
                        style={{
                          padding: '0.22rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          letterSpacing: '0.04em',
                          textTransform: 'uppercase',
                          backgroundColor: isSale ? '#B45309' : '#15803D',
                          color: '#FFFFFF',
                          boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                        }}
                      >
                        {isSale ? 'For Sale' : 'For Rent'}
                      </span>
                    </div>

                    {/* Top Right: State / Region Badge */}
                    <div className="gs-property-card-actions-top">
                      <span 
                        style={{
                          padding: '0.22rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(6, 20, 15, 0.85)',
                          backdropFilter: 'blur(8px)',
                          color: '#52B788',
                          border: '1px solid rgba(82, 183, 136, 0.3)'
                        }}
                      >
                        {property.state}
                      </span>
                    </div>
                  </div>

                  {/* Card Content Body */}
                  <div className={viewMode === 'grid' ? 'gs-property-card-body' : 'gs-property-card-list-body'}>
                    {/* Price and MTA Compliance Badge */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '0.35rem' }}>
                      <div className="gs-property-card-price">
                        {formatPrice(property)}
                        {!isSale && <span className="gs-property-card-period">/ mo</span>}
                      </div>

                      {!isSale && property.securityDeposit > 0 && (
                        <span 
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 600,
                            color: '#52B788',
                            backgroundColor: 'rgba(82, 183, 136, 0.12)',
                            padding: '0.15rem 0.45rem',
                            borderRadius: '4px',
                            border: '1px solid rgba(82, 183, 136, 0.25)'
                          }}
                        >
                          MTA 2021 Compliant
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="gs-property-card-title" title={property.title}>
                      {property.title}
                    </h3>

                    {/* Location */}
                    <div className="gs-property-card-location">
                      <MapPin size={13} color="var(--gs-accent-bright)" style={{ flexShrink: 0 }} />
                      <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {property.locality}, {property.city}
                      </span>
                    </div>

                    {/* Specifications Chips Row */}
                    <div className="gs-property-card-specs">
                      {property.bedrooms !== undefined && property.bedrooms > 0 && (
                        <span className="gs-spec-pill">
                          <Bed size={13} color="var(--gs-accent-bright)" />
                          <span>{property.bedrooms} Bed</span>
                        </span>
                      )}
                      {property.bathrooms !== undefined && property.bathrooms > 0 && (
                        <span className="gs-spec-pill">
                          <Bath size={13} color="var(--gs-accent-bright)" />
                          <span>{property.bathrooms} Bath</span>
                        </span>
                      )}
                      {property.areaSqFt !== undefined && (
                        <span className="gs-spec-pill">
                          <Square size={13} color="var(--gs-accent-bright)" />
                          <span>{property.areaSqFt} sq.ft.</span>
                        </span>
                      )}
                      {property.furnishing && (
                        <span className="gs-spec-pill" style={{ textTransform: 'capitalize' }}>
                          <span>{property.furnishing.replace('_', ' ')}</span>
                        </span>
                      )}
                    </div>

                    {/* Amenities Snippet */}
                    {property.amenities && property.amenities.length > 0 && (
                      <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                        {property.amenities.slice(0, 3).map((amenity, i) => (
                          <span 
                            key={i}
                            style={{
                              fontSize: '0.72rem',
                              padding: '0.15rem 0.45rem',
                              borderRadius: '4px',
                              backgroundColor: 'rgba(255, 255, 255, 0.05)',
                              color: 'var(--gs-text-secondary)',
                              border: '1px solid var(--gs-border-subtle)'
                            }}
                          >
                            {amenity}
                          </span>
                        ))}
                        {property.amenities.length > 3 && (
                          <span style={{ fontSize: '0.7rem', color: 'var(--gs-text-muted)' }}>
                            +{property.amenities.length - 3} more
                          </span>
                        )}
                      </div>
                    )}

                    {/* Card Footer: Attribution & CTA */}
                    <div className="gs-property-card-footer">
                      <span style={{ fontSize: '0.72rem', color: 'var(--gs-text-muted)' }}>
                        {property.district ? `District: ${property.district}` : 'Northern Real Estate Registry'}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); setSelectedPropertyModal(property); setModalPhotoIndex(0); }}
                        style={{
                          padding: '0.35rem 0.75rem',
                          borderRadius: 'var(--gs-radius-sm)',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          backgroundColor: 'rgba(82, 183, 136, 0.15)',
                          color: '#52B788',
                          border: '1px solid rgba(82, 183, 136, 0.4)',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.25rem'
                        }}
                      >
                        <span>Details</span>
                        <ChevronRight size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* =========================================================================
            PAGINATION CONTROLS
            ========================================================================= */}
        {searchResults.totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '0.4rem', marginTop: '2rem' }}>
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => { setCurrentPage((p) => Math.max(1, p - 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--gs-radius-sm)',
                fontSize: '0.82rem',
                backgroundColor: 'rgba(11, 30, 22, 0.85)',
                color: currentPage <= 1 ? 'var(--gs-text-muted)' : 'var(--gs-text-primary)',
                border: '1px solid var(--gs-border)',
                cursor: currentPage <= 1 ? 'not-allowed' : 'pointer'
              }}
            >
              Previous
            </button>

            {Array.from({ length: Math.min(7, searchResults.totalPages) }).map((_, i) => {
              const pageNumber = i + 1;
              const isCurrent = pageNumber === currentPage;
              return (
                <button
                  key={pageNumber}
                  type="button"
                  onClick={() => { setCurrentPage(pageNumber); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 'var(--gs-radius-sm)',
                    fontSize: '0.82rem',
                    fontWeight: isCurrent ? 700 : 500,
                    backgroundColor: isCurrent ? 'var(--gs-accent)' : 'rgba(11, 30, 22, 0.85)',
                    color: isCurrent ? '#FFFFFF' : 'var(--gs-text-secondary)',
                    border: isCurrent ? '1px solid var(--gs-accent-bright)' : '1px solid var(--gs-border)',
                    cursor: 'pointer'
                  }}
                >
                  {pageNumber}
                </button>
              );
            })}

            <button
              type="button"
              disabled={currentPage >= searchResults.totalPages}
              onClick={() => { setCurrentPage((p) => Math.min(searchResults.totalPages, p + 1)); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
              style={{
                padding: '0.45rem 0.85rem',
                borderRadius: 'var(--gs-radius-sm)',
                fontSize: '0.82rem',
                backgroundColor: 'rgba(11, 30, 22, 0.85)',
                color: currentPage >= searchResults.totalPages ? 'var(--gs-text-muted)' : 'var(--gs-text-primary)',
                border: '1px solid var(--gs-border)',
                cursor: currentPage >= searchResults.totalPages ? 'not-allowed' : 'pointer'
              }}
            >
              Next
            </button>
          </div>
        )}

      </div>

      {/* =========================================================================
          INTERACTIVE PROPERTY DETAIL MODAL
          ========================================================================= */}
      {selectedPropertyModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            zIndex: 1200,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem'
          }}
          onClick={() => setSelectedPropertyModal(null)}
        >
          <div 
            style={{
              backgroundColor: '#071610',
              border: '1px solid var(--gs-border)',
              borderRadius: 'var(--gs-radius-lg)',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: 'var(--gs-shadow-xl)',
              position: 'relative'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Photo Header */}
            <div style={{ position: 'relative', height: '320px', width: '100%', overflow: 'hidden', backgroundColor: '#04100B' }}>
              <img
                src={
                  selectedPropertyModal.photos && selectedPropertyModal.photos.length > modalPhotoIndex
                    ? selectedPropertyModal.photos[modalPhotoIndex]
                    : selectedPropertyModal.photos && selectedPropertyModal.photos.length > 0
                    ? selectedPropertyModal.photos[0]
                    : '/images/modern_apartment.jpg'
                }
                alt={selectedPropertyModal.title}
                onError={(e) => {
                  const target = e.currentTarget;
                  if (!target.src.includes('modern_apartment.jpg')) {
                    target.src = '/images/modern_apartment.jpg';
                  }
                }}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => setSelectedPropertyModal(null)}
                style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  backgroundColor: 'rgba(0,0,0,0.65)',
                  color: '#fff',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  zIndex: 10
                }}
              >
                <X size={18} />
              </button>

              <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', display: 'flex', gap: '0.5rem', zIndex: 10 }}>
                <span style={{ padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, backgroundColor: selectedPropertyModal.listingIntent === 'sale' ? '#B45309' : '#15803D', color: '#fff' }}>
                  {selectedPropertyModal.listingIntent === 'sale' ? 'Property For Sale' : 'Property For Rent'}
                </span>
                <span style={{ padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(0,0,0,0.7)', color: '#52B788', border: '1px solid rgba(82, 183, 136, 0.4)' }}>
                  {selectedPropertyModal.state}
                </span>
                {selectedPropertyModal.propertyTypeLabel && (
                  <span style={{ padding: '0.25rem 0.65rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 600, backgroundColor: 'rgba(0,0,0,0.7)', color: '#FFFFFF', border: '1px solid rgba(255, 255, 255, 0.25)' }}>
                    {selectedPropertyModal.propertyTypeLabel}
                  </span>
                )}
              </div>

              {/* Gallery Switcher for Multi-photo listings */}
              {selectedPropertyModal.photos && selectedPropertyModal.photos.length > 1 && (
                <div style={{ position: 'absolute', bottom: '1rem', right: '1rem', display: 'flex', gap: '0.4rem', zIndex: 10 }}>
                  {selectedPropertyModal.photos.map((_, pIdx) => (
                    <button
                      key={pIdx}
                      type="button"
                      onClick={() => setModalPhotoIndex(pIdx)}
                      style={{
                        padding: '0.25rem 0.55rem',
                        borderRadius: '4px',
                        fontSize: '0.72rem',
                        fontWeight: modalPhotoIndex === pIdx ? 700 : 500,
                        backgroundColor: modalPhotoIndex === pIdx ? '#52B788' : 'rgba(0,0,0,0.65)',
                        color: modalPhotoIndex === pIdx ? '#000' : '#fff',
                        border: '1px solid rgba(255,255,255,0.3)',
                        cursor: 'pointer'
                      }}
                    >
                      Photo {pIdx + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Modal Content Body */}
            <div style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.35rem' }}>
                    {selectedPropertyModal.title}
                  </h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--gs-text-secondary)', fontSize: '0.9rem' }}>
                    <MapPin size={15} color="#52B788" />
                    <span>{selectedPropertyModal.locality}, {selectedPropertyModal.city}, {selectedPropertyModal.state} {selectedPropertyModal.pincode ? `(${selectedPropertyModal.pincode})` : ''}</span>
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#FFFFFF', fontVariantNumeric: 'tabular-nums' }}>
                    {formatPrice(selectedPropertyModal)}
                    {selectedPropertyModal.listingIntent !== 'sale' && (
                      <span style={{ fontSize: '0.9rem', color: 'var(--gs-text-muted)', fontWeight: 500 }}> / month</span>
                    )}
                  </div>
                  {selectedPropertyModal.listingIntent !== 'sale' && selectedPropertyModal.securityDeposit > 0 && (
                    <div style={{ fontSize: '0.75rem', color: '#52B788', marginTop: '0.2rem' }}>
                      Security Deposit: ₹{selectedPropertyModal.securityDeposit.toLocaleString('en-IN')} (MTA Cap: Max 2 Months)
                    </div>
                  )}
                </div>
              </div>

              {/* Description */}
              <p style={{ fontSize: '0.92rem', color: 'var(--gs-text-secondary)', lineHeight: 1.6, marginBottom: '1.5rem', borderBottom: '1px solid var(--gs-border-subtle)', paddingBottom: '1.25rem' }}>
                {selectedPropertyModal.description}
              </p>

              {/* Technical Specifications Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '0.85rem', marginBottom: '1.5rem' }}>
                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gs-text-muted)', display: 'block', textTransform: 'uppercase' }}>Configuration</span>
                  <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>
                    {selectedPropertyModal.bedrooms ? `${selectedPropertyModal.bedrooms} BHK` : 'N/A'} {selectedPropertyModal.bathrooms ? `(${selectedPropertyModal.bathrooms} Baths)` : ''}
                  </strong>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gs-text-muted)', display: 'block', textTransform: 'uppercase' }}>Carpet Area</span>
                  <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>
                    {selectedPropertyModal.carpetAreaSqFt || selectedPropertyModal.areaSqFt} sq.ft.
                  </strong>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gs-text-muted)', display: 'block', textTransform: 'uppercase' }}>Furnishing</span>
                  <strong style={{ fontSize: '0.95rem', color: '#FFFFFF', textTransform: 'capitalize' }}>
                    {selectedPropertyModal.furnishing.replace('_', ' ')}
                  </strong>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '0.75rem', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border-subtle)' }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gs-text-muted)', display: 'block', textTransform: 'uppercase' }}>Parking</span>
                  <strong style={{ fontSize: '0.95rem', color: '#FFFFFF' }}>
                    {selectedPropertyModal.parking || 'Standard Parking'}
                  </strong>
                </div>
              </div>

              {/* Full Amenities Checklist */}
              {selectedPropertyModal.amenities && selectedPropertyModal.amenities.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--gs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem' }}>
                    Verified Property Amenities
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '0.5rem' }}>
                    {selectedPropertyModal.amenities.map((a, i) => (
                      <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--gs-text-secondary)' }}>
                        <CheckCircle2 size={15} color="#52B788" />
                        <span>{a}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Statutory Disclaimer & Provenance Notice */}
              <div 
                style={{
                  padding: '0.85rem 1rem',
                  backgroundColor: 'rgba(82, 183, 136, 0.08)',
                  border: '1px solid rgba(82, 183, 136, 0.25)',
                  borderRadius: 'var(--gs-radius-sm)',
                  fontSize: '0.8rem',
                  color: 'var(--gs-text-secondary)',
                  lineHeight: 1.5,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem'
                }}
              >
                <ShieldCheck size={18} color="#52B788" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <strong style={{ color: '#52B788', display: 'block', marginBottom: '0.2rem' }}>
                    Northern India Architecture Demonstration Notice
                  </strong>
                  <span>
                    This record represents an illustrative property entry within the Griha Saathi five-region discovery engine (J&K, Haryana, Punjab, Delhi NCR, and HP). Pricing and deposit caps adhere strictly to Model Tenancy Act 2021 statutory formulas.
                  </span>
                </div>
              </div>

              {/* Close Button */}
              <div style={{ marginTop: '1.5rem', textAlign: 'right' }}>
                <button
                  type="button"
                  onClick={() => setSelectedPropertyModal(null)}
                  className="gs-btn gs-btn-primary"
                  style={{ padding: '0.55rem 1.5rem' }}
                >
                  Close Preview
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default FindPropertyPage;
