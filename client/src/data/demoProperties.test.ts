import assert from 'node:assert/strict';
import {
  DEMO_LISTING_NOTICE,
  DEMO_PROPERTIES,
  DEMO_PROPERTY_TYPES,
  isValidDemoCatalog,
  isValidDemoProperty,
  searchDemoProperties,
} from './demoProperties.js';
import { Property } from '@shared/types';

const regions = ['Jammu & Kashmir', 'Haryana', 'Punjab', 'Delhi', 'Himachal Pradesh'];

assert.equal(DEMO_PROPERTIES.length, 240);
assert.equal(isValidDemoCatalog(DEMO_PROPERTIES), true);

for (const state of regions) {
  const listings = searchDemoProperties({ state });
  assert.ok(listings.length > 0, `${state} should have demo records`);
  for (const type of DEMO_PROPERTY_TYPES) {
    assert.ok(
      listings.some((property) => property.demoPropertyType === type.id),
      `${state} should include ${type.id}`
    );
  }
}

assert.ok(searchDemoProperties({ city: '  uDhAmPuR  ' }).every((property) => property.city === 'Udhampur'));
assert.ok(searchDemoProperties({ locality: 'sarabha nagar' }).every((property) => property.locality.toLowerCase().includes('sarabha nagar')));
for (const type of DEMO_PROPERTY_TYPES) {
  const matches = searchDemoProperties({ demoPropertyType: type.id });
  assert.ok(matches.length > 0, `${type.label} should be searchable`);
  assert.ok(matches.every((property) => property.demoPropertyType === type.id));
}

assert.ok(searchDemoProperties({ minRent: 25_000 }).every((property) => property.rentPerMonth >= 25_000));
assert.ok(searchDemoProperties({ maxRent: 30_000 }).every((property) => property.rentPerMonth <= 30_000));
assert.ok(searchDemoProperties({ minBedrooms: 2 }).every((property) => (property.bedrooms ?? 0) >= 2));
assert.ok(searchDemoProperties({ maxBedrooms: 2 }).every((property) => (property.bedrooms ?? 0) <= 2));
assert.ok(searchDemoProperties({ minBathrooms: 2 }).every((property) => (property.bathrooms ?? 0) >= 2));
assert.ok(searchDemoProperties({ minArea: 1_000 }).every((property) => (property.areaSqFt ?? 0) >= 1_000));
assert.ok(searchDemoProperties({ maxArea: 1_200 }).every((property) => (property.areaSqFt ?? 0) <= 1_200));
for (const furnishing of ['unfurnished', 'semi_furnished', 'fully_furnished']) {
  assert.ok(searchDemoProperties({ furnishing }).every((property) => property.furnishing === furnishing));
}
assert.ok(searchDemoProperties({ amenities: ['Wi-Fi'] }).every((property) => property.amenities.includes('Wi-Fi')));
assert.ok(searchDemoProperties({ petFriendlyOnly: true }).every((property) => property.demoPetFriendly));

const combined = searchDemoProperties({
  state: 'Haryana',
  city: 'Gurugram',
  demoPropertyType: 'apartment_flat',
  minRent: 10_000,
  maxRent: 90_000,
  amenities: ['Kitchen'],
});
assert.ok(combined.length > 0);
assert.ok(combined.every((property) =>
  property.state === 'Haryana' &&
  property.city === 'Gurugram' &&
  property.demoPropertyType === 'apartment_flat' &&
  property.rentPerMonth >= 10_000 &&
  property.rentPerMonth <= 90_000 &&
  property.amenities.includes('Kitchen')
));

const rentAscending = searchDemoProperties({ sortBy: 'rent_asc' });
const rentDescending = searchDemoProperties({ sortBy: 'rent_desc' });
assert.ok(rentAscending.every((property, index) => index === 0 || rentAscending[index - 1].rentPerMonth <= property.rentPerMonth));
assert.ok(rentDescending.every((property, index) => index === 0 || rentDescending[index - 1].rentPerMonth >= property.rentPerMonth));
const areaAscending = searchDemoProperties({ sortBy: 'area_asc' });
const areaDescending = searchDemoProperties({ sortBy: 'area_desc' });
assert.ok(areaAscending.every((property, index) => index === 0 || (areaAscending[index - 1].areaSqFt ?? 0) <= (property.areaSqFt ?? 0)));
assert.ok(areaDescending.every((property, index) => index === 0 || (areaDescending[index - 1].areaSqFt ?? 0) >= (property.areaSqFt ?? 0)));
assert.deepEqual(searchDemoProperties({ sortBy: 'relevance' }), searchDemoProperties({ sortBy: 'relevance' }));

assert.equal(searchDemoProperties({ city: 'No Such City' }).length, 0);
assert.equal(searchDemoProperties().length, DEMO_PROPERTIES.length, 'Clearing all filters should restore the full catalog');

const firstPage = searchDemoProperties().slice(0, 12);
const secondPage = searchDemoProperties().slice(12, 24);
assert.equal(firstPage.length, 12);
assert.equal(secondPage.length, 12);
assert.equal(new Set([...firstPage, ...secondPage].map((property) => property.id)).size, 24);
assert.equal(searchDemoProperties().length, 240, 'Result count is independent of page slicing');

const optionalFieldsMissing = {
  ...DEMO_PROPERTIES[0],
  bathrooms: undefined,
  areaSqFt: undefined,
  amenities: [],
} satisfies Property;
assert.equal(isValidDemoProperty(optionalFieldsMissing), true);
assert.doesNotThrow(() => searchDemoProperties({ amenities: ['not present'] }));
assert.equal(isValidDemoProperty({ ...DEMO_PROPERTIES[0], id: 'real-listing-1' }), false);
assert.equal(isValidDemoProperty({ ...DEMO_PROPERTIES[0], verificationStatus: 'authoritative_verified' }), false);
assert.equal(isValidDemoProperty({ ...DEMO_PROPERTIES[0], title: 'A real rental' }), false);

assert.ok(DEMO_PROPERTIES.every((property) =>
  property.isDemo === true &&
  property.verificationStatus === 'unverified' &&
  property.title.startsWith('DEMO LISTING — NOT A REAL PROPERTY:') &&
  property.demoOwnerLabel?.startsWith('Demo Owner ') &&
  !property.ownerMaskedContact &&
  !property.availabilityConfirmedAt
));
assert.match(DEMO_LISTING_NOTICE, /fictional demonstration listing/i);
assert.match(DEMO_LISTING_NOTICE, /not a real property/i);
assert.match(DEMO_LISTING_NOTICE, /not available for rent/i);

console.log(`Demo property search tests passed (${DEMO_PROPERTIES.length} synthetic records, ${regions.length} regions).`);
