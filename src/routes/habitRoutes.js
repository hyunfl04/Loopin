const router = require('express').Router();
const { 
  getHabits, 
  createHabit, 
  getHabit, 
  updateHabit, 
  deleteHabit, 
  checkinHabit,
  getStats 
} = require('../controllers/habitController');
const authMiddleware = require('../middleware/authMiddleware');

// All routes require authentication
router.use(authMiddleware);

// Stats route (must be before /:id routes)
router.get('/stats', getStats);


// CRUD routes
router.route('/')
  .get(getHabits)
  .post(createHabit);

router.route('/:id')
  .get(getHabit)
  .put(updateHabit)
  .delete(deleteHabit);

// Check-in route
router.post('/:id/checkin', checkinHabit);

module.exports = router;
