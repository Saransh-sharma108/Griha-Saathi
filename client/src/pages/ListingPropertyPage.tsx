import React, { useState, useEffect } from 'react';
import { 
  PlusCircle, 
  MapPin, 
  Building, 
  IndianRupee, 
  FileText, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft,
  Upload,
  Info,
  Save,
  Trash2,
  Image as ImageIcon,
  Check,
  FileCheck,
  Lock,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink
} from 'lucide-react';
import { 
  FurnishingStatus, 
  PropertyType, 
  SupportedLanguage, 
  TargetState, 
  TenantPreference, 
  UserProfile,
  DeclaredAuthority,
  PropertyMediaItem,
  PropertyDocumentItem,
  ListingDraft
} from '@shared/types';
import { translations } from '@shared/i18n';
import { NavSection } from '../components/Header';

interface ListingPropertyPageProps {
  user: UserProfile | null;
  token?: string | null;
  onOpenAuth: () => void;
  onNavigate: (section: NavSection) => void;
  language: SupportedLanguage;
}

export const ListingPropertyPage: React.FC<ListingPropertyPageProps> = ({
  user,
  token,
  onOpenAuth,
  onNavigate,
  language,
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 7;

  // Active Draft ID if resuming
  const [activeDraftId, setActiveDraftId] = useState<string | null>(null);
  const [savedDrafts, setSavedDrafts] = useState<ListingDraft[]>([]);
  const [showDraftsModal, setShowDraftsModal] = useState(false);
  const [draftSaveSuccess, setDraftSaveSuccess] = useState<string | null>(null);

  // STEP 1: Purpose & Authority
  const [purpose, setPurpose] = useState<'rent' | 'lease'>('rent');
  const [propertyCategory, setPropertyCategory] = useState<'residential' | 'coliving' | 'independent'>('residential');
  const [declaredAuthority, setDeclaredAuthority] = useState<DeclaredAuthority>('owner');
  const [sublessorDeclaration, setSublessorDeclaration] = useState(false);

  // STEP 2: Location & Address
  const [state, setState] = useState<TargetState>('Haryana');
  const [city, setCity] = useState('');
  const [locality, setLocality] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [pincode, setPincode] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // STEP 3: Property Details
  const [title, setTitle] = useState('');
  const [propertyType, setPropertyType] = useState<PropertyType>('2bhk');
  const [bedrooms, setBedrooms] = useState<number>(2);
  const [bathrooms, setBathrooms] = useState<number>(2);
  const [areaSqFt, setAreaSqFt] = useState<string>('1150');
  const [furnishing, setFurnishing] = useState<FurnishingStatus>('semi_furnished');
  const [floorNumber, setFloorNumber] = useState<string>('3');
  const [totalFloors, setTotalFloors] = useState<string>('8');
  const [amenities, setAmenities] = useState<string[]>([
    'Gated Security', 
    '24x7 Power Backup', 
    'Municipal Water Supply', 
    'Reserved Parking'
  ]);
  const [description, setDescription] = useState('');

  // STEP 4: Rental & Availability Details
  const [rentPerMonth, setRentPerMonth] = useState('');
  const [securityDeposit, setSecurityDeposit] = useState('');
  const [maintenanceCharges, setMaintenanceCharges] = useState('0');
  const [leaseTerms, setLeaseTerms] = useState('11 Months standard lease with 1 month notice period.');
  const [tenantPreference, setTenantPreference] = useState<TenantPreference>('any');
  const [availableFrom, setAvailableFrom] = useState(new Date().toISOString().split('T')[0]);
  const [availabilityConfirmed, setAvailabilityConfirmed] = useState(true);

  // STEP 5: Genuine Media
  const [mediaItems, setMediaItems] = useState<PropertyMediaItem[]>([]);
  const [mediaUploading, setMediaUploading] = useState(false);
  const [mediaError, setMediaError] = useState<string | null>(null);

  // STEP 6: Documents & Ownership Proof
  const [documents, setDocuments] = useState<PropertyDocumentItem[]>([]);
  const [selectedDocType, setSelectedDocType] = useState<string>('title_deed');
  const [docUploading, setDocUploading] = useState(false);
  const [docError, setDocError] = useState<string | null>(null);
  const [docAuthConfirmed, setDocAuthConfirmed] = useState(false);

  // STEP 7: Review & Accuracy Declaration
  const [accuracyDeclared, setAccuracyDeclared] = useState(false);

  // Submission State
  const [loading, setLoading] = useState(false);
  const [submittedPropertyId, setSubmittedPropertyId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = translations[language].listing;

  // Load existing drafts if authenticated
  useEffect(() => {
    if (user && token) {
      fetchUserDrafts();
    }
  }, [user, token]);

  const fetchUserDrafts = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/properties/drafts', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.drafts)) {
        setSavedDrafts(data.drafts);
      }
    } catch (err) {
      console.error('Error fetching drafts:', err);
    }
  };

  const loadDraftIntoState = (draft: ListingDraft) => {
    setActiveDraftId(draft.id);
    setCurrentStep(draft.currentStep || 1);
    const d: any = draft.data || {};

    if (d.declaredAuthority) setDeclaredAuthority(d.declaredAuthority);
    if (d.sublessorDeclaration !== undefined) setSublessorDeclaration(Boolean(d.sublessorDeclaration));
    if (d.purpose) setPurpose(d.purpose);
    if (d.propertyCategory) setPropertyCategory(d.propertyCategory);

    if (d.state) setState(d.state);
    if (d.city) setCity(d.city);
    if (d.locality) setLocality(d.locality);
    if (d.addressDetails) setAddressDetails(d.addressDetails);
    if (d.pincode) setPincode(d.pincode);
    if (d.latitude) setLatitude(String(d.latitude));
    if (d.longitude) setLongitude(String(d.longitude));

    if (d.title) setTitle(d.title);
    if (d.propertyType) setPropertyType(d.propertyType);
    if (d.bedrooms) setBedrooms(Number(d.bedrooms));
    if (d.bathrooms) setBathrooms(Number(d.bathrooms));
    if (d.areaSqFt) setAreaSqFt(String(d.areaSqFt));
    if (d.furnishing) setFurnishing(d.furnishing);
    if (d.floorNumber) setFloorNumber(String(d.floorNumber));
    if (d.totalFloors) setTotalFloors(String(d.totalFloors));
    if (Array.isArray(d.amenities)) setAmenities(d.amenities);
    if (d.description) setDescription(d.description);

    if (d.rentPerMonth) setRentPerMonth(String(d.rentPerMonth));
    if (d.securityDeposit) setSecurityDeposit(String(d.securityDeposit));
    if (d.maintenanceCharges !== undefined) setMaintenanceCharges(String(d.maintenanceCharges));
    if (d.leaseTerms) setLeaseTerms(d.leaseTerms);
    if (d.tenantPreference) setTenantPreference(d.tenantPreference);
    if (d.availableFrom) setAvailableFrom(d.availableFrom);
    if (d.availabilityConfirmed !== undefined) setAvailabilityConfirmed(Boolean(d.availabilityConfirmed));

    if (Array.isArray(d.mediaItems)) setMediaItems(d.mediaItems);
    if (Array.isArray(d.documents)) setDocuments(d.documents);

    setShowDraftsModal(false);
    setDraftSaveSuccess(`Loaded saved draft from ${new Date(draft.updatedAt).toLocaleDateString()}`);
    setTimeout(() => setDraftSaveSuccess(null), 4000);
  };

  const handleSaveDraft = async () => {
    if (!token) {
      onOpenAuth();
      return;
    }

    setErrorMessage(null);
    setDraftSaveSuccess(null);

    const draftPayload = {
      declaredAuthority,
      sublessorDeclaration,
      purpose,
      propertyCategory,
      state,
      city,
      locality,
      addressDetails,
      pincode,
      latitude,
      longitude,
      title: title || `${propertyType.toUpperCase()} in ${locality || city || state}`,
      propertyType,
      bedrooms,
      bathrooms,
      areaSqFt: Number(areaSqFt) || 0,
      furnishing,
      floorNumber: Number(floorNumber) || 0,
      totalFloors: Number(totalFloors) || 0,
      amenities,
      description,
      rentPerMonth: Number(rentPerMonth) || 0,
      securityDeposit: Number(securityDeposit) || 0,
      maintenanceCharges: Number(maintenanceCharges) || 0,
      leaseTerms,
      tenantPreference,
      availableFrom,
      availabilityConfirmed,
      mediaItems,
      documents,
    };

    try {
      const res = await fetch('/api/properties/drafts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          draftId: activeDraftId || undefined,
          currentStep,
          data: draftPayload,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to save draft to server.');
        return;
      }

      setActiveDraftId(data.draft.id);
      setDraftSaveSuccess(t.draftSavedSuccess);
      fetchUserDrafts();
      setTimeout(() => setDraftSaveSuccess(null), 3500);
    } catch (err) {
      setErrorMessage('Network connection error while saving draft.');
    }
  };

  const handleDeleteDraft = async (draftId: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/properties/drafts/${draftId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setSavedDrafts((prev) => prev.filter((d) => d.id !== draftId));
        if (activeDraftId === draftId) {
          setActiveDraftId(null);
        }
      }
    } catch (err) {
      console.error('Failed to delete draft:', err);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };

  // Upload Media
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    if (!token) {
      onOpenAuth();
      return;
    }

    setMediaUploading(true);
    setMediaError(null);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.size > 5 * 1024 * 1024) {
          setMediaError(`File "${file.name}" exceeds maximum allowed size of 5MB.`);
          continue;
        }

        const base64Data = await fileToBase64(file);

        const res = await fetch('/api/properties/upload/media', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            base64Data,
            filename: file.name,
            mimeType: file.type || 'image/jpeg',
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          setMediaError(data.error || `Upload failed for "${file.name}".`);
          continue;
        }

        setMediaItems((prev) => [...prev, data.media]);
      }
    } catch (err) {
      setMediaError('Network error uploading photograph.');
    } finally {
      setMediaUploading(false);
      e.target.value = '';
    }
  };

  const handleRemovePhoto = (id: string) => {
    setMediaItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Upload Document
  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!token) {
      onOpenAuth();
      return;
    }

    setDocUploading(true);
    setDocError(null);

    try {
      if (file.size > 10 * 1024 * 1024) {
        setDocError(`Document "${file.name}" exceeds maximum allowed size of 10MB.`);
        return;
      }

      const base64Data = await fileToBase64(file);

      const res = await fetch('/api/properties/upload/document', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          base64Data,
          filename: file.name,
          mimeType: file.type || 'application/pdf',
          documentType: selectedDocType,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setDocError(data.error || `Upload failed for document "${file.name}".`);
        return;
      }

      setDocuments((prev) => [...prev, data.document]);
    } catch (err) {
      setDocError('Network error uploading ownership document.');
    } finally {
      setDocUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveDoc = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const toggleAmenity = (item: string) => {
    if (amenities.includes(item)) {
      setAmenities(amenities.filter((a) => a !== item));
    } else {
      setAmenities([...amenities, item]);
    }
  };

  // Validation Checkers
  const step1Valid = declaredAuthority !== 'tenant' || sublessorDeclaration;
  const step2Valid = city.trim().length > 1 && locality.trim().length > 1 && addressDetails.trim().length > 2 && /^\d{6}$/.test(pincode.trim());
  const step3Valid = (title.trim().length > 3 || locality.trim().length > 0) && Number(areaSqFt) > 50;
  const step4Valid = Number(rentPerMonth) > 0 && Number(securityDeposit) >= 0 && Boolean(availableFrom);
  const step6Valid = documents.length > 0 && docAuthConfirmed;
  const step7Valid = step1Valid && step2Valid && step3Valid && step4Valid && accuracyDeclared;

  const handleSubmitFinal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) {
      onOpenAuth();
      return;
    }

    setErrorMessage(null);

    if (!step7Valid) {
      setErrorMessage(t.mandatoryFieldsNotice);
      return;
    }

    setLoading(true);

    try {
      const payload = {
        title: title.trim() || `${bedrooms} BHK ${propertyType.toUpperCase()} in ${locality}, ${city}`,
        description: description.trim() || `Authentic rental property in ${locality}, ${city}, ${state}. Verified listing.`,
        state,
        city: city.trim(),
        locality: locality.trim(),
        addressDetails: addressDetails.trim(),
        pincode: pincode.trim(),
        latitude: latitude ? Number(latitude) : undefined,
        longitude: longitude ? Number(longitude) : undefined,
        propertyType,
        bedrooms: Number(bedrooms) || 1,
        bathrooms: Number(bathrooms) || 1,
        areaSqFt: Number(areaSqFt) || 0,
        floorNumber: Number(floorNumber) || 0,
        totalFloors: Number(totalFloors) || 0,
        rentPerMonth: Number(rentPerMonth),
        securityDeposit: Number(securityDeposit),
        maintenanceCharges: Number(maintenanceCharges) || 0,
        leaseTerms: leaseTerms.trim(),
        furnishing,
        tenantPreference,
        availableFrom,
        amenities,
        declaredAuthority,
        sublessorDeclaration,
        photos: mediaItems.map((m) => m.url),
        mediaItems,
        documents,
        draftId: activeDraftId || undefined,
      };

      const res = await fetch('/api/properties', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setErrorMessage(data.error || 'Failed to submit property for verification.');
        return;
      }

      setSubmittedPropertyId(data.verificationReference || data.property?.id);
    } catch (err) {
      setErrorMessage('Network connection error while submitting property.');
    } finally {
      setLoading(false);
    }
  };

  // If user is not authenticated, show authentication gate
  if (!user) {
    return (
      <div className="gs-page-shell" style={{ padding: '3.5rem 0 5rem' }}>
        <div className="gs-container" style={{ maxWidth: '560px', textAlign: 'center' }}>
          <div className="gs-surface-interactive" style={{ padding: '2.5rem 2rem' }}>
            <div
              style={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                backgroundColor: 'var(--gs-forest-soft)',
                color: 'var(--gs-forest-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <Lock size={30} />
            </div>
            <h1 style={{ fontSize: '1.8rem', color: 'var(--gs-forest-deep)', marginBottom: '0.6rem' }}>
              Owner Profile Required to List Property
            </h1>
            <p style={{ fontSize: '0.96rem', color: 'var(--gs-text-secondary)', lineHeight: 1.6, marginBottom: '2rem' }}>
              Griha Saathi maintains a strict anti-synthetic marketplace policy. Only verified property owners, administrators, real estate agents, and builders may submit listings for our statutory audit pipeline.
            </p>

            <button onClick={onOpenAuth} className="gs-btn gs-btn-primary" style={{ padding: '0.85rem 2rem' }}>
              <span>Open Personal Profile & Settings</span>
              <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gs-page-shell" style={{ padding: '3rem 0 5rem' }}>
      <div className="gs-container" style={{ maxWidth: '880px' }}>
        
        {/* Header & Draft Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem', marginBottom: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
              <span className="gs-badge" style={{ backgroundColor: 'var(--gs-forest-soft)', color: 'var(--gs-forest-primary)' }}>
                Authoritative Listing Pipeline
              </span>
              {activeDraftId && (
                <span className="gs-badge" style={{ backgroundColor: 'var(--gs-status-warning-soft)', color: 'var(--gs-status-warning)' }}>
                  Active Draft Mode
                </span>
              )}
            </div>
            <h1 className="gs-page-header-title" style={{ fontSize: '2rem', marginBottom: '0.25rem' }}>
              {t.title}
            </h1>
            <p className="gs-page-header-subtitle" style={{ fontSize: '0.92rem' }}>
              {t.subtitle}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.6rem' }}>
            {savedDrafts.length > 0 && (
              <button 
                onClick={() => setShowDraftsModal(true)} 
                className="gs-btn gs-btn-outline gs-btn-sm"
              >
                <Layers size={15} />
                <span>Saved Drafts ({savedDrafts.length})</span>
              </button>
            )}
            <button 
              onClick={handleSaveDraft} 
              className="gs-btn gs-btn-outline gs-btn-sm"
              title="Persist current work to backend"
            >
              <Save size={15} />
              <span>{t.saveDraftButton}</span>
            </button>
          </div>
        </div>

        {/* Draft Notification Feedback */}
        {draftSaveSuccess && (
          <div
            style={{
              padding: '0.75rem 1.25rem',
              backgroundColor: 'var(--gs-forest-soft)',
              border: '1px solid var(--gs-forest-light)',
              borderRadius: 'var(--gs-radius-md)',
              fontSize: '0.88rem',
              color: 'var(--gs-forest-deep)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <CheckCircle2 size={18} color="var(--gs-status-success)" />
            <span>{draftSaveSuccess}</span>
          </div>
        )}

        {errorMessage && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: 'var(--gs-status-error-soft)',
              border: '1px solid #FECACA',
              borderRadius: 'var(--gs-radius-md)',
              fontSize: '0.88rem',
              color: 'var(--gs-status-error)',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
            }}
          >
            <AlertCircle size={18} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* 7-Step Progress Indicator */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '2rem',
            padding: '1rem',
            backgroundColor: 'var(--gs-bg-card)',
            borderRadius: 'var(--gs-radius-lg)',
            border: '1px solid var(--gs-border)',
            overflowX: 'auto',
            gap: '0.5rem',
          }}
        >
          {[
            { num: 1, label: '1. Authority' },
            { num: 2, label: '2. Location' },
            { num: 3, label: '3. Details' },
            { num: 4, label: '4. Rental' },
            { num: 5, label: '5. Photos' },
            { num: 6, label: '6. Documents' },
            { num: 7, label: '7. Review' },
          ].map((st) => {
            const isCurrent = currentStep === st.num;
            const isCompleted = currentStep > st.num;
            return (
              <button
                key={st.num}
                onClick={() => setCurrentStep(st.num)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  border: 'none',
                  backgroundColor: 'transparent',
                  color: isCurrent ? 'var(--gs-forest-primary)' : isCompleted ? 'var(--gs-forest-mid)' : 'var(--gs-text-muted)',
                  fontWeight: isCurrent ? 700 : 500,
                  fontSize: '0.82rem',
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  padding: '0.2rem 0.4rem',
                  borderRadius: 'var(--gs-radius-sm)',
                }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: '50%',
                    backgroundColor: isCurrent ? 'var(--gs-forest-primary)' : isCompleted ? 'var(--gs-forest-soft)' : 'var(--gs-bg-subtle)',
                    color: isCurrent ? '#FFFFFF' : isCompleted ? 'var(--gs-forest-primary)' : 'var(--gs-text-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                  }}
                >
                  {isCompleted ? <Check size={14} /> : st.num}
                </div>
                <span>{st.label}</span>
              </button>
            );
          })}
        </div>

        {submittedPropertyId ? (
          /* Submission Confirmation View */
          <div className="gs-surface-interactive" style={{ textAlign: 'center', padding: '2.75rem 2rem' }}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: 'var(--gs-forest-soft)',
                color: 'var(--gs-forest-primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <CheckCircle2 size={36} />
            </div>
            <h2 style={{ fontSize: '1.6rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
              Property Submitted for Authoritative Verification
            </h2>
            <p style={{ fontSize: '1rem', color: 'var(--gs-text-secondary)', maxWidth: '580px', margin: '0 auto 1.5rem', lineHeight: 1.6 }}>
              Your listing has been assigned Verification Tracking ID:
            </p>
            <div
              style={{
                display: 'inline-block',
                padding: '0.6rem 1.25rem',
                backgroundColor: 'var(--gs-forest-soft)',
                border: '1px solid var(--gs-forest-muted)',
                borderRadius: 'var(--gs-radius-md)',
                fontFamily: 'var(--gs-font-mono)',
                fontSize: '1.2rem',
                fontWeight: 700,
                color: 'var(--gs-forest-primary)',
                marginBottom: '1.75rem',
              }}
            >
              {submittedPropertyId}
            </div>

            <div className="gs-integrity-callout" style={{ margin: '0 auto 2rem' }}>
              <Info size={20} style={{ flexShrink: 0, marginTop: 2 }} />
              <div>
                <strong>Strict Publication Safeguard:</strong> This property is currently in <code>submitted</code> status. It will undergo registry cross-check and field inspector audit before appearing on the public search marketplace.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => onNavigate('dashboard')} className="gs-btn gs-btn-primary">
                <span>View in Owner Dashboard</span>
              </button>
              <button onClick={() => onNavigate('verifications')} className="gs-btn gs-btn-outline">
                <span>Track Verification Audit</span>
              </button>
              <button
                onClick={() => {
                  setSubmittedPropertyId(null);
                  setActiveDraftId(null);
                  setCurrentStep(1);
                  setTitle('');
                  setCity('');
                  setLocality('');
                  setPincode('');
                  setMediaItems([]);
                  setDocuments([]);
                }}
                className="gs-btn gs-btn-outline"
              >
                <span>List Another Property</span>
              </button>
            </div>
          </div>
        ) : (
          /* Wizard Form */
          <div className="gs-card" style={{ padding: '2.5rem' }}>
            
            {/* STEP 1: PURPOSE & AUTHORITY */}
            {currentStep === 1 && (
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                  {t.step1}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', marginBottom: '1.75rem' }}>
                  Declare your authority to advertise this property. Griha Saathi logs your submitter credentials to ensure accountability.
                </p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="gs-form-label">Listing Purpose</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    {[
                      { id: 'rent', label: 'Residential Rent' },
                      { id: 'lease', label: 'Long-term Lease' },
                    ].map((p) => (
                      <button
                        type="button"
                        key={p.id}
                        onClick={() => setPurpose(p.id as any)}
                        className={`gs-btn ${purpose === p.id ? 'gs-btn-primary' : 'gs-btn-outline'}`}
                        style={{ flex: 1 }}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="gs-form-label">{t.authorityRoleLabel}</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '0.75rem' }}>
                    {[
                      { id: 'owner', label: t.authorityOwner, desc: 'You hold legal title, registry, or jamabandi ownership.' },
                      { id: 'agent', label: t.authorityAgent, desc: 'Licensed representative holding owner mandate.' },
                      { id: 'builder', label: t.authorityBuilder, desc: 'Registered project developer or builder organization.' },
                      { id: 'property_manager', label: t.authorityManager, desc: 'Appointed professional property management firm.' },
                      { id: 'tenant', label: t.authoritySublessor, desc: 'Permitted sublessor with explicit contractual permission.' },
                    ].map((auth) => (
                      <label
                        key={auth.id}
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: '0.75rem',
                          padding: '0.85rem 1rem',
                          borderRadius: 'var(--gs-radius-md)',
                          border: `1px solid ${declaredAuthority === auth.id ? 'var(--gs-forest-primary)' : 'var(--gs-border)'}`,
                          backgroundColor: declaredAuthority === auth.id ? 'var(--gs-forest-soft)' : 'var(--gs-bg-card)',
                          cursor: 'pointer',
                        }}
                      >
                        <input
                          type="radio"
                          name="declaredAuthority"
                          checked={declaredAuthority === auth.id}
                          onChange={() => setDeclaredAuthority(auth.id as DeclaredAuthority)}
                          style={{ marginTop: '0.2rem' }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.92rem', color: 'var(--gs-text-primary)' }}>
                            {auth.label}
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--gs-text-muted)' }}>
                            {auth.desc}
                          </div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {declaredAuthority === 'tenant' && (
                  <div
                    style={{
                      padding: '1rem',
                      backgroundColor: 'var(--gs-status-warning-soft)',
                      border: '1px solid #FDE68A',
                      borderRadius: 'var(--gs-radius-md)',
                      marginBottom: '1.5rem',
                    }}
                  >
                    <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={sublessorDeclaration}
                        onChange={(e) => setSublessorDeclaration(e.target.checked)}
                        style={{ marginTop: '0.2rem' }}
                      />
                      <span style={{ fontSize: '0.86rem', color: '#92400E', fontWeight: 600 }}>
                        {t.sublessorDeclarationLabel}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: LOCATION & ADDRESS */}
            {currentStep === 2 && (
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                  {t.step2}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', marginBottom: '1.75rem' }}>
                  Locate your property across our Northern India target territories. Zero fabricated localities or synthetic coordinates.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="gs-form-label">{t.stateLabel} *</label>
                    <select
                      className="gs-form-input"
                      value={state}
                      onChange={(e) => setState(e.target.value as TargetState)}
                    >
                      <option value="Haryana">Haryana (HRERA / Jamabandi)</option>
                      <option value="Punjab">Punjab (Punjab RERA / PLRS)</option>
                      <option value="Delhi">Delhi (Delhi RERA / DDA)</option>
                      <option value="Himachal Pradesh">Himachal Pradesh (HP RERA / Himbhoomi)</option>
                      <option value="Jammu & Kashmir">Jammu & Kashmir (JK RERA / Land Records)</option>
                    </select>
                  </div>

                  <div>
                    <label className="gs-form-label">{t.cityLabel} *</label>
                    <input
                      type="text"
                      className="gs-form-input"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Gurugram, Chandigarh, Shimla, Srinagar"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="gs-form-label">{t.localityLabel} *</label>
                    <input
                      type="text"
                      className="gs-form-input"
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="e.g. Sector 57, DLF Phase 4, Model Town"
                      required
                    />
                  </div>
                  <div>
                    <label className="gs-form-label">{t.pincodeLabel} *</label>
                    <input
                      type="text"
                      className="gs-form-input"
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="6-digit PIN"
                      maxLength={6}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="gs-form-label">{t.addressLabel} *</label>
                  <input
                    type="text"
                    className="gs-form-input"
                    value={addressDetails}
                    onChange={(e) => setAddressDetails(e.target.value)}
                    placeholder="e.g. Flat 302, Tower B, Green Heights, Main Road"
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                  <div>
                    <label className="gs-form-label">Latitude (Optional / Map Support)</label>
                    <input
                      type="number"
                      step="any"
                      className="gs-form-input"
                      value={latitude}
                      onChange={(e) => setLatitude(e.target.value)}
                      placeholder="e.g. 28.4595"
                    />
                  </div>
                  <div>
                    <label className="gs-form-label">Longitude (Optional / Map Support)</label>
                    <input
                      type="number"
                      step="any"
                      className="gs-form-input"
                      value={longitude}
                      onChange={(e) => setLongitude(e.target.value)}
                      placeholder="e.g. 77.0266"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: PROPERTY DETAILS */}
            {currentStep === 3 && (
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                  {t.step3}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', marginBottom: '1.75rem' }}>
                  Provide authentic architectural and space dimensions of your rental home.
                </p>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="gs-form-label">Property Title</label>
                  <input
                    type="text"
                    className="gs-form-input"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Sunlit 2BHK Apartment near Metro Station"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.25rem' }}>
                  <div>
                    <label className="gs-form-label">{t.typeLabel}</label>
                    <select
                      className="gs-form-input"
                      value={propertyType}
                      onChange={(e) => setPropertyType(e.target.value as PropertyType)}
                    >
                      <option value="1bhk">1 BHK Apartment</option>
                      <option value="2bhk">2 BHK Apartment</option>
                      <option value="3bhk">3 BHK Apartment</option>
                      <option value="4bhk_plus">4+ BHK Luxury Apartment</option>
                      <option value="independent_house">Independent Builder Floor / Kothi</option>
                      <option value="villa">Independent Villa</option>
                      <option value="studio">Studio Apartment</option>
                      <option value="pg_coliving">PG / Co-Living Space</option>
                    </select>
                  </div>

                  <div>
                    <label className="gs-form-label">{t.bedroomsLabel}</label>
                    <input
                      type="number"
                      min={0}
                      className="gs-form-input"
                      value={bedrooms}
                      onChange={(e) => setBedrooms(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="gs-form-label">{t.bathroomsLabel}</label>
                    <input
                      type="number"
                      min={1}
                      className="gs-form-input"
                      value={bathrooms}
                      onChange={(e) => setBathrooms(Number(e.target.value))}
                    />
                  </div>

                  <div>
                    <label className="gs-form-label">{t.areaLabel} *</label>
                    <input
                      type="number"
                      min={1}
                      className="gs-form-input"
                      value={areaSqFt}
                      onChange={(e) => setAreaSqFt(e.target.value)}
                      placeholder="e.g. 1150"
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label className="gs-form-label">{t.furnishingLabel}</label>
                    <select
                      className="gs-form-input"
                      value={furnishing}
                      onChange={(e) => setFurnishing(e.target.value as FurnishingStatus)}
                    >
                      <option value="unfurnished">Unfurnished</option>
                      <option value="semi_furnished">Semi-Furnished</option>
                      <option value="fully_furnished">Fully Furnished</option>
                    </select>
                  </div>

                  <div>
                    <label className="gs-form-label">{t.floorInfoLabel}</label>
                    <input
                      type="number"
                      min={0}
                      className="gs-form-input"
                      value={floorNumber}
                      onChange={(e) => setFloorNumber(e.target.value)}
                      placeholder="Floor (0 for Ground)"
                    />
                  </div>

                  <div>
                    <label className="gs-form-label">{t.totalFloorsLabel}</label>
                    <input
                      type="number"
                      min={1}
                      className="gs-form-input"
                      value={totalFloors}
                      onChange={(e) => setTotalFloors(e.target.value)}
                      placeholder="Total Floors"
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="gs-form-label">{t.amenitiesLabel}</label>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {[
                      'Gated Security',
                      '24x7 Power Backup',
                      'Municipal Water Supply',
                      'Reserved Parking',
                      'Passenger Lift',
                      'Piped Gas (IGL/PNG)',
                      'CCTV Surveillance',
                      'Park & Jogging Track',
                      'Air Conditioning',
                      'Modular Kitchen',
                      'Clubhouse & Gym',
                    ].map((am) => {
                      const isSelected = amenities.includes(am);
                      return (
                        <button
                          type="button"
                          key={am}
                          onClick={() => toggleAmenity(am)}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: 'var(--gs-radius-full)',
                            fontSize: '0.82rem',
                            fontWeight: 600,
                            border: `1px solid ${isSelected ? 'var(--gs-forest-primary)' : 'var(--gs-border)'}`,
                            backgroundColor: isSelected ? 'var(--gs-forest-soft)' : 'var(--gs-bg-card)',
                            color: isSelected ? 'var(--gs-forest-primary)' : 'var(--gs-text-secondary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                          }}
                        >
                          {isSelected && <Check size={13} />}
                          <span>{am}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="gs-form-label">{t.descriptionLabel}</label>
                  <textarea
                    rows={4}
                    className="gs-form-input"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe specific features, orientation, natural lighting, and proximity to transit hubs..."
                  />
                </div>
              </div>
            )}

            {/* STEP 4: RENTAL TERMS & AVAILABILITY */}
            {currentStep === 4 && (
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                  {t.step4}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', marginBottom: '1.75rem' }}>
                  Transparent rental financials. Never insert assumed prices or fictitious availability.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label className="gs-form-label">{t.rentLabel} *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--gs-text-muted)' }}>₹</span>
                      <input
                        type="number"
                        min={1}
                        className="gs-form-input"
                        style={{ paddingLeft: '2rem' }}
                        value={rentPerMonth}
                        onChange={(e) => setRentPerMonth(e.target.value)}
                        placeholder="e.g. 28000"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="gs-form-label">{t.depositLabel} *</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--gs-text-muted)' }}>₹</span>
                      <input
                        type="number"
                        min={0}
                        className="gs-form-input"
                        style={{ paddingLeft: '2rem' }}
                        value={securityDeposit}
                        onChange={(e) => setSecurityDeposit(e.target.value)}
                        placeholder="e.g. 56000"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="gs-form-label">{t.maintenanceLabel}</label>
                    <div style={{ position: 'relative' }}>
                      <span style={{ position: 'absolute', left: 12, top: 11, color: 'var(--gs-text-muted)' }}>₹</span>
                      <input
                        type="number"
                        min={0}
                        className="gs-form-input"
                        style={{ paddingLeft: '2rem' }}
                        value={maintenanceCharges}
                        onChange={(e) => setMaintenanceCharges(e.target.value)}
                        placeholder="0 if included"
                      />
                    </div>
                  </div>

                  {Number(rentPerMonth) > 0 && Number(securityDeposit) > 2 * Number(rentPerMonth) && (
                    <div style={{ gridColumn: '1 / -1', padding: '0.75rem 1rem', backgroundColor: 'var(--gs-status-warning-soft)', border: '1px solid #FDE68A', borderRadius: 'var(--gs-radius-md)', fontSize: '0.86rem', color: 'var(--gs-status-warning)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <AlertCircle size={16} style={{ flexShrink: 0 }} />
                      <span>
                        <strong>Model Tenancy Act Advisory:</strong> The statutory deposit cap for residential premises is 2 months rent (₹{(2 * Number(rentPerMonth)).toLocaleString('en-IN')}). Deposits exceeding this may face review scrutiny during approval.
                      </span>
                    </div>
                  )}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem', marginBottom: '1.5rem' }}>
                  <div>
                    <label className="gs-form-label">{t.preferenceLabel}</label>
                    <select
                      className="gs-form-input"
                      value={tenantPreference}
                      onChange={(e) => setTenantPreference(e.target.value as TenantPreference)}
                    >
                      <option value="any">Open to All Respectful Tenants</option>
                      <option value="family">Families Only</option>
                      <option value="working_professionals">Working Professionals</option>
                      <option value="students">Students</option>
                      <option value="bachelors">Bachelors</option>
                    </select>
                  </div>

                  <div>
                    <label className="gs-form-label">{t.availableFromLabel} *</label>
                    <input
                      type="date"
                      className="gs-form-input"
                      value={availableFrom}
                      onChange={(e) => setAvailableFrom(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label className="gs-form-label">{t.leaseTermsLabel}</label>
                  <input
                    type="text"
                    className="gs-form-input"
                    value={leaseTerms}
                    onChange={(e) => setLeaseTerms(e.target.value)}
                    placeholder="e.g. 11-month registered agreement, 1-month lock-in, 30 days notice"
                  />
                </div>

                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--gs-bg-subtle)',
                    borderRadius: 'var(--gs-radius-md)',
                    border: '1px solid var(--gs-border)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={availabilityConfirmed}
                      onChange={(e) => setAvailabilityConfirmed(e.target.checked)}
                    />
                    <span style={{ fontSize: '0.88rem', color: 'var(--gs-forest-deep)', fontWeight: 600 }}>
                      I confirm that this property is vacant or will be available on the stated date.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 5: GENUINE PROPERTY MEDIA */}
            {currentStep === 5 && (
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                  {t.step5}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', marginBottom: '1.75rem' }}>
                  {t.photoUploadNote}
                </p>

                {/* Upload Action Box */}
                <div
                  style={{
                    border: '2px dashed var(--gs-border)',
                    borderRadius: 'var(--gs-radius-lg)',
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    backgroundColor: 'var(--gs-bg-subtle)',
                    marginBottom: '1.75rem',
                  }}
                >
                  <Upload size={36} color="var(--gs-forest-primary)" style={{ margin: '0 auto 0.75rem' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                    {t.photoUploadTitle}
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--gs-text-muted)', maxWidth: '440px', margin: '0 auto 1.25rem' }}>
                    Supported formats: JPEG, PNG, WebP up to 5MB per file. High-resolution actual photos only.
                  </p>

                  <label className="gs-btn gs-btn-primary gs-btn-sm" style={{ cursor: 'pointer', display: 'inline-flex' }}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      multiple
                      onChange={handlePhotoUpload}
                      style={{ display: 'none' }}
                      disabled={mediaUploading}
                    />
                    <span>{mediaUploading ? 'Uploading & Hashing...' : t.uploadPhotoButton}</span>
                  </label>
                </div>

                {mediaError && (
                  <div style={{ color: 'var(--gs-status-error)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {mediaError}
                  </div>
                )}

                {/* Uploaded Photos Grid */}
                {mediaItems.length > 0 && (
                  <div>
                    <h3 style={{ fontSize: '1rem', color: 'var(--gs-forest-deep)', marginBottom: '0.75rem' }}>
                      Uploaded Photographs ({mediaItems.length})
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '1rem' }}>
                      {mediaItems.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            position: 'relative',
                            borderRadius: 'var(--gs-radius-md)',
                            overflow: 'hidden',
                            border: '1px solid var(--gs-border)',
                            backgroundColor: 'var(--gs-bg-card)',
                          }}
                        >
                          <img
                            src={item.url}
                            alt="Property"
                            style={{ width: '100%', height: '120px', objectFit: 'cover' }}
                          />
                          <div style={{ padding: '0.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.74rem', color: 'var(--gs-text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '110px' }}>
                              {item.originalFilename || item.filename}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleRemovePhoto(item.id)}
                              style={{
                                border: 'none',
                                backgroundColor: 'transparent',
                                color: 'var(--gs-status-error)',
                                cursor: 'pointer',
                                padding: '0.2rem',
                              }}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* STEP 6: DOCUMENTS & AUTHORITY EVIDENCE */}
            {currentStep === 6 && (
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                  {t.step6}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', marginBottom: '1.75rem' }}>
                  {t.documentUploadNote}
                </p>

                {/* Privacy Callout */}
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    backgroundColor: 'var(--gs-forest-soft)',
                    border: '1px solid var(--gs-forest-muted)',
                    borderRadius: 'var(--gs-radius-md)',
                    marginBottom: '1.75rem',
                    display: 'flex',
                    gap: '0.75rem',
                  }}
                >
                  <Lock size={20} color="var(--gs-forest-primary)" style={{ flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: '0.84rem', color: 'var(--gs-forest-deep)', lineHeight: 1.5 }}>
                    <strong>DPDP Act Confidentiality Guarantee:</strong> Ownership and authority documents uploaded here are encrypted, stored in private administrative buckets, and strictly restricted to certified regional verification officers. They are NEVER displayed on public property pages.
                  </div>
                </div>

                {/* Upload Form */}
                <div
                  style={{
                    backgroundColor: 'var(--gs-bg-subtle)',
                    padding: '1.5rem',
                    borderRadius: 'var(--gs-radius-lg)',
                    border: '1px solid var(--gs-border)',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '1rem', alignItems: 'flex-end', marginBottom: '1rem' }}>
                    <div>
                      <label className="gs-form-label">Document Type *</label>
                      <select
                        className="gs-form-input"
                        value={selectedDocType}
                        onChange={(e) => setSelectedDocType(e.target.value)}
                      >
                        <option value="title_deed">{t.docTypeTitleDeed}</option>
                        <option value="sale_deed">{t.docTypeSaleDeed}</option>
                        <option value="jamabandi">{t.docTypeJamabandi}</option>
                        <option value="property_tax_receipt">{t.docTypeTaxReceipt}</option>
                        <option value="power_of_attorney">{t.docTypePOA}</option>
                        <option value="lease_agreement">{t.docTypeLease}</option>
                        <option value="other">{t.docTypeOther}</option>
                      </select>
                    </div>

                    <label className="gs-btn gs-btn-primary" style={{ cursor: 'pointer', height: '42px', display: 'flex', alignItems: 'center' }}>
                      <input
                        type="file"
                        accept="application/pdf,image/jpeg,image/png"
                        onChange={handleDocUpload}
                        style={{ display: 'none' }}
                        disabled={docUploading}
                      />
                      <FileCheck size={16} />
                      <span>{docUploading ? 'Hashing...' : t.uploadDocumentButton}</span>
                    </label>
                  </div>

                  <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                    Supported formats: PDF, JPEG, PNG (max 10MB per document). Files are SHA-256 hashed on ingest.
                  </div>
                </div>

                {docError && (
                  <div style={{ color: 'var(--gs-status-error)', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {docError}
                  </div>
                )}

                {/* Uploaded Documents List */}
                {documents.length > 0 && (
                  <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', color: 'var(--gs-forest-deep)', marginBottom: '0.75rem' }}>
                      Uploaded Verification Documents ({documents.length})
                    </h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                      {documents.map((doc) => (
                        <div
                          key={doc.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            padding: '0.75rem 1rem',
                            backgroundColor: 'var(--gs-bg-card)',
                            border: '1px solid var(--gs-border)',
                            borderRadius: 'var(--gs-radius-md)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <FileText size={20} color="var(--gs-forest-primary)" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--gs-text-primary)' }}>
                                {doc.originalFilename || doc.filename}
                              </div>
                              <div style={{ fontSize: '0.76rem', color: 'var(--gs-text-muted)', fontFamily: 'var(--gs-font-mono)' }}>
                                Type: {doc.documentType.toUpperCase()} | SHA-256: {(doc.sha256Hash || doc.documentHash || '').substring(0, 16)}...
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveDoc(doc.id)}
                            style={{
                              border: 'none',
                              backgroundColor: 'transparent',
                              color: 'var(--gs-status-error)',
                              cursor: 'pointer',
                              padding: '0.3rem',
                            }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div
                  style={{
                    padding: '1rem',
                    backgroundColor: 'var(--gs-bg-subtle)',
                    borderRadius: 'var(--gs-radius-md)',
                    border: '1px solid var(--gs-border)',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={docAuthConfirmed}
                      onChange={(e) => setDocAuthConfirmed(e.target.checked)}
                    />
                    <span style={{ fontSize: '0.86rem', color: 'var(--gs-forest-deep)', fontWeight: 600 }}>
                      I solemnly confirm that I am legally authorized to submit these ownership/authorization documents.
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* STEP 7: REVIEW & SUBMIT */}
            {currentStep === 7 && (
              <div>
                <h2 style={{ fontSize: '1.35rem', color: 'var(--gs-forest-deep)', marginBottom: '0.35rem' }}>
                  {t.step7}
                </h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--gs-text-secondary)', marginBottom: '1.75rem' }}>
                  {t.reviewSummaryTitle}
                </p>

                {/* Summary Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.75rem' }}>
                  
                  {/* Card 1: Authority & Location */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--gs-bg-subtle)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                      Location & Authority
                    </div>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--gs-text-secondary)' }}>
                      <div><strong>State:</strong> {state}</div>
                      <div><strong>City / Locality:</strong> {city || '—'}, {locality || '—'}</div>
                      <div><strong>PIN Code:</strong> {pincode || '—'}</div>
                      <div><strong>Address:</strong> {addressDetails || '—'}</div>
                      <div><strong>Declared Role:</strong> {declaredAuthority.toUpperCase()}</div>
                    </div>
                  </div>

                  {/* Card 2: Property Specs & Rent */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--gs-bg-subtle)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                      Specs & Financials
                    </div>
                    <div style={{ fontSize: '0.82rem', lineHeight: 1.6, color: 'var(--gs-text-secondary)' }}>
                      <div><strong>Type:</strong> {propertyType.toUpperCase()} ({bedrooms} BHK, {bathrooms} Baths)</div>
                      <div><strong>Carpet Area:</strong> {areaSqFt} sq ft</div>
                      <div><strong>Monthly Rent:</strong> ₹{Number(rentPerMonth || 0).toLocaleString('en-IN')}</div>
                      <div><strong>Security Deposit:</strong> ₹{Number(securityDeposit || 0).toLocaleString('en-IN')}</div>
                      <div><strong>Available From:</strong> {availableFrom}</div>
                    </div>
                  </div>

                  {/* Card 3: Media & Documents */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--gs-bg-subtle)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                      Genuine Media
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-secondary)' }}>
                      {mediaItems.length > 0 ? (
                        <span style={{ color: 'var(--gs-status-success)', fontWeight: 600 }}>
                          ✓ {mediaItems.length} actual photo(s) uploaded
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gs-text-muted)' }}>
                          No photographs attached (Can be submitted during field audit)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Card 4: Documents Evidence */}
                  <div style={{ padding: '1rem', backgroundColor: 'var(--gs-bg-subtle)', borderRadius: 'var(--gs-radius-md)', border: '1px solid var(--gs-border)' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--gs-forest-deep)', marginBottom: '0.5rem' }}>
                      Ownership Proof Evidence
                    </div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--gs-text-secondary)' }}>
                      {documents.length > 0 ? (
                        <span style={{ color: 'var(--gs-status-success)', fontWeight: 600 }}>
                          ✓ {documents.length} secure document(s) attached
                        </span>
                      ) : (
                        <span style={{ color: 'var(--gs-status-error)', fontWeight: 600 }}>
                          ⚠ Ownership proof is required for verification
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Missing Fields Warning */}
                {(!step1Valid || !step2Valid || !step3Valid || !step4Valid || !step6Valid) && (
                  <div
                    style={{
                      padding: '0.85rem 1.25rem',
                      backgroundColor: 'var(--gs-status-warning-soft)',
                      border: '1px solid #FDE68A',
                      borderRadius: 'var(--gs-radius-md)',
                      marginBottom: '1.5rem',
                      fontSize: '0.86rem',
                      color: '#92400E',
                    }}
                  >
                    <strong>Mandatory Checklist Incomplete:</strong>
                    <ul style={{ paddingLeft: '1.25rem', marginTop: '0.35rem' }}>
                      {!step1Valid && <li>Declare authority or contractual sublease permission (Step 1)</li>}
                      {!step2Valid && <li>Provide complete address, locality, city, and 6-digit PIN (Step 2)</li>}
                      {!step3Valid && <li>Specify property dimensions and carpet area (Step 3)</li>}
                      {!step4Valid && <li>Provide valid monthly rent and security deposit (Step 4)</li>}
                      {!step6Valid && <li>Upload at least one ownership document and confirm authority (Step 6)</li>}
                    </ul>
                  </div>
                )}

                {/* Statutory Solemn Declaration Checkbox */}
                <div
                  style={{
                    padding: '1.25rem',
                    backgroundColor: 'var(--gs-forest-soft)',
                    borderRadius: 'var(--gs-radius-md)',
                    border: '1px solid var(--gs-forest-muted)',
                    marginBottom: '1.75rem',
                  }}
                >
                  <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={accuracyDeclared}
                      onChange={(e) => setAccuracyDeclared(e.target.checked)}
                      style={{ marginTop: '0.25rem' }}
                    />
                    <span style={{ fontSize: '0.88rem', color: 'var(--gs-forest-deep)', fontWeight: 600, lineHeight: 1.5 }}>
                      {t.accuracyDeclaration}
                    </span>
                  </label>
                </div>
              </div>
            )}

            {/* Wizard Navigation Footer */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--gs-border)',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev - 1)}
                    className="gs-btn gs-btn-outline"
                  >
                    <ArrowLeft size={16} />
                    <span>{t.wizardPrev}</span>
                  </button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={handleSaveDraft}
                  className="gs-btn gs-btn-outline"
                  title="Save progress to resume later"
                >
                  <Save size={16} />
                  <span>{t.saveDraftButton}</span>
                </button>

                {currentStep < totalSteps ? (
                  <button
                    type="button"
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    className="gs-btn gs-btn-primary"
                  >
                    <span>{t.wizardNext}</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmitFinal}
                    disabled={loading || !step7Valid}
                    className="gs-btn gs-btn-primary"
                    style={{ opacity: loading || !step7Valid ? 0.6 : 1 }}
                  >
                    <ShieldCheck size={18} />
                    <span>{loading ? 'Submitting...' : t.wizardSubmit}</span>
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Saved Drafts Modal */}
      {showDraftsModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(16, 38, 26, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '1rem',
          }}
        >
          <div
            className="gs-card"
            style={{
              width: '100%',
              maxWidth: '560px',
              padding: '2rem',
              maxHeight: '80vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--gs-forest-deep)' }}>
                {t.savedDraftsTitle}
              </h2>
              <button
                onClick={() => setShowDraftsModal(false)}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            {savedDrafts.length === 0 ? (
              <p style={{ color: 'var(--gs-text-muted)', fontSize: '0.9rem' }}>No saved drafts found.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {savedDrafts.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      padding: '1rem',
                      border: '1px solid var(--gs-border)',
                      borderRadius: 'var(--gs-radius-md)',
                      backgroundColor: 'var(--gs-bg-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--gs-text-primary)' }}>
                        {d.data?.title || `${d.data?.propertyType?.toUpperCase() || 'Property'} in ${d.data?.locality || d.data?.city || 'Draft'}`}
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--gs-text-muted)' }}>
                        Step {d.currentStep} of 7 • Last saved: {new Date(d.updatedAt).toLocaleString()}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => loadDraftIntoState(d)}
                        className="gs-btn gs-btn-primary gs-btn-sm"
                      >
                        Resume
                      </button>
                      <button
                        onClick={() => handleDeleteDraft(d.id)}
                        className="gs-btn gs-btn-outline gs-btn-sm"
                        style={{ color: 'var(--gs-status-error)' }}
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
