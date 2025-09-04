# 📊 Import Excel - Guide d'installation et d'utilisation

## 🚀 Installation

Pour utiliser la fonctionnalité d'import Excel, vous devez installer la bibliothèque `xlsx` :

```bash
npm install xlsx
# ou
yarn add xlsx
```

## 🔧 Configuration

### 1. Import de la bibliothèque

Dans votre composant `ProjectsDataTable.jsx`, décommentez et modifiez la fonction `previewExcelFile` :

```javascript
import * as XLSX from "xlsx";

const previewExcelFile = async (file) => {
	try {
		setImportLoading(true);

		// Lire le fichier Excel
		const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
		const sheetName = workbook.SheetNames[0];
		const worksheet = workbook.Sheets[sheetName];

		// Convertir en tableau
		const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

		setImportPreview(data);
	} catch (error) {
		console.error("Erreur lors de la lecture du fichier Excel:", error);
		alert("Erreur lors de la lecture du fichier Excel");
	} finally {
		setImportLoading(false);
	}
};
```

### 2. Fonction de téléchargement du template

Modifiez la fonction `downloadTemplate` pour créer et télécharger un vrai fichier Excel :

```javascript
const downloadTemplate = () => {
	const templateData = [
		[
			"Nom du projet",
			"Description",
			"Statut",
			"Date de début",
			"Date de fin",
			"Chef projet",
			"Service",
			"Priorité",
			"Budget (FCFA)",
		],
		[
			"Exemple Projet",
			"Description du projet",
			"en_cours",
			"2024-01-01",
			"2024-06-30",
			"Nom Chef",
			"Service",
			"haute",
			"5000000",
		],
		[
			"",
			"",
			"en_cours/en_attente/termine",
			"YYYY-MM-DD",
			"YYYY-MM-DD",
			"",
			"",
			"haute/moyenne/basse",
			"",
		],
	];

	// Créer le workbook
	const workbook = XLSX.utils.book_new();
	const worksheet = XLSX.utils.aoa_to_sheet(templateData);

	// Ajouter la feuille au workbook
	XLSX.utils.book_append_sheet(workbook, worksheet, "Template Projets");

	// Télécharger le fichier
	XLSX.writeFile(workbook, "template_projets.xlsx");
};
```

## 📋 Format du fichier Excel

### Colonnes requises (dans l'ordre) :

1. **Nom du projet** - Nom du projet (obligatoire)
2. **Description** - Description du projet
3. **Statut** - Une des valeurs : `en_cours`, `en_attente`, `termine`
4. **Date de début** - Format : `YYYY-MM-DD`
5. **Date de fin** - Format : `YYYY-MM-DD`
6. **Chef projet** - Nom du chef de projet
7. **Service** - Service responsable
8. **Priorité** - Une des valeurs : `haute`, `moyenne`, `basse`
9. **Budget** - Montant en FCFA (nombre entier)

### Exemple de données :

| Nom du projet | Description                   | Statut     | Date de début | Date de fin | Chef projet | Service       | Priorité | Budget (FCFA) |
| ------------- | ----------------------------- | ---------- | ------------- | ----------- | ----------- | ------------- | -------- | ------------- |
| Campagne SEO  | Optimisation du référencement | en_cours   | 2024-01-01    | 2024-06-30  | John Doe    | Marketing     | haute    | 5000000       |
| Refonte site  | Modernisation du site web     | en_attente | 2024-02-01    | 2024-08-31  | Jane Smith  | Développement | moyenne  | 8000000       |

## 🎯 Utilisation

### 1. Accéder à l'import

- Cliquez sur le bouton **"Importer Excel"** (vert) dans l'en-tête du tableau

### 2. Télécharger le template

- Cliquez sur **"Télécharger"** dans la section template
- Remplissez le fichier avec vos données

### 3. Sélectionner le fichier

- Cliquez sur la zone de dépôt ou utilisez le bouton de sélection
- Formats acceptés : `.xlsx`, `.xls`

### 4. Vérifier l'aperçu

- Les données sont automatiquement affichées dans un tableau
- Vérifiez que les colonnes correspondent

### 5. Importer

- Cliquez sur **"Importer"** pour finaliser l'import
- Les projets seront ajoutés à votre liste

## ⚠️ Validation des données

### Règles de validation :

- **Statut** : Doit être `en_cours`, `en_attente`, ou `termine`
- **Priorité** : Doit être `haute`, `moyenne`, ou `basse`
- **Dates** : Format `YYYY-MM-DD` obligatoire
- **Budget** : Nombre entier en FCFA

### Gestion des erreurs :

- Les lignes avec des erreurs de validation seront ignorées
- Un rapport d'erreur sera affiché après l'import

## 🔄 Traitement des données

### Conversion automatique :

- Les dates sont converties au format français
- Les budgets sont automatiquement en FCFA
- Les statuts et priorités sont normalisés

### Ajout des projets :

- Chaque ligne valide devient un nouveau projet
- Les IDs sont générés automatiquement
- Les projets sont ajoutés à la liste existante

## 🎨 Personnalisation

### Modifier les colonnes :

Pour ajouter ou modifier les colonnes, modifiez :

1. Le template dans `downloadTemplate()`
2. La validation dans `handleImport()`
3. La conversion des données

### Ajouter des validations :

```javascript
const validateRow = (row) => {
	// Ajoutez vos règles de validation ici
	if (!row[0] || row[0].trim() === "") return false;
	if (!["en_cours", "en_attente", "termine"].includes(row[2])) return false;
	// ... autres validations
	return true;
};
```

## 🚨 Dépannage

### Problèmes courants :

1. **Fichier non lu** : Vérifiez le format (.xlsx ou .xls)
2. **Colonnes manquantes** : Utilisez le template fourni
3. **Dates invalides** : Format YYYY-MM-DD obligatoire
4. **Statuts invalides** : Utilisez exactement : en_cours, en_attente, termine

### Support :

Si vous rencontrez des problèmes, vérifiez :

- La console du navigateur pour les erreurs
- Le format de votre fichier Excel
- La correspondance des colonnes avec le template
