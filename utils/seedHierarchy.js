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

    // Comprehensive hierarchy structure for both companies
    const hierarchyData = [
      // Arabco Company (ID: 1) - More comprehensive structure
      // Eastern Region
      { id: 1, name: 'Eastern Region', level_id: 1, parent_id: null, company_id: 1, can_attach_device: false },
      { id: 2, name: 'Abqaiq Area', level_id: 2, parent_id: 1, company_id: 1, can_attach_device: false },
      { id: 3, name: 'Ghawar Field', level_id: 3, parent_id: 2, company_id: 1, can_attach_device: false },
      { id: 4, name: 'Well-101', level_id: 4, parent_id: 3, company_id: 1, can_attach_device: true },
      { id: 5, name: 'Well-102', level_id: 4, parent_id: 3, company_id: 1, can_attach_device: true },
      { id: 6, name: 'Well-103', level_id: 4, parent_id: 3, company_id: 1, can_attach_device: true },
      
      { id: 7, name: 'Shaybah Field', level_id: 3, parent_id: 2, company_id: 1, can_attach_device: false },
      { id: 8, name: 'Well-201', level_id: 4, parent_id: 7, company_id: 1, can_attach_device: true },
      { id: 9, name: 'Well-202', level_id: 4, parent_id: 7, company_id: 1, can_attach_device: true },
      
      { id: 10, name: 'Dammam Area', level_id: 2, parent_id: 1, company_id: 1, can_attach_device: false },
      { id: 11, name: 'Berri Field', level_id: 3, parent_id: 10, company_id: 1, can_attach_device: false },
      { id: 12, name: 'Well-301', level_id: 4, parent_id: 11, company_id: 1, can_attach_device: true },
      { id: 13, name: 'Well-302', level_id: 4, parent_id: 11, company_id: 1, can_attach_device: true },
      
      // Western Region
      { id: 14, name: 'Western Region', level_id: 1, parent_id: null, company_id: 1, can_attach_device: false },
      { id: 15, name: 'Jeddah Area', level_id: 2, parent_id: 14, company_id: 1, can_attach_device: false },
      { id: 16, name: 'Red Sea Field', level_id: 3, parent_id: 15, company_id: 1, can_attach_device: false },
      { id: 17, name: 'Well-401', level_id: 4, parent_id: 16, company_id: 1, can_attach_device: true },
      { id: 18, name: 'Well-402', level_id: 4, parent_id: 16, company_id: 1, can_attach_device: true },
      
      // Saher Flow Company (ID: 2) - Enhanced structure
      // Middle East Region
      { id: 19, name: 'Middle East Region', level_id: 1, parent_id: null, company_id: 2, can_attach_device: false },
      { id: 20, name: 'KSA Area', level_id: 2, parent_id: 19, company_id: 2, can_attach_device: false },
      { id: 21, name: 'Demo Field Alpha', level_id: 3, parent_id: 20, company_id: 2, can_attach_device: false },
      { id: 22, name: 'Demo Well A1', level_id: 4, parent_id: 21, company_id: 2, can_attach_device: true },
      { id: 23, name: 'Demo Well A2', level_id: 4, parent_id: 21, company_id: 2, can_attach_device: true },
      
      { id: 24, name: 'Demo Field Beta', level_id: 3, parent_id: 20, company_id: 2, can_attach_device: false },
      { id: 25, name: 'Demo Well B1', level_id: 4, parent_id: 24, company_id: 2, can_attach_device: true },
      { id: 26, name: 'Demo Well B2', level_id: 4, parent_id: 24, company_id: 2, can_attach_device: true },
      
      { id: 27, name: 'UAE Area', level_id: 2, parent_id: 19, company_id: 2, can_attach_device: false },
      { id: 28, name: 'Dubai Field', level_id: 3, parent_id: 27, company_id: 2, can_attach_device: false },
      { id: 29, name: 'Well-D1', level_id: 4, parent_id: 28, company_id: 2, can_attach_device: true },
      { id: 30, name: 'Well-D2', level_id: 4, parent_id: 28, company_id: 2, can_attach_device: true },
      
      // North Africa Region
      { id: 31, name: 'North Africa Region', level_id: 1, parent_id: null, company_id: 2, can_attach_device: false },
      { id: 32, name: 'Egypt Area', level_id: 2, parent_id: 31, company_id: 2, can_attach_device: false },
      { id: 33, name: 'Cairo Field', level_id: 3, parent_id: 32, company_id: 2, can_attach_device: false },
      { id: 34, name: 'Well-E1', level_id: 4, parent_id: 33, company_id: 2, can_attach_device: true },
      { id: 35, name: 'Well-E2', level_id: 4, parent_id: 33, company_id: 2, can_attach_device: true }
    ];

    // Insert hierarchy data
    for (const hierarchy of hierarchyData) {
      await database.query(`
        INSERT INTO hierarchy (id, name, level_id, parent_id, company_id, can_attach_device, created_at, updated_at) 
        VALUES ($1, $2, $3, $4, $5, $6, now(), now())
        ON CONFLICT (id) DO NOTHING
      `, [hierarchy.id, hierarchy.name, hierarchy.level_id, hierarchy.parent_id, hierarchy.company_id, hierarchy.can_attach_device]);
    }

    // Comprehensive device data
    const deviceData = [
      // Arabco devices
      { id: 1, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-101', hierarchy_id: 4, metadata: { model: 'MPFM-X1', install_date: '2024-01-15', status: 'active', location: 'Ghawar-Well-101' } },
      { id: 2, company_id: 1, device_type_id: 2, serial_number: 'PRES-ARB-101', hierarchy_id: 4, metadata: { model: 'PS-200', install_date: '2024-01-15', status: 'active', location: 'Ghawar-Well-101' } },
      { id: 3, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-102', hierarchy_id: 5, metadata: { model: 'MPFM-X2', install_date: '2024-02-01', status: 'active', location: 'Ghawar-Well-102' } },
      { id: 4, company_id: 1, device_type_id: 3, serial_number: 'TEMP-ARB-102', hierarchy_id: 5, metadata: { model: 'TS-150', install_date: '2024-02-01', status: 'active', location: 'Ghawar-Well-102' } },
      { id: 5, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-103', hierarchy_id: 6, metadata: { model: 'MPFM-X3', install_date: '2024-02-15', status: 'active', location: 'Ghawar-Well-103' } },
      { id: 6, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-201', hierarchy_id: 8, metadata: { model: 'MPFM-Y1', install_date: '2024-03-01', status: 'active', location: 'Shaybah-Well-201' } },
      { id: 7, company_id: 1, device_type_id: 4, serial_number: 'FLOW-ARB-201', hierarchy_id: 8, metadata: { model: 'FM-300', install_date: '2024-03-01', status: 'active', location: 'Shaybah-Well-201' } },
      { id: 8, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-202', hierarchy_id: 9, metadata: { model: 'MPFM-Y2', install_date: '2024-03-15', status: 'active', location: 'Shaybah-Well-202' } },
      { id: 9, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-301', hierarchy_id: 12, metadata: { model: 'MPFM-Z1', install_date: '2024-04-01', status: 'active', location: 'Berri-Well-301' } },
      { id: 10, company_id: 1, device_type_id: 5, serial_number: 'VIB-ARB-301', hierarchy_id: 12, metadata: { model: 'VS-100', install_date: '2024-04-01', status: 'active', location: 'Berri-Well-301' } },
      { id: 11, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-302', hierarchy_id: 13, metadata: { model: 'MPFM-Z2', install_date: '2024-04-15', status: 'active', location: 'Berri-Well-302' } },
      { id: 12, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-401', hierarchy_id: 17, metadata: { model: 'MPFM-W1', install_date: '2024-05-01', status: 'active', location: 'RedSea-Well-401' } },
      { id: 13, company_id: 1, device_type_id: 1, serial_number: 'MPFM-ARB-402', hierarchy_id: 18, metadata: { model: 'MPFM-W2', install_date: '2024-05-15', status: 'active', location: 'RedSea-Well-402' } },
      
      // Saher Flow devices
      { id: 14, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-A1', hierarchy_id: 22, metadata: { model: 'MPFM-Demo-1', install_date: '2024-06-01', status: 'active', location: 'Demo-Alpha-A1' } },
      { id: 15, company_id: 2, device_type_id: 2, serial_number: 'PRES-SHR-A1', hierarchy_id: 22, metadata: { model: 'PS-Demo-1', install_date: '2024-06-01', status: 'active', location: 'Demo-Alpha-A1' } },
      { id: 16, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-A2', hierarchy_id: 23, metadata: { model: 'MPFM-Demo-2', install_date: '2024-06-15', status: 'active', location: 'Demo-Alpha-A2' } },
      { id: 17, company_id: 2, device_type_id: 3, serial_number: 'TEMP-SHR-A2', hierarchy_id: 23, metadata: { model: 'TS-Demo-1', install_date: '2024-06-15', status: 'active', location: 'Demo-Alpha-A2' } },
      { id: 18, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-B1', hierarchy_id: 25, metadata: { model: 'MPFM-Demo-3', install_date: '2024-07-01', status: 'active', location: 'Demo-Beta-B1' } },
      { id: 19, company_id: 2, device_type_id: 4, serial_number: 'FLOW-SHR-B1', hierarchy_id: 25, metadata: { model: 'FM-Demo-1', install_date: '2024-07-01', status: 'active', location: 'Demo-Beta-B1' } },
      { id: 20, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-B2', hierarchy_id: 26, metadata: { model: 'MPFM-Demo-4', install_date: '2024-07-15', status: 'active', location: 'Demo-Beta-B2' } },
      { id: 21, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-D1', hierarchy_id: 29, metadata: { model: 'MPFM-UAE-1', install_date: '2024-08-01', status: 'active', location: 'Dubai-Well-D1' } },
      { id: 22, company_id: 2, device_type_id: 5, serial_number: 'VIB-SHR-D1', hierarchy_id: 29, metadata: { model: 'VS-UAE-1', install_date: '2024-08-01', status: 'active', location: 'Dubai-Well-D1' } },
      { id: 23, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-D2', hierarchy_id: 30, metadata: { model: 'MPFM-UAE-2', install_date: '2024-08-15', status: 'active', location: 'Dubai-Well-D2' } },
      { id: 24, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-E1', hierarchy_id: 34, metadata: { model: 'MPFM-EGY-1', install_date: '2024-09-01', status: 'active', location: 'Cairo-Well-E1' } },
      { id: 25, company_id: 2, device_type_id: 1, serial_number: 'MPFM-SHR-E2', hierarchy_id: 35, metadata: { model: 'MPFM-EGY-2', install_date: '2024-09-15', status: 'active', location: 'Cairo-Well-E2' } }
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

    // Generate comprehensive device data for the last 24 hours
    console.log('🔄 Generating device data for the last 24 hours...');
    
    const generateDeviceData = (deviceId, serialNumber, baseValues) => {
      const dataPoints = [];
      const now = new Date();
      
      // Generate data for last 24 hours (every 5 minutes = 288 data points)
      for (let i = 287; i >= 0; i--) {
        const timestamp = new Date(now.getTime() - (i * 5 * 60 * 1000));
        
        // Add some realistic variation to the data
        const variation = 0.95 + (Math.random() * 0.1); // ±5% variation
        const timeVariation = Math.sin((i / 288) * 2 * Math.PI) * 0.05; // Daily cycle
        
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
          data: JSON.stringify(data)
        });
      }
      
      return dataPoints;
    };

    // Base values for different device types/locations
    const deviceBaseValues = {
      // Arabco devices - Higher production values
      1: { GFR: 9600, GOR: 10, GVF: 75, OFR: 850, WFR: 2200, WLR: 72, PressureAvg: 6.5, TemperatureAvg: 26 },
      3: { GFR: 8800, GOR: 12, GVF: 78, OFR: 780, WFR: 2100, WLR: 73, PressureAvg: 6.2, TemperatureAvg: 27 },
      5: { GFR: 9200, GOR: 11, GVF: 76, OFR: 820, WFR: 2150, WLR: 72, PressureAvg: 6.3, TemperatureAvg: 26 },
      6: { GFR: 7500, GOR: 15, GVF: 70, OFR: 650, WFR: 1800, WLR: 74, PressureAvg: 5.8, TemperatureAvg: 28 },
      8: { GFR: 8100, GOR: 13, GVF: 72, OFR: 720, WFR: 1950, WLR: 73, PressureAvg: 6.0, TemperatureAvg: 27 },
      9: { GFR: 6800, GOR: 16, GVF: 68, OFR: 580, WFR: 1650, WLR: 75, PressureAvg: 5.5, TemperatureAvg: 29 },
      11: { GFR: 7200, GOR: 14, GVF: 71, OFR: 620, WFR: 1750, WLR: 74, PressureAvg: 5.7, TemperatureAvg: 28 },
      12: { GFR: 5500, GOR: 18, GVF: 65, OFR: 450, WFR: 1300, WLR: 76, PressureAvg: 5.2, TemperatureAvg: 30 },
      13: { GFR: 5800, GOR: 17, GVF: 66, OFR: 480, WFR: 1350, WLR: 75, PressureAvg: 5.3, TemperatureAvg: 29 },
      
      // Saher Flow devices - Demo/Test values
      14: { GFR: 5000, GOR: 8, GVF: 60, OFR: 450, WFR: 1200, WLR: 70, PressureAvg: 5.0, TemperatureAvg: 25 },
      16: { GFR: 4800, GOR: 9, GVF: 62, OFR: 430, WFR: 1150, WLR: 71, PressureAvg: 4.8, TemperatureAvg: 24 },
      18: { GFR: 5200, GOR: 7, GVF: 58, OFR: 470, WFR: 1250, WLR: 69, PressureAvg: 5.2, TemperatureAvg: 26 },
      20: { GFR: 4900, GOR: 10, GVF: 61, OFR: 440, WFR: 1180, WLR: 72, PressureAvg: 4.9, TemperatureAvg: 25 },
      21: { GFR: 6200, GOR: 6, GVF: 55, OFR: 560, WFR: 1400, WLR: 68, PressureAvg: 5.5, TemperatureAvg: 27 },
      23: { GFR: 6000, GOR: 7, GVF: 57, OFR: 540, WFR: 1350, WLR: 69, PressureAvg: 5.3, TemperatureAvg: 26 },
      24: { GFR: 4500, GOR: 12, GVF: 63, OFR: 400, WFR: 1100, WLR: 73, PressureAvg: 4.5, TemperatureAvg: 23 },
      25: { GFR: 4700, GOR: 11, GVF: 64, OFR: 420, WFR: 1130, WLR: 72, PressureAvg: 4.7, TemperatureAvg: 24 }
    };

    // Generate data for MPFM devices only (they have comprehensive flow data)
    const mpfmDevices = [1, 3, 5, 6, 8, 9, 11, 12, 13, 14, 16, 18, 20, 21, 23, 24, 25];
    
    for (const deviceId of mpfmDevices) {
      if (deviceBaseValues[deviceId]) {
        const device = deviceData.find(d => d.id === deviceId);
        if (device) {
          const dataPoints = generateDeviceData(deviceId, device.serial_number, deviceBaseValues[deviceId]);
          
          // Insert data in batches to avoid memory issues
          const batchSize = 50;
          for (let i = 0; i < dataPoints.length; i += batchSize) {
            const batch = dataPoints.slice(i, i + batchSize);
            const values = [];
            const placeholders = [];
            
            batch.forEach((point, index) => {
              const baseIndex = index * 4;
              placeholders.push(`($${baseIndex + 1}, $${baseIndex + 2}, $${baseIndex + 3}, $${baseIndex + 4})`);
              values.push(point.device_id, point.serial_number, point.created_at, point.data);
            });
            
            if (values.length > 0) {
              await database.query(`
                INSERT INTO device_data (device_id, serial_number, created_at, data) 
                VALUES ${placeholders.join(', ')}
              `, values);
            }
          }
          
          // Update device_latest table with most recent data
          const latestData = dataPoints[dataPoints.length - 1];
          await database.query(`
            INSERT INTO device_latest (device_id, serial_number, updated_at, data, received_at)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (device_id) DO UPDATE SET
              serial_number = EXCLUDED.serial_number,
              updated_at = EXCLUDED.updated_at,
              data = EXCLUDED.data,
              received_at = EXCLUDED.received_at
          `, [
            latestData.device_id,
            latestData.serial_number,
            latestData.created_at,
            latestData.data,
            new Date()
          ]);
        }
      }
    }

    console.log('✅ Comprehensive hierarchy and device data seeded successfully');
    
    // Log the hierarchy structure
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

    console.log('\n📋 Comprehensive Hierarchy Structure:');
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

    // Summary statistics
    const summaryStats = await database.query(`
      SELECT 
        c.name as company_name,
        COUNT(DISTINCT h.id) as total_locations,
        COUNT(DISTINCT CASE WHEN hl.name = 'Region' THEN h.id END) as regions,
        COUNT(DISTINCT CASE WHEN hl.name = 'Area' THEN h.id END) as areas,
        COUNT(DISTINCT CASE WHEN hl.name = 'Field' THEN h.id END) as fields,
        COUNT(DISTINCT CASE WHEN hl.name = 'Well' THEN h.id END) as wells,
        COUNT(DISTINCT d.id) as total_devices,
        COUNT(DISTINCT dd.id) as total_data_points
      FROM company c
      LEFT JOIN hierarchy h ON c.id = h.company_id
      LEFT JOIN hierarchy_level hl ON h.level_id = hl.id
      LEFT JOIN hierarchy_device hd ON h.id = hd.hierarchy_id
      LEFT JOIN device d ON hd.device_id = d.id
      LEFT JOIN device_data dd ON d.id = dd.device_id
      GROUP BY c.name
      ORDER BY c.name
    `);

    console.log('\n📊 Summary Statistics:');
    summaryStats.rows.forEach(row => {
      console.log(`\n🏢 ${row.company_name}:`);
      console.log(`  📍 Locations: ${row.total_locations} (${row.regions} regions, ${row.areas} areas, ${row.fields} fields, ${row.wells} wells)`);
      console.log(`  🔧 Devices: ${row.total_devices}`);
      console.log(`  📈 Data Points: ${row.total_data_points}`);
    });
    console.log('');

  } catch (error) {
    console.error('❌ Error seeding comprehensive hierarchy data:', error);
    throw error;
  }
};

const seedHierarchy = async () => {
  await seedHierarchyLevels();
  await seedDeviceTypes();
  await seedHierarchyData();
};

module.exports = seedHierarchy;