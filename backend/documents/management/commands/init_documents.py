from django.core.management.base import BaseCommand
from django.conf import settings
import os
import shutil
from pathlib import Path


class Command(BaseCommand):
    help = 'Initialise le système de documents avec les répertoires et templates de base'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Force la réinitialisation même si les répertoires existent'
        )
        parser.add_argument(
            '--create-templates',
            action='store_true',
            help='Crée des templates Word de base'
        )

    def handle(self, *args, **options):
        force = options['force']
        create_templates = options['create_templates']
        
        self.stdout.write(
            self.style.SUCCESS('🚀 Initialisation du système de documents...')
        )
        
        # 1. Créer les répertoires nécessaires
        self.create_directories(force)
        
        # 2. Créer les templates de base si demandé
        if create_templates:
            self.create_base_templates()
        
        # 3. Vérifier la configuration
        self.check_configuration()
        
        self.stdout.write(
            self.style.SUCCESS('✅ Initialisation terminée avec succès!')
        )

    def create_directories(self, force=False):
        """Crée les répertoires nécessaires."""
        self.stdout.write('📁 Création des répertoires...')
        
        directories = [
            os.path.join(settings.BASE_DIR, 'templates', 'word'),
            os.path.join(settings.MEDIA_ROOT, 'generated'),
            os.path.join(settings.MEDIA_ROOT, 'documents'),
            os.path.join(settings.MEDIA_ROOT, 'templates'),
        ]
        
        for directory in directories:
            if os.path.exists(directory) and not force:
                self.stdout.write(f'  ✓ {directory} (existe déjà)')
                continue
            
            try:
                os.makedirs(directory, exist_ok=True)
                self.stdout.write(f'  ✓ {directory}')
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Erreur création {directory}: {e}')
                )

    def create_base_templates(self):
        """Crée des templates Word de base."""
        self.stdout.write('📄 Création des templates de base...')
        
        templates_dir = os.path.join(settings.BASE_DIR, 'templates', 'word')
        
        # Template de base pour les fiches projet marketing
        self.create_template_file(
            os.path.join(templates_dir, 'fiche_projet_marketing.docx'),
            self.get_fiche_projet_marketing_template()
        )
        
        # Template de base pour les fiches plan projet
        self.create_template_file(
            os.path.join(templates_dir, 'fiche_plan_projet.docx'),
            self.get_fiche_plan_projet_template()
        )
        
        # Template de base pour les contrats
        self.create_template_file(
            os.path.join(templates_dir, 'contrat.docx'),
            self.get_contrat_template()
        )
        
        # Template de base pour les devis
        self.create_template_file(
            os.path.join(templates_dir, 'devis.docx'),
            self.get_devis_template()
        )
        
        # Template de base pour les factures
        self.create_template_file(
            os.path.join(templates_dir, 'facture.docx'),
            self.get_facture_template()
        )

    def create_template_file(self, file_path, content):
        """Crée un fichier template."""
        try:
            if os.path.exists(file_path):
                self.stdout.write(f'  ✓ {os.path.basename(file_path)} (existe déjà)')
                return
            
            # Créer un fichier texte temporaire avec le contenu
            # En production, vous devriez utiliser python-docx pour créer de vrais fichiers .docx
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            self.stdout.write(f'  ✓ {os.path.basename(file_path)}')
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'  ✗ Erreur création {file_path}: {e}')
            )

    def check_configuration(self):
        """Vérifie la configuration du système."""
        self.stdout.write('🔧 Vérification de la configuration...')
        
        # Vérifier les répertoires
        required_dirs = [
            os.path.join(settings.BASE_DIR, 'templates', 'word'),
            os.path.join(settings.MEDIA_ROOT, 'generated'),
        ]
        
        for directory in required_dirs:
            if os.path.exists(directory) and os.access(directory, os.W_OK):
                self.stdout.write(f'  ✓ {directory} (accessible en écriture)')
            else:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ {directory} (non accessible)')
                )
        
        # Vérifier LibreOffice (optionnel)
        try:
            import subprocess
            result = subprocess.run(['libreoffice', '--version'], 
                                  capture_output=True, text=True, timeout=5)
            if result.returncode == 0:
                self.stdout.write('  ✓ LibreOffice disponible')
            else:
                self.stdout.write('  ⚠ LibreOffice non disponible (WeasyPrint sera utilisé)')
        except:
            self.stdout.write('  ⚠ LibreOffice non disponible (WeasyPrint sera utilisé)')

    def get_fiche_projet_marketing_template(self):
        """Retourne le contenu du template fiche projet marketing."""
        return """FICHE PROJET MARKETING

Projet: {{projet_nom}}
Code: {{projet_code}}
Date: {{fiche_date_generation}}

1. INFORMATIONS GÉNÉRALES
- Nom du projet: {{projet_nom}}
- Code projet: {{projet_code}}
- Chef de projet: {{projet_chef_projet}}
- Service demandeur: {{projet_service_demandeur}}
- Date de création: {{projet_date_creation}}

2. OBJECTIFS
{{projet_objectifs}}

3. CONTEXTE
{{projet_contexte}}

4. CONTRAINTES
{{projet_contraintes}}

5. RISQUES
{{projet_risques}}

6. ÉQUIPE
Nombre de membres: {{projet_equipe_count}}
Membres:
{% for membre in projet_equipe_membres %}
- {{membre.nom}} ({{membre.email}})
{% endfor %}

7. BUDGET
Budget prévu: {{projet_budget}}

8. PLANNING
Durée totale: {{planning_duree_totale}}
Jalons principaux: {{planning_jalons_principaux}}

Version: {{fiche_version}}
"""

    def get_fiche_plan_projet_template(self):
        """Retourne le contenu du template fiche plan projet."""
        return """FICHE PLAN PROJET

Projet: {{projet_nom}}
Code: {{projet_code}}
Date: {{fiche_date_generation}}

1. RÉSUMÉ DU PROJET
- Nom: {{projet_nom}}
- Code: {{projet_code}}
- Chef de projet: {{projet_chef_projet}}
- Statut: {{projet_statut}}

2. PHASES DU PROJET
{% for phase in phases %}
Phase {{phase.phase_ordre}}: {{phase.phase_nom}}
- Statut: {{phase.phase_statut}}
- Date début: {{phase.phase_date_debut}}
- Date fin: {{phase.phase_date_fin}}
- Étapes: {{phase.phase_etapes_count}}

{% for etape in phase.etapes %}
  - {{etape.etape_nom}} ({{etape.etape_statut}})
{% endfor %}

{% endfor %}

3. RESSOURCES NÉCESSAIRES
{{planning_ressources_necessaires}}

4. JALONS PRINCIPAUX
{{planning_jalons_principaux}}

Version: {{fiche_version}}
"""

    def get_contrat_template(self):
        """Retourne le contenu du template contrat."""
        return """CONTRAT

Entre les soussignés :

{{client_nom}}
{{client_adresse}}
{{client_ville}}

ET

{{entreprise_nom}}
{{entreprise_adresse}}
{{entreprise_ville}}

Il est convenu ce qui suit :

1. OBJET
{{contrat_objet}}

2. PRESTATIONS
{{contrat_prestations}}

3. DURÉE
Début: {{contrat_date_debut}}
Fin: {{contrat_date_fin}}

4. TARIFS
{{contrat_tarifs}}

5. CONDITIONS DE PAIEMENT
{{contrat_conditions_paiement}}

6. SIGNATURES

Client: _________________    Entreprise: _________________

Date: {{contrat_date_signature}}
"""

    def get_devis_template(self):
        """Retourne le contenu du template devis."""
        return """DEVIS

Devis N°: {{devis_numero}}
Date: {{devis_date}}

Client:
{{client_nom}}
{{client_adresse}}
{{client_ville}}

DESCRIPTION DES PRESTATIONS

{{devis_description}}

DÉTAIL DES TARIFS

{{devis_detail_tarifs}}

TOTAL HT: {{devis_total_ht}} €
TVA ({{devis_taux_tva}}%): {{devis_montant_tva}} €
TOTAL TTC: {{devis_total_ttc}} €

VALIDITÉ: {{devis_validite}} jours

Signature: _________________

Date: {{devis_date_signature}}
"""

    def get_facture_template(self):
        """Retourne le contenu du template facture."""
        return """FACTURE

Facture N°: {{facture_numero}}
Date: {{facture_date}}

Client:
{{client_nom}}
{{client_adresse}}
{{client_ville}}

DESCRIPTION DES PRESTATIONS

{{facture_description}}

DÉTAIL DES TARIFS

{{facture_detail_tarifs}}

TOTAL HT: {{facture_total_ht}} €
TVA ({{facture_taux_tva}}%): {{facture_montant_tva}} €
TOTAL TTC: {{facture_total_ttc}} €

DATE D'ÉCHÉANCE: {{facture_date_echeance}}

MODE DE PAIEMENT: {{facture_mode_paiement}}

IBAN: {{facture_iban}}
BIC: {{facture_bic}}
"""
