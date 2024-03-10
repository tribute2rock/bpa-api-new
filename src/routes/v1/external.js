const express = require('express');
const middlewares = require('../../middlewares');
const { requestsController } = require('../../controllers');
const multer = require('../../config/multer');

const router = express.Router();

router.use(middlewares.externalAuth);
// router.get('/testroute', requestsController.testroute);

module.exports = router;
