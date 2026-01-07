# ⚡ Démarrage Rapide - Render

## 🎯 Vous avez un compte Render - Parfait !

Suivez ces 3 étapes principales :

---

## 1️⃣ Créer la Base PostgreSQL (5 minutes)

1. **Dashboard Render** → "New +" → "PostgreSQL"
2. **Configurer** :
   - Name : `exam-platform-db`
   - Region : Choisir (ex: Frankfurt)
   - Plan : **Free**
3. **Créer** et **COPIER l'Internal Database URL**
4. **Ajouter `+asyncpg`** au début : `postgresql+asyncpg://...`

---

## 2️⃣ Créer le Web Service Backend (10 minutes)

1. **Dashboard Render** → "New +" → "Web Service"
2. **Connecter GitHub** → Sélectionner votre repo
3. **Configurer** :
   - Name : `exam-platform-backend`
   - Region : **Même que la DB**
   - Root Directory : `backend` ⚠️
   - Build Command : `pip install -r requirements.txt`
   - Start Command : `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
4. **Variables d'environnement** :
   - `DATABASE_URL` : Votre URL avec `+asyncpg`
   - `SECRET_KEY` : `python -c "import secrets; print(secrets.token_hex(32))"`
   - `ALGORITHM` : `HS256`
5. **Créer** et attendre le déploiement

---

## 3️⃣ Déployer le Frontend (5 minutes)

### Option A : Firebase Hosting

```bash
cd frontend
npm install -g firebase-tools
firebase login
firebase init hosting
# Public directory: dist
# Single-page app: Yes

# Créer .env
echo "VITE_API_BASE_URL=https://votre-backend.onrender.com/api/v1" > .env

npm run build
firebase deploy
```

### Option B : Render Static Site

1. **Dashboard Render** → "New +" → "Static Site"
2. **Connecter GitHub** → Sélectionner votre repo
3. **Configurer** :
   - Root Directory : `frontend`
   - Build Command : `npm install && npm run build`
   - Publish Directory : `dist`
4. **Variables d'environnement** :
   - `VITE_API_BASE_URL` : `https://votre-backend.onrender.com/api/v1`

---

## ✅ Vérification

1. **Backend** : `https://votre-backend.onrender.com/` → Devrait retourner JSON
2. **Frontend** : Ouvrir l'URL et tester la connexion

---

## 🔗 URLs Finales

- **Backend** : `https://votre-backend.onrender.com/api/v1`
- **Frontend** : `https://votre-projet.firebaseapp.com` (Firebase) ou `https://votre-site.onrender.com` (Render)

---

## 🆘 Besoin d'aide ?

Voir `DEPLOIEMENT_RENDER.md` pour le guide détaillé étape par étape.

