import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, 
  Plus, 
  Edit, 
  Trash2, 
  Search, 
  Users,
  Save,
  X,
  Check,
  AlertCircle
} from 'lucide-react';
import { serviceService } from '../../services/apiService';
import CustomDataTable from '../ui/DataTable';
import './UserManagement.css';

const ServiceManagement = () => {
  // États principaux
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // États pour les modales
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [editingService, setEditingService] = useState(null);

  // États pour les filtres et recherche
  const [searchTerm, setSearchTerm] = useState('');

  // États pour les formulaires
  const [serviceForm, setServiceForm] = useState({
    code: '',
    nom: ''
  });

  // Charger les données initiales
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoading(true);
      const servicesData = await serviceService.getServices();
      setServices(servicesData.results || servicesData);
    } catch (err) {
      setError('Erreur lors du chargement des données: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  // Gestion des services
  const handleCreateService = async (e) => {
    e.preventDefault();
    try {
      await serviceService.createService(serviceForm);
      await loadInitialData();
      setShowServiceModal(false);
      resetServiceForm();
    } catch (err) {
      setError('Erreur lors de la création du service: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    }
  };

  const handleUpdateService = async (e) => {
    e.preventDefault();
    try {
      await serviceService.updateService(editingService.id, serviceForm);
      await loadInitialData();
      setShowServiceModal(false);
      setEditingService(null);
      resetServiceForm();
    } catch (err) {
      setError('Erreur lors de la mise à jour du service: ' + (err.response?.data?.detail || err.message));
      console.error('Erreur:', err);
    }
  };

  const handleDeleteService = async (serviceId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce service ?')) {
      try {
        await serviceService.deleteService(serviceId);
        await loadInitialData();
      } catch (err) {
        setError('Erreur lors de la suppression du service: ' + (err.response?.data?.detail || err.message));
        console.error('Erreur:', err);
      }
    }
  };

  // Fonctions utilitaires
  const resetServiceForm = () => {
    setServiceForm({
      code: '',
      nom: ''
    });
  };

  const openEditService = (service) => {
    setEditingService(service);
    setServiceForm({
      code: service.code,
      nom: service.nom
    });
    setShowServiceModal(true);
  };

  // Configuration des colonnes pour la DataTable
  const columns = useMemo(() => [
    {
      name: 'Code',
      selector: row => row.code,
      sortable: true,
      cell: (row) => (
        <div className="service-code">{row.code}</div>
      ),
      width: '150px'
    },
    {
      name: 'Nom',
      selector: row => row.nom,
      sortable: true,
      cell: (row) => (
        <div className="service-name">{row.nom}</div>
      ),
      width: '300px'
    },
    {
      name: 'Actions',
      cell: (row) => (
        <div className="table-action-container">
          <button 
            className="table-action-btn table-action-btn-edit"
            onClick={() => openEditService(row)}
            title="Modifier le service"
            type="button"
          >
            <Edit size={14} color="white" />
          </button>
          <button 
            className="table-action-btn table-action-btn-delete"
            onClick={() => handleDeleteService(row.id)}
            title="Supprimer le service"
            type="button"
          >
            <Trash2 size={14} color="white" />
          </button>
        </div>
      ),
      ignoreRowClick: true,
      allowOverflow: false,
      button: true,
      minWidth: '300px',
      center: true
    }
  ], []);

  // Filtrage des services
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = service.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           service.nom.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesSearch;
    });
  }, [services, searchTerm]);

  if (loading) {
    return (
      <div className="user-management">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-management">
      {/* En-tête */}
      <div className="admin-section-header">
        <div className="admin-section-title">
          <Building2 size={32} />
          <div>
            <h1>Gestion des Services</h1>
            <p style={{ fontSize: '14px', color: '#6b7280', margin: '4px 0 0 0', fontWeight: 'normal' }}>Administration • Services</p>
          </div>
        </div>
        <div className="admin-section-actions">
          <button 
            className="admin-btn admin-btn-primary"
            onClick={() => {
              resetServiceForm();
              setEditingService(null);
              setShowServiceModal(true);
            }}
          >
            <Plus size={20} />
            Nouveau Service
          </button>
        </div>
      </div>

      {/* DataTable des services */}
      <CustomDataTable
        data={filteredServices}
        columns={columns}
        title="Liste des services"
        searchable={true}
        filterable={false}
        exportable={true}
        pagination={true}
        loading={loading}
        searchPlaceholder="Rechercher un service..."
        onRefresh={loadInitialData}
        noDataMessage="Aucun service trouvé"
      />

      {/* Modale Service */}
      {showServiceModal && (
        <div className="modal-overlay" onClick={() => setShowServiceModal(false)}>
          <div className="modal-content user-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                <Building2 size={20} />
                {editingService ? 'Modifier le service' : 'Nouveau service'}
              </h3>
              <button 
                className="modal-close"
                onClick={() => setShowServiceModal(false)}
              >
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={editingService ? handleUpdateService : handleCreateService}>
              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>
                      <Building2 size={16} />
                      Code du service *
                    </label>
                    <input
                      type="text"
                      value={serviceForm.code}
                      onChange={(e) => setServiceForm({...serviceForm, code: e.target.value})}
                      required
                      placeholder="Ex: marketing, dsi, finance"
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <Building2 size={16} />
                      Nom du service *
                    </label>
                    <input
                      type="text"
                      value={serviceForm.nom}
                      onChange={(e) => setServiceForm({...serviceForm, nom: e.target.value})}
                      required
                      placeholder="Ex: Service Marketing, Direction des Systèmes d'Information"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowServiceModal(false)}>
                  Annuler
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} />
                  {editingService ? 'Mettre à jour' : 'Créer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Messages d'erreur */}
      {error && (
        <div className="error-message">
          <AlertCircle size={20} />
          {error}
          <button onClick={() => setError(null)}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export default ServiceManagement;
