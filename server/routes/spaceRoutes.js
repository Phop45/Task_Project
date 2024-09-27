// subject routes
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const subjectController = require('../controllers/spaceController');
const checkSubjectAccess = require('../middleware/checkSubjectAccess');

router.get('/space', isLoggedIn, subjectController.SpaceDashboard);
router.post('/createSpace', isLoggedIn, subjectController.createSpace);
router.delete('/space/delete/:id', isLoggedIn, subjectController.deleteSpace);

router.put('/space/:id/recover', isLoggedIn, subjectController.recoverSpace);
router.get('/subject/recover', isLoggedIn, subjectController.ShowRecover);
module.exports = router;