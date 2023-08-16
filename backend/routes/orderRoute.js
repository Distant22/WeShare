const express = require('express');
const router = express.Router();
const util = require('../utils/util');
const orderController = require('../controllers/orderController');

router.post('/:id/request', [util.authorize_json, util.authorize_bearer], orderController.addOrder);
router.put('/:id/agree', [util.authorize_json, util.authorize_bearer], orderController.agreeOrder);

module.exports = router;