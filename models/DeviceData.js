const database = require('../config/database');

class DeviceData {
  constructor(data = {}) {
    this.id = data.id;
    this.device_id = data.device_id;
    this.serial_number = data.serial_number;
    this.created_at = data.created_at;
    this.data = data.data;
  }

  static async create(deviceDataInfo) {
    const { device_id, serial_number, data } = deviceDataInfo;

    const query = `
      INSERT INTO device_data (device_id, serial_number, data)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await database.query(query, [device_id, serial_number, JSON.stringify(data)]);
    return new DeviceData(result.rows[0]);
  }

  static async findByDeviceId(device_id, limit = 100, timeRange = '24 hours') {
    const query = `
      SELECT * FROM device_data 
      WHERE device_id = $1 
      AND created_at >= now() - interval '${timeRange}'
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await database.query(query, [device_id, limit]);
    return result.rows.map(row => new DeviceData(row));
  }

  static async findBySerialNumber(serial_number, limit = 100, timeRange = '24 hours') {
    const query = `
      SELECT * FROM device_data 
      WHERE serial_number = $1 
      AND created_at >= now() - interval '${timeRange}'
      ORDER BY created_at DESC 
      LIMIT $2
    `;
    const result = await database.query(query, [serial_number, limit]);
    return result.rows.map(row => new DeviceData(row));
  }

  static async getLatestByDeviceId(device_id) {
    const query = `
      SELECT * FROM device_data 
      WHERE device_id = $1 
      ORDER BY created_at DESC 
      LIMIT 1
    `;
    const result = await database.query(query, [device_id]);
    return result.rows[0] ? new DeviceData(result.rows[0]) : null;
  }

  static async getDeviceDataForCompany(company_id, timeRange = '24 hours') {
    const query = `
      SELECT dd.*, d.serial_number as device_serial, dt.type_name, h.name as location_name
      FROM device_data dd
      JOIN device d ON dd.device_id = d.id
      JOIN device_type dt ON d.device_type_id = dt.id
      JOIN hierarchy_device hd ON d.id = hd.device_id
      JOIN hierarchy h ON hd.hierarchy_id = h.id
      WHERE d.company_id = $1 
      AND dd.created_at >= now() - interval '${timeRange}'
      ORDER BY dd.created_at DESC
    `;
    const result = await database.query(query, [company_id]);
    return result.rows.map(row => ({
      ...new DeviceData(row),
      device_serial: row.device_serial,
      type_name: row.type_name,
      location_name: row.location_name
    }));
  }

  toJSON() {
    return {
      id: this.id,
      device_id: this.device_id,
      serial_number: this.serial_number,
      created_at: this.created_at,
      data: typeof this.data === 'string' ? JSON.parse(this.data) : this.data
    };
  }
}

module.exports = DeviceData;