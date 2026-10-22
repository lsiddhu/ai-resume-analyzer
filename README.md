# 🚀 AI Resume ATS Analyzer

An AI-powered resume analysis platform that helps job seekers evaluate their resumes against specific job descriptions. Get an ATS-style compatibility score, identify matching skills, discover missing keywords, and receive AI-generated suggestions to improve your resume.

## ✨ Features

- 🔐 **User Authentication** — Secure registration and login using JWT.
- 📄 **Resume Upload** — Upload resumes in PDF format.
- 📝 **Text Extraction** — Extract relevant information from uploaded resumes.
- 🎯 **Job Description Matching** — Compare your resume with a target job description.
- 🤖 **AI-Powered Analysis** — Generate insights using the Google Gemini API.
- 📊 **ATS-Style Score** — Understand how closely your resume aligns with a job description.
- ✅ **Skill Matching** — Identify skills that match the job requirements.
- 🔍 **Missing Keyword Detection** — Discover important keywords and skills missing from your resume.
- 💡 **Improvement Suggestions** — Get actionable recommendations to improve resume relevance.
- 📚 **Analysis History** — Review previous resume analyses.
- 📱 **Responsive Dashboard** — Access the application across desktop and mobile screens.

## 🛠️ Tech Stack

| Technology | Purpose |
|---|---|
| React.js | Frontend user interface |
| JavaScript | Application logic |
| Tailwind CSS | Styling and responsive design |
| Node.js | Backend runtime |
| Express.js | REST API development |
| MongoDB | Database |
| Mongoose | MongoDB object modeling |
| Google Gemini API | AI-powered resume analysis |
| JWT | Authentication |
| PDF parsing library | Resume text extraction |

## ⚙️ How It Works

1. Register or log in to your account.
2. Upload your resume as a PDF.
3. Enter the job description for the role you're targeting.
4. The backend extracts resume text and processes the job requirements.
5. The AI analyzes the information and generates relevant insights.
6. Review your ATS-style score, matching skills, missing keywords, and improvement suggestions.
7. Revisit previous analyses through your analysis history.

## 📂 Project Structure

```text
ai-resume-analyzer/
├── README.md
└── resume-analyzer/
    ├── client/
    │   ├── public/
    │   ├── src/
    │   └── package.json
    └── server/
        ├── models/
        ├── routes/
        ├── package.json
        └── ...
```

*Note: The structure above is illustrative. Your actual folders and files may differ.*

## 💻 Getting Started

### Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)
- A [MongoDB](https://www.mongodb.com/) database
- A [Google AI Studio API key](https://aistudio.google.com/)

### 1. Clone the Repository

```bash
git clone https://github.com/lsiddhu/ai-resume-analyzer.git
cd ai-resume-analyzer
```

### 2. Set Up the Backend

```bash
cd resume-analyzer/server
npm install
```

Create a `.env` file in the server directory and configure the environment variables required by your backend.

Example placeholders:

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_api_key
```

Use the exact variable names expected by your server code. These names are examples and may need adjustment.

### 3. Set Up the Frontend

Open a second terminal:

```bash
cd resume-analyzer/client
npm install
```

Configure the frontend environment variables required by your application, such as the backend API URL, if applicable.

For a Vite-based React application, this might look like:

```env
VITE_API_URL=http://localhost:5000
```

Check your frontend code to confirm the correct variable name and API URL.

### 4. Run the Application

Start the backend:

```bash
cd resume-analyzer/server
npm run dev
```

Start the frontend in a separate terminal:

```bash
cd resume-analyzer/client
npm run dev
```

These commands assume your `package.json` files define the corresponding `dev` scripts. If not, use the scripts configured in your project.

Open the local frontend URL printed in your terminal.

## 🔒 Environment Variables and Security

- Never commit `.env` files or real API keys to GitHub.
- Keep database credentials and JWT secrets private.
- Configure environment variables separately for production deployments.
- Use `.env.example` files with placeholder values to document required configuration.

## 🎯 Project Goals

This project aims to help job seekers:

- Understand the relevance of their resumes to a target role.
- Identify important skills and keywords they may be missing.
- Improve resume content using actionable feedback.
- Prepare more effectively for job applications.

**Disclaimer:** The ATS-style score is an estimate for guidance, not a guarantee of how a specific employer's applicant tracking system will rank a resume.

## 🚧 Project Status

**Currently in development.**

The application is being developed with a focus on AI integration, resume analysis, secure authentication, and a user-friendly full-stack experience.

## 👨‍💻 Author

**Siddharth Lawand**

Full-Stack Developer | Engineering Student

GitHub: [@lsiddhu](https://github.com/lsiddhu)

---

⭐ If you find this project interesting, consider starring the repository!
