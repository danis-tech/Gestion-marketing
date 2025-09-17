from datetime import datetime
from django.utils import timezone
from projects.models import Projet, ProjetPhaseEtat, Etape
from accounts.models import User


class DocumentDataMapper:
    """
    Mapper pour convertir les données des modèles en données utilisables dans les templates.
    """
    
    @staticmethod
    def map_projet_data(projet):
        """
        Mappe les données d'un projet pour les templates.
        Récupère toutes les données liées depuis la base de données.
        """
        # Données de base du projet
        data = {
            'projet_nom': projet.nom,
            'projet_code': projet.code,
            'projet_description': projet.description or '',
            'projet_statut': projet.get_statut_display(),
            'projet_priorite': projet.get_priorite_display(),
            'projet_date_creation': projet.cree_le.strftime('%d/%m/%Y') if projet.cree_le else '',
            'projet_date_debut': projet.debut.strftime('%d/%m/%Y') if projet.debut else '',
            'projet_date_fin': projet.fin.strftime('%d/%m/%Y') if projet.fin else '',
            'projet_budget': projet.budget or 'Non défini',
            'projet_chef_projet': projet.proprietaire.get_full_name() if projet.proprietaire else '',
            'projet_chef_projet_email': projet.proprietaire.email if projet.proprietaire else '',
            'projet_type': projet.type or '',
            'projet_objectif': projet.objectif or '',
            'projet_nom_createur': projet.nom_createur or '',
            'projet_estimation_jours': projet.estimation_jours or 0,
        }
        
        # Données de l'équipe (via MembreProjet)
        equipe_membres = []
        for membre_projet in projet.membres.all():
            equipe_membres.append({
                'nom': membre_projet.utilisateur.get_full_name(),
                'email': membre_projet.utilisateur.email,
                'service': membre_projet.service.nom if membre_projet.service else 'Non défini',
                'role': membre_projet.role_projet
            })
        
        data.update({
            'projet_equipe_count': len(equipe_membres),
            'projet_equipe_membres': equipe_membres,
        })
        
        # Données des phases
        phases_data = []
        for phase_etat in projet.phases_etat.all():
            phase_info = {
                'phase_nom': phase_etat.phase.nom,
                'phase_statut': 'Terminée' if phase_etat.terminee else 'En cours' if phase_etat.est_en_cours else 'En attente',
                'phase_date_debut': phase_etat.date_debut.strftime('%d/%m/%Y') if phase_etat.date_debut else '',
                'phase_date_fin': phase_etat.date_fin.strftime('%d/%m/%Y') if phase_etat.date_fin else '',
                'phase_commentaire': phase_etat.commentaire or '',
            }
            
            # Données des étapes de cette phase
            etapes_data = []
            for etape in phase_etat.etapes.all():
                etape_info = {
                    'etape_nom': etape.nom,
                    'etape_description': etape.description or '',
                    'etape_statut': etape.get_statut_display(),
                    'etape_priorite': etape.get_priorite_display(),
                    'etape_responsable': etape.responsable.get_full_name() if etape.responsable else 'Non assigné',
                    'etape_date_debut_prevue': etape.date_debut_prevue.strftime('%d/%m/%Y') if etape.date_debut_prevue else '',
                    'etape_date_fin_prevue': etape.date_fin_prevue.strftime('%d/%m/%Y') if etape.date_fin_prevue else '',
                    'etape_date_debut_reelle': etape.date_debut_reelle.strftime('%d/%m/%Y') if etape.date_debut_reelle else '',
                    'etape_date_fin_reelle': etape.date_fin_reelle.strftime('%d/%m/%Y') if etape.date_fin_reelle else '',
                    'etape_progression': etape.progression_pourcentage or 0,
                }
                etapes_data.append(etape_info)
            
            phase_info['etapes'] = etapes_data
            phases_data.append(phase_info)
        
        data.update({
            'projet_phases_count': len(phases_data),
            'projet_phases_terminees': len([p for p in phases_data if p['phase_statut'] == 'Terminée']),
            'projet_progression': round((len([p for p in phases_data if p['phase_statut'] == 'Terminée']) / 6) * 100, 1) if phases_data else 0,
            'phases': phases_data,
        })
        
        # Données des tâches
        taches_data = []
        for tache in projet.taches.all():
            tache_info = {
                'tache_titre': tache.titre,
                'tache_description': tache.description or '',
                'tache_statut': tache.get_statut_display(),
                'tache_priorite': tache.get_priorite_display(),
                'tache_phase': tache.get_phase_display(),
                'tache_responsable': tache.assigne_a.get_full_name() if tache.assigne_a else 'Non assigné',
                'tache_date_creation': tache.cree_le.strftime('%d/%m/%Y') if tache.cree_le else '',
                'tache_date_debut': tache.debut.strftime('%d/%m/%Y') if tache.debut else '',
                'tache_date_fin': tache.fin.strftime('%d/%m/%Y') if tache.fin else '',
                'tache_estimation_jours': tache.nbr_jour_estimation or 0,
                'tache_progression': tache.progression,
            }
            taches_data.append(tache_info)
        
        data.update({
            'projet_taches_count': len(taches_data),
            'projet_taches_terminees': len([t for t in taches_data if t['tache_statut'] == 'Terminée']),
            'taches': taches_data,
        })
        
        return data
    
    @staticmethod
    def map_phase_data(phase_etat):
        """
        Mappe les données d'une phase pour les templates.
        """
        return {
            'phase_nom': phase_etat.phase.nom,
            'phase_description': phase_etat.phase.description or '',
            'phase_ordre': phase_etat.phase.ordre,
            'phase_statut': 'Terminée' if phase_etat.terminee else 'En cours' if phase_etat.est_en_cours else 'En attente',
            'phase_date_debut': phase_etat.date_debut.strftime('%d/%m/%Y à %H:%M') if phase_etat.date_debut else '',
            'phase_date_fin': phase_etat.date_fin.strftime('%d/%m/%Y à %H:%M') if phase_etat.date_fin else '',
            'phase_commentaire': phase_etat.commentaire or '',
            'phase_etapes_count': phase_etat.etapes.count(),
            'phase_etapes_terminees': phase_etat.etapes.filter(statut='terminee').count(),
            'phase_etapes_en_cours': phase_etat.etapes.filter(statut='en_cours').count(),
            'phase_etapes_en_attente': phase_etat.etapes.filter(statut='en_attente').count(),
        }
    
    @staticmethod
    def map_etape_data(etape):
        """
        Mappe les données d'une étape pour les templates.
        """
        return {
            'etape_nom': etape.nom,
            'etape_description': etape.description or '',
            'etape_statut': etape.get_statut_display(),
            'etape_priorite': etape.get_priorite_display(),
            'etape_date_debut': etape.date_debut.strftime('%d/%m/%Y à %H:%M') if etape.date_debut else '',
            'etape_date_fin': etape.date_fin.strftime('%d/%m/%Y à %H:%M') if etape.date_fin else '',
            'etape_date_echeance': etape.date_echeance.strftime('%d/%m/%Y') if etape.date_echeance else '',
            'etape_responsable': etape.responsable.get_full_name() if etape.responsable else '',
            'etape_responsable_email': etape.responsable.email if etape.responsable else '',
            'etape_commentaire': etape.commentaire or '',
            'etape_est_en_retard': etape.est_en_retard,
        }
    
    @staticmethod
    def map_user_data(user):
        """
        Mappe les données d'un utilisateur pour les templates.
        """
        return {
            'user_nom': user.get_full_name(),
            'user_username': user.username,
            'user_email': user.email,
            'user_telephone': user.telephone or '',
            'user_service': user.service or '',
            'user_poste': user.poste or '',
            'user_date_creation': user.date_joined.strftime('%d/%m/%Y') if user.date_joined else '',
        }
    
    @staticmethod
    def map_document_data(document):
        """
        Mappe les données d'un document pour les templates.
        """
        return {
            'document_nom': document.nom_fichier or 'Document',
            'document_type': document.get_type_document_display(),
            'document_version': document.version,
            'document_statut': document.get_statut_display(),
            'document_origine': document.get_origine_display(),
            'document_date_creation': document.cree_le.strftime('%d/%m/%Y à %H:%M'),
            'document_auteur': document.cree_par.get_full_name() if document.cree_par else '',
            'document_depose_par': document.depose_par.get_full_name() if document.depose_par else '',
            'document_taille': f"{document.taille_fichier_mb} MB" if document.taille_fichier_mb else '',
            'document_description': document.description or '',
        }


class FicheDataMapper:
    """
    Mapper spécialisé pour les fiches de projet.
    """
    
    @staticmethod
    def map_fiche_projet_marketing_data(projet):
        """
        Mappe les données pour la fiche projet marketing.
        """
        base_data = DocumentDataMapper.map_projet_data(projet)
        
        # Données spécifiques à la fiche projet marketing
        fiche_data = {
            **base_data,
            'fiche_type': 'Fiche Projet Marketing',
            'fiche_date_generation': timezone.now().strftime('%d/%m/%Y à %H:%M'),
            'fiche_version': '1.0',
            'projet_marche_cible': projet.marche_cible or 'Non défini',
            'projet_concurrents': projet.concurrents or 'Non défini',
            'projet_avantage_concurrentiel': projet.avantage_concurrentiel or 'Non défini',
            'projet_canaux_vente': projet.canaux_vente or 'Non défini',
            'projet_pricing': projet.pricing or 'Non défini',
            'projet_roi_attendu': projet.roi_attendu or 'Non défini',
        }
        
        return fiche_data
    
    @staticmethod
    def map_fiche_plan_projet_data(projet):
        """
        Mappe les données pour la fiche plan projet.
        """
        base_data = DocumentDataMapper.map_projet_data(projet)
        
        # Récupérer les phases avec leurs étapes
        phases_data = []
        for phase_etat in projet.phases_etat.all().order_by('phase__ordre'):
            phase_data = DocumentDataMapper.map_phase_data(phase_etat)
            
            # Ajouter les étapes de cette phase
            etapes_data = []
            for etape in phase_etat.etapes.all():
                etapes_data.append(DocumentDataMapper.map_etape_data(etape))
            
            phase_data['etapes'] = etapes_data
            phases_data.append(phase_data)
        
        fiche_data = {
            **base_data,
            'fiche_type': 'Fiche Plan Projet',
            'fiche_date_generation': timezone.now().strftime('%d/%m/%Y à %H:%M'),
            'fiche_version': '1.0',
            'phases': phases_data,
            'planning_duree_totale': projet.duree_totale or 'Non défini',
            'planning_jalons_principaux': projet.jalons_principaux or 'Non défini',
            'planning_ressources_necessaires': projet.ressources_necessaires or 'Non défini',
        }
        
        return fiche_data
    
    @staticmethod
    def map_fiche_etude_si_data(projet, phase_etat=None):
        """
        Mappe les données pour la fiche d'étude SI.
        """
        base_data = DocumentDataMapper.map_projet_data(projet)
        
        if phase_etat:
            phase_data = DocumentDataMapper.map_phase_data(phase_etat)
        else:
            phase_data = {}
        
        fiche_data = {
            **base_data,
            **phase_data,
            'fiche_type': 'Fiche d\'étude SI',
            'fiche_date_generation': timezone.now().strftime('%d/%m/%Y à %H:%M'),
            'fiche_version': '1.0',
            'etude_si_impact_systeme': 'À évaluer',
            'etude_si_modifications_necessaires': 'À évaluer',
            'etude_si_ressources_techniques': 'À évaluer',
            'etude_si_delais_implementation': 'À évaluer',
            'etude_si_risques_techniques': 'À évaluer',
            'etude_si_recommandations': 'À évaluer',
        }
        
        return fiche_data
    
    @staticmethod
    def map_fiche_etude_technique_data(projet, phase_etat=None):
        """
        Mappe les données pour la fiche d'étude technique.
        """
        base_data = DocumentDataMapper.map_projet_data(projet)
        
        if phase_etat:
            phase_data = DocumentDataMapper.map_phase_data(phase_etat)
        else:
            phase_data = {}
        
        fiche_data = {
            **base_data,
            **phase_data,
            'fiche_type': 'Fiche d\'étude technique',
            'fiche_date_generation': timezone.now().strftime('%d/%m/%Y à %H:%M'),
            'fiche_version': '1.0',
            'etude_technique_impact_reseau': 'À évaluer',
            'etude_technique_infrastructure': 'À évaluer',
            'etude_technique_securite': 'À évaluer',
            'etude_technique_performance': 'À évaluer',
            'etude_technique_compatibilite': 'À évaluer',
            'etude_technique_recommandations': 'À évaluer',
        }
        
        return fiche_data
    
    @staticmethod
    def map_fiche_etude_financiere_data(projet, phase_etat=None):
        """
        Mappe les données pour la fiche d'étude financière.
        """
        base_data = DocumentDataMapper.map_projet_data(projet)
        
        if phase_etat:
            phase_data = DocumentDataMapper.map_phase_data(phase_etat)
        else:
            phase_data = {}
        
        fiche_data = {
            **base_data,
            **phase_data,
            'fiche_type': 'Fiche d\'étude financière',
            'fiche_date_generation': timezone.now().strftime('%d/%m/%Y à %H:%M'),
            'fiche_version': '1.0',
            'etude_financiere_cout_estime': f"{projet.budget:,.2f} €" if projet.budget else 'À évaluer',
            'etude_financiere_roi_attendu': 'À évaluer',
            'etude_financiere_rentabilite': 'À évaluer',
            'etude_financiere_risques_financiers': 'À évaluer',
            'etude_financiere_financement': 'À évaluer',
            'etude_financiere_recommandations': 'À évaluer',
        }
        
        return fiche_data
    
    @staticmethod
    def map_fiche_specifications_marketing_data(projet, phase_etat=None):
        """
        Mappe les données pour la fiche de spécifications marketing.
        """
        base_data = DocumentDataMapper.map_projet_data(projet)
        
        if phase_etat:
            phase_data = DocumentDataMapper.map_phase_data(phase_etat)
        else:
            phase_data = {}
        
        fiche_data = {
            **base_data,
            **phase_data,
            'fiche_type': 'Fiche de spécifications marketing',
            'fiche_date_generation': timezone.now().strftime('%d/%m/%Y à %H:%M'),
            'fiche_version': '1.0',
            'specs_marketing_cibles': 'À définir',
            'specs_marketing_messages': 'À définir',
            'specs_marketing_canaux': 'À définir',
            'specs_marketing_positionnement': 'À définir',
            'specs_marketing_differenciation': 'À définir',
            'specs_marketing_strategie': 'À définir',
        }
        
        return fiche_data
    
    @staticmethod
    def map_fiche_lancement_commercial_data(projet, phase_etat=None):
        """
        Mappe les données pour la fiche de lancement commercial.
        """
        base_data = DocumentDataMapper.map_projet_data(projet)
        
        if phase_etat:
            phase_data = DocumentDataMapper.map_phase_data(phase_etat)
        else:
            phase_data = {}
        
        fiche_data = {
            **base_data,
            **phase_data,
            'fiche_type': 'Fiche de lancement commercial',
            'fiche_date_generation': timezone.now().strftime('%d/%m/%Y à %H:%M'),
            'fiche_version': '1.0',
            'lancement_campagnes': 'À définir',
            'lancement_canaux': 'À définir',
            'lancement_brochures': 'À définir',
            'lancement_cibles': 'À définir',
            'lancement_messages': 'À définir',
            'lancement_planning': 'À définir',
        }
        
        return fiche_data
    
    @staticmethod
    def map_fiche_bilan_data(projet, mois):
        """
        Mappe les données pour les fiches de bilan (3 ou 6 mois).
        """
        base_data = DocumentDataMapper.map_projet_data(projet)
        
        fiche_data = {
            **base_data,
            'fiche_type': f'Fiche de bilan à {mois} mois',
            'fiche_date_generation': timezone.now().strftime('%d/%m/%Y à %H:%M'),
            'fiche_version': '1.0',
            'bilan_periode': f'{mois} mois',
            'bilan_date_debut': projet.date_lancement.strftime('%d/%m/%Y') if projet.date_lancement else '',
            'bilan_ventes_reelles': 'À évaluer',
            'bilan_ventes_prevues': 'À évaluer',
            'bilan_ecart_ventes': 'À évaluer',
            'bilan_couts_reels': 'À évaluer',
            'bilan_couts_prevus': 'À évaluer',
            'bilan_ecart_couts': 'À évaluer',
            'bilan_roi_reel': 'À évaluer',
            'bilan_roi_prevue': 'À évaluer',
            'bilan_ecart_roi': 'À évaluer',
            'bilan_retours_clients': 'À évaluer',
            'bilan_retours_equipe': 'À évaluer',
            'bilan_ameliorations': 'À évaluer',
            'bilan_recommandations': 'À évaluer',
        }
        
        return fiche_data
