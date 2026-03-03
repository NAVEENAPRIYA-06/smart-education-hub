import { useState } from 'react';
import Login from './Login'; // Import your new Login component
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null); // Tracks logged-in user: {username, role}
  const [questions, setQuestions] = useState([]);
  const [userAnswers, setUserAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Function passed to Login.jsx to handle a successful sign-in
  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

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

  // 1. If no user is logged in, show the Login Screen
  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // 2. If logged in, show the Smart Education Hub based on Role
  return (
    <div className="container mt-5 pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>🎓 Smart Education Hub</h2>
        <div className="text-end">
           <span className="badge bg-secondary me-2">{user.role.toUpperCase()}</span>
           <button className="btn btn-sm btn-outline-danger" onClick={() => setUser(null)}>Logout</button>
        </div>
      </div>

      {user.role === 'student' ? (
        // --- STUDENT VIEW ---
        <div className="student-dashboard">
          {!questions.length ? (
            <div className="text-center mt-5">
              <h3>Welcome, {user.username}!</h3>
              <p>Ready to find your learning gaps?</p>
              <button className="btn btn-primary btn-lg" onClick={startTest} disabled={loading}>
                {loading ? "AI is generating..." : "Start AI Diagnostic Test"}
              </button>
            </div>
          ) : !result ? (
            <div className="row justify-content-center">
               {/* ... Your existing Question Mapping Code here ... */}
            </div>
          ) : (
            <div className="row justify-content-center">
               {/* ... Your existing Result/Weak Area Code here ... */}
            </div>
          )}
        </div>
      ) : (
        // --- INSTRUCTOR/ADMIN VIEW ---
        <div className="card p-5 text-center shadow">
          <h3>Welcome to the {user.role} Dashboard</h3>
          <p>You have access to class analytics and student monitoring.</p>
          <div className="alert alert-info">Dashboard features for {user.role} are coming in the next phase!</div>
        </div>
      )}
    </div>
  );
}

export default App;