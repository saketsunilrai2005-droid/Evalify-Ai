# 🚀 Evalify AI

AI-Powered Exam Answer Evaluator

Evalify AI is a full-stack web application that automates the evaluation of student answer sheets using AI. Faculty can upload question papers, rubrics, and answer sheets, and receive structured marks with detailed feedback.

---

## 🧠 Features

- Upload question paper, rubric, and answer sheets  
- AI evaluation (handwritten + typed answers)  
- Automatic marks assignment based on rubric  
- Per-student detailed feedback  
- Bulk processing of answer sheets  
- Export results as PDF and CSV  
- Dashboard for tracking evaluations  

---

## 🏗️ Tech Stack

Frontend: React (Vite), Zustand, Axios  
Backend: Node.js, Express.js, Multer  
AI: Claude Vision API (Anthropic)  
Database: Supabase (PostgreSQL + Storage)  

---

## 📂 Project Structure

evalify-ai/
├── client/
├── server/
├── supabase/
├── e2e/

---

## ⚙️ Setup

1. Clone
git clone https://github.com/Subha12125/Evalify-Ai.git
cd evalify-ai

2. Backend
cd server
npm install

Create .env:
PORT=5000
ANTHROPIC_API_KEY=your_key
SUPABASE_URL=your_url
SUPABASE_SERVICE_KEY=your_key

Run:
npm run dev

3. Frontend
cd client
npm install

Create .env:
VITE_API_URL=http://localhost:5000
VITE_SUPABASE_URL=your_url
VITE_SUPABASE_ANON_KEY=your_key

Run:
npm run dev

---

## 🔄 Workflow

1. Upload exam files  
2. Backend processes files  
3. AI evaluates answers  
4. Marks & feedback generated  
5. Results stored in database  
6. Display & export results  

---

## 📊 API

POST /api/evaluate  
GET /api/exams  
GET /api/results/:examId  
GET /api/results/:examId/export/pdf  
GET /api/results/:examId/export/csv  

---

## 🔒 Security

- API keys stored in backend .env  
- Never expose secrets to frontend  

---

## 📌 Status

In Development

---

## 📄 License

MIT