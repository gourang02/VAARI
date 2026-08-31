# 🏥 Vaari — Your Turn, On Time.

> A smart clinic appointment and real-time queue management platform designed to reduce patient waiting time and help clinics manage their daily patient flow efficiently.

![Vaari](https://img.shields.io/badge/Vaari-Clinic%20Queue%20Management-blue)
![React](https://img.shields.io/badge/Frontend-React.js-61DAFB)
![React Native](https://img.shields.io/badge/Mobile-React%20Native-61DAFB)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933)
![Express](https://img.shields.io/badge/API-Express.js-000000)
![MongoDB](https://img.shields.io/badge/Database-MongoDB-47A248)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6)

---


## 📌 Overview

**Vaari** is a digital clinic appointment and queue management platform built to solve one of the most common problems faced by patients at clinics — **unnecessary waiting**.

In a traditional clinic, patients often have to sit in a waiting room without knowing:

- How many patients are ahead of them
- When their turn will come
- How long the doctor is going to take
- Whether they should leave for the clinic yet
- Whether the queue is moving normally

Vaari converts this traditional physical queue into a **digital, trackable, and intelligent queue**.

Patients can book appointments, receive digital tokens, track the live queue, view estimated waiting time, and receive notifications.

Clinics get a dedicated dashboard to manage appointments, tokens, queues, patient flow, and operational analytics.

---

# 🎯 Problem Statement

Small and neighborhood clinics frequently rely on manual appointment registers and physical queues.

This creates several problems:

- 🕐 Long and unpredictable waiting times
- 🏥 Overcrowded waiting rooms
- 😓 Poor patient experience
- 📋 Manual appointment management
- 🎟️ Inefficient token handling
- 📞 Repeated calls from patients asking about their turn
- 📊 Lack of useful clinic analytics
- ❌ Missed appointments and no-shows

### 💡 The Goal

Vaari aims to create a **digital bridge between patients and clinics** by providing real-time appointment and queue visibility.

---

# 💡 Our Solution

Vaari provides two connected experiences:

### 👤 Patient Application

A mobile-first experience where patients can:

- Find/select a clinic
- View doctor availability
- Book an appointment
- Receive a digital token
- Track their position in the queue
- View estimated waiting time
- Receive notifications
- Know when it is time to leave for the clinic

### 🩺 Clinic Dashboard

A dedicated dashboard for doctors and clinic staff to:

- Manage appointments
- Manage daily queues
- Call the next patient
- Skip or manage tokens
- Monitor active patients
- Track waiting times
- View operational analytics

---
🛠️ Technology Stack
📱 Patient Mobile Application
React Native
Expo
TypeScript
🖥️ Clinic Dashboard
React.js
TypeScript
HTML5
CSS3
⚙️ Backend
Node.js
Express.js
TypeScript
REST APIs
🗄️ Database
MongoDB
Mongoose
🔐 Authentication
JWT Authentication
Role-Based Access Control
⚡ Real-Time Communication
Socket.IO
💳 Payments
Razorpay
🤖 AI / Machine Learning
Python
Predictive Analytics
Linear Regression
Random Forest
Feature Engineering
Model-based Predictions
🧰 Development Tools
Git
GitHub
VS Code
Postman
npm
☁️ Deployment
Vercel
Render
MongoDB Atlas
🔐 Security

Vaari follows a structured authentication and authorization approach.

Authentication

JWT-based authentication is used to securely identify users.

# ✨ Key Features

## 👤 Patient Features

### 📱 Patient Registration & Authentication

Patients can securely create an account and access their appointments and queue information.

### 🏥 Clinic Discovery

Patients can find and select the clinic they want to visit.

### 📅 Appointment Booking

Patients can select an available appointment slot and book their visit.

### 🎟️ Digital Token System

After booking, the patient receives a digital queue token.

Instead of physically standing in line, the patient can track the token digitally.

### 🔴 Real-Time Queue Tracking

Patients can see:

- Current active token
- Their token number
- Number of patients ahead
- Queue progress
- Estimated waiting time

### ⏱️ Waiting-Time Estimation

The system estimates how long the patient may need to wait based on the current queue.

### 🔔 Smart Notifications

Patients can receive updates about:

- Appointment confirmation
- Queue movement
- Upcoming turn
- Appointment reminders
- Token status

The notification layer can support:

- Push notifications
- WhatsApp
- SMS

### 🏠 Wait Anywhere

Patients don't necessarily need to spend their entire waiting time inside the clinic.

They can monitor the queue remotely and arrive closer to their expected consultation time.

---

# 🩺 Clinic / Doctor Dashboard

Vaari provides a centralized dashboard for clinic staff.

## 🎟️ Queue Management

Clinic staff can:

- View today's queue
- See the active token
- Call the next patient
- Skip a patient
- Manage token flow
- Track completed consultations
- Monitor waiting patients

## 📅 Appointment Management

Clinics can:

- View upcoming appointments
- Manage availability
- Track booked slots
- Manage patient schedules

## 📊 Clinic Analytics

The dashboard can provide useful operational insights:

| Metric | Purpose |
|---|---|
| 👥 Daily Patients | Monitor patient volume |
| ⏱️ Average Waiting Time | Measure queue efficiency |
| 📈 Peak Hours | Identify high-demand periods |
| 🎟️ Token Flow | Monitor queue movement |
| ❌ No-Show Rate | Track missed appointments |
| 🩺 Consultation Time | Analyze clinic workflow |

---
🤖 AI / Machine Learning Layer

Vaari is designed with an AI/ML layer to make the clinic queue more intelligent.

The collected appointment and queue data can be used to generate predictive insights.

⏱️ Waiting-Time Prediction

Historical consultation and queue data can be used to estimate the expected waiting time for a patient.

Potential inputs include:

Current queue length
Average consultation duration
Number of patients ahead
Historical clinic data
Time of day

The goal is to provide a more useful waiting-time estimate than a simple token count.

❌ No-Show Prediction

Machine learning can be used to estimate the likelihood of a patient missing their appointment.

This can help clinics:

Identify high-risk appointments
Send reminders
Improve appointment utilization
Reduce unused slots
📈 Rush-Hour Prediction

Historical appointment data can be analyzed to identify periods when a clinic is likely to experience higher patient traffic.

This can help clinics plan:

Staffing
Appointment capacity
Queue management


# ⚡ Real-Time Queue Management

Real-time queue synchronization is one of the core concepts of Vaari.

When the clinic updates the queue, connected patients can receive the latest queue state without repeatedly refreshing the application.

### Example

```text
Patient A → Token 21
Patient B → Token 22
Patient C → Token 23
Patient D → Token 24
