const REQUIRED_VERIFICATION_STAGES = ['land_registry', 'owner_identity', 'physical_inspection'];
export function hasAuthoritativeVerificationEvidence(property) {
    const stages = new Set(property.verificationRecord?.stages
        .filter((stage) => stage.status === 'verified')
        .map((stage) => stage.stage) ?? []);
    return property.verificationStatus === 'authoritative_verified' &&
        property.verificationRecord?.status === 'authoritative_verified' &&
        REQUIRED_VERIFICATION_STAGES.every((stage) => stages.has(stage));
}
export function isPubliclyDiscoverable(property) {
    if (property.submissionStatus !== 'approved' ||
        !property.id?.trim() ||
        !property.title?.trim() ||
        !property.state?.trim() ||
        !property.city?.trim() ||
        !property.locality?.trim() ||
        !Number.isFinite(property.rentPerMonth) ||
        property.rentPerMonth < 0 ||
        (property.dataSource !== 'owner_submission' && property.dataSource !== 'licensed_agent')) {
        return false;
    }
    const recordText = [
        property.title,
        property.description,
    ].join(' ');
    const hasPlaceholderImage = (property.photos ?? []).some((photo) => /(?:^|[\\/._-])(sample|placeholder|dummy|test|synthetic)(?:$|[\\/._-])/i.test(photo));
    if (/\b(lorem ipsum|dummy|placeholder|sample listing|test fixture|synthetic)\b/i.test(recordText) ||
        hasPlaceholderImage) {
        return false;
    }
    return property.verificationStatus !== 'authoritative_verified' ||
        hasAuthoritativeVerificationEvidence(property);
}
