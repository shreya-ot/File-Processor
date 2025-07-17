# File Processor 🤖

A full-stack web app where you upload a file (PDF/image/CSV) and questions about its contents.

## 🧠 Features

- Upload files (.pdf, .csv, .png, .jpg, .jpeg)
- Chat interface to ask questions about the file
- React + Tailwind frontend
- FastAPI backend

## 🛠️ Getting Started

#in a terminal, to start the FastAPI Backend server
    cd backend  
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    uvicorn main:app --reload

#in a new terminal, to start the frontend to upload files on and ask questions
    cd chat
    npm install
    npm start

