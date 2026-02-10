import React from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend, Filler);

const StatusTrend = ({ complaintsData }) => {
  if (!complaintsData || complaintsData.length === 0) {
    return <div className="chartContainer"><p className="noDataMsg">No complaint data available</p></div>;
  }

  // Group complaints by date
  const dateGroups = {};
  complaintsData.forEach(complaint => {
    if (complaint.startTime) {
      const date = complaint.startTime.split(',')[0]; // Extract date part
      if (!dateGroups[date]) {
        dateGroups[date] = { pending: 0, inProcess: 0, completed: 0 };
      }
      const status = complaint.status || 'Pending';
      if (status === 'Pending') dateGroups[date].pending++;
      else if (status === 'In Process') dateGroups[date].inProcess++;
      else if (status === 'Completed') dateGroups[date].completed++;
    }
  });

  // Sort dates and prepare data
  const sortedDates = Object.keys(dateGroups).sort((a, b) => {
    const [dayA, monthA, yearA] = a.split('/').map(Number);
    const [dayB, monthB, yearB] = b.split('/').map(Number);
    return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
  });

  const pendingData = sortedDates.map(date => dateGroups[date].pending);
  const inProcessData = sortedDates.map(date => dateGroups[date].inProcess);
  const completedData = sortedDates.map(date => dateGroups[date].completed);

  const data = {
    labels: sortedDates.slice(-10), // Last 10 dates
    datasets: [
      {
        label: 'Pending',
        data: pendingData.slice(-10),
        borderColor: 'rgba(255, 206, 86, 1)',
        backgroundColor: 'rgba(255, 206, 86, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'In Process',
        data: inProcessData.slice(-10),
        borderColor: 'rgba(54, 162, 235, 1)',
        backgroundColor: 'rgba(54, 162, 235, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      },
      {
        label: 'Completed',
        data: completedData.slice(-10),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.1)',
        tension: 0.4,
        fill: true,
        pointRadius: 4,
        pointHoverRadius: 6
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
        labels: {
          padding: 15,
          font: {
            size: 12,
            family: 'Poppins, sans-serif'
          },
          boxWidth: 15,
          boxHeight: 15,
          usePointStyle: true
        }
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
            size: 10
          },
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          display: false
        }
      }
    }
  };

  return (
    <div className="chartContainer">
      <p className="chartTitle">Status Trend Over Time</p>
      <div style={{ height: '350px', position: 'relative' }}>
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

export default StatusTrend;
