import { useState, useEffect } from "react";
import Plot from 'react-plotly.js';

export default function Board() {
  const [data, setData] = useState({'Inst1': [], 'Inst2': []});
  const [showMovingAvg, setShowMovingAvg] = useState(false); // Toggle moving average visibility
  const [windowSize, setWindowSize] = useState(10); // Default window size for moving average

  // Function to sort data by date and handle invalid dates
  function sortByDate(unsortedData) {
    return unsortedData
      .filter(item => {
        const date = new Date(item.date);
        if (isNaN(date.getTime())) { // Check if date is invalid
          // FIXME: Improve handing of invalid dates
          //        For now, log the error and exclude the item
          console.error(`Invalid date: ${item.date}`);
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
    line: { color: "#7F7F7F" },
    marker: { color: "#7F7F7F", size: 4 }
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
    line: { color: "#7F7F7F", dash: 'dot' }
  } : null;

  return (
    <div id="board">
      {/* Button to toggle moving average */}
      <button onClick={() => setShowMovingAvg(!showMovingAvg)}>
        {showMovingAvg ? 'Hide' : 'Show'} Moving Average
      </button>

      {/* Input field for customizable window size */}
      <div>
        <label>
          Window Size for Moving Average:
          <input 
            type="number" 
            value={windowSize} 
            onChange={(e) => setWindowSize(Number(e.target.value))}
            min="1"
            max="50" 
          />
        </label>
      </div>

      {/* Plotly chart rendering */}
      {data.Inst1.length > 0 ? (
        <Plot
          data={[trace1, trace2, trace3, trace4].filter(Boolean)} // Filter out null traces
          layout={{ 
            width: "100%", 
            height: "100%", 
            title: { text: (showMovingAvg ? 'Moving Average' : 'Price') } 
          }}
        />
      ) : (
        <p>Loading data...</p>
      )}
    </div>
  );
}
