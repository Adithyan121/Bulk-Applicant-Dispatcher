# Bulk Applicant Dispatcher 🚀

Bulk Applicant Dispatcher is a locally hosted web application designed to help freshers and job seekers systematically send multiple job applications via email. Since it operates entirely on your localhost, you retain 100% control over your data and privacy. 

The application utilizes your standard Gmail account (via Google App Passwords) to bulk dispatch tailored emails to recruiters and companies. It ensures you maintain a professional application schedule by enforcing a cooldown period (default 15 days), preventing accidental duplicate emails to the same address. However, it also includes a "Force Send" override for urgent or special cases.

## Key Features ✨

* **100% Privacy:** Runs completely locally. Your emails, templates, and contacts never leave your computer.
* **Smart Cooldown Period:** Automatically tracks who you've emailed and prevents duplicate applications to the same email address within 15 days.
* **Editable Text Templates:** Write standard, easy-to-read English templates directly in the app. No HTML knowledge required!
* **Easy Contact Management:** Add companies manually through the UI or bulk import them using a JSON file.
* **Application History:** View your full application history and monitor pending applications directly from the dashboard.
* **Force Sending:** Need to bypass the cooldown period? Easily force send individual emails or entire batches.

---

## Technical Requirements ⚙️

Before you begin, ensure you have the following installed on your system:

* **[Node.js](https://nodejs.org/)** (v14 or higher recommended)
* **[MongoDB](https://www.mongodb.com/try/download/community)** (Local installation)
* **[MongoDB Compass](https://www.mongodb.com/products/compass)** (Recommended for viewing your local database. *Alternatively, use MongoDB Atlas if you prefer cloud storage.*)
* **An IDE** like [Visual Studio Code](https://code.visualstudio.com/)

---

## Initial Setup & Configuration 🛠️

### 1. Configure the Environment File (`.env`)

Create a `.env` file inside the root of the **`server`** directory (`server/.env`). Fill it out exactly like this:

```env
EMAIL_USER=your_real_email_id@gmail.com
EMAIL_PASS=your_gmail_app_password
MONGO_URI=mongodb://localhost:27017/bulk_email_sender
PORT=3000
resumePath=your_resume_name.pdf 
```

**Understanding `EMAIL_PASS` (Important!):**
You **cannot** use your standard Gmail password. You must generate an App Password.
1. Go to your Google Account Settings.
2. Navigate to **Security** -> **2-Step Verification**.
3. Scroll down to **App passwords**.
4. Generate a new app password for "Other (Custom name)" (e.g., call it "BulkApp").
5. Paste the generated 16-character password into the `.env` file (no spaces).

**Understanding `resumePath`:**
If you name your resume `Resume.pdf`, you can leave this blank. Otherwise, specify the exact filename (e.g., `resumePath=John_Doe_Resume.pdf`). Make sure your resume file is placed inside the `server/resumes` folder.

### 2. Configure Your Profile

Create a `profile.json` file inside the **`server`** directory (`server/profile.json`). This data will be used to auto-fill your email templates. 

```json
{
  "name": "Your Full Name",
  "my_place": "Your City, Country",
  "phone_no": "+91 1234567890",
  "my_email": "your_email_id@gmail.com"
}
```

---

## How to Install 💻

1. **Clone or Download the Repository:**
   Extract the project folder and open it in Visual Studio Code.

2. **Install Backend Dependencies:**
   Open a terminal, navigate to the `server` folder, and run npm install:
   ```bash
   cd server
   npm install
   ```

3. **Install Frontend Dependencies:**
   Open a second terminal, navigate to the `client` folder, and run npm install:
   ```bash
   cd client
   npm install
   ```

---

## How to Run & Use the Application 🏃‍♂️

You need to run both the backend server and the frontend client simultaneously.

**Step 1: Start the Backend (Terminal 1)**
```bash
cd server
npm start
```
*You should see a message confirming the server is running and connected to MongoDB.*

**Step 2: Start the Frontend (Terminal 2)**
```bash
cd client
npm run dev
```

**Step 3: Access the Application**
Open your browser and navigate to the local URL provided by the Vite terminal (usually `http://localhost:5173/`).

### Usage Workflow

1. **Add Your Contacts:** Click **"Add Company"** to enter recipient details manually, or use **"Import JSON"** to upload a list. Note: A `companies.json` file is generated automatically in the server folder as you add contacts.
2. **Review Templates:** Click **"Templates"** to edit or create your custom cover letters in plain English.
3. **Dispatch Emails:** 
   - Ensure your resume is in `server/resumes/`.
   - Click **"Start Run"**. Select your desired template from the dropdown. Only eligible contacts (those past the cool-off period) will receive an email.
4. **Override Cooldown (If needed):** Use the ⚡ icon on a specific contact to force send an email immediately, or use **"Force All ⚡"** in the top bar to blast everyone in your list regardless of cooldown.
5. **View History:** Click **"History"** to review a timestamped log of all successful email dispatches.

---

## License 📄

This project is licensed under the [MIT License](LICENSE).
