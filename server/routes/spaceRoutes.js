// Space routes
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const spaceController = require('../controllers/spaceController');

router.get('/space', isLoggedIn, spaceController.SpaceDashboard);
router.post('/createSpace', isLoggedIn, spaceController.createSpace);
router.delete('/space/delete/:id', isLoggedIn, spaceController.deleteSpace);
router.put('/space/:id/recover', isLoggedIn, spaceController.recoverSpace);
router.get('/subject/recover', isLoggedIn, spaceController.ShowRecover);

router.post('/add-member', isLoggedIn, spaceController.addMemberToSpace);
module.exports = router;