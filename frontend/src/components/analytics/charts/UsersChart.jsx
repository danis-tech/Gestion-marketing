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
  AreaChart,
  Area
} from 'recharts';

const UsersChart = ({ data }) => {
  const [chartType, setChartType] = useState('bar');
  
  // Transformer les données reçues en format Recharts pour les graphiques en barres/lignes
  const barData = data && data.length > 0 ? [{
    name: 'Utilisateurs',
    'Nouveaux utilisateurs': data.find(d => d.name === 'Nouveaux utilisateurs')?.value || 0,
    'Utilisateurs actifs': data.find(d => d.name === 'Utilisateurs actifs')?.value || 0,
    'Utilisateurs inactifs': data.find(d => d.name === 'Utilisateurs inactifs')?.value || 0
  }] : [{
    name: 'Utilisateurs',
    'Nouveaux utilisateurs': 0,
    'Utilisateurs actifs': 0,
    'Utilisateurs inactifs': 0
  }];

  const pieData = data && data.length > 0 ? data
    .filter(item => item.value > 0) // Filtrer les valeurs à 0
    .map(item => ({
      name: item.name,
      value: item.value,
      color: item.color
    })) : [];

  // Utiliser uniquement les données réelles de l'API
  const finalPieData = pieData;

  // Pour les graphiques en lignes, créer des données temporelles simulées
  const lineData = [
    { name: 'Sem 1', 'Nouveaux utilisateurs': 1, 'Utilisateurs actifs': 3, 'Utilisateurs inactifs': 1 },
    { name: 'Sem 2', 'Nouveaux utilisateurs': 2, 'Utilisateurs actifs': 4, 'Utilisateurs inactifs': 0 },
    { name: 'Sem 3', 'Nouveaux utilisateurs': 0, 'Utilisateurs actifs': 5, 'Utilisateurs inactifs': 1 },
    { name: 'Sem 4', 'Nouveaux utilisateurs': 1, 'Utilisateurs actifs': 6, 'Utilisateurs inactifs': 0 }
  ];

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
                labelFormatter={(label) => `Utilisateur: ${label}`}
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
            <Line type="monotone" dataKey="Nouveaux utilisateurs" stroke="#3b82f6" strokeWidth={3} name="Nouveaux utilisateurs" />
            <Line type="monotone" dataKey="Utilisateurs actifs" stroke="#22c55e" strokeWidth={3} name="Utilisateurs actifs" />
            <Line type="monotone" dataKey="Utilisateurs inactifs" stroke="#6b7280" strokeWidth={3} name="Utilisateurs inactifs" />
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
              dataKey="Nouveaux utilisateurs"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Nouveaux utilisateurs"
            />
            <Area
              type="monotone"
              dataKey="Utilisateurs actifs"
              stackId="2"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.6}
              name="Utilisateurs actifs"
            />
            <Area
              type="monotone"
              dataKey="Utilisateurs inactifs"
              stackId="3"
              stroke="#6b7280"
              fill="#6b7280"
              fillOpacity={0.6}
              name="Utilisateurs inactifs"
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
            <Bar dataKey="Nouveaux utilisateurs" fill="#3b82f6" name="Nouveaux utilisateurs" />
            <Bar dataKey="Utilisateurs actifs" fill="#22c55e" name="Utilisateurs actifs" />
            <Bar dataKey="Utilisateurs inactifs" fill="#6b7280" name="Utilisateurs inactifs" />
          </BarChart>
        );
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>Activité des Utilisateurs</h4>
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

export default UsersChart;