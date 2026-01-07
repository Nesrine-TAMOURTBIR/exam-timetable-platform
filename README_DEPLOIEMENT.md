# 🚀 Guide Rapide de Déploiement

## ⚠️ Clarification Importante

**Firebase Hosting** = Hébergement de fichiers statiques (frontend React) - **PAS une base de données**
**PostgreSQL** = Doit rester PostgreSQL (sur Render, Supabase, etc.)

Voir `CLARIFICATION_FIREBASE.md` pour plus de détails.

## 📊 Base de Données

**PostgreSQL** est utilisé. Pour le déploiement, vous pouvez utiliser :

- ✅ **Render PostgreSQL** (gratuit, recommandé)
- ✅ **Supabase** (gratuit, alternative)
- ✅ **Neon** ou **Railway** (autres options)

**La base de données PostgreSQL reste séparée de Firebase Hosting.**

---

## ⚡ Déploiement Rapide

### Backend sur Render

1. **Créer une base PostgreSQL** sur Render
2. **Créer un Web Service** :
   - Repository : Votre repo GitHub
   - Build Command : `cd backend && pip install -r requirements.txt`
   - Start Command : `cd backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - Variables d'environnement :
     - `DATABASE_URL` : URL de votre PostgreSQL
     - `SECRET_KEY` : `openssl rand -hex 32`
     - `ALGORITHM` : `HS256`
     - `FIREBASE_URL` : Votre URL Firebase (après déploiement frontend)

### Frontend sur Firebase

1. **Installer Firebase CLI** : `npm install -g firebase-tools`
2. **Initialiser** : `cd frontend && firebase init hosting`
3. **Configurer `.env`** :
   ```
   VITE_API_BASE_URL=https://votre-backend.onrender.com/api/v1
   ```
4. **Build et déployer** :
   ```bash
   npm run build
   firebase deploy
   ```

---

## 📁 Fichiers Créés

- ✅ `backend/Procfile` : Pour Render
- ✅ `render.yaml` : Configuration Render (optionnel)
- ✅ `firebase.json` : Configuration Firebase Hosting
- ✅ `.firebaserc` : Configuration projet Firebase
- ✅ `DEPLOIEMENT_STEPS.md` : Guide détaillé étape par étape
- ✅ `GUIDE_DEPLOIEMENT.md` : Vue d'ensemble

---

## 🔧 Modifications Apportées

1. **`backend/app/main.py`** : CORS configuré pour accepter Firebase
2. **`frontend/src/api/client.ts`** : Utilise `VITE_API_BASE_URL` depuis les variables d'environnement
3. **`frontend/vite.config.ts`** : Prêt pour les variables d'environnement

---

## ⚠️ Important

1. **Ne jamais commiter** les fichiers `.env`
2. **Configurer** `FIREBASE_URL` dans Render après avoir déployé le frontend
3. **Utiliser** l'Internal Database URL de Render si disponible (plus rapide)
4. **Tester** les migrations avant le déploiement en production

---

## 📚 Documentation Complète

Voir `DEPLOIEMENT_STEPS.md` pour le guide détaillé étape par étape.

