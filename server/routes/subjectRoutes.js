// subject routes
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const subjectController = require('../controllers/subjectController');
const checkSubjectAccess = require('../middleware/checkSubjectAccess');

router.get('/subject', isLoggedIn, subjectController.SubDashboard);
router.get('/subject/recover', isLoggedIn, subjectController.ShowRecover);
router.put('/subject/:id/recover', isLoggedIn, checkSubjectAccess, subjectController.recoverSubject);
router.post('/createSubject', isLoggedIn, subjectController.createSubject);
router.delete('/subject/:id', isLoggedIn, checkSubjectAccess, subjectController.deleteSubject);

module.exports = router;