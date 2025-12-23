# New features to implement

## 1. Parent–Child Device Linking & Event Relay (Privacy-First)

### Overview
This feature enables a **secure, privacy-first connection** between a parent’s device and a child’s device.  
All persistent data remains **on-device only**. A lightweight backend (Redis) is used **exclusively as a temporary event relay** to deliver time-sensitive notifications between the two devices.

---

### Core Principles
- **Local-first data storage**: All usage data and history are stored locally using Expo SQLite.
- **No central profiling**: The backend never stores behavioral history or aggregates user data.
- **Ephemeral communication**: Server data exists only for seconds and is automatically deleted.
- **Explicit parental consent**: The parent initiates and controls the connection.

---

### Onboarding & Account Linking

#### Parent Flow
1. Parent completes onboarding and accepts privacy and parental consent.
2. The app generates a **one-time, time-limited linking code** (e.g. 6–8 alphanumeric characters).
3. The code is shared with the child.

#### Child Flow
1. The child installs the app and enters the linking code.
2. The backend validates the code and links the two devices.
3. The code is immediately invalidated.

> The child never self-declares a role.  
> The **parent assigns the relationship**, ensuring policy compliance.

---

### Event Relay Architecture

#### On the Child Device
- Usage metrics and “debt” data are stored locally.
- When a negative event occurs (e.g. debt exceeded), the app sends a **minimal event payload** to the backend.

#### Backend (Redis)
- Acts as a **stateless relay**, not a database.
- Stores events with a very short TTL (e.g. 30–120 seconds).
- Events are non-queryable and automatically expire.

#### On the Parent Device
- Receives a push notification.
- Fetches the event data.
- Saves it locally.
- The event is deleted from Redis (or expires via TTL).

---

### Notifications
- Push notifications are sent via APNs.
- All notifications are triggered server-side.
- No direct device-to-device communication is used.

---

### Privacy & Compliance
- Persistent data: **on device only**
- Server data: **temporary, event-based**
- No silent monitoring
- No system-level tracking
- Clear parental consent and transparent data usage

This design aligns with **Apple App Store policies**, GDPR data minimization principles, and best practices for child-related features.

---

### Positioning
The feature is framed as:
- **Account linking**
- **Supportive parental awareness**
- **Educational feedback**

Not as surveillance or system-level parental control.
