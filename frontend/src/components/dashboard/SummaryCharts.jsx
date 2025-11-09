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

const SummaryCharts = ({ type = 'all', projectId = null }) => {
  const [data, setData] = useState(null);
  const [projectData, setProjectData] = useState(null);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setIsAnimating(true);
      
      if (projectId) {
        // Charger les données détaillées du projet
        try {
          const response = await analyticsService.getProjectDetails(projectId);
          
          if (response && response.project) {
            setProjectData(response);
            setData(null);
            setError(null);
          } else {
            setError('Projet non trouvé');
            setProjectData(null);
            setData(null);
          }
        } catch (err) {
          // Si le projet n'existe pas, charger les données générales
          const response = await analyticsService.getDashboard(30, null);
          setData(response);
          setProjectData(null);
          setError('Projet non trouvé, affichage des données générales');
        }
      } else {
        // Charger les données générales du dashboard
        const response = await analyticsService.getDashboard(30, null);
        setData(response);
        setProjectData(null);
        setError(null);
      }

      setTimeout(() => {
        setIsAnimating(false);
      }, 800);
    } catch (err) {
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

  if (error || (!data && !projectData)) {
    return (
      <div className="chart-content-placeholder">
        <div className="error-message">{error || 'Aucune donnée disponible'}</div>
      </div>
    );
  }

  // Si un projet est sélectionné, utiliser les données du projet
  let projectsData, totalProjects, completedProjects;
  let tasksData, totalTasks, completedTasks;
  let teamsData, totalMembers;

  if (projectData) {
    // --- Projects Data (Progression par phase) ---
    const progression = projectData.progression || {};
    projectsData = [
      { name: 'Terminées', value: progression.phases_terminees || 0, color: '#22c55e' },
      { name: 'En cours', value: progression.phases_en_cours || 0, color: '#3b82f6' },
      { name: 'En attente', value: progression.phases_en_attente || 0, color: '#f59e0b' },
    ].filter(item => item.value > 0);
    totalProjects = progression.total_phases || 0;
    completedProjects = progression.phases_terminees || 0;

    // --- Tasks Data (Tâches du projet) ---
    const taches = projectData.taches || {};
    const tachesParStatut = taches.par_statut || {};
    tasksData = [
      { name: 'En attente', value: tachesParStatut.en_attente || 0, color: '#f59e0b' },
      { name: 'En cours', value: tachesParStatut.en_cours || 0, color: '#3b82f6' },
      { name: 'Terminées', value: tachesParStatut.termine || 0, color: '#22c55e' },
      { name: 'En retard', value: tachesParStatut.hors_delai || 0, color: '#dc2626' },
    ].filter(item => item.value > 0);
    totalTasks = taches.total || 0;
    completedTasks = tachesParStatut.termine || 0;

    // --- Teams Data (Membres par service) ---
    const equipe = projectData.equipe || {};
    teamsData = (equipe.par_service || []).map((service, index) => ({
      name: service.service,
      value: service.count,
      color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
    })).filter(item => item.value > 0);
    totalMembers = equipe.total_membres || 0;
  } else {
    // Données générales (pas de projet sélectionné)
  const projectsMetrics = data.categories?.projects || [];
  const tasksMetrics = data.categories?.tasks || [];
  const usersMetrics = data.categories?.users || [];

  // --- Projects Data ---
    projectsData = [
    { name: 'En attente', value: projectsMetrics.find(m => m.name === 'Projets en_attente')?.value || 0, color: '#f59e0b' },
    { name: 'Terminés', value: projectsMetrics.find(m => m.name === 'Projets termine')?.value || 0, color: '#22c55e' },
    { name: 'En retard', value: projectsMetrics.find(m => m.name === 'Projets hors_delai')?.value || 0, color: '#dc2626' },
    { name: 'Rejetés', value: projectsMetrics.find(m => m.name === 'Projets rejete')?.value || 0, color: '#ef4444' },
    { name: 'Nouveaux', value: projectsMetrics.find(m => m.name === 'Nouveaux projets')?.value || 0, color: '#3b82f6' },
  ].filter(item => item.value > 0);
    totalProjects = projectsMetrics.find(m => m.name === 'Total des projets')?.value || 0;
    completedProjects = projectsMetrics.find(m => m.name === 'Projets termine')?.value || 0;

  // --- Tasks Data ---
    tasksData = [
    { name: 'Nouvelles', value: tasksMetrics.find(m => m.name === 'Nouvelles tâches')?.value || 0, color: '#8b5cf6' },
    { name: 'En attente', value: tasksMetrics.find(m => m.name === 'Tâches en_attente')?.value || 0, color: '#f59e0b' },
    { name: 'Terminées', value: tasksMetrics.find(m => m.name === 'Tâches termine')?.value || 0, color: '#22c55e' },
    { name: 'En retard', value: tasksMetrics.find(m => m.name === 'Tâches hors_delai')?.value || 0, color: '#dc2626' },
    { name: 'Priorité haute', value: tasksMetrics.find(m => m.name === 'Tâches haut')?.value || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);
    totalTasks = tasksMetrics.find(m => m.name === 'Total des tâches')?.value || 0;
    completedTasks = tasksMetrics.find(m => m.name === 'Tâches termine')?.value || 0;

    // --- Teams Data ---
    teamsData = (usersMetrics || [])
    .filter(m => m.name.startsWith('Membres - '))
    .map((m, index) => ({
      name: m.name.replace('Membres - ', ''),
      value: m.value,
      color: ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'][index % 6]
    }))
    .filter(item => item.value > 0);
    totalMembers = teamsData.reduce((sum, item) => sum + item.value, 0);
  }

  const renderChartContent = (chartType, data, dataKey, nameKey, colors, icon, noDataMessage) => {
    if (data.length === 0) {
      return (
        <div className="no-data" style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 20px',
          minHeight: '160px',
          textAlign: 'center',
          width: '100%',
          height: '100%',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0
        }}>
          {icon && React.cloneElement(icon, { 
            size: 48, 
            style: { 
              color: '#9ca3af', 
              marginBottom: '16px',
              opacity: 0.6,
              display: 'block',
              margin: '0 auto 16px'
            } 
          })}
          <p style={{
            fontSize: '16px',
            color: '#374151',
            margin: '0 auto',
            fontWeight: '600',
            lineHeight: '1.5',
            maxWidth: '500px',
            textAlign: 'center',
            width: '100%',
            display: 'block'
          }}>{noDataMessage}</p>
          <p style={{
            fontSize: '13px',
            color: '#6b7280',
            margin: '8px auto 0',
            lineHeight: '1.5',
            textAlign: 'center',
            maxWidth: '500px',
            width: '100%',
            display: 'block'
          }}>Les données apparaîtront ici une fois disponibles</p>
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
              outerRadius={120}
              innerRadius={50}
              dataKey={dataKey}
              nameKey={nameKey}
              animationBegin={0}
              animationDuration={1000}
              label={({ name, percent, value, cx, cy, midAngle, innerRadius, outerRadius }) => {
                const RADIAN = Math.PI / 180;
                const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
                const x = cx + radius * Math.cos(-midAngle * RADIAN);
                const y = cy + radius * Math.sin(-midAngle * RADIAN);
                
                return (
                  <text 
                    x={x} 
                    y={y} 
                    textAnchor={x > cx ? 'start' : 'end'} 
                    dominantBaseline="central"
                    style={{ fontSize: '16px', fontWeight: '600', fill: '#374151' }}
                  >
                    {`${name}: ${value}`}
                    <tspan x={x} dy="20" textAnchor={x > cx ? 'start' : 'end'} style={{ fontSize: '14px', fill: '#6b7280' }}>
                      {`${(percent * 100).toFixed(0)}%`}
                    </tspan>
                  </text>
                );
              }}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={{...commonTooltipStyle, fontSize: '14px', padding: '12px'}} />
            <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} iconSize={16} />
          </PieChart>
        );
      case 'radial':
        return (
          <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" barSize={20} data={data}>
            <RadialBar minAngle={15} label={{ position: 'insideStart', fill: '#fff', fontSize: 14 }} background clockWise dataKey={dataKey}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </RadialBar>
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={{...commonTooltipStyle, fontSize: '14px', padding: '12px'}} />
            <Legend wrapperStyle={{ fontSize: '14px', paddingTop: '20px' }} iconSize={16} />
          </RadialBarChart>
        );
      case 'bar':
        return (
          <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={nameKey} 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: nameKey, position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#374151' } }}
            />
            <YAxis 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: dataKey, angle: -90, position: 'insideLeft', style: { fontSize: 14, fill: '#374151' } }}
            />
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={{...commonTooltipStyle, fontSize: '14px', padding: '12px'}} />
            <Bar dataKey={dataKey} radius={[8, 8, 0, 0]} barSize={60}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color || colors[index % colors.length]} />
              ))}
            </Bar>
          </BarChart>
        );
      case 'area':
        return (
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={nameKey} 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: nameKey, position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#374151' } }}
            />
            <YAxis 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: dataKey, angle: -90, position: 'insideLeft', style: { fontSize: 14, fill: '#374151' } }}
            />
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={{...commonTooltipStyle, fontSize: '14px', padding: '12px'}} />
            <Area type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={3} fill={colors[0]} fillOpacity={0.6} />
          </AreaChart>
        );
      case 'line':
        return (
          <LineChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis 
              dataKey={nameKey} 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: nameKey, position: 'insideBottom', offset: -10, style: { fontSize: 14, fill: '#374151' } }}
            />
            <YAxis 
              tick={{ fontSize: 14, fill: '#374151' }}
              label={{ value: dataKey, angle: -90, position: 'insideLeft', style: { fontSize: 14, fill: '#374151' } }}
            />
            <Tooltip formatter={(value, name) => [value, name]} contentStyle={{...commonTooltipStyle, fontSize: '14px', padding: '12px'}} />
            <Line type="monotone" dataKey={dataKey} stroke={colors[0]} strokeWidth={4} dot={{ fill: colors[0], strokeWidth: 2, r: 8 }} activeDot={{ r: 10 }} />
          </LineChart>
        );
      default:
        return null;
    }
  };

  const renderChartCard = (chartName, title, subtitle, icon, data, dataKey, nameKey, colors, stats, noDataMessage = null) => (
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
      <div className="chart-content" style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
        <div style={{ flex: '1.2', minWidth: 0, display: 'flex', alignItems: 'center' }}>
          <ResponsiveContainer width="100%" height={300} minHeight={300}>
            {renderChartContent(
              chartTypes[chartName],
              data,
              dataKey,
              nameKey,
              colors,
              icon,
              noDataMessage || `Aucun(e) ${title.toLowerCase()} disponible`
            )}
          </ResponsiveContainer>
        </div>
        <div className="chart-footer" style={{ 
          flex: '0 0 200px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '12px',
          padding: '20px',
          background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
          borderRadius: '12px',
          border: '1px solid #e5e7eb',
          justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
        }}>
          <div className="chart-stats" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {stats.map((stat, index) => (
              <div key={index} className="stat-item" style={{
                padding: '16px',
                background: '#ffffff',
                borderRadius: '10px',
                border: '1px solid #e5e7eb',
                textAlign: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
              }}
              >
                <div style={{ fontSize: '28px', fontWeight: '700', color: '#111827', marginBottom: '6px', lineHeight: '1.2' }}>
                  {stat.value}
                </div>
                <div style={{ fontSize: '13px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  switch (type) {
    case 'projects':
      return renderChartCard(
        'projects',
        projectData ? 'Progression du Projet' : 'Évolution des Projets',
        projectData ? 'Répartition par phase' : 'Répartition par statut',
        <FolderOpen />,
        projectsData,
        'value',
        'name',
        ['#f59e0b', '#22c55e', '#dc2626', '#ef4444', '#3b82f6'],
        [
          { value: totalProjects, label: projectData ? 'Phases' : 'Total' },
          { value: completedProjects, label: projectData ? 'Terminées' : 'Terminés' },
        ]
      );
    case 'tasks':
      const taches = projectData?.taches || {};
      const tachesList = taches.liste || [];
      
      // Si un projet est sélectionné, afficher la carte avec la liste à droite
      if (projectData) {
        return (
          <div className={`summary-chart-card ${isAnimating ? 'animating' : ''}`}>
            <div className="chart-header">
              <div className="chart-title">
                <div className={`chart-icon-wrapper tasks`}>
                  <CheckCircle size={20} />
                </div>
                <div className="chart-title-text">
                  <h3>Tâches du Projet</h3>
                  <span className="chart-subtitle">Répartition par statut</span>
                </div>
              </div>
              <div className="chart-controls">
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
              </div>
            </div>
            <div className="chart-content" style={{ display: 'flex', gap: '20px', alignItems: 'stretch' }}>
              <div style={{ flex: '1.2', minWidth: 0, display: 'flex', alignItems: 'center' }}>
                <ResponsiveContainer width="100%" height={300} minHeight={300}>
                  {renderChartContent(
                    chartTypes.tasks,
                    tasksData,
                    'value',
                    'name',
                    ['#8b5cf6', '#f59e0b', '#22c55e', '#dc2626', '#ef4444'],
                    <CheckCircle />,
                    projectData && totalTasks === 0 
                      ? 'Aucune tâche n\'a été créée pour ce projet pour le moment' 
                      : 'Aucune donnée de tâche disponible'
                  )}
                </ResponsiveContainer>
              </div>
              <div style={{ 
                flex: '0 0 320px', 
                display: 'flex', 
                flexDirection: 'column', 
                gap: '12px',
                minHeight: '300px'
              }}>
                {/* Stats */}
                <div style={{ 
                  display: 'flex', 
                  flexDirection: 'row', 
                  gap: '10px',
                  padding: '16px',
                  background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                  borderRadius: '12px',
                  border: '1px solid #e5e7eb',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                }}>
                  <div style={{
                    flex: '1',
                    padding: '14px',
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '4px', lineHeight: '1.2' }}>
                      {totalTasks}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Total
                    </div>
                  </div>
                  <div style={{
                    flex: '1',
                    padding: '14px',
                    background: '#ffffff',
                    borderRadius: '10px',
                    border: '1px solid #e5e7eb',
                    textAlign: 'center',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.08)'
                  }}>
                    <div style={{ fontSize: '26px', fontWeight: '700', color: '#111827', marginBottom: '4px', lineHeight: '1.2' }}>
                      {completedTasks}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                      Terminées
                    </div>
                  </div>
                </div>
                
                {/* Liste des tâches */}
                {tachesList.length > 0 && (
                  <div className="tasks-list" style={{ 
                    flex: '1',
                    padding: '16px',
                    background: 'linear-gradient(135deg, #f9fafb 0%, #ffffff 100%)',
                    borderRadius: '12px',
                    border: '1px solid #e5e7eb',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: 0,
                    overflow: 'hidden',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.05)'
                  }}>
                    <h4 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '14px', color: '#374151', letterSpacing: '0.3px' }}>
                      Liste des tâches ({tachesList.length})
                    </h4>
                    <div className="tasks-container" style={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: '10px',
                      flex: '1',
                      overflowY: 'auto',
                      padding: '4px',
                      paddingRight: '8px'
                    }}>
                      {tachesList.map((tache) => (
                    <div 
                      key={tache.id}
                      style={{ 
                        padding: '12px', 
                        background: '#ffffff', 
                        borderRadius: '10px', 
                        border: '1px solid #e5e7eb',
                        borderLeft: `4px solid ${
                          tache.statut === 'termine' ? '#22c55e' :
                          tache.statut === 'en_cours' ? '#3b82f6' :
                          tache.statut === 'hors_delai' ? '#dc2626' : '#f59e0b'
                        }`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                        cursor: 'pointer'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateX(4px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(0,0,0,0.12)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateX(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.08)';
                      }}
                    >
                      {/* Photo du responsable */}
                      {tache.responsable ? (
                        tache.responsable.photo_url ? (
                          <img 
                            src={tache.responsable.photo_url} 
                            alt={tache.responsable.nom_complet}
                            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #e5e7eb', flexShrink: 0 }}
                          />
                        ) : (
                          <div style={{ 
                            width: '36px', 
                            height: '36px', 
                            borderRadius: '50%', 
                            background: '#3b82f6', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '14px',
                            border: '2px solid #e5e7eb',
                            flexShrink: 0
                          }}>
                            {tache.responsable.prenom?.[0]?.toUpperCase() || tache.responsable.nom?.[0]?.toUpperCase() || '?'}
                          </div>
                        )
                      ) : (
                        <div style={{ 
                          width: '36px', 
                          height: '36px', 
                          borderRadius: '50%', 
                          background: '#e5e7eb', 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center',
                          color: '#9ca3af',
                          fontWeight: '600',
                          fontSize: '14px',
                          flexShrink: 0
                        }}>
                          ?
                        </div>
                      )}
                      
                      {/* Informations de la tâche */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: '700', fontSize: '14px', color: '#111827', marginBottom: '8px', lineHeight: '1.4' }}>
                          {tache.titre}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginBottom: '8px' }}>
                          <span style={{ 
                            padding: '3px 8px', 
                            borderRadius: '6px',
                            fontSize: '11px',
                            fontWeight: '600',
                            background: tache.statut === 'termine' ? '#dcfce7' :
                                      tache.statut === 'en_cours' ? '#dbeafe' :
                                      tache.statut === 'hors_delai' ? '#fee2e2' : '#fef3c7',
                            color: tache.statut === 'termine' ? '#166534' :
                                  tache.statut === 'en_cours' ? '#1e40af' :
                                  tache.statut === 'hors_delai' ? '#991b1b' : '#92400e'
                          }}>
                            {tache.statut_display}
                          </span>
                          {tache.priorite && (
                            <span style={{ 
                              fontSize: '11px', 
                              color: '#6b7280', 
                              fontWeight: '600',
                              padding: '3px 8px',
                              background: '#f3f4f6',
                              borderRadius: '6px'
                            }}>
                              Priorité: {tache.priorite_display}
                            </span>
                          )}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11px', color: '#6b7280' }}>
                          {tache.responsable && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontWeight: '500' }}>Responsable:</span>
                              <span style={{ fontWeight: '600', color: '#111827' }}>
                                {tache.responsable.nom_complet}
                              </span>
                            </div>
                          )}
                          {(tache.debut || tache.fin) && (
                            <div style={{ display: 'flex', gap: '10px' }}>
                              {tache.debut && (
                                <span>Début: {new Date(tache.debut).toLocaleDateString('fr-FR')}</span>
                              )}
                              {tache.fin && (
                                <span>Fin: {new Date(tache.fin).toLocaleDateString('fr-FR')}</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
              </div>
            </div>
          </div>
        );
      }
      
      // Sinon, afficher juste la carte normale
      return renderChartCard(
        'tasks',
        projectData ? 'Tâches du Projet' : 'Performance des Tâches',
        projectData ? 'Répartition par statut' : 'Suivi de productivité',
        <CheckCircle />,
        tasksData,
        'value',
        'name',
        ['#8b5cf6', '#f59e0b', '#22c55e', '#dc2626', '#ef4444'],
        [
          { value: totalTasks, label: 'Total' },
          { value: completedTasks, label: 'Terminées' },
        ],
        projectData && totalTasks === 0 
          ? 'Aucune tâche n\'a été créée pour ce projet pour le moment' 
          : 'Aucune donnée de tâche disponible'
      );
    case 'teams':
      const equipe = projectData?.equipe || {};
      const membresList = equipe.membres || [];
      const membresParService = equipe.par_service || [];
      
      if (projectData && membresList.length === 0 && equipe.total_membres > 0) {
      }
      
      // Si un projet est sélectionné, afficher la carte + la liste en dehors
      if (projectData) {
        return (
          <div style={{ width: '100%' }}>
            {renderChartCard(
              'teams',
              projectData ? 'Équipe du Projet' : 'Répartition par Service',
              projectData ? 'Membres par service' : 'Distribution des équipes',
              <Users />,
              teamsData,
              'value',
              'name',
              ['#22c55e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
              [
                { value: teamsData.length, label: 'Services' },
                { value: totalMembers, label: 'Membres' },
              ]
            )}
            
            {/* Liste des membres du projet - en dehors de la carte - TOUJOURS AFFICHÉE */}
            <div className="team-members-list" style={{ 
              marginTop: '20px', 
              paddingTop: '20px', 
              borderTop: '2px solid #e5e7eb', 
              background: '#ffffff', 
              borderRadius: '8px', 
              padding: '16px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              width: '100%',
              boxSizing: 'border-box'
            }}>
              <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                Membres de l'équipe ({membresList.length || equipe.total_membres || 0})
              </h4>
              {membresList.length > 0 ? (
                <div className="members-grid" style={{ 
                  display: 'grid', 
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
                  gap: '12px',
                  minHeight: '100px',
                  maxHeight: '300px',
                  overflowY: 'auto',
                  padding: '4px',
                  paddingRight: '12px',
                  width: '100%'
                }}>
                {membresList.map((membre) => {
                  return (
                  <div 
                    key={membre.id} 
                    className="member-card" 
                    style={{ 
                      padding: '10px', 
                      background: '#f9fafb', 
                      borderRadius: '8px', 
                      border: '1px solid #e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    {membre.photo_url ? (
                      <img 
                        src={membre.photo_url} 
                        alt={membre.nom_complet}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        borderRadius: '50%', 
                        background: '#3b82f6', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        color: 'white',
                        fontWeight: '600',
                        fontSize: '12px'
                      }}>
                        {membre.prenom?.[0]?.toUpperCase() || membre.nom?.[0]?.toUpperCase() || '?'}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {membre.nom_complet}
                      </div>
                      {membre.role_projet && (
                        <div style={{ fontSize: '11px', color: '#6b7280', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {membre.role_projet}
                        </div>
                      )}
                      {membre.service && (
                        <div style={{ fontSize: '11px', color: '#3b82f6', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                          {membre.service}
                        </div>
                      )}
                      {membre.taches && membre.taches.total > 0 && (
                        <div style={{ fontSize: '10px', color: '#22c55e', marginTop: '4px', fontWeight: '500' }}>
                          {membre.taches.total} tâche{membre.taches.total > 1 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                  );
                })}
                </div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#6b7280' }}>
                  <Users size={32} style={{ marginBottom: '8px', opacity: 0.5 }} />
                  <p>Aucun membre trouvé dans l'équipe</p>
                  {equipe.total_membres > 0 && (
                    <p style={{ fontSize: '12px', marginTop: '4px' }}>
                      Total membres: {equipe.total_membres} (données en cours de chargement...)
                    </p>
                  )}
                </div>
              )}
            </div>
            
            {/* Détails des tâches par membre */}
            {membresList.length > 0 && membresList.some(m => m.taches && m.taches.total > 0) && (
              <div className="team-members-list" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #e5e7eb', background: '#ffffff', borderRadius: '8px', padding: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '12px', color: '#374151' }}>
                  Tâches par membre
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '350px', overflowY: 'auto', padding: '4px', paddingRight: '12px' }}>
                  {membresList.filter(m => m.taches && m.taches.total > 0).map((membre) => (
                      <div 
                        key={`taches-${membre.id}`}
                        style={{ 
                          padding: '12px', 
                          background: '#ffffff', 
                          borderRadius: '8px', 
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                          {membre.photo_url ? (
                            <img 
                              src={membre.photo_url} 
                              alt={membre.nom_complet}
                              style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                            />
                          ) : (
                            <div style={{ 
                              width: '24px', 
                              height: '24px', 
                              borderRadius: '50%', 
                              background: '#3b82f6', 
                              display: 'flex', 
                              alignItems: 'center', 
                              justifyContent: 'center',
                              color: 'white',
                              fontWeight: '600',
                              fontSize: '10px'
                            }}>
                              {membre.prenom?.[0]?.toUpperCase() || membre.nom?.[0]?.toUpperCase() || '?'}
                            </div>
                          )}
                          <div style={{ fontWeight: '600', fontSize: '13px', color: '#111827' }}>
                            {membre.nom_complet}
                          </div>
                          <div style={{ 
                            marginLeft: 'auto', 
                            fontSize: '11px', 
                            color: '#6b7280',
                            background: '#f3f4f6',
                            padding: '2px 8px',
                            borderRadius: '12px'
                          }}>
                            {membre.taches.total} tâche{membre.taches.total > 1 ? 's' : ''}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
                          {membre.taches.liste && membre.taches.liste.slice(0, 3).map((tache) => (
                            <div 
                              key={tache.id}
                              style={{ 
                                padding: '8px', 
                                background: '#f9fafb', 
                                borderRadius: '6px',
                                borderLeft: `3px solid ${
                                  tache.statut === 'termine' ? '#22c55e' :
                                  tache.statut === 'en_cours' ? '#3b82f6' :
                                  tache.statut === 'hors_delai' ? '#dc2626' : '#f59e0b'
                                }`
                              }}
                            >
                              <div style={{ fontWeight: '500', fontSize: '12px', color: '#111827', marginBottom: '4px' }}>
                                {tache.titre}
                              </div>
                              <div style={{ display: 'flex', gap: '8px', fontSize: '10px', color: '#6b7280' }}>
                                <span style={{ 
                                  padding: '2px 6px', 
                                  borderRadius: '4px',
                                  background: tache.statut === 'termine' ? '#dcfce7' :
                                            tache.statut === 'en_cours' ? '#dbeafe' :
                                            tache.statut === 'hors_delai' ? '#fee2e2' : '#fef3c7',
                                  color: tache.statut === 'termine' ? '#166534' :
                                        tache.statut === 'en_cours' ? '#1e40af' :
                                        tache.statut === 'hors_delai' ? '#991b1b' : '#92400e'
                                }}>
                                  {tache.statut_display}
                                </span>
                                {tache.priorite && (
                                  <span style={{ color: '#6b7280' }}>
                                    Priorité: {tache.priorite_display}
                                  </span>
                                )}
                                {tache.responsable && (
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                                    {tache.responsable.photo_url ? (
                                      <img 
                                        src={tache.responsable.photo_url} 
                                        alt={tache.responsable.nom_complet}
                                        style={{ width: '20px', height: '20px', borderRadius: '50%', objectFit: 'cover' }}
                                      />
                                    ) : (
                                      <div style={{ 
                                        width: '20px', 
                                        height: '20px', 
                                        borderRadius: '50%', 
                                        background: '#6b7280', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center',
                                        color: 'white',
                                        fontWeight: '600',
                                        fontSize: '10px'
                                      }}>
                                        {tache.responsable.prenom?.[0]?.toUpperCase() || tache.responsable.nom?.[0]?.toUpperCase() || '?'}
                                      </div>
                                    )}
                                    <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>
                                      {tache.responsable.nom_complet}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          ))}
                          {membre.taches.liste && membre.taches.liste.length > 3 && (
                            <div style={{ fontSize: '11px', color: '#6b7280', fontStyle: 'italic', padding: '4px' }}>
                              + {membre.taches.liste.length - 3} autre{membre.taches.liste.length - 3 > 1 ? 's' : ''} tâche{membre.taches.liste.length - 3 > 1 ? 's' : ''}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
                </div>
              )}
          </div>
        );
      }
      
      // Sinon, afficher juste la carte normale
      return renderChartCard(
        'teams',
        projectData ? 'Équipe du Projet' : 'Répartition par Service',
        projectData ? 'Membres par service' : 'Distribution des équipes',
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