const { Router } = require('express');
const { sendCode}= require( '../controllers/verifyController.js');
const  authMiddleware= require('../middlewares/basicAuth.js');

const router = Router();


router.post('/send', authMiddleware, sendCode);


module.exports = router;

