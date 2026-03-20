const jwt = require('jsonwebtoken');
const User = require('../models/User');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Lấy token từ Cookie thay vì Authorization Header
    // Yêu cầu: Đã cài đặt cookie-parser ở file app.js/server.js
    const token = req.cookies.loopin_token;
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. Please login first.'
      });
    }

    // 2. Xác thực Token (Giữ nguyên logic cũ)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 3. Tìm User từ Database
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found.'
      });
    }

    // Lưu thông tin user vào request để các controller sau sử dụng
    req.user = user;
    next();
  } catch (error) {
    // 4. Xử lý lỗi Token (Giữ nguyên logic phân loại lỗi của bạn)
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token.'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Your session has expired. Please login again.'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Server error during authentication.'
    });
  }
};

module.exports = authMiddleware;