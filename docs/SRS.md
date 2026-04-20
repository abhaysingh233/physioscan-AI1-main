# Software Requirements Specification (SRS)
## PhysioScan AI - Smart Health Intelligence System

### 1. Introduction
**1.1 Purpose**
The purpose of this document is to define the requirements for PhysioScan AI, an intelligent healthcare assistant designed to analyze symptoms, provide dietary recommendations, suggest Ayurvedic remedies, and track user health metrics.

**1.2 Scope**
PhysioScan AI is a web-based application that utilizes AI (Google Gemini) to provide preliminary health guidance. It features user authentication, symptom tracking, medication tracking, a chatbot, and a doctor finder.

### 2. Overall Description
**2.1 Product Perspective**
The system is a standalone web application built with React (Frontend), Express.js (Backend), and SQLite (Database). It integrates with external APIs like Google Gemini for AI analysis.

**2.2 Product Features**
- User Authentication (Signup/Login/Logout)
- AI Symptom Analysis (Top 3 predictions with confidence %)
- Personalized Diet Plans
- Ayurvedic Remedies & Precautions
- Symptom & Medication Tracking with Graphical Visualization
- Smart Health Chatbot
- Location-based Doctor Finder

### 3. Specific Requirements
**3.1 Functional Requirements**
- **FR1:** The system shall allow users to register and log in securely using hashed passwords.
- **FR2:** The system shall accept user symptoms and return the top 3 predicted diseases with confidence percentages.
- **FR3:** The system shall generate a personalized diet plan based on the predicted condition.
- **FR4:** The system shall provide Ayurvedic remedies and precautions.
- **FR5:** The system shall allow users to log daily symptoms and view them on a severity graph.
- **FR6:** The system shall cache the latest analysis in LocalStorage for fast UI rendering.

**3.2 Non-Functional Requirements**
- **Security:** Passwords must be hashed using bcrypt. Inputs must be sanitized to prevent XSS. APIs must be rate-limited.
- **Performance:** The UI should load instantly using LocalStorage caching. AI responses should be processed asynchronously.
- **Usability:** The interface must be responsive and accessible on mobile and desktop devices.
