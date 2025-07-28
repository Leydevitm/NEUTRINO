const { Router } = require('express');
const { startVerificationController, checkVerificationController } = require('../controllers/verifyController');
const attemptLimit = require('../middlewares/attemptLimit');

const router = Router();


router.post('/send', attemptLimit, startVerificationController);

router.post( '/check', attemptLimit, checkVerificationController );

module.exports = router;

