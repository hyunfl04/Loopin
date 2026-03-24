const router = require('express').Router();
const { 
  searchUsers, 
  sendRequest, 
  handleRequest, 
  unfriend,
  getFriends,
  getMyRequests
} = require('../controllers/friendshipController');
const {protect} = require('../middleware/authMiddleware');

router.use(protect); // Protect all routes in this router

router.get('/search', searchUsers);
router.get('/list', getFriends); 
router.get('/my-requests', getMyRequests);
router.post('/request/:recipientId', sendRequest);
router.post('/handle-request', handleRequest);
router.delete('/unfriend/:friendId', unfriend);

module.exports = router;