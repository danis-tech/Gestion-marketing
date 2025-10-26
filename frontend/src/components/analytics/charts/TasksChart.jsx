import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart,
  BarChart,
  Bar
} from 'recharts';

const TasksChart = ({ data }) => {
  const [chartType, setChartType] = useState('line');
  
  // Transformer les données reçues en format Recharts pour les graphiques en barres/lignes
  const barData = data && data.length > 0 ? [{
    name: 'Tâches',
    'Nouvelles': data.find(d => d.name === 'Nouvelles')?.value || 0,
    'En cours': data.find(d => d.name === 'En cours')?.value || 0,
    'Terminées': data.find(d => d.name === 'Terminées')?.value || 0,
    'En retard': data.find(d => d.name === 'En retard')?.value || 0,
    'Priorité haute': data.find(d => d.name === 'Priorité haute')?.value || 0
  }] : [{
    name: 'Tâches',
    'Nouvelles': 0,
    'En cours': 0,
    'Terminées': 0,
    'En retard': 0,
    'Priorité haute': 0
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

  // Pour les graphiques en lignes et aires, créer des données temporelles simulées
  const lineData = [
    { name: 'Sem 1', 'Nouvelles': 2, 'En cours': 3, 'Terminées': 1, 'En retard': 0, 'Priorité haute': 0 },
    { name: 'Sem 2', 'Nouvelles': 3, 'En cours': 2, 'Terminées': 2, 'En retard': 1, 'Priorité haute': 1 },
    { name: 'Sem 3', 'Nouvelles': 1, 'En cours': 4, 'Terminées': 3, 'En retard': 0, 'Priorité haute': 0 },
    { name: 'Sem 4', 'Nouvelles': 4, 'En cours': 1, 'Terminées': 4, 'En retard': 1, 'Priorité haute': 1 }
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
                labelFormatter={(label) => `Tâche: ${label}`}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                iconType="circle"
              />
            </PieChart>
          </ResponsiveContainer>
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
              dataKey="Nouvelles"
              stackId="1"
              stroke="#3b82f6"
              fill="#3b82f6"
              fillOpacity={0.6}
              name="Nouvelles"
            />
            <Area
              type="monotone"
              dataKey="En cours"
              stackId="2"
              stroke="#f59e0b"
              fill="#f59e0b"
              fillOpacity={0.6}
              name="En cours"
            />
            <Area
              type="monotone"
              dataKey="Terminées"
              stackId="3"
              stroke="#22c55e"
              fill="#22c55e"
              fillOpacity={0.6}
              name="Terminées"
            />
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart width={400} height={300} data={barData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="Nouvelles" fill="#3b82f6" name="Nouvelles" />
            <Bar dataKey="En cours" fill="#f59e0b" name="En cours" />
            <Bar dataKey="Terminées" fill="#22c55e" name="Terminées" />
            <Bar dataKey="En retard" fill="#ef4444" name="En retard" />
            <Bar dataKey="Priorité haute" fill="#dc2626" name="Priorité haute" />
          </BarChart>
        );

      default: // line
        return (
          <LineChart width={400} height={300} data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="Nouvelles" stroke="#3b82f6" strokeWidth={3} name="Nouvelles" />
            <Line type="monotone" dataKey="En cours" stroke="#f59e0b" strokeWidth={3} name="En cours" />
            <Line type="monotone" dataKey="Terminées" stroke="#22c55e" strokeWidth={3} name="Terminées" />
            <Line type="monotone" dataKey="En retard" stroke="#ef4444" strokeWidth={3} name="En retard" />
            <Line type="monotone" dataKey="Priorité haute" stroke="#dc2626" strokeWidth={3} name="Priorité haute" />
          </LineChart>
        );
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h4>Performance des Tâches</h4>
        <div className="chart-controls">
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
            className={`chart-btn ${chartType === 'bar' ? 'active' : ''}`}
            onClick={() => setChartType('bar')}
          >
            Barres
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

export default TasksChart;