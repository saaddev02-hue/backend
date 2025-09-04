const Company = require('../models/Company');

// Check if email domain is allowed based on database companies
const validateCompanyDomain = async (req, res, next) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }

    const emailDomain = email.split('@')[1]?.toLowerCase();
    
    if (!emailDomain) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format'
      });
    }

    // Find company by domain from database
    const company = await Company.findByDomain(emailDomain);

    if (!company) {
      // Get all active companies for error message
      const activeCompanies = await Company.find({ isActive: true })
        .select('name domains')
        .sort({ name: 1 });
      
      const allowedDomains = activeCompanies.reduce((acc, comp) => {
        return acc.concat(comp.domains);
      }, []);

      return res.status(403).json({
        success: false,
        message: `Registration is restricted to employees of approved companies only.`,
        allowedDomains: allowedDomains,
        approvedCompanies: activeCompanies.map(comp => ({
          name: comp.name,
          domains: comp.domains
        }))
      });
    }

    // Store the found company in request for later use
    req.approvedCompany = company;
    next();
  } catch (error) {
    console.error('Domain validation error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error validating email domain'
    });
  }
};

module.exports = { validateCompanyDomain };