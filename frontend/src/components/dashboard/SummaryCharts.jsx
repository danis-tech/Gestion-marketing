import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area, RadialBarChart, RadialBar
} from 'recharts';
import {
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  FolderOpen,
  CheckCircle,
  Activity,
  Target,
  RefreshCw,
  Eye,
  BarChart2,
  Users2,
  Clock,
  AlertCircle,
  Calendar,
  User,
  Zap,
  Star,
  Award
} from 'lucide-react';
import { analyticsService } from '../../services/apiService';
import './SummaryCharts.css';

const SummaryCharts = ({ type = 'all' }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [chartTypes, setChartTypes] = useState({
    projects: 'pie',
    tasks: 'bar',
    teams: 'line'
  });
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setIsAnimating(true);
      const response = await analyticsService.getDashboard(30);
      setData(response);
      setError(null);

      setTimeout(() => {
        setIsAnimating(false);
      }, 800);
    } catch (err) {
      console.error('Erreur lors du chargement des données:', err);
      setError('Impossible de charger les données');
      setIsAnimating(false);
    } finally {
      setLoading(false);
    }
  };

  const handleChartTypeChange = (chartName, newType) => {
    setChartTypes(prev => ({
      ...prev,
      [chartName]: newType
    }));
  };

  if (loading) {
    return (
      <div className="chart-content-placeholder">
        <div className="loading-spinner">Chargement des données...</div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="chart-content-placeholder">
        <div className="error-message">{error || 'Aucune donnée disponible'}</div>
      </div>
    );
  }

  const projectsMetrics = data.categories?.projects || [];
  const tasksMetrics = data.categories?.tasks || [];
  const usersMetrics = data.categories?.users || [];
  const performanceMetrics = data.categories?.performance || [];
  const documentsMetrics = data.categories?.documents || [];
  const systemMetrics = data.categories?.system || [];
  const delayMetrics = data.categories?.delays || [];
  const teamMetrics = data.categories?.teams || [];

  // --- Projects Data ---
  const projectsData = [
    { name: 'En attente', value: projectsMetrics.find(m => m.name === 'Projets en_attente')?.value || 0, color: '#f59e0b' },
    { name: 'Terminés', value: projectsMetrics.find(m => m.name === 'Projets termine')?.value || 0, color: '#22c55e' },
    { name: 'En retard', value: projectsMetrics.find(m => m.name === 'Projets hors_delai')?.value || 0, color: '#dc2626' },
    { name: 'Rejetés', value: projectsMetrics.find(m => m.name === 'Projets rejete')?.value || 0, color: '#ef4444' },
    { name: 'Nouveaux', value: projectsMetrics.find(m => m.name === 'Nouveaux projets')?.value || 0, color: '#3b82f6' },
  ].filter(item => item.value > 0);

  const totalProjects = projectsMetrics.find(m => m.name === 'Total des projets')?.value || 0;
  const completedProjects = projectsMetrics.find(m => m.name === 'Projets termine')?.value || 0;

  // --- Tasks Data ---
  const tasksData = [
    { name: 'Nouvelles', value: tasksMetrics.find(m => m.name === 'Nouvelles tâches')?.value || 0, color: '#8b5cf6' },
    { name: 'En attente', value: tasksMetrics.find(m => m.name === 'Tâches en_attente')?.value || 0, color: '#f59e0b' },
    { name: 'Terminées', value: tasksMetrics.find(m => m.name === 'Tâches termine')?.value || 0, color: '#22c55e' },
    { name: 'En retard', value: tasksMetrics.find(m => m.name === 'Tâches hors_delai')?.value || 0, color: '#dc2626' },
    { name: 'Priorité haute', value: tasksMetrics.find(m => m.name === 'Tâches haut')?.value || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const totalTasks = tasksMetrics.find(m => m.name === 'Total des tâches')?.value || 0;
  const completedTasks = tasksMetrics.find(m => m.name === 'Tâches termine')?.value || 0;

  // --- Teams Data (using services metrics from users category) ---
  const teamsData = (usersMetrics || [])
    .filter(m => m.name.startsWith('Membres - '))
    .map((m, index) => ({
      name: m.name.replace('Membres - ', ''),
      value: m.value,
      color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
    }))
    .filter(item => item.value > 0);

  const totalMembers = teamsData.reduce((sum, item) => sum + item.value, 0);

  const renderChartContent = (chartType, data, dataKey, nameKey, colors, icon, noDataMessage) => {
    if (data.length === 0) {
      return (
        <div className="no-data">
          {icon && React.cloneElement(icon, { size: 32 })}
          <p>{noDataMessage}</p>
        </div>
      );
    }

    const commonTooltipStyle = {
      background: 'rgba(255, 255, 255, 0.95)',
      border: 'none',
      borderRadius: '12px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      padding: '10px',
    };

    switch (chartType) {
      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={70}
              innerRadius={30}
              dataKey={dataKey}
              nameKey={nameKey}
              animationBegin={0}
              animationDuration={1000}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={commonTooltipStyle} />
            <Legend />
          </PieChart>
        );
      case 'radial':
        return (
          <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" barSize={10} data={data}>
            <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff' }} background clockWise dataKey={dataKey}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </RadialBar>
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={commonTooltipStyle} />
          </RadialBarChart>
        );
      case 'bar':
        return (
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={nameKey} />
            <YAxis />
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={commonTooltipStyle} />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={nameKey} />
            <YAxis />
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={commonTooltipStyle} />
            <Area type="monotone" dataKey={dataKey} stroke={colors[0]} fill={colors[0]} fillOpacity={0.6} />
          </AreaChart>
        );
      case 'line':
        return (
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey={nameKey} />
            <YAxis />
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={commonTooltipStyle} />
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={3} dot={{ fill: colors[0], strokeWidth: 2, r: 6 }} />
          </LineChart>
        );
      default:
        return null;
    }
  };

  const renderChartCard = (chartName, title, subtitle, icon, data, dataKey, nameKey, colors, stats) => (
    <div className={`summary-chart-card ${isAnimating ? 'animating' : ''}`}>
      <div className="chart-header">
        <div className="chart-title">
          <div className={`chart-icon-wrapper ${chartName}`}>
            {icon && React.cloneElement(icon, { size: 20 })}
          </div>
          <div className="chart-title-text">
            <h3>{title}</h3>
            <span className="chart-subtitle">{subtitle}</span>
          </div>
        </div>
        <div className="chart-controls">
          {chartName === 'projects' && (
            <>
              <button
                className={`chart-btn ${chartTypes.projects === 'pie' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('projects', 'pie')}
              >
                <PieChartIcon size={14} />
                Camembert
              </button>
              <button
                className={`chart-btn ${chartTypes.projects === 'radial' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('projects', 'radial')}
              >
                <Target size={14} />
                Radial
              </button>
              <button
                className={`chart-btn ${chartTypes.projects === 'bar' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('projects', 'bar')}
              >
                <BarChart2 size={14} />
                Barres
              </button>
            </>
          )}
          {chartName === 'tasks' && (
            <>
              <button
                className={`chart-btn ${chartTypes.tasks === 'bar' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('tasks', 'bar')}
              >
                <BarChart2 size={14} />
                Barres
              </button>
              <button
                className={`chart-btn ${chartTypes.tasks === 'area' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('tasks', 'area')}
              >
                <Activity size={14} />
                Aire
              </button>
              <button
                className={`chart-btn ${chartTypes.tasks === 'line' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('tasks', 'line')}
              >
                <TrendingUp size={14} />
                Ligne
              </button>
            </>
          )}
          {chartName === 'teams' && (
            <>
              <button
                className={`chart-btn ${chartTypes.teams === 'line' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('teams', 'line')}
              >
                <TrendingUp size={14} />
                Ligne
              </button>
              <button
                className={`chart-btn ${chartTypes.teams === 'bar' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('teams', 'bar')}
              >
                <BarChart2 size={14} />
                Barres
              </button>
              <button
                className={`chart-btn ${chartTypes.teams === 'pie' ? 'active' : ''}`}
                onClick={() => handleChartTypeChange('teams', 'pie')}
              >
                <PieChartIcon size={14} />
                Camembert
              </button>
            </>
          )}
        </div>
      </div>
      <div className="chart-content">
        <ResponsiveContainer width="100%" height="100%">
          {renderChartContent(
            chartTypes[chartName],
            data,
            dataKey,
            nameKey,
            colors,
            icon,
            `Aucun(e) ${title.toLowerCase()} disponible`
          )}
        </ResponsiveContainer>
      </div>
      <div className="chart-footer">
        <div className="chart-stats">
          {stats.map((stat, index) => (
            <span key={index} className="stat-item">
              <strong>{stat.value}</strong> {stat.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'projects':
      return renderChartCard(
        'projects',
        'Évolution des Projets',
        'Répartition par statut',
        <FolderOpen />,
        projectsData,
        'value',
        'name',
        ['#f59e0b', '#22c55e', '#dc2626', '#ef4444', '#3b82f6'],
        [
          { value: totalProjects, label: 'Total' },
          { value: completedProjects, label: 'Terminés' },
        ]
      );
    case 'tasks':
      return renderChartCard(
        'tasks',
        'Performance des Tâches',
        'Suivi de productivité',
        <CheckCircle />,
        tasksData,
        'value',
        'name',
        ['#8b5cf6', '#f59e0b', '#22c55e', '#dc2626', '#ef4444'],
        [
          { value: totalTasks, label: 'Total' },
          { value: completedTasks, label: 'Terminées' },
        ]
      );
    case 'teams':
      return renderChartCard(
        'teams',
        'Répartition par Service',
        'Distribution des équipes',
        <Users />,
        teamsData,
        'value',
        'name',
        ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
        [
          { value: teamsData.length, label: 'Services' },
          { value: totalMembers, label: 'Membres' },
        ]
      );
    default:
      return null;
  }
};

export default SummaryCharts;