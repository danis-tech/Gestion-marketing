import React, { useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
  AreaChart,
  Area
} from 'recharts';

const ServicesChart = ({ data }) => {
  const [chartType, setChartType] = useState('pie');
  
  // Utiliser les vraies données ou des données par défaut
  const chartData = data && data.length > 0 ? data
    .filter(item => item.value > 0) // Filtrer les valeurs à 0
    .map(item => ({
      name: item.name,
      value: item.value,
      color: item.color
    })) : [];

  // Utiliser uniquement les données réelles de l'API
  const finalChartData = chartData;

  // Pour les graphiques en lignes et aires, créer des données temporelles simulées
  const lineData = [
    { name: 'Sem 1', 'Service Marketing': 2, 'Finance': 1, 'RH': 0, 'IT': 1 },
    { name: 'Sem 2', 'Service Marketing': 3, 'Finance': 2, 'RH': 1, 'IT': 0 },
    { name: 'Sem 3', 'Service Marketing': 1, 'Finance': 1, 'RH': 2, 'IT': 1 },
    { name: 'Sem 4', 'Service Marketing': 4, 'Finance': 0, 'RH': 1, 'IT': 2 }
  ];

  const renderChart = () => {
    if (chartType === 'bar') {
      const barData = finalChartData.map(item => ({
        name: item.name,
        projets: item.value
      }));

      return (
        <BarChart width={400} height={300} data={barData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="projets" fill="#3b82f6" name="Nombre de projets" />
        </BarChart>
      );
    }

    if (chartType === 'line') {
      return (
        <LineChart width={400} height={300} data={lineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Line type="monotone" dataKey="Service Marketing" stroke="#22c55e" strokeWidth={3} name="Service Marketing" />
          <Line type="monotone" dataKey="Finance" stroke="#3b82f6" strokeWidth={3} name="Finance" />
          <Line type="monotone" dataKey="RH" stroke="#f59e0b" strokeWidth={3} name="RH" />
          <Line type="monotone" dataKey="IT" stroke="#8b5cf6" strokeWidth={3} name="IT" />
        </LineChart>
      );
    }

    if (chartType === 'area') {
      return (
        <AreaChart width={400} height={300} data={lineData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Area
            type="monotone"
            dataKey="Service Marketing"
            stackId="1"
            stroke="#22c55e"
            fill="#22c55e"
            fillOpacity={0.6}
            name="Service Marketing"
          />
          <Area
            type="monotone"
            dataKey="Finance"
            stackId="2"
            stroke="#3b82f6"
            fill="#3b82f6"
            fillOpacity={0.6}
            name="Finance"
          />
          <Area
            type="monotone"
            dataKey="RH"
            stackId="3"
            stroke="#f59e0b"
            fill="#f59e0b"
            fillOpacity={0.6}
            name="RH"
          />
          <Area
            type="monotone"
            dataKey="IT"
            stackId="4"
            stroke="#8b5cf6"
            fill="#8b5cf6"
            fillOpacity={0.6}
            name="IT"
          />
        </AreaChart>
      );
    }

    // Pie chart par défaut
    if (finalChartData.length === 0) {
      return (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '300px',
          color: '#6b7280',
          fontSize: '14px'
        }}>
          Aucune donnée disponible pour le graphique
        </div>
      );
    }
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={finalChartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            innerRadius={20}
            dataKey="value"
            nameKey="name"
            animationBegin={0}
            animationDuration={800}
          >
            {finalChartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip 
            formatter={(value, name) => [value, name]}
            labelFormatter={(label) => `Service: ${label}`}
          />
          <Legend 
            verticalAlign="bottom" 
            height={36}
            iconType="circle"
          />
        </PieChart>
      </ResponsiveContainer>
    );
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>Répartition par Service</h4>
        <div className="chart-controls">
          <button 
            className={`chart-btn ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
          >
            Camembert
          </button>
          <button 
            className={`chart-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            Barres
          </button>
          <button 
            className={`chart-btn ${chartType === 'line' ? 'active' : ''}`}
            onClick={() => setChartType('line')}
          >
            Ligne
          </button>
          <button 
            className={`chart-btn ${chartType === 'area' ? 'active' : ''}`}
            onClick={() => setChartType('area')}
          >
            Aire
          </button>
        </div>
      </div>
      {chartType === 'pie' ? (
        renderChart()
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          {renderChart()}
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default ServicesChart;