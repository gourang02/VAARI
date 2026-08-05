const User = require('../models/User');
const Doctor = require('../models/Doctor');
const Staff = require('../models/Staff');
const { generateOTP, sendOTP, verifyOTP } = require('../services/otp.service');
const { success, created } = require('../utils/apiResponse');
const { ApiError } = require('../utils/apiError');
const env = require('../config/env');
const jwt = require('jsonwebtoken');

const getModelByRole = (role) => {
  switch (role) {
    case 'doctor': return Doctor;
    case 'staff': return Staff;
    default: return User;
  }
};

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role, phone: user.phone },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRY }
  );
};

// Register a new doctor (creates account with pending verification)
const registerDoctor = async (req, res, next) => {
  try {
    const { phone, name, specialization, registrationNumber, consultationFee, avgConsultationMin, experience, qualifications, clinic, username, password, passkey } = req.body;

    if (username) {
      const existingUser = await Doctor.findOne({ username });
      if (existingUser) {
        throw new ApiError(409, 'This account already exists, dear doctor. Please login.');
      }
    }

    const doctor = new Doctor({
      phone,
      name,
      specialization,
      registrationNumber,
      consultationFee,
      avgConsultationMin: avgConsultationMin || 10,
      experience,
      qualifications,
      clinic,
      username,
      password,
      passkey,
      role: 'doctor',
      // Auto-approve for MVP testing — in production, set to 'pending'
      verificationStatus: env.NODE_ENV === 'development' ? 'approved' : 'pending'
    });

    await doctor.save();

    // Send OTP for immediate login
    const otpCode = env.MOCK_OTP ? env.MOCK_OTP_CODE : generateOTP();
    doctor.otp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MIN * 60000)
    };
    await doctor.save();
    await sendOTP(phone, otpCode);

    return created(res, {
      doctorId: doctor._id,
      verificationStatus: doctor.verificationStatus
    }, 'Doctor registered successfully. OTP sent for verification.');
  } catch (error) {
    next(error);
  }
};

// Register a new patient (saves name, email, and phone to DB)
const registerPatient = async (req, res, next) => {
  try {
    const { phone, name, email, username, password, passkey } = req.body;

    if (username) {
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        throw new ApiError(409, 'This account already exists, dear patient. Please login.');
      }
    }

    const patient = new User({
      phone,
      name,
      email,
      username,
      password,
      passkey,
      role: 'patient'
    });

    await patient.save();

    // Send OTP for immediate verification and login
    const otpCode = env.MOCK_OTP ? env.MOCK_OTP_CODE : generateOTP();
    patient.otp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MIN * 60000)
    };
    await patient.save();
    await sendOTP(phone, otpCode);

    return created(res, {
      patientId: patient._id
    }, 'Patient registered successfully. OTP sent for verification.');
  } catch (error) {
    next(error);
  }
};

const sendOtp = async (req, res, next) => {
  try {
    const { phone, role } = req.body;
    const Model = getModelByRole(role);

    let user = await Model.findOne({ phone });
    if (!user) {
      if (role === 'doctor') {
        throw new ApiError(404, 'Doctor account not found. Please register first.');
      }
      if (role === 'staff') {
        throw new ApiError(404, 'Staff account not found. Ask your doctor to add you.');
      }
      // Auto-create patient accounts
      user = new Model({ phone, role: 'patient' });
    }

    const otpCode = env.MOCK_OTP ? env.MOCK_OTP_CODE : generateOTP();
    user.otp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MIN * 60000)
    };
    
    await user.save();
    await sendOTP(phone, otpCode);

    return success(res, null, 'OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

const verifyOtp = async (req, res, next) => {
  try {
    const { phone, otp, role } = req.body;
    const Model = getModelByRole(role);

    const user = await Model.findOne({ phone });
    if (!user || !user.otp || !user.otp.code) {
      throw new ApiError(400, 'Invalid OTP or phone number');
    }

    const isValid = await verifyOTP(user.otp.code, otp, user.otp.expiresAt, phone);
    if (!isValid) {
      throw new ApiError(400, 'Invalid or expired OTP');
    }

    // Clear OTP
    user.otp = undefined;
    await user.save();

    const token = generateToken(user);

    // Prepare user data (exclude sensitive fields)
    const userData = user.toObject();
    delete userData.otp;
    delete userData.verificationDocs;

    return success(res, { token, user: userData }, 'Verified successfully');
  } catch (error) {
    next(error);
  }
};

const getMe = async (req, res, next) => {
  try {
    const Model = getModelByRole(req.user.role);
    const user = await Model.findById(req.user.id).select('-otp -verificationDocs');
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    return success(res, user, 'User details retrieved');
  } catch (error) {
    next(error);
  }
};

// Login using username & password
const loginWithPassword = async (req, res, next) => {
  try {
    const { username, password, role } = req.body;
    const Model = getModelByRole(role);

    const user = await Model.findOne({ username });
    if (!user) {
      throw new ApiError(401, 'Invalid username or password');
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      throw new ApiError(401, 'Invalid username or password');
    }

    const token = generateToken(user);
    const userData = user.toObject();
    delete userData.password;
    delete userData.passkey;
    delete userData.otp;

    return success(res, { token, user: userData }, 'Login successful');
  } catch (error) {
    next(error);
  }
};

// Reset password via Passkey
const resetPasswordPasskey = async (req, res, next) => {
  try {
    const { username, role, passkey, newPassword } = req.body;
    const Model = getModelByRole(role);

    const user = await Model.findOne({ username });
    if (!user) {
      throw new ApiError(404, 'User account not found');
    }

    // Verify Passkey
    if (!user.passkey || user.passkey !== passkey) {
      throw new ApiError(400, 'Invalid recovery passkey');
    }

    // Update password
    user.password = newPassword;
    await user.save();

    return success(res, null, 'Password reset successfully using passkey');
  } catch (error) {
    next(error);
  }
};

// Send OTP for password reset (registered mobile backup)
const sendResetOtp = async (req, res, next) => {
  try {
    const { phone, role } = req.body;
    const Model = getModelByRole(role);

    const user = await Model.findOne({ phone });
    if (!user) {
      throw new ApiError(404, 'No account found registered with this phone number');
    }

    const otpCode = env.MOCK_OTP ? env.MOCK_OTP_CODE : generateOTP();
    user.otp = {
      code: otpCode,
      expiresAt: new Date(Date.now() + env.OTP_EXPIRY_MIN * 60000)
    };

    await user.save();
    await sendOTP(phone, otpCode);

    return success(res, null, 'Reset OTP sent successfully');
  } catch (error) {
    next(error);
  }
};

// Reset password via mobile OTP verification
const resetPasswordOtp = async (req, res, next) => {
  try {
    const { phone, role, otp, newPassword } = req.body;
    const Model = getModelByRole(role);

    const user = await Model.findOne({ phone });
    if (!user) {
      throw new ApiError(404, 'User not found');
    }

    // Verify OTP
    const isValid = await verifyOTP(user.otp?.code, otp, user.otp?.expiresAt, phone);
    if (!isValid) {
      throw new ApiError(400, 'Invalid or expired OTP code');
    }

    // Clear OTP & Update password
    user.otp = undefined;
    user.password = newPassword;
    await user.save();

    return success(res, null, 'Password reset successfully using mobile verification');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  registerDoctor,
  registerPatient,
  sendOtp,
  verifyOtp,
  getMe,
  loginWithPassword,
  resetPasswordPasskey,
  sendResetOtp,
  resetPasswordOtp
};
