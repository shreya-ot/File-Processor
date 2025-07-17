from fastapi import FastAPI, File, UploadFile
import os
from dotenv import load_dotenv
from PIL import Image
import pytesseract
from pdf2image import convert_from_path
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain_community.vectorstores import Chroma
import google.generativeai as genai
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.documents import Document
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Question(BaseModel):
    q: str

load_dotenv()
API_KEY = os.getenv("API_KEY")
genai.configure(api_key=API_KEY)

text = "" 
vectorstore = None

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    global text, vectorstore
    text = ""  # Reset text for each new file upload
    newdir = "files"
    if not os.path.exists(newdir):
        os.makedirs(newdir)
    file_loc = os.path.join(newdir, file.filename)
    with open(file_loc, "wb") as f:
        f.write(await file.read())

    if file.filename.endswith('.pdf'):
        images = convert_from_path(file_loc)
        for img in images:
            text += pytesseract.image_to_string(img)
            
    elif file.filename.endswith('.csv'):
        with open(file_loc, 'r') as f:
            text = f.read()
    elif file.filename.endswith(('.png', '.jpg', '.jpeg')):
        img = Image.open(file_loc)
        text = pytesseract.image_to_string(img)
    return {"filename": file.filename, "text": text}


def chunk_vector(text):
    global vectorstore
    text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000,  
    chunk_overlap=150)  
    chunks = text_splitter.split_documents([Document(page_content=text)])
    embeddings = GoogleGenerativeAIEmbeddings(model="models/embedding-001", google_api_key=API_KEY)
    vectorstore = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings)
    print("Vectorstore created with chunks of text.")  # Debugging line
    return vectorstore

@app.post("/chat/")
def qna(question: Question):
    context = ""
    relevant = []
    q = question.q
    global vectorstore, text
    if vectorstore is None:
        vectorstore = chunk_vector(text)
    print("Vectorstore created with text:", text[:10])  # Debugging line to check text
    relevant = vectorstore.similarity_search(q, k=3) 
    print(relevant)
    context = "\n".join([doc.page_content for doc in relevant])
    print(context)
    llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash",
    google_api_key=API_KEY,
    temperature=0.3
    )
    prompt = f"""You are a helpful assistant. Use the following context to answer the question. Context: {context}, Question: {q} """
    response = llm.invoke(prompt)
    return {"answer": response.content}
    