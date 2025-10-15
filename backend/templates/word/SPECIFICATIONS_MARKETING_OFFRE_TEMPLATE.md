# Template Fiche de Spécifications Marketing d'Offre

## Variables disponibles dans le template Word

### Informations générales

- `{{division_concernee}}` - Division concernée (service du propriétaire)
- `{{date_emission}}` - Date d'émission (date de création du projet)
- `{{numero_version}}` - Numéro de version
- `{{nom_projet}}` - Nom du projet
- `{{date_diffusion}}` - Date de diffusion (date de fin du projet)

### Personne qui a créé

- `{{nom_createur}}` - Nom du créateur (propriétaire du projet)
- `{{fonction_createur}}` - Fonction du créateur (rôle/service du propriétaire)
- `{{date_creation}}` - Date de création

### Personne qui a validé (à remplir manuellement)

- `{{nom_validateur}}` - Nom du validateur
- `{{fonction_validateur}}` - Fonction du validateur
- `{{date_validation}}` - Date de validation

### Personne qui a approuvé (à remplir manuellement)

- `{{nom_approbateur}}` - Nom de l'approbateur
- `{{fonction_approbateur}}` - Fonction de l'approbateur
- `{{date_approbation}}` - Date d'approbation

### Informations du projet

- `{{code_projet}}` - Code du projet
- `{{description_projet}}` - Description du projet
- `{{objectif_projet}}` - Objectif du projet
- `{{budget_projet}}` - Budget du projet
- `{{statut_projet}}` - Statut du projet
- `{{priorite_projet}}` - Priorité du projet
- `{{type_projet}}` - Type du projet
- `{{date_debut_projet}}` - Date de début du projet
- `{{date_fin_projet}}` - Date de fin du projet
- `{{duree_projet}}` - Durée du projet
- `{{date_du_jour}}` - Date du jour

### Spécifications marketing (à remplir manuellement)

- `{{specs_offre_positionnement}}` - Positionnement de l'offre
- `{{specs_offre_messages_cles}}` - Messages clés
- `{{specs_offre_canaux_communication}}` - Canaux de communication
- `{{specs_offre_support_communication}}` - Supports de communication
- `{{specs_offre_calendrier}}` - Calendrier
- `{{specs_offre_kpis}}` - KPIs

### Informations système

- `{{fiche_type}}` - Type de fiche
- `{{fiche_date_generation}}` - Date de génération de la fiche
- `{{fiche_version}}` - Version de la fiche

## Instructions d'utilisation

1. Ouvrir le fichier `specifications_marketing_offre.docx`
2. Remplacer toutes les variables `{{variable}}` par les valeurs correspondantes
3. Compléter les champs marqués "À remplir", "À définir", "À élaborer", etc.
4. Sauvegarder le template mis à jour
5. Le système utilisera automatiquement ce template pour générer les fiches

## Notes importantes

- Les informations du projet sont automatiquement récupérées depuis la base de données
- Les champs de validation et d'approbation doivent être complétés manuellement
- Les spécifications marketing doivent être définies selon le contexte du projet
- Les dates sont formatées en français (dd/mm/yyyy)
- Le budget est affiché tel qu'il est stocké dans la base de données
