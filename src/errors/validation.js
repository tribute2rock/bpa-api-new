class ValidationError extends Error {
  constructor(args) {
    super(args);
    this.name = 'Validation Error';
    this.message = 'Please fill all the required fields'; 
    this.data = args;
  }
}

module.exports = ValidationError;
