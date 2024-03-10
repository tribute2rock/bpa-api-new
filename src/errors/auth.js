class UserNotAuthenticated extends Error {
  constructor(args) {
    super(args);
    this.name = 'User Not Authenticated';
    this.message = 'Access token is invalid or does not exist.';
  }
}

module.exports = UserNotAuthenticated;
