// Space routes
const { Router } = require('express');
const router = Router();
const { isLoggedIn } = require('../middleware/checkAuth');
const spaceController = require('../controllers/spaceController');
const upload = require('../middleware/upload'); 

router.get('/space', isLoggedIn, spaceController.SpaceDashboard);

router.get('/createSpace', isLoggedIn, spaceController.createSpace);
router.post('/createSpace', isLoggedIn, upload.single('SpacePicture'), spaceController.createSpace);

router.delete('/space/delete/:id', isLoggedIn, spaceController.deleteSpace);
router.put('/space/:id/recover', isLoggedIn, spaceController.recoverSpace);
router.get('/subject/recover', isLoggedIn, spaceController.ShowRecover);

router.post('/updateSpacePicture/:id', isLoggedIn, spaceController.edit_Update_SpacePicture);
router.post('/updateSpaceName/:id', isLoggedIn, spaceController.edit_Update_SpaceName);

router.get('/searchMembers', isLoggedIn, spaceController.searchMembers);
router.post('/addStatus',isLoggedIn, spaceController.addStatus);
router.get('/:spaceId/statuses', isLoggedIn, spaceController.getSpaceStatuses);

module.exports = router;