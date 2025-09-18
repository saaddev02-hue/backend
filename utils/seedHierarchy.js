const database = require('../config/database');

const seedHierarchyLevels = async () => {
  try {
    // Clear existing hierarchy levels
    await database.query('TRUNCATE TABLE hierarchy_level RESTART IDENTITY CASCADE');

    // Create hierarchy levels
    const levels = [
      { level_order: 1, name: 'Region' },
      { level_order: 2, name: 'Area' },
     // { level_order: 3, name: 'Field' },
      { level_order: 4, name: 'Well' },
      { level_order: 5, name: 'Device' }
    ];

    for (const levelData of levels) {
      await database.query(`
        INSERT INTO hierarchy_level (level_order, name) 
        VALUES ($1, $2)
      `, [levelData.level_order, levelData.name]);
    }

    console.log('✅ Hierarchy levels seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding hierarchy levels:', error);
    throw error;
  }
};

const seedDeviceTypes = async () => {
  try {
    // Clear existing device types
    await database.query('TRUNCATE TABLE device_type RESTART IDENTITY CASCADE');

    // Create device types
    const deviceTypes = [
      { type_name: 'MPFM', logo: 'mpfm-sensor.png' },
      { type_name: 'Pressure Sensor', logo: 'pressure-sensor.png' },
      { type_name: 'Temperature Sensor', logo: 'temperature-sensor.png' },
      { type_name: 'Flow Meter', logo: 'flow-meter.png' },
      { type_name: 'Vibration Sensor', logo: 'vibration-sensor.png' }
    ];

    for (const deviceType of deviceTypes) {
      await database.query(`
        INSERT INTO device_type (type_name, logo) 
        VALUES ($1, $2)
      `, [deviceType.type_name, deviceType.logo]);
    }

    console.log('✅ Device types seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding device types:', error);
    throw error;
  }
};

const seedHierarchyData = async () => {
  try {
    // Clear existing hierarchy data
    await database.query('TRUNCATE TABLE hierarchy RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE device RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE hierarchy_device RESTART IDENTITY CASCADE');

    // Get companies, levels, and device types
    const companiesResult = await database.query('SELECT * FROM company ORDER BY id');
    const levelsResult = await database.query('SELECT * FROM hierarchy_level ORDER BY level_order');
    const deviceTypesResult = await database.query('SELECT * FROM device_type ORDER BY id');
    
    const companies = companiesResult.rows;
    const levels = levelsResult.rows;
    const deviceTypes = deviceTypesResult.rows;

    if (companies.length === 0 || levels.length === 0 || deviceTypes.length === 0) {
      console.log('Companies, hierarchy levels, or device types not found. Skipping hierarchy seed.');
      return;
    }

    // Find levels
    const regionLevel = levels.find(l => l.name === 'Region');
    const areaLevel = levels.find(l => l.name === 'Area');
    const wellLevel = levels.find(l => l.name === 'Well');
    const deviceLevel = levels.find(l => l.name === 'Device');

    if (!regionLevel || !areaLevel || !wellLevel || !deviceLevel) {
      console.log('Required hierarchy levels not found. Skipping hierarchy seed.');
      return;
    }

    // Get device type IDs
    const mpfmType = deviceTypes.find(dt => dt.type_name === 'MPFM');
    const pressureType = deviceTypes.find(dt => dt.type_name === 'Pressure Sensor');
    const temperatureType = deviceTypes.find(dt => dt.type_name === 'Temperature Sensor');
    const flowMeterType = deviceTypes.find(dt => dt.type_name === 'Flow Meter');
    const vibrationType = deviceTypes.find(dt => dt.type_name === 'Vibration Sensor');

    // Comprehensive hierarchy data for each company
    const hierarchyData = {
      'Saudi saherflow': {
        regions: [
          {
            name: 'USA',
            areas: [
              {
                name: 'New Jersey',
                wells: [
                  {
                    name: 'Well NJ-001',
                    devices: [
                      { name: 'MPFM SM-300', serial: 'SM-300-NJ001', type: mpfmType },
                      { name: 'Pressure Sensor PS-101', serial: 'PS-101-NJ001', type: pressureType }
                    ]
                  },
                  {
                    name: 'Well NJ-002',
                    devices: [
                      { name: 'Flow Meter FM-200', serial: 'FM-200-NJ002', type: flowMeterType },
                      { name: 'Temperature Sensor TS-150', serial: 'TS-150-NJ002', type: temperatureType }
                    ]
                  }
                ]
              },
              {
                name: 'Chicago',
                wells: [
                  {
                    name: 'Well TGC-001',
                    devices: [
                      { name: 'MPFM SM-301', serial: 'SM-301-TGC001', type: mpfmType },
                      { name: 'Vibration Sensor VS-100', serial: 'VS-100-TGC001', type: vibrationType }
                    ]
                  },
                  {
                    name: 'Well TGC-002',
                    devices: [
                      { name: 'MPFM SM-300', serial: 'SM-300-TGC002', type: mpfmType },
                      { name: 'Pressure Sensor PS-102', serial: 'PS-102-TGC002', type: pressureType },
                      { name: 'Temperature Sensor TS-151', serial: 'TS-151-TGC002', type: temperatureType }
                    ]
                  },
                  {
                    name: 'Well TGC-003',
                    devices: [
                      { name: 'Flow Meter FM-201', serial: 'FM-201-TGC003', type: flowMeterType }
                    ]
                  }
                ]
              }
            ]
          },
          {
            name: 'Saudi Arabia',
            areas: [
              {
                name: 'Al Majmah',
                wells: [
                  {
                    name: 'Well AM-001',
                    devices: [
                      { name: 'MPFM SM-400', serial: 'SM-400-AM001', type: mpfmType },
                      { name: 'Pressure Sensor PS-200', serial: 'PS-200-AM001', type: pressureType }
                    ]
                  },
                  {
                    name: 'Well AM-002',
                    devices: [
                      { name: 'Temperature Sensor TS-200', serial: 'TS-200-AM002', type: temperatureType },
                      { name: 'Vibration Sensor VS-200', serial: 'VS-200-AM002', type: vibrationType }
                    ]
                  }
                ]
              },
              {
                name: 'Riyadh',
                wells: [
                  {
                    name: 'Well RY-001',
                    devices: [
                      { name: 'MPFM SM-500', serial: 'SM-500-RY001', type: mpfmType },
                      { name: 'Flow Meter FM-300', serial: 'FM-300-RY001', type: flowMeterType }
                    ]
                  },
                  {
                    name: 'Well RY-002',
                    devices: [
                      { name: 'Pressure Sensor PS-300', serial: 'PS-300-RY002', type: pressureType }
                    ]
                  }
                ]
              },
              {
                name: 'Dammam',
                wells: [
                  {
                    name: 'Well DM-001',
                    devices: [
                      { name: 'MPFM SM-600', serial: 'SM-600-DM001', type: mpfmType },
                      { name: 'Temperature Sensor TS-300', serial: 'TS-300-DM001', type: temperatureType },
                      { name: 'Vibration Sensor VS-300', serial: 'VS-300-DM001', type: vibrationType }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      'Abu Dhabi National Oil Company': {
        regions: [
          {
            name: 'UAE',
            areas: [
              {
                name: 'Abu Dhabi',
                wells: [
                  {
                    name: 'Well AD-001',
                    devices: [
                      { name: 'MPFM SM-700', serial: 'SM-700-AD001', type: mpfmType },
                      { name: 'Pressure Sensor PS-400', serial: 'PS-400-AD001', type: pressureType }
                    ]
                  },
                  {
                    name: 'Well AD-002',
                    devices: [
                      { name: 'Flow Meter FM-400', serial: 'FM-400-AD002', type: flowMeterType },
                      { name: 'Temperature Sensor TS-400', serial: 'TS-400-AD002', type: temperatureType }
                    ]
                  }
                ]
              },
              {
                name: 'Dubai',
                wells: [
                  {
                    name: 'Well DB-001',
                    devices: [
                      { name: 'MPFM SM-800', serial: 'SM-800-DB001', type: mpfmType },
                      { name: 'Vibration Sensor VS-400', serial: 'VS-400-DB001', type: vibrationType }
                    ]
                  }
                ]
              }
            ]
          },
          {
            name: 'International',
            areas: [
              {
                name: 'Norway',
                wells: [
                  {
                    name: 'Well NO-001',
                    devices: [
                      { name: 'MPFM SM-900', serial: 'SM-900-NO001', type: mpfmType },
                      { name: 'Pressure Sensor PS-500', serial: 'PS-500-NO001', type: pressureType },
                      { name: 'Temperature Sensor TS-500', serial: 'TS-500-NO001', type: temperatureType }
                    ]
                  }
                ]
              },
              {
                name: 'UK',
                wells: [
                  {
                    name: 'Well UK-001',
                    devices: [
                      { name: 'Flow Meter FM-500', serial: 'FM-500-UK001', type: flowMeterType }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      'Saher Flow Solutions': {
        regions: [
          {
            name: 'Middle East',
            areas: [
              {
                name: 'Qatar',
                wells: [
                  {
                    name: 'Test Well QA-001',
                    devices: [
                      { name: 'MPFM SM-TEST-001', serial: 'SM-TEST-001-QA', type: mpfmType },
                      { name: 'Pressure Sensor PS-TEST-001', serial: 'PS-TEST-001-QA', type: pressureType }
                    ]
                  }
                ]
              },
              {
                name: 'Kuwait',
                wells: [
                  {
                    name: 'Demo Well KW-001',
                    devices: [
                      { name: 'Flow Meter FM-DEMO-001', serial: 'FM-DEMO-001-KW', type: flowMeterType },
                      { name: 'Temperature Sensor TS-DEMO-001', serial: 'TS-DEMO-001-KW', type: temperatureType }
                    ]
                  }
                ]
              }
            ]
          },
          {
            name: 'Development',
            areas: [
              {
                name: 'Lab Environment',
                wells: [
                  {
                    name: 'Lab Well LAB-001',
                    devices: [
                      { name: 'MPFM SM-LAB-001', serial: 'SM-LAB-001', type: mpfmType },
                      { name: 'Vibration Sensor VS-LAB-001', serial: 'VS-LAB-001', type: vibrationType }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      }
    };

    // Create hierarchy for each company
    for (const company of companies) {
      const template = hierarchyData[company.name];
      if (!template) continue;

      console.log(`Creating hierarchy for ${company.name}...`);

      for (const regionData of template.regions) {
        // Create region
        const regionResult = await database.query(`
          INSERT INTO hierarchy (company_id, name, level_id, can_attach_device)
          VALUES ($1, $2, $3, $4)
          RETURNING id
        `, [company.id, regionData.name, regionLevel.id, false]);
        const regionId = regionResult.rows[0].id;

        for (const areaData of regionData.areas) {
          // Create area
          const areaResult = await database.query(`
            INSERT INTO hierarchy (company_id, name, level_id, parent_id, can_attach_device)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
          `, [company.id, areaData.name, areaLevel.id, regionId, false]);
          const areaId = areaResult.rows[0].id;

          // Create wells for this area
          for (const wellData of areaData.wells) {
            const wellResult = await database.query(`
              INSERT INTO hierarchy (company_id, name, level_id, parent_id, can_attach_device)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id
            `, [company.id, wellData.name, wellLevel.id, areaId, true]);
            const wellId = wellResult.rows[0].id;

            // Create devices for this well
            for (const deviceData of wellData.devices) {
              // Create device record
              const deviceResult = await database.query(`
                INSERT INTO device (company_id, device_type_id, serial_number, metadata)
                VALUES ($1, $2, $3, $4)
                RETURNING id
              `, [company.id, deviceData.type.id, deviceData.serial, JSON.stringify({ 
                model: deviceData.type.type_name,
                location: `${regionData.name}/${areaData.name}/${wellData.name}`,
                status: 'active'
              })]);
              const deviceId = deviceResult.rows[0].id;

              // Create device hierarchy node
              const deviceHierarchyResult = await database.query(`
                INSERT INTO hierarchy (company_id, name, level_id, parent_id, can_attach_device)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
              `, [company.id, deviceData.name, deviceLevel.id, wellId, true]);
              const deviceHierarchyId = deviceHierarchyResult.rows[0].id;

              // Link device to hierarchy
              await database.query(`
                INSERT INTO hierarchy_device (hierarchy_id, device_id)
                VALUES ($1, $2)
              `, [deviceHierarchyId, deviceId]);
            }
          }
        }
      }
    }

    console.log('✅ Hierarchy data seeded successfully');
    
    // Log the hierarchy structure
    const hierarchyResult = await database.query(`
      SELECT 
        c.name as company_name,
        h.name as hierarchy_name,
        hl.name as level_name,
        h.parent_id,
        h.id,
        COUNT(d.id) as device_count
      FROM hierarchy h
      JOIN company c ON h.company_id = c.id
      JOIN hierarchy_level hl ON h.level_id = hl.id
      LEFT JOIN hierarchy_device hd ON h.id = hd.hierarchy_id
      LEFT JOIN device d ON hd.device_id = d.id
      GROUP BY c.name, h.name, hl.name, h.parent_id, h.id, hl.level_order
      ORDER BY c.name, hl.level_order, h.name
    `);

    console.log('\n📋 Seeded Multi-Tenant Hierarchy Structure:');
    let currentCompany = '';
    let currentRegion = '';
    let currentArea = '';
    
    hierarchyResult.rows.forEach(row => {
      if (row.company_name !== currentCompany) {
        currentCompany = row.company_name;
        console.log(`\n🏢 ${currentCompany}:`);
        currentRegion = '';
        currentArea = '';
      }
      
      if (row.level_name === 'Region') {
        currentRegion = row.hierarchy_name;
        console.log(`  🌍 ${row.hierarchy_name}`);
      } else if (row.level_name === 'Area') {
        currentArea = row.hierarchy_name;
        console.log(`    📍 ${row.hierarchy_name}`);
      } else if (row.level_name === 'Well') {
        console.log(`      🛢️  ${row.hierarchy_name}`);
      } else if (row.level_name === 'Device') {
        console.log(`        🔧 ${row.hierarchy_name}`);
      }
    });

    // Log device statistics
    const deviceStatsResult = await database.query(`
      SELECT 
        c.name as company_name,
        dt.type_name,
        COUNT(d.id) as device_count
      FROM device d
      JOIN company c ON d.company_id = c.id
      JOIN device_type dt ON d.device_type_id = dt.id
      GROUP BY c.name, dt.type_name
      ORDER BY c.name, dt.type_name
    `);

    console.log('\n📊 Device Statistics by Company:');
    let currentCompanyStats = '';
    deviceStatsResult.rows.forEach(row => {
      if (row.company_name !== currentCompanyStats) {
        currentCompanyStats = row.company_name;
        console.log(`\n  ${currentCompanyStats}:`);
      }
      console.log(`    • ${row.type_name}: ${row.device_count} devices`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding hierarchy data:', error);
    throw error;
  }
};

const seedHierarchy = async () => {
  await seedHierarchyLevels();
  await seedDeviceTypes();
  await seedHierarchyData();
};

module.exports = seedHierarchy;