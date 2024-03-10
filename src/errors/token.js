class InvalidRefreshToken extends Error {
  constructor(args) {
    super(args);
    this.name = 'Invalid Refresh Token';
    this.message = 'Refresh token is invalid.';
  }
}

module.exports = InvalidRefreshToken;
