import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import { 
  Filter, 
  MapPin, 
  List, 
  Map, 
  ShieldCheck, 
  AlertCircle, 
  RotateCcw, 
  Home, 
  PlusCircle, 
  Calendar, 
  CheckCircle,
  Building,
  Info,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Heart,
  Bookmark,
  Share2,
  ExternalLink,
  Search,
  X,
  Clock,
  Sparkles,
  Check,
  ChevronLeft,
  ChevronRight,
  PhoneCall,
  Flag,
  FileCheck,
  UserCheck,
  LayoutGrid
} from 'lucide-react';
import { 
  Property, 
  SupportedLanguage, 
  TargetState, 
  UserProfile, 
  PropertySortOption, 
  VerificationChecklist, 
  FraudReportReason, 
  VerificationBadge,
  PropertyType,
  TenantPreference,
  FurnishingStatus,
  RegionalCoverageMatrix,
  RegionalStatusReport,
  PropertyProvenance,
  DemoPropertyType
} from '@shared/types';
import { translations } from '@shared/i18n';
import { NavSection } from '../components/Header';
import { DEMO_LISTING_NOTICE, DEMO_PROPERTIES, DEMO_PROPERTY_TYPES, searchDemoProperties } from '../data/demoProperties';

interface FindPropertyPageProps {
  initialFilters?: { 
    state?: string; 
    propertyType?: string; 
    maxRent?: string; 
    city?: string;
    locality?: string;
  };
  language: SupportedLanguage;
  onNavigate: (section: NavSection) => void;
  user?: UserProfile | null;
  token?: string | null;
  onOpenAuth?: () => void;
}

const COMMON_AMENITIES = [
  'Power Backup',
  'Gated Security',
  'Security',
  'Lift',
  'Dedicated Parking',
  'Parking',
  'Municipal Water Supply',
  'Piped Gas',
  'Air Conditioning',
  'Balcony',
  'Wi-Fi',
  'Heating',
  'Kitchen',
  'Attached Bathroom',
  'Laundry',
  'Pet Friendly',
  'Shared Accommodation',
];

const BUDGET_PRESETS = [
  { label: 'Any Budget', min: '', max: '' },
  { label: 'Under ₹15k', min: '', max: '15000' },
  { label: '₹15k – ₹30k', min: '15000', max: '30000' },
  { label: '₹30k – ₹60k', min: '30000', max: '60000' },
  { label: '₹60k+', min: '60000', max: '' },
];

export interface SearchDiagnostics {
  status: 'results_found' | 'filters_too_restrictive' | 'no_listings_in_registry' | 'awaiting_provider_credentials';
  message: string;
  totalInRegistry: number;
  totalMatchingQuery: number;
  hasActiveFilters: boolean;
  stages: { name: string; status: string; recordsCount?: number; survivingRecords?: number; eligibleRecords?: number; excludedRecords?: number }[];
  providersChecked: {
    id: string;
    name: string;
    category: string;
    configured: boolean;
    status: string;
    statusMessage: string;
    requiredCredentials?: string[];
    documentationRef?: string;
  }[];
}

export const FindPropertyPage: React.FC<FindPropertyPageProps> = ({
  initialFilters,
  language,
  onNavigate,
  user,
  token,
  onOpenAuth,
}) => {
  // Primary Search & Filter State
  const [stateFilter, setStateFilter] = useState(initialFilters?.state || 'all');
  const [cityFilter, setCityFilter] = useState(initialFilters?.city || '');
  const [localityFilter, setLocalityFilter] = useState(initialFilters?.locality || '');
  const [typeFilter, setTypeFilter] = useState(initialFilters?.propertyType || 'all');
  const [searchMode, setSearchMode] = useState<'demo' | 'first_party'>('demo');
  const [searchText, setSearchText] = useState('');
  const [demoPropertyTypeFilter, setDemoPropertyTypeFilter] = useState<DemoPropertyType | 'all'>('all');
  const [minBedroomsFilter, setMinBedroomsFilter] = useState('');
  const [maxBedroomsFilter, setMaxBedroomsFilter] = useState('');
  const [petFriendlyOnly, setPetFriendlyOnly] = useState(false);
  const [minRentFilter, setMinRentFilter] = useState('');
  const [maxRentFilter, setMaxRentFilter] = useState(initialFilters?.maxRent || '');
  const [minAreaFilter, setMinAreaFilter] = useState('');
  const [maxAreaFilter, setMaxAreaFilter] = useState('');
  const [availableFromFilter, setAvailableFromFilter] = useState('');
  const [bedroomsFilter, setBedroomsFilter] = useState('all');
  const [bathroomsFilter, setBathroomsFilter] = useState('all');
  const [furnishingFilter, setFurnishingFilter] = useState('all');
  const [preferenceFilter, setPreferenceFilter] = useState('all');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [dataSourceFilter, setDataSourceFilter] = useState('all');
  const [confirmedAvailableOnly, setConfirmedAvailableOnly] = useState(false);
  const [onlyVerified, setOnlyVerified] = useState(true);

  // Sorting & Pagination State
  const [sortBy, setSortBy] = useState<PropertySortOption>('rent_asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // UI Control State
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [selectedPropertyForModal, setSelectedPropertyForModal] = useState<Property | null>(null);
  const [savedPropertyIds, setSavedPropertyIds] = useState<Set<string>>(new Set());
  const [saveActionLoadingId, setSaveActionLoadingId] = useState<string | null>(null);
  const [reconfirmLoading, setReconfirmLoading] = useState(false);
  const [feedbackToast, setFeedbackToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [regionalMatrix, setRegionalMatrix] = useState<RegionalCoverageMatrix | null>(null);
  const [showRegionalMatrixModal, setShowRegionalMatrixModal] = useState(false);

  // Data Loading & Error State
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(false);
  const [queryError, setQueryError] = useState<string | null>(null);
  const [rentValidationError, setRentValidationError] = useState<string | null>(null);
  const [searchDiagnostics, setSearchDiagnostics] = useState<SearchDiagnostics | null>(null);
  const [retrievedAt, setRetrievedAt] = useState<string | null>(null);
  const [locationSuggestions, setLocationSuggestions] = useState<{ cities: string[]; localities: string[] }>({ cities: [], localities: [] });
  const searchControllerRef = useRef<AbortController | null>(null);
  const searchRequestIdRef = useRef(0);

  // Connection & Report States
  const [connectingPropertyId, setConnectingPropertyId] = useState<string | null>(null);
  const [reportingProperty, setReportingProperty] = useState<Property | null>(null);
  const [reportReason, setReportReason] = useState<FraudReportReason>('suspected_fake');
  const [reportDescription, setReportDescription] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportFeedback, setReportFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const t = translations[language].find;
  const demoCities = useMemo(
    () => Array.from(new Set(DEMO_PROPERTIES.filter((property) => stateFilter === 'all' || property.state === stateFilter).map((property) => property.city))).sort(),
    [stateFilter]
  );
  const demoLocalities = useMemo(
    () => Array.from(new Set(DEMO_PROPERTIES.filter((property) =>
      (stateFilter === 'all' || property.state === stateFilter) &&
      (!cityFilter || property.city === cityFilter)
    ).map((property) => property.locality))).sort(),
    [stateFilter, cityFilter]
  );

  // Sync external filters if initialFilters updates (e.g. from Home search or Saathi AI)
  useEffect(() => {
    if (initialFilters) {
      if (initialFilters.state !== undefined) setStateFilter(initialFilters.state);
      if (initialFilters.city !== undefined) setCityFilter(initialFilters.city);
      if (initialFilters.locality !== undefined) setLocalityFilter(initialFilters.locality);
      if (initialFilters.propertyType !== undefined) setTypeFilter(initialFilters.propertyType);
      if (initialFilters.maxRent !== undefined) setMaxRentFilter(initialFilters.maxRent);
      setCurrentPage(1);
    }
  }, [initialFilters]);

  // Rent Range Validation
  useEffect(() => {
    if (minRentFilter && maxRentFilter) {
      const min = Number(minRentFilter);
      const max = Number(maxRentFilter);
      if (!isNaN(min) && !isNaN(max) && min > max) {
        setRentValidationError('Minimum rent cannot exceed maximum rent.');
        return;
      }
    }
    if (minAreaFilter && maxAreaFilter && Number(minAreaFilter) > Number(maxAreaFilter)) {
      setRentValidationError('Minimum area cannot exceed maximum area.');
      return;
    }
    if (minBedroomsFilter && maxBedroomsFilter && Number(minBedroomsFilter) > Number(maxBedroomsFilter)) {
      setRentValidationError('Minimum bedrooms cannot exceed maximum bedrooms.');
      return;
    }
    setRentValidationError(null);
  }, [minRentFilter, maxRentFilter, minAreaFilter, maxAreaFilter, minBedroomsFilter, maxBedroomsFilter]);

  // Close mobile filter drawer automatically if resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900 && isMobileDrawerOpen) {
        setIsMobileDrawerOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMobileDrawerOpen]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setFeedbackToast({ message, type });
    setTimeout(() => setFeedbackToast(null), 3500);
  };

  // Fetch Saved Properties for Authenticated User
  useEffect(() => {
    if (user && token) {
      fetchUserSavedProperties();
    } else {
      setSavedPropertyIds(new Set());
    }
  }, [user, token]);

  const fetchUserSavedProperties = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/properties/user/saved', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.saved)) {
        const idSet = new Set<string>();
        data.saved.forEach((item: any) => {
          if (item.record && item.record.propertyId) {
            idSet.add(item.record.propertyId);
          }
        });
        setSavedPropertyIds(idSet);
      }
    } catch (err) {
      console.error('Failed to load user saved properties:', err);
    }
  };

  // Main Discovery Query
  const fetchProperties = async () => {
    if (rentValidationError) return;
    searchControllerRef.current?.abort();
    const controller = new AbortController();
    searchControllerRef.current = controller;
    const requestId = ++searchRequestIdRef.current;
    setQueryError(null);

    try {
      if (searchMode === 'demo') {
        const matchingListings = searchDemoProperties({
          state: stateFilter,
          city: cityFilter,
          locality: localityFilter,
          propertyType: typeFilter,
          demoPropertyType: demoPropertyTypeFilter,
          searchText,
          minRent: minRentFilter ? Number(minRentFilter) : undefined,
          maxRent: maxRentFilter ? Number(maxRentFilter) : undefined,
          minBedrooms: minBedroomsFilter ? Number(minBedroomsFilter) : bedroomsFilter !== 'all' ? Number(bedroomsFilter) : undefined,
          maxBedrooms: maxBedroomsFilter ? Number(maxBedroomsFilter) : undefined,
          minBathrooms: bathroomsFilter !== 'all' ? Number(bathroomsFilter) : undefined,
          minArea: minAreaFilter ? Number(minAreaFilter) : undefined,
          maxArea: maxAreaFilter ? Number(maxAreaFilter) : undefined,
          furnishing: furnishingFilter,
          preference: preferenceFilter,
          amenities: selectedAmenities,
          petFriendlyOnly,
          availableFrom: availableFromFilter,
          sortBy,
        });
        const pageSize = 12;
        const pages = Math.ceil(matchingListings.length / pageSize);
        setProperties(matchingListings.slice((currentPage - 1) * pageSize, currentPage * pageSize));
        setTotalCount(matchingListings.length);
        setTotalPages(pages);
        setRetrievedAt(null);
        setSearchDiagnostics(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      const params = new URLSearchParams();
      if (stateFilter !== 'all') params.append('state', stateFilter);
      if (cityFilter.trim()) params.append('city', cityFilter.trim());
      if (localityFilter.trim()) params.append('locality', localityFilter.trim());
      if (typeFilter !== 'all') params.append('propertyType', typeFilter);
      if (minRentFilter) params.append('minRent', minRentFilter);
      if (maxRentFilter) params.append('maxRent', maxRentFilter);
      if (minAreaFilter) params.append('minArea', minAreaFilter);
      if (maxAreaFilter) params.append('maxArea', maxAreaFilter);
      if (availableFromFilter) params.append('availableFrom', availableFromFilter);
      if (bedroomsFilter !== 'all') params.append('bedrooms', bedroomsFilter);
      if (bathroomsFilter !== 'all') params.append('bathrooms', bathroomsFilter);
      if (furnishingFilter !== 'all') params.append('furnishing', furnishingFilter);
      if (preferenceFilter !== 'all') params.append('preference', preferenceFilter);
      if (selectedAmenities.length > 0) params.append('amenities', selectedAmenities.join(','));
      if (dataSourceFilter !== 'all') params.append('dataSource', dataSourceFilter);
      if (confirmedAvailableOnly) params.append('confirmedAvailableOnly', 'true');
      params.append('onlyVerified', String(onlyVerified));
      params.append('sortBy', sortBy);
      params.append('page', String(currentPage));
      params.append('limit', '12');

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/properties?${params.toString()}`, { headers, signal: controller.signal });
      const data = await res.json();
      if (requestId !== searchRequestIdRef.current) return;

      if (res.ok && data.success && Array.isArray(data.properties)) {
        const list: Property[] = data.properties;
        setProperties(list);
        setTotalCount(data.total !== undefined ? data.total : list.length);
        setTotalPages(data.totalPages || Math.ceil(list.length / 12) || 1);
        setRetrievedAt(data.retrievedAt || null);
        if (data.regionalMatrix) {
          setRegionalMatrix(data.regionalMatrix);
        }
        if (data.diagnostics) {
          setSearchDiagnostics(data.diagnostics);
        }
      } else {
        setProperties([]);
        setTotalCount(0);
        setTotalPages(1);
        setRetrievedAt(data.retrievedAt || null);
        if (data.regionalMatrix) {
          setRegionalMatrix(data.regionalMatrix);
        }
        if (data.diagnostics) {
          setSearchDiagnostics(data.diagnostics);
        }
        if (!res.ok) {
          setQueryError(data.error || 'Server returned an error while searching first-party property listings.');
        }
      }
    } catch (err) {
      if (controller.signal.aborted || requestId !== searchRequestIdRef.current) return;
      console.error('Failed to query properties:', err);
      setProperties([]);
      setTotalCount(0);
      setTotalPages(1);
      setQueryError('Unable to connect to Griha Saathi property search. Please check your network connection.');
    } finally {
      if (requestId === searchRequestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetch('/api/properties/locations', { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`Location endpoint returned HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.success) {
          setLocationSuggestions({
            cities: Array.isArray(data.cities) ? data.cities : [],
            localities: Array.isArray(data.localities) ? data.localities : [],
          });
        }
      })
      .catch((err) => {
        if (!controller.signal.aborted) console.error('Failed to load first-party location suggestions:', err);
      });
    return () => controller.abort();
  }, []);

  // Fetch initial 5-region evidence status on mount
  useEffect(() => {
    fetch('/api/properties/regional-status')
      .then((res) => res.json())
      .then((data) => {
        if (data && data.success && data.matrix) {
          setRegionalMatrix(data.matrix);
        }
      })
      .catch((err) => console.error('Failed to load regional status matrix:', err));
  }, []);

  useEffect(() => {
    if (rentValidationError) {
      setLoading(false);
      return;
    }
    const delay = searchMode === 'first_party' && (cityFilter.trim() || localityFilter.trim()) ? 300 : 0;
    const timer = window.setTimeout(() => { void fetchProperties(); }, delay);
    return () => {
      window.clearTimeout(timer);
      searchControllerRef.current?.abort();
    };
  }, [
    stateFilter,
    cityFilter,
    localityFilter,
    typeFilter,
    searchMode,
    searchText,
    demoPropertyTypeFilter,
    minBedroomsFilter,
    maxBedroomsFilter,
    petFriendlyOnly,
    minRentFilter,
    maxRentFilter,
    minAreaFilter,
    maxAreaFilter,
    availableFromFilter,
    bedroomsFilter,
    bathroomsFilter,
    furnishingFilter,
    preferenceFilter,
    selectedAmenities,
    dataSourceFilter,
    confirmedAvailableOnly,
    onlyVerified,
    sortBy,
    currentPage,
    rentValidationError,
  ]);

  // Initiate Connection
  const handleInitiateConnection = async (property: Property) => {
    if (!user || !token) {
      showToast('Please sign in to connect with the verified owner.', 'info');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    if (user.id === property.ownerId) {
      showToast('You cannot connect with your own property listing.', 'info');
      return;
    }

    setConnectingPropertyId(property.id);
    try {
      const res = await fetch('/api/connections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ propertyId: property.id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast('Connection request sent to verified landlord! Redirecting...', 'success');
        setTimeout(() => {
          setSelectedPropertyForModal(null);
          onNavigate('connections');
        }, 1000);
      } else {
        showToast(data.error || 'Failed to initiate connection.', 'error');
      }
    } catch (err) {
      showToast('Network error initiating connection.', 'error');
    } finally {
      setConnectingPropertyId(null);
    }
  };

  // Toggle Save Property
  const handleToggleSave = async (propertyId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();

    if (!user || !token) {
      showToast(t.loginToSave, 'info');
      if (onOpenAuth) onOpenAuth();
      return;
    }

    const isCurrentlySaved = savedPropertyIds.has(propertyId);
    setSaveActionLoadingId(propertyId);

    try {
      const url = `/api/properties/${propertyId}/save`;
      const method = isCurrentlySaved ? 'DELETE' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSavedPropertyIds((prev) => {
          const next = new Set(prev);
          if (isCurrentlySaved) {
            next.delete(propertyId);
            showToast('Property removed from saved collection.', 'info');
          } else {
            next.add(propertyId);
            showToast('Property saved to your account.', 'success');
          }
          return next;
        });
      } else {
        showToast(data.error || 'Failed to update saved status.', 'error');
      }
    } catch (err) {
      showToast('Network error updating saved property.', 'error');
    } finally {
      setSaveActionLoadingId(null);
    }
  };

  // Reconfirm Availability
  const handleReconfirmAvailability = async (propertyId: string) => {
    if (!token) return;
    setReconfirmLoading(true);

    try {
      const res = await fetch(`/api/properties/${propertyId}/reconfirm-availability`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();

      if (res.ok && data.success) {
        showToast(t.reconfirmSuccess, 'success');
        if (selectedPropertyForModal && selectedPropertyForModal.id === propertyId) {
          setSelectedPropertyForModal(data.property);
        }
        fetchProperties();
      } else {
        showToast(data.error || 'Failed to reconfirm availability.', 'error');
      }
    } catch (err) {
      showToast('Network error reconfirming availability.', 'error');
    } finally {
      setReconfirmLoading(false);
    }
  };

  // Reset All Filters
  const resetAllFilters = () => {
    setStateFilter('all');
    setCityFilter('');
    setLocalityFilter('');
    setTypeFilter('all');
    setSearchText('');
    setDemoPropertyTypeFilter('all');
    setMinBedroomsFilter('');
    setMaxBedroomsFilter('');
    setPetFriendlyOnly(false);
    setMinRentFilter('');
    setMaxRentFilter('');
    setMinAreaFilter('');
    setMaxAreaFilter('');
    setAvailableFromFilter('');
    setBedroomsFilter('all');
    setBathroomsFilter('all');
    setFurnishingFilter('all');
    setPreferenceFilter('all');
    setSelectedAmenities([]);
    setDataSourceFilter('all');
    setConfirmedAvailableOnly(false);
    setOnlyVerified(true);
    setSortBy('rent_asc');
    setCurrentPage(1);
    setRentValidationError(null);
    setSearchDiagnostics(null);
  };

  // Toggle Amenity Selection
  const toggleAmenity = (amenity: string) => {
    if (selectedAmenities.includes(amenity)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== amenity));
    } else {
      setSelectedAmenities([...selectedAmenities, amenity]);
    }
    setCurrentPage(1);
  };

  // Compute Active Filter Chips
  const activeFilterChips = useMemo(() => {
    const chips: { id: string; label: string; onRemove: () => void }[] = [];

    if (stateFilter !== 'all') {
      chips.push({ id: 'state', label: `Region: ${stateFilter}`, onRemove: () => { setStateFilter('all'); setCurrentPage(1); } });
    }
    if (cityFilter.trim()) {
      chips.push({ id: 'city', label: `City: ${cityFilter}`, onRemove: () => { setCityFilter(''); setCurrentPage(1); } });
    }
    if (localityFilter.trim()) {
      chips.push({ id: 'locality', label: `Locality: ${localityFilter}`, onRemove: () => { setLocalityFilter(''); setCurrentPage(1); } });
    }
    if (typeFilter !== 'all') {
      chips.push({ id: 'type', label: `Type: ${typeFilter.replace('_', ' ').toUpperCase()}`, onRemove: () => { setTypeFilter('all'); setCurrentPage(1); } });
    }
    if (searchText.trim()) {
      chips.push({ id: 'search', label: `Search: ${searchText.trim()}`, onRemove: () => { setSearchText(''); setCurrentPage(1); } });
    }
    if (demoPropertyTypeFilter !== 'all') {
      const typeLabel = DEMO_PROPERTY_TYPES.find((type) => type.id === demoPropertyTypeFilter)?.label ?? demoPropertyTypeFilter;
      chips.push({ id: 'demoType', label: `Demo type: ${typeLabel}`, onRemove: () => { setDemoPropertyTypeFilter('all'); setCurrentPage(1); } });
    }
    if (minBedroomsFilter) chips.push({ id: 'minBedrooms', label: `Min ${minBedroomsFilter} bedrooms`, onRemove: () => { setMinBedroomsFilter(''); setCurrentPage(1); } });
    if (maxBedroomsFilter) chips.push({ id: 'maxBedrooms', label: `Max ${maxBedroomsFilter} bedrooms`, onRemove: () => { setMaxBedroomsFilter(''); setCurrentPage(1); } });
    if (minRentFilter) {
      chips.push({ id: 'minRent', label: `Min ₹${Number(minRentFilter).toLocaleString('en-IN')}`, onRemove: () => { setMinRentFilter(''); setCurrentPage(1); } });
    }
    if (maxRentFilter) {
      chips.push({ id: 'maxRent', label: `Max ₹${Number(maxRentFilter).toLocaleString('en-IN')}`, onRemove: () => { setMaxRentFilter(''); setCurrentPage(1); } });
    }
    if (minAreaFilter) {
      chips.push({ id: 'minArea', label: `Min ${minAreaFilter} sq.ft`, onRemove: () => { setMinAreaFilter(''); setCurrentPage(1); } });
    }
    if (maxAreaFilter) {
      chips.push({ id: 'maxArea', label: `Max ${maxAreaFilter} sq.ft`, onRemove: () => { setMaxAreaFilter(''); setCurrentPage(1); } });
    }
    if (availableFromFilter) {
      chips.push({ id: 'availableFrom', label: `Available by ${availableFromFilter}`, onRemove: () => { setAvailableFromFilter(''); setCurrentPage(1); } });
    }
    if (bedroomsFilter !== 'all') {
      chips.push({ id: 'bedrooms', label: `${bedroomsFilter} BHK`, onRemove: () => { setBedroomsFilter('all'); setCurrentPage(1); } });
    }
    if (bathroomsFilter !== 'all') {
      chips.push({ id: 'bathrooms', label: `${bathroomsFilter}+ Baths`, onRemove: () => { setBathroomsFilter('all'); setCurrentPage(1); } });
    }
    if (furnishingFilter !== 'all') {
      chips.push({ id: 'furnishing', label: furnishingFilter.replace('_', ' '), onRemove: () => { setFurnishingFilter('all'); setCurrentPage(1); } });
    }
    if (preferenceFilter !== 'all') {
      chips.push({ id: 'preference', label: `Tenant: ${preferenceFilter.replace('_', ' ')}`, onRemove: () => { setPreferenceFilter('all'); setCurrentPage(1); } });
    }
    if (confirmedAvailableOnly) {
      chips.push({ id: 'confirmedOnly', label: 'Confirmed Available (≤60d)', onRemove: () => { setConfirmedAvailableOnly(false); setCurrentPage(1); } });
    }
    if (petFriendlyOnly) {
      chips.push({ id: 'petFriendly', label: 'Pet-friendly (simulated)', onRemove: () => { setPetFriendlyOnly(false); setCurrentPage(1); } });
    }
    if (!onlyVerified) {
      chips.push({ id: 'allVerif', label: 'Including Unverified', onRemove: () => { setOnlyVerified(true); setCurrentPage(1); } });
    }
    if (dataSourceFilter !== 'all') {
      chips.push({ id: 'dataSource', label: `Source: ${dataSourceFilter.replace('_', ' ')}`, onRemove: () => { setDataSourceFilter('all'); setCurrentPage(1); } });
    }
    selectedAmenities.forEach((amenity) => {
      chips.push({
        id: `amenity_${amenity}`,
        label: amenity,
        onRemove: () => toggleAmenity(amenity),
      });
    });

    return chips;
  }, [
    stateFilter,
    cityFilter,
    localityFilter,
    typeFilter,
    searchText,
    demoPropertyTypeFilter,
    minBedroomsFilter,
    maxBedroomsFilter,
    minRentFilter,
    maxRentFilter,
    minAreaFilter,
    maxAreaFilter,
    bedroomsFilter,
    bathroomsFilter,
    furnishingFilter,
    preferenceFilter,
    confirmedAvailableOnly,
    onlyVerified,
    dataSourceFilter,
    selectedAmenities,
    petFriendlyOnly,
  ]);

  return (
    <div className="gs-page-shell" style={{ padding: '2.5rem 0 5rem', minHeight: '85vh' }}>
      <div className="gs-container">
        {/* Floating Toast Notification */}
        {feedbackToast && (
          <div
            style={{
              position: 'fixed',
              bottom: '2rem',
              right: '2rem',
              zIndex: 1100,
              padding: '0.85rem 1.25rem',
              backgroundColor: feedbackToast.type === 'success' ? '#065F46' : feedbackToast.type === 'error' ? '#991B1B' : '#1B4332',
              color: '#FFFFFF',
              borderRadius: 'var(--gs-radius-md)',
              boxShadow: 'var(--gs-shadow-lg)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              fontSize: '0.9rem',
              fontWeight: 500,
              maxWidth: '380px',
            }}
          >
            {feedbackToast.type === 'success' ? <CheckCircle size={18} /> : <Info size={18} />}
            <span>{feedbackToast.message}</span>
          </div>
        )}

        {/* Page Top Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.25rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
              <span className="gs-badge gs-badge-forest" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                <Info size={14} />
                <span>{searchMode === 'demo' ? 'Synthetic demo catalog' : 'Approved first-party submissions'}</span>
              </span>
            </div>
            <h1 className="gs-page-header-title" style={{ fontSize: '2.4rem', fontWeight: 800, marginBottom: '0.4rem', letterSpacing: '-0.025em' }}>
              {searchMode === 'demo' ? 'Explore Demo Property Search' : t.title}
            </h1>
            <p className="gs-page-header-subtitle" style={{ fontSize: '1rem', maxWidth: '750px', lineHeight: 1.6 }}>
              {searchMode === 'demo' ? 'Explore a fictional, offline property catalog to try Griha Saathi search filters.' : t.subtitle}
            </p>
            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.9rem' }} aria-label="Property search source">
              <button type="button" className={`gs-btn gs-btn-sm ${searchMode === 'demo' ? 'gs-btn-primary' : 'gs-btn-outline'}`} onClick={() => { setSearchMode('demo'); setSortBy('rent_asc'); setCurrentPage(1); }}>
                Demo catalog ({DEMO_PROPERTIES.length})
              </button>
              <button type="button" className={`gs-btn gs-btn-sm ${searchMode === 'first_party' ? 'gs-btn-primary' : 'gs-btn-outline'}`} onClick={() => { setSearchMode('first_party'); setSortBy('verified_first'); setCurrentPage(1); }}>
                Approved listings
              </button>
            </div>
            {searchMode === 'demo' && (
              <div role="note" style={{ marginTop: '0.85rem', padding: '0.8rem 1rem', border: '1px solid #D97706', borderRadius: 'var(--gs-radius-md)', background: '#FFFBEB', color: '#78350F', maxWidth: '850px', lineHeight: 1.5 }}>
                <strong>DEMO DATA — NOT REAL RENTALS.</strong> These {DEMO_PROPERTIES.length} fictional records demonstrate search only. Prices, features, locations, and simulated availability are illustrative; no property is being offered for rent.
              </div>
            )}
          </div>

          {/* Top Controls: Mode & Layout View Switchers */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
            {/* View Mode: Directory vs Map */}
            <div className="gs-view-segmented-controls">
              <button
                onClick={() => setViewMode('list')}
                className={`gs-segmented-btn ${viewMode === 'list' ? 'active' : ''}`}
                aria-label="Switch to property directory view"
              >
                <List size={16} />
                <span>Directory</span>
              </button>
              <button
                onClick={() => setViewMode('map')}
                className={`gs-segmented-btn ${viewMode === 'map' ? 'active' : ''}`}
                aria-label="Switch to listing location preview"
              >
                <Map size={16} />
                <span>Location Preview</span>
              </button>
            </div>

            {/* Layout Mode: Grid vs List (only for Directory view) */}
            {viewMode === 'list' && (
              <div className="gs-view-segmented-controls">
                <button
                  onClick={() => setLayoutMode('grid')}
                  className={`gs-segmented-btn ${layoutMode === 'grid' ? 'active' : ''}`}
                  title="Grid Layout (3 Columns)"
                  aria-label="Switch to grid layout"
                >
                  <LayoutGrid size={15} />
                  <span>Grid</span>
                </button>
                <button
                  onClick={() => setLayoutMode('list')}
                  className={`gs-segmented-btn ${layoutMode === 'list' ? 'active' : ''}`}
                  title="List Layout (Horizontal Cards)"
                  aria-label="Switch to list layout"
                >
                  <List size={15} />
                  <span>List</span>
                </button>
              </div>
            )}

            {/* Mobile Filter Drawer Trigger (Mobile & Tablet) */}
            <button
              onClick={() => setIsMobileDrawerOpen(true)}
              className="gs-btn gs-btn-sm gs-btn-outline gs-mobile-filter-drawer-btn"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
            >
              <SlidersHorizontal size={15} />
              <span>Filters</span>
              {activeFilterChips.length > 0 && (
                <span style={{ backgroundColor: 'var(--gs-forest-primary)', color: '#FFFFFF', borderRadius: '999px', fontSize: '0.7rem', padding: '0.1rem 0.45rem', fontWeight: 700 }}>
                  {activeFilterChips.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sophisticated Search & Advanced Filter Console */}
        <div className="gs-discovery-search-panel">
          {/* Main Primary Row */}
          <div className="gs-search-main-row">
            {/* Search text */}
            <div className="gs-form-field">
              <label className="gs-form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Search size={14} color="var(--gs-forest-primary)" />
                <span>Search listings</span>
              </label>
              <input type="search" placeholder="Search title, city, locality or region" value={searchText} onChange={(event) => { setSearchText(event.target.value); setCurrentPage(1); }} onKeyDown={(event) => { if (event.key === 'Enter') void fetchProperties(); }} />
            </div>

            {/* 2. Region / Target State */}
            <div className="gs-form-field">
              <label className="gs-form-label">{t.filterState}</label>
              <select
                value={stateFilter}
                onChange={(e) => { setStateFilter(e.target.value); setCityFilter(''); setLocalityFilter(''); setCurrentPage(1); }}
              >
                <option value="all">All 5 Northern Regions</option>
                <option value="Delhi">Delhi NCR (DDA)</option>
                <option value="Haryana">Haryana (Jamabandi)</option>
                <option value="Punjab">Punjab (PLRS)</option>
                <option value="Himachal Pradesh">Himachal Pradesh</option>
                <option value="Jammu & Kashmir">Jammu & Kashmir</option>
              </select>
            </div>

            <div className="gs-form-field">
              <label className="gs-form-label">{t.filterCity}</label>
              {searchMode === 'demo' ? (
                <select value={cityFilter} onChange={(event) => { setCityFilter(event.target.value); setLocalityFilter(''); setCurrentPage(1); }}>
                  <option value="">All cities</option>
                  {demoCities.map((city) => <option key={city} value={city}>{city}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="City" value={cityFilter} onChange={(event) => { setCityFilter(event.target.value); setCurrentPage(1); }} list="first-party-cities" />
              )}
            </div>

            <div className="gs-form-field">
              <label className="gs-form-label">{t.filterLocality}</label>
              {searchMode === 'demo' ? (
                <select value={localityFilter} onChange={(event) => { setLocalityFilter(event.target.value); setCurrentPage(1); }}>
                  <option value="">All localities</option>
                  {demoLocalities.map((locality) => <option key={locality} value={locality}>{locality}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Locality" value={localityFilter} onChange={(event) => { setLocalityFilter(event.target.value); setCurrentPage(1); }} list="first-party-localities" />
              )}
              {searchMode === 'first_party' && (
                <>
                  <datalist id="first-party-cities">{locationSuggestions.cities.map((city) => <option key={city} value={city} />)}</datalist>
                  <datalist id="first-party-localities">{locationSuggestions.localities.map((locality) => <option key={locality} value={locality} />)}</datalist>
                </>
              )}
            </div>

            {/* 3. Property Category */}
            <div className="gs-form-field">
              <label className="gs-form-label">{t.filterType}</label>
              <select
                value={typeFilter}
                onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
              >
                <option value="all">Any Category</option>
                <option value="1bhk">1 BHK Apartment</option>
                <option value="2bhk">2 BHK Apartment</option>
                <option value="3bhk">3 BHK Apartment</option>
                <option value="4bhk_plus">4+ BHK Apartment</option>
                <option value="independent_house">Independent House</option>
                <option value="villa">Villa / Kothi</option>
                <option value="studio">Studio Apartment</option>
                <option value="pg_coliving">PG / Co-living</option>
              </select>
            </div>

            {/* 4. Maximum Monthly Rent */}
            <div className="gs-form-field">
              <label className="gs-form-label">{t.filterRentMax}</label>
              <input
                type="number"
                placeholder="Max Rent (₹)"
                value={maxRentFilter}
                min="0"
                step="1000"
                onChange={(e) => { setMaxRentFilter(e.target.value); setCurrentPage(1); }}
              />
            </div>

            {/* 5. More Filters Toggle Action */}
            <div className="gs-search-more-filters-col" style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                className={`gs-btn ${showAdvancedFilters ? 'gs-btn-primary' : 'gs-btn-outline'}`}
                style={{ padding: '0.72rem 1.1rem', fontSize: '0.88rem', whiteSpace: 'nowrap' }}
              >
                <SlidersHorizontal size={15} />
                <span>{showAdvancedFilters ? 'Less Filters' : 'More Filters'}</span>
                {showAdvancedFilters ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>
          </div>

          {/* Quick Budget Chips Row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.85rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gs-text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginRight: '0.25rem' }}>
              Quick Budget:
            </span>
            {BUDGET_PRESETS.map((preset) => {
              const isActive = minRentFilter === preset.min && maxRentFilter === preset.max;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setMinRentFilter(preset.min);
                    setMaxRentFilter(preset.max);
                    setCurrentPage(1);
                  }}
                  className={`gs-pill-option ${isActive ? 'active' : ''}`}
                  style={{ fontSize: '0.78rem', padding: '0.25rem 0.65rem' }}
                >
                  {preset.label}
                </button>
              );
            })}
          </div>

          {/* Rent Range Validation Error */}
          {rentValidationError && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.85rem', color: 'var(--gs-status-error)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <AlertCircle size={15} />
              <span>{rentValidationError}</span>
            </div>
          )}

          {/* Advanced Filters Expandable Tray (Desktop & Tablet) */}
          {showAdvancedFilters && (
            <div className="gs-advanced-filter-tray">
              {/* Row 1: City, Area, Min Rent */}
              <div className="gs-advanced-filter-grid">
                {searchMode === 'demo' && (
                  <div className="gs-form-field">
                    <label className="gs-form-label">Demo property type</label>
                    <select value={demoPropertyTypeFilter} onChange={(event) => { setDemoPropertyTypeFilter(event.target.value as DemoPropertyType | 'all'); setCurrentPage(1); }}>
                      <option value="all">All residential demo types</option>
                      {DEMO_PROPERTY_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                    </select>
                  </div>
                )}
                {/* Min Rent */}
                <div className="gs-form-field">
                  <label className="gs-form-label">{t.filterRentMin}</label>
                  <input
                    type="number"
                    placeholder="Min Rent (₹)"
                    value={minRentFilter}
                    min="0"
                    step="1000"
                    onChange={(e) => { setMinRentFilter(e.target.value); setCurrentPage(1); }}
                  />
                </div>

                {/* Min Area (sq.ft) */}
                <div className="gs-form-field">
                  <label className="gs-form-label">Min Area (sq.ft)</label>
                  <input
                    type="number"
                    placeholder="e.g. 800"
                    value={minAreaFilter}
                    min="0"
                    step="50"
                    onChange={(e) => { setMinAreaFilter(e.target.value); setCurrentPage(1); }}
                  />
                </div>

                {/* Max Area (sq.ft) */}
                <div className="gs-form-field">
                  <label className="gs-form-label">Max Area (sq.ft)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2500"
                    value={maxAreaFilter}
                    min="0"
                    step="50"
                    onChange={(e) => { setMaxAreaFilter(e.target.value); setCurrentPage(1); }}
                  />
                </div>

                <div className="gs-form-field">
                  <label className="gs-form-label">{searchMode === 'demo' ? 'Simulated available by' : 'Available by'}</label>
                  <input
                    type="date"
                    value={availableFromFilter}
                    onChange={(e) => { setAvailableFromFilter(e.target.value); setCurrentPage(1); }}
                  />
                </div>

                {searchMode === 'first_party' && (
                  <div className="gs-form-field">
                    <label className="gs-form-label">{t.filterDataSource}</label>
                    <select value={dataSourceFilter} onChange={(e) => { setDataSourceFilter(e.target.value); setCurrentPage(1); }}>
                      <option value="all">All first-party submissions</option>
                      <option value="owner_submission">{t.filterSourceOwner}</option>
                      <option value="authorized_registry">{t.filterSourceRegistry}</option>
                      <option value="licensed_agent">{t.filterSourceAgent}</option>
                    </select>
                  </div>
                )}
              </div>

              {/* Row 2: Segmented Pill Selectors */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '1.25rem' }}>
                {/* Bedrooms (BHK) */}
                <div>
                  <label className="gs-form-label" style={{ marginBottom: '0.45rem', display: 'block' }}>{searchMode === 'demo' ? 'Bedrooms range' : t.filterBedrooms}</label>
                  {searchMode === 'demo' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input aria-label="Minimum bedrooms" type="number" min="0" max="10" placeholder="Min" value={minBedroomsFilter} onChange={(event) => { setMinBedroomsFilter(event.target.value); setCurrentPage(1); }} />
                      <input aria-label="Maximum bedrooms" type="number" min="0" max="10" placeholder="Max" value={maxBedroomsFilter} onChange={(event) => { setMaxBedroomsFilter(event.target.value); setCurrentPage(1); }} />
                    </div>
                  ) : <div className="gs-pill-group">
                    {[
                      { id: 'all', label: 'Any BHK' },
                      { id: '1', label: '1 BHK' },
                      { id: '2', label: '2 BHK' },
                      { id: '3', label: '3 BHK' },
                      { id: '4', label: '4+ BHK' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setBedroomsFilter(opt.id); setCurrentPage(1); }}
                        className={`gs-pill-option ${bedroomsFilter === opt.id ? 'active' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>}
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="gs-form-label" style={{ marginBottom: '0.45rem', display: 'block' }}>{t.filterBathrooms}</label>
                  <div className="gs-pill-group">
                    {[
                      { id: 'all', label: 'Any' },
                      { id: '1', label: '1+' },
                      { id: '2', label: '2+' },
                      { id: '3', label: '3+' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setBathroomsFilter(opt.id); setCurrentPage(1); }}
                        className={`gs-pill-option ${bathroomsFilter === opt.id ? 'active' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Furnishing */}
                <div>
                  <label className="gs-form-label" style={{ marginBottom: '0.45rem', display: 'block' }}>{t.filterFurnishing}</label>
                  <div className="gs-pill-group">
                    {[
                      { id: 'all', label: 'Any' },
                      { id: 'unfurnished', label: 'Unfurnished' },
                      { id: 'semi_furnished', label: 'Semi-Furnished' },
                      { id: 'fully_furnished', label: 'Fully-Furnished' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setFurnishingFilter(opt.id); setCurrentPage(1); }}
                        className={`gs-pill-option ${furnishingFilter === opt.id ? 'active' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tenant Preference */}
                <div>
                  <label className="gs-form-label" style={{ marginBottom: '0.45rem', display: 'block' }}>{t.filterPreference}</label>
                  <div className="gs-pill-group">
                    {[
                      { id: 'all', label: 'All' },
                      { id: 'family', label: 'Family' },
                      { id: 'bachelors', label: 'Bachelors' },
                      { id: 'working_professionals', label: 'Professionals' },
                      { id: 'students', label: 'Students' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setPreferenceFilter(opt.id); setCurrentPage(1); }}
                        className={`gs-pill-option ${preferenceFilter === opt.id ? 'active' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 3: Key Amenities Multi-Select */}
              {searchMode === 'demo' && (
                <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginTop: '1rem', cursor: 'pointer' }}>
                  <input type="checkbox" checked={petFriendlyOnly} onChange={(event) => { setPetFriendlyOnly(event.target.checked); setCurrentPage(1); }} />
                  <span>Pet-friendly only (simulated)</span>
                </label>
              )}
              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--gs-border-subtle)' }}>
                <label className="gs-form-label" style={{ marginBottom: '0.5rem', display: 'block' }}>
                  {t.filterAmenities}
                </label>
                <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap' }}>
                  {COMMON_AMENITIES.map((amenity) => {
                    const isSelected = selectedAmenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleAmenity(amenity)}
                        style={{
                          padding: '0.35rem 0.8rem',
                          borderRadius: 'var(--gs-radius-full)',
                          fontSize: '0.82rem',
                          fontWeight: isSelected ? 700 : 500,
                          backgroundColor: isSelected ? 'var(--gs-forest-soft)' : 'var(--gs-bg-card)',
                          color: isSelected ? 'var(--gs-forest-primary)' : 'var(--gs-text-secondary)',
                          border: `1px solid ${isSelected ? 'var(--gs-forest-primary)' : 'var(--gs-border)'}`,
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        {isSelected && <Check size={13} color="var(--gs-forest-primary)" strokeWidth={2.5} />}
                        <span>{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Row 4: Statutory Toggles & Sort Selector */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--gs-border-subtle)',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            {/* Integrity Toggles */}
            <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
              {searchMode === 'first_party' && <>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--gs-forest-deep)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={onlyVerified}
                  onChange={(e) => { setOnlyVerified(e.target.checked); setCurrentPage(1); }}
                  style={{ width: 'auto', accentColor: 'var(--gs-forest-primary)' }}
                />
                <ShieldCheck size={16} color="var(--gs-forest-primary)" />
                <span>{t.filterOnlyVerified}</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', fontWeight: 600, color: 'var(--gs-forest-deep)', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={confirmedAvailableOnly}
                  onChange={(e) => { setConfirmedAvailableOnly(e.target.checked); setCurrentPage(1); }}
                  style={{ width: 'auto', accentColor: 'var(--gs-forest-primary)' }}
                />
                <Clock size={16} color="#059669" />
                <span>{t.filterConfirmedOnly}</span>
              </label>
              </>}
            </div>

            {/* Sorting Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--gs-text-muted)' }}>
                {t.sortByLabel}:
              </span>
              <select
                value={sortBy}
                onChange={(e) => { setSortBy(e.target.value as PropertySortOption); setCurrentPage(1); }}
                style={{ width: 'auto', padding: '0.4rem 0.85rem', fontSize: '0.85rem' }}
              >
                {searchMode === 'first_party' && <option value="verified_first">{t.sortVerifiedFirst}</option>}
                <option value="rent_asc">{t.sortRentAsc}</option>
                <option value="rent_desc">{t.sortRentDesc}</option>
                {searchMode === 'first_party' && <option value="newest">{t.sortNewest}</option>}
                {searchMode === 'demo' && <>
                  <option value="area_asc">Area: small to large</option>
                  <option value="area_desc">Area: large to small</option>
                  <option value="relevance">Relevance to selected filters</option>
                </>}
              </select>
              <button type="button" onClick={() => { void fetchProperties(); }} className="gs-btn gs-btn-sm gs-btn-primary">
                <Search size={13} /> Search
              </button>
            </div>
          </div>

          {/* Active Filter Chips & Global Reset Action */}
          {activeFilterChips.length > 0 && (
            <div className="gs-active-filters-deck">
              <span style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)', fontWeight: 700, marginRight: '0.25rem' }}>
                Active Filters ({activeFilterChips.length}):
              </span>
              {activeFilterChips.map((chip) => (
                <span key={chip.id} className="gs-chip-removable">
                  <span>{chip.label}</span>
                  <button type="button" onClick={chip.onRemove} title="Remove filter" aria-label={`Remove filter ${chip.label}`}>
                    <X size={12} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={resetAllFilters}
                className="gs-btn gs-btn-sm"
                style={{ color: 'var(--gs-status-error)', fontSize: '0.82rem', padding: '0.25rem 0.65rem', marginLeft: 'auto', border: '1px dashed #FCA5A5' }}
              >
                <RotateCcw size={13} />
                <span>Clear All Filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Five-Region Integration & Operational Evidence Bar (Directives 3 & 9) */}
        {searchMode === 'first_party' && regionalMatrix && (
          <div className="gs-regional-coverage-banner">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div className="gs-coverage-shield-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div className="gs-coverage-title">
                  {stateFilter !== 'all' ? `${stateFilter} Regional Coverage Status` : 'Five-Region Authoritative Coverage Engine'}
                </div>
                <div className="gs-coverage-subtitle">
                  {stateFilter !== 'all' && regionalMatrix.regions[stateFilter as TargetState] ? (
                    <span>
                      <strong style={{ color: regionalMatrix.regions[stateFilter as TargetState].activeListingCount > 0 ? '#15803D' : 'var(--gs-forest-deep)' }}>
                        {regionalMatrix.regions[stateFilter as TargetState].statusLabel}
                      </strong> • {regionalMatrix.regions[stateFilter as TargetState].limitations}
                    </span>
                  ) : (
                    <span>
                      5-region search scope • {regionalMatrix.totalEligibleListings} eligible first-party listings
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowRegionalMatrixModal(true)}
              className="gs-btn gs-btn-outline gs-coverage-btn"
            >
              <ShieldCheck size={14} />
              <span>View 5-Region Evidence Matrix</span>
            </button>
          </div>
        )}

        {/* Results Counter Bar - High Contrast Against Forest Canvas */}
        <div className="gs-results-counter-bar">
          <div className="gs-results-count-text">
            <strong>{totalCount}</strong> {t.totalMatching}
            {totalCount > 0 && (
              <span className="gs-results-page-indicator">
                (Page {currentPage} of {totalPages})
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div className="gs-results-freshness-indicator">
              <span className="gs-freshness-dot" />
              <span>
                {searchMode === 'demo'
                  ? 'Offline synthetic demo data · availability is simulated'
                  : `First-party listings${retrievedAt ? ` • Retrieved ${new Date(retrievedAt).toLocaleString()}` : ''}`}
              </span>
            </div>
            <button
              type="button"
              onClick={() => { void fetchProperties(); }}
              disabled={loading}
              className="gs-btn gs-btn-sm gs-btn-outline"
              aria-label="Refresh property search results"
            >
              <RotateCcw size={14} />
              <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          </div>
        </div>

        {/* VIEW MODE 1: CADASTRAL MAP VIEW */}
        {viewMode === 'map' ? (
          <div className="gs-card" style={{ padding: '2.5rem 2rem' }}>
            <div style={{ maxWidth: '840px', margin: '0 auto', textAlign: 'center' }}>
              <div
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: '50%',
                  backgroundColor: 'var(--gs-forest-soft)',
                  color: 'var(--gs-forest-primary)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <Map size={30} />
              </div>

              <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                Listing Location Preview
              </h2>
              <p style={{ fontSize: '0.95rem', color: 'var(--gs-text-secondary)', marginBottom: '1.75rem', lineHeight: 1.6 }}>
                Locations and coordinates are provided with listings. Independently verify addresses; this is not an official cadastral map.
              </p>

              {/* Interactive Regional GIS Canvas */}
              <div
                style={{
                  height: '360px',
                  borderRadius: 'var(--gs-radius-lg)',
                  border: '1.5px solid var(--gs-border)',
                  backgroundColor: '#F7FAF8',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  padding: '2rem',
                }}
              >
                {/* Visual SVG Map Backdrop */}
                <svg
                  viewBox="0 0 600 300"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                    opacity: 0.22,
                    pointerEvents: 'none',
                  }}
                >
                  <path d="M 50,50 Q 150,20 250,50 T 450,40 T 550,100 L 520,250 L 300,280 L 100,240 Z" fill="#2D6A4F" />
                  <circle cx="280" cy="140" r="8" fill="#1B4332" />
                  <circle cx="360" cy="180" r="8" fill="#1B4332" />
                  <circle cx="210" cy="110" r="8" fill="#1B4332" />
                </svg>

                {/* First-party listing location indicators */}
                {properties.some((p) => p.coordinates) ? (
                  <div style={{ zIndex: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.85rem' }}>
                    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      {properties
                        .filter((p) => p.coordinates)
                        .map((p) => (
                          <button
                            key={p.id}
                            onClick={() => setSelectedPropertyForModal(p)}
                            style={{
                              backgroundColor: 'var(--gs-surface-elevated)',
                              border: '2px solid var(--gs-accent)',
                              borderRadius: 'var(--gs-radius-md)',
                              padding: '0.55rem 0.95rem',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              boxShadow: 'var(--gs-shadow-sm)',
                              cursor: 'pointer',
                            }}
                          >
                            <MapPin size={16} color="var(--gs-accent-bright)" />
                            <span style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--gs-text-primary)' }}>
                              ₹{p.rentPerMonth.toLocaleString('en-IN')} - {p.locality}
                            </span>
                          </button>
                        ))}
                    </div>
                    <span style={{ fontSize: '0.84rem', color: 'var(--gs-forest-mid)', fontWeight: 600 }}>
                      {t.mapHasCoordinates}
                    </span>
                  </div>
                ) : (
                  <div style={{ zIndex: 2, textAlign: 'center', maxWidth: '500px' }}>
                    <MapPin size={34} color="var(--gs-forest-mid)" style={{ marginBottom: '0.65rem' }} />
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                      Regional Cadastral Boundary Enforced
                    </div>
                    <div style={{ fontSize: '0.86rem', color: 'var(--gs-text-muted)', lineHeight: 1.55 }}>
                      Exact residential pin coordinates are masked until in-person physical geo-tagging is certified to protect homeowner privacy under the Digital Personal Data Protection (DPDP) Act 2023.
                    </div>
                  </div>
                )}
              </div>

              {/* 5 Target Region Cadastral Systems */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '0.85rem',
                  marginTop: '1.75rem',
                  textAlign: 'left',
                }}
              >
                {[
                  { region: 'Delhi NCR', authority: 'DDA / DORIS Revenue' },
                  { region: 'Haryana', authority: 'Jamabandi Web-HALRIS' },
                  { region: 'Punjab', authority: 'PLRS Punjab' },
                  { region: 'Himachal Pradesh', authority: 'Himbhoomi Portal' },
                  { region: 'Jammu & Kashmir', authority: 'J&K Revenue Portal' },
                ].map((item) => (
                  <div
                    key={item.region}
                    style={{
                      padding: '0.85rem',
                      borderRadius: 'var(--gs-radius-md)',
                      backgroundColor: 'var(--gs-bg-canvas)',
                      border: '1px solid var(--gs-border)',
                    }}
                  >
                    <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>
                      {item.region}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)', marginTop: '2px' }}>
                      {item.authority}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : loading ? (
          /* VIEW MODE 2: LOADING SKELETONS (Prevents Layout Shift) */
          <div>
            {layoutMode === 'grid' ? (
              <div className="gs-property-grid-view">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <div key={n} className="gs-property-skeleton-grid-card">
                    <div className="gs-skeleton-bone" style={{ width: '100%', aspectRatio: '16/10' }} />
                    <div style={{ padding: '1.35rem', display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      <div className="gs-skeleton-bone" style={{ height: '28px', width: '45%' }} />
                      <div className="gs-skeleton-bone" style={{ height: '20px', width: '85%' }} />
                      <div className="gs-skeleton-bone" style={{ height: '16px', width: '60%' }} />
                      <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.35rem' }}>
                        <div className="gs-skeleton-bone" style={{ height: '24px', width: '65px', borderRadius: '999px' }} />
                        <div className="gs-skeleton-bone" style={{ height: '24px', width: '65px', borderRadius: '999px' }} />
                        <div className="gs-skeleton-bone" style={{ height: '24px', width: '75px', borderRadius: '999px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                        <div className="gs-skeleton-bone" style={{ height: '36px', flex: 1, borderRadius: '8px' }} />
                        <div className="gs-skeleton-bone" style={{ height: '36px', flex: 1, borderRadius: '8px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="gs-property-list-view">
                {[1, 2, 3, 4].map((n) => (
                  <div key={n} className="gs-property-skeleton-list-card">
                    <div className="gs-skeleton-bone" style={{ width: '100%', minHeight: '220px' }} />
                    <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', gap: '0.85rem' }}>
                      <div>
                        <div className="gs-skeleton-bone" style={{ height: '28px', width: '35%', marginBottom: '0.5rem' }} />
                        <div className="gs-skeleton-bone" style={{ height: '22px', width: '75%', marginBottom: '0.5rem' }} />
                        <div className="gs-skeleton-bone" style={{ height: '16px', width: '50%' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <div className="gs-skeleton-bone" style={{ height: '24px', width: '70px', borderRadius: '999px' }} />
                        <div className="gs-skeleton-bone" style={{ height: '24px', width: '70px', borderRadius: '999px' }} />
                        <div className="gs-skeleton-bone" style={{ height: '24px', width: '80px', borderRadius: '999px' }} />
                      </div>
                      <div style={{ display: 'flex', gap: '0.75rem', maxWidth: '320px' }}>
                        <div className="gs-skeleton-bone" style={{ height: '36px', flex: 1, borderRadius: '8px' }} />
                        <div className="gs-skeleton-bone" style={{ height: '36px', flex: 1, borderRadius: '8px' }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : queryError ? (
          /* ACTIONABLE ERROR STATE */
          <div className="gs-error-card">
            <div className="gs-error-icon">
              <AlertCircle size={28} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#991B1B', marginBottom: '0.5rem' }}>
              Property Search Connection Interrupted
            </h3>
            <p style={{ fontSize: '0.92rem', color: '#7F1D1D', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              {queryError}
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button onClick={() => { void fetchProperties(); }} className="gs-btn gs-btn-primary">
                <RotateCcw size={16} />
                <span>Retry Property Search</span>
              </button>
              <button onClick={resetAllFilters} className="gs-btn gs-btn-outline">
                <span>Reset Parameters</span>
              </button>
            </div>
          </div>
        ) : properties.length > 0 ? (
          /* VIEW MODE 3: GENUINE VERIFIED PROPERTY CARDS */
          <div>
            {layoutMode === 'grid' ? (
              /* GRID VIEW */
              <div className="gs-property-grid-view">
                {properties.map((property) => {
                  const isSaved = savedPropertyIds.has(property.id);
                  const isSaveLoading = saveActionLoadingId === property.id;
                  const isFresh = !property.isDemo && property.isAvailabilityConfirmed !== false;

                  return (
                    <div
                      key={property.id}
                      className="gs-property-card-editorial"
                      style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedPropertyForModal(property)}
                    >
                      {/* Media Container with Floating Top Badges and Actions */}
                      <div className="gs-property-card-media">
                        {property.photos && property.photos.length > 0 ? (
                          <img
                            src={property.photos[0]}
                            alt={property.title}
                            loading="lazy"
                          />
                        ) : (
                          <div 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              backgroundColor: 'var(--gs-surface-secondary)',
                              color: 'var(--gs-accent-bright)',
                              gap: '0.4rem',
                              padding: '1rem',
                              textAlign: 'center'
                            }}
                          >
                            <Building size={34} strokeWidth={1.5} />
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--gs-text-primary)' }}>
                              Property image not provided
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--gs-text-secondary)' }}>
                              {property.isDemo ? 'Illustrative demo image unavailable' : 'Owner-submitted listing details'}
                            </span>
                          </div>
                        )}

                        {/* Floating Top Left Badges */}
                        <div className="gs-property-card-badge-top" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {property.isDemo ? (
                            <span className="gs-badge gs-badge-warning"><Info size={12} /><span>DEMO · NOT REAL</span></span>
                          ) : property.verificationStatus === 'authoritative_verified' ? (
                            <span className="gs-badge gs-badge-verified">
                              <ShieldCheck size={12} />
                              <span>Verification evidence recorded</span>
                            </span>
                          ) : (
                            <span className="gs-badge gs-badge-forest">
                              <ShieldCheck size={12} />
                              <span>Owner submission approved</span>
                            </span>
                          )}
                          {property.isDemo ? (
                            <span className="gs-badge gs-badge-warning"><Clock size={11} /><span>Simulated status: {property.demoAvailabilityStatus?.replace('simulated_', '')}</span></span>
                          ) : isFresh ? (
                            <span className="gs-badge gs-badge-emerald" title={t.freshnessConfirmedDesc}>
                              <CheckCircle size={11} />
                              <span>Fresh (≤60d)</span>
                            </span>
                          ) : (
                            <span className="gs-badge gs-badge-warning" title={t.freshnessStaleDesc}>
                              <Clock size={11} />
                              <span>Availability not confirmed</span>
                            </span>
                          )}
                        </div>

                        {/* Floating Top Right Actions */}
                        {!property.isDemo && <div className="gs-property-card-actions-top">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportingProperty(property);
                            }}
                            title="Report Listing Concern"
                            className="gs-card-icon-btn"
                            aria-label="Report listing concern"
                          >
                            <Flag size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleSave(property.id, e)}
                            title={isSaved ? t.savedProperty : t.saveProperty}
                            disabled={isSaveLoading}
                            className="gs-card-icon-btn"
                            style={{ color: isSaved ? '#DC2626' : undefined }}
                            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
                          >
                            <Heart size={15} fill={isSaved ? '#DC2626' : 'none'} />
                          </button>
                        </div>}
                      </div>

                      {/* Card Body */}
                      <div className="gs-property-card-body">
                        <div className="gs-property-card-price">
                          ₹{property.rentPerMonth.toLocaleString('en-IN')}
                          <span className="gs-property-card-period">/month</span>
                        </div>

                        <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', marginBottom: '0.35rem' }}>
                          {property.isDemo ? 'Illustrative demo amount · not a real offer' : `Deposit: ₹${property.securityDeposit.toLocaleString('en-IN')} (Model Act 2-mo cap)`}
                        </div>

                        <h3 className="gs-property-card-title" title={property.title}>
                          {property.title}
                        </h3>

                        <div className="gs-property-card-location">
                          <MapPin size={14} color="var(--gs-forest-primary)" style={{ flexShrink: 0 }} />
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {property.locality ? `${property.locality}, ` : ''}{property.city}, {property.state}
                          </span>
                        </div>

                        <div className="gs-property-card-specs">
                          <span className="gs-spec-pill">
                            🏠 {property.propertyTypeLabel || (property.bedrooms !== undefined ? `${property.bedrooms} BHK` : 'Studio')}
                          </span>
                          {property.bathrooms !== undefined && (
                            <span className="gs-spec-pill">
                              🚿 {property.bathrooms} Bath
                            </span>
                          )}
                          {property.areaSqFt && (
                            <span className="gs-spec-pill">
                              📐 {property.areaSqFt} sq.ft
                            </span>
                          )}
                          <span className="gs-spec-pill" style={{ textTransform: 'capitalize' }}>
                            🛋️ {property.furnishing.replace('_', ' ')}
                          </span>
                        </div>

                        {/* Provenance & Source Attribution (Directive 5 & 9) */}
                        {property.isDemo ? (
                          <div role="note" style={{ padding: '0.4rem 0.6rem', backgroundColor: '#FFFBEB', color: '#78350F', borderRadius: 'var(--gs-radius-sm)', border: '1px solid #D97706', fontSize: '0.74rem', margin: '0.35rem 0' }}>
                            DEMO LISTING — NOT A REAL PROPERTY · {property.demoOwnerLabel}
                          </div>
                        ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.35rem 0.6rem', backgroundColor: 'var(--gs-surface-secondary)', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)', fontSize: '0.72rem', color: 'var(--gs-text-primary)', margin: '0.35rem 0' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontWeight: 600 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: property.provenance?.isFresh !== false ? '#10B981' : '#F59E0B' }} />
                            <span>{property.provenance?.providerName || 'Griha Saathi first-party registry'}</span>
                          </span>
                          <span style={{ color: 'var(--gs-text-muted)', fontSize: '0.68rem' }}>
                            ID: {property.id}
                          </span>
                        </div>}

                        {/* Card Footer Actions */}
                        <div className="gs-property-card-footer">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedPropertyForModal(property); }}
                            className="gs-btn gs-btn-outline gs-btn-sm"
                            style={{ flex: 1 }}
                          >
                            <span>{property.isDemo ? 'View demo details' : 'View Dossier'}</span>
                          </button>
                          {!property.isDemo && <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiateConnection(property);
                            }}
                            disabled={connectingPropertyId === property.id}
                            className="gs-btn gs-btn-primary gs-btn-sm"
                            style={{ flex: 1 }}
                          >
                            <span>{connectingPropertyId === property.id ? 'Connecting...' : 'Connect Landlord'}</span>
                          </button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* LIST VIEW (Horizontal Editorial Cards) */
              <div className="gs-property-list-view">
                {properties.map((property) => {
                  const isSaved = savedPropertyIds.has(property.id);
                  const isSaveLoading = saveActionLoadingId === property.id;
                  const isFresh = !property.isDemo && property.isAvailabilityConfirmed !== false;

                  return (
                    <div
                      key={property.id}
                      className="gs-property-card-list-editorial"
                      onClick={() => setSelectedPropertyForModal(property)}
                    >
                      {/* Media Column */}
                      <div className="gs-property-card-list-media">
                        {property.photos && property.photos.length > 0 ? (
                          <img
                            src={property.photos[0]}
                            alt={property.title}
                            loading="lazy"
                          />
                        ) : (
                          <div 
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              display: 'flex', 
                              flexDirection: 'column', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              backgroundColor: 'var(--gs-surface-secondary)',
                              color: 'var(--gs-accent-bright)',
                              gap: '0.4rem',
                              padding: '1.5rem',
                              textAlign: 'center'
                            }}
                          >
                            <Building size={36} strokeWidth={1.5} />
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--gs-text-primary)' }}>
                              Property image not provided
                            </span>
                            <span style={{ fontSize: '0.74rem', color: 'var(--gs-text-secondary)' }}>
                              {property.isDemo ? 'Illustrative demo image unavailable' : 'Owner-submitted listing details'}
                            </span>
                          </div>
                        )}

                        {/* Floating Top Left Badges */}
                        <div className="gs-property-card-badge-top" style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                          {property.isDemo ? (
                            <span className="gs-badge gs-badge-warning"><Info size={12} /><span>DEMO · NOT REAL</span></span>
                          ) : <span className={property.verificationStatus === 'authoritative_verified' ? 'gs-badge gs-badge-verified' : 'gs-badge gs-badge-forest'}>
                            <ShieldCheck size={12} />
                            <span>{property.verificationStatus === 'authoritative_verified' ? 'Verification evidence recorded' : 'Owner submission approved'}</span>
                          </span>}
                          {property.isDemo ? (
                            <span className="gs-badge gs-badge-warning"><Clock size={11} /><span>Simulated status: {property.demoAvailabilityStatus?.replace('simulated_', '')}</span></span>
                          ) : isFresh ? (
                            <span className="gs-badge gs-badge-emerald">
                              <CheckCircle size={11} />
                              <span>Fresh (≤60d)</span>
                            </span>
                          ) : (
                            <span className="gs-badge gs-badge-warning">
                              <Clock size={11} />
                              <span>Availability not confirmed</span>
                            </span>
                          )}
                        </div>

                        {/* Floating Top Right Actions */}
                        {!property.isDemo && <div className="gs-property-card-actions-top">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setReportingProperty(property);
                            }}
                            title="Report Listing Concern"
                            className="gs-card-icon-btn"
                            aria-label="Report listing concern"
                          >
                            <Flag size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => handleToggleSave(property.id, e)}
                            title={isSaved ? t.savedProperty : t.saveProperty}
                            disabled={isSaveLoading}
                            className="gs-card-icon-btn"
                            style={{ color: isSaved ? '#DC2626' : undefined }}
                            aria-label={isSaved ? 'Remove from saved' : 'Save property'}
                          >
                            <Heart size={15} fill={isSaved ? '#DC2626' : 'none'} />
                          </button>
                        </div>}
                      </div>

                      {/* Content Column */}
                      <div className="gs-property-card-list-body">
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.35rem' }}>
                            <div className="gs-property-card-price" style={{ fontSize: '1.6rem', marginBottom: 0 }}>
                              ₹{property.rentPerMonth.toLocaleString('en-IN')}
                              <span className="gs-property-card-period">/month</span>
                            </div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-muted)', fontWeight: 600 }}>
                              {property.isDemo ? 'Illustrative demo amount · not a real offer' : `Deposit: ₹${property.securityDeposit.toLocaleString('en-IN')} (Model Act Cap)`}
                            </div>
                          </div>

                          <h3 className="gs-property-card-title" title={property.title} style={{ fontSize: '1.25rem', marginBottom: '0.4rem' }}>
                            {property.title}
                          </h3>

                          <div className="gs-property-card-location" style={{ marginBottom: '0.85rem' }}>
                            <MapPin size={15} color="var(--gs-forest-primary)" style={{ flexShrink: 0 }} />
                            <span>
                              {property.locality ? `${property.locality}, ` : ''}{property.city}, {property.state}
                            </span>
                          </div>

                          <div className="gs-property-card-specs" style={{ margin: '0.75rem 0' }}>
                            <span className="gs-spec-pill">
                              🏠 {property.propertyTypeLabel || (property.bedrooms !== undefined ? `${property.bedrooms} BHK` : 'Studio')}
                            </span>
                            {property.bathrooms !== undefined && (
                              <span className="gs-spec-pill">
                                🚿 {property.bathrooms} Bath
                              </span>
                            )}
                            {property.areaSqFt && (
                              <span className="gs-spec-pill">
                                📐 {property.areaSqFt} sq.ft
                              </span>
                            )}
                            <span className="gs-spec-pill" style={{ textTransform: 'capitalize' }}>
                              🛋️ {property.furnishing.replace('_', ' ')}
                            </span>
                            <span className="gs-spec-pill" style={{ textTransform: 'capitalize' }}>
                              👥 {property.tenantPreference.replace('_', ' ')}
                            </span>
                          </div>

                          {property.amenities && property.amenities.length > 0 && (
                            <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                              {property.amenities.slice(0, 5).map((amenity) => (
                                <span
                                  key={amenity}
                                  style={{
                                    fontSize: '0.78rem',
                                    color: 'var(--gs-forest-deep)',
                                    backgroundColor: 'var(--gs-forest-soft)',
                                    border: '1px solid var(--gs-border-subtle)',
                                    borderRadius: '4px',
                                    padding: '0.2rem 0.55rem',
                                    fontWeight: 500,
                                  }}
                                >
                                  ✓ {amenity}
                                </span>
                              ))}
                              {property.amenities.length > 5 && (
                                <span style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)', padding: '0.2rem 0.35rem' }}>
                                  +{property.amenities.length - 5} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Provenance & Source Attribution (Directive 5 & 9) */}
                        {property.isDemo ? (
                          <div role="note" style={{ padding: '0.4rem 0.75rem', backgroundColor: '#FFFBEB', color: '#78350F', borderRadius: 'var(--gs-radius-sm)', border: '1px solid #D97706', fontSize: '0.76rem', margin: '0.5rem 0' }}>
                            DEMO LISTING — NOT A REAL PROPERTY · {property.demoOwnerLabel}
                          </div>
                        ) : <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.4rem 0.75rem', backgroundColor: 'var(--gs-surface-secondary)', borderRadius: 'var(--gs-radius-sm)', border: '1px solid var(--gs-border)', fontSize: '0.74rem', color: 'var(--gs-text-primary)', margin: '0.5rem 0' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}>
                            <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: property.provenance?.isFresh !== false ? '#10B981' : '#F59E0B' }} />
                            <span>Source: {property.provenance?.providerName || 'Griha Saathi first-party registry'}</span>
                          </span>
                          <span style={{ color: 'var(--gs-text-muted)', fontSize: '0.7rem' }}>
                            Traceable ID: {property.id}
                          </span>
                        </div>}

                        <div className="gs-property-card-footer" style={{ borderTop: '1px solid var(--gs-border-subtle)', paddingTop: '0.9rem' }}>
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setSelectedPropertyForModal(property); }}
                            className="gs-btn gs-btn-outline gs-btn-sm"
                          >
                            <FileCheck size={14} />
                            <span>{property.isDemo ? 'View demo details' : 'View Audit Dossier'}</span>
                          </button>
                          {!property.isDemo && <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInitiateConnection(property);
                            }}
                            disabled={connectingPropertyId === property.id}
                            className="gs-btn gs-btn-primary gs-btn-sm"
                          >
                            <PhoneCall size={14} />
                            <span>{connectingPropertyId === property.id ? 'Connecting...' : 'Request Owner Connection'}</span>
                          </button>}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: '1rem',
                  marginTop: '2.5rem',
                  paddingTop: '1.5rem',
                  borderTop: '1px solid var(--gs-border)',
                }}
              >
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="gs-btn gs-btn-outline gs-btn-sm"
                >
                  <ChevronLeft size={16} />
                  <span>{t.paginationPrev}</span>
                </button>

                <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gs-forest-deep)' }}>
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="gs-btn gs-btn-outline gs-btn-sm"
                >
                  <span>{t.paginationNext}</span>
                  <ChevronRight size={16} />
                </button>
              </div>
            )}
          </div>
        ) : (
          /* USEFUL & HONEST EMPTY STATE (Strict Data Integrity Enforcement) */
          <div className="gs-empty-state">
            <div className="gs-empty-icon">
              <ShieldCheck size={32} />
            </div>
            <div className="gs-empty-tagline" style={{ fontSize: '0.88rem', fontWeight: 700, color: '#45D6A0', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.35rem' }}>
              Your next home might need a wider search.
            </div>
            <h2 className="gs-empty-title">
                {searchMode === 'demo'
                  ? (activeFilterChips.length > 0 ? 'No Demo Listings Match These Filters' : 'No Demo Listings Available')
                  : searchDiagnostics?.status === 'filters_too_restrictive'
                  ? 'No Properties Match Selected Filters'
                : searchDiagnostics?.status === 'awaiting_provider_credentials'
                ? 'External Rental Feed Not Connected'
                : activeFilterChips.length > 0
                ? 'No Properties Matching Selected Filters'
                : 'No Approved First-Party Listings'}
            </h2>
            <p className="gs-empty-desc">
              {searchMode === 'demo'
                ? 'Try removing a filter or choosing a different region, city, locality, or budget. Demo results are fictional search examples only.'
                : searchDiagnostics?.message ||
                (activeFilterChips.length > 0
                  ? 'No approved first-party listings match these filters.'
                  : 'Search includes approved first-party owner and broker submissions. No external rental listing feeds are connected.')}
            </p>

            {/* Evidence-Based Diagnostic Pipeline Stages (Phase 6 & 8) */}
            {searchMode === 'first_party' && searchDiagnostics?.stages && searchDiagnostics.stages.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  gap: '0.75rem',
                  flexWrap: 'wrap',
                  justifyContent: 'center',
                  margin: '1rem 0 1.25rem',
                  padding: '0.75rem 1rem',
                  background: 'rgba(0,0,0,0.25)',
                  borderRadius: 'var(--gs-radius-md)',
                  border: '1px solid var(--gs-border)',
                  maxWidth: '750px',
                  width: '100%',
                }}
              >
                <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle size={14} color="var(--gs-accent-bright)" />
                  <span><strong>Registry:</strong> {searchDiagnostics.stages[0]?.recordsCount ?? 0} Stored Records</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <CheckCircle size={14} color="var(--gs-accent-bright)" />
                  <span><strong>Publication Gate:</strong> {searchDiagnostics.totalInRegistry} Publicly Approved</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Filter size={14} color="var(--gs-forest-light)" />
                  <span><strong>Filter Matches:</strong> {searchDiagnostics.totalMatchingQuery} Survived</span>
                </div>
                <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-secondary)', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <ShieldCheck size={14} color="var(--gs-accent-bright)" />
                  <span><strong>Listing evidence gate:</strong> Applied</span>
                </div>
              </div>
            )}

            {searchMode === 'first_party' && <div className="gs-integrity-callout" style={{ marginBottom: '1.25rem' }}>
              <Info size={18} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>First-party data only:</strong> Listings come from the Griha Saathi registry after approval. External rental feeds are not connected. Verification badges require recorded land-registry, owner-identity, and physical-inspection evidence; availability is shown as confirmed only when an owner confirmation is current.
              </div>
            </div>
            }

            {/* Five-Region Evidence Breakdown (Directive 3) */}
            {searchMode === 'first_party' && regionalMatrix && (
              <div className="gs-empty-matrix-section">
                <div className="gs-empty-matrix-header">
                  <ShieldCheck size={16} color="var(--gs-forest-primary)" />
                  <span>Five-Region Real-World Operational Status Matrix</span>
                </div>
                <div className="gs-empty-matrix-grid">
                  {(['Jammu & Kashmir', 'Haryana', 'Himachal Pradesh', 'Delhi', 'Punjab'] as TargetState[]).map((st) => {
                    const r = regionalMatrix.regions[st];
                    if (!r) return null;
                    const hasListings = r.activeListingCount > 0;
                    return (
                      <div 
                        key={st}
                        className={`gs-empty-matrix-cell ${hasListings ? 'has-listings' : 'empty-cell'}`}
                      >
                        <div className="gs-empty-matrix-cell-top">
                          <span className="gs-empty-matrix-state">{st}</span>
                          <span className={`gs-empty-matrix-badge ${hasListings ? 'badge-active' : 'badge-idle'}`}>
                            {hasListings ? `${r.activeListingCount} Active` : '0 Active'}
                          </span>
                        </div>
                        <div className="gs-empty-matrix-desc">
                          {hasListings ? 'Title records confirmed with revenue registry' : 'Direct listing portal operational; awaiting submissions'}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.85rem', flexWrap: 'wrap', justifyContent: 'center' }}>
              {(activeFilterChips.length > 0 || (searchDiagnostics && searchDiagnostics.hasActiveFilters)) && (
                <button onClick={resetAllFilters} className="gs-btn gs-btn-primary">
                  <RotateCcw size={16} />
                  <span>Clear Filters ({searchDiagnostics?.totalInRegistry ?? 5} Available)</span>
                </button>
              )}
              <button onClick={() => onNavigate('listing-property')} className="gs-btn gs-btn-primary">
                <PlusCircle size={16} />
                <span>List a Property for Verification</span>
              </button>
              <button onClick={() => onNavigate('verifications')} className="gs-btn gs-btn-outline">
                <FileCheck size={16} />
                <span>View Verification Audit Standards</span>
              </button>
              <button onClick={() => onNavigate('saathi-ai')} className="gs-btn gs-btn-outline">
                <Sparkles size={16} />
                <span>Consult Saathi AI Assistant</span>
              </button>
            </div>
          </div>
        )}

        {/* PROPERTY DETAIL AUDIT MODAL */}
        {selectedPropertyForModal && (
          <div className="gs-modal-backdrop" onClick={() => setSelectedPropertyForModal(null)}>
            <div
              className="gs-modal-content gs-modal-content-lg"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="gs-modal-close"
                onClick={() => setSelectedPropertyForModal(null)}
                aria-label={t.modalClose}
              >
                <X size={20} />
              </button>

              {selectedPropertyForModal.isDemo ? (
                <section aria-label="Demo property details">
                  <div role="note" style={{ margin: '0 2rem 1.25rem 0', padding: '1rem', border: '2px solid #D97706', borderRadius: 'var(--gs-radius-md)', background: '#FFFBEB', color: '#78350F', lineHeight: 1.55 }}>
                    <strong>DEMO LISTING — NOT A REAL PROPERTY.</strong>
                    <div>{DEMO_LISTING_NOTICE}</div>
                  </div>
                  <h2 style={{ color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>{selectedPropertyForModal.propertyTypeLabel}</h2>
                  <p style={{ color: 'var(--gs-text-secondary)', lineHeight: 1.6 }}>{selectedPropertyForModal.description}</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '0.75rem', margin: '1.25rem 0' }}>
                    {[
                      ['Demo rent', `₹${selectedPropertyForModal.rentPerMonth.toLocaleString('en-IN')} / month`],
                      ['Illustrative deposit', `₹${selectedPropertyForModal.securityDeposit.toLocaleString('en-IN')}`],
                      ['Approximate location', `${selectedPropertyForModal.locality}, ${selectedPropertyForModal.city}, ${selectedPropertyForModal.state}`],
                      ['Area', selectedPropertyForModal.areaSqFt ? `${selectedPropertyForModal.areaSqFt} sq.ft (illustrative)` : 'Not specified'],
                      ['Bedrooms', selectedPropertyForModal.bedrooms === undefined ? 'Not specified' : String(selectedPropertyForModal.bedrooms)],
                      ['Bathrooms', selectedPropertyForModal.bathrooms === undefined ? 'Not specified' : String(selectedPropertyForModal.bathrooms)],
                      ['Furnishing', selectedPropertyForModal.furnishing.replaceAll('_', ' ')],
                      ['Availability', selectedPropertyForModal.demoAvailabilityStatus?.replace('simulated_', '') ?? 'simulated'],
                      ['Illustrative submitter', selectedPropertyForModal.demoOwnerLabel ?? 'Demo Owner'],
                    ].map(([label, value]) => (
                      <div key={label} style={{ padding: '0.75rem', border: '1px solid var(--gs-border)', borderRadius: 'var(--gs-radius-md)', background: 'var(--gs-bg-canvas)' }}>
                        <div style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)' }}>{label}</div>
                        <div style={{ fontWeight: 700, color: 'var(--gs-forest-deep)' }}>{value}</div>
                      </div>
                    ))}
                  </div>
                  {selectedPropertyForModal.amenities.length > 0 && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h3 style={{ color: 'var(--gs-forest-deep)' }}>Illustrative features</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {selectedPropertyForModal.amenities.map((amenity) => <span key={amenity} className="gs-filter-chip">{amenity}</span>)}
                      </div>
                    </div>
                  )}
                  <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-muted)' }}>
                    No contact, save, report, or availability-reconfirmation actions are available for fictional demo records.
                  </p>
                </section>
              ) : (
                <>
              {/* Modal Header */}
              <div style={{ marginBottom: '1.25rem', paddingRight: '2rem' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--gs-accent)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                  Know the details before you fall in love.
                </div>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.4rem' }}>
                  <span className={`gs-badge ${selectedPropertyForModal.verificationStatus === 'authoritative_verified' ? 'gs-badge-verified' : 'gs-badge-warning'}`}>
                    <ShieldCheck size={14} />
                    <span>{selectedPropertyForModal.verificationStatus.replace('_', ' ').toUpperCase()}</span>
                  </span>

                  {selectedPropertyForModal.isAvailabilityConfirmed !== false ? (
                    <span className="gs-badge gs-badge-emerald">
                      <CheckCircle size={13} />
                      <span>{t.freshnessConfirmedBadge}</span>
                    </span>
                  ) : (
                    <span className="gs-badge gs-badge-warning">
                      <Clock size={13} />
                      <span>{t.freshnessStaleBadge}</span>
                    </span>
                  )}
                </div>

                <h2 style={{ fontSize: '1.5rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                  {selectedPropertyForModal.title}
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--gs-text-muted)', fontSize: '0.9rem' }}>
                  <MapPin size={16} color="var(--gs-forest-mid)" />
                  <span>
                    {selectedPropertyForModal.locality}, {selectedPropertyForModal.city}, {selectedPropertyForModal.state} ({selectedPropertyForModal.pincode})
                  </span>
                </div>
              </div>
              {/* Rent & Financials Banner */}
              <div
                style={{
                  padding: '1.25rem',
                  backgroundColor: 'var(--gs-forest-soft)',
                  border: '1px solid var(--gs-forest-muted)',
                  borderRadius: 'var(--gs-radius-lg)',
                  marginBottom: '1.5rem',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                  gap: '1rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', fontWeight: 600 }}>MONTHLY RENT</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--gs-forest-deep)' }}>
                    ₹{selectedPropertyForModal.rentPerMonth.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', fontWeight: 600 }}>SECURITY DEPOSIT</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--gs-text-primary)' }}>
                    ₹{selectedPropertyForModal.securityDeposit.toLocaleString('en-IN')}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', fontWeight: 600 }}>MAINTENANCE</div>
                  <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--gs-text-primary)' }}>
                    {selectedPropertyForModal.maintenanceCharges
                      ? `₹${selectedPropertyForModal.maintenanceCharges.toLocaleString('en-IN')}/mo`
                      : 'Included in Rent'}
                  </div>
                </div>
              </div>

              {/* Property Specs */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '1rem', marginBottom: '0.65rem', color: 'var(--gs-forest-deep)' }}>
                  Specifications & Space
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)' }}>Type</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedPropertyForModal.propertyType.toUpperCase()}</div>
                  </div>
                  {selectedPropertyForModal.bedrooms !== undefined && (
                    <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)' }}>Bedrooms</div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedPropertyForModal.bedrooms} BHK</div>
                    </div>
                  )}
                  {selectedPropertyForModal.bathrooms !== undefined && (
                    <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)' }}>Bathrooms</div>
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedPropertyForModal.bathrooms}</div>
                    </div>
                  )}
                  <div style={{ padding: '0.65rem 0.85rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--gs-text-muted)' }}>Furnishing</div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{selectedPropertyForModal.furnishing.replace('_', ' ')}</div>
                  </div>
                </div>
              </div>

              {/* Verified Amenities */}
              {selectedPropertyForModal.amenities && selectedPropertyForModal.amenities.length > 0 && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ fontSize: '1rem', marginBottom: '0.65rem', color: 'var(--gs-forest-deep)' }}>
                    {t.detailAmenities}
                  </h4>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                    {selectedPropertyForModal.amenities.map((amenity) => (
                      <span key={amenity} className="gs-filter-chip" style={{ backgroundColor: 'var(--gs-bg-canvas)' }}>
                        <Check size={13} color="var(--gs-forest-primary)" />
                        <span>{amenity}</span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Traceable Source Provenance & Registry Evidence (Directives 4, 5 & 6) */}
              <div 
                style={{ 
                  marginBottom: '1.5rem', 
                  padding: '1rem 1.25rem', 
                  borderRadius: 'var(--gs-radius-md)', 
                  backgroundColor: 'var(--gs-surface-elevated)', 
                  border: '1px solid var(--gs-border)' 
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem' }}>
                  <h4 style={{ fontSize: '0.95rem', color: 'var(--gs-text-primary)', margin: 0, fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                    <ShieldCheck size={16} color="var(--gs-accent-bright)" />
                    <span>Traceable Source Provenance & Registry Evidence</span>
                  </h4>
                  <span style={{ fontSize: '0.72rem', color: 'var(--gs-text-muted)', fontWeight: 600 }}>
                    Directive 05 Provenance
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.65rem', fontSize: '0.8rem' }}>
                  <div>
                    <span style={{ color: 'var(--gs-text-muted)' }}>Source Provider: </span>
                    <strong style={{ color: 'var(--gs-forest-deep)' }}>{selectedPropertyForModal.provenance?.providerName || 'Griha Saathi first-party listing registry'}</strong>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gs-text-muted)' }}>Provider Record ID: </span>
                    <code style={{ fontSize: '0.78rem', backgroundColor: '#E5E7EB', padding: '0.1rem 0.35rem', borderRadius: 4 }}>
                      {selectedPropertyForModal.provenance?.providerListingId || selectedPropertyForModal.id}
                    </code>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gs-text-muted)' }}>Last Retrieved: </span>
                    <span>
                      {selectedPropertyForModal.provenance?.lastRetrievedAt
                        ? new Date(selectedPropertyForModal.provenance.lastRetrievedAt).toLocaleString('en-IN')
                        : 'Live Query'}
                    </span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--gs-text-muted)' }}>Availability Confirmation: </span>
                    <span style={{ color: selectedPropertyForModal.isAvailabilityConfirmed !== false ? '#15803D' : '#B45309', fontWeight: 700 }}>
                      {selectedPropertyForModal.isAvailabilityConfirmed !== false ? 'Confirmed Active (≤60 Days)' : 'Reconfirmation Pending (>60 Days)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Authoritative Verification & Trust Report */}
              <div style={{ marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <h4 style={{ fontSize: '1rem', color: 'var(--gs-forest-deep)', margin: 0 }}>
                    {translations[language].verifications.trustReportTitle}
                  </h4>
                  <span style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                    GS-APV-2026 Authoritative Standard
                  </span>
                </div>

                {/* Granular Badges Ribbon */}
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                  {selectedPropertyForModal.ownerMaskedContact && (
                    <span className="gs-badge gs-badge-emerald" title="Submitter identity authenticated via phone/email OTP">
                      <UserCheck size={13} />
                      <span>Contact Verified</span>
                    </span>
                  )}
                  {selectedPropertyForModal.verificationStatus === 'authoritative_verified' && (
                    <span className="gs-badge gs-badge-verified" title="Ownership/authorization documents reviewed by staff">
                      <FileCheck size={13} />
                      <span>Authorization Docs Reviewed</span>
                    </span>
                  )}
                  <span className="gs-badge gs-badge-emerald">
                    <CheckCircle size={13} />
                    <span>Details & Pricing Screened</span>
                  </span>
                  {selectedPropertyForModal.isAvailabilityConfirmed !== false ? (
                    <span className="gs-badge gs-badge-emerald">
                      <Clock size={13} />
                      <span>Availability Confirmed (Active 60 Days)</span>
                    </span>
                  ) : (
                    <span className="gs-badge gs-badge-warning">
                      <Clock size={13} />
                      <span>Reconfirmation Pending</span>
                    </span>
                  )}
                </div>

                {/* Checklist Breakdown */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--gs-radius-md)', backgroundColor: 'rgba(72, 201, 149, 0.12)', border: '1px solid var(--gs-border)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <CheckCircle size={16} color="var(--gs-accent-bright)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--gs-text-primary)' }}>Submitter Contact Authentication</div>
                      <div style={{ color: 'var(--gs-text-secondary)', fontSize: '0.8rem' }}>
                        Submitter authenticated with masked identifier ({selectedPropertyForModal.ownerMaskedContact || 'Verified account'}). Verifies contact credentials; does not alone constitute legal property title.
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--gs-radius-md)', backgroundColor: selectedPropertyForModal.verificationStatus === 'authoritative_verified' ? 'rgba(72, 201, 149, 0.12)' : 'rgba(245, 158, 11, 0.12)', border: `1px solid ${selectedPropertyForModal.verificationStatus === 'authoritative_verified' ? 'var(--gs-border)' : 'rgba(245, 158, 11, 0.3)'}`, display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    {selectedPropertyForModal.verificationStatus === 'authoritative_verified' ? (
                      <CheckCircle size={16} color="var(--gs-accent-bright)" style={{ flexShrink: 0, marginTop: 2 }} />
                    ) : (
                      <Clock size={16} color="#F59E0B" style={{ flexShrink: 0, marginTop: 2 }} />
                    )}
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--gs-text-primary)' }}>
                        Ownership Evidence & Authority ({selectedPropertyForModal.declaredAuthority ? selectedPropertyForModal.declaredAuthority.replace(/_/g, ' ').toUpperCase() : 'DECLARED'})
                      </div>
                      <div style={{ color: 'var(--gs-text-secondary)', fontSize: '0.8rem' }}>
                        {selectedPropertyForModal.verificationStatus === 'authoritative_verified'
                          ? 'Ownership / sublease documentation examined and verified by platform review staff under DPDP privacy standards.'
                          : 'Documentation review pending with verification team.'}
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--gs-radius-md)', backgroundColor: 'rgba(72, 201, 149, 0.12)', border: '1px solid var(--gs-border)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <CheckCircle size={16} color="var(--gs-accent-bright)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--gs-text-primary)' }}>Specification & Pricing Sanity</div>
                      <div style={{ color: 'var(--gs-text-secondary)', fontSize: '0.8rem' }}>
                        Rent (₹{selectedPropertyForModal.rentPerMonth.toLocaleString('en-IN')}/mo) and deposit (₹{selectedPropertyForModal.securityDeposit.toLocaleString('en-IN')}) verified within standard tenancy limits for {selectedPropertyForModal.locality}, {selectedPropertyForModal.city}.
                      </div>
                    </div>
                  </div>

                  <div style={{ padding: '0.75rem 1rem', borderRadius: 'var(--gs-radius-md)', backgroundColor: selectedPropertyForModal.verificationStatus === 'physically_inspected' ? 'rgba(72, 201, 149, 0.12)' : 'var(--gs-surface-secondary)', border: `1px solid ${selectedPropertyForModal.verificationStatus === 'physically_inspected' ? 'var(--gs-border)' : 'var(--gs-divider)'}`, display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                    <Info size={16} color="var(--gs-text-muted)" style={{ flexShrink: 0, marginTop: 2 }} />
                    <div style={{ fontSize: '0.85rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--gs-text-primary)' }}>Physical On-Site Inspection Status</div>
                      <div style={{ color: 'var(--gs-text-muted)', fontSize: '0.8rem' }}>
                        {selectedPropertyForModal.verificationStatus === 'physically_inspected'
                          ? 'Physical on-site inspection conducted and certified by an authorized field inspector.'
                          : 'Physical on-site inspection has not been conducted by platform verifiers. Tenants are strongly advised to inspect the premises in person prior to transferring token amounts.'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statutory Disclaimer Box */}
                <div style={{ marginTop: '0.85rem', padding: '0.75rem', borderRadius: 'var(--gs-radius-md)', backgroundColor: 'var(--gs-bg-canvas)', border: '1px solid var(--gs-border)', fontSize: '0.78rem', color: 'var(--gs-text-muted)', lineHeight: 1.5 }}>
                  <strong>Statutory Limitation:</strong> {translations[language].verifications.trustReportDisclaimer}
                </div>
              </div>

              {/* Freshness & Owner Reconfirmation Action */}
              <div
                style={{
                  padding: '1rem',
                  backgroundColor: 'var(--gs-bg-canvas)',
                  border: '1px solid var(--gs-border)',
                  borderRadius: 'var(--gs-radius-md)',
                  marginBottom: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
                  <div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>
                      {t.detailFreshnessInfo}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)', marginTop: '0.15rem' }}>
                      Last availability confirmation:{' '}
                      <strong>
                        {selectedPropertyForModal.availabilityConfirmedAt
                          ? new Date(selectedPropertyForModal.availabilityConfirmedAt).toLocaleString()
                          : 'Pending initial audit'}
                      </strong>{' '}
                      &bull; 60-day rule enforced
                    </div>
                  </div>

                  {user && (user.id === selectedPropertyForModal.ownerId || user.activeRole === 'admin') && (
                    <button
                      onClick={() => handleReconfirmAvailability(selectedPropertyForModal.id)}
                      disabled={reconfirmLoading}
                      className="gs-btn gs-btn-sm gs-btn-primary"
                    >
                      <Clock size={14} />
                      <span>{reconfirmLoading ? 'Updating...' : t.reconfirmAvailabilityButton}</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Modal Footer CTA */}
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setReportingProperty(selectedPropertyForModal)}
                  className="gs-btn gs-btn-outline gs-btn-sm"
                  style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                >
                  <Flag size={14} />
                  <span>{translations[language].verifications.reportListing}</span>
                </button>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => handleToggleSave(selectedPropertyForModal.id)}
                    className="gs-btn gs-btn-outline"
                  >
                    <Heart size={16} fill={savedPropertyIds.has(selectedPropertyForModal.id) ? '#DC2626' : 'none'} color={savedPropertyIds.has(selectedPropertyForModal.id) ? '#DC2626' : 'currentColor'} />
                    <span>{savedPropertyIds.has(selectedPropertyForModal.id) ? t.savedProperty : t.saveProperty}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleInitiateConnection(selectedPropertyForModal)}
                    disabled={connectingPropertyId === selectedPropertyForModal.id}
                    className="gs-btn gs-btn-primary"
                  >
                    <PhoneCall size={16} />
                    <span>{connectingPropertyId === selectedPropertyForModal.id ? 'Connecting...' : 'Request Verified Owner Connection'}</span>
                  </button>
                </div>
              </div>
                  </>
                )}
            </div>
          </div>
        )}

        {/* REPORT LISTING MODAL */}
        {reportingProperty && (
          <div className="gs-modal-backdrop" onClick={() => setReportingProperty(null)}>
            <div className="gs-modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '520px' }}>
              <button
                className="gs-modal-close"
                onClick={() => setReportingProperty(null)}
              >
                <X size={20} />
              </button>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                <Flag size={20} color="#DC2626" />
                <h3 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)', margin: 0 }}>
                  {translations[language].verifications.reportModalTitle}
                </h3>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--gs-text-muted)', marginBottom: '1.25rem' }}>
                Reporting: <strong>{reportingProperty.title}</strong> ({reportingProperty.locality}, {reportingProperty.city})
              </p>

              {reportFeedback && (
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--gs-radius-md)',
                    marginBottom: '1rem',
                    backgroundColor: reportFeedback.type === 'success' ? '#F0FDF4' : '#FEE2E2',
                    border: `1px solid ${reportFeedback.type === 'success' ? '#BBF7D0' : '#FCA5A5'}`,
                    color: reportFeedback.type === 'success' ? '#166534' : '#991B1B',
                    fontSize: '0.85rem',
                  }}
                >
                  {reportFeedback.message}
                </div>
              )}

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!user || !token) {
                    showToast('Please sign in to submit a verification concern.', 'info');
                    if (onOpenAuth) onOpenAuth();
                    return;
                  }
                  if (!reportDescription.trim()) {
                    setReportFeedback({ message: 'Please provide context for your concern.', type: 'error' });
                    return;
                  }

                  setReportSubmitting(true);
                  setReportFeedback(null);

                  try {
                    const res = await fetch(`/api/properties/${reportingProperty.id}/report`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        Authorization: `Bearer ${token}`,
                      },
                      body: JSON.stringify({
                        reason: reportReason,
                        description: reportDescription.trim(),
                      }),
                    });

                    const data = await res.json();
                    if (!res.ok || !data.success) {
                      setReportFeedback({ message: data.error || 'Failed to submit report.', type: 'error' });
                      return;
                    }

                    setReportFeedback({
                      message: translations[language].verifications.reportSuccess,
                      type: 'success',
                    });
                    setTimeout(() => {
                      setReportingProperty(null);
                      setReportDescription('');
                      setReportFeedback(null);
                    }, 2500);
                  } catch (err) {
                    setReportFeedback({ message: 'Connection error submitting report.', type: 'error' });
                  } finally {
                    setReportSubmitting(false);
                  }
                }}
              >
                <div className="gs-form-field" style={{ marginBottom: '1rem' }}>
                  <label className="gs-form-label">
                    {translations[language].verifications.reportReasonLabel}
                  </label>
                  <select
                    value={reportReason}
                    onChange={(e) => setReportReason(e.target.value as FraudReportReason)}
                    disabled={reportSubmitting}
                  >
                    <option value="suspected_fake">Suspected fake or non-existent listing</option>
                    <option value="misrepresented_rent">Misrepresented rent, hidden charges or deposit</option>
                    <option value="unauthorized_listing">Unauthorized advertisement by third party</option>
                    <option value="suspicious_payment">Demand for advance payment before inspection</option>
                    <option value="misleading_photos">Misleading, stock, or reused photographs</option>
                    <option value="duplicate_listing">Suspected duplicate listing</option>
                    <option value="impersonation_fraud">Landlord impersonation</option>
                    <option value="other">Other trust & safety concern</option>
                  </select>
                </div>

                <div className="gs-form-field" style={{ marginBottom: '1.25rem' }}>
                  <label className="gs-form-label">
                    {translations[language].verifications.reportDescLabel}
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Provide specific details (e.g., requested ₹5,000 token before showing property, or photographs match another building)..."
                    value={reportDescription}
                    onChange={(e) => setReportDescription(e.target.value)}
                    disabled={reportSubmitting}
                    required
                  />
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)', fontSize: '0.75rem', color: 'var(--gs-text-muted)', marginBottom: '1.25rem' }}>
                  <strong>Reporter Privacy Notice:</strong> Per the DPDP Act 2023, your identity is strictly masked and will never be shared with the listing owner. Unreviewed reports do not automatically remove a listing until reviewed by moderators.
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setReportingProperty(null)}
                    disabled={reportSubmitting}
                    className="gs-btn gs-btn-outline"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="gs-btn gs-btn-primary"
                    style={{ backgroundColor: '#DC2626', borderColor: '#DC2626' }}
                  >
                    {reportSubmitting ? 'Submitting...' : translations[language].verifications.reportSubmitButton}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MOBILE FILTER DRAWER (Rendered via React Portal) */}
        {isMobileDrawerOpen && typeof document !== 'undefined' && createPortal(
          <>
            <div
              className="gs-filter-drawer-backdrop"
              onClick={() => setIsMobileDrawerOpen(false)}
            />
            <div className="gs-filter-drawer-panel" role="dialog" aria-modal="true" aria-label="Filters and Refinements">
              {/* Header */}
              <div className="gs-filter-drawer-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <SlidersHorizontal size={18} color="var(--gs-forest-primary)" />
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--gs-forest-deep)' }}>
                    Filter Properties
                  </span>
                  {activeFilterChips.length > 0 && (
                    <span style={{ backgroundColor: 'var(--gs-forest-soft)', color: 'var(--gs-forest-primary)', borderRadius: '999px', fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem' }}>
                      {activeFilterChips.length} active
                    </span>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  style={{ color: 'var(--gs-text-muted)', padding: '0.35rem', cursor: 'pointer' }}
                  aria-label="Close filters drawer"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Drawer Scrollable Body */}
              <div className="gs-filter-drawer-body">
                {/* 1. Region */}
                <div className="gs-form-field">
                  <label className="gs-form-label">{t.filterState}</label>
                  <select
                    value={stateFilter}
                    onChange={(e) => { setStateFilter(e.target.value); setCityFilter(''); setLocalityFilter(''); setCurrentPage(1); }}
                  >
                    <option value="all">All 5 Northern Regions</option>
                    <option value="Delhi">Delhi NCR (DDA)</option>
                    <option value="Haryana">Haryana (Jamabandi)</option>
                    <option value="Punjab">Punjab (PLRS)</option>
                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                    <option value="Jammu & Kashmir">Jammu & Kashmir</option>
                  </select>
                </div>

                {/* 2. City & Locality */}
                <div className="gs-form-field">
                  <label className="gs-form-label">{t.filterCity}</label>
                  {searchMode === 'demo' ? (
                    <select value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setLocalityFilter(''); setCurrentPage(1); }}>
                      <option value="">All cities</option>
                      {demoCities.map((city) => <option key={city} value={city}>{city}</option>)}
                    </select>
                  ) : <input type="text" placeholder="City" value={cityFilter} onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }} />}
                </div>

                <div className="gs-form-field">
                  <label className="gs-form-label">{t.filterLocality}</label>
                  {searchMode === 'demo' ? (
                    <select value={localityFilter} onChange={(e) => { setLocalityFilter(e.target.value); setCurrentPage(1); }}>
                      <option value="">All localities</option>
                      {demoLocalities.map((locality) => <option key={locality} value={locality}>{locality}</option>)}
                    </select>
                  ) : <input type="text" placeholder="Locality" value={localityFilter} onChange={(e) => { setLocalityFilter(e.target.value); setCurrentPage(1); }} />}
                </div>

                {/* 3. Property Type */}
                <div className="gs-form-field">
                  <label className="gs-form-label">{t.filterType}</label>
                  <select
                    value={typeFilter}
                    onChange={(e) => { setTypeFilter(e.target.value); setCurrentPage(1); }}
                  >
                    <option value="all">Any Category</option>
                    <option value="1bhk">1 BHK Apartment</option>
                    <option value="2bhk">2 BHK Apartment</option>
                    <option value="3bhk">3 BHK Apartment</option>
                    <option value="4bhk_plus">4+ BHK Apartment</option>
                    <option value="independent_house">Independent House</option>
                    <option value="villa">Villa / Kothi</option>
                    <option value="studio">Studio Apartment</option>
                    <option value="pg_coliving">PG / Co-living</option>
                  </select>
                </div>
                {searchMode === 'demo' && (
                  <div className="gs-form-field">
                    <label className="gs-form-label">Demo property type</label>
                    <select value={demoPropertyTypeFilter} onChange={(e) => { setDemoPropertyTypeFilter(e.target.value as DemoPropertyType | 'all'); setCurrentPage(1); }}>
                      <option value="all">All residential demo types</option>
                      {DEMO_PROPERTY_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}
                    </select>
                  </div>
                )}

                {/* 4. Budget Range */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="gs-form-field">
                    <label className="gs-form-label">{t.filterRentMin}</label>
                    <input
                      type="number"
                      placeholder="Min ₹"
                      value={minRentFilter}
                      min="0"
                      step="1000"
                      onChange={(e) => { setMinRentFilter(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <div className="gs-form-field">
                    <label className="gs-form-label">{t.filterRentMax}</label>
                    <input
                      type="number"
                      placeholder="Max ₹"
                      value={maxRentFilter}
                      min="0"
                      step="1000"
                      onChange={(e) => { setMaxRentFilter(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                </div>

                {/* 5. Carpet Area (sq.ft) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div className="gs-form-field">
                    <label className="gs-form-label">Min Sq.Ft</label>
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={minAreaFilter}
                      min="0"
                      step="50"
                      onChange={(e) => { setMinAreaFilter(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                  <div className="gs-form-field">
                    <label className="gs-form-label">Max Sq.Ft</label>
                    <input
                      type="number"
                      placeholder="e.g. 2500"
                      value={maxAreaFilter}
                      min="0"
                      step="50"
                      onChange={(e) => { setMaxAreaFilter(e.target.value); setCurrentPage(1); }}
                    />
                  </div>
                </div>
                <div className="gs-form-field">
                  <label className="gs-form-label">{searchMode === 'demo' ? 'Simulated available by' : 'Available by'}</label>
                  <input type="date" value={availableFromFilter} onChange={(e) => { setAvailableFromFilter(e.target.value); setCurrentPage(1); }} />
                </div>

                {/* 6. Bedrooms */}
                <div>
                  <label className="gs-form-label" style={{ marginBottom: '0.45rem', display: 'block' }}>{searchMode === 'demo' ? 'Bedrooms range' : t.filterBedrooms}</label>
                  {searchMode === 'demo' ? (
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input aria-label="Minimum bedrooms" type="number" min="0" max="10" placeholder="Min" value={minBedroomsFilter} onChange={(e) => { setMinBedroomsFilter(e.target.value); setCurrentPage(1); }} />
                      <input aria-label="Maximum bedrooms" type="number" min="0" max="10" placeholder="Max" value={maxBedroomsFilter} onChange={(e) => { setMaxBedroomsFilter(e.target.value); setCurrentPage(1); }} />
                    </div>
                  ) :
                  <div className="gs-pill-group">
                    {[
                      { id: 'all', label: 'Any' },
                      { id: '1', label: '1 BHK' },
                      { id: '2', label: '2 BHK' },
                      { id: '3', label: '3 BHK' },
                      { id: '4', label: '4+ BHK' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setBedroomsFilter(opt.id); setCurrentPage(1); }}
                        className={`gs-pill-option ${bedroomsFilter === opt.id ? 'active' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>}
                </div>

                {/* 7. Furnishing */}
                <div>
                  <label className="gs-form-label" style={{ marginBottom: '0.45rem', display: 'block' }}>{t.filterFurnishing}</label>
                  <div className="gs-pill-group">
                    {[
                      { id: 'all', label: 'Any' },
                      { id: 'unfurnished', label: 'Unfurnished' },
                      { id: 'semi_furnished', label: 'Semi' },
                      { id: 'fully_furnished', label: 'Fully' },
                    ].map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => { setFurnishingFilter(opt.id); setCurrentPage(1); }}
                        className={`gs-pill-option ${furnishingFilter === opt.id ? 'active' : ''}`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {searchMode === 'demo' && (
                  <>
                    <div className="gs-form-field">
                      <label className="gs-form-label">Suitable for (simulated)</label>
                      <select value={preferenceFilter} onChange={(e) => { setPreferenceFilter(e.target.value); setCurrentPage(1); }}>
                        <option value="all">Any</option>
                        <option value="students">Students</option>
                        <option value="family">Families</option>
                        <option value="working_professionals">Working professionals</option>
                      </select>
                    </div>
                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
                      <input type="checkbox" checked={petFriendlyOnly} onChange={(e) => { setPetFriendlyOnly(e.target.checked); setCurrentPage(1); }} />
                      Pet-friendly only (simulated)
                    </label>
                  </>
                )}

                {/* 8. Amenities */}
                <div>
                  <label className="gs-form-label" style={{ marginBottom: '0.45rem', display: 'block' }}>{t.filterAmenities}</label>
                  <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
                    {COMMON_AMENITIES.map((amenity) => {
                      const isSelected = selectedAmenities.includes(amenity);
                      return (
                        <button
                          key={amenity}
                          type="button"
                          onClick={() => toggleAmenity(amenity)}
                          className={`gs-pill-option ${isSelected ? 'active' : ''}`}
                          style={{ fontSize: '0.78rem' }}
                        >
                          {isSelected && '✓ '}
                          {amenity}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* 9. Statutory Integrity Toggles */}
                {searchMode === 'first_party' && <div style={{ padding: '0.85rem', backgroundColor: 'var(--gs-bg-canvas)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', fontWeight: 600, color: 'var(--gs-forest-deep)', cursor: 'pointer', marginBottom: '0.5rem' }}>
                    <input
                      type="checkbox"
                      checked={onlyVerified}
                      onChange={(e) => { setOnlyVerified(e.target.checked); setCurrentPage(1); }}
                      style={{ width: 'auto', accentColor: 'var(--gs-forest-primary)' }}
                    />
                    <ShieldCheck size={16} color="var(--gs-forest-primary)" />
                    <span>{t.filterOnlyVerified}</span>
                  </label>

                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', fontWeight: 600, color: 'var(--gs-forest-deep)', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={confirmedAvailableOnly}
                      onChange={(e) => { setConfirmedAvailableOnly(e.target.checked); setCurrentPage(1); }}
                      style={{ width: 'auto', accentColor: 'var(--gs-forest-primary)' }}
                    />
                    <Clock size={16} color="#059669" />
                    <span>{t.filterConfirmedOnly}</span>
                  </label>
                </div>}
              </div>

              {/* Drawer Footer Actions */}
              <div className="gs-filter-drawer-footer">
                <button
                  type="button"
                  onClick={resetAllFilters}
                  className="gs-btn gs-btn-outline gs-btn-sm"
                  style={{ flex: 1 }}
                >
                  <RotateCcw size={14} />
                  <span>Reset</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  className="gs-btn gs-btn-primary gs-btn-sm"
                  style={{ flex: 2 }}
                >
                  <span>Apply & View Results</span>
                </button>
              </div>
            </div>
          </>,
          document.body
        )}
        {/* Five-Region Evidence Matrix Modal Portal (Directive 3 & 9) */}
        {showRegionalMatrixModal && regionalMatrix && createPortal(
          <div 
            className="gs-modal-backdrop" 
            onClick={() => setShowRegionalMatrixModal(false)}
            style={{ zIndex: 100000 }}
          >
            <div 
              className="gs-modal-content gs-modal-content-lg" 
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '820px' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--gs-forest-deep)', margin: '0 0 0.35rem' }}>
                    Five-Region Real Property Coverage & Integration Matrix
                  </h3>
                  <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-secondary)' }}>
                    Strict Zero-Synthetic Data Law &bull; Real-world evidence status across Northern Bharat
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowRegionalMatrixModal(false)}
                  className="gs-btn gs-btn-outline gs-btn-sm"
                  style={{ borderRadius: '50%', width: 32, height: 32, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Matrix Table */}
              <div style={{ overflowX: 'auto', marginBottom: '1.25rem' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ backgroundColor: 'var(--gs-bg-canvas)', borderBottom: '2px solid var(--gs-border)' }}>
                      <th style={{ padding: '0.75rem 0.85rem', color: 'var(--gs-forest-deep)', fontWeight: 700 }}>Target Region</th>
                      <th style={{ padding: '0.75rem 0.85rem', color: 'var(--gs-forest-deep)', fontWeight: 700 }}>Operational Status</th>
                      <th style={{ padding: '0.75rem 0.85rem', color: 'var(--gs-forest-deep)', fontWeight: 700, textAlign: 'center' }}>Eligible First-Party Listings</th>
                      <th style={{ padding: '0.75rem 0.85rem', color: 'var(--gs-forest-deep)', fontWeight: 700 }}>Coverage Scope & Limitations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(['Jammu & Kashmir', 'Haryana', 'Himachal Pradesh', 'Delhi', 'Punjab'] as TargetState[]).map((st) => {
                      const r = regionalMatrix.regions[st];
                      if (!r) return null;
                      const hasListings = r.activeListingCount > 0;
                      return (
                        <tr key={st} style={{ borderBottom: '1px solid var(--gs-border)' }}>
                          <td style={{ padding: '0.75rem 0.85rem', fontWeight: 700, color: 'var(--gs-forest-deep)' }}>
                            {st}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem' }}>
                            <span 
                              style={{ 
                                display: 'inline-block',
                                padding: '0.2rem 0.55rem', 
                                borderRadius: '999px',
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                backgroundColor: hasListings ? '#DCFCE7' : '#F3F4F6',
                                color: hasListings ? '#166534' : '#4B5563',
                                border: hasListings ? '1px solid #BBF7D0' : '1px solid #E5E7EB'
                              }}
                            >
                              {r.statusLabel}
                            </span>
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', textAlign: 'center', fontWeight: 700, fontSize: '0.92rem' }}>
                            {r.activeListingCount}
                          </td>
                          <td style={{ padding: '0.75rem 0.85rem', color: 'var(--gs-text-secondary)', fontSize: '0.76rem', lineHeight: 1.4 }}>
                            {r.limitations}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Data Integrity Callout */}
              <div 
                style={{ 
                  padding: '0.85rem 1rem', 
                  backgroundColor: 'rgba(72, 201, 149, 0.12)', 
                  borderRadius: 'var(--gs-radius-md)', 
                  border: '1px solid var(--gs-border)',
                  fontSize: '0.78rem',
                  color: 'var(--gs-text-primary)',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '0.65rem',
                  marginBottom: '1.25rem'
                }}
              >
                <ShieldCheck size={18} color="var(--gs-forest-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                <div>
                  <strong>Directive 0 Law:</strong> Griha Saathi never manufactures dummy or synthetic listings to give an illusion of coverage. If a territory currently has 0 direct owner listings, it is honestly displayed as 0. Direct owner submissions are processed through the Listing Property workflow.
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowRegionalMatrixModal(false);
                    onNavigate('listing-property');
                  }}
                  className="gs-btn gs-btn-primary"
                  style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                >
                  <PlusCircle size={15} />
                  <span>Submit Listing in Any of 5 Regions</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRegionalMatrixModal(false)}
                  className="gs-btn gs-btn-outline"
                  style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
                >
                  <span>Close Matrix</span>
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </div>
  );
};
