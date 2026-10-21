import { SupportedLanguage } from './types.js';

export interface TranslationDictionary {
  brand: {
    tagline: string;
    subtagline: string;
    badge: string;
  };
  nav: {
    home: string;
    findProperty: string;
    verifications: string;
    connections: string;
    saathiAi: string;
    help: string;
    dashboard: string;
    listingProperty: string;
    account: string;
    login: string;
    logout: string;
    language: string;
  };
  home: {
    heroTitle: string;
    heroSubtitle: string;
    searchTabRent: string;
    searchTabDiscovery: string;
    stateSelectLabel: string;
    propertyTypeLabel: string;
    budgetLabel: string;
    searchButton: string;
    whyTrustTitle: string;
    whyTrustSubtitle: string;
    pillar1Title: string;
    pillar1Desc: string;
    pillar2Title: string;
    pillar2Desc: string;
    pillar3Title: string;
    pillar3Desc: string;
    pillar4Title: string;
    pillar4Desc: string;
    ctaFind: string;
    ctaList: string;
    targetRegionsTitle: string;
    honestStateNotice: string;
  };
  find: {
    title: string;
    subtitle: string;
    filterState: string;
    filterCity: string;
    filterType: string;
    filterBudget: string;
    filterFurnishing: string;
    filterPreference: string;
    filterOnlyVerified: string;
    filterLocality: string;
    filterRentMin: string;
    filterRentMax: string;
    filterBedrooms: string;
    filterBathrooms: string;
    filterAmenities: string;
    filterFreshness: string;
    filterConfirmedOnly: string;
    filterDataSource: string;
    filterSourceOwner: string;
    filterSourceRegistry: string;
    filterSourceAgent: string;
    sortByLabel: string;
    sortVerifiedFirst: string;
    sortRentAsc: string;
    sortRentDesc: string;
    sortNewest: string;
    totalMatching: string;
    paginationPrev: string;
    paginationNext: string;
    paginationPageOf: string;
    freshnessConfirmedBadge: string;
    freshnessStaleBadge: string;
    freshnessConfirmedDesc: string;
    freshnessStaleDesc: string;
    saveProperty: string;
    savedProperty: string;
    loginToSave: string;
    viewDetails: string;
    modalClose: string;
    detailOverview: string;
    detailFinancials: string;
    detailAmenities: string;
    detailVerificationAudit: string;
    detailFreshnessInfo: string;
    reconfirmAvailabilityButton: string;
    reconfirmSuccess: string;
    cadastralMapTitle: string;
    cadastralMapDesc: string;
    mapHasCoordinates: string;
    mapNoCoordinates: string;
    viewList: string;
    viewMap: string;
    emptyTitle: string;
    emptyDescription: string;
    providerIntegrationNote: string;
    clearFilters: string;
    verifiedBadge: string;
    unverifiedBadge: string;
  };
  verifications: {
    title: string;
    subtitle: string;
    howItWorksTitle: string;
    stage1Title: string;
    stage1Desc: string;
    stage2Title: string;
    stage2Desc: string;
    stage3Title: string;
    stage3Desc: string;
    stage4Title: string;
    stage4Desc: string;
    trackTitle: string;
    trackPlaceholder: string;
    trackButton: string;
    integrityWarning: string;
    statusEmptyTitle: string;
    statusEmptyDesc: string;
    reportListing: string;
    reportModalTitle: string;
    reportReasonLabel: string;
    reportDescLabel: string;
    reportSubmitButton: string;
    reportSuccess: string;
    trustReportTitle: string;
    trustReportChecked: string;
    trustReportUnchecked: string;
    trustReportDisclaimer: string;
    reviewerWorkspaceTitle: string;
    reviewerQueuePending: string;
    reviewerQueueReports: string;
    appealListingTitle: string;
    appealReasonLabel: string;
    appealSubmitButton: string;
    actionSuspend: string;
    actionApprove: string;
    actionReject: string;
    actionRequestInfo: string;
  };
  connections: {
    title: string;
    subtitle: string;
    authRequiredNotice: string;
    loginToAccess: string;
    noActiveConnectionsTitle: string;
    noActiveConnectionsDesc: string;
    securityWarningTitle: string;
    securityWarningText: string;
    requestConnection: string;
    tabConversations: string;
    tabRequests: string;
    tabVisits: string;
    tabBlocked: string;
    pendingIncoming: string;
    pendingSent: string;
    acceptedConnections: string;
    accept: string;
    decline: string;
    cancel: string;
    block: string;
    unblock: string;
    report: string;
    scheduleVisit: string;
    visitDate: string;
    timeSlot: string;
    visitNotes: string;
    confirmVisit: string;
    declineVisit: string;
    rescheduleVisit: string;
    cancelVisit: string;
    completeVisit: string;
    upcomingVisits: string;
    pastVisits: string;
    noVisitsTitle: string;
    noVisitsDesc: string;
    typeMessagePlaceholder: string;
    sendMessage: string;
  };
  saathiAi: {
    title: string;
    subtitle: string;
    inputPlaceholder: string;
    sendButton: string;
    disclaimer: string;
    welcomeMessage: string;
    quickPromptsTitle: string;
    quickPrompt1: string;
    quickPrompt2: string;
    quickPrompt3: string;
    quickPrompt4: string;
    quickPrompt5: string;
    statusActiveRuleBased: string;
    statusGeminiConnected: string;
    statusGeminiUnset: string;
    clearChat: string;
    viewDetails: string;
    requestConnection: string;
    scheduleVisit: string;
    applyFilters: string;
    compareTitle: string;
    notProvided: string;
    matchRationaleTitle: string;
    objectiveFactsTitle: string;
    zeroMatchesTitle: string;
    zeroMatchesRelax: string;
    confirmActionTitle: string;
    confirmActionPrompt: string;
    confirmProceed: string;
    confirmCancel: string;
    floatingWidgetTooltip: string;
    floatingWidgetHeading: string;
  };
  help: {
    title: string;
    subtitle: string;
    faqSectionTitle: string;
    supportDeskTitle: string;
    supportDeskNotice: string;
    faq1Q: string;
    faq1A: string;
    faq2Q: string;
    faq2A: string;
    faq3Q: string;
    faq3A: string;
    faq4Q: string;
    faq4A: string;
  };
  dashboard: {
    title: string;
    subtitle: string;
    roleTenant: string;
    roleOwner: string;
    roleAgent: string;
    roleBuilder: string;
    rolePropertyManager: string;
    activeRole: string;
    noDataTitle: string;
    noDataDesc: string;
    liveIntegrationsTitle: string;
    unconfiguredNotice: string;
    profileSettings: string;
    activeRolesTitle: string;
    switchRoleButton: string;
    addRoleButton: string;
    securityCenterTitle: string;
    changePinTitle: string;
    changePinButton: string;
    currentPinLabel: string;
    newPinLabel: string;
    auditLogsTitle: string;
    activeSessionsTitle: string;
    revokeAllSessions: string;
    notificationSettingsTitle: string;
    saveChangesButton: string;
    contactVerificationTitle: string;
    updateContactButton: string;
    savedPropertiesTitle: string;
    savedPropertiesSubtitle: string;
    noSavedPropertiesTitle: string;
    noSavedPropertiesDesc: string;
    unsaveButton: string;
    savedOn: string;
    viewInSearch: string;
    // Phase 5 Owner Dashboard keys
    ownerWorkspaceTitle: string;
    ownerWorkspaceSubtitle: string;
    metricTotal: string;
    metricDrafts: string;
    metricSubmitted: string;
    metricUnderReview: string;
    metricCorrectionRequested: string;
    metricApproved: string;
    metricWithdrawn: string;
    metricRejectedExpired: string;
    statusBadgeDraft: string;
    statusBadgeSubmitted: string;
    statusBadgeUnderReview: string;
    statusBadgeCorrection: string;
    statusBadgeApproved: string;
    statusBadgeWithdrawn: string;
    statusBadgeRejected: string;
    statusBadgeExpired: string;
    actionResumeDraft: string;
    actionEditListing: string;
    actionWithdraw: string;
    actionRespondCorrection: string;
    actionReconfirm: string;
    withdrawConfirm: string;
    withdrawSuccess: string;
    emptyOwnerTitle: string;
    emptyOwnerDesc: string;
    startListingButton: string;
    correctionModalTitle: string;
    correctionModalDesc: string;
    correctionResponseLabel: string;
    correctionResponseSubmit: string;
    // Phase 9 Dashboard & Account Keys
    savedSearchesTitle: string;
    savedSearchesSubtitle: string;
    noSavedSearchesTitle: string;
    noSavedSearchesDesc: string;
    createSearchAlertButton: string;
    checkNewMatchesButton: string;
    alertFrequencyLabel: string;
    deleteSearchConfirm: string;
    searchNameLabel: string;
    analyticsTitle: string;
    analyticsSubtitle: string;
    metricGenuineViews: string;
    metricInquiries: string;
    metricConfirmedVisits: string;
    analyticsDisclaimerTitle: string;
    analyticsDisclaimerNote: string;
    uploadProfilePhoto: string;
    changeProfilePhoto: string;
    photoUploadSuccess: string;
    deactivateAccountTitle: string;
    deactivateAccountDesc: string;
    deactivateModalNotice: string;
    confirmPinLabel: string;
    deactivateButton: string;
    deleteAccountButton: string;
    quickCompareButton: string;
    compareSelectedButton: string;
  };
  listing: {
    title: string;
    subtitle: string;
    step1: string;
    step2: string;
    step3: string;
    step4: string;
    step5: string;
    step6: string;
    step7: string;
    stateLabel: string;
    cityLabel: string;
    localityLabel: string;
    addressLabel: string;
    pincodeLabel: string;
    typeLabel: string;
    rentLabel: string;
    depositLabel: string;
    maintenanceLabel: string;
    leaseTermsLabel: string;
    availableFromLabel: string;
    furnishingLabel: string;
    floorInfoLabel: string;
    totalFloorsLabel: string;
    bedroomsLabel: string;
    bathroomsLabel: string;
    areaLabel: string;
    amenitiesLabel: string;
    descriptionLabel: string;
    preferenceLabel: string;
    documentNotice: string;
    submitVerificationButton: string;
    mandatoryAuditNotice: string;
    saveDraftButton: string;
    draftSavedSuccess: string;
    resumingDraft: string;
    savedDraftsTitle: string;
    authorityOwner: string;
    authorityAgent: string;
    authorityBuilder: string;
    authorityManager: string;
    authoritySublessor: string;
    authorityRoleLabel: string;
    sublessorDeclarationLabel: string;
    accuracyDeclaration: string;
    photoUploadTitle: string;
    photoUploadNote: string;
    uploadPhotoButton: string;
    documentUploadTitle: string;
    documentUploadNote: string;
    uploadDocumentButton: string;
    docTypeTitleDeed: string;
    docTypeSaleDeed: string;
    docTypeJamabandi: string;
    docTypeTaxReceipt: string;
    docTypePOA: string;
    docTypeLease: string;
    docTypeOther: string;
    reviewSummaryTitle: string;
    mandatoryFieldsNotice: string;
    wizardPrev: string;
    wizardNext: string;
    wizardSubmit: string;
    errorStorageUnconfigured: string;
  };
  auth: {
    modalTitleLogin: string;
    modalTitleRegister: string;
    identifierLabel: string;
    identifierPlaceholder: string;
    requestOtp: string;
    otpLabel: string;
    otpPlaceholder: string;
    verifyOtp: string;
    pinLabel: string;
    pinPlaceholder: string;
    confirmPinLabel: string;
    confirmPinPlaceholder: string;
    resetPinTitle: string;
    resetPinButton: string;
    resendOtp: string;
    resendIn: string;
    chooseRoleTitle: string;
    fullNameLabel: string;
    fullNamePlaceholder: string;
    loginWithPin: string;
    forgotPin: string;
    providerPendingNotice: string;
    securityBadge: string;
    roleTenant: string;
    roleOwner: string;
    roleAgent: string;
    roleBuilder: string;
    roleManager: string;
  };
}

export const translations: Record<SupportedLanguage, TranslationDictionary> = {
  en: {
    brand: {
      tagline: 'Trustworthy Rental Housing for Bharat',
      subtagline: 'Verified homes, authentic landlords, and transparent rental agreements across Northern India.',
      badge: 'Transparent Rental Platform',
    },
    nav: {
      home: 'Home',
      findProperty: 'Find Property',
      verifications: 'Verifications',
      connections: 'Connections',
      saathiAi: 'Saathi AI',
      help: 'Help',
      dashboard: 'Dashboard',
      listingProperty: 'Listing Property',
      account: 'Account',
      login: 'Sign In / Register',
      logout: 'Sign Out',
      language: 'Language',
    },
    home: {
      heroTitle: 'Find Verified Indian Homes • Backed by Authoritative Land Records',
      heroSubtitle: 'No fake listings, no fabricated reviews, and no unverified brokers. Griha Saathi connects genuine tenants with authenticated property owners across Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, and Punjab.',
      searchTabRent: 'Rent a Verified Home',
      searchTabDiscovery: 'Regional Authority Directory',
      stateSelectLabel: 'Select Region / State',
      propertyTypeLabel: 'Property Type',
      budgetLabel: 'Maximum Monthly Rent',
      searchButton: 'Search Verified Listings',
      whyTrustTitle: 'How Griha Saathi Ensures Total Transparency',
      whyTrustSubtitle: 'Every single property listing must pass our multi-tier verification pipeline before appearing in public discovery.',
      pillar1Title: 'Government Land Registry Audit',
      pillar1Desc: 'Cross-referenced with state revenue records (Jamabandi, Web-HALRIS, PLRS, Himbhoomi, and DDA land records) to prove genuine ownership.',
      pillar2Title: 'Physical On-Site Geo-Inspection',
      pillar2Desc: 'Trained local field officers physically visit the property, verify amenities, and geo-tag high-resolution photographs.',
      pillar3Title: 'DigiLocker & Aadhaar Identity',
      pillar3Desc: 'Authoritative identity verification for both property owners and tenants without disclosing sensitive credentials.',
      pillar4Title: 'Model Tenancy Act Compliant',
      pillar4Desc: 'Digital rental agreements legally aligned with the Model Tenancy Act, protecting security deposits and tenure rights.',
      ctaFind: 'Find a Property',
      ctaList: 'List Your Property for Verification',
      targetRegionsTitle: 'Initial Target Regions in Northern Bharat',
      honestStateNotice: 'Data Integrity Commitment: Griha Saathi never displays synthetic or seeded properties. Only listings authenticated via authorized state registries and verified landlords will appear here.',
    },
    find: {
      title: 'Find Verified Rental Properties',
      subtitle: 'Authoritative rental discovery across Delhi, Haryana, Punjab, Himachal Pradesh, and Jammu & Kashmir.',
      filterState: 'Region / State',
      filterCity: 'City / District',
      filterType: 'Property Type',
      filterBudget: 'Max Budget (₹/mo)',
      filterFurnishing: 'Furnishing Condition',
      filterPreference: 'Tenant Type',
      filterOnlyVerified: 'Only Authoritative Verified',
      filterLocality: 'Locality / Sector / Neighborhood',
      filterRentMin: 'Min Rent (₹/mo)',
      filterRentMax: 'Max Rent (₹/mo)',
      filterBedrooms: 'Bedrooms (BHK)',
      filterBathrooms: 'Bathrooms',
      filterAmenities: 'Key Amenities',
      filterFreshness: 'Availability Freshness',
      filterConfirmedOnly: 'Confirmed Live (Past 60 Days)',
      filterDataSource: 'Listing Source',
      filterSourceOwner: 'Direct Owner Submission',
      filterSourceRegistry: 'Authorized Land Registry Feed',
      filterSourceAgent: 'Licensed Representative',
      sortByLabel: 'Sort Properties By',
      sortVerifiedFirst: 'Authoritative Verified First',
      sortRentAsc: 'Rent: Low to High',
      sortRentDesc: 'Rent: High to Low',
      sortNewest: 'Recently Listed',
      totalMatching: 'Verified Properties Found',
      paginationPrev: 'Previous Page',
      paginationNext: 'Next Page',
      paginationPageOf: 'Page {page} of {totalPages}',
      freshnessConfirmedBadge: 'Confirmed Available',
      freshnessStaleBadge: 'Pending Reconfirmation',
      freshnessConfirmedDesc: 'Owner/Inspector reconfirmed availability within the mandated 60-day policy.',
      freshnessStaleDesc: 'Listing has not been reconfirmed in over 60 days. Marked stale per integrity rules.',
      saveProperty: 'Save Property',
      savedProperty: 'Saved',
      loginToSave: 'Sign in to bookmark properties to your account.',
      viewDetails: 'View Complete Audit & Details',
      modalClose: 'Close Details',
      detailOverview: 'Property Overview',
      detailFinancials: 'Rent & Security Deposit Breakdown',
      detailAmenities: 'Verified Amenities & Specifications',
      detailVerificationAudit: 'Multi-Stage Verification Audit Trail',
      detailFreshnessInfo: 'Availability Freshness Status',
      reconfirmAvailabilityButton: 'Reconfirm Availability (Reset 60 Days)',
      reconfirmSuccess: 'Availability successfully reconfirmed for the next 60 days.',
      cadastralMapTitle: 'Regional Geographic Boundary Architecture',
      cadastralMapDesc: 'GIS cadastral map layers synchronized with Delhi DDA, Haryana Jamabandi, Punjab PLRS, HP Himbhoomi, and J&K Revenue. Live pins appear only for authoritatively verified properties with certified on-site geo-coordinates.',
      mapHasCoordinates: 'Geo-certified on-site location verified',
      mapNoCoordinates: 'Cadastral sector mapped (exact coordinate disclosure protected)',
      viewList: 'List View',
      viewMap: 'Regional Map View',
      emptyTitle: 'No Matching Verified Properties Live Currently',
      emptyDescription: 'In adherence to our strict data integrity policy, Griha Saathi refuses to display fake, synthetic, or stale listings. We display only properties verified against official state land registries and certified on-site field inspections.',
      providerIntegrationNote: 'Are you a genuine property owner in this region? Submit your property for verification to be the first authentic listing.',
      clearFilters: 'Reset Search Filters',
      verifiedBadge: 'Authoritative Verified',
      unverifiedBadge: 'Pending Verification',
    },
    verifications: {
      title: 'Property & Profile Verification Protocol',
      subtitle: 'A zero-compromise, multi-stage audit ensuring safe tenancies and genuine ownership.',
      howItWorksTitle: 'Our 4-Stage Authoritative Verification Pipeline',
      stage1Title: 'Stage 1: Ownership Title & Land Registry Audit',
      stage1Desc: 'Cross-verifying title deed and mutation records with state revenue departments (e.g., Haryana Jamabandi, Punjab PLRS, Delhi DDA/Revenue, HP Himbhoomi).',
      stage2Title: 'Stage 2: Physical Geo-Tagged Property Inspection',
      stage2Desc: 'On-site verification of property condition, amenities, exact geolocation, and current occupancy status by certified inspectors.',
      stage3Title: 'Stage 3: DigiLocker & Identity Authentication',
      stage3Desc: 'Direct identity matching of the legal owner via DigiLocker / Aadhaar OTP without storing unencrypted credentials.',
      stage4Title: 'Stage 4: Police Intimation & Model Tenancy Contract',
      stage4Desc: 'Seamless digital tenant police intimation filing and standard rent agreements adhering to state tenancy regulations.',
      trackTitle: 'Verify a Property or Audit Certificate',
      trackPlaceholder: 'Enter Property ID or Verification Reference Code',
      trackButton: 'Search Audit Record',
      statusEmptyTitle: 'No Active Verification Audit in Query',
      statusEmptyDesc: 'Enter a valid reference ID above, or submit your property through the Listing Property workflow to initiate a verification audit.',
      reportListing: 'Report Listing',
      reportModalTitle: 'Report Listing Concern to Trust & Safety',
      reportReasonLabel: 'Concern Reason',
      reportDescLabel: 'Detailed Explanation & Context',
      reportSubmitButton: 'Submit Confidential Report',
      reportSuccess: 'Report submitted successfully. Our Trust & Safety team will investigate promptly.',
      trustReportTitle: 'Authoritative Verification & Trust Report',
      trustReportChecked: 'Verified Checklist Items',
      trustReportUnchecked: 'Unchecked / Ongoing Audits',
      trustReportDisclaimer: 'Statutory Limitation: Platform verification confirms administrative reviews and inspection logs. It does not constitute a title guarantee under the Transfer of Property Act 1882.',
      reviewerWorkspaceTitle: 'Authoritative Reviewer Workspace',
      reviewerQueuePending: 'Pending Review Queue',
      reviewerQueueReports: 'Active Fraud Reports',
      appealListingTitle: 'Appeal Listing Decision',
      appealReasonLabel: 'Appeal Grounds & Clarification',
      appealSubmitButton: 'Submit Appeal for Re-Review',
      actionSuspend: 'Suspend Listing',
      actionApprove: 'Approve Verification',
      actionReject: 'Reject Listing',
      actionRequestInfo: 'Request Additional Info',
      integrityWarning: 'Strict Policy: A verification badge is never issued without recorded documentary evidence and signed off inspection audits. We do not accept sponsorships or paid badge promotions.',
    },
    connections: {
      title: 'Connections & Direct Messaging',
      subtitle: 'Safe, authenticated communications between verified tenants and authentic landlords.',
      authRequiredNotice: 'Authentication Required: To protect tenant safety and landlord privacy, all connection requests and conversation histories require an authenticated session.',
      loginToAccess: 'Sign In to Access Connections',
      noActiveConnectionsTitle: 'No Active Connection Requests',
      noActiveConnectionsDesc: 'Once you find a verified property and request a connection or a visit, your conversation thread and status will appear here.',
      securityWarningTitle: 'Safety Guideline for Bharat Tenants',
      securityWarningText: 'Never transfer token money, deposits, or gate-pass fees prior to physical inspection and verification audit confirmation.',
      requestConnection: 'Initiate Connection',
      tabConversations: 'Active Chats',
      tabRequests: 'Connection Requests',
      tabVisits: 'Inspection Visits',
      tabBlocked: 'Blocked Users',
      pendingIncoming: 'Incoming Requests',
      pendingSent: 'Sent Requests',
      acceptedConnections: 'Established Connections',
      accept: 'Accept',
      decline: 'Decline',
      cancel: 'Withdraw Request',
      block: 'Block User',
      unblock: 'Unblock User',
      report: 'Report Abuse',
      scheduleVisit: 'Schedule Visit',
      visitDate: 'Inspection Date',
      timeSlot: 'Preferred Time Slot',
      visitNotes: 'Notes for Landlord',
      confirmVisit: 'Confirm Visit',
      declineVisit: 'Decline Visit',
      rescheduleVisit: 'Propose New Time',
      cancelVisit: 'Cancel Visit',
      completeVisit: 'Mark Completed',
      upcomingVisits: 'Upcoming Inspections',
      pastVisits: 'Past & Completed Inspections',
      noVisitsTitle: 'No Scheduled Visits',
      noVisitsDesc: 'You have not scheduled any property inspection visits yet. Use the button on any verified property to request an on-site visit.',
      typeMessagePlaceholder: 'Type your message to verified party...',
      sendMessage: 'Send Message',
    },
    saathiAi: {
      title: 'Saathi AI — Your Trusted Rental Companion',
      subtitle: 'Ask questions regarding tenant rights, tenancy law in Northern states, rent agreement clauses, and verified properties.',
      inputPlaceholder: 'Ask in English, Hindi, or Hinglish (e.g. Find 2 BHK flat for rent in Jammu under ₹15,000)...',
      sendButton: 'Send Query',
      disclaimer: 'Saathi AI retrieves data exclusively from authenticated property records and statutory legal sources. It will never invent properties or fabricate availability.',
      welcomeMessage: 'Namaste! I am Saathi AI. I can help you search genuine verified listings across Delhi, Haryana, Punjab, HP, and J&K, compare properties side-by-side, understand tenancy laws, or identify fraud warning signs.',
      quickPromptsTitle: 'Sample Inquiries:',
      quickPrompt1: 'Find a 2 BHK flat for rent in Jammu under ₹15,000',
      quickPrompt2: 'What is the maximum security deposit allowed under Model Tenancy Act?',
      quickPrompt3: 'How does Griha Saathi verify land records in Haryana and Punjab?',
      quickPrompt4: 'What are warning signs of rental fraud or scams before visiting?',
      quickPrompt5: 'Compare properties or explain visit scheduling',
      statusActiveRuleBased: 'Rule-Based Parser Active • Gemini Key Optional',
      statusGeminiConnected: 'Gemini AI Connected & Verified',
      statusGeminiUnset: 'Gemini API Key Unset • Local Engine Active',
      clearChat: 'Clear History',
      viewDetails: 'View Details',
      requestConnection: 'Connect with Owner',
      scheduleVisit: 'Schedule Visit',
      applyFilters: 'Apply to Search',
      compareTitle: 'Side-by-Side Property Comparison',
      notProvided: 'Not provided',
      matchRationaleTitle: 'Why This Matches Your Request',
      objectiveFactsTitle: 'Authoritative Verified Facts',
      zeroMatchesTitle: 'No Matching Properties Found in Current Database',
      zeroMatchesRelax: 'Suggested filter adjustments to explore available verified homes:',
      confirmActionTitle: 'Confirm Consequential Action',
      confirmActionPrompt: 'Saathi AI requires your explicit confirmation before proceeding with:',
      confirmProceed: 'Yes, Proceed',
      confirmCancel: 'Cancel',
      floatingWidgetTooltip: 'Ask Saathi AI',
      floatingWidgetHeading: 'Saathi AI Assistant',
    },
    help: {
      title: 'Help & Knowledge Center',
      subtitle: 'Frequently asked questions, tenancy guidelines, and authorized escalation channels.',
      faqSectionTitle: 'Frequently Asked Questions',
      supportDeskTitle: 'Official Griha Saathi Escalation Desk',
      supportDeskNotice: 'Our live support desk integration is being connected to our authenticated ticketing backend. We do not display synthetic contact numbers or fake addresses.',
      faq1Q: 'Why do I see an empty state in some regions instead of listings?',
      faq1A: 'Griha Saathi maintains strict data integrity. Unlike other portals that seed synthetic or stale listings to look busy, we only show properties that have passed our authoritative land-record and physical verification pipeline.',
      faq2Q: 'What target states does Griha Saathi currently cover?',
      faq2A: 'Our initial target territories are Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, and Punjab, with architecture designed for gradual expansion across all Indian states and Union Territories.',
      faq3Q: 'How does owner authentication work?',
      faq3A: 'Owners authenticate using real phone/email OTP and establish a secure 4-digit PIN. Property listings require title documentation checked against state land registry databases.',
      faq4Q: 'Is Griha Saathi compliant with the Digital Personal Data Protection (DPDP) Act 2023?',
      faq4A: 'Yes. All personal identifiers are masked, credentials are never stored in plaintext, and data access requires explicit purpose-specific user consent.',
    },
    dashboard: {
      title: 'Member Dashboard',
      subtitle: 'Role-aware overview for tenants, property owners, developers, and verified representatives.',
      roleTenant: 'Tenant Workspace',
      roleOwner: 'Property Owner Workspace',
      roleAgent: 'Authorized Agent Workspace',
      roleBuilder: 'Builder / Developer Workspace',
      rolePropertyManager: 'Property Manager Workspace',
      activeRole: 'Current Active Role',
      noDataTitle: 'Real Data Feed Idle',
      noDataDesc: 'No external synthetic accounts are loaded. Sign in with your real credentials to view your verified listings, active connection requests, and scheduled inspections.',
      liveIntegrationsTitle: 'System Integration Status',
      unconfiguredNotice: 'External service adapters (SMS Gateway, DigiLocker API, State Land Registry web services) are awaiting production API credentials in .env.',
      profileSettings: 'Profile & Account Settings',
      activeRolesTitle: 'Active Roles on this Account',
      switchRoleButton: 'Switch Active Role',
      addRoleButton: 'Add New Role',
      securityCenterTitle: 'Account Security & PIN',
      changePinTitle: 'Change 4-Digit Security PIN',
      changePinButton: 'Update Security PIN',
      currentPinLabel: 'Current 4-Digit PIN',
      newPinLabel: 'New 4-Digit PIN',
      auditLogsTitle: 'Security Audit History',
      activeSessionsTitle: 'Active Sessions & Devices',
      revokeAllSessions: 'Revoke Other Sessions',
      notificationSettingsTitle: 'Notification Preferences',
      saveChangesButton: 'Save Profile Changes',
      contactVerificationTitle: 'Contact Verification',
      updateContactButton: 'Update & Re-verify Contact',
      savedPropertiesTitle: 'Saved Properties',
      savedPropertiesSubtitle: 'Your bookmarked authentic listings. Stale and expired listings are flagged transparently.',
      noSavedPropertiesTitle: 'No Saved Properties Yet',
      noSavedPropertiesDesc: 'You have not saved any property listings yet. Browse real verified listings and bookmark homes you wish to follow.',
      unsaveButton: 'Remove Bookmark',
      savedOn: 'Saved on',
      viewInSearch: 'Explore Verified Properties',
      // Phase 5 additions
      ownerWorkspaceTitle: 'Property Owner & Representative Workspace',
      ownerWorkspaceSubtitle: 'Manage your authentic property listings, track verification status, and respond to inspection audits.',
      metricTotal: 'Total Properties',
      metricDrafts: 'Saved Drafts',
      metricSubmitted: 'Submitted for Review',
      metricUnderReview: 'Under Review',
      metricCorrectionRequested: 'Action Required',
      metricApproved: 'Approved & Public',
      metricWithdrawn: 'Withdrawn',
      metricRejectedExpired: 'Rejected / Expired',
      statusBadgeDraft: 'Draft',
      statusBadgeSubmitted: 'Submitted',
      statusBadgeUnderReview: 'Under Review',
      statusBadgeCorrection: 'Correction Requested',
      statusBadgeApproved: 'Verified & Public',
      statusBadgeWithdrawn: 'Withdrawn',
      statusBadgeRejected: 'Rejected',
      statusBadgeExpired: 'Expired',
      actionResumeDraft: 'Resume Draft',
      actionEditListing: 'Edit Listing',
      actionWithdraw: 'Withdraw Listing',
      actionRespondCorrection: 'Respond to Correction',
      actionReconfirm: 'Reconfirm Availability',
      withdrawConfirm: 'Are you sure you want to withdraw this listing from the public marketplace?',
      withdrawSuccess: 'Listing has been withdrawn successfully.',
      emptyOwnerTitle: 'No Property Listings Found',
      emptyOwnerDesc: 'You have not submitted any rental properties yet. Submit your first genuine property to begin our verified marketplace onboarding.',
      startListingButton: 'List a Property Now',
      correctionModalTitle: 'Verification Correction Request',
      correctionModalDesc: 'Our verification auditor has requested clarifications before approving this listing:',
      correctionResponseLabel: 'Your Correction Response & Updated Details',
      correctionResponseSubmit: 'Submit Response for Re-audit',
      // Phase 9 Dashboard & Account Keys
      savedSearchesTitle: 'Saved Searches & Real-Time Alerts',
      savedSearchesSubtitle: 'Your authentic criteria for genuine rental properties. Alerts are dispatched only when fresh, verified listings match your parameters.',
      noSavedSearchesTitle: 'No Saved Searches Configured',
      noSavedSearchesDesc: 'Save your property search criteria from the Find Property page to receive instant alerts when verified properties become available.',
      createSearchAlertButton: 'Save Current Search Filter',
      checkNewMatchesButton: 'Check for New Matches Now',
      alertFrequencyLabel: 'Alert Frequency',
      deleteSearchConfirm: 'Are you sure you want to delete this saved search and stop its alerts?',
      searchNameLabel: 'Search Identifier / Name',
      analyticsTitle: 'Listing Performance & Genuine Engagement',
      analyticsSubtitle: 'Direct database analytics computed from authentic tenant views, verified connection inquiries, and completed property visits. No synthetic traffic.',
      metricGenuineViews: 'Genuine Listing Views',
      metricInquiries: 'Direct Tenant Inquiries',
      metricConfirmedVisits: 'Confirmed In-Person Visits',
      analyticsDisclaimerTitle: 'Auditable Data Integrity',
      analyticsDisclaimerNote: 'Griha Saathi never fabricates page impressions, visitor trends, or conversion scores. Metrics strictly reflect genuine recorded database events.',
      uploadProfilePhoto: 'Upload Profile Photo',
      changeProfilePhoto: 'Change Photograph',
      photoUploadSuccess: 'Profile photo uploaded and updated successfully.',
      deactivateAccountTitle: 'Account Safeguards & Deactivation',
      deactivateAccountDesc: 'Temporarily deactivate your account or request permanent deletion. All active listings are immediately withdrawn from public discovery.',
      deactivateModalNotice: 'Enter your 4-digit security PIN to confirm account deactivation or deletion. All active sessions will be terminated immediately.',
      confirmPinLabel: 'Enter 4-Digit Security PIN',
      deactivateButton: 'Deactivate Account & Withdraw Listings',
      deleteAccountButton: 'Permanently Delete Account',
      quickCompareButton: 'Compare in Saathi AI',
      compareSelectedButton: 'Compare Selected Properties',
    },
    listing: {
      title: 'List Your Genuine Property for Authoritative Verification',
      subtitle: 'Join India’s most trustworthy rental platform. Every submitted listing undergoes our structured verification protocol before publication.',
      step1: '1. Purpose & Authority',
      step2: '2. Location & Address',
      step3: '3. Space & Specifications',
      step4: '4. Rental Terms & Availability',
      step5: '5. Genuine Property Media',
      step6: '6. Ownership Evidence & Documents',
      step7: '7. Review & Submit',
      stateLabel: 'State / Territory',
      cityLabel: 'City / District',
      localityLabel: 'Locality / Sector / Village',
      addressLabel: 'Full Street Address (Building/House No, Floor)',
      pincodeLabel: '6-digit PIN Code',
      typeLabel: 'Property Type',
      rentLabel: 'Monthly Rent (₹)',
      depositLabel: 'Security Deposit (₹)',
      maintenanceLabel: 'Monthly Maintenance (₹, 0 if included)',
      leaseTermsLabel: 'Lease Terms & Conditions',
      availableFromLabel: 'Available From Date',
      furnishingLabel: 'Furnishing Condition',
      floorInfoLabel: 'Property Floor Number',
      totalFloorsLabel: 'Total Floors in Building',
      bedroomsLabel: 'Bedrooms (BHK)',
      bathroomsLabel: 'Bathrooms',
      areaLabel: 'Carpet Area (sq ft)',
      amenitiesLabel: 'Amenities & Facilities',
      descriptionLabel: 'Authentic Property Description',
      preferenceLabel: 'Preferred Tenants',
      documentNotice: 'Ownership Document: Upload genuine ownership proof (Sale deed, Title deed, or Jamabandi extract). Files are protected and never displayed publicly.',
      submitVerificationButton: 'Submit for Authoritative Verification',
      mandatoryAuditNotice: 'Important: Submitted properties are saved as "Pending Review" and are NOT published until verified by our regional field inspector and registry audit.',
      saveDraftButton: 'Save as Draft',
      draftSavedSuccess: 'Draft successfully saved on server.',
      resumingDraft: 'Resuming saved draft from server.',
      savedDraftsTitle: 'Saved Incomplete Drafts',
      authorityOwner: 'Genuine Property Owner (Holding Title / Registry)',
      authorityAgent: 'Authorized Real Estate Agent / Broker',
      authorityBuilder: 'Builder / Property Developer',
      authorityManager: 'Professional Property Management Company',
      authoritySublessor: 'Tenant / Permitted Sublessor (Contractually Authorized)',
      authorityRoleLabel: 'Select Your Submitter Authority',
      sublessorDeclarationLabel: 'I solemnly certify that I hold explicit contractual authorization to sublet this premises.',
      accuracyDeclaration: 'I solemnly affirm that all property details, pricing, photographs, and documents submitted are authentic, unaltered, and true.',
      photoUploadTitle: 'Genuine Property Photographs',
      photoUploadNote: 'Upload genuine, unedited photographs of the actual property (JPEG, PNG, WebP up to 5MB each). Synthetic or stock photos are strictly prohibited.',
      uploadPhotoButton: 'Select & Upload Photo',
      documentUploadTitle: 'Ownership & Authority Evidence (Private & Confidential)',
      documentUploadNote: 'Upload genuine ownership or authorization proof (PDF, JPEG, PNG up to 10MB). Files are SHA-256 hashed and securely restricted from public view.',
      uploadDocumentButton: 'Select & Upload Document',
      docTypeTitleDeed: 'Title Deed',
      docTypeSaleDeed: 'Registered Sale Deed',
      docTypeJamabandi: 'Jamabandi / Fard / Land Record Extract',
      docTypeTaxReceipt: 'Municipal Property Tax Receipt',
      docTypePOA: 'Registered Power of Attorney (POA)',
      docTypeLease: 'Master Lease / Subletting Agreement',
      docTypeOther: 'Other Statutory Ownership Document',
      reviewSummaryTitle: 'Submission Summary & Final Audit Check',
      mandatoryFieldsNotice: 'Please complete all required fields and confirm the integrity declaration before submitting.',
      wizardPrev: 'Back',
      wizardNext: 'Save & Continue',
      wizardSubmit: 'Submit Listing for Verification',
      errorStorageUnconfigured: 'Storage adapter is currently offline or unconfigured.',
    },
    auth: {
      modalTitleLogin: 'Sign In to Griha Saathi',
      modalTitleRegister: 'Create Verified Account',
      identifierLabel: 'Mobile Number or Email Address',
      identifierPlaceholder: 'e.g., 9812345678 or name@example.com',
      requestOtp: 'Send Verification OTP',
      otpLabel: 'Enter 6-digit OTP',
      otpPlaceholder: 'Enter OTP sent to your contact',
      verifyOtp: 'Verify OTP & Continue',
      pinLabel: 'Enter Your 4-Digit Security PIN',
      pinPlaceholder: '••••',
      confirmPinLabel: 'Confirm 4-Digit Security PIN',
      confirmPinPlaceholder: 'Re-enter 4 digits',
      resetPinTitle: 'Reset Security PIN via OTP',
      resetPinButton: 'Reset PIN & Sign In',
      resendOtp: 'Resend Verification Code',
      resendIn: 'Resend available in',
      chooseRoleTitle: 'Select Your Initial Account Roles',
      fullNameLabel: 'Full Name (Optional)',
      fullNamePlaceholder: 'Enter your name (only displayed if provided)',
      loginWithPin: 'Authenticate with PIN',
      forgotPin: 'Forgot PIN? Recover via OTP',
      providerPendingNotice: 'SMS / Email Gateway Notice: Real SMS/Email gateway credentials must be supplied in .env to dispatch live carrier OTPs. When unconfigured, the system reports provider status honestly rather than simulating delivery.',
      securityBadge: 'Protected by Rate-Limiting & Hashed PIN Storage',
      roleTenant: 'Tenant (Seeking Rental Housing)',
      roleOwner: 'Property Owner (Listing Real Estates)',
      roleAgent: 'Authorized Real Estate Representative',
      roleBuilder: 'Builder / Property Developer',
      roleManager: 'Professional Property Manager',
    },
  },
  hi: {
    brand: {
      tagline: 'भारत के लिए विश्वसनीय किराये का आवास मंच',
      subtagline: 'उत्तरी भारत भर में सत्यापित आवास, प्रामाणिक मकान मालिक और पारदर्शी किराया अनुबंध।',
      badge: 'पारदर्शी रेंटल प्लेटफ़ॉर्म',
    },
    nav: {
      home: 'मुख्य पृष्ठ',
      findProperty: 'संपत्ति खोजें',
      verifications: 'सत्यापन',
      connections: 'संपर्क और संदेश',
      saathiAi: 'साथी एआई',
      help: 'सहायता केंद्र',
      dashboard: 'डैशबोर्ड',
      listingProperty: 'संपत्ति जोड़ें',
      account: 'खाता',
      login: 'साइन इन / पंजीकरण',
      logout: 'साइन आउट',
      language: 'भाषा',
    },
    home: {
      heroTitle: 'पूर्ण विश्वास और आधिकारिक सत्यापन के साथ घर किराये पर लें',
      heroSubtitle: 'कोई नकली लिस्टिंग नहीं, कोई बनावटी समीक्षा नहीं। गृह साथी जम्मू और कश्मीर, हरियाणा, हिमाचल प्रदेश, दिल्ली और पंजाब में वास्तविक किरायेदारों को सत्यापित मकान मालिकों से जोड़ता है।',
      searchTabRent: 'सत्यापित घर खोजें',
      searchTabDiscovery: 'क्षेत्रीय प्राधिकरण निर्देशिका',
      stateSelectLabel: 'क्षेत्र / राज्य चुनें',
      propertyTypeLabel: 'संपत्ति का प्रकार',
      budgetLabel: 'अधिकतम मासिक किराया',
      searchButton: 'सत्यापित लिस्टिंग खोजें',
      whyTrustTitle: 'गृह साथी पूर्ण पारदर्शिता कैसे सुनिश्चित करता है',
      whyTrustSubtitle: 'प्रत्येक संपत्ति लिस्टिंग को सार्वजनिक होने से पहले हमारे बहु-स्तरीय सत्यापन से गुजरना अनिवार्य है।',
      pillar1Title: 'सरकारी भूमि रिकॉर्ड ऑडिट',
      pillar1Desc: 'वास्तविक स्वामित्व साबित करने के लिए राज्य राजस्व रिकॉर्ड (जमाबंदी, Web-HALRIS, PLRS, हिमभूमि, डीडीए) से मिलान।',
      pillar2Title: 'भौतिक जियो-टैग्ड निरीक्षण',
      pillar2Desc: 'स्थानीय फील्ड अधिकारी भौतिक रूप से संपत्ति का दौरा करते हैं और सुविधाओं का सत्यापन करते हैं।',
      pillar3Title: 'डिजिलॉकर और आधार पहचान',
      pillar3Desc: 'संवेदनशील विवरणों को सुरक्षित रखते हुए कानूनी पहचान सत्यापन।',
      pillar4Title: 'मॉडल किरायेदारी अधिनियम के अनुरूप',
      pillar4Desc: 'कानूनी रूप से मान्य डिजिटल किराया अनुबंध जो सुरक्षा जमा और अधिकारों की रक्षा करते हैं।',
      ctaFind: 'संपत्ति खोजें',
      ctaList: 'सत्यापन के लिए संपत्ति जोड़ें',
      targetRegionsTitle: 'उत्तरी भारत के प्रारंभिक लक्षित राज्य',
      honestStateNotice: 'डेटा सत्यनिष्ठा संकल्प: गृह साथी कभी भी बनावटी या नकली संपत्तियां प्रदर्शित नहीं करता है। केवल आधिकारिक रूप से सत्यापित लिस्टिंग ही यहां दिखाई देंगी।',
    },
    find: {
      title: 'सत्यापित किराये की संपत्तियां खोजें',
      subtitle: 'दिल्ली, हरियाणा, पंजाब, हिमाचल प्रदेश और जम्मू-कश्मीर में प्रामाणिक रेंटल खोज।',
      filterState: 'क्षेत्र / राज्य',
      filterCity: 'शहर / जिला',
      filterType: 'प्रकार',
      filterBudget: 'अधिकतम बजट (₹/माह)',
      filterFurnishing: 'फर्निशिंग स्थिति',
      filterPreference: 'किरायेदार प्राथमिकता',
      filterOnlyVerified: 'केवल आधिकारिक सत्यापित',
      filterLocality: 'इलाका / सेक्टर / मोहल्ला',
      filterRentMin: 'न्यूनतम किराया (₹/माह)',
      filterRentMax: 'अधिकतम किराया (₹/माह)',
      filterBedrooms: 'कमरे (BHK)',
      filterBathrooms: 'शौचालय / बाथरूम',
      filterAmenities: 'प्रमुख सुविधाएं',
      filterFreshness: 'उपलब्धता की ताज़गी',
      filterConfirmedOnly: 'पिछले 60 दिनों में लाइव पुष्ट',
      filterDataSource: 'लिस्टिंग स्रोत',
      filterSourceOwner: 'मालिक द्वारा सीधे प्रस्तुत',
      filterSourceRegistry: 'आधिकारिक भूमि रजिस्ट्री डेटा',
      filterSourceAgent: 'लाइसेंस प्राप्त प्रतिनिधि',
      sortByLabel: 'क्रमबद्ध करें',
      sortVerifiedFirst: 'आधिकारिक सत्यापित पहले',
      sortRentAsc: 'किराया: कम से अधिक',
      sortRentDesc: 'किराया: अधिक से कम',
      sortNewest: 'हाल ही में सूचीबद्ध',
      totalMatching: 'सत्यापित संपत्तियां मिलीं',
      paginationPrev: 'पिछला पृष्ठ',
      paginationNext: 'अगला पृष्ठ',
      paginationPageOf: 'पृष्ठ {page} / {totalPages}',
      freshnessConfirmedBadge: 'उपलब्धता पुष्ट',
      freshnessStaleBadge: 'पुनः पुष्टि लंबित',
      freshnessConfirmedDesc: 'मालिक/निरीक्षक ने अनिवार्य 60-दिवसीय नीति के भीतर उपलब्धता की पुष्टि की है।',
      freshnessStaleDesc: '60 दिनों से अधिक समय से इस लिस्टिंग की पुष्टि नहीं की गई है। सत्यनिष्ठा नियमों के अनुसार इसे पुराना चिह्नित किया गया है।',
      saveProperty: 'संपत्ति सहेजें',
      savedProperty: 'सहेजी गई',
      loginToSave: 'अपने खाते में संपत्तियों को बुकमार्क करने के लिए साइन इन करें।',
      viewDetails: 'संपूर्ण ऑडिट और विवरण देखें',
      modalClose: 'विवरण बंद करें',
      detailOverview: 'संपत्ति का संक्षिप्त विवरण',
      detailFinancials: 'किराया एवं सुरक्षा जमा का ब्योरा',
      detailAmenities: 'सत्यापित सुविधाएं एवं विनिर्देश',
      detailVerificationAudit: 'बहु-स्तरीय सत्यापन ऑडिट ट्रेल',
      detailFreshnessInfo: 'उपलब्धता की ताज़गी स्थिति',
      reconfirmAvailabilityButton: 'उपलब्धता की पुनः पुष्टि करें (60 दिन रीसेट)',
      reconfirmSuccess: 'अगले 60 दिनों के लिए उपलब्धता सफलतापूर्वक पुनः पुष्ट की गई।',
      cadastralMapTitle: 'क्षेत्रीय भौगोलिक सीमा मानचित्र',
      cadastralMapDesc: 'दिल्ली डीडीए, हरियाणा जमाबंदी, पंजाब पीएलआरएस, हिमाचल हिमभूमि और जेएंडके राजस्व के साथ समन्वयित जीआईएस कैडस्ट्रल मानचित्र परतें। केवल ऑन-साइट सत्यापित पिन प्रदर्शित होते हैं।',
      mapHasCoordinates: 'भू-प्रमाणित ऑन-साइट स्थान सत्यापित',
      mapNoCoordinates: 'कैडस्ट्रल सेक्टर मैप किया गया (सटीक निजी निर्देशांक संरक्षित)',
      viewList: 'सूची दृश्य',
      viewMap: 'मानचित्र दृश्य',
      emptyTitle: 'वर्तमान में कोई मेल खाती सत्यापित संपत्ति लाइव नहीं है',
      emptyDescription: 'हमारी सख्त डेटा सत्यनिष्ठा नीति के तहत, गृह साथी नकली या डमी लिस्टिंग दिखाने से इनकार करता है। केवल आधिकारिक रूप से सत्यापित लिस्टिंग ही यहां दिखाई देंगी।',
      providerIntegrationNote: 'क्या आप इस क्षेत्र में एक वास्तविक संपत्ति के मालिक हैं? अपनी संपत्ति को सत्यापन के लिए प्रस्तुत करें।',
      clearFilters: 'फ़िल्टर रीसेट करें',
      verifiedBadge: 'आधिकारिक सत्यापित',
      unverifiedBadge: 'सत्यापन विचाराधीन',
    },
    verifications: {
      title: 'संपत्ति एवं प्रोफ़ाइल सत्यापन प्रक्रिया',
      subtitle: 'सुरक्षित किरायेदारी और वास्तविक स्वामित्व सुनिश्चित करने वाला शून्य-समझौता ऑडिट।',
      howItWorksTitle: 'हमारा 4-चरणीय सत्यापन पाइपलाइन',
      stage1Title: 'चरण 1: स्वामित्व और भूमि रजिस्ट्री ऑडिट',
      stage1Desc: 'राज्य राजस्व विभागों (हरियाणा जमाबंदी, पंजाब पीएलआरएस, दिल्ली राजस्व, हिमाचल हिमभूमि आदि) के साथ स्वामित्व की पुष्टि।',
      stage2Title: 'चरण 2: भौतिक जियो-टैग्ड निरीक्षण',
      stage2Desc: 'प्रमाणित निरीक्षकों द्वारा मौके पर जाकर स्थिति, सुविधाओं और वास्तविक स्थिति का सत्यापन।',
      stage3Title: 'चरण 3: डिजिलॉकर और पहचान सत्यापन',
      stage3Desc: 'डिजिलॉकर/आधार के माध्यम से संपत्ति मालिक का प्रत्यक्ष पहचान मिलान।',
      stage4Title: 'चरण 4: पुलिस सूचना और मॉडल टेनेंसी अनुबंध',
      stage4Desc: 'डिजिटल किरायेदार पुलिस सूचना और राज्य नियमों के अनुरूप रेंटल एग्रीमेंट।',
      trackTitle: 'संपत्ति या सत्यापन प्रमाणपत्र खोजें',
      trackPlaceholder: 'प्रॉपर्टी आईडी या संदर्भ कोड दर्ज करें',
      trackButton: 'ऑडिट रिकॉर्ड खोजें',
      statusEmptyTitle: 'कोई सक्रिय ऑडिट नहीं मिला',
      statusEmptyDesc: 'ऊपर एक वैध संदर्भ आईडी दर्ज करें, या सत्यापन शुरू करने के लिए अपनी संपत्ति जोड़ें।',
      reportListing: 'शिकायत दर्ज करें',
      reportModalTitle: 'सुरक्षा एवं सत्यनिष्ठा जांच हेतु रिपोर्ट करें',
      reportReasonLabel: 'शिकायत का मुख्य कारण',
      reportDescLabel: 'विस्तृत विवरण एवं संदर्भ',
      reportSubmitButton: 'गोपनीय रिपोर्ट प्रस्तुत करें',
      reportSuccess: 'रिपोर्ट सफलतापूर्वक प्राप्त हुई। हमारी ट्रस्ट टीम शीघ्र जांच करेगी।',
      trustReportTitle: 'आधिकारिक सत्यापन एवं विश्वास रिपोर्ट',
      trustReportChecked: 'सत्यापित विवरण',
      trustReportUnchecked: 'असत्यापित / लंबित जांच',
      trustReportDisclaimer: 'सांविधिक सीमा: मंच सत्यापन प्रशासनिक समीक्षा की पुष्टि करता है; यह कानूनी टाइटल गारंटी नहीं है।',
      reviewerWorkspaceTitle: 'समीक्षक कार्यक्षेत्र',
      reviewerQueuePending: 'लंबित सत्यापन कतार',
      reviewerQueueReports: 'सक्रिय धोखाधड़ी शिकायतें',
      appealListingTitle: 'निर्णय के विरुद्ध अपील',
      appealReasonLabel: 'अपील का आधार एवं साक्ष्य',
      appealSubmitButton: 'पुनर्समीक्षा हेतु अपील भेजें',
      actionSuspend: 'लिस्टिंग निलंबित करें',
      actionApprove: 'सत्यापन स्वीकृत करें',
      actionReject: 'अस्वीकार करें',
      actionRequestInfo: 'अतिरिक्त जानकारी मांगें',
      integrityWarning: 'सख्त नियम: दस्तावेजी साक्ष्य और हस्ताक्षरित निरीक्षण के बिना कोई सत्यापन बैज जारी नहीं किया जाता है। हम प्रायोजन या भुगतान आधारित बैज स्वीकार नहीं करते हैं।',
    },
    connections: {
      title: 'संपर्क और सीधा संवाद',
      subtitle: 'सत्यापित किरायेदारों और वास्तविक मकान मालिकों के बीच सुरक्षित बातचीत।',
      authRequiredNotice: 'प्रमाणीकरण आवश्यक: सुरक्षा और गोपनीयता के लिए, सभी संपर्क और संदेशों के लिए साइन इन आवश्यक है।',
      loginToAccess: 'संपर्क देखने के लिए साइन इन करें',
      noActiveConnectionsTitle: 'कोई सक्रिय अनुरोध नहीं है',
      noActiveConnectionsDesc: 'जब आप किसी सत्यापित संपत्ति के लिए अनुरोध भेजेंगे, तो आपका संवाद यहां दिखाई देगा।',
      securityWarningTitle: 'किरायेदारों के लिए सुरक्षा दिशानिर्देश',
      securityWarningText: 'भौतिक निरीक्षण और सत्यापन की पुष्टि से पहले कभी भी अग्रिम राशि या टोकन मनी न भेजें।',
      requestConnection: 'संपर्क शुरू करें',
      tabConversations: 'सक्रिय बातचीत',
      tabRequests: 'संपर्क अनुरोध',
      tabVisits: 'संपत्ति निरीक्षण',
      tabBlocked: 'अवरुद्ध उपयोगकर्ता',
      pendingIncoming: 'प्राप्त अनुरोध',
      pendingSent: 'भेजे गए अनुरोध',
      acceptedConnections: 'स्थापित संपर्क',
      accept: 'स्वीकार करें',
      decline: 'अस्वीकार करें',
      cancel: 'अनुरोध वापस लें',
      block: 'ब्लॉक करें',
      unblock: 'अनब्लॉक करें',
      report: 'रिपोर्ट करें',
      scheduleVisit: 'निरीक्षण समय चुनें',
      visitDate: 'निरीक्षण तिथि',
      timeSlot: 'पसंदीदा समय',
      visitNotes: 'मालिक के लिए टिप्पणी',
      confirmVisit: 'निरीक्षण स्वीकृत करें',
      declineVisit: 'अस्वीकार करें',
      rescheduleVisit: 'नया समय प्रस्तावित करें',
      cancelVisit: 'निरीक्षण रद्द करें',
      completeVisit: 'पूर्ण चिह्नित करें',
      upcomingVisits: 'आगामी निरीक्षण',
      pastVisits: 'पूर्व निरीक्षण',
      noVisitsTitle: 'कोई निर्धारित निरीक्षण नहीं',
      noVisitsDesc: 'आपने अभी तक कोई संपत्ति निरीक्षण निर्धारित नहीं किया है। सत्यापित संपत्ति पर जाकर निरीक्षण का अनुरोध करें।',
      typeMessagePlaceholder: 'सत्यापित पक्ष को अपना संदेश लिखें...',
      sendMessage: 'संदेश भेजें',
    },
    saathiAi: {
      title: 'साथी एआई — आपका भरोसेमंद रेंटल साथी',
      subtitle: 'किरायेदार अधिकारों, उत्तरी राज्यों के किरायेदारी कानूनों और सत्यापित संपत्तियों के बारे में पूछें।',
      inputPlaceholder: 'हिंदी, अंग्रेजी या हिंग्लिश में पूछें (जैसे: जम्मू में ₹15,000 के अंदर 2 BHK फ्लैट)...',
      sendButton: 'प्रश्न भेजें',
      disclaimer: 'साथी एआई केवल आधिकारिक रिकॉर्ड और कानूनी स्रोतों से जानकारी देता है। यह कभी भी नकली संपत्तियां नहीं बनाता।',
      welcomeMessage: 'नमस्ते! मैं साथी एआई हूँ। मैं दिल्ली, हरियाणा, पंजाब, हिमाचल और जम्मू-कश्मीर में वास्तविक संपत्तियां खोजने, संपत्तियों की तुलना करने और किरायेदारी कानूनों में आपकी सहायता कर सकता हूँ।',
      quickPromptsTitle: 'उदाहरण प्रश्न:',
      quickPrompt1: 'जम्मू में ₹15,000 के अंदर 2 BHK फ्लैट खोजें',
      quickPrompt2: 'मॉडल टेनेंसी एक्ट के तहत अधिकतम सिक्योरिटी डिपॉजिट कितना है?',
      quickPrompt3: 'हरियाणा और पंजाब में भूमि रिकॉर्ड का सत्यापन कैसे होता है?',
      quickPrompt4: 'किराये पर मकान लेने से पहले धोखाधड़ी से कैसे बचें?',
      quickPrompt5: 'सत्यापित संपत्तियों की तुलना करें या विज़िट शेड्यूल करें',
      statusActiveRuleBased: 'नियम-आधारित पार्सर सक्रिय • जेमिनी कुंजी वैकल्पिक',
      statusGeminiConnected: 'जेमिनी एआई कनेक्टेड एवं सत्यापित',
      statusGeminiUnset: 'जेमिनी एपीआई कुंजी अनुपस्थित • स्थानीय इंजन सक्रिय',
      clearChat: 'इतिहास साफ़ करें',
      viewDetails: 'विवरण देखें',
      requestConnection: 'मालिक से संपर्क करें',
      scheduleVisit: 'विज़िट शेड्यूल करें',
      applyFilters: 'खोज में लागू करें',
      compareTitle: 'संपत्तियों की साथ-साथ तुलना',
      notProvided: 'उपलब्ध नहीं कराया गया',
      matchRationaleTitle: 'यह आपकी मांग से क्यों मेल खाता है',
      objectiveFactsTitle: 'आधिकारिक रूप से सत्यापित तथ्य',
      zeroMatchesTitle: 'वर्तमान डेटाबेस में कोई मेल खाने वाली संपत्ति नहीं मिली',
      zeroMatchesRelax: 'उपलब्ध सत्यापित घरों को देखने के लिए फ़िल्टर में छूट दें:',
      confirmActionTitle: 'कार्रवाई की पुष्टि करें',
      confirmActionPrompt: 'साथी एआई को आगे बढ़ने से पहले आपकी स्पष्ट अनुमति की आवश्यकता है:',
      confirmProceed: 'हाँ, आगे बढ़ें',
      confirmCancel: 'रद्द करें',
      floatingWidgetTooltip: 'साथी एआई से पूछें',
      floatingWidgetHeading: 'साथी एआई सहायक',
    },
    help: {
      title: 'सहायता एवं ज्ञान केंद्र',
      subtitle: 'अक्सर पूछे जाने वाले प्रश्न, किरायेदारी नियम और आधिकारिक सहायता।',
      faqSectionTitle: 'अक्सर पूछे जाने वाले प्रश्न',
      supportDeskTitle: 'आधिकारिक सहायता डेस्क',
      supportDeskNotice: 'हमारा सहायता डेस्क बैकएंड से जोड़ा जा रहा है। हम कोई नकली फोन नंबर या पता नहीं दिखाते।',
      faq1Q: 'कुछ क्षेत्रों में लिस्टिंग की जगह खाली स्थिति क्यों दिखाई देती है?',
      faq1A: 'गृह साथी सख्त डेटा सत्यनिष्ठा का पालन करता है। हम व्यस्त दिखने के लिए कभी नकली लिस्टिंग नहीं डालते। केवल वही संपत्तियां दिखती हैं जो पूरी तरह सत्यापित हो चुकी हैं।',
      faq2Q: 'गृह साथी किन राज्यों में उपलब्ध है?',
      faq2A: 'प्रारंभिक चरण में जम्मू और कश्मीर, हरियाणा, हिमाचल प्रदेश, दिल्ली और पंजाब को शामिल किया गया है।',
      faq3Q: 'मालिक का प्रमाणीकरण कैसे होता है?',
      faq3A: 'मालिक वास्तविक ओटीपी और सुरक्षित 4-अंकीय पिन से लॉगिन करते हैं। राजस्व विभाग से स्वामित्व दस्तावेजों का मिलान किया जाता है।',
      faq4Q: 'क्या गृह साथी डीपीडीपी अधिनियम 2023 के अनुरूप है?',
      faq4A: 'हाँ, सभी व्यक्तिगत पहचान सुरक्षित और एन्क्रिप्टेड रखी जाती हैं।',
    },
    dashboard: {
      title: 'सदस्य डैशबोर्ड',
      subtitle: 'किरायेदारों, संपत्ति मालिकों, बिल्डरों और सत्यापित एजेंटों के लिए समर्पित कार्यक्षेत्र।',
      roleTenant: 'किरायेदार डैशबोर्ड',
      roleOwner: 'संपत्ति मालिक डैशबोर्ड',
      roleAgent: 'सत्यापित एजेंट डैशबोर्ड',
      roleBuilder: 'बिल्डर / डेवलपर डैशबोर्ड',
      rolePropertyManager: 'प्रॉपर्टी मैनेजर डैशबोर्ड',
      activeRole: 'वर्तमान सक्रिय भूमिका',
      noDataTitle: 'कोई वास्तविक डेटा लोड नहीं है',
      noDataDesc: 'कोई डमी अकाउंट लोड नहीं किया गया है। अपनी सत्यापित संपत्तियां और अनुरोध देखने के लिए साइन इन करें।',
      liveIntegrationsTitle: 'सिस्टम एकीकरण स्थिति',
      unconfiguredNotice: 'एसएमएस गेटवे और भूमि रजिस्ट्री सेवाओं के लिए .env में वास्तविक एपीआई क्रेडेंशियल्स की आवश्यकता है।',
      profileSettings: 'प्रोफ़ाइल एवं खाता सेटिंग्स',
      activeRolesTitle: 'खाते पर सक्रिय भूमिकाएं',
      switchRoleButton: 'सक्रिय भूमिका बदलें',
      addRoleButton: 'नई भूमिका जोड़ें',
      securityCenterTitle: 'खाता सुरक्षा एवं पिन',
      changePinTitle: '4-अंकीय सुरक्षा पिन बदलें',
      changePinButton: 'सुरक्षा पिन अपडेट करें',
      currentPinLabel: 'वर्तमान 4-अंकीय पिन',
      newPinLabel: 'नया 4-अंकीय पिन',
      auditLogsTitle: 'सुरक्षा ऑडिट इतिहास',
      activeSessionsTitle: 'सक्रिय सत्र एवं उपकरण',
      revokeAllSessions: 'अन्य सभी सत्र समाप्त करें',
      notificationSettingsTitle: 'अधिसूचना प्राथमिकताएं',
      saveChangesButton: 'बदलाव सहेजें',
      contactVerificationTitle: 'संपर्क विवरण सत्यापन',
      updateContactButton: 'संपर्क अपडेट एवं पुनः सत्यापित करें',
      savedPropertiesTitle: 'सहेजी गई संपत्तियां',
      savedPropertiesSubtitle: 'आपकी बुकमार्क की गई प्रामाणिक लिस्टिंग। पुरानी और समाप्त लिस्टिंग स्पष्ट रूप से चिह्नित हैं।',
      noSavedPropertiesTitle: 'अभी तक कोई सहेजी गई संपत्ति नहीं',
      noSavedPropertiesDesc: 'आपने अभी तक कोई संपत्ति सहेजी नहीं है। वास्तविक सत्यापित लिस्टिंग ब्राउज़ करें और पसंदीदा संपत्तियों को बुकमार्क करें।',
      unsaveButton: 'बुकमार्क हटाएं',
      savedOn: 'सहेजा गया',
      viewInSearch: 'सत्यापित संपत्तियां खोजें',
      // Phase 5 additions
      ownerWorkspaceTitle: 'संपत्ति मालिक एवं प्रतिनिधि कार्यक्षेत्र',
      ownerWorkspaceSubtitle: 'अपनी प्रामाणिक लिस्टिंग प्रबंधित करें, सत्यापन स्थिति ट्रैक करें और ऑडिट में भाग लें।',
      metricTotal: 'कुल संपत्तियां',
      metricDrafts: 'सहेजे गए ड्राफ्ट',
      metricSubmitted: 'समीक्षा हेतु जमा',
      metricUnderReview: 'समीक्षाधीन',
      metricCorrectionRequested: 'सुधार आवश्यक',
      metricApproved: 'स्वीकृत एवं लाइव',
      metricWithdrawn: 'वापस ली गई',
      metricRejectedExpired: 'अस्वीकृत / समाप्त',
      statusBadgeDraft: 'ड्राफ्ट',
      statusBadgeSubmitted: 'प्रस्तुत',
      statusBadgeUnderReview: 'समीक्षाधीन',
      statusBadgeCorrection: 'सुधार आवश्यक',
      statusBadgeApproved: 'सत्यापित एवं लाइव',
      statusBadgeWithdrawn: 'वापस ली गई',
      statusBadgeRejected: 'अस्वीकृत',
      statusBadgeExpired: 'समाप्त',
      actionResumeDraft: 'ड्राफ्ट जारी रखें',
      actionEditListing: 'विवरण संपादित करें',
      actionWithdraw: 'लिस्टिंग वापस लें',
      actionRespondCorrection: 'सुधार का उत्तर दें',
      actionReconfirm: 'उपलब्धता की पुनः पुष्टि करें',
      withdrawConfirm: 'क्या आप वाकई इस लिस्टिंग को सार्वजनिक खोज से वापस लेना चाहते हैं?',
      withdrawSuccess: 'लिस्टिंग सफलतापूर्वक वापस ले ली गई है।',
      emptyOwnerTitle: 'कोई संपत्ति लिस्टिंग नहीं मिली',
      emptyOwnerDesc: 'आपने अभी तक कोई संपत्ति प्रस्तुत नहीं की है। सत्यापन प्रक्रिया शुरू करने के लिए अपनी पहली वास्तविक संपत्ति जोड़ें।',
      startListingButton: 'संपत्ति अभी जोड़ें',
      correctionModalTitle: 'सत्यापन सुधार अनुरोध',
      correctionModalDesc: 'हमारे सत्यापन निरीक्षक ने लिस्टिंग स्वीकृत करने से पहले स्पष्टीकरण का अनुरोध किया है:',
      correctionResponseLabel: 'आपका उत्तर और अद्यतन विवरण',
      correctionResponseSubmit: 'पुनः ऑडिट के लिए उत्तर जमा करें',
      // Phase 9 Hindi Keys
      savedSearchesTitle: 'सहेजी गई खोजें एवं अलर्ट',
      savedSearchesSubtitle: 'आपके प्रामाणिक खोज मानदंड। केवल नए और सत्यापित लिस्टिंग मिलने पर ही अलर्ट भेजे जाते हैं।',
      noSavedSearchesTitle: 'कोई सहेजी गई खोज नहीं मिली',
      noSavedSearchesDesc: 'नए सत्यापित घर उपलब्ध होने पर तुरंत सूचना पाने के लिए संपत्ति खोज पृष्ठ से अपने मानदंड सहेजें।',
      createSearchAlertButton: 'वर्तमान खोज मानदंड सहेजें',
      checkNewMatchesButton: 'नए मेल तुरंत जांचें',
      alertFrequencyLabel: 'अलर्ट आवृत्ति',
      deleteSearchConfirm: 'क्या आप वाकई इस सहेजी गई खोज को हटाना चाहते हैं?',
      searchNameLabel: 'सहेजी गई खोज का नाम',
      analyticsTitle: 'लिस्टिंग प्रदर्शन एवं वास्तविक सहभागिता',
      analyticsSubtitle: 'वास्तविक किरायेदार दृश्यों, सत्यापित पूछताछ और पुष्टि की गई यात्राओं से सीधे परिकलित मेट्रिक्स। कोई कृत्रिम डेटा नहीं।',
      metricGenuineViews: 'वास्तविक लिस्टिंग दृश्य',
      metricInquiries: 'प्रत्यक्ष किरायेदार पूछताछ',
      metricConfirmedVisits: 'पुष्टि की गई व्यक्तिगत यात्राएं',
      analyticsDisclaimerTitle: 'डेटा सत्यनिष्ठा और पारदर्शिता',
      analyticsDisclaimerNote: 'गृह साथी कभी भी नकली दृश्य, विज़िटर संख्या या रूपांतरण स्कोर नहीं बनाता है।',
      uploadProfilePhoto: 'प्रोफ़ाइल फ़ोटो अपलोड करें',
      changeProfilePhoto: 'फ़ोटो बदलें',
      photoUploadSuccess: 'प्रोफ़ाइल फ़ोटो सफलतापूर्वक अपडेट की गई।',
      deactivateAccountTitle: 'खाता सुरक्षा एवं निष्क्रियता',
      deactivateAccountDesc: 'अपना खाता अस्थायी रूप से निष्क्रिय करें या स्थायी रूप से हटाने का अनुरोध करें। सभी सक्रिय संपत्तियां हटा ली जाएंगी।',
      deactivateModalNotice: 'पुष्टि के लिए अपना 4-अंकीय सुरक्षा पिन दर्ज करें। सभी सक्रिय सत्र तुरंत समाप्त कर दिए जाएंगे।',
      confirmPinLabel: '4-अंकीय सुरक्षा पिन दर्ज करें',
      deactivateButton: 'खाता निष्क्रिय करें एवं लिस्टिंग हटाएं',
      deleteAccountButton: 'खाता स्थायी रूप से हटाएं',
      quickCompareButton: 'साथी एआई में तुलना करें',
      compareSelectedButton: 'चयनित संपत्तियों की तुलना करें',
    },
    listing: {
      title: 'सत्यापन के लिए अपनी वास्तविक संपत्ति जोड़ें',
      subtitle: 'भारत के सबसे विश्वसनीय रेंटल प्लेटफॉर्म से जुड़ें। प्रत्येक संपत्ति प्रकाशन से पहले कड़े सत्यापन से गुजरती है।',
      step1: '1. उद्देश्य एवं अधिकार',
      step2: '2. स्थान एवं पूरा पता',
      step3: '3. संपत्ति विनिर्देश',
      step4: '4. किराया शर्तें एवं उपलब्धता',
      step5: '5. वास्तविक तस्वीरें',
      step6: '6. स्वामित्व प्रमाण दस्तावेज',
      step7: '7. समीक्षा एवं सबमिट',
      stateLabel: 'राज्य / केंद्र शासित प्रदेश',
      cityLabel: 'शहर / जिला',
      localityLabel: 'इलाका / सेक्टर / गांव',
      addressLabel: 'पूरा सड़क पता (भवन/मकान नं., मंजिल)',
      pincodeLabel: '6-अंकीय पिन कोड',
      typeLabel: 'संपत्ति का प्रकार',
      rentLabel: 'मासिक किराया (₹)',
      depositLabel: 'सुरक्षा जमा (₹)',
      maintenanceLabel: 'मासिक रखरखाव शुल्क (₹, शामिल होने पर 0)',
      leaseTermsLabel: 'पट्टा शर्तें एवं नियम',
      availableFromLabel: 'उपलब्धता आरंभ तिथि',
      furnishingLabel: 'फर्निशिंग स्थिति',
      floorInfoLabel: 'मंजिल संख्या',
      totalFloorsLabel: 'इमारत में कुल मंजिलें',
      bedroomsLabel: 'शयनकक्ष (BHK)',
      bathroomsLabel: 'स्नानघर (बाथरूम)',
      areaLabel: 'कारपेट एरिया (वर्ग फुट)',
      amenitiesLabel: 'सुविधाएं एवं व्यवस्थाएं',
      descriptionLabel: 'संपत्ति का प्रामाणिक विवरण',
      preferenceLabel: 'पसंदीदा किरायेदार',
      documentNotice: 'स्वामित्व दस्तावेज: सत्यापन के लिए सेल डीड, टाइटल डीड या नवीनतम जमाबंदी/टैक्स रसीद अपलोड करें। दस्तावेज गोपनीय रहेंगे।',
      submitVerificationButton: 'सत्यापन के लिए जमा करें',
      mandatoryAuditNotice: 'महत्वपूर्ण: प्रस्तुत संपत्तियों को "समीक्षाधीन" के रूप में सहेजा जाता है और क्षेत्रीय निरीक्षक ऑडिट के बाद ही प्रकाशित किया जाता है।',
      saveDraftButton: 'ड्राफ्ट सहेजें',
      draftSavedSuccess: 'ड्राफ्ट सर्वर पर सफलतापूर्वक सहेजा गया।',
      resumingDraft: 'सर्वर से सहेजा गया ड्राफ्ट लोड किया जा रहा है।',
      savedDraftsTitle: 'सहेजे गए अपूर्ण ड्राफ्ट',
      authorityOwner: 'वास्तविक संपत्ति मालिक (स्वामित्व/रजिस्ट्री धारक)',
      authorityAgent: 'अधिकृत रियल एस्टेट एजेंट / ब्रोकर',
      authorityBuilder: 'बिल्डर / संपत्ति डेवलपर',
      authorityManager: 'व्यावसायिक संपत्ति प्रबंधन कंपनी',
      authoritySublessor: 'किरायेदार / उप-पट्टेदार (अनुबंध द्वारा अधिकृत)',
      authorityRoleLabel: 'अपनी प्रस्तुतकर्ता अधिकार स्थिति चुनें',
      sublessorDeclarationLabel: 'मैं प्रमाणित करता हूँ कि मेरे पास इस परिसर को सबलेट करने का वैध अनुबंध प्राधिकार है।',
      accuracyDeclaration: 'मैं निष्ठापूर्वक पुष्टि करता हूँ कि प्रस्तुत सभी विवरण, दरें, तस्वीरें और दस्तावेज प्रामाणिक और सत्य हैं।',
      photoUploadTitle: 'संपत्ति की वास्तविक तस्वीरें',
      photoUploadNote: 'केवल वास्तविक तस्वीरें अपलोड करें (JPEG, PNG, WebP अधिकतम 5MB प्रति फोटो)। स्टॉक फोटो सख्त वर्जित हैं।',
      uploadPhotoButton: 'तस्वीर चुनें एवं अपलोड करें',
      documentUploadTitle: 'स्वामित्व एवं अधिकार प्रमाण (निजी एवं सुरक्षित)',
      documentUploadNote: 'स्वामित्व या प्राधिकार प्रमाण अपलोड करें (PDF, JPEG, PNG अधिकतम 10MB)। फाइलें SHA-256 हैशेड हैं और जनता से सुरक्षित हैं।',
      uploadDocumentButton: 'दस्तावेज चुनें एवं अपलोड करें',
      docTypeTitleDeed: 'टाइटल डीड (स्वामित्व विलेख)',
      docTypeSaleDeed: 'पंजीकृत बैनामा (सेल डीड)',
      docTypeJamabandi: 'जमाबंदी / फर्द / राजस्व नकल',
      docTypeTaxReceipt: 'नगर निगम संपत्ति कर रसीद',
      docTypePOA: 'पंजीकृत मुख्तारनामा (पावर ऑफ अटॉर्नी)',
      docTypeLease: 'मास्टर लीज / सबलेटिंग अनुबंध',
      docTypeOther: 'अन्य सांविधिक स्वामित्व दस्तावेज',
      reviewSummaryTitle: 'प्रस्तुति सारांश एवं अंतिम ऑडिट जांच',
      mandatoryFieldsNotice: 'कृपया सबमिट करने से पहले सभी आवश्यक फ़ील्ड भरें और घोषणा स्वीकार करें।',
      wizardPrev: 'पीछे',
      wizardNext: 'सहेजें एवं आगे बढ़ें',
      wizardSubmit: 'सत्यापन के लिए लिस्टिंग प्रस्तुत करें',
      errorStorageUnconfigured: 'स्टोरेज एडेप्टर वर्तमान में कॉन्फ़िगर नहीं है।',
    },
    auth: {
      modalTitleLogin: 'गृह साथी में साइन इन करें',
      modalTitleRegister: 'सत्यापित खाता बनाएं',
      identifierLabel: 'मोबाइल नंबर या ईमेल पता',
      identifierPlaceholder: 'उदा. 9812345678 या name@example.com',
      requestOtp: 'सत्यापन ओटीपी भेजें',
      otpLabel: '6-अंकीय ओटीपी दर्ज करें',
      otpPlaceholder: 'प्राप्त ओटीपी दर्ज करें',
      verifyOtp: 'ओटीपी सत्यापित करें',
      pinLabel: 'अपना 4-अंकीय सुरक्षा पिन दर्ज करें',
      pinPlaceholder: '••••',
      confirmPinLabel: '4-अंकीय पिन की पुष्टि करें',
      confirmPinPlaceholder: 'पिन पुनः दर्ज करें',
      resetPinTitle: 'ओटीपी द्वारा सुरक्षा पिन रीसेट करें',
      resetPinButton: 'पिन रीसेट करें और साइन इन करें',
      resendOtp: 'ओटीपी पुनः भेजें',
      resendIn: 'पुनः भेजने का समय:',
      chooseRoleTitle: 'अपनी प्रारंभिक भूमिकाएं चुनें',
      fullNameLabel: 'पूरा नाम (वैकल्पिक)',
      fullNamePlaceholder: 'अपना नाम दर्ज करें (केवल तभी दिखेगा जब आप देंगे)',
      loginWithPin: 'पिन के साथ प्रवेश करें',
      forgotPin: 'पिन भूल गए? ओटीपी से रीसेट करें',
      providerPendingNotice: 'एसएमएस/ईमेल सूचना: लाइव ओटीपी भेजने के लिए .env में गेटवे क्रेडेंशियल आवश्यक हैं। अपूर्ण होने पर सिस्टम ईमानदारी से स्थिति प्रदर्शित करता है।',
      securityBadge: 'रेट-लिमिटिंग और हैशेड पिन स्टोरेज द्वारा सुरक्षित',
      roleTenant: 'किरायेदार (किराये का आवास खोज रहे हैं)',
      roleOwner: 'संपत्ति मालिक (लिस्टिंग जोड़ने हेतु)',
      roleAgent: 'अधिकृत रियल एस्टेट प्रतिनिधि',
      roleBuilder: 'बिल्डर / डेवलपर',
      roleManager: 'प्रॉपर्टी मैनेजर',
    },
  },
  'hi-en': {
    brand: {
      tagline: 'Trustworthy Rental Housing Bharat Ke Liye',
      subtagline: 'Verified homes, genuine owners aur transparent rent agreements North India ke target regions mein.',
      badge: 'Transparent Rental Platform',
    },
    nav: {
      home: 'Home',
      findProperty: 'Property Dhundo',
      verifications: 'Verifications',
      connections: 'Connections',
      saathiAi: 'Saathi AI',
      help: 'Help Support',
      dashboard: 'Dashboard',
      listingProperty: 'Property List Karo',
      account: 'Account',
      login: 'Sign In / Register',
      logout: 'Sign Out',
      language: 'Language / भाषा',
    },
    home: {
      heroTitle: 'Pore Trust aur Authoritative Verification Ke Saath Rent Pe Ghar Le',
      heroSubtitle: 'Na koi fake listings, na fake reviews aur na fabricated brokers. Griha Saathi connects genuine tenants with verified property owners in J&K, Haryana, Himachal, Delhi aur Punjab.',
      searchTabRent: 'Verified Home Dhundo',
      searchTabDiscovery: 'Regional Authority Directory',
      stateSelectLabel: 'Region / State Chunein',
      propertyTypeLabel: 'Property Type',
      budgetLabel: 'Max Monthly Rent',
      searchButton: 'Verified Listings Search Karein',
      whyTrustTitle: 'Griha Saathi Total Transparency Kaise Ensure Karta Hai',
      whyTrustSubtitle: 'Har single property ko public hone se pehle hamare multi-tier verification pipeline se pass hona padta hai.',
      pillar1Title: 'Government Land Registry Audit',
      pillar1Desc: 'Haryana Jamabandi, Punjab PLRS, HP Himbhoomi aur Delhi DDA revenue records se direct title cross-verification.',
      pillar2Title: 'Physical On-Site Geo-Inspection',
      pillar2Desc: 'Trained field officers physically visit karke property, amenities aur location ko geo-tag karte hain.',
      pillar3Title: 'DigiLocker & Aadhaar Identity',
      pillar3Desc: 'Authoritative identity verification without exposing sensitive personal credentials.',
      pillar4Title: 'Model Tenancy Act Compliant',
      pillar4Desc: 'Legally vetted digital rental agreements jo tenants aur owners dono ke rights protect karte hain.',
      ctaFind: 'Property Search Karein',
      ctaList: 'Apni Property List & Verify Karein',
      targetRegionsTitle: 'Initial Target Regions in North Bharat',
      honestStateNotice: 'Data Integrity Commitment: Griha Saathi kabhi fake ya synthetic listings display nahi karta. Sirf authorized state registries aur verified landlords ki listing yahan aati hai.',
    },
    find: {
      title: 'Verified Rental Properties Dhundein',
      subtitle: 'Authoritative rental discovery Delhi, Haryana, Punjab, Himachal Pradesh aur Jammu & Kashmir mein.',
      filterState: 'Region / State',
      filterCity: 'City / District',
      filterType: 'Property Type',
      filterBudget: 'Max Budget (₹/month)',
      filterFurnishing: 'Furnishing Condition',
      filterPreference: 'Tenant Type',
      filterOnlyVerified: 'Sirf Authoritative Verified',
      filterLocality: 'Locality / Sector / Neighborhood',
      filterRentMin: 'Min Rent (₹/mo)',
      filterRentMax: 'Max Rent (₹/mo)',
      filterBedrooms: 'Bedrooms (BHK)',
      filterBathrooms: 'Bathrooms',
      filterAmenities: 'Key Amenities',
      filterFreshness: 'Availability Freshness',
      filterConfirmedOnly: 'Confirmed Live (Past 60 Days)',
      filterDataSource: 'Listing Source',
      filterSourceOwner: 'Direct Owner Submission',
      filterSourceRegistry: 'Authorized Land Registry Feed',
      filterSourceAgent: 'Licensed Representative',
      sortByLabel: 'Sort Properties By',
      sortVerifiedFirst: 'Authoritative Verified Pehle',
      sortRentAsc: 'Rent: Low to High',
      sortRentDesc: 'Rent: High to Low',
      sortNewest: 'Recently Listed',
      totalMatching: 'Verified Properties Mili',
      paginationPrev: 'Pichla Page',
      paginationNext: 'Agla Page',
      paginationPageOf: 'Page {page} of {totalPages}',
      freshnessConfirmedBadge: 'Confirmed Available',
      freshnessStaleBadge: 'Pending Reconfirmation',
      freshnessConfirmedDesc: 'Owner ya Inspector ne 60 days rule ke andar availability confirm ki hai.',
      freshnessStaleDesc: 'Listing ko 60 days se confirm nahi kiya gaya. Data integrity policy ke mutabik stale marked hai.',
      saveProperty: 'Property Save Karein',
      savedProperty: 'Saved',
      loginToSave: 'Apne account mein properties bookmark karne ke liye Sign In karein.',
      viewDetails: 'Complete Audit & Details Dekhein',
      modalClose: 'Details Band Karein',
      detailOverview: 'Property Overview',
      detailFinancials: 'Rent & Security Deposit Breakdown',
      detailAmenities: 'Verified Amenities & Specifications',
      detailVerificationAudit: 'Multi-Stage Verification Audit Trail',
      detailFreshnessInfo: 'Availability Freshness Status',
      reconfirmAvailabilityButton: 'Availability Reconfirm Karein (Reset 60 Days)',
      reconfirmSuccess: 'Availability successfully agle 60 days ke liye reconfirm ho gayi.',
      cadastralMapTitle: 'Regional Geographic Boundary Architecture',
      cadastralMapDesc: 'GIS cadastral map layers Delhi DDA, Haryana Jamabandi, Punjab PLRS, HP Himbhoomi aur J&K Revenue ke saath synchronized. Live pins sirf certified on-site geo-coordinates ke sath aate hain.',
      mapHasCoordinates: 'Geo-certified on-site location verified',
      mapNoCoordinates: 'Cadastral sector mapped (exact coordinate disclosure protected)',
      viewList: 'List View',
      viewMap: 'Regional Map View',
      emptyTitle: 'Koi Matching Verified Properties Live Nahi Hain',
      emptyDescription: 'Strict data integrity policy ke mutabiq, Griha Saathi koi fake, dummy ya synthetic listings nahi dikhata. Yahan sirf certified government land registry aur physically inspected homes hi show hote hain.',
      providerIntegrationNote: 'Kya aap iss area mein genuine property owner hain? Pehli verified listing banne ke liye apni property submit karein.',
      clearFilters: 'Filters Reset Karein',
      verifiedBadge: 'Authoritative Verified',
      unverifiedBadge: 'Pending Verification',
    },
    verifications: {
      title: 'Property & Profile Verification Protocol',
      subtitle: 'Zero-compromise multi-stage audit authentic ownership aur safe tenancy ke liye.',
      howItWorksTitle: 'Hamara 4-Stage Verification Pipeline',
      stage1Title: 'Stage 1: Ownership Title & Registry Audit',
      stage1Desc: 'State revenue portals (Jamabandi, PLRS, Himbhoomi, DDA) ke through registry match.',
      stage2Title: 'Stage 2: Physical Geo-Tagged Property Inspection',
      stage2Desc: 'On-site verification of property condition, amenities aur occupancy status.',
      stage3Title: 'Stage 3: DigiLocker & Identity Authentication',
      stage3Desc: 'Direct identity matching of the legal owner through DigiLocker/Aadhaar.',
      stage4Title: 'Stage 4: Police Intimation & Model Tenancy Agreement',
      stage4Desc: 'Digital tenant police verification support aur standard rent agreements.',
      trackTitle: 'Property ya Audit Certificate Check Karein',
      trackPlaceholder: 'Property ID ya Verification Reference Code enter karein',
      trackButton: 'Search Audit Record',
      statusEmptyTitle: 'Koi Active Verification Audit Query Mein Nahi Hai',
      statusEmptyDesc: 'Valid reference ID search karein ya apni property submit karke audit initiate karein.',
      reportListing: 'Report Listing',
      reportModalTitle: 'Trust & Safety ko Listing Report Karein',
      reportReasonLabel: 'Concern ka Reason',
      reportDescLabel: 'Detailed Explanation & Context',
      reportSubmitButton: 'Confidential Report Submit Karein',
      reportSuccess: 'Aapki report submit ho gayi. Trust team promptly investigate karegi.',
      trustReportTitle: 'Authoritative Verification & Trust Report',
      trustReportChecked: 'Verified Checklist Items',
      trustReportUnchecked: 'Unchecked / Ongoing Audits',
      trustReportDisclaimer: 'Statutory Limitation: Platform verification administrative check confirm karta hai; legal title warranty nahi deta.',
      reviewerWorkspaceTitle: 'Authoritative Reviewer Workspace',
      reviewerQueuePending: 'Pending Review Queue',
      reviewerQueueReports: 'Active Fraud Reports',
      appealListingTitle: 'Listing Decision Appeal',
      appealReasonLabel: 'Appeal ka Ground aur Details',
      appealSubmitButton: 'Appeal Re-Review ke liye Bhejein',
      actionSuspend: 'Listing Suspend Karein',
      actionApprove: 'Approve Karein',
      actionReject: 'Reject Karein',
      actionRequestInfo: 'Extra Info Mangein',
      integrityWarning: 'Strict Policy: Verification badge bina documentary evidence aur field inspection sign-off ke issue nahi hota. Hum sponsored badges accept nahi karte.',
    },
    connections: {
      title: 'Connections & Direct Chat',
      subtitle: 'Safe, authenticated communications verified tenants aur authentic landlords ke beech.',
      authRequiredNotice: 'Authentication Zaroori Hai: Safety aur privacy ke liye sabhi connection requests aur messages ke liye login required hai.',
      loginToAccess: 'Connections Dekhne Ke Liye Sign In Karein',
      noActiveConnectionsTitle: 'Abhi Koi Active Connections Nahi Hain',
      noActiveConnectionsDesc: 'Jab aap verified property pe connection request bhejenge, aapki chat yahan show hogi.',
      securityWarningTitle: 'Bharat Tenants Ke Liye Safety Warning',
      securityWarningText: 'Physical inspection aur verification audit confirm hone se pehle kabhi advance token money transfer na karein.',
      requestConnection: 'Connection Request Bhejein',
      tabConversations: 'Active Chats',
      tabRequests: 'Connection Requests',
      tabVisits: 'Property Visits',
      tabBlocked: 'Blocked Users',
      pendingIncoming: 'Aaye Hue Requests',
      pendingSent: 'Bheje Gaye Requests',
      acceptedConnections: 'Accepted Connections',
      accept: 'Accept Karein',
      decline: 'Decline Karein',
      cancel: 'Request Wapas Lein',
      block: 'Block Karein',
      unblock: 'Unblock Karein',
      report: 'Report Karein',
      scheduleVisit: 'Visit Schedule Karein',
      visitDate: 'Inspection Date',
      timeSlot: 'Time Slot',
      visitNotes: 'Owner Ke Liye Note',
      confirmVisit: 'Visit Confirm Karein',
      declineVisit: 'Decline Karein',
      rescheduleVisit: 'Naya Time Suggest Karein',
      cancelVisit: 'Visit Cancel Karein',
      completeVisit: 'Completed Mark Karein',
      upcomingVisits: 'Aane Wali Visits',
      pastVisits: 'Past Visits',
      noVisitsTitle: 'Koi Scheduled Visits Nahi Hain',
      noVisitsDesc: 'Aapne abhi tak koi property inspection schedule nahi ki hai. Verified property page pe jaakar visit request karein.',
      typeMessagePlaceholder: 'Verified owner/tenant ko message likhein...',
      sendMessage: 'Message Bhejein',
    },
    saathiAi: {
      title: 'Saathi AI — Aapka Trusted Rental Companion',
      subtitle: 'Tenant rights, North Indian states ke rental laws, rent agreement clauses aur verified listings ke baare mein puchein.',
      inputPlaceholder: 'English, Hindi ya Hinglish mein puchein (e.g. Jammu mein under 15000 2 BHK flat dhundho)...',
      sendButton: 'Send Query',
      disclaimer: 'Saathi AI exclusively authenticated property records aur tenancy law sources se answer deta hai. Kabhi fake properties invent nahi karta.',
      welcomeMessage: 'Namaste! Main Saathi AI hoon. Delhi, Haryana, Punjab, Himachal aur J&K ke authentic verified listings search karne, side-by-side compare karne, ya tenancy fraud se bachne mein aapki madad kar sakta hoon.',
      quickPromptsTitle: 'Sample Inquiries:',
      quickPrompt1: 'Find a 2 BHK flat for rent in Jammu under ₹15,000',
      quickPrompt2: 'Model Tenancy Act ke according max security deposit kitna ho sakta hai?',
      quickPrompt3: 'Haryana aur Punjab mein land records verify kaise hote hain?',
      quickPrompt4: 'Rental fraud aur scams se bachne ke warning signs kya hain?',
      quickPrompt5: 'Properties compare karein ya visit schedule kaise karein?',
      statusActiveRuleBased: 'Rule-Based Parser Active • Gemini Key Optional',
      statusGeminiConnected: 'Gemini AI Connected & Active',
      statusGeminiUnset: 'Gemini API Key Unset • Local Engine Active',
      clearChat: 'Clear History',
      viewDetails: 'View Details',
      requestConnection: 'Connect with Owner',
      scheduleVisit: 'Schedule Visit',
      applyFilters: 'Apply to Search',
      compareTitle: 'Side-by-Side Property Comparison',
      notProvided: 'Not provided',
      matchRationaleTitle: 'Yeh aapki request se kyu match karta hai',
      objectiveFactsTitle: 'Authoritative Verified Facts',
      zeroMatchesTitle: 'Database mein koi matching property nahi mili',
      zeroMatchesRelax: 'Verified properties dekhne ke liye filters adjust karein:',
      confirmActionTitle: 'Confirm Consequential Action',
      confirmActionPrompt: 'Saathi AI ko proceed karne ke liye aapki explicit confirmation chahiye:',
      confirmProceed: 'Yes, Proceed',
      confirmCancel: 'Cancel',
      floatingWidgetTooltip: 'Saathi AI se puchein',
      floatingWidgetHeading: 'Saathi AI Assistant',
    },
    help: {
      title: 'Help & Knowledge Center',
      subtitle: 'Frequently asked questions, tenancy rules aur official escalation desk.',
      faqSectionTitle: 'Frequently Asked Questions',
      supportDeskTitle: 'Official Griha Saathi Support Desk',
      supportDeskNotice: 'Support desk backend connect ho raha hai. Fake numbers ya fake addresses hum show nahi karte.',
      faq1Q: 'Kuch areas mein zero listings kyu dikh rahi hain?',
      faq1A: 'Griha Saathi fake data show nahi karta. Sirf wahi properties dikhti hain jinki land registry aur physical visit verify ho chuki hai.',
      faq2Q: 'Griha Saathi abhi kin states mein live hai?',
      faq2A: 'Initial target territories: Jammu & Kashmir, Haryana, Himachal Pradesh, Delhi, aur Punjab.',
      faq3Q: 'Owner authentication kaise hoti hai?',
      faq3A: 'Real OTP verification aur 4-digit security PIN ke through. Property land records ke saath match ki jaati hai.',
      faq4Q: 'Kya DPDP Act 2023 compliance implemented hai?',
      faq4A: 'Haan, all personal data is encrypted, masked aur purpose-specific consent ke bina access nahi hota.',
    },
    dashboard: {
      title: 'Member Dashboard',
      subtitle: 'Role-aware overview tenants, property owners, builders aur verified agents ke liye.',
      roleTenant: 'Tenant Workspace',
      roleOwner: 'Property Owner Workspace',
      roleAgent: 'Authorized Agent Workspace',
      roleBuilder: 'Builder / Developer Workspace',
      rolePropertyManager: 'Property Manager Workspace',
      activeRole: 'Current Active Role',
      noDataTitle: 'Real Data Feed Idle',
      noDataDesc: 'Koi fake ya synthetic accounts nahi hain. Real credentials se sign in karein to view your verified listings.',
      liveIntegrationsTitle: 'System Integration Status',
      unconfiguredNotice: 'External service adapters (SMS Gateway, DigiLocker, State Registry APIs) .env credentials ka wait kar rahe hain.',
      profileSettings: 'Profile & Account Settings',
      activeRolesTitle: 'Iss Account Ke Active Roles',
      switchRoleButton: 'Active Role Switch Karein',
      addRoleButton: 'Naya Role Add Karein',
      securityCenterTitle: 'Account Security & PIN Settings',
      changePinTitle: '4-Digit Security PIN Badlein',
      changePinButton: 'Security PIN Update Karein',
      currentPinLabel: 'Current 4-Digit PIN',
      newPinLabel: 'Naya 4-Digit PIN',
      auditLogsTitle: 'Security Audit History',
      activeSessionsTitle: 'Active Sessions & Devices',
      revokeAllSessions: 'Baaki Sabhi Sessions Terminate Karein',
      notificationSettingsTitle: 'Notification Preferences',
      saveChangesButton: 'Profile Changes Save Karein',
      contactVerificationTitle: 'Contact Verification',
      updateContactButton: 'Contact Update & Re-verify Karein',
      savedPropertiesTitle: 'Saved Properties',
      savedPropertiesSubtitle: 'Aapki bookmarked authentic listings. Stale aur expired properties transparently flagged rehti hain.',
      noSavedPropertiesTitle: 'Abhi Koi Property Saved Nahi Hai',
      noSavedPropertiesDesc: 'Aapne abhi tak koi property save nahi ki. Real verified listings explore karke apni pasandida properties bookmark karein.',
      unsaveButton: 'Bookmark Hatayein',
      savedOn: 'Saved on',
      viewInSearch: 'Verified Properties Search Karein',
      // Phase 5 additions
      ownerWorkspaceTitle: 'Property Owner & Representative Workspace',
      ownerWorkspaceSubtitle: 'Apni genuine listings manage karein, verification audit track karein aur inspection updates dekhein.',
      metricTotal: 'Total Properties',
      metricDrafts: 'Saved Drafts',
      metricSubmitted: 'Submitted for Review',
      metricUnderReview: 'Under Review',
      metricCorrectionRequested: 'Action Required',
      metricApproved: 'Verified & Public',
      metricWithdrawn: 'Withdrawn',
      metricRejectedExpired: 'Rejected / Expired',
      statusBadgeDraft: 'Draft',
      statusBadgeSubmitted: 'Submitted',
      statusBadgeUnderReview: 'Under Review',
      statusBadgeCorrection: 'Correction Needed',
      statusBadgeApproved: 'Verified & Live',
      statusBadgeWithdrawn: 'Withdrawn',
      statusBadgeRejected: 'Rejected',
      statusBadgeExpired: 'Expired',
      actionResumeDraft: 'Draft Resume Karein',
      actionEditListing: 'Listing Edit Karein',
      actionWithdraw: 'Listing Withdraw Karein',
      actionRespondCorrection: 'Correction Ka Response Dein',
      actionReconfirm: 'Availability Reconfirm Karein',
      withdrawConfirm: 'Kya aap sure hain ki is listing ko marketplace se withdraw karna chahte hain?',
      withdrawSuccess: 'Listing successfully withdraw ho gayi hai.',
      emptyOwnerTitle: 'Koi Property Listing Nahi Mili',
      emptyOwnerDesc: 'Aapne abhi tak koi property submit nahi ki. Verified marketplace onboarding ke liye apni pehli real property list karein.',
      startListingButton: 'Property Abhi List Karein',
      correctionModalTitle: 'Verification Correction Request',
      correctionModalDesc: 'Auditor ne approval se pehle clarifications request kiye hain:',
      correctionResponseLabel: 'Aapka Clarification Response & Updated Details',
      correctionResponseSubmit: 'Re-audit Ke Liye Submit Karein',
      // Phase 9 Hinglish Keys
      savedSearchesTitle: 'Saved Searches & Real-Time Alerts',
      savedSearchesSubtitle: 'Aapke authentic search parameters. Alerts tabhi dispatch hote hain jab fresh aur verified listings match karti hain.',
      noSavedSearchesTitle: 'Koi Saved Search Configure Nahi Hai',
      noSavedSearchesDesc: 'Verified properties live aane par instant alert paane ke liye Find Property page se apni search save karein.',
      createSearchAlertButton: 'Current Search Filter Save Karein',
      checkNewMatchesButton: 'Naye Matches Abhi Check Karein',
      alertFrequencyLabel: 'Alert Frequency',
      deleteSearchConfirm: 'Kya aap sure hain ki is saved search ko delete karna chahte hain?',
      searchNameLabel: 'Search Identifier / Name',
      analyticsTitle: 'Listing Performance & Genuine Engagement',
      analyticsSubtitle: 'Authentic views, verified inquiries aur confirmed property visits se calculate kiye gaye direct database analytics. Koi fake traffic nahi.',
      metricGenuineViews: 'Genuine Listing Views',
      metricInquiries: 'Direct Tenant Inquiries',
      metricConfirmedVisits: 'Confirmed In-Person Visits',
      analyticsDisclaimerTitle: 'Auditable Data Integrity',
      analyticsDisclaimerNote: 'Griha Saathi kabhi fake page impressions ya visitor scores fabricate nahi karta. Metrics authentic database events ko reflect karte hain.',
      uploadProfilePhoto: 'Profile Photo Upload Karein',
      changeProfilePhoto: 'Photo Change Karein',
      photoUploadSuccess: 'Profile photo successfully update ho gayi.',
      deactivateAccountTitle: 'Account Safeguards & Deactivation',
      deactivateAccountDesc: 'Account ko temporarily deactivate karein ya permanent deletion request dein. Active listings turant withdraw ho jaayengi.',
      deactivateModalNotice: 'Deactivation confirm karne ke liye apna 4-digit security PIN enter karein. Sabhi active sessions terminate ho jaayenge.',
      confirmPinLabel: '4-Digit Security PIN Enter Karein',
      deactivateButton: 'Account Deactivate Karein & Listings Withdraw Karein',
      deleteAccountButton: 'Account Permanently Delete Karein',
      quickCompareButton: 'Saathi AI Mein Compare Karein',
      compareSelectedButton: 'Selected Properties Compare Karein',
    },
    listing: {
      title: 'Apni Real Property Verification Ke Liye List Karein',
      subtitle: 'Bharat ke most trustworthy rental platform par judiye. Har property publish hone se pehle authoritative audit se guzarti hai.',
      step1: '1. Purpose & Authority',
      step2: '2. Location & Full Address',
      step3: '3. Space & Specifications',
      step4: '4. Rental Terms & Availability',
      step5: '5. Genuine Property Media',
      step6: '6. Ownership Proof Documents',
      step7: '7. Review & Submit',
      stateLabel: 'State / Territory',
      cityLabel: 'City / District',
      localityLabel: 'Locality / Sector / Village',
      addressLabel: 'Full Street Address (Building/Flat No, Floor)',
      pincodeLabel: '6-digit PIN Code',
      typeLabel: 'Property Type',
      rentLabel: 'Monthly Rent (₹)',
      depositLabel: 'Security Deposit (₹)',
      maintenanceLabel: 'Monthly Maintenance (₹, 0 if included)',
      leaseTermsLabel: 'Lease Terms & Agreement Conditions',
      availableFromLabel: 'Available From Date',
      furnishingLabel: 'Furnishing Condition',
      floorInfoLabel: 'Floor Number',
      totalFloorsLabel: 'Total Floors in Building',
      bedroomsLabel: 'Bedrooms (BHK)',
      bathroomsLabel: 'Bathrooms',
      areaLabel: 'Carpet Area (sq ft)',
      amenitiesLabel: 'Amenities & Facilities',
      descriptionLabel: 'Authentic Property Description',
      preferenceLabel: 'Preferred Tenants',
      documentNotice: 'Ownership Document: Title Deed, Sale Deed ya Jamabandi upload karein. Documents securely protected rehte hain aur publicly visible nahi hote.',
      submitVerificationButton: 'Authoritative Verification Ke Liye Submit Karein',
      mandatoryAuditNotice: 'Important: Submitted properties "Pending Review" status mein rehti hain aur field inspection audit ke baad hi live hoti hain.',
      saveDraftButton: 'Draft Save Karein',
      draftSavedSuccess: 'Draft server par successfully save ho gaya.',
      resumingDraft: 'Server se saved draft load ho raha hai.',
      savedDraftsTitle: 'Saved Incomplete Drafts',
      authorityOwner: 'Genuine Property Owner (Title / Registry Holder)',
      authorityAgent: 'Authorized Real Estate Agent / Broker',
      authorityBuilder: 'Builder / Property Developer',
      authorityManager: 'Property Management Company',
      authoritySublessor: 'Tenant / Authorized Sublessor',
      authorityRoleLabel: 'Apna Submitter Authority Select Karein',
      sublessorDeclarationLabel: 'Main certify karta hoon ki mere paas is premises ko sublet karne ka valid agreement authority hai.',
      accuracyDeclaration: 'Main affirm karta hoon ki sabhi details, photos, aur documents 100% authentic aur unaltered hain.',
      photoUploadTitle: 'Property Ki Genuine Photos',
      photoUploadNote: 'Sirf actual property photos upload karein (JPEG, PNG, WebP up to 5MB each). Fake ya stock photos strictly prohibited hain.',
      uploadPhotoButton: 'Photo Select & Upload Karein',
      documentUploadTitle: 'Ownership & Authority Proof (Private & Secure)',
      documentUploadNote: 'Ownership ya authorization proof upload karein (PDF, JPEG, PNG up to 10MB). Files SHA-256 hashed rehti hain aur publicly visible nahi hoti.',
      uploadDocumentButton: 'Document Select & Upload Karein',
      docTypeTitleDeed: 'Title Deed',
      docTypeSaleDeed: 'Registered Sale Deed',
      docTypeJamabandi: 'Jamabandi / Fard Extract',
      docTypeTaxReceipt: 'Property Tax Receipt',
      docTypePOA: 'Registered Power of Attorney (POA)',
      docTypeLease: 'Master Lease / Subletting Agreement',
      docTypeOther: 'Other Statutory Ownership Document',
      reviewSummaryTitle: 'Submission Summary & Final Integrity Check',
      mandatoryFieldsNotice: 'Please required fields fill karein aur declaration confirm karke submit karein.',
      wizardPrev: 'Back',
      wizardNext: 'Save & Continue',
      wizardSubmit: 'Verification Ke Liye Submit Karein',
      errorStorageUnconfigured: 'Storage adapter currently offline ya unconfigured hai.',
    },
    auth: {
      modalTitleLogin: 'Griha Saathi Mein Sign In Karein',
      modalTitleRegister: 'Create Verified Account',
      identifierLabel: 'Mobile Number ya Email Address',
      identifierPlaceholder: 'e.g. 9812345678 ya name@example.com',
      requestOtp: 'Verification OTP Bhejein',
      otpLabel: 'Enter 6-digit OTP',
      otpPlaceholder: 'Enter OTP received',
      verifyOtp: 'Verify OTP & Continue',
      pinLabel: 'Apna 4-Digit Security PIN Enter Karein',
      pinPlaceholder: '••••',
      confirmPinLabel: 'Confirm 4-Digit PIN',
      confirmPinPlaceholder: 'Re-enter 4 digits',
      resetPinTitle: 'OTP Se Security PIN Reset Karein',
      resetPinButton: 'PIN Reset & Sign In',
      resendOtp: 'OTP Dobara Bhejein',
      resendIn: 'Resend available hoga:',
      chooseRoleTitle: 'Account Roles Select Karein',
      fullNameLabel: 'Full Name (Optional)',
      fullNamePlaceholder: 'Apna naam enter karein',
      loginWithPin: 'PIN Se Login Karein',
      forgotPin: 'PIN Bhool Gaye? OTP Se Reset Karein',
      providerPendingNotice: 'SMS / Email Gateway Notice: Live carrier OTPs bhejne ke liye .env mein provider keys zaroori hain. Unconfigured state mein system fake OTP pretend nahi karta.',
      securityBadge: 'Rate-limiting & Hashed PIN Storage se secured',
      roleTenant: 'Tenant (Rental Home Ki Talash Mein)',
      roleOwner: 'Property Owner (Listing Host)',
      roleAgent: 'Authorized Real Estate Representative',
      roleBuilder: 'Builder / Property Developer',
      roleManager: 'Property Manager',
    },
  },
};
