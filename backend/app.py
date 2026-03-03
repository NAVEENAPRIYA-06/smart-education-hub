import os
import json
import re
from flask import Flask, jsonify, request
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv
from flask_sqlalchemy import SQLAlchemy

# 1. Initialize App First
load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

# 2. Database Configuration (Fixed order and variable names)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///smart_hub.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
db = SQLAlchemy(app)

# 3. Database Models
class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    password = db.Column(db.String(120), nullable=False)
    role = db.Column(db.String(20), nullable=False) # 'student', 'instructor', or 'admin'

class Roadmap(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    topic = db.Column(db.String(100))
    content = db.Column(db.Text) # The 7-day plan text

# 4. AI Configuration
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

# 5. ROUTES

@app.route('/')
def home():
    return jsonify({"message": "Smart Education Hub Backend is Running!"})

@app.route('/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')
    
    user = User.query.filter_by(username=username).first()
    
    if user and user.password == password: # In a real app, use password hashing!
        return jsonify({
            "message": "Login successful",
            "username": user.username,
            "role": user.role
        }), 200
    else:
        return jsonify({"message": "Invalid username or password"}), 401

@app.route('/generate-test', methods=['POST'])
def generate_test():
    try:
        topic = request.json.get('topic', 'Python')
        prompt = f"Generate 10 MCQ questions about {topic}. Return ONLY a JSON array."
        response = model.generate_content(prompt)
        match = re.search(r'\[.*\]', response.text, re.DOTALL)
        return jsonify(json.loads(match.group(0))) if match else (jsonify({"error": "No JSON"}), 500)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/analyze-results', methods=['POST'])
def analyze_results():
    try:
        data = request.json
        questions = data.get('questions', [])
        answers = data.get('answers', {}) 
        
        score = 0
        wrong_topics = []

        for index, q in enumerate(questions):
            user_choice = answers.get(str(index))
            if user_choice == q['answer']:
                score += 1
            else:
                wrong_topics.append(q['question'])

        analysis_prompt = f"A student missed these Python questions: {wrong_topics}. Give a very brief 1-sentence study recommendation."
        response = model.generate_content(analysis_prompt)
        
        return jsonify({
            "score": score,
            "weak_areas": response.text.strip()
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)