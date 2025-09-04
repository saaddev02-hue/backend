const mongoose = require('mongoose');

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Company name is required'],
    trim: true,
    unique: true,
    maxlength: [100, 'Company name cannot exceed 100 characters']
  },
  domains: [{
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(domain) {
        // Basic domain validation
        return /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/.test(domain);
      },
      message: 'Invalid domain format'
    }
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  contactEmail: {
    type: String,
    trim: true,
    lowercase: true,
    match: [
      /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/,
      'Please enter a valid contact email'
    ]
  }
}, {
  timestamps: true
});

// Index for faster domain lookups
companySchema.index({ domains: 1 });
companySchema.index({ isActive: 1 });

// Method to check if a domain belongs to this company
companySchema.methods.hasDomain = function(domain) {
  const normalizedDomain = domain.toLowerCase();
  return this.domains.some(companyDomain => 
    normalizedDomain === companyDomain || normalizedDomain.endsWith('.' + companyDomain)
  );
};

// Static method to find company by domain
companySchema.statics.findByDomain = async function(domain) {
  const normalizedDomain = domain.toLowerCase();
  
  const companies = await this.find({ 
    isActive: true,
    domains: { $exists: true, $ne: [] }
  });
  
  return companies.find(company => company.hasDomain(normalizedDomain));
};

module.exports = mongoose.model('Company', companySchema);