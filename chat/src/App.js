import React, { useState, useRef, useEffect } from "react";
import { UploadCloud, HelpCircle, File, Check, Loader2 } from "lucide-react";
import "./App.css";

const API_BASE = "http://127.0.0.1:8000";

export default function FileProcessor() {
  const [question, setQuestion] = useState("");
  const [chatHistory, setChatHistory] = useState([]);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, processing, success, error
  const [isDragOver, setIsDragOver] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [question]);

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatHistory]);

  const handleFileUpload = async (file) => {
    if (!file) return;

    setUploadedFile(file);
    setUploadStatus('processing');
    setChatHistory([]); // Clear chat history when new file is uploaded

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${API_BASE}/upload/`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      console.log("Upload response:", data);
      setUploadStatus('success');
      
      // Add system message to chat history
      setChatHistory([{
        id: Date.now(),
        type: 'system',
        content: `File "${file.name}" has been processed successfully. You can now ask questions about its content.`,
        timestamp: new Date().toISOString()
      }]);
    } catch (err) {
      console.error("Upload error:", err);
      setUploadStatus('error');
      setChatHistory([{
        id: Date.now(),
        type: 'system',
        content: 'Error processing file. Please try uploading again.',
        timestamp: new Date().toISOString()
      }]);
    }
  };

  const handleFileInputChange = (e) => {
    const file = e.target.files[0];
    handleFileUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileUpload(file);
    }
  };

  const handleQuestionSubmit = async () => {
    if (!question.trim() || uploadStatus !== 'success') return;
    
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: question.trim(),
      timestamp: new Date().toISOString()
    };

    // Add user message to chat history
    setChatHistory(prev => [...prev, userMessage]);
    setQuestion("");
    setIsTyping(true);

    try {
      const res = await fetch(`${API_BASE}/chat/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ 
          q: question.trim(),
          chat_history: chatHistory // Send chat history to backend for context
        }),
      });

      const data = await res.json();
      
      // Add bot response to chat history
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.answer || "No answer found.",
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => [...prev, botMessage]);
    } catch (err) {
      console.error("Question error:", err);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: "Error fetching answer. Please try again.",
        timestamp: new Date().toISOString()
      };

      setChatHistory(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleQuestionSubmit();
    }
  };

  const getUploadStatusMessage = () => {
    switch (uploadStatus) {
      case 'processing':
        return "Processing...";
      case 'success':
        return "File processed, you may ask questions now!";
      case 'error':
        return "Error processing file. Please try again.";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-200 to-purple-200 flex flex-col items-center justify-center p-8">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            File Processor
          </h1>
        </div>

        {/* Upload Section */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-8">
          <div className="text-center mb-6">
            <h2 className="text-lg font-medium text-gray-800 mb-6">
              Upload your PDF, CSV, or image
            </h2>
            
            <div
              className={`relative border-2 border-dashed rounded-lg p-8 transition-all cursor-pointer ${
                isDragOver
                  ? 'border-purple-400 bg-purple-50'
                  : 'border-pink-200 hover:border-pink-300 hover:bg-pink-50'
              }`}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center">
                  <UploadCloud className="w-8 h-8 text-purple-600" />
                </div>
                <div>
                  <p className="text-gray-700 font-medium">
                    Click to upload or drag and drop a file here
                  </p>
                  <p className="text-gray-500 text-sm mt-1">
                    .pdf, .png, .jpeg, .jpg, .csv files supported
                  </p>
                </div>
              </div>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.png,.jpeg,.jpg,.csv"
                onChange={handleFileInputChange}
                className="hidden"
              />
            </div>
          </div>

          {/* Upload Status */}
          {uploadStatus !== 'idle' && (
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center space-x-2">
                {uploadStatus === 'processing' && (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-600" />
                )}
                {uploadStatus === 'success' && (
                  <Check className="w-5 h-5 text-green-600" />
                )}
                <span className={`text-sm font-medium ${
                  uploadStatus === 'success' ? 'text-green-600' : 
                  uploadStatus === 'error' ? 'text-red-600' : 'text-purple-600'
                }`}>
                  {getUploadStatusMessage()}
                </span>
              </div>
              
              {uploadedFile && (
                <div className="flex items-center justify-center space-x-2 text-gray-600">
                  <File className="w-4 h-4" />
                  <span className="text-sm">{uploadedFile.name}</span>
                  <span className="text-xs text-gray-500">
                    ({(uploadedFile.size / 1024).toFixed(1)} KB)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Chat History Section */}
        {chatHistory.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Conversation</h3>
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {chatHistory.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${
                    message.type === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.type === 'system' ? (
                    <div className="w-full bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-100">
                      <p className="text-sm text-purple-700 text-center">{message.content}</p>
                    </div>
                  ) : (
                    <div
                      className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg ${
                        message.type === 'user'
                          ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      <p className="text-sm">{message.content}</p>
                      <p className="text-xs mt-1 opacity-70">
                        {new Date(message.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  )}
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                      <span className="text-sm text-gray-600">Thinking...</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={chatEndRef} />
            </div>
          </div>
        )}

        {/* Question Section */}
        <div className="bg-white rounded-xl shadow-sm border border-pink-100 p-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full flex items-center justify-center mt-1">
              <HelpCircle className="w-5 h-5 text-purple-600" />
            </div>
            
            <div className="flex-1 space-y-4">
              <div className="relative">
                <textarea
                  ref={textareaRef}
                  placeholder="Ask a question about your file..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  className="w-full px-4 py-3 border border-pink-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none transition-all"
                  rows="1"
                  disabled={uploadStatus !== 'success'}
                />
                
                <button
                  onClick={handleQuestionSubmit}
                  disabled={!question.trim() || uploadStatus !== 'success'}
                  className="absolute right-2 top-2 px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-md hover:from-pink-600 hover:to-purple-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-sm font-medium"
                >
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* File Info (Always Visible) */}
        {uploadedFile && (
          <div className="bg-white rounded-lg shadow-sm border border-pink-100 p-4">
            <div className="flex items-center space-x-3">
              <File className="w-5 h-5 text-purple-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{uploadedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(uploadedFile.size / 1024).toFixed(1)} KB • {uploadedFile.type}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {uploadStatus === 'processing' && (
                  <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
                )}
                {uploadStatus === 'success' && (
                  <Check className="w-4 h-4 text-green-600" />
                )}
                <span className={`text-xs font-medium ${
                  uploadStatus === 'success' ? 'text-green-600' : 
                  uploadStatus === 'error' ? 'text-red-600' : 'text-purple-600'
                }`}>
                  {uploadStatus === 'success' ? 'Ready' : 
                   uploadStatus === 'processing' ? 'Processing' : 
                   uploadStatus === 'error' ? 'Error' : 'Uploaded'}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}