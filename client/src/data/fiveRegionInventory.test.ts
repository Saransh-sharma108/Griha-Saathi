import assert from 'node:assert/strict';
import { 
  FIVE_REGIONS, 
  FIVE_REGION_INVENTORY, 
  RENTAL_BUDGET_BANDS, 
  PROPERTY_CATEGORIES,
  searchFiveRegionInventory 
} from './fiveRegionInventory.js';

console.log('Running Griha Saathi Five-Region Inventory & Search Engine Verification...');

// 1. Basic Inventory Size & Integrity
assert.equal(FIVE_REGIONS.length, 5, 'Must contain all 5 target Northern Indian regions');
assert.ok(FIVE_REGION_INVENTORY.length >= 350, `Expected at least 350 listings, found ${FIVE_REGION_INVENTORY.length}`);
console.log(`✓ Total Verified Inventory Size: ${FIVE_REGION_INVENTORY.length} listings across 5 regions`);

// 2. Region-by-Region Coverage Checks
const expectedRegions = [
  'Jammu & Kashmir',
  'Haryana',
  'Punjab',
  'Delhi',
  'Himachal Pradesh'
];

for (const stateName of expectedRegions) {
  const result = searchFiveRegionInventory({ state: stateName, limit: 1000 });
  assert.ok(result.total > 0, `Region ${stateName} must have listings`);
  console.log(`  ✓ Region "${stateName}": ${result.total} listings`);
}

// 3. Exact Required City Checks from Master Specification
const requiredJKCities = [
  'Jammu', 'Srinagar', 'Udhampur', 'Kathua', 'Samba', 'Anantnag', 'Baramulla',
  'Budgam', 'Pulwama', 'Ganderbal', 'Reasi', 'Rajouri', 'Poonch', 'Doda', 'Kishtwar'
];
assert.equal(requiredJKCities.length, 15, '15 J&K cities specified');
for (const city of requiredJKCities) {
  const res = searchFiveRegionInventory({ state: 'Jammu & Kashmir', city });
  assert.ok(res.total > 0, `J&K City "${city}" must have listings`);
}
console.log('✓ All 15 Jammu & Kashmir cities verified with matching listings');

const requiredHaryanaCities = [
  'Gurugram', 'Faridabad', 'Panchkula', 'Ambala', 'Karnal', 'Panipat', 'Sonipat',
  'Rohtak', 'Hisar', 'Kurukshetra', 'Yamunanagar', 'Manesar', 'Bahadurgarh', 'Rewari'
];
assert.equal(requiredHaryanaCities.length, 14, '14 Haryana cities specified');
for (const city of requiredHaryanaCities) {
  const res = searchFiveRegionInventory({ state: 'Haryana', city });
  assert.ok(res.total > 0, `Haryana City "${city}" must have listings`);
}
console.log('✓ All 14 Haryana cities verified with matching listings');

const requiredPunjabCities = [
  'Chandigarh region', 'Mohali', 'Zirakpur', 'Panchkula region', 'Ludhiana', 'Amritsar',
  'Jalandhar', 'Patiala', 'Bathinda', 'Pathankot', 'Hoshiarpur', 'Moga', 'Kapurthala', 'Khanna'
];
assert.equal(requiredPunjabCities.length, 14, '14 Punjab cities specified');
for (const city of requiredPunjabCities) {
  const res = searchFiveRegionInventory({ state: 'Punjab', city });
  assert.ok(res.total > 0, `Punjab City "${city}" must have listings`);
}
console.log('✓ All 14 Punjab cities verified with matching listings');

const requiredDelhiCities = [
  'New Delhi', 'Central Delhi', 'South Delhi', 'North Delhi', 'East Delhi', 'West Delhi',
  'Dwarka', 'Rohini', 'Janakpuri', 'Vasant Kunj', 'Greater Kailash', 'Noida',
  'Greater Noida', 'Ghaziabad', 'Gurugram', 'Faridabad'
];
assert.equal(requiredDelhiCities.length, 16, '16 Delhi NCR cities specified');
for (const city of requiredDelhiCities) {
  const res = searchFiveRegionInventory({ state: 'Delhi', city });
  assert.ok(res.total > 0, `Delhi NCR City/District "${city}" must have listings`);
}
console.log('✓ All 16 Delhi NCR cities/districts verified with matching listings');

const requiredHPCities = [
  'Shimla', 'Solan', 'Dharamshala', 'Mandi', 'Kullu', 'Manali', 'Hamirpur',
  'Una', 'Bilaspur', 'Kangra', 'Palampur', 'Chamba', 'Kasauli', 'Baddi'
];
assert.equal(requiredHPCities.length, 14, '14 Himachal Pradesh cities specified');
for (const city of requiredHPCities) {
  const res = searchFiveRegionInventory({ state: 'Himachal Pradesh', city });
  assert.ok(res.total > 0, `HP City "${city}" must have listings`);
}
console.log('✓ All 14 Himachal Pradesh cities verified with matching listings');

// 4. Property Category Representation Checks
for (const category of PROPERTY_CATEGORIES) {
  const res = searchFiveRegionInventory({ propertyCategory: category.id, limit: 1000 });
  assert.ok(res.total > 0, `Category "${category.label}" must have inventory`);
  console.log(`  ✓ Category "${category.label}": ${res.total} listings`);
}

// 5. Rental Budget Bands Representation Checks
for (const band of RENTAL_BUDGET_BANDS) {
  const res = searchFiveRegionInventory({
    listingIntent: 'rent',
    minRent: band.min,
    maxRent: band.max,
    limit: 1000
  });
  assert.ok(res.total > 0, `Budget band "${band.label}" (${band.descriptor}) must have matching rentals`);
  console.log(`  ✓ Rental Budget "${band.label}" (${band.descriptor}): ${res.total} listings`);
}

// 6. Separate Purchase Price for Sale Properties
const saleProperties = searchFiveRegionInventory({ listingIntent: 'sale', limit: 1000 });
assert.ok(saleProperties.total > 0, 'Must contain properties for sale');
assert.ok(
  saleProperties.properties.every((p) => p.listingIntent === 'sale' && p.salePrice !== undefined && p.salePrice > 0),
  'Every sale property must have a valid salePrice'
);
console.log(`✓ Separate Purchase Price System: ${saleProperties.total} sale/plot properties verified`);

// 7. Multi-Criteria Combined Filter
const complexFilter = searchFiveRegionInventory({
  state: 'Jammu & Kashmir',
  city: 'Jammu',
  propertyCategory: 'residential',
  listingIntent: 'rent',
  furnishing: 'semi_furnished',
  bedrooms: 2
});
assert.ok(complexFilter.total > 0, 'Combined filter in Jammu must return matching 2BHK rental');
assert.ok(
  complexFilter.properties.every((p) => 
    p.state === 'Jammu & Kashmir' && 
    p.city === 'Jammu' && 
    p.propertyCategory === 'residential' && 
    p.listingIntent === 'rent' && 
    p.furnishing === 'semi_furnished' && 
    p.bedrooms === 2
  ),
  'Combined filter result must strictly satisfy all conditions'
);
console.log('✓ Combined Multi-Filter Integrity Verified');

// 8. Sorting Tests
const sortedRentAsc = searchFiveRegionInventory({ listingIntent: 'rent', sortBy: 'rent_asc', limit: 50 }).properties;
assert.ok(
  sortedRentAsc.every((p, idx) => idx === 0 || sortedRentAsc[idx - 1].rentPerMonth <= p.rentPerMonth),
  'rent_asc sort must be monotonically increasing'
);

const sortedRentDesc = searchFiveRegionInventory({ listingIntent: 'rent', sortBy: 'rent_desc', limit: 50 }).properties;
assert.ok(
  sortedRentDesc.every((p, idx) => idx === 0 || sortedRentDesc[idx - 1].rentPerMonth >= p.rentPerMonth),
  'rent_desc sort must be monotonically decreasing'
);
console.log('✓ Ascending and Descending Sorting Verified');

// 9. Zero-Result Handling
const nonExistent = searchFiveRegionInventory({ city: 'NonExistentCityXYZ123' });
assert.equal(nonExistent.total, 0, 'Non-existent location must return 0 results cleanly');
assert.equal(nonExistent.properties.length, 0);
console.log('✓ Empty Result Handling Verified');

// 10. Property-Specific Unique Image System & Verification
import fs from 'node:fs';
import path from 'node:path';

const allPhotos = FIVE_REGION_INVENTORY.flatMap((p) => p.photos || []);
assert.ok(allPhotos.length >= FIVE_REGION_INVENTORY.length, 'Every listing must have photos assigned');

const uniquePhotoUrls = new Set(allPhotos);
assert.ok(uniquePhotoUrls.size >= 45, `Expected at least 45 unique photos across the catalog, found ${uniquePhotoUrls.size}`);
console.log(`✓ Image Diversity: ${uniquePhotoUrls.size} unique architectural photographs across categories`);

// Verify that every referenced image exists on disk in public
for (const photoUrl of uniquePhotoUrls) {
  const relativePath = photoUrl.replace(/^\//, '');
  const publicPath = path.resolve('public', relativePath);
  const clientPublicPath = path.resolve('client/public', relativePath);
  assert.ok(
    fs.existsSync(publicPath) || fs.existsSync(clientPublicPath),
    `Referenced image file must exist on disk: ${photoUrl}`
  );
}
console.log('✓ Zero Broken Images: All referenced photo files verified on disk');

// Verify Category-Specific Matching Rules
const studioListings = FIVE_REGION_INVENTORY.filter((p) => p.propertySubtype === '1rk' || p.propertySubtype === 'studio');
assert.ok(
  studioListings.every((p) => p.photos.some((url) => url.includes('/property-images/studio/'))),
  'Studio and 1RK properties must have studio-specific photos'
);

const officeListings = FIVE_REGION_INVENTORY.filter((p) => p.propertySubtype === 'office_space' || p.propertySubtype === 'coworking_space');
assert.ok(
  officeListings.every((p) => p.photos.some((url) => url.includes('/property-images/offices/'))),
  'Office spaces must have office-specific photos'
);

const warehouseListings = FIVE_REGION_INVENTORY.filter((p) => p.propertySubtype === 'warehouse' || p.propertySubtype === 'industrial_space');
assert.ok(
  warehouseListings.every((p) => p.photos.some((url) => url.includes('/property-images/warehouses/'))),
  'Warehouses must have warehouse-specific photos'
);

const plotListings = FIVE_REGION_INVENTORY.filter((p) => p.propertySubtype === 'residential_plot');
assert.ok(
  plotListings.every((p) => p.photos.some((url) => url.includes('/property-images/residential-plots/'))),
  'Residential plots must have land/plot-specific photos'
);

const shopListings = FIVE_REGION_INVENTORY.filter((p) => p.propertySubtype === 'shop' || p.propertySubtype === 'showroom');
assert.ok(
  shopListings.every((p) => p.photos.some((url) => url.includes('/property-images/commercial-shops/'))),
  'Commercial shops must have retail shop-specific photos'
);

console.log('✓ Category Match Guarantee: Studio, Office, Warehouse, Plot, and Shop images strictly match their type');

console.log('\n================================================================');
console.log('ALL FIVE-REGION INVENTORY & SEARCH ENGINE TESTS PASSED (100%)');
console.log('================================================================\n');

