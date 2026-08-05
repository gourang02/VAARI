const mongoose = require('mongoose');
const env = require('./env');

const connectDB = async () => {
  try {
    // Strip any accidental surrounding quotes from the URI
    const rawUri = (process.env.MONGODB_URI || env.MONGODB_URI || '').replace(/^["']|["']$/g, '');

    if (!rawUri || (!rawUri.startsWith('mongodb://') && !rawUri.startsWith('mongodb+srv://'))) {
      throw new Error(`Invalid MONGODB_URI: "${rawUri}". Must start with mongodb:// or mongodb+srv://`);
    }

    const conn = await mongoose.connect(rawUri, {
      serverSelectionTimeoutMS: 10000
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    process.exit(1);
  }
};



const autoSeed = async () => {
  try {
    const User = require('../models/User');
    const Doctor = require('../models/Doctor');
    const Slot = require('../models/Slot');
    const Booking = require('../models/Booking');
    const Queue = require('../models/Queue');

    // Create a pilot doctor
    const doctor = new Doctor({
      phone: '9876543210',
      name: 'Rahul Sharma',
      email: 'dr.rahul@example.com',
      photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200&auto=format&fit=crop',
      specialization: 'General Physician',
      qualifications: ['MBBS', 'MD - Internal Medicine'],
      registrationNumber: 'MCI-12345',
      experience: 12,
      consultationFee: 500,
      avgConsultationMin: 15,
      clinic: {
        name: 'Sharma Health Clinic',
        address: '102, Green Heights, Linking Road',
        city: 'Mumbai',
        state: 'Maharashtra',
        pincode: '400054'
      },
      verificationStatus: 'approved',
      isAvailable: true,
      rating: 4.8,
      totalRatings: 154
    });
    await doctor.save();

    // Create slots for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const morningSlot = new Slot({
      doctorId: doctor._id,
      date: today,
      startTime: '09:00',
      endTime: '13:00',
      batchSize: 10,
      bufferSlots: 2,
      maxTokens: 16,
      totalBatches: 2,
      bookedCount: 5,
      isActive: true
    });

    const eveningSlot = new Slot({
      doctorId: doctor._id,
      date: today,
      startTime: '15:00',
      endTime: '19:00',
      batchSize: 10,
      bufferSlots: 2,
      maxTokens: 16,
      totalBatches: 2,
      bookedCount: 0,
      isActive: true
    });

    await morningSlot.save();
    await eveningSlot.save();

    // Create patients
    const patientData = [
      { name: 'Amit Kumar', phone: '9000000001' },
      { name: 'Priya Patel', phone: '9000000002' },
      { name: 'Suresh Raina', phone: '9000000003' },
      { name: 'Neha Gupta', phone: '9000000004' },
      { name: 'Vikram Singh', phone: '9000000005' }
    ];

    const patients = [];
    for (const data of patientData) {
      const patient = new User({
        phone: data.phone,
        name: data.name,
        email: `${data.name.toLowerCase().replace(' ', '.')}@example.com`,
        role: 'patient',
        isActive: true
      });
      await patient.save();
      patients.push(patient);
    }

    // Create bookings for morning slot
    for (let i = 0; i < patients.length; i++) {
      const tokenNumber = i + 1;
      const batchNumber = Math.ceil(tokenNumber / morningSlot.batchSize);
      
      const booking = new Booking({
        patientId: patients[i]._id,
        doctorId: doctor._id,
        slotId: morningSlot._id,
        tokenNumber,
        batchNumber,
        status: tokenNumber === 1 ? 'active' : 'confirmed', // first patient active
        bookingDate: today,
        paymentStatus: 'free'
      });
      await booking.save();
    }

    // Create a live queue for today morning slot
    const queue = new Queue({
      doctorId: doctor._id,
      date: today,
      slotId: morningSlot._id,
      currentToken: 1,
      nextToken: 2,
      currentBatch: 1,
      status: 'active',
      completedTokens: [],
      skippedTokens: [],
      avgWaitMinutes: 15
    });
    await queue.save();
  } catch (err) {
    console.error('Error during auto-seeding:', err);
  }
};

module.exports = { connectDB };
