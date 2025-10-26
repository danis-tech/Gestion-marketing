import React, { useState, useMemo } from 'react';
import DataTable from 'react-data-table-component';
import { Search, Filter, Download, RefreshCw } from 'lucide-react';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import './DataTable.css';

const CustomDataTable = ({
  data = [],
  columns = [],
  title = "Tableau de données",
  searchable = true,
  filterable = true,
  exportable = false,
  pagination = true,
  selectableRows = false,
  onRowSelected = null,
  loading = false,
  noDataMessage = "Aucune donnée disponible",
  searchPlaceholder = "Rechercher...",
  customFilterComponent = null,
  onRefresh = null,
  exportFileName = "export",
  className = "",
  ...props
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredData, setFilteredData] = useState(data);
  const [selectedRows, setSelectedRows] = useState([]);

  // Filtrage des données
  const filteredItems = useMemo(() => {
    if (!searchTerm) return data;
    
    return data.filter(item => {
      return Object.values(item).some(value => {
        if (typeof value === 'string') {
          return value.toLowerCase().includes(searchTerm.toLowerCase());
        }
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).some(subValue => 
            typeof subValue === 'string' && 
            subValue.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }
        return false;
      });
    });
  }, [data, searchTerm]);

  // Fonction d'export Excel
  const handleExportToExcel = () => {
    try {
      // Préparer les données pour l'export
      const exportData = filteredData.map(item => {
        const exportItem = {};
        columns.forEach(column => {
          if (column.selector && column.name) {
            const value = column.selector(item);
            // Nettoyer les valeurs pour Excel
            if (typeof value === 'object' && value !== null) {
              exportItem[column.name] = JSON.stringify(value);
            } else {
              exportItem[column.name] = value || '';
            }
          }
        });
        return exportItem;
      });

      // Créer le workbook
      const ws = XLSX.utils.json_to_sheet(exportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Données");

      // Générer le fichier Excel
      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      
      // Télécharger le fichier
      const fileName = `${exportFileName}_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(data, fileName);
      
    } catch (error) {
      console.error('Erreur lors de l\'export Excel:', error);
      alert('Erreur lors de l\'export Excel');
    }
  };

  // Configuration des colonnes avec styles améliorés
  const enhancedColumns = useMemo(() => {
    return columns.map(column => ({
      ...column,
      style: {
        fontSize: '14px',
        fontWeight: column.selector === 'name' || column.selector === 'nom' || column.selector === 'prenom' ? '600' : '400',
        color: '#1f2937',
        ...column.style
      },
      headerStyle: {
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#ffffff',
        backgroundColor: '#1e40af',
        padding: '16px 12px',
        ...column.headerStyle
      }
    }));
  }, [columns]);

  // Gestion de la sélection des lignes
  const handleRowSelected = (state) => {
    setSelectedRows(state.selectedRows);
    if (onRowSelected) {
      onRowSelected(state.selectedRows);
    }
  };

  // Styles personnalisés pour la DataTable
  const customStyles = {
    table: {
      style: {
        backgroundColor: '#ffffff',
        borderRadius: '12px',
        overflow: 'hidden',
        boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#1e40af',
        borderRadius: '12px 12px 0 0',
        minHeight: '56px',
      },
    },
    headCells: {
      style: {
        fontSize: '12px',
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
        color: '#ffffff',
        padding: '16px 12px',
        borderBottom: 'none',
      },
    },
    cells: {
      style: {
        fontSize: '14px',
        color: '#1f2937',
        padding: '16px 12px',
        borderBottom: '1px solid #f1f5f9',
        minHeight: '60px',
        display: 'flex',
        alignItems: 'center',
      },
    },
    rows: {
      style: {
        minHeight: '60px',
        '&:nth-of-type(odd)': {
          backgroundColor: '#ffffff',
        },
        '&:nth-of-type(even)': {
          backgroundColor: '#f8fafc',
        },
        '&:hover': {
          backgroundColor: '#f0f9ff !important',
          cursor: 'pointer',
        },
      },
    },
    pagination: {
      style: {
        backgroundColor: '#ffffff',
        borderTop: '1px solid #e5e7eb',
        padding: '16px',
        fontSize: '14px',
        color: '#6b7280',
      },
    },
    noData: {
      style: {
        fontSize: '16px',
        color: '#6b7280',
        padding: '40px',
        textAlign: 'center',
      },
    },
  };

  return (
    <div className={`custom-datatable ${className}`}>
      {/* En-tête avec titre et actions */}
      <div className="datatable-header">
        <div className="datatable-title">
          <h3>{title}</h3>
          <span className="datatable-count">
            {filteredItems.length} élément{filteredItems.length > 1 ? 's' : ''}
          </span>
        </div>
        
        <div className="datatable-actions">
          {onRefresh && (
            <button 
              className="datatable-action-btn"
              onClick={onRefresh}
              title="Actualiser"
            >
              <RefreshCw size={16} />
            </button>
          )}
          
          {exportable && (
            <button 
              className="datatable-action-btn"
              onClick={handleExportToExcel}
              title="Exporter"
            >
              <Download size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Barre de recherche et filtres */}
      {(searchable || filterable || customFilterComponent) && (
        <div className="datatable-filters">
          {searchable && (
            <div className="search-box">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder={searchPlaceholder}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          )}
          
          {customFilterComponent && (
            <div className="custom-filters">
              {customFilterComponent}
            </div>
          )}
        </div>
      )}

      {/* Tableau de données */}
      <div className="datatable-container">
        <DataTable
          columns={enhancedColumns}
          data={filteredItems}
          customStyles={customStyles}
          pagination={pagination}
          paginationPerPage={10}
          paginationRowsPerPageOptions={[5, 10, 20, 50]}
          selectableRows={selectableRows}
          onSelectedRowsChange={handleRowSelected}
          noDataComponent={
            <div className="no-data">
              <div className="no-data-icon">📊</div>
              <h4>{noDataMessage}</h4>
              <p>Aucune donnée ne correspond à vos critères de recherche.</p>
            </div>
          }
          progressPending={loading}
          progressComponent={
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Chargement des données...</p>
            </div>
          }
          highlightOnHover
          pointerOnHover
          {...props}
        />
      </div>

      {/* Informations de sélection */}
      {selectableRows && selectedRows.length > 0 && (
        <div className="selection-info">
          <span>{selectedRows.length} élément{selectedRows.length > 1 ? 's' : ''} sélectionné{selectedRows.length > 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};

export default CustomDataTable;