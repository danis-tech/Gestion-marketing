# Guide des Styles Standardisés - Module Administration

## 🎨 **Classes CSS Uniques et Standardisées**

Toutes les classes CSS du module administration sont préfixées par `admin-` pour éviter les conflits avec les autres modules.

### **🏗️ Structure Principale**

```css
.admin-administration          /* Container principal */
/* Container principal */
.admin-sidebar                 /* Sidebar d'administration */
.admin-content; /* Zone de contenu principal */
```

### **🎯 Boutons Standardisés**

```css
.admin-btn                     /* Bouton de base */
/* Bouton de base */
.admin-btn-primary            /* Bouton principal (Bleu Gabon Telecom) */
.admin-btn-secondary          /* Bouton secondaire (Gris) */
.admin-btn-success            /* Bouton succès (Vert) */
.admin-btn-danger; /* Bouton danger (Rouge) */
```

**Exemple d'utilisation :**

```jsx
<button className="admin-btn admin-btn-primary">
	<UserPlus size={20} />
	Nouvel Utilisateur
</button>
```

### **📊 Tableaux Standardisés**

```css
.admin-table-container        /* Container du tableau */
/* Container du tableau */
.admin-table                  /* Tableau principal */
.admin-table-actions          /* Actions dans le tableau */
.admin-action-btn             /* Bouton d'action */
.admin-action-btn-edit        /* Bouton d'édition */
.admin-action-btn-delete; /* Bouton de suppression */
```

**Exemple d'utilisation :**

```jsx
<div className="admin-table-container">
	<table className="admin-table">
		<thead>
			<tr>
				<th>Nom</th>
				<th>Email</th>
				<th>Actions</th>
			</tr>
		</thead>
		<tbody>
			<tr>
				<td>John Doe</td>
				<td>john@example.com</td>
				<td>
					<div className="admin-table-actions">
						<button className="admin-action-btn admin-action-btn-edit">
							<Edit size={16} />
						</button>
						<button className="admin-action-btn admin-action-btn-delete">
							<Trash size={16} />
						</button>
					</div>
				</td>
			</tr>
		</tbody>
	</table>
</div>
```

### **📝 Formulaires Standardisés**

```css
.admin-form-group             /* Groupe de formulaire */
/* Groupe de formulaire */
.admin-form-label             /* Label de formulaire */
.admin-form-input             /* Champ de saisie */
.admin-form-select            /* Liste déroulante */
.admin-form-textarea; /* Zone de texte */
```

**Exemple d'utilisation :**

```jsx
<div className="admin-form-group">
	<label className="admin-form-label">Nom d'utilisateur</label>
	<input
		type="text"
		className="admin-form-input"
		placeholder="Entrez le nom d'utilisateur"
	/>
</div>
```

### **🔍 Recherche et Filtres**

```css
.admin-search-container       /* Container de recherche */
/* Container de recherche */
.admin-search-box             /* Boîte de recherche */
.admin-search-input           /* Champ de recherche */
.admin-search-icon; /* Icône de recherche */
```

**Exemple d'utilisation :**

```jsx
<div className="admin-search-container">
	<div className="admin-search-box">
		<Search className="admin-search-icon" />
		<input
			type="text"
			placeholder="Rechercher..."
			className="admin-search-input"
		/>
	</div>
	<select className="admin-form-select">
		<option>Filtrer par...</option>
	</select>
</div>
```

### **📋 Modaux Standardisés**

```css
.admin-modal-overlay          /* Overlay du modal */
/* Overlay du modal */
.admin-modal                  /* Modal principal */
.admin-modal-header           /* En-tête du modal */
.admin-modal-title            /* Titre du modal */
.admin-modal-body             /* Corps du modal */
.admin-modal-footer; /* Pied du modal */
```

**Exemple d'utilisation :**

```jsx
<div className="admin-modal-overlay">
	<div className="admin-modal">
		<div className="admin-modal-header">
			<h2 className="admin-modal-title">
				<UserPlus size={24} />
				Nouvel Utilisateur
			</h2>
		</div>
		<div className="admin-modal-body">{/* Contenu du formulaire */}</div>
		<div className="admin-modal-footer">
			<button className="admin-btn admin-btn-secondary">Annuler</button>
			<button className="admin-btn admin-btn-primary">Créer</button>
		</div>
	</div>
</div>
```

### **📑 En-têtes de Section**

```css
.admin-section-header         /* En-tête de section */
/* En-tête de section */
.admin-section-title          /* Titre de section */
.admin-section-actions; /* Actions de section */
```

**Exemple d'utilisation :**

```jsx
<div className="admin-section-header">
	<div className="admin-section-title">
		<Users size={32} />
		<h1>Gestion des Utilisateurs</h1>
	</div>
	<div className="admin-section-actions">
		<button className="admin-btn admin-btn-primary">Ajouter</button>
	</div>
</div>
```

### **🏷️ Badges et Statuts**

```css
.admin-badge                  /* Badge de base */
/* Badge de base */
.admin-badge-success          /* Badge succès (Vert) */
.admin-badge-warning          /* Badge avertissement (Orange) */
.admin-badge-danger           /* Badge danger (Rouge) */
.admin-badge-info; /* Badge info (Bleu) */
```

**Exemple d'utilisation :**

```jsx
<span className="admin-badge admin-badge-success">Actif</span>
<span className="admin-badge admin-badge-danger">Inactif</span>
```

### **📢 Messages d'État**

```css
.admin-alert                  /* Message d'alerte */
/* Message d'alerte */
.admin-alert-success          /* Message de succès */
.admin-alert-error            /* Message d'erreur */
.admin-alert-warning          /* Message d'avertissement */
.admin-alert-info; /* Message d'information */
```

**Exemple d'utilisation :**

```jsx
<div className="admin-alert admin-alert-success">
	<CheckCircle size={20} />
	Utilisateur créé avec succès !
</div>
```

## 🎨 **Couleurs Gabon Telecom**

### **Couleurs Principales**

- **Bleu Principal** : `#1e40af` → `#3b82f6`
- **Vert** : `#059669` → `#10b981`
- **Rouge** : `#dc2626` → `#ef4444`
- **Orange** : `#d97706` → `#f59e0b`
- **Gris** : `#6b7280` → `#9ca3af`

### **Dégradés Utilisés**

```css
/* Bleu Gabon Telecom */
background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);

/* Vert */
background: linear-gradient(135deg, #059669 0%, #10b981 100%);

/* Rouge */
background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%);
```

## 📱 **Responsive Design**

Tous les composants sont responsives et s'adaptent automatiquement aux différentes tailles d'écran :

- **Desktop** : Layout complet avec sidebar
- **Tablet** : Layout adaptatif
- **Mobile** : Layout empilé

## ✅ **Avantages**

1. **Cohérence** : Tous les modules utilisent les mêmes styles
2. **Maintenabilité** : Modification centralisée des styles
3. **Performance** : Pas de conflits CSS entre modules
4. **Accessibilité** : Styles optimisés pour l'accessibilité
5. **Branding** : Respect des couleurs Gabon Telecom

## 🚀 **Utilisation**

Pour utiliser ces styles dans un nouveau module d'administration :

1. Importez le CSS : `import './Administration.css'`
2. Utilisez les classes préfixées `admin-`
3. Respectez la structure des composants
4. Suivez les exemples fournis

**Tous les styles sont optimisés pour les couleurs Gabon Telecom et offrent une expérience utilisateur cohérente !** 🎉
