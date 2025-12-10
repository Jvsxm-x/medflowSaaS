
# 🏥 MedFlow SaaS – Plateforme santé digitale tunisienne

<img src="https://via.placeholder.com/180x60/007BFF/FFFFFF?text=MedFlow+SaaS" alt="MedFlow SaaS Logo" width="180" align="right"/>

**Dawini : La plateforme tout-en-un pour cliniques, médecins et patients en Tunisie.**  
Télémédecine • RDV • Dossier médical • Gestion complète de clinique  

[![Dernière mise à jour](https://img.shields.io/badge/dernier--update-10%20décembre%202025-blue)](https://github.com/Jvsxm-x/medflowSaaS)
[![Repo GitHub](https://img.shields.io/badge/GitHub-Repo-black?logo=github)](https://github.com/Jvsxm-x/medflowSaaS)

---

## 🎉 Nouveauté majeure – Décembre 2025  
**Gestion complète des cliniques & équipes médicales** (déployée le 09/12/2025)

### Fonctionnalités Cliniques & Staff

| Fonctionnalité                            | Statut       | Détails |
|-------------------------------------------|-------------|----------------------------------------------------|
| Création & gestion de clinique            | ✅ Done     | Admin ou propriétaire crée la clinique            |
| Profil clinique public                     | ✅ Done     | Photos, services, avis – SEO-friendly + géolocalisation |
| Ajout de médecins à la clinique           | ✅ Done     | Un médecin peut appartenir à plusieurs cliniques  |
| Rôles dans la clinique                    | ✅ Done     | Propriétaire • Admin • Médecin • Secrétaire • Infirmier |
| Gestion du staff (invitations par email)  | ✅ Done     | Lien magique d’acceptation (type Slack)          |
| Planning partagé par clinique             | ✅ Done     | Tous les médecins voient les RDV communs         |
| Agenda multi-médecins (vue équipe)        | ✅ Done     | Drag & drop entre médecins (secrétaire)          |
| File d’attente physique (clinique)        | ✅ Done     | QR code patient → affiché sur écran salle d’attente |
| Gestion des salles de consultation        | ✅ Done     | Salle 1, Salle 2, Bloc opératoire, etc.          |
| Tarifs par acte / médecin / clinique      | ✅ Done     | Prix public + prix privé + CNAM                  |
| Statistiques par clinique                 | ✅ Done     | CA, taux de remplissage, no-show, top médecins  |
| Facturation automatique patient/clinique  | 🟡 Beta    | Génération PDF facture + envoi WhatsApp/SMS      |

---

### 📦 Modèle MongoDB (`clinics`)

```js
clinic: {
  name, address, phone, email,
  location: { type: "Point", coordinates: [...] },
  owner_id (User),
  staff: [
    { user_id, role: "owner|admin|doctor|secretary|nurse", joined_at }
  ],
  rooms: ["Salle 1", "Salle 2", "Urgences"],
  services: ["Chirurgie", "Radiologie", "Maternité", ...],
  pricing: { consultation: 80, echo: 150, ... },
  gallery: ["url1.jpg", ...],
  rating, total_reviews,
  is_verified: boolean
}
````

* Index `2dsphere` pour géolocalisation
* Recherche full-text sur nom et ville

---

### ⚡ Fonctionnalités globales

| Module                           | Statut      | Détails                                              |
| -------------------------------- | ----------- | ---------------------------------------------------- |
| Auth multi-rôles + 2FA           | ✅ Done      | Patient • Médecin • Secrétaire • Admin • Super admin |
| Gestion RDV & calendrier         | ✅ Done      | WebSockets temps réel                                |
| Dossiers médicaux sécurisés      | ✅ Done      | PDF, allergies, antécédents                          |
| Télémédecine WebRTC              | 🟡 Beta     | Intégré dans RDV                                     |
| Recherche médecins/cliniques     | ✅ Done      | Geo + filtres + ranking ML                           |
| Notifications SMS/Email/Push     | ✅ Done      | Twilio + Redis                                       |
| Gestion complète clinique/staff  | ✅ Done      | Nouvelle version décembre 2025                       |
| Dashboard Admin/Médecin/Clinique | ✅ Done      | Stats en temps réel                                  |
| Paiement en ligne                | 🔄 En cours | Paymee + CIB                                         |
| PWA installable mobile           | ✅ Done      | iOS & Android                                        |

---

### 🛠 Stack technique

| Couche      | Technologies                                         |
| ----------- | ---------------------------------------------------- |
| Backend     | Django 5 + DRF + Channels + Python 3.12              |
| Frontend    | React 18 + TypeScript + Tailwind + Vite + PWA        |
| DB          | MongoDB Atlas (sharded)                              |
| Real-time   | Redis + Django Channels + Socket.io                  |
| ML          | Scikit-learn + pymongo (prédiction no-show, ranking) |
| Déploiement | Docker + Docker Compose + GitHub Actions             |
| Sécurité    | JWT + bcrypt + 2FA + rate limiting                   |

---

### 🚀 Installation rapide

```bash
git clone https://github.com/Jvsxm-x/medflowSaaS.git
cd medflowSaaS

# Variables d'environnement
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# Docker (tout-en-un)
docker-compose up -d

# → Frontend : http://localhost:3000
# → API : http://localhost:8000
# → Swagger : http://localhost:8000/api/docs

# Seed complet
python backend/manage.py seed_all
```

**Compte test clinique propriétaire** :

* Email : `dr.chouat@clinique-soukra.tn`
* Mot de passe : `email`

---

### 📅 Roadmap Q1 2026

* Application mobile native (React Native)
* Intégration CNAM (remboursement automatique)
* Prescription électronique signée
* IA Symptom Checker (arabe/français/tunisien)
* Marketplace d’équipements médicaux

---

### 👩‍💻 Contributeurs & Rôles

| Contributeur               | Rôle / Tâches principales |
|----------------------------|---------------------------|
| @Jvsxm-x                   | Lead Dev & Architect – Backend Django, API, Auth multi-rôles |
| jassem chouat              | Gestion complète cliniques & staff, Frontend React, intégration PWA |
| Mohammed Ben Rhouma        | ML – Prédiction no-show, ranking médecins, recherche intelligente |
| Fekher Ben Yahia           | DevOps & Déploiement – Docker, Docker Compose, Kubernetes, CI/CD GitHub Actions |

**Contact**

Email:chouatjasem@gmail.com


Veux‑tu que je fasse cette version ?
```
