const database = require('../config/database');

const seedHierarchyLevels = async () => {
  try {
    // Clear existing hierarchy levels
    await database.query('TRUNCATE TABLE hierarchy_level RESTART IDENTITY CASCADE');

    // Create hierarchy levels
    const levels = [
      { level_order: 1, name: 'Region' },
      { level_order: 2, name: 'Area' },
      { level_order: 3, name: 'Field' },
      { level_order: 4, name: 'Well' },
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
    const fieldLevel = levels.find(l => l.name === 'Field');
    const wellLevel = levels.find(l => l.name === 'Well');

    if (!regionLevel || !areaLevel || !fieldLevel || !wellLevel) {
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
      'Arabco': {
        regions: [
          {
            name: 'Eastern Region',
            areas: [
              {
                name: 'Abqaiq Area',
                fields: [
                  {
                    name: 'Ghawar Field',
                    wells: [
                      {
                        name: 'Well-101',
                        devices: [
                          { name: 'MPFM Device', serial: 'DVC-ARABCO-101', type: mpfmType }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      'Saher Flow': {
        regions: [
          {
            name: 'Middle East',
            areas: [
              {
                name: 'KSA Area',
                fields: [
                  {
                    name: 'Demo Field',
                    wells: [
                      {
                        name: 'Demo Well',
                        devices: [
                          { name: 'Demo MPFM Device', serial: 'DVC-SAHER-201', type: mpfmType }
                        ]
                      }
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

          // Create fields for this area
          for (const fieldData of areaData.fields) {
            const fieldResult = await database.query(`
              INSERT INTO hierarchy (company_id, name, level_id, parent_id, can_attach_device)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id
            `, [company.id, fieldData.name, fieldLevel.id, areaId, false]);
            const fieldId = fieldResult.rows[0].id;

            // Create wells for this field
            for (const wellData of fieldData.wells) {
              const wellResult = await database.query(`
                INSERT INTO hierarchy (company_id, name, level_id, parent_id, can_attach_device)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id
              `, [company.id, wellData.name, wellLevel.id, fieldId, true]);
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
                  location: `${regionData.name}/${areaData.name}/${fieldData.name}/${wellData.name}`,
                  status: 'active'
                })]);
                const deviceId = deviceResult.rows[0].id;

                // Link device to well hierarchy
                await database.query(`
                  INSERT INTO hierarchy_device (hierarchy_id, device_id)
                  VALUES ($1, $2)
                `, [wellId, deviceId]);
              }
            }
          }
        }
      }
    }

    // Seed device data
    await seedDeviceData();

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
    let currentField = '';
    
    hierarchyResult.rows.forEach(row => {
      if (row.company_name !== currentCompany) {
        currentCompany = row.company_name;
        console.log(`\n🏢 ${currentCompany}:`);
        currentRegion = '';
        currentArea = '';
        currentField = '';
      }
      
      if (row.level_name === 'Region') {
        currentRegion = row.hierarchy_name;
        console.log(`  🌍 ${row.hierarchy_name}`);
      } else if (row.level_name === 'Area') {
        currentArea = row.hierarchy_name;
        console.log(`    📍 ${row.hierarchy_name}`);
      } else if (row.level_name === 'Field') {
        currentField = row.hierarchy_name;
        console.log(`      🏭 ${row.hierarchy_name}`);
      } else if (row.level_name === 'Well') {
        console.log(`        🛢️  ${row.hierarchy_name} (${row.device_count} devices)`);
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

const seedDeviceData = async () => {
  try {
    console.log('Seeding device data...');
    
    // Get device IDs
    const devicesResult = await database.query(`
      SELECT id, serial_number FROM device WHERE serial_number IN ('DVC-ARABCO-101', 'DVC-SAHER-201')
    `);
    
    const devices = devicesResult.rows;
    const arabcoDevice = devices.find(d => d.serial_number === 'DVC-ARABCO-101');
    const saherDevice = devices.find(d => d.serial_number === 'DVC-SAHER-201');

    if (!arabcoDevice || !saherDevice) {
      console.log('Devices not found for seeding data');
      return;
    }

    // Clear existing device data
    await database.query('DELETE FROM device_data');

    // Seed Arabco device data
    const arabcoData = [
      {
        device_id: arabcoDevice.id,
        serial_number: 'DVC-ARABCO-101',
        created_at: "now() - interval '5 minutes'",
        data: JSON.stringify({"GFR": 9600, "GOR": 10, "GVF": 75, "OFR": 850, "WFR": 2200, "WLR": 72, "PressureAvg": 6, "TemperatureAvg": 26})
      },
      {
        device_id: arabcoDevice.id,
        serial_number: 'DVC-ARABCO-101',
        created_at: "now() - interval '4 minutes'",
        data: JSON.stringify({"GFR": 9650, "GOR": 12, "GVF": 77, "OFR": 855, "WFR": 2180, "WLR": 71, "PressureAvg": 7, "TemperatureAvg": 27})
      },
      {
        device_id: arabcoDevice.id,
        serial_number: 'DVC-ARABCO-101',
        created_at: "now() - interval '3 minutes'",
        data: JSON.stringify({"GFR": 9630, "GOR": 11, "GVF": 76, "OFR": 852, "WFR": 2190, "WLR": 72, "PressureAvg": 6, "TemperatureAvg": 26})
      }
    ];

    // Seed Saher device data
    const saherData = [
      {
        device_id: saherDevice.id,
        serial_number: 'DVC-SAHER-201',
        created_at: "now() - interval '2 minutes'",
        data: JSON.stringify({"GFR": 5000, "GOR": 8, "GVF": 60, "OFR": 450, "WFR": 1200, "WLR": 70, "PressureAvg": 5, "TemperatureAvg": 25})
      },
      {
        device_id: saherDevice.id,
        serial_number: 'DVC-SAHER-201',
        created_at: "now() - interval '1 minutes'",
        data: JSON.stringify({"GFR": 5050, "GOR": 9, "GVF": 61, "OFR": 455, "WFR": 1210, "WLR": 71, "PressureAvg": 5, "TemperatureAvg": 25})
      }
    ];

    // Insert device data
    for (const data of [...arabcoData, ...saherData]) {
      await database.query(`
        INSERT INTO device_data (device_id, serial_number, created_at, data)
        VALUES ($1, $2, ${data.created_at}, $3)
      `, [data.device_id, data.serial_number, data.data]);
    }

    console.log('✅ Device data seeded successfully');

  } catch (error) {
    console.error('❌ Error seeding device data:', error);
    throw error;
  }
};

const oldSeedHierarchyData = async () => {
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
    const fieldLevel = levels.find(l => l.name === 'Field');
    const wellLevel = levels.find(l => l.name === 'Well');

    if (!regionLevel || !areaLevel || !fieldLevel || !wellLevel) {
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
      'Arabco': {
        regions: [
          {
            name: 'Eastern Region',
            areas: [
              {
                name: 'Abqaiq Area',
                fields: [
                  {
                    name: 'Ghawar Field',
                    wells: [
                      {
                        name: 'Well-101',
                        devices: [
                          { name: 'MPFM Device', serial: 'DVC-ARABCO-101', type: mpfmType }
                        ]
                      }
                    ]
                  }
                ]
              }
            ]
          }
        ]
      },
      'Saher Flow': {
        regions: [
          {
            name: 'Middle East',
            areas: [
              {
                name: 'KSA Area',
                fields: [
                  {
                    name: 'Demo Field',
                    wells: [
                      {
                        name: 'Demo Well',
                        devices: [
                          { name: 'Demo MPFM Device', serial: 'DVC-SAHER-201', type: mpfmType }
                        ]
                      }
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

          // Create fields for this area
          for (const fieldData of areaData.fields) {
            const fieldResult = await database.query(`
              INSERT INTO hierarchy (company_id, name, level_id, parent_id, can_attach_device)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id
            `, [company.id, fieldData.name, fieldLevel.id, areaId, false]);
            const fieldId = fieldResult.rows[0].id;

            // Create wells for this field
            for (const wellData of fieldData.wells) {
            const wellResult = await database.query(`
              INSERT INTO hierarchy (company_id, name, level_id, parent_id, can_attach_device)
              VALUES ($1, $2, $3, $4, $5)
              RETURNING id
            `, [company.id, wellData.name, wellLevel.id, fieldId, true]);
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
                location: `${regionData.name}/${areaData.name}/${fieldData.name}/${wellData.name}`,
                status: 'active'
              })]);
              const deviceId = deviceResult.rows[0].id;

              // Link device to well hierarchy
              await database.query(`
                INSERT INTO hierarchy_device (hierarchy_id, device_id)
                VALUES ($1, $2)
              `, [wellId, deviceId]);
            }
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