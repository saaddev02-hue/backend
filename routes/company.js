const express = require('express');
const { body, validationResult } = require('express-validator');
const Company = require('../models/Company');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// @desc    Get all companies
// @route   GET /api/company
// @access  Public (for registration domain checking)
router.get('/', async (req, res) => {
  try {
    const companies = await Company.find({ isActive: true })
      .select('name domains description')
      .sort({ name: 1 });

    res.json({
      success: true,
      data: {
        companies
      }
    });
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting companies'
    });
  }
});

// @desc    Get company by ID
// @route   GET /api/company/:id
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    res.json({
      success: true,
      data: {
        company
      }
    });
  } catch (error) {
    console.error('Get company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error getting company'
    });
  }
});

// @desc    Create new company
// @route   POST /api/company
// @access  Private/Admin
router.post('/', protect, admin, [
  body('name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('domains')
    .isArray({ min: 1 })
    .withMessage('At least one domain is required')
    .custom((domains) => {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      return domains.every(domain => domainRegex.test(domain));
    })
    .withMessage('All domains must be valid'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('contactEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Contact email must be valid')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, domains, description, contactEmail } = req.body;

    // Check if company name already exists
    const existingCompany = await Company.findOne({ 
      name: { $regex: new RegExp(`^${name}$`, 'i') }
    });
    
    if (existingCompany) {
      return res.status(400).json({
        success: false,
        message: 'Company with this name already exists'
      });
    }

    // Check if any domain is already used by another company
    const existingDomains = await Company.find({
      domains: { $in: domains.map(d => d.toLowerCase()) },
      isActive: true
    });

    if (existingDomains.length > 0) {
      const conflictingDomains = existingDomains.reduce((acc, comp) => {
        const conflicts = comp.domains.filter(domain => 
          domains.map(d => d.toLowerCase()).includes(domain)
        );
        return acc.concat(conflicts);
      }, []);

      return res.status(400).json({
        success: false,
        message: `The following domains are already registered: ${conflictingDomains.join(', ')}`
      });
    }

    // Create company
    const company = await Company.create({
      name,
      domains: domains.map(d => d.toLowerCase()),
      description,
      contactEmail
    });

    res.status(201).json({
      success: true,
      message: 'Company created successfully',
      data: {
        company
      }
    });
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error creating company'
    });
  }
});

// @desc    Update company
// @route   PUT /api/company/:id
// @access  Private/Admin
router.put('/:id', protect, admin, [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Company name must be between 2 and 100 characters'),
  body('domains')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one domain is required')
    .custom((domains) => {
      const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
      return domains.every(domain => domainRegex.test(domain));
    })
    .withMessage('All domains must be valid'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('contactEmail')
    .optional()
    .isEmail()
    .normalizeEmail()
    .withMessage('Contact email must be valid'),
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, domains, description, contactEmail, isActive } = req.body;

    // Find company
    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Check if new name conflicts with existing companies
    if (name && name !== company.name) {
      const existingCompany = await Company.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') },
        _id: { $ne: req.params.id }
      });
      
      if (existingCompany) {
        return res.status(400).json({
          success: false,
          message: 'Company with this name already exists'
        });
      }
    }

    // Check if new domains conflict with existing companies
    if (domains) {
      const normalizedDomains = domains.map(d => d.toLowerCase());
      const existingDomains = await Company.find({
        domains: { $in: normalizedDomains },
        isActive: true,
        _id: { $ne: req.params.id }
      });

      if (existingDomains.length > 0) {
        const conflictingDomains = existingDomains.reduce((acc, comp) => {
          const conflicts = comp.domains.filter(domain => 
            normalizedDomains.includes(domain)
          );
          return acc.concat(conflicts);
        }, []);

        return res.status(400).json({
          success: false,
          message: `The following domains are already registered: ${conflictingDomains.join(', ')}`
        });
      }
    }

    // Update company
    const updatedCompany = await Company.findByIdAndUpdate(
      req.params.id,
      {
        ...(name && { name }),
        ...(domains && { domains: domains.map(d => d.toLowerCase()) }),
        ...(description !== undefined && { description }),
        ...(contactEmail !== undefined && { contactEmail }),
        ...(isActive !== undefined && { isActive })
      },
      {
        new: true,
        runValidators: true
      }
    );

    res.json({
      success: true,
      message: 'Company updated successfully',
      data: {
        company: updatedCompany
      }
    });
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error updating company'
    });
  }
});

// @desc    Delete company (soft delete)
// @route   DELETE /api/company/:id
// @access  Private/Admin
router.delete('/:id', protect, admin, async (req, res) => {
  try {
    const company = await Company.findById(req.params.id);
    
    if (!company) {
      return res.status(404).json({
        success: false,
        message: 'Company not found'
      });
    }

    // Soft delete - deactivate company
    company.isActive = false;
    await company.save();

    res.json({
      success: true,
      message: 'Company deactivated successfully'
    });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error deleting company'
    });
  }
});

// @desc    Check if domain is allowed
// @route   GET /api/company/check-domain/:domain
// @access  Public
router.get('/check-domain/:domain', async (req, res) => {
  try {
    const domain = req.params.domain.toLowerCase();
    
    const company = await Company.findByDomain(domain);
    
    res.json({
      success: true,
      data: {
        isAllowed: !!company,
        company: company ? {
          id: company._id,
          name: company.name,
          description: company.description
        } : null
      }
    });
  } catch (error) {
    console.error('Check domain error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error checking domain'
    });
  }
});

module.exports = router;