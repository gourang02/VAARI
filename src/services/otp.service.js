const env = require('../config/env');

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phone, otp) => {
  // Prepend 91 if it's a 10 digit Indian number
  let cleanPhone = phone.trim().replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  console.log(`Sending OTP ${otp} to ${cleanPhone} using MSG91 Widget...`);

  try {
    const response = await fetch('https://api.msg91.com/api/v5/widget/sendOtp', {
      method: 'POST',
      headers: {
        'authkey': '499566Tc6gVexq9q6a72fb0fP1',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        widgetId: '366865685737323631343634',
        identifier: cleanPhone
      })
    });
    const data = await response.json();
    console.log('MSG91 sendOtp response:', data);
  } catch (err) {
    console.error('Failed to send OTP via MSG91 API:', err);
  }
};

const verifyOTP = async (storedOtp, inputOtp, expiresAt, phone) => {
  // Mock support for quick testing
  if (inputOtp === '123456') {
    return true;
  }

  if (!phone) return false;
  let cleanPhone = phone.trim().replace(/\D/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  console.log(`Verifying OTP ${inputOtp} for ${cleanPhone} via MSG91...`);

  try {
    const response = await fetch('https://api.msg91.com/api/v5/widget/verifyOtp', {
      method: 'POST',
      headers: {
        'authkey': '499566Tc6gVexq9q6a72fb0fP1',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        widgetId: '366865685737323631343634',
        otp: inputOtp,
        identifier: cleanPhone
      })
    });
    const data = await response.json();
    console.log('MSG91 verifyOtp response:', data);
    return data.type === 'success' || data.message === 'Number verified successfully';
  } catch (err) {
    console.error('Failed to verify OTP via MSG91 API:', err);
    // Fallback to local stored OTP verification
    if (!storedOtp || !expiresAt) return false;
    if (new Date() > new Date(expiresAt)) return false;
    return storedOtp === inputOtp;
  }
};

module.exports = {
  generateOTP,
  sendOTP,
  verifyOTP
};
