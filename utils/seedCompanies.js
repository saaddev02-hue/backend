const Company = require('../models/Company');

// Initial companies data
const initialCompanies = [
  {
    name: 'Saudi Aramco',
    domains: ['aramco.com'],
    description: 'Saudi Arabian Oil Company - Leading energy and chemicals company',
    contactEmail: 'info@aramco.com'
  },
  {
    name: 'Abu Dhabi National Oil Company',
    domains: ['adnoc.ae'],
    description: 'State-owned oil company of the United Arab Emirates',
    contactEmail: 'info@adnoc.ae'
  },
  {
    name: 'Qatar Terminal',
    domains: ['qtm.com.qa'],
    description: 'Qatar Terminal Management Company',
    contactEmail: 'info@qtm.com.qa'
  },
  {
    name: 'Petroleum Development Oman',
    domains: ['pdo.co.om'],
    description: 'Leading exploration and production company in the Sultanate of Oman',
    contactEmail: 'info@pdo.co.om'
  },
  {
    name: 'DNV',
    domains: ['dnv.com'],
    description: 'Global quality assurance and risk management company',
    contactEmail: 'info@dnv.com'
  },
  {
    name: 'Saher Flow Solutions',
    domains: ['saherflow.com'],
    description: 'Professional Flow Measurement Platform',
    contactEmail: 'info@saherflow.com'
  }
];

const seedCompanies = async () => {
  try {
    // Check if companies already exist
    const existingCompanies = await Company.countDocuments();
    
    if (existingCompanies > 0) {
      console.log('Companies already exist in database. Skipping seed.');
      return;
    }

    // Insert initial companies
    await Company.insertMany(initialCompanies);
    console.log('✅ Initial companies seeded successfully');
    
    // Log the seeded companies
    const companies = await Company.find({ isActive: true }).select('name domains');
    console.log('\n📋 Approved companies and domains:');
    companies.forEach(company => {
      console.log(`  • ${company.name}: ${company.domains.join(', ')}`);
    });
    console.log('');
    
  } catch (error) {
    console.error('❌ Error seeding companies:', error);
    throw error;
  }
};

module.exports = seedCompanies;