const express = require('express');
const DeviceData = require('../models/DeviceData');
const { protect } = require('../middleware/auth');

const router = express.Router();

// @desc    Get device data by device ID
// @route   GET /api/device-data/device/:deviceId
// @access  Private
router.get('/device/:deviceId', protect, async (req, res) => {
  try {
    const deviceId = parseInt(req.params.deviceId);
    const limit = parseInt(req.query.limit) || 100;
    const timeRange = req.query.timeRange || '24 hours';

    // Check if user has access to this device
    const database = require('../config/database');
    const deviceCheck = await database.query(`
      SELECT d.company_id FROM device d WHERE d.id = $1
    `, [deviceId]);

    if (deviceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    if (req.user.role !== 'admin' && deviceCheck.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this device data'
      });
    }

    const deviceData = await DeviceData.findByDeviceId(deviceId, limit, timeRange);

    res.json({
      success: true,
      data: {
        deviceData: deviceData.map(d => d.toJSON()),
        total: deviceData.length
      }
    });
  } catch (error) {
    console.error('Get device data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting device data'
    });
  }
});

// @desc    Get device data by serial number
// @route   GET /api/device-data/serial/:serialNumber
// @access  Private
router.get('/serial/:serialNumber', protect, async (req, res) => {
  try {
    const serialNumber = req.params.serialNumber;
    const limit = parseInt(req.query.limit) || 100;
    const timeRange = req.query.timeRange || '24 hours';

    // Check if user has access to this device
    const database = require('../config/database');
    const deviceCheck = await database.query(`
      SELECT d.company_id FROM device d WHERE d.serial_number = $1
    `, [serialNumber]);

    if (deviceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    if (req.user.role !== 'admin' && deviceCheck.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to this device data'
      });
    }

    const deviceData = await DeviceData.findBySerialNumber(serialNumber, limit, timeRange);

    res.json({
      success: true,
      data: {
        deviceData: deviceData.map(d => d.toJSON()),
        total: deviceData.length
      }
    });
  } catch (error) {
    console.error('Get device data by serial error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting device data'
    });
  }
});

// @desc    Get latest device data for all company devices
// @route   GET /api/device-data/company/latest
// @access  Private
router.get('/company/latest', protect, async (req, res) => {
  try {
    let company_id = req.user.company_id;
    
    // If admin requests specific company data
    if (req.query.company_id && req.user.role === 'admin') {
      company_id = parseInt(req.query.company_id);
    }

    const database = require('../config/database');
    const query = `
      SELECT DISTINCT ON (d.id) 
        dd.*, 
        d.serial_number as device_serial, 
        dt.type_name, 
        h.name as location_name,
        d.id as device_id
      FROM device_data dd
      JOIN device d ON dd.device_id = d.id
      JOIN device_type dt ON d.device_type_id = dt.id
      JOIN hierarchy_device hd ON d.id = hd.device_id
      JOIN hierarchy h ON hd.hierarchy_id = h.id
      WHERE d.company_id = $1 
      ORDER BY d.id, dd.created_at DESC
    `;

    const result = await database.query(query, [company_id]);
    
    const latestData = result.rows.map(row => ({
      id: row.id,
      device_id: row.device_id,
      serial_number: row.serial_number,
      device_serial: row.device_serial,
      type_name: row.type_name,
      location_name: row.location_name,
      created_at: row.created_at,
      data: typeof row.data === 'string' ? JSON.parse(row.data) : row.data
    }));

    res.json({
      success: true,
      data: {
        latestData,
        total: latestData.length,
        company_id
      }
    });
  } catch (error) {
    console.error('Get company latest device data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting company device data'
    });
  }
});

// @desc    Create device data entry
// @route   POST /api/device-data
// @access  Private (for device data ingestion)
router.post('/', protect, async (req, res) => {
  try {
    const { device_id, serial_number, data } = req.body;

    if (!device_id || !serial_number || !data) {
      return res.status(400).json({
        success: false,
        message: 'Device ID, serial number, and data are required'
      });
    }

    // Check if user has access to this device
    const database = require('../config/database');
    const deviceCheck = await database.query(`
      SELECT d.company_id FROM device d WHERE d.id = $1 AND d.serial_number = $2
    `, [device_id, serial_number]);

    if (deviceCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Device not found'
      });
    }

    if (req.user.role !== 'admin' && deviceCheck.rows[0].company_id !== req.user.company_id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied to create data for this device'
      });
    }

    const deviceData = await DeviceData.create({
      device_id,
      serial_number,
      data
    });

    res.status(201).json({
      success: true,
      message: 'Device data created successfully',
      data: {
        deviceData: deviceData.toJSON()
      }
    });
  } catch (error) {
    console.error('Create device data error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating device data'
    });
  }
});

module.exports = router;