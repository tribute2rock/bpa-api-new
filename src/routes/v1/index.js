const express = require('express');
const config = require('../../config');
const devRoutes = require('./dev');
const guestRoutes = require('./guest');
const authenticatedRoutes = require('./authenticated');
const externalRoutes = require('./external');

const router = express.Router();

router.use('/v1', guestRoutes);
router.use('/v1', authenticatedRoutes);
router.use('/v2', externalRoutes);

// if (config.env === 'development') {
//   router.use('/v1', devRoutes);
// }

module.exports = router;
