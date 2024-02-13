const express = require('express');
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const subjectController = require('../controllers/subjectController')

router.get('/subject', isLoggedIn,subjectController.SubDashboard);
router.post('/createSubject', isLoggedIn,subjectController.createSubject);
router.post('/deleteSubject/:id', isLoggedIn, subjectController.deleteSubject);
router.get('/subject/item/:id', isLoggedIn, subjectController.viewSubject);

module.exports = router;