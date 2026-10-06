// controllers/authController.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const { query } = require('../config/database');

// Configure email transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, // Add to .env file
    pass: process.env.EMAIL_PASSWORD // Add to .env file (use App Password for Gmail)
  }
});

// Store reset tokens temporarily (in production, use database table)
const resetTokens = new Map();

// Clean up expired tokens every hour
setInterval(() => {
  const now = Date.now();
  for (const [token, data] of resetTokens.entries()) {
    if (now > data.expiry) {
      resetTokens.delete(token);
    }
  }
}, 3600000);

const register = async (req, res) => {
  const { email, username, password, confirmPassword } = req.body;

  // Validation
  if (!email || !username || !password) {
    return res.status(400).json({ success: false, message: 'All fields are required' });
  }
  if (password !== confirmPassword) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters' });
  }

  try {
    // Check if user exists
    const existingUser = await query('SELECT * FROM users WHERE email = ? OR username = ?', [email, username]);
    if (existingUser.length > 0) {
      return res.status(400).json({ success: false, message: 'Email or username already taken' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const result = await query(
      'INSERT INTO users (email, username, password) VALUES (?, ?, ?)',
      [email, username, hashedPassword]
    );

    // Automatically log in the user after registration
    req.session.user = {
      id: result.insertId,
      username: username,
      email: email
    };

    res.status(201).json({
      success: true,
      message: 'User registered successfully!',
      userId: result.insertId,
      redirect: '/dashboard'
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password required' });
  }

  try {
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    const user = users[0];

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ success: false, message: 'Invalid email or password' });
    }

    // Save to session
    req.session.user = {
      id: user.id,
      username: user.username,
      email: user.email
    };

    res.json({
      success: true,
      message: 'Login successful',
      redirect: '/dashboard'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

const logout = (req, res) => {
  req.session.destroy(() => {
    res.json({ success: true, message: 'Logged out' });
  });
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ success: false, message: 'Email is required' });
    }

    console.log('Forgot password request for:', email);

    // Check if user exists
    const users = await query('SELECT * FROM users WHERE email = ?', [email]);
    
    // Always return success to prevent email enumeration
    if (!users || users.length === 0) {
      console.log('Email not found in database');
      return res.json({ 
        success: true, 
        message: 'If the email exists, a reset link has been sent.' 
      });
    }

    const user = users[0];

    console.log('User found, generating token...');

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiry = Date.now() + 3600000; // 1 hour expiry

    // Store token
    resetTokens.set(resetToken, {
      email: email,
      expiry: expiry
    });

    console.log('Token generated:', resetToken);

    // Create reset URL
    const resetUrl = `http://localhost:${process.env.PORT || 3000}/reset-password?token=${resetToken}`;

    console.log('Reset URL:', resetUrl);

    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
      console.error('Email credentials not configured!');
      console.log('For now, use this reset link:', resetUrl);
      
      return res.json({ 
        success: true, 
        message: 'Password reset link generated. Check server console for the link.',
        resetUrl: resetUrl // Only for development/testing
      });
    }

    // Send email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'E-READY - Password Reset Request',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>You requested a password reset for your E-READY account.</p>
          <p>Click the button below to reset your password:</p>
          <div style="margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p>Or copy and paste this link in your browser:</p>
          <p style="color: #666; word-break: break-all;">${resetUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 30px;">
            This link will expire in 1 hour.<br>
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `
    };

    console.log('Attempting to send email...');
    await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!');

    res.json({ 
      success: true, 
      message: 'Password reset link has been sent to your email.' 
    });

  } catch (error) {
    console.error('Forgot password error:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process request. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || !password || !confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'All fields are required.' 
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'Passwords do not match.' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'Password must be at least 6 characters.' 
      });
    }

    // Verify token
    const tokenData = resetTokens.get(token);
    
    if (!tokenData) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token.' 
      });
    }

    // Check if token expired
    if (Date.now() > tokenData.expiry) {
      resetTokens.delete(token);
      return res.status(400).json({ 
        success: false, 
        message: 'Reset token has expired. Please request a new one.' 
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Update password in database
    await query(
      'UPDATE users SET password = ? WHERE email = ?',
      [hashedPassword, tokenData.email]
    );

    // Delete used token
    resetTokens.delete(token);

    res.json({ 
      success: true, 
      message: 'Password has been reset successfully. You can now login with your new password.' 
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to reset password. Please try again.' 
    });
  }
};

module.exports = { 
  register, 
  login, 
  logout, 
  forgotPassword, 
  resetPassword 
};