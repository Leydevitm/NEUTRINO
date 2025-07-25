const { Router } = require('express');
const { sendCode, checkVerifyCode}= require( '../controllers/verifyController.js');
const  authMiddleware= require('../middlewares/basicAuth.js');

const router = Router();


router.post('/send', authMiddleware, sendCode);

router.post( '/check',authMiddleware, checkVerifyCode );

module.exports = router;

