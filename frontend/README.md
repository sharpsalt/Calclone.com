<div align="center">
  <h1>🗓️ Cal.com Clone (React Frontend)</h1>
  <p><strong>A beautiful, fully-functional frontend clone of the popular scheduling app, Cal.com.</strong></p>
</div>

<br />

Welcome to the project! If you are new to the codebase, this guide is written specifically for you. It will explain exactly how the app is built, how the data flows, and how to get it running on your own computer in minutes.

---

## 🎯 What is this app?
This application allows a user to share a public booking link (like `cal.com/srijan/15-min-meeting`). Visitors can click that link, see a calendar of available days, pick a specific time slot, and book a meeting. 

Behind the scenes, we have an **Admin Panel** where the owner can:
1. Create new types of meetings (15-min, 30-min).
2. Set their weekly availability (e.g., "I am free Monday 9am-5pm").
3. View all of their upcoming and past bookings.

---

## 🏗️ How does it work? (The Architecture)
Because this is a **frontend-only** project, there is no real backend database (like PostgreSQL or MongoDB). Instead, we use something called **Zustand** to create a "fake" database in the browser's memory.

Here is the tech stack we use:
*   **React (Vite)**: Builds all the UI components.
*   **React Router**: Handles changing pages (going from `/bookings` to `/availability`).
*   **Tailwind CSS (V3)**: Handles all the styling. We use strict custom variables (like `bg-cal-bg-surface`) to keep the design "elite" and pitch-black.
*   **Zustand**: Acts as our database. It stores the bookings, the availability, and the user data instantly.
*   **date-fns**: A magical library that takes care of complex calendar math (like figuring out timezone differences and generating 15-minute time slots).

---

## 🚀 Step-by-Step Setup Guide

Follow these simple steps to run the app on your computer:

### Step 1: Install Node.js
You must have [Node.js](https://nodejs.org/) installed. We recommend version 18 or higher.

### Step 2: Clone the Project
Open your terminal and download the code:
```bash
git clone https://github.com/Aryaneefds/cal-clon.git
cd cal-clon
```

### Step 3: Install the Packages
Tell Node to download all the necessary libraries (like React and Tailwind):
```bash
npm install
```

### Step 4: Start the Server
Start the local development server:
```bash
npm run dev
```

### Step 5: Open the App!
Look at your terminal! It will say something like `http://localhost:5173`. Hold `CTRL` (or `CMD` on Mac) and click that link. The app will open in your browser!

> **Note:** Whenever you make a change in the code and save the file, the browser will automatically refresh!

---

## 📂 Where do I find the code? (Folder Guide)

If you are looking to make changes, here is a map of the `src/` folder so you never get lost:

*   📁 **`src/components/`**
    *   **`booking/`**: Code for the public-facing pages where people actually pick times and book meetings.
    *   **`bookings/`**: Code for the Admin dashboard where the owner views their past meetings.
    *   **`layout/`**: The Sidebar, the Header, and the wrapping container shell.
    *   **`ui/`**: Reusable lego blocks! Buttons, Cards, Inputs, and Switches. Always use these instead of building new ones!
*   📁 **`src/data/`**
    *   **`seed.ts`**: This is our fake "initial database". If you want to change the default user's name or add a fake booking, do it here!
*   📁 **`src/pages/`**
    *   These are the top-level screens (e.g., `AvailabilityPage.tsx`). They simply grab components from the `components/` folder and put them together.
*   📁 **`src/stores/`**
    *   This is our Zustand "database logic". It tracks the memory for everything.
*   📄 **`src/index.css`**
    *   The design system map. Here you will see all the exact hex-colors and configurations that Tailwind uses to build the UI.

---

## 🧠 Understanding the Data Flow

If you are confused about how information moves from one page to another without a backend, here is the secret:

1. **The Stores (`src/stores/*.ts`)**: We have three main stores: `useBookingStore`, `useAvailabilityStore`, and `useEventTypeStore`.
2. **Reading Data**: Any component can "read" from a store. For example, the `BookingCalendar` asks the `useAvailabilityStore`: *"Hey, is the owner free on Mondays?"*
3. **Writing Data**: Any component can "write" to a store. If an admin turns off Mondays in the `AvailabilityPage`, it fires a function inside the store.
4. **Instant Updates**: Because Zustand connects them both, the moment the admin turns off Mondays, the `BookingCalendar` instantly blocks off Mondays for all users!

---

## 🚀 Building for Deployment
When you are totally done coding and want to upload this to the internet (like Vercel), run this command:
```bash
npm run build
```
This shrinks all the code into tiny, unreadable files inside a `dist/` folder that servers can load instantly.

Happy Coding! 🎉
