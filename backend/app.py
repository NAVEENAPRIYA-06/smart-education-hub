import os
import json
import re
from flask import Flask, jsonify, request
from flask_cors import CORS
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:5173"}})

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-2.5-flash')

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
        answers = data.get('answers', {}) # e.g. {"0": "choice", "1": "choice"}
        
        score = 0
        wrong_topics = []

        # Iterate by index to match the frontend selection logic
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