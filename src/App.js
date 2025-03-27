import { useState, useEffect } from "react";
import Plot from 'react-plotly.js';

import ToastError from './Toast'; 

export default function App() {
  const [data, setData] = useState({'Inst1': [], 'Inst2': []}); // Initialize data state
  const [showMovingAvg, setShowMovingAvg] = useState(false); // Toggle moving average visibility
  const [windowSize, setWindowSize] = useState(10); // Default window size for moving average
  const [showToast, setShowToast] = useState(false); // State for toast visibility
  const [toastMessage, setToastMessage] = useState(''); // State for toast message

  // Function to sort data by date and handle invalid dates
  function sortByDate(unsortedData) {
    return unsortedData
      .filter(item => {
        const date = new Date(item.date);
        if (isNaN(date.getTime())) { // Check if date is invalid
          setShowToast(true); // Show toast if date is invalid
          setToastMessage(`Invalid date found: ${item.date}`); // Set toast message
          return false; // Exclude invalid date
        }
        return true; // Include valid date
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date)); // Sort data by date
  }

  // Moving average function (simple moving average over a window size)
  function calculateMovingAvg(data, windowSize) {
    const prices = data.map(item => item.price); // Extract prices
    let movingAvg = [];

    for (let i = 0; i < prices.length; i++) {
      const start = Math.max(i - windowSize + 1, 0);
      const window = prices.slice(start, i + 1);
      const avg = window.reduce((sum, value) => sum + value, 0) / window.length;
      movingAvg.push(avg);
    }
    return movingAvg;
  }

  // Fetch data from JSON file and set state
  useEffect(() => {
    fetch('/data/input_data.json')
      .then((response) => response.json())
      .then((data) => {
        setData({
          Inst1: sortByDate(data.Inst1),
          Inst2: sortByDate(data.Inst2)
        });
      })
      .catch((error) => console.error('Error fetching data:', error));
  }, []);

  // Calculate moving averages based on the current window size
  const movingAvgInst1 = calculateMovingAvg(data.Inst1, windowSize);
  const movingAvgInst2 = calculateMovingAvg(data.Inst2, windowSize);

  // Function to unpack data from rows
  function unpack(rows, key) {
    return rows.map(row => row[key]);
  }

  // Create trace for Inst1 price data
  const trace1 = !showMovingAvg ? {
    type: "scatter",
    mode: "lines+markers",
    name: "Inst1 Price",
    x: unpack(data.Inst1, "date"),
    y: unpack(data.Inst1, "price"),
    line: { color: "#17BECF" },
    marker: { color: "#17BECF", size: 4 }
  } : null;

  // Create trace for Inst2 price data
  const trace2 = !showMovingAvg ? {
    type: "scatter",
    mode: "lines+markers",
    name: "Inst2 Price",
    x: unpack(data.Inst2, "date"),
    y: unpack(data.Inst2, "price"),
    line: { color: "#FFA500" },
    marker: { color: "#FFA500", size: 4 }
  } : null;

  // Create trace for Inst1 moving average (if toggle is true)
  const trace3 = showMovingAvg ? {
    type: "scatter",
    mode: "lines",
    name: `Inst1 Moving Average (${windowSize} days)`,
    x: unpack(data.Inst1, "date"),
    y: movingAvgInst1,
    line: { color: "#17BECF", dash: 'dot' }
  } : null;

  // Create trace for Inst2 moving average (if toggle is true)
  const trace4 = showMovingAvg ? {
    type: "scatter",
    mode: "lines",
    name: `Inst2 Moving Average (${windowSize} days)`,
    x: unpack(data.Inst2, "date"),
    y: movingAvgInst2,
    line: { color: "#FFA500", dash: 'dot' }
  } : null;

  return (
    <div className="container mt-4">
      {/* Header */}
      <div className="row mb-3">
        <div className="col text-center">
          <h2>Instrument Time Series</h2>
        </div>
      </div>

      {/* Display the plot */}
      {data.Inst1.length > 0 ? (
        <Plot
          data={[trace1, trace2, trace3, trace4].filter(Boolean)} // Filter out null traces
          layout={{
            width: 1000,
            height: 600, // Adjust height as needed
            title: { text: (showMovingAvg ? 'Price (Moving Average)' : 'Price') }
          }}
        />
      ) : (
        <div className="row">
          <div className="col text-center">
            <p>Loading data...</p>
          </div>
        </div>
      )}

      {/* Button to toggle moving average */}
      <div className="row mb-5">
        <div className="col-2 text-left">
          <button 
            className="btn btn-primary btn-sm"
            onClick={() => setShowMovingAvg(!showMovingAvg)}
          >
            {showMovingAvg ? 'Hide' : 'Show'} Moving Average
          </button>
        </div>

        {/* Conditionally render the input field for window size if showMovingAvg is true */}
        {showMovingAvg && (
          <div className="col-4 text-left">
            <div className="form-floating">
              <input
                type="number"
                className="form-control"
                id="movingAvgWindow"
                value={windowSize}
                onChange={(e) => setWindowSize(Number(e.target.value))}
                min="1"
                max="50"
                style={{ width: '180px' }} 
              />
              <label htmlFor="movingAvgWindow">Moving Average No. Days</label>
            </div>
          </div>
        )}
      </div>

      {/* Placeholder for Toast component */}
      <ToastError show={showToast} 
        onClose={() => setShowToast(false)}
        errorMessage={toastMessage}
      /> 
    </div>
  );
}
