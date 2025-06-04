import React, { useState, useEffect, useRef } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Tooltip, Legend);

const WORDS = [
  'the', 'quick', 'brown', 'fox', 'jumps', 'over', 'lazy', 'dog', 'practice', 'makes', 'perfect', 'typing', 'speed', 'accuracy', 'test', 'react', 'javascript', 'library', 'interface', 'important', 'as', 'in', 'tests', 'is', 'just', 'measured', 'words', 'per', 'minute', 'when', 'it', 'comes', 'to', 'user', 'experience', 'modern', 'web', 'app', 'challenge', 'fun', 'improve', 'your', 'skills', 'with', 'every', 'session', 'focus', 'and', 'consistency', 'are', 'key', 'for', 'progress'
];

function getRandomWords(count = 30) {
  let arr = [];
  for (let i = 0; i < count; i++) {
    arr.push(WORDS[Math.floor(Math.random() * WORDS.length)]);
  }
  return arr;
}

function calculateWPM(charsTyped, seconds) {
  return Math.round((charsTyped / 5) / (seconds / 60));
}

function calculateAccuracy(target, input) {
  let correct = 0;
  for (let i = 0; i < input.length; i++) {
    if (input[i] === target[i]) correct++;
  }
  return target.length === 0 ? 100 : Math.round((correct / target.length) * 100);
}

const PRIMARY = '#4f8cff';
const BG = '#181a20';
const CARD = '#23272f';
const SUCCESS = '#4caf50';
const ERROR = '#ff5252';
const TEXT = '#fff';
const SUBTLE = '#aaa';

const DEFAULT_TIME = 60;

const TypingTest = () => {
  const [words, setWords] = useState([]);
  const [input, setInput] = useState('');
  const [currentWordIdx, setCurrentWordIdx] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [timer, setTimer] = useState(0);
  const [intervalId, setIntervalId] = useState(null);
  const [finished, setFinished] = useState(false);
  const [wpm, setWpm] = useState(0);
  const [accuracy, setAccuracy] = useState(100);
  const [history, setHistory] = useState([]); // {wpm, accuracy, time}
  const [timeLeft, setTimeLeft] = useState(DEFAULT_TIME);
  const [timerActive, setTimerActive] = useState(false);
  const [showMistakes, setShowMistakes] = useState(false);
  const [mistakes, setMistakes] = useState([]); // [{word, typed, idx}]
  const inputRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setWords(getRandomWords(30));
    inputRef.current && inputRef.current.focus();
    // Load history from localStorage
    const hist = localStorage.getItem('typingHistory');
    if (hist) setHistory(JSON.parse(hist));
  }, []);

  // Countdown timer effect
  useEffect(() => {
    if (timerActive && timeLeft > 0 && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            setTimerActive(false);
            setFinished(true);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (intervalRef.current && (!timerActive || timeLeft === 0)) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [timerActive, timeLeft]);

  // Stop timer on finish
  useEffect(() => {
    if (finished && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
      setTimerActive(false);
    }
  }, [finished]);

  useEffect(() => {
    if (input.length === 1 && !startTime) {
      setStartTime(Date.now());
      const id = setInterval(() => setTimer(t => t + 1), 1000);
      setIntervalId(id);
    }
    if (finished && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null); // Ensure interval is cleared
    }
  }, [input, startTime, finished]);

  useEffect(() => {
    // Calculate stats on every input
    const allTyped = input.trim().split(' ');
    let charsTyped = input.replace(/\s/g, '').length;
    setWpm(startTime ? calculateWPM(charsTyped, (Date.now() - startTime) / 1000) : 0);
    setAccuracy(calculateAccuracy(words, allTyped));
  }, [input, words, startTime]);

  useEffect(() => {
    if (finished && startTime) {
      // Save result to history
      const newResult = { wpm, accuracy, time: timer, date: new Date().toLocaleString() };
      const newHistory = [...history, newResult].slice(-10); // keep last 10
      setHistory(newHistory);
      localStorage.setItem('typingHistory', JSON.stringify(newHistory));
    }
  }, [finished]);

  // After test, compute mistakes
  useEffect(() => {
    if (finished) {
      const allTyped = input.trim().split(' ');
      const newMistakes = words.map((word, idx) => {
        if (allTyped[idx] && allTyped[idx] !== word) {
          return { word, typed: allTyped[idx], idx };
        }
        return null;
      }).filter(Boolean);
      setMistakes(newMistakes);
    } else {
      setMistakes([]);
    }
  }, [finished, input, words]);

  const handleInput = (e) => {
    if (finished || timeLeft === 0) return;
    const val = e.target.value;
    setInput(val);
    if (!timerActive && val.length === 1) setTimerActive(true);
    const allTyped = val.trim().split(' ');
    // Check if the last word is fully typed and matches the last word in the list
    if (
      allTyped.length === words.length &&
      allTyped[words.length - 1] === words[words.length - 1]
    ) {
      setFinished(true);
      setTimerActive(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    setCurrentWordIdx(allTyped.length - 1);
  };

  const handleRestart = () => {
    setWords(getRandomWords(30));
    setInput('');
    setCurrentWordIdx(0);
    setStartTime(null);
    setTimer(0);
    setFinished(false);
    setWpm(0);
    setAccuracy(100);
    setTimeLeft(DEFAULT_TIME);
    setTimerActive(false);
    setShowMistakes(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    inputRef.current && inputRef.current.focus();
  };

  // Enhanced renderWords for post-test review
  const renderWords = () => (
    <div style={{
      fontSize: 32,
      fontFamily: 'monospace',
      background: '#3c4acf',
      color: '#eee',
      padding: 24,
      borderRadius: 8,
      minHeight: 60,
      marginBottom: 16,
      letterSpacing: 1.5,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 8
    }}>
      {words.map((word, idx) => {
        let style = {
          padding: '2px 4px',
          borderRadius: 4,
          background: idx === currentWordIdx ? '#444' : 'transparent',
          borderBottom: idx === currentWordIdx ? '2px solid #4caf50' : 'none',
          color: '#eee',
          transition: 'all 0.1s',
        };
        const allTyped = input.trim().split(' ');
        if (allTyped[idx]) {
          if (allTyped[idx] === word) {
            style.color = '#4caf50';
            style.background = 'rgba(76,175,80,0.1)';
          } else {
            style.color = finished && showMistakes ? '#ff5252' : '#ff5252';
            style.background = finished && showMistakes ? 'rgba(255,82,82,0.2)' : 'rgba(255,82,82,0.1)';
          }
        }
        return <span key={idx} style={style}>{word}</span>;
      })}
    </div>
  );

  // Performance graph data
  const chartData = {
    labels: history.map((h, i) => `Test ${i + 1}`),
    datasets: [
      {
        label: 'WPM',
        data: history.map(h => h.wpm),
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76,175,80,0.2)',
        tension: 0.3,
      },
      {
        label: 'Accuracy',
        data: history.map(h => h.accuracy),
        borderColor: '#2196f3',
        backgroundColor: 'rgba(33,150,243,0.2)',
        tension: 0.3,
      }
    ]
  };
  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#fff' } },
      tooltip: { enabled: true }
    },
    scales: {
      x: { ticks: { color: '#fff' }, grid: { color: '#333' } },
      y: { ticks: { color: '#fff' }, grid: { color: '#333' }, min: 0 }
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, padding: 0, margin: 0, fontFamily: 'Inter, Segoe UI, Arial, sans-serif' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', paddingTop: 40, paddingBottom: 40 }}>
        <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <h1 style={{ color: PRIMARY, fontWeight: 800, fontSize: 36, letterSpacing: 1, margin: 0 }}>Typing Speed Analyzer new</h1>
        </header>
        <section style={{ background: CARD, borderRadius: 16, padding: 32, boxShadow: '0 2px 16px #0001', marginBottom: 32, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ marginBottom: 24, fontSize: 18, color: SUBTLE, fontWeight: 500, letterSpacing: 1, textAlign: 'center' }}>
            <span style={{ fontSize: 28, color: PRIMARY, fontWeight: 700 }}>Word Test</span><br/>
            Type the words below as fast and accurately as you can!
          </div>
          <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
            <button onClick={handleRestart} style={{ background: PRIMARY, color: TEXT, border: 'none', borderRadius: 8, padding: '10px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px #0002', transition: 'background 0.2s' }}>Restart</button>
            <button onClick={() => setWords(getRandomWords(50))} style={{ background: CARD, color: PRIMARY, border: `2px solid ${PRIMARY}`, borderRadius: 8, padding: '10px 28px', fontSize: 16, fontWeight: 600, cursor: 'pointer', boxShadow: '0 2px 8px #0001', transition: 'background 0.2s' }}>New Test</button>
          </div>
          {renderWords()}
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={handleInput}
            disabled={finished}
            style={{
              width: '100%',
              fontSize: 24,
              padding: 16,
              borderRadius: 8,
              border: `2px solid ${PRIMARY}`,
              background: BG,
              color: TEXT,
              outline: 'none',
              marginTop: 24,
              marginBottom: 8,
              boxShadow: '0 1px 4px #0001',
              fontWeight: 500,
              letterSpacing: 1.2
            }}
            placeholder="Start typing here..."
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', color: TEXT, fontSize: 20, marginTop: 16, fontWeight: 600, width: '100%' }}>
            <div>WPM: <span style={{ color: PRIMARY }}>{wpm}</span></div>
            <div>Accuracy: <span style={{ color: accuracy > 90 ? SUCCESS : ERROR }}>{accuracy}%</span></div>
            <div>Time Left: <span style={{ color: PRIMARY }}>{timeLeft}s</span></div>
            <div>Words: <span style={{ color: PRIMARY }}>{words.length}</span></div>
          </div>
          {finished && (
            <div style={{ marginTop: 32, color: SUCCESS, fontSize: 22, textAlign: 'center', fontWeight: 700, letterSpacing: 1 }}>
              Test complete!
              <div style={{ marginTop: 24 }}>
                <button onClick={() => setShowMistakes(v => !v)} style={{ background: CARD, color: PRIMARY, border: `2px solid ${PRIMARY}`, borderRadius: 8, padding: '8px 20px', fontSize: 16, fontWeight: 600, cursor: 'pointer', marginBottom: 12 }}>
                  {showMistakes ? 'Hide Mistakes' : 'Review Mistakes'}
                </button>
              </div>
              {showMistakes && mistakes.length > 0 && (
                <div style={{ background: '#23272f', borderRadius: 8, padding: 20, marginTop: 12, color: '#fff', textAlign: 'left', boxShadow: '0 2px 8px #0002' }}>
                  <h3 style={{ color: ERROR, margin: '0 0 10px 0' }}>Mistake Summary</h3>
                  <div><b>Total Errors:</b> {mistakes.length}</div>
                  <div style={{ marginTop: 8 }}>
                    <b>Mistyped Words:</b>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {mistakes.map((m, i) => (
                        <li key={i}>
                          <span style={{ color: ERROR }}>{m.typed}</span> → <span style={{ color: PRIMARY }}>{m.word}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginTop: 8 }}>
                    <b>Suggested Corrections:</b>
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {mistakes.map((m, i) => (
                        <li key={i}><span style={{ color: PRIMARY }}>{m.word}</span></li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
              {showMistakes && mistakes.length === 0 && (
                <div style={{ color: SUCCESS, marginTop: 12 }}>No mistakes! 🎉</div>
              )}
            </div>
          )}
        </section>
        <section style={{ background: CARD, borderRadius: 16, padding: 32, boxShadow: '0 2px 16px #0001' }}>
          <h2 style={{ color: PRIMARY, fontSize: 22, marginBottom: 16, fontWeight: 700 }}>Performance Graph (Last 10 Tests)</h2>
          {history.length > 0 ? (
            <Line data={chartData} options={chartOptions} height={120} />
          ) : (
            <div style={{ color: SUBTLE }}>No test history yet. Complete a test to see your performance!</div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TypingTest;
