import { useState } from 'react';
import axios from 'axios';

function App() {
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({}); // Stores answers as {0: "choice", 1: "choice"}
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const startTest = async () => {
    setLoading(true);
    setResult(null);
    setUserAnswers({});
    try {
      const res = await axios.post('http://127.0.0.1:5000/generate-test', { topic: 'Python Programming' });
      setQuestions(res.data);
    } catch (err) {
      alert("Error generating quiz.");
    }
    setLoading(false);
  };

  const handleSelect = (index, option) => {
    // Correctly merging new answer with previous state
    setUserAnswers(prev => ({
      ...prev,
      [index]: option
    }));
  };

  const submitTest = async (e) => {
    if (e) e.preventDefault();
    
    if (Object.keys(userAnswers).length < questions.length) {
      alert(`Please answer all ${questions.length} questions!`);
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post('http://127.0.0.1:5000/analyze-results', {
        questions: questions,
        answers: userAnswers
      });
      setResult(res.data);
    } catch (err) {
      alert("Error analyzing results.");
    }
    setLoading(false);
  };

  return (
    <div className="container mt-5 pb-5">
      <h2 className="text-center mb-4">🎓 Smart Education Hub</h2>
      
      {!questions.length ? (
        <div className="text-center">
        
<button className="btn btn-primary btn-lg" onClick={startTest} disabled={loading}>
  {loading ? "AI is crafting questions..." : "Start AI Diagnostic Test"}
</button>
        </div>
      ) : !result ? (
        <div className="row justify-content-center">
          <div className="col-md-8">
            <div className="alert alert-info text-center">
              Progress: {Object.keys(userAnswers).length} / {questions.length}
            </div>
            {questions.map((q, index) => (
              <div key={index} className="card shadow-sm mb-3">
                <div className="card-body">
                  <h5>{index + 1}. {q.question}</h5>
                  {q.options.map(opt => (
                    <button 
                      key={opt}
                      type="button" 
                      className={`btn d-block w-100 mb-2 text-start ${userAnswers[index] === opt ? 'btn-primary text-white' : 'btn-outline-secondary'}`}
                      onClick={() => handleSelect(index, opt)}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button className="btn btn-success w-100 mt-4 py-3" onClick={submitTest} disabled={loading}>
              {loading ? "Analyzing..." : "Submit All Answers"}
            </button>
          </div>
        </div>
      ) : (
        <div className="row justify-content-center">
          <div className="col-md-6 card shadow p-4 text-center">
            <h3>Your Learning Profile</h3>
            <div className="display-3 my-3">{result.score} / {questions.length}</div>
            <div className="alert alert-warning text-start">
              <strong>💡 AI Weak Area Analysis:</strong>
              <p className="mt-2 mb-0">{result.weak_areas}</p>
            </div>
            <button className="btn btn-primary mt-3" onClick={() => setQuestions([])}>Restart</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;