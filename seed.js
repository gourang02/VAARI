const mongoose = require('mongoose');
const User = require('./src/models/User');
const Doctor = require('./src/models/Doctor');
const Slot = require('./src/models/Slot');
const Booking = require('./src/models/Booking');
const Queue = require('./src/models/Queue');
const env = require('./src/config/env');

const seedDatabase = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(env.MONGODB_URI);
    console.log('Connected to MongoDB successfully.');

    // Clear existing collection data
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Slot.deleteMany({});
    await Booking.deleteMany({});
    await Queue.deleteMany({});
    console.log('Cleared existing database entries.');

    // Today's date object
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 1. Seed pilot patients
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
    console.log(`Seeded ${patients.length} patients.`);

    // 2. Seed comprehensive pathology labs / clinics database
    const rawLabs = [
      // Noida Labs
      {
        name: 'Metro Pathology & Diagnostics',
        phone: '9876543201',
        email: 'metro.noida@example.com',
        specialization: 'Blood Test, Thyroid, CBC, KFT, LFT, Sugar Test, Ultrasound',
        photo: 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?q=80&w=200',
        fee: 300,
        clinicName: 'Metro Pathology & Diagnostics',
        address: 'B-34, Block B, Sector 62, Noida',
        city: 'noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        tokenStart: 15,
        waitTime: 10,
        lat: 28.6284,
        lng: 77.3769
      },
      {
        name: 'Dr. Lal PathLabs Noida',
        phone: '9876543202',
        email: 'drlal.noida@example.com',
        specialization: 'Blood Test, Thyroid, CBC, Sugar Test, X-ray, CT Scan',
        photo: 'https://images.unsplash.com/photo-1581091923865-358c3c767228?q=80&w=200',
        fee: 400,
        clinicName: 'Dr. Lal PathLabs Noida',
        address: 'Plot 12, Sector 63, Noida',
        city: 'noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        tokenStart: 28,
        waitTime: 18,
        lat: 28.6270,
        lng: 77.3820
      },
      {
        name: 'Apollo Diagnostics Noida',
        phone: '9876543203',
        email: 'apollo.noida@example.com',
        specialization: 'Blood Test, CBC, KFT, Sugar Test, MRI, Ultrasound, ECG',
        photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200',
        fee: 500,
        clinicName: 'Apollo Diagnostics Noida',
        address: 'Commercial Complex, Sector 62, Noida',
        city: 'noida',
        state: 'Uttar Pradesh',
        pincode: '201301',
        tokenStart: 9,
        waitTime: 5,
        lat: 28.6250,
        lng: 77.3700
      },
      // Delhi Labs
      {
        name: 'Max Lab Connaught Place',
        phone: '9876543204',
        email: 'max.delhi@example.com',
        specialization: 'Blood Test, Thyroid, CBC, Sugar Test, Ultrasound, MRI, X-ray',
        photo: 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?q=80&w=200',
        fee: 450,
        clinicName: 'Max Lab Connaught Place',
        address: '12, Radial Road 3, CP, New Delhi',
        city: 'delhi',
        state: 'Delhi',
        pincode: '110001',
        tokenStart: 42,
        waitTime: 25,
        lat: 28.6304,
        lng: 77.2177
      },
      {
        name: 'Dr. Dangs Lab CP',
        phone: '9876543205',
        email: 'dangs.delhi@example.com',
        specialization: 'Blood Test, Thyroid, CBC, KFT, LFT, Sugar Test, ECG, EEG',
        photo: 'https://images.unsplash.com/photo-1581091923865-358c3c767228?q=80&w=200',
        fee: 600,
        clinicName: 'Dr. Dangs Lab CP',
        address: 'Block H, Connaught Place, New Delhi',
        city: 'delhi',
        state: 'Delhi',
        pincode: '110001',
        tokenStart: 11,
        waitTime: 6,
        lat: 28.6280,
        lng: 77.2150
      },
      // Gurgaon Labs
      {
        name: 'Medanta Labs Gurgaon',
        phone: '9876543206',
        email: 'medanta.gurgaon@example.com',
        specialization: 'Blood Test, Thyroid, CBC, KFT, LFT, Sugar Test, Ultrasound, CT Scan, MRI',
        photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200',
        fee: 550,
        clinicName: 'Medanta Labs Gurgaon',
        address: 'Sector 45, Near Huda Market, Gurugram',
        city: 'gurgaon',
        state: 'Haryana',
        pincode: '122003',
        tokenStart: 22,
        waitTime: 12,
        lat: 28.4595,
        lng: 77.0266
      },
      {
        name: 'SRL Diagnostics Sector 45',
        phone: '9876543207',
        email: 'srl.gurgaon@example.com',
        specialization: 'Blood Test, CBC, Sugar Test, X-ray, ECG, EEG',
        photo: 'https://images.unsplash.com/photo-1579684389782-64d84b5e905d?q=80&w=200',
        fee: 350,
        clinicName: 'SRL Diagnostics Sector 45',
        address: 'Block C, Sector 45, Gurugram',
        city: 'gurgaon',
        state: 'Haryana',
        pincode: '122003',
        tokenStart: 7,
        waitTime: 4,
        lat: 28.4610,
        lng: 77.0300
      },
      // Mumbai Labs
      {
        name: 'Suburban Diagnostics Andheri',
        phone: '9876543208',
        email: 'suburban.mumbai@example.com',
        specialization: 'Blood Test, Thyroid, CBC, Sugar Test, Ultrasound, X-ray, MRI, CT Scan',
        photo: 'https://images.unsplash.com/photo-1581091923865-358c3c767228?q=80&w=200',
        fee: 500,
        clinicName: 'Suburban Diagnostics Andheri',
        address: 'Link Road, Andheri West, Mumbai',
        city: 'mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        tokenStart: 31,
        waitTime: 20,
        lat: 19.1136,
        lng: 72.8697
      },
      {
        name: 'Metropolis Healthcare Mumbai',
        phone: '9876543209',
        email: 'metropolis.mumbai@example.com',
        specialization: 'Blood Test, CBC, KFT, Sugar Test, ECG, EEG, Ultrasound',
        photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=200',
        fee: 400,
        clinicName: 'Metropolis Healthcare Mumbai',
        address: 'Veera Desai Road, Andheri West, Mumbai',
        city: 'mumbai',
        state: 'Maharashtra',
        pincode: '400053',
        tokenStart: 16,
        waitTime: 10,
        lat: 19.1200,
        lng: 72.8750
      }
    ];

    for (const raw of rawLabs) {
      // 1. Save doctor/lab profile
      const doctor = new Doctor({
        phone: raw.phone,
        name: raw.name,
        email: raw.email,
        photo: raw.photo,
        specialization: raw.specialization,
        qualifications: ['ISO 9001 Certified', 'Pathology Lab Board'],
        registrationNumber: `REG-${raw.phone.slice(6)}`,
        experience: 10,
        consultationFee: raw.fee,
        avgConsultationMin: 15,
        clinic: {
          name: raw.clinicName,
          address: raw.address,
          city: raw.city,
          state: raw.state,
          pincode: raw.pincode,
          lat: raw.lat,
          lng: raw.lng
        },
        bankDetails: {
          accountNumber: `50100${raw.phone.slice(3)}`,
          ifscCode: 'HDFC0001234',
          bankName: 'HDFC Bank',
          upiId: `${raw.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`
        },
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=upi://pay?pa=${raw.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi%26pn=${encodeURIComponent(raw.name)}`,
        verificationStatus: 'approved',
        isAvailable: true,
        rating: 4.5 + Math.random() * 0.5,
        totalRatings: 50 + Math.floor(Math.random() * 200)
      });
      await doctor.save();

      // 2. Create Slots for today
      const morningSlot = new Slot({
        doctorId: doctor._id,
        date: today,
        startTime: '09:00',
        endTime: '13:00',
        batchSize: 10,
        bufferSlots: 2,
        maxTokens: 50,
        totalBatches: 5,
        bookedCount: 5,
        isActive: true
      });
      await morningSlot.save();

      const eveningSlot = new Slot({
        doctorId: doctor._id,
        date: today,
        startTime: '15:00',
        endTime: '19:00',
        batchSize: 10,
        bufferSlots: 2,
        maxTokens: 50,
        totalBatches: 5,
        bookedCount: 0,
        isActive: true
      });
      await eveningSlot.save();

      // 3. Create active queue record
      const queue = new Queue({
        doctorId: doctor._id,
        date: today,
        slotId: morningSlot._id,
        currentToken: raw.tokenStart,
        nextToken: raw.tokenStart + 1,
        currentBatch: Math.ceil(raw.tokenStart / 10),
        status: 'active',
        completedTokens: [],
        skippedTokens: [],
        avgWaitMinutes: raw.waitTime
      });
      await queue.save();

      // 4. Create bookings for patient pilot records (first 5 patients confirmed)
      for (let i = 0; i < patients.length; i++) {
        const tokenNumber = i + 1;
        const booking = new Booking({
          patientId: patients[i]._id,
          doctorId: doctor._id,
          slotId: morningSlot._id,
          tokenNumber,
          batchNumber: 1,
          status: tokenNumber === 1 ? 'active' : 'confirmed',
          bookingDate: today,
          paymentStatus: 'free'
        });
        await booking.save();
      }

      console.log(`Successfully Seeded & Created Live Queues for Lab: ${doctor.name} (${raw.city.toUpperCase()})`);
    }

    console.log('Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding database failed:', error);
    process.exit(1);
  }
};

seedDatabase();
