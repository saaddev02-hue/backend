const database = require('../config/database');

const seedHierarchyLevels = async () => {
  try {
    // Clear existing hierarchy levels
    await database.query('TRUNCATE TABLE hierarchy_level RESTART IDENTITY CASCADE');

    // Create hierarchy levels as per TL's requirements
    const levels = [
      { id: 1, level_order: 1, name: 'Region' },
      { id: 2, level_order: 2, name: 'Area' },
      { id: 3, level_order: 3, name: 'Field' },
      { id: 4, level_order: 4, name: 'Well' }
    ];

    for (const levelData of levels) {
      await database.query(`
        INSERT INTO hierarchy_level (id, level_order, name) 
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
      `, [levelData.id, levelData.level_order, levelData.name]);
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
      { id: 1, type_name: 'MPFM', logo: 'mpfm-sensor.png' },
      { id: 2, type_name: 'Pressure Sensor', logo: 'pressure-sensor.png' },
      { id: 3, type_name: 'Temperature Sensor', logo: 'temperature-sensor.png' },
      { id: 4, type_name: 'Flow Meter', logo: 'flow-meter.png' },
      { id: 5, type_name: 'Vibration Sensor', logo: 'vibration-sensor.png' }
    ];

    for (const deviceType of deviceTypes) {
      await database.query(`
        INSERT INTO device_type (id, type_name, logo) 
        VALUES ($1, $2, $3)
        ON CONFLICT (id) DO NOTHING
      `, [deviceType.id, deviceType.type_name, deviceType.logo]);
    }

    console.log('✅ Device types seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding device types:', error);
    throw error;
  }
};

const seedHierarchyData = async () => {
  try {
    // Clear existing data in correct order
    await database.query('TRUNCATE TABLE device_latest RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE device_data RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE hierarchy_device RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE device RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE hierarchy RESTART IDENTITY CASCADE');

    // Seed companies first
    await database.query(`
      INSERT INTO company (id, name, domain_name) VALUES
      (1, 'Arabco', 'arabco.com'),
      (2, 'Saher Flow', 'saherflow.com')
      ON CONFLICT (id) DO NOTHING
    `);

    // Clean hierarchy structure - no duplicates
    const hierarchyData = [
      // Arabco Company (ID: 1)
      // Eastern Region
      { id: 1, name: 'Eastern Region', level_id: 1, parent_id: null, company_id: 1, can_attach_device: false },
      { id: 2, name: 'Abqaiq Area', level_id: 2, parent_id: 1, company_id: 1, can_attach_device: false },
      { id: 3, name: 'Ghawar Field', level_id: 3, parent_id: 2, company_id: 1, can_attach_device: false },
      { id: 4, name: 'Well-101', level_id: 4, parent_id: 3, company_id: 1, can_attach_device: true },
      { id: 5, name: 'Well-102', level_id: 4, parent_id: 3, company_id: 1, can_attach_device: true },
      
      { id: 6, name: 'Shaybah Field', level_id: 3, parent_id: 2, company_id: 1, can_attach_device: false },
      { id: 7, name: 'Well-201', level_id: 4, parent_id: 6, company_id: 1, can_attach_device: true },
      
      { id: 8, name: 'Dammam Area', level_id: 2, parent_id: 1, company_id: 1, can_attach_device: false },
      { id: 9, name: 'Berri Field', level_id: 3, parent_id: 8, company_id: 1, can_attach_device: false },
      { id: 10, name: 'Well-301', level_id: 4, parent_id: 9, company_id: 1, can_attach_device: true },
      
      // Western Region
      { id: 11, name: 'Western Region', level_id: 1, parent_id: null, company_id: 1, can_attach_device: false },
      { id: 12, name: 'Jeddah Area', level_id: 2, parent_id: 11, company_id: 1, can_attach_device: false },
      { id: 13, name: 'Red Sea Field', level_id: 3, parent_id: 12, company_id: 1, can_attach_device: false },
      { id: 14, name: 'Well-401', level_id: 4, parent_id: 13, company_id: 1, can_attach_device: true },
      
      // Saher Flow Company (ID: 2)
      // Middle East Region
      { id: 15, name: 'Middle East Region', level_id: 1, parent_id: null, company_id: 2, can_attach_device: false },
      { id: 16, name: 'KSA Area', level_id: 2, parent_id: 15, company_id: 2, can_attach_device: false },
      { id: 17, name: 'Demo Field Alpha', level_id: 3, parent_id: 16, company_id: 2, can_attach_device: false },
      { id: 18, name: 'Demo Well A1', level_id: 4, parent_id: 17, company_id: 2, can_attach_device: true },
      { id: 19, name: 'Demo Well A2', level_id: 4, parent_id: 17, company_id: 2, can_attach_device: true },
      
      { id: 20, name: 'Demo Field Beta', level_id: 3, parent_id: 16, company_id: 2, can_attach_device: false },
      { id: 21, name: 'Demo Well B1', level_id: 4, parent_id: 20, company_id: 2, can_attach_device: true },
      
      { id: 22, name: 'UAE Area', level_id: 2, parent_id: 15, company_id: 2, can_attach_device: false },
      { id: 23, name: 'Dubai Field', level_id: 3, parent_id: 22, company_id: 2, can_attach_device: false },
      { id: 24, name: 'Well-D1', level_id: 4, parent_id: 23, company_id: 2, can_attach_device: true }
    ];

    // Insert hierarchy data
    for (const hierarchy of hierarchyData) {
      await database.query(`
        INSERT INTO hierarchy (id, name, level_id, parent_id, company_id, can_attach_device, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, now(), now())
        ON CONFLICT (id) DO NOTHING
      `, [hierarchy.id, hierarchy.name, hierarchy.level_id, hierarchy.parent_id, hierarchy.company_id, hierarchy.can_attach_device]);
    }

    // Clean device data - one device per well
    const deviceData = [
      // Arabco devices - one MPFM per well
      { id: 1, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-101', hierarchy_id: 4, metadata: { model: 'MPFM-X1', install_date: '2024-01-15', status: 'active', location: 'Ghawar-Well-101' } },
      { id: 2, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-102', hierarchy_id: 5, metadata: { model: 'MPFM-X2', install_date: '2024-02-01', status: 'active', location: 'Ghawar-Well-102' } },
      { id: 3, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-201', hierarchy_id: 7, metadata: { model: 'MPFM-Y1', install_date: '2024-03-01', status: 'active', location: 'Shaybah-Well-201' } },
      { id: 4, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-301', hierarchy_id: 10, metadata: { model: 'MPFM-Z1', install_date: '2024-04-01', status: 'active', location: 'Berri-Well-301' } },
      { id: 5, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-401', hierarchy_id: 14, metadata: { model: 'MPFM-W1', install_date: '2024-05-01', status: 'active', location: 'RedSea-Well-401' } },
      
      // Saher Flow devices - one MPFM per well
      { id: 6, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-A1', hierarchy_id: 18, metadata: { model: 'MPFM-Demo-1', install_date: '2024-06-01', status: 'active', location: 'Demo-Alpha-A1' } },
      { id: 7, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-A2', hierarchy_id: 19, metadata: { model: 'MPFM-Demo-2', install_date: '2024-06-15', status: 'active', location: 'Demo-Alpha-A2' } },
      { id: 8, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-B1', hierarchy_id: 21, metadata: { model: 'MPFM-Demo-3', install_date: '2024-07-01', status: 'active', location: 'Demo-Beta-B1' } },
      { id: 9, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-D1', hierarchy_id: 24, metadata: { model: 'MPFM-UAE-1', install_date: '2024-08-01', status: 'active', location: 'Dubai-Well-D1' } }
    ];

    // Insert devices
    for (const device of deviceData) {
      await database.query(`
        INSERT INTO device (id, company_id, device_type_id, serial_number, metadata) 
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
      `, [device.id, device.company_id, device.device_type_id, device.serial_number, JSON.stringify(device.metadata)]);
      
      // Link device to hierarchy
      await database.query(`
        INSERT INTO hierarchy_device (hierarchy_id, device_id) 
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [device.hierarchy_id, device.id]);
    }

    // Generate device data for the last 24 hours
    console.log('🔄 Generating device data for the last 24 hours...');
    
    const generateDeviceData = (deviceId, serialNumber, baseValues) => {
      const dataPoints = [];
      const now = new Date();
      
      // Generate data for last 24 hours (every 10 minutes = 144 data points)
      for (let i = 143; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 10 * 60 * 1000));
        
        // Add some realistic variation to the data
        const variation = 0.95 + (Math.random() * 0.1); // ±5% variation
        const timeVariation = Math.sin((i / 144) * 2 * Math.PI) * 0.05; // Daily cycle
        
        const data = {
          GFR: Math.round((baseValues.GFR * variation * (1 + timeVariation)) * 100) / 100,
          GOR: Math.round((baseValues.GOR * variation) * 100) / 100,
          GVF: Math.round((baseValues.GVF * variation) * 100) / 100,
          OFR: Math.round((baseValues.OFR * variation * (1 + timeVariation)) * 100) / 100,
          WFR: Math.round((baseValues.WFR * variation * (1 + timeVariation)) * 100) / 100,
          WLR: Math.round((baseValues.WLR * variation) * 100) / 100,
          PressureAvg: Math.round((baseValues.PressureAvg * variation) * 100) / 100,
          TemperatureAvg: Math.round((baseValues.TemperatureAvg * variation) * 100) / 100
        };
        
        dataPoints.push({
          device_id: deviceId,
          serial_number: serialNumber,
          created_at: timestamp,
          longitude: baseValues.longitude || null,
          latitude: baseValues.latitude || null,
          data: JSON.stringify(data)
        });
      }
      
      return dataPoints;
    };

    // Base values for each device
    const deviceBaseValues = {
      // Arabco devices
      1: { GFR: 9600, GOR: 10, GVF: 75, OFR: 850, WFR: 2200, WLR: 72, PressureAvg: 6.5, TemperatureAvg: 26, longitude: 50.1, latitude: 26.2 },
      2: { GFR: 8800, GOR: 12, GVF: 78, OFR: 780, WFR: 2100, WLR: 73, PressureAvg: 6.2, TemperatureAvg: 27, longitude: 50.2, latitude: 26.3 },
      3: { GFR: 7500, GOR: 15, GVF: 70, OFR: 650, WFR: 1800, WLR: 74, PressureAvg: 5.8, TemperatureAvg: 28, longitude: 49.8, latitude: 25.9 },
      4: { GFR: 6800, GOR: 16, GVF: 68, OFR: 580, WFR: 1650, WLR: 75, PressureAvg: 5.5, TemperatureAvg: 29, longitude: 50.0, latitude: 26.1 },
      5: { GFR: 5500, GOR: 18, GVF: 65, OFR: 450, WFR: 1300, WLR: 76, PressureAvg: 5.2, TemperatureAvg: 30, longitude: 39.2, latitude: 21.5 },
      
      // Saher Flow devices
      6: { GFR: 5000, GOR: 8, GVF: 60, OFR: 450, WFR: 1200, WLR: 70, PressureAvg: 5.0, TemperatureAvg: 25, longitude: 46.7, latitude: 24.7 },
      7: { GFR: 4800, GOR: 9, GVF: 62, OFR: 430, WFR: 1150, WLR: 71, PressureAvg: 4.8, TemperatureAvg: 24, longitude: 46.8, latitude: 24.8 },
      8: { GFR: 5200, GOR: 7, GVF: 58, OFR: 470, WFR: 1250, WLR: 69, PressureAvg: 5.2, TemperatureAvg: 26, longitude: 46.9, latitude: 24.9 },
      9: { GFR: 6200, GOR: 6, GVF: 55, OFR: 560, WFR: 1400, WLR: 68, PressureAvg: 5.5, TemperatureAvg: 27, longitude: 55.3, latitude: 25.3 }
    };

    // Generate data for all devices
    for (const deviceId of Object.keys(deviceBaseValues)) {
      const device = deviceData.find(d => d.id === parseInt(deviceId));
      if (device) {
        const dataPoints = generateDeviceData(parseInt(deviceId), device.serial_number, deviceBaseValues[deviceId]);
        
        // Insert data in batches
        const batchSize = 50;
        for (let i = 0; i < dataPoints.length; i += batchSize) {
          const batch = dataPoints.slice(i, i + batchSize);
          const values = [];
          const placeholders = [];
          
          batch.forEach((point, index) => {
            const baseIndex = index * 6;
            placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4}, $${baseIndex + 5}, $${baseIndex + 6})`);
            values.push(point.device_id, point.serial_number, point.created_at, point.longitude, point.latitude, point.data);
          });
          
          if (values.length > 0) {
            await database.query(`
              INSERT INTO device_data (device_id, serial_number, created_at, longitude, latitude, data) 
              VALUES ${placeholders.join(', ')}
            `, values);
          }
        }
        
        // Update device_latest table with most recent data
        const latestData = dataPoints[dataPoints.length - 1];
        await database.query(`
          INSERT INTO device_latest (device_id, serial_number, updated_at, longitude, latitude, data, received_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          ON CONFLICT (device_id) DO UPDATE SET
            serial_number = EXCLUDED.serial_number,
            updated_at = EXCLUDED.updated_at,
            longitude = EXCLUDED.longitude,
            latitude = EXCLUDED.latitude,
            data = EXCLUDED.data,
            received_at = EXCLUDED.received_at
        `, [
          latestData.device_id,
          latestData.serial_number,
          latestData.created_at,
          latestData.longitude,
          latestData.latitude,
          latestData.data,
          new Date()
        ]);
      }
    }

    console.log('✅ Clean hierarchy and device data seeded successfully');
    
    // Log the clean hierarchy structure
    const hierarchyResult = await database.query(`
      SELECT 
        c.name as company_name,
        h.name as hierarchy_name,
        hl.name as level_name,
        h.parent_id,
        h.id,
        COUNT(DISTINCT hd.device_id) as device_count,
        COUNT(DISTINCT dd.id) as data_points
      FROM hierarchy h
      JOIN company c ON h.company_id = c.id
      JOIN hierarchy_level hl ON h.level_id = hl.id
      LEFT JOIN hierarchy_device hd ON h.id = hd.hierarchy_id
      LEFT JOIN device_data dd ON hd.device_id = dd.device_id
      GROUP BY c.name, h.name, hl.name, h.parent_id, h.id, hl.level_order
      ORDER BY c.name, hl.level_order, h.name
    `);

    console.log('\n📋 Clean Hierarchy Structure:');
    let currentCompany = '';
    
    hierarchyResult.rows.forEach(row => {
      if (row.company_name !== currentCompany) {
        currentCompany = row.company_name;
        console.log(`\n🏢 ${currentCompany}:`);
      }
      
      const indent = '  '.repeat(row.level_name === 'Region' ? 1 : 
                                row.level_name === 'Area' ? 2 : 
                                row.level_name === 'Field' ? 3 : 4);
      const icon = row.level_name === 'Region' ? '🌍' : 
                   row.level_name === 'Area' ? '📍' : 
                   row.level_name === 'Field' ? '🏭' : '🛢️';
      
      console.log(`${indent}${icon} ${row.hierarchy_name} (${row.device_count} devices, ${row.data_points} data points)`);
    });

    console.log('\n📊 Total Summary:');
    const totalStats = await database.query(`
      SELECT 
        COUNT(DISTINCT h.id) as total_locations,
        COUNT(DISTINCT d.id) as total_devices,
        COUNT(DISTINCT dd.id) as total_data_points
      FROM hierarchy h
      LEFT JOIN hierarchy_device hd ON h.id = hd.hierarchy_id
      LEFT JOIN device d ON hd.device_id = d.id
      LEFT JOIN device_data dd ON d.id = dd.device_id
    `);
    
    const stats = totalStats.rows[0];
    console.log(`📍 Total Locations: ${stats.total_locations}`);
    console.log(`🔧 Total Devices: ${stats.total_devices}`);
    console.log(`📈 Total Data Points: ${stats.total_data_points}`);
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding clean hierarchy data:', error);
    throw error;
  }
};

const seedHierarchy = async () => {
  await seedHierarchyLevels();
  await seedDeviceTypes();
  await seedHierarchyData();
};

module.exports = seedHierarchy;