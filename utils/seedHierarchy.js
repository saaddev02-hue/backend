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
    // Clear existing data
    await database.query('TRUNCATE TABLE hierarchy_device RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE device_data RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE device RESTART IDENTITY CASCADE');
    await database.query('TRUNCATE TABLE hierarchy RESTART IDENTITY CASCADE');

    // Seed companies first
    await database.query(`
      INSERT INTO company (id, name, domain_name) VALUES
      (1, 'Arabco', 'arabco.com'),
      (2, 'Saher Flow', 'saherflow.com')
      ON CONFLICT (id) DO NOTHING
    `);

    // Seed hierarchy as per TL's requirements
    await database.query(`
      INSERT INTO hierarchy (id, name, level_id, parent_id, company_id, can_attach_device, created_at, updated_at) VALUES
      (1, 'Eastern Region', 1, NULL, 1, false, now(), now()),
      (2, 'Abqaiq Area', 2, 1, 1, false, now(), now()),
      (3, 'Ghawar Field', 3, 2, 1, false, now(), now()),
      (4, 'Well-101', 4, 3, 1, true, now(), now()),
      (5, 'Middle East', 1, NULL, 2, false, now(), now()),
      (6, 'KSA Area', 2, 5, 2, false, now(), now()),
      (7, 'Demo Field', 3, 6, 2, false, now(), now()),
      (8, 'Demo Well', 4, 7, 2, true, now(), now())
      ON CONFLICT (id) DO NOTHING
    `);

    // Seed devices
    await database.query(`
      INSERT INTO device (id, company_id, device_type_id, serial_number, metadata) VALUES
      (1, 1, 1, 'DVC-ARABCO-101', '{"model": "MPFM-X1", "install_date": "2025-01-01"}'),
      (2, 2, 1, 'DVC-SAHER-201', '{"model": "MPFM-Y1", "install_date": "2025-02-01"}')
      ON CONFLICT (id) DO NOTHING
    `);

    // Link devices to hierarchy
    await database.query(`
      INSERT INTO hierarchy_device (hierarchy_id, device_id) VALUES
      (4, 1),
      (8, 2)
      ON CONFLICT DO NOTHING
    `);

    // Seed device data for current day as per TL's requirements
    await database.query(`
      INSERT INTO device_data (device_id, serial_number, created_at, data) VALUES
      (1, 'DVC-ARABCO-101', now() - interval '5 minutes', '{"GFR": 9600, "GOR": 10, "GVF": 75, "OFR": 850, "WFR": 2200, "WLR": 72, "PressureAvg": 6, "TemperatureAvg": 26}'),
      (1, 'DVC-ARABCO-101', now() - interval '4 minutes', '{"GFR": 9650, "GOR": 12, "GVF": 77, "OFR": 855, "WFR": 2180, "WLR": 71, "PressureAvg": 7, "TemperatureAvg": 27}'),
      (1, 'DVC-ARABCO-101', now() - interval '3 minutes', '{"GFR": 9630, "GOR": 11, "GVF": 76, "OFR": 852, "WFR": 2190, "WLR": 72, "PressureAvg": 6, "TemperatureAvg": 26}'),
      (2, 'DVC-SAHER-201', now() - interval '2 minutes', '{"GFR": 5000, "GOR": 8, "GVF": 60, "OFR": 450, "WFR": 1200, "WLR": 70, "PressureAvg": 5, "TemperatureAvg": 25}'),
      (2, 'DVC-SAHER-201', now() - interval '1 minutes', '{"GFR": 5050, "GOR": 9, "GVF": 61, "OFR": 455, "WFR": 1210, "WLR": 71, "PressureAvg": 5, "TemperatureAvg": 25}')
    `);

    console.log('✅ Hierarchy data seeded successfully');
    
    // Log the hierarchy structure
    const hierarchyResult = await database.query(`
      SELECT 
        c.name as company_name,
        h.name as hierarchy_name,
        hl.name as level_name,
        h.parent_id,
        h.id,
        COUNT(hd.device_id) as device_count
      FROM hierarchy h
      JOIN company c ON h.company_id = c.id
      JOIN hierarchy_level hl ON h.level_id = hl.id
      LEFT JOIN hierarchy_device hd ON h.id = hd.hierarchy_id
      GROUP BY c.name, h.name, hl.name, h.parent_id, h.id, hl.level_order
      ORDER BY c.name, hl.level_order, h.name
    `);

    console.log('\n📋 Seeded Hierarchy Structure:');
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
      
      console.log(`${indent}${icon} ${row.hierarchy_name} (${row.device_count} devices)`);
    });

    console.log('\n📊 Device Data Statistics:');
    const dataStats = await database.query(`
      SELECT 
        d.serial_number,
        COUNT(dd.id) as data_points,
        MIN(dd.created_at) as first_data,
        MAX(dd.created_at) as last_data
      FROM device d
      LEFT JOIN device_data dd ON d.id = dd.device_id
      GROUP BY d.serial_number
      ORDER BY d.serial_number
    `);

    dataStats.rows.forEach(row => {
      console.log(`  • ${row.serial_number}: ${row.data_points} data points`);
      if (row.first_data) {
        console.log(`    First: ${new Date(row.first_data).toLocaleString()}`);
        console.log(`    Last: ${new Date(row.last_data).toLocaleString()}`);
      }
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