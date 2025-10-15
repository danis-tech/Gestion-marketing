# Template Fiche Projet Marketing

## Variables disponibles dans le template Word

### A. Informations générales

- `{{reference_offre}}` - Référence de l'offre (code du projet)
- `{{segment_vise}}` - Segment visé
- `{{periode_lancement_debut}}` - Date de début du lancement
- `{{periode_lancement_fin}}` - Date de fin du lancement
- `{{duree_offre}}` - Durée de l'offre
- `{{nom_emetteur}}` - Nom de l'émetteur
- `{{fonction_emetteur}}` - Fonction de l'émetteur
- `{{pieces_jointes}}` - Pièces jointes

### B. Description de l'offre

- `{{contexte}}` - Contexte
- `{{presentation_offre}}` - Présentation de l'offre
- `{{nom_commercial_offre}}` - Nom commercial de l'offre
- `{{description_fonctionnalites}}` - Description des fonctionnalités
- `{{conditions_offre}}` - Conditions de l'offre
- `{{comptabilite_priorites}}` - Comptabilité/Priorités
- `{{achat_acquisition_materiels}}` - Achat/Acquisition de matériels
- `{{facturation}}` - Facturation
- `{{structure_tarifaire}}` - Structure tarifaire
- `{{benefices_clients}}` - Bénéfices clients
- `{{benefices_operateurs}}` - Bénéfices opérateurs
- `{{processus_vente_mise_service}}` - Processus de vente et de mise en service
- `{{evolution_interfaces_si}}` - Évolution des interfaces SI
- `{{volumetrie_souhaitee}}` - Volumétrie souhaitée
- `{{evolutions_futures}}` - Les évolutions futures
- `{{date_mise_service_souhaitee}}` - Date souhaitée de mise en service

### C. Informations issues des conceptions similaires

- `{{offres_similaires}}` - Offres similaires
- `{{commentaires_offres_similaires}}` - Commentaires sur les offres similaires

### D. Risques

- `{{risques}}` - Risques

### E. Budget

- `{{budget}}` - Budget

### Validation - Équipe projet

- `{{chef_service_marketing_nom}}` - Nom du chef de service marketing
- `{{chef_service_marketing_date}}` - Date de signature
- `{{chef_service_marketing_signature}}` - Signature
- `{{chef_service_marketing_observations}}` - Observations

- `{{responsable_division_marketing_nom}}` - Nom du responsable division marketing
- `{{responsable_division_marketing_date}}` - Date de signature
- `{{responsable_division_marketing_signature}}` - Signature
- `{{responsable_division_marketing_observations}}` - Observations

- `{{directeur_services_nom}}` - Nom du directeur services
- `{{directeur_services_date}}` - Date de signature
- `{{directeur_services_signature}}` - Signature
- `{{directeur_services_observations}}` - Observations

- `{{directeur_generale_nom}}` - Nom du directeur général
- `{{directeur_generale_date}}` - Date de signature
- `{{directeur_generale_signature}}` - Signature
- `{{directeur_generale_observations}}` - Observations

### Informations système

- `{{fiche_date_generation}}` - Date de génération de la fiche
- `{{fiche_version}}` - Version de la fiche
- `{{projet_code}}` - Code du projet
- `{{projet_nom}}` - Nom du projet

## Instructions d'utilisation

1. Ouvrir le fichier `fiche_projet_marketing.docx`
2. Remplacer toutes les variables `{{variable}}` par les valeurs correspondantes
3. Sauvegarder le template mis à jour
4. Le système utilisera automatiquement ce template pour générer les fiches

## Notes importantes

- Toutes les variables sont automatiquement remplies depuis la base de données
- Les champs marqués "À définir" ou "À renseigner" doivent être complétés manuellement
- Les dates sont formatées en français (dd/mm/yyyy)
- Le budget est affiché tel qu'il est stocké dans la base de données
