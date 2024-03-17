const express = require('express');
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const subjectController = require('../controllers/subjectController')

router.get('/subject', isLoggedIn, subjectController.SubDashboard);
router.get('/subject/recover', isLoggedIn, subjectController.SubRecover);
router.put('/subject/:id/recover', isLoggedIn, subjectController.recoverSubject);
router.post('/createSubject', isLoggedIn, subjectController.createSubject);
router.delete('/subject/:id', subjectController.deleteSubject);

module.exports = router;


