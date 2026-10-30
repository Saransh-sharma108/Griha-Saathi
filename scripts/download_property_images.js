import fs from 'node:fs';
import path from 'node:path';

const IMAGE_DEFINITIONS = [
  // Apartments (5)
  { category: 'apartments', filename: 'apartment-01.jpg', photoId: 'photo-1545324418-cc1a3fa10c00' },
  { category: 'apartments', filename: 'apartment-02.jpg', photoId: 'photo-1502672260266-1c1ef2d93688' },
  { category: 'apartments', filename: 'apartment-03.jpg', photoId: 'photo-1560448204-e02f11c3d0e2' },
  { category: 'apartments', filename: 'apartment-04.jpg', photoId: 'photo-1493809842364-78817add7ffb' },
  { category: 'apartments', filename: 'apartment-05.jpg', photoId: 'photo-1522708323590-d24dbb6b0267' },

  // Studio (4)
  { category: 'studio', filename: 'studio-01.jpg', photoId: 'photo-1536376072261-38c75010e6c9' },
  { category: 'studio', filename: 'studio-02.jpg', photoId: 'photo-1512918728675-ed5a9ecdebfd' },
  { category: 'studio', filename: 'studio-03.jpg', photoId: 'photo-1554995207-c18c203602cb' },
  { category: 'studio', filename: 'studio-04.jpg', photoId: 'photo-1505691938895-1758d7feb511' },

  // Family Homes (5)
  { category: 'family-homes', filename: 'family-01.jpg', photoId: 'photo-1600585154340-be6161a56a0c' },
  { category: 'family-homes', filename: 'family-02.jpg', photoId: 'photo-1600596542815-ffad4c1539a9' },
  { category: 'family-homes', filename: 'family-03.jpg', photoId: 'photo-1600565193348-f74bd3c7ccdf' },
  { category: 'family-homes', filename: 'family-04.jpg', photoId: 'photo-1600607687939-ce8a6c25118c' },
  { category: 'family-homes', filename: 'family-05.jpg', photoId: 'photo-1600573472550-8090b5e0745e' },

  // Luxury Villas (5)
  { category: 'luxury-villas', filename: 'villa-01.jpg', photoId: 'photo-1613977257363-707ba9348227' },
  { category: 'luxury-villas', filename: 'villa-02.jpg', photoId: 'photo-1580587771525-78b9dba3b914' },
  { category: 'luxury-villas', filename: 'villa-03.jpg', photoId: 'photo-1600585154526-990dced4db0d' },
  { category: 'luxury-villas', filename: 'villa-04.jpg', photoId: 'photo-1512917774080-9991f1c4c750' },
  { category: 'luxury-villas', filename: 'villa-05.jpg', photoId: 'photo-1600596542815-ffad4c1539a9' },

  // Penthouses (4)
  { category: 'penthouses', filename: 'penthouse-01.jpg', photoId: 'photo-1567496898669-ee935f5f647a' },
  { category: 'penthouses', filename: 'penthouse-02.jpg', photoId: 'photo-1600607687920-4e2a09cf159d' },
  { category: 'penthouses', filename: 'penthouse-03.jpg', photoId: 'photo-1513694203232-719a280e022f' },
  { category: 'penthouses', filename: 'penthouse-04.jpg', photoId: 'photo-1502672260266-1c1ef2d93688' },

  // Independent Houses (4)
  { category: 'independent-houses', filename: 'house-01.jpg', photoId: 'photo-1568605117036-5fe5e7bab0b7' },
  { category: 'independent-houses', filename: 'house-02.jpg', photoId: 'photo-1570129477492-45c003edd2be' },
  { category: 'independent-houses', filename: 'house-03.jpg', photoId: 'photo-1598228723793-52759bba239c' },
  { category: 'independent-houses', filename: 'house-04.jpg', photoId: 'photo-1600585152220-90363fe7e115' },

  // PG & Hostels (4)
  { category: 'pg-hostels', filename: 'pghostel-01.jpg', photoId: 'photo-1555854877-bab0e564b8d5' },
  { category: 'pg-hostels', filename: 'pghostel-02.jpg', photoId: 'photo-1595526114035-0d45ed16cfbf' },
  { category: 'pg-hostels', filename: 'pghostel-03.jpg', photoId: 'photo-1616486338812-3dadae4b4ace' },
  { category: 'pg-hostels', filename: 'pghostel-04.jpg', photoId: 'photo-1522771739844-6a9f6d5f14af' },

  // Commercial Shops (4)
  { category: 'commercial-shops', filename: 'shop-01.jpg', photoId: 'photo-1528698827591-e19ccd7bc23d' },
  { category: 'commercial-shops', filename: 'shop-02.jpg', photoId: 'photo-1555396273-367ea4eb4db5' },
  { category: 'commercial-shops', filename: 'shop-03.jpg', photoId: 'photo-1555529771-835f59fc5efe' },
  { category: 'commercial-shops', filename: 'shop-04.jpg', photoId: 'photo-1441986300917-64674bd600d8' },

  // Offices (4)
  { category: 'offices', filename: 'office-01.jpg', photoId: 'photo-1497366216548-37526070297c' },
  { category: 'offices', filename: 'office-02.jpg', photoId: 'photo-1497215728101-856f4ea42174' },
  { category: 'offices', filename: 'office-03.jpg', photoId: 'photo-1504384308090-c894fdcc538d' },
  { category: 'offices', filename: 'office-04.jpg', photoId: 'photo-1497366811353-6870744d04b2' },

  // Warehouses (4)
  { category: 'warehouses', filename: 'warehouse-01.jpg', photoId: 'photo-1586528116311-ad8dd3c8310d' },
  { category: 'warehouses', filename: 'warehouse-02.jpg', photoId: 'photo-1587293852726-70cdb56c2866' },
  { category: 'warehouses', filename: 'warehouse-03.jpg', photoId: 'photo-1553413077-190dd305871c' },
  { category: 'warehouses', filename: 'warehouse-04.jpg', photoId: 'photo-1578575437130-527eed3abbec' },

  // Farmhouses (4)
  { category: 'farmhouses', filename: 'farmhouse-01.jpg', photoId: 'photo-1500076656116-558758c991c1' },
  { category: 'farmhouses', filename: 'farmhouse-02.jpg', photoId: 'photo-1518780664697-55e3ad937233' },
  { category: 'farmhouses', filename: 'farmhouse-03.jpg', photoId: 'photo-1542601906990-b4d3fb778b09' },
  { category: 'farmhouses', filename: 'farmhouse-04.jpg', photoId: 'photo-1470246973918-29a93221c455' },

  // Residential Plots (4)
  { category: 'residential-plots', filename: 'plot-res-01.jpg', photoId: 'photo-1500382017468-9049fed747ef' },
  { category: 'residential-plots', filename: 'plot-res-02.jpg', photoId: 'photo-1506744038136-46273834b3fb' },
  { category: 'residential-plots', filename: 'plot-res-03.jpg', photoId: 'photo-1500534623283-312aade485b7' },
  { category: 'residential-plots', filename: 'plot-res-04.jpg', photoId: 'photo-1473448912268-2022ce9509d8' },

  // Commercial Plots (3)
  { category: 'commercial-plots', filename: 'plot-com-01.jpg', photoId: 'photo-1486406146926-c627a92ad1ab' },
  { category: 'commercial-plots', filename: 'plot-com-02.jpg', photoId: 'photo-1448630360428-65456885c650' },
  { category: 'commercial-plots', filename: 'plot-com-03.jpg', photoId: 'photo-1497366754035-f200968a6e72' },

  // Holiday Homes (4)
  { category: 'holiday-homes', filename: 'holiday-01.jpg', photoId: 'photo-1510798831971-661eb04b3739' },
  { category: 'holiday-homes', filename: 'holiday-02.jpg', photoId: 'photo-1542314831-068cd1dbfeeb' },
  { category: 'holiday-homes', filename: 'holiday-03.jpg', photoId: 'photo-1520250497591-112f2f40a3f4' },
  { category: 'holiday-homes', filename: 'holiday-04.jpg', photoId: 'photo-1470770841072-f978cf4d019e' },

  // Guest Houses (4)
  { category: 'guest-houses', filename: 'guest-01.jpg', photoId: 'photo-1566073771259-6a8506099945' },
  { category: 'guest-houses', filename: 'guest-02.jpg', photoId: 'photo-1582719478250-c89cae4dc85b' },
  { category: 'guest-houses', filename: 'guest-03.jpg', photoId: 'photo-1590490360182-c33d57733427' },
  { category: 'guest-houses', filename: 'guest-04.jpg', photoId: 'photo-1578683010236-d716f9a3f461' },
];

const publicBase = path.resolve('client/public/property-images');
const assetsBase = path.resolve('client/src/assets/property-images');

async function downloadImage(photoId, targetPath) {
  const url = `https://images.unsplash.com/${photoId}?w=800&auto=format&fit=crop&q=80`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(targetPath, buffer);
}

async function main() {
  console.log(`Starting download of ${IMAGE_DEFINITIONS.length} category-specific real estate images...`);
  let successCount = 0;

  for (const item of IMAGE_DEFINITIONS) {
    const pubDir = path.join(publicBase, item.category);
    const astDir = path.join(assetsBase, item.category);

    fs.mkdirSync(pubDir, { recursive: true });
    fs.mkdirSync(astDir, { recursive: true });

    const pubFile = path.join(pubDir, item.filename);
    const astFile = path.join(astDir, item.filename);

    if (fs.existsSync(pubFile) && fs.statSync(pubFile).size > 1000) {
      // Already downloaded
      if (!fs.existsSync(astFile)) {
        fs.copyFileSync(pubFile, astFile);
      }
      successCount++;
      continue;
    }

    try {
      await downloadImage(item.photoId, pubFile);
      fs.copyFileSync(pubFile, astFile);
      successCount++;
      process.stdout.write(`✓ [${item.category}] ${item.filename}\n`);
    } catch (err) {
      console.error(`✗ Error on ${item.filename}:`, err.message);
    }
  }

  console.log(`\nDownload completed: ${successCount} / ${IMAGE_DEFINITIONS.length} images saved.`);
}

main().catch(console.error);
