class UserNotAuthorized extends Error {
  constructor(args) {
    super(args);
    this.name = 'User Not Authorized';
    this.message = 'User does not have required privilege.';
  }
}

module.exports = UserNotAuthorized;
