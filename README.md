# 🚀 LaraMeet - Next Gen Video Conferencing

**LaraMeet** is a premium, high-performance video conferencing application built for seamless communication. Engineered with a sleek, minimalist aesthetic and enterprise-grade security, LaraMeet brings the power of professional meetings to your browser.

> **Project Mission**: To provide a beautiful, secure, and reliable communication platform for everyone.

---

## 👨‍💻 Developed By
**Author**: [FarookHriody](https://farookhridoy.com)  
**Official Websites**:  
- [farookhridoy.com](https://farookhridoy.com)  
- [thelarasoft.com](https://thelarasoft.com)

---

## ✨ Features

### 🛡️ Administrative & Security Control
- **Lobby System**: Guests are held in a waiting room until explicitly admitted by the Host or Co-host.
- **Role-Based Access (RBAC)**: Clear hierarchy with **Host**, **Co-host**, and **Participant** roles.
- **Screen Share Lock**: Hosts can restrict screen sharing to prevent "screen-bombing".
- **Instant Muting**: Admin-level control to mute any participant instantly.
- **Member Management**: Remove unauthorized users or delegate Co-host powers.

### 🎥 High-Performance Media
- **Crystal Clear Video/Audio**: Powered by LiveKit for low-latency, high-definition streams.
- **Local Recording**: Record your meetings locally (Free) with Host-controlled permissions.
- **Real-time Status**: Visible "Speaking", "Muted", and Admin indicators.
- **"Ask to Unmute"**: Intelligent notification system with audible alerts for participants.

### 💬 Collaborative Tools
- **Rich Chat**: Support for public messages and secure **Private Messaging**.
- **File Attachments**: Share documents and images instantly with automatic server-side cleanup for privacy.
- **Interactive Notes**: Take meeting notes that stay synced throughout the session.
- **Meeting Summary**: Automatic generation of chat history and notes for the Host upon exit.

### 📅 Scheduling & Integration
- **Google Calendar Integration**: Schedule your LaraMeet sessions directly into your Google Calendar.
- **One-Click Meetings**: Start instant sessions or create links for later.

---

## 🚀 How to Use

### 1. Starting a Meeting
1. Visit the Home Page.
2. Click **"New meeting"**.
3. Choose **"Start an instant meeting"** to go live immediately, or **"Create a meeting for later"** to get a shareable link.

### 2. Joining a Meeting
1. Enter the shared **Meeting Code** on the Home Page.
2. Enter your name and click **"Join now"**.
3. If the host has a lobby active, wait for a few moments for them to admit you.

### 3. Managing a Meeting (For Hosts)
- Open the **People** tab in the side panel to manage participants.
- Use the **Settings/More Options** menu to Lock/Unlock screen sharing and recording permissions.
- Click the **Phone** icon to leave or end the meeting for everyone.

---

## 🏢 Facilities & Architecture

- **Frontend**: Crafted with **Next.js**, **React**, and **Tailwind CSS** for a stunning, responsive UI.
- **Backend**: Robust **Laravel** API for meeting management, token generation, and file handling.
- **Real-time Engine**: Integrated with **LiveKit** for enterprise-grade WebRTC performance.
- **Storage**: Secure file handling with automatic "Self-Destruct" cleanup for all meeting attachments.

---

## 📸 Snapshots

### 🏠 Home Page
![Home Page Mockup](https://raw.githubusercontent.com/FarookHriody/LaraMeet/main/docs/home-page.png)
*A minimalist, dark-themed home page with Google Calendar integration and quick-join fields.*

### 🎥 Meeting Interface
![Meeting Interface Mockup](https://raw.githubusercontent.com/FarookHriody/LaraMeet/main/docs/meeting-ui.png)
*Sleek video grid with glassmorphism controls and real-time participant management.*

### 📅 Google Calendar Setup
![Calendar Integration](https://raw.githubusercontent.com/FarookHriody/LaraMeet/main/docs/calendar.png)
*Direct integration to schedule professional meetings with a single click.*

---

## 🛠️ Installation (For Developers)

1. Clone the repository.
2. Setup the **Laravel Backend**:
   - `composer install`
   - Configure `.env` with LiveKit credentials.
   - `php artisan serve`
3. Setup the **Next.js Frontend**:
   - `npm install`
   - Configure `.env.local` with Backend and LiveKit URLs.
   - `npm run dev`

---

© 2026 LaraMeet - Powered by [TheLaraSoft](https://thelarasoft.com)
