# Système de Documents Téléversés

## Vue d'ensemble

Le système de documents téléversés permet aux utilisateurs de téléverser des fichiers (PDF, Word, Excel, images, etc.) et de les associer à des projets, phases et étapes spécifiques. Il se distingue du système de documents générés automatiquement.

## Modèle DocumentTeleverse

### Champs principaux

- **Relations** : `projet`, `phase`, `etape`
- **Fichier** : `nom_fichier_original`, `nom_fichier_stocke`, `chemin_fichier`, `taille_fichier`
- **Métadonnées** : `titre`, `description`, `mots_cles`, `version`
- **Statut** : `statut` (en_attente, valide, rejete, archive)
- **Utilisateurs** : `televerse_par`, `valide_par`
- **Dates** : `date_televersement`, `date_validation`, `date_modification`
- **Sécurité** : `est_public`, `hash_fichier`

### Types de fichiers supportés

- **Documents** : PDF, DOCX, DOC, XLSX, XLS, PPTX, PPT
- **Images** : JPG, JPEG, PNG, GIF, BMP, TIFF
- **Archives** : ZIP, RAR
- **Autres** : TXT, CSV

### Statuts disponibles

- `en_attente` : En attente de validation
- `valide` : Validé
- `rejete` : Rejeté
- `archive` : Archivé

## Endpoints API

### 1. Lister les documents téléversés d'un projet

```
GET /api/documents/dashboard/documents_televerses_projet/?projet_id={id}
```

### 2. Téléverser un document

```
POST /api/documents/dashboard/televerser_document/
```

**Paramètres** :

- `fichier` : Le fichier à téléverser
- `projet_id` : ID du projet (requis)
- `phase_id` : ID de la phase (optionnel)
- `etape_id` : ID de l'étape (optionnel)
- `titre` : Titre du document
- `description` : Description du document
- `mots_cles` : Mots-clés
- `version` : Version du document
- `est_public` : Document public (booléen)

### 3. Télécharger un document

```
GET /api/documents/dashboard/telecharger_document_televerse/?document_id={id}
```

### 4. Valider/Rejeter un document

```
PUT /api/documents/dashboard/valider_document_televerse/
```

**Paramètres** :

- `document_id` : ID du document
- `statut` : 'valide' ou 'rejete'
- `commentaire` : Commentaire de validation

### 5. Supprimer un document

```
DELETE /api/documents/dashboard/supprimer_document_televerse/
```

**Paramètres** :

- `document_id` : ID du document

## Structure des dossiers

```
media/
└── documents_televerses/
    └── {projet_id}/
        └── {timestamp}_{nom_fichier_original}
```

## Sérialiseurs

### DocumentTeleverseListSerializer

Version allégée pour les listes avec les propriétés calculées.

### DocumentTeleverseDetailSerializer

Version complète avec toutes les informations.

### DocumentTeleverseCreateSerializer

Pour la création de nouveaux documents.

### DocumentTeleverseUpdateSerializer

Pour la mise à jour des documents existants.

## Propriétés calculées

- `taille_fichier_mb` : Taille en MB
- `est_image` : True si c'est une image
- `est_document_office` : True si c'est un document Office
- `est_archive` : True si c'est une archive
- `url_fichier` : URL d'accès au fichier

## Sécurité

- **Hash SHA-256** : Calculé automatiquement pour chaque fichier
- **Permissions** : Seul le créateur peut supprimer ses documents
- **Validation** : Système de validation avec commentaires
- **Visibilité** : Contrôle de la visibilité publique

## Utilisation

1. **Téléversement** : L'utilisateur sélectionne un fichier et l'associe à un projet/phase/étape
2. **Stockage** : Le fichier est stocké dans un dossier dédié avec un nom unique
3. **Métadonnées** : Les informations sont stockées en base de données
4. **Validation** : Un validateur peut approuver ou rejeter le document
5. **Accès** : Les utilisateurs peuvent télécharger les documents validés

## Distinction avec les documents générés

| Aspect         | Documents Générés         | Documents Téléversés         |
| -------------- | ------------------------- | ---------------------------- |
| **Source**     | Générés automatiquement   | Téléversés par l'utilisateur |
| **Types**      | Templates Word prédéfinis | Tous types de fichiers       |
| **Contenu**    | Données du projet         | Contenu libre                |
| **Validation** | Automatique               | Manuelle                     |
| **Stockage**   | Dossier templates         | Dossier documents_televerses |
| **Modèle**     | DocumentProjet            | DocumentTeleverse            |
