import React, { useState } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

const ProjectsChart = ({ data }) => {
  const [chartType, setChartType] = useState('bar');
  
  // Transformer les données reçues en format Recharts pour les graphiques en barres/lignes
  const barData = data && data.length > 0 ? [{
    name: 'Projets',
    'En attente': data.find(d => d.name === 'En attente')?.value || 0,
    'Terminés': data.find(d => d.name === 'Terminés')?.value || 0,
    'Hors délai': data.find(d => d.name === 'Hors délai')?.value || 0,
    'Rejetés': data.find(d => d.name === 'Rejetés')?.value || 0
  }] : [{
    name: 'Projets',
    'En attente': 0,
    'Terminés': 0,
    'Hors délai': 0,
    'Rejetés': 0
  }];

  // Pour les graphiques en lignes et aires, créer des données temporelles simulées
  const lineData = [
    { name: 'Sem 1', 'En attente': 3, 'Terminés': 2, 'Hors délai': 0, 'Rejetés': 1 },
    { name: 'Sem 2', 'En attente': 4, 'Terminés': 1, 'Hors délai': 1, 'Rejetés': 0 },
    { name: 'Sem 3', 'En attente': 2, 'Terminés': 3, 'Hors délai': 0, 'Rejetés': 1 },
    { name: 'Sem 4', 'En attente': 5, 'Terminés': 4, 'Hors délai': 1, 'Rejetés': 0 }
  ];

  const pieData = data && data.length > 0 ? data
    .filter(item => item.value > 0) // Filtrer les valeurs à 0
    .map(item => ({
      name: item.name,
      value: item.value,
      color: item.color
    })) : [];

  // Utiliser uniquement les données réelles de l'API
  const finalPieData = pieData;

  const renderChart = () => {
    switch (chartType) {
      case 'pie':
        if (finalPieData.length === 0) {
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
                data={finalPieData}
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
                {finalPieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value, name) => [value, name]}
                labelFormatter={(label) => `Projet: ${label}`}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'line':
        return (
          <LineChart width={400} height={300} data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="En attente" stroke="#f59e0b" strokeWidth={3} name="En attente" />
            <Line type="monotone" dataKey="Terminés" stroke="#22c55e" strokeWidth={3} name="Terminés" />
            <Line type="monotone" dataKey="Hors délai" stroke="#dc2626" strokeWidth={3} name="Hors délai" />
            <Line type="monotone" dataKey="Rejetés" stroke="#ef4444" strokeWidth={3} name="Rejetés" />
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart width={400} height={300} data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey="En attente"
              stackId="1"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.6}
              name="En attente"
            />
            <Area
              type="monotone"
              dataKey="Terminés"
              stackId="2"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.6}
              name="Terminés"
            />
            <Area
              type="monotone"
              dataKey="Hors délai"
              stackId="3"
              stroke="#dc2626"
              fill="#dc2626"
              fillOpacity={0.6}
              name="Hors délai"
            />
            <Area
              type="monotone"
              dataKey="Rejetés"
              stackId="4"
              stroke="#ef4444"
              fill="#ef4444"
              fillOpacity={0.6}
              name="Rejetés"
            />
          </AreaChart>
        );

      default: // bar
        return (
          <BarChart width={400} height={300} data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="En attente" fill="#f59e0b" name="En attente" />
            <Bar dataKey="Terminés" fill="#22c55e" name="Terminés" />
            <Bar dataKey="Hors délai" fill="#dc2626" name="Hors délai" />
            <Bar dataKey="Rejetés" fill="#ef4444" name="Rejetés" />
          </BarChart>
        );
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>Évolution des Projets</h4>
        <div className="chart-controls">
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
          <button 
            className={`chart-btn ${chartType === 'pie' ? 'active' : ''}`}
            onClick={() => setChartType('pie')}
          >
            Camembert
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

export default ProjectsChart;