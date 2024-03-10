class UserNotGuest extends Error {
  constructor(args) {
    super(args);
    this.name = 'User Not Guest';
    this.message = 'Authorization token of a user exists.';
  }
}

module.exports = UserNotGuest;
