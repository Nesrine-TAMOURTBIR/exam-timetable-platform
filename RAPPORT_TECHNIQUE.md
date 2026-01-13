# Rapport Technique : Plateforme d'Optimisation des Examens

## 1. Introduction
Ce projet, débuté le **20/10/2025**, a pour objectif de résoudre le problème complexe de la planification des examens au sein d'une institution multi-départements. La gestion manuelle de milliers d'étudiants, de centaines de modules et de contraintes logistiques (salles, surveillants) est source d'erreurs et de conflits. Notre solution automatise ce processus via un algorithme d'optimisation robuste et une interface web moderne.

## 2. Architecture Technique & Choix Technologiques
Le système repose sur une pile technologique choisie pour sa performance et sa scalabilité :
- **Backend (Python / FastAPI)** : Choisi pour sa gestion native de l'asynchronisme, crucial pour les longs traitements d'optimisation.
- **Frontend (React / Ant Design)** : Offre une interface utilisateur (UI) premium, réactive et adaptée aux tableaux de bord complexes.
- **Base de Données (PostgreSQL)** : Utilisation de relations fortes, d'indexations multicritères et de types énumérés pour garantir l'intégrité des données à grande échelle.
- **Optimisation (Graphe de Collision)** : Modélisation du problème sous forme de graphe où chaque nœud est un examen et chaque arête un conflit potentiel (étudiant commun).

## 3. Analyse du Modèle de Données (MCD)
La structure de la base de données a été conçue pour s'adapter à une échelle réelle :
- **Ressources Académiques** : `Departments`, `Programs` (Formations), `Modules`.
- **Acteurs de l'Institution** : `Users` (Auth), `Students` (Inscrits aux formations), `Professors` (Affiliés aux départements).
- **Logistique** : `Rooms` (Amphis/Salles avec capacité réelle).
- **Planification** : `Exams` (Définition) et `Timetable_Entries` (Instanciation sur le calendrier).

### Schéma Relationnel Clé :
- Une `Formation` appartient à un `Département`.
- Un `Étudiant` est inscrit à une seule `Formation` mais peut être inscrit à plusieurs `Modules`.
- Un `Examen` est lié à un `Module` et nécessite une `Salle` et un `Surveillant`.

## 4. Matrice des Rôles et Fonctionnalités
La plateforme segmente strictement les accès pour respecter la hiérarchie institutionnelle :

| Rôle | Vision | Actions Clés |
| :--- | :--- | :--- |
| **Doyen / Vice-Doyen** | Stratégique (Global) | Validation finale, KPI d'occupation, Gestion des Admins. |
| **Administrateur** | Opérationnelle | Génération de l'EDT, CRUD des ressources (Salles/Profs). |
| **Chef de Département** | Tactique (Local) | Validation du département, Stats par formation. |
| **Professeur** | Personnelle | Consultation planning, filtrage par département. |
| **Étudiant** | Personnelle | Consultation planning, filtrage par formation. |

## 5. Algorithme d'Optimisation et Contraintes Critiques
L'algorithme implémente une heuristique gloutonne intelligente avec gestion des priorités :

### A. Contraintes Hard (Incontournables) :
1. **Étudiants** : Maximum 1 examen par jour pour éviter la surcharge cognitive.
2. **Salles** : Attribution uniquement si `Capacité >= Nombre d'inscrits`.
3. **Surveillants** : Disponibilité temporelle (un prof ne peut surveiller deux examens simultanés).

### B. Contraintes Soft & Métier :
1. **Charge de Travail (Professeurs)** : Maximum 3 surveillances par jour.
2. **Équité** : L'algorithme priorise les professeurs ayant le moins de surveillances au compteur pour équilibrer la charge annuelle.
3. **Localité** : Priorité est donnée aux professeurs appartenant au département de l'examen surveillé.

## 6. Workflow de Validation Multicouche
Pour garantir la qualité du calendrier, un workflow de validation a été mis en œuvre :
- **État "DRAFT"** : Après génération initiale par l'Admin.
- **État "DEPT_APPROVED"** : Validé par le Chef de Département après vérification des spécificités locales.
- **État "FINAL_APPROVED"** : Verrouillage final par le Doyen pour publication.

## 7. Benchmarks et Performances
Le système a été testé sur un jeu de données réaliste :
- **Données de Test** : 13 000+ Étudiants, 50 Professeurs, 10 Départements.
- **Vitesse de Chargement** : Les requêtes SQL optimisées (Indexation B-Tree) répondent en moins de **100ms**.
- **Execution Algorithmique** : La génération complète pour un semestre prend environ **2.3 secondes**.
- **Taux de Succès** : 100% des examens sont placés sans conflits d'étudiants grâce à la détection préventive via le graphe.

## 8. Conclusion
La solution livrée dépasse les attentes du cahier des charges en offrant non seulement la génération automatique demandée, mais aussi un système de validation hiérarchique et une interface utilisateur de niveau professionnel. Le code est documenté, modulaire et prêt pour une intégration réelle.

---
*Date de remise : 19/01/2026*
*Projet : Plateforme de Gestion des Emplois du Temps d'Examens*
