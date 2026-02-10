import React from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const SeverityDistribution = ({ complaintsData }) => {
  if (!complaintsData || complaintsData.length === 0) {
    return <div className="chartContainer"><p className="noDataMsg">No complaint data available</p></div>;
  }

  // Categorize by severity ranges
  const severityRanges = {
    'Low (0-3)': 0,
    'Medium (3-6)': 0,
    'High (6-8)': 0,
    'Critical (8-10)': 0
  };

  complaintsData.forEach(complaint => {
    const severity = parseFloat(complaint.severity) || 0;
    if (severity < 3) severityRanges['Low (0-3)']++;
    else if (severity < 6) severityRanges['Medium (3-6)']++;
    else if (severity < 8) severityRanges['High (6-8)']++;
    else severityRanges['Critical (8-10)']++;
  });

  const data = {
    labels: Object.keys(severityRanges),
    datasets: [{
      label: 'Number of Complaints',
      data: Object.values(severityRanges),
      backgroundColor: [
        'rgba(75, 192, 192, 0.7)',
        'rgba(255, 206, 86, 0.7)',
        'rgba(255, 159, 64, 0.7)',
        'rgba(255, 99, 132, 0.7)'
      ],
      borderColor: [
        'rgb(75, 192, 192)',
        'rgb(255, 206, 86)',
        'rgb(255, 159, 64)',
        'rgb(255, 99, 132)'
      ],
      borderWidth: 2,
      borderRadius: 8
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        padding: 12,
        titleFont: {
          size: 14,
          family: 'Poppins, sans-serif'
        },
        bodyFont: {
          size: 13,
          family: 'Poppins, sans-serif'
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            family: 'Poppins, sans-serif',
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            family: 'Poppins, sans-serif',
            size: 11
          }
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="chartContainer">
      <p className="chartTitle">Severity Distribution</p>
      <div style={{ height: '350px', position: 'relative' }}>
        <Bar data={data} options={options} />
      </div>
    </div>
  );
};

export default SeverityDistribution;
