
import React, { useState } from "react";
import { UploadCloud, HelpCircle } from "lucide-react";
import "./App.css"; 

const API_BASE = "http://127.0.0.1:8000";

export default function FileProcessor() {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("Answer");

  const handleFileUpload = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch(`${API_BASE}/upload/`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    console.log("Upload response:", data);
    setAnswer("File uploaded. You can now ask questions!");
  } catch (err) {
    console.error("Upload error:", err);
    setAnswer("Error uploading file.");
  }
};
  const handleQuestionSubmit = async () => {
  if (!question.trim()) return;
  setAnswer("Thinking...");

  try {
    const res = await fetch(`${API_BASE}/chat/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: question }),
    });

    const data = await res.json();
    setAnswer(data.answer || "No answer found.");
  } catch (err) {
    console.error("Question error:", err);
    setAnswer("Error fetching answer.");
  }
};

  return (
  <div className="min-h-screen bg-[#d7a8a0] flex flex-col items-center justify-center p-28" style={{ fontFamily: '"Press Start 2P"' }}>
       <h1 className="text-3xl p-2 md:text-3xl text-center align-middle text-[#5a0140] mb-10">
       <img src="/robot.png"
        alt="Robot mascot"
        className="w-40 h-40 md:w-36 md:h-36 align-center mx-auto md:mb-5 md:mt-0"
      />
      welcome to the <br /> file processor :)
      </h1>

      <div className="mt-6 text-center mb-10">
        <h2 className="text-2xl font-bold text-black mb-2">upload a file!</h2>
        <p className="text-sm text-[#5a0140] mb-5">allowed file types: <br/> .pdf, .png, .jpeg, .csv</p>
        <label className="cursor-pointer inline-block">
          <div className="bg-yellow-300 w-16 h-16 rounded-full flex items-center justify-center mt-4 hover:scale-105 transition">
            <UploadCloud className="text-black w-8 h-8" />
          </div>
          <input
            type="file"
            accept=".pdf,.png,.jpeg,.jpg,.csv"
            onChange={handleFileUpload}
            className="hidden"
          />
        </label>
      </div>

      <div className="mt-12 text-center w-full">
        <p className="text-white text-2xl mb-20">chat about the file's contents!</p>

        <div className="flex items-center bg-yellow-400 rounded-full p-2 gap-2">
          <HelpCircle className="text-[#5a0140]" />
          <input
            type="text"
            placeholder="Ask a question"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="bg-transparent focus:outline-none text-black flex-1"
          />
          <button onClick={handleQuestionSubmit} className="mt-4 px-6 py-2 bg-[#5a0140] text-white rounded-full hover:bg-[#43002e] transition align-middle">
            Ask
          </button>
        </div>

        <div className="bg-white mt-4 rounded-2xl p-4 shadow text-black">
          {answer}
        </div>
      </div>
    </div>
  );
}