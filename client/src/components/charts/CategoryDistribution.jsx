import React from "react";
import { Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

ChartJS.register(ArcElement, Tooltip, Legend);

const CategoryDistribution = ({ complaintsData }) => {
  if (!complaintsData || complaintsData.length === 0) {
    return <div className="chartContainer"><p className="noDataMsg">No complaint data available</p></div>;
  }

  // Count complaints by category
  const categoryCounts = {};
  complaintsData.forEach(complaint => {
    const category = complaint.category || 'Unknown';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const categories = Object.keys(categoryCounts);
  const counts = Object.values(categoryCounts);

  const colors = [
    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF',
    '#FF9F40', '#FF6384', '#C9CBCF', '#4BC0C0', '#FF9F40'
  ];

  const data = {
    labels: categories.map(cat => 
      cat === 'violence' ? 'Violence/Crowded' : 
      cat.charAt(0).toUpperCase() + cat.slice(1)
    ),
    datasets: [{
      label: 'Complaints by Category',
      data: counts,
      backgroundColor: colors.slice(0, categories.length),
      hoverBackgroundColor: colors.slice(0, categories.length).map(c => c + 'DD'),
      borderWidth: 2,
      borderColor: '#fff'
    }]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          padding: 15,
          font: {
            size: 12,
            family: 'Poppins, sans-serif'
          },
          boxWidth: 15,
          boxHeight: 15
        }
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const total = counts.reduce((a, b) => a + b, 0);
            const percentage = ((context.parsed / total) * 100).toFixed(1);
            return `${context.label}: ${context.parsed} (${percentage}%)`;
          }
        },
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
    }
  };

  return (
    <div className="chartContainer">
      <p className="chartTitle">Complaints by Category</p>
      <div style={{ height: '350px', position: 'relative' }}>
        <Doughnut data={data} options={options} />
      </div>
    </div>
  );
};

export default CategoryDistribution;
