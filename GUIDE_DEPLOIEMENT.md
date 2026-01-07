# Guide de Déploiement - Plateforme d'Examens

## 📊 Base de données actuelle

**PostgreSQL** est utilisé dans le projet. Pour le déploiement, vous avez plusieurs options :

### Option 1 : PostgreSQL sur Render (Recommandé)
- Créer une base PostgreSQL sur Render (gratuit avec limitations)
- URL fournie automatiquement

### Option 2 : Supabase (Recommandé - Gratuit)
- Base PostgreSQL gratuite avec interface moderne
- URL de connexion fournie

### Option 3 : Neon, Railway, ou autre
- Services PostgreSQL hébergés

---

## 🚀 Déploiement Backend sur Render

### Étape 1 : Préparer le backend

1. **Créer un fichier `render.yaml`** (déjà créé dans le projet)
2. **Créer un fichier `Procfile`** pour Render
3. **Configurer les variables d'environnement**

### Étape 2 : Créer la base PostgreSQL sur Render

1. Aller sur [render.com](https://render.com)
2. Créer un nouveau **PostgreSQL Database**
3. Noter l'**Internal Database URL** et **External Database URL**

### Étape 3 : Déployer le backend

1. Créer un nouveau **Web Service** sur Render
2. Connecter votre repository GitHub
3. Configurer :
   - **Build Command** : `cd backend && pip install -r requirements.txt`
   - **Start Command** : `cd backend && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Environment Variables** :
     - `DATABASE_URL` : URL de votre base PostgreSQL (External Database URL)
     - `SECRET_KEY` : Clé secrète pour JWT (générer avec `openssl rand -hex 32`)
     - `ALGORITHM` : `HS256`

### Étape 4 : Exécuter les migrations

Les migrations s'exécutent automatiquement au démarrage grâce à `alembic upgrade head` dans la commande de démarrage.

---

## 🔥 Déploiement Frontend sur Firebase Hosting

### ⚠️ Important : Firebase Hosting vs Firestore

**Firebase Hosting** = Hébergement de fichiers statiques (frontend React)
- ✅ Juste pour servir les fichiers HTML/CSS/JS
- ✅ Gratuit et rapide
- ❌ **PAS une base de données**

**La base de données PostgreSQL reste sur Render/Supabase** (voir section Base de données ci-dessus)

### Étape 1 : Installer Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### Étape 2 : Initialiser Firebase dans le projet

```bash
cd frontend
firebase init hosting
```

Choisir :
- **What do you want to use as your public directory?** : `dist`
- **Configure as a single-page app?** : `Yes`
- **Set up automatic builds and deploys with GitHub?** : `No` (ou `Yes` si vous voulez)

### Étape 3 : Configurer l'URL de l'API

Le frontend doit pointer vers l'URL du backend déployé sur Render.

### Étape 4 : Build et déployer

```bash
npm run build
firebase deploy
```

---

## ⚙️ Configuration des variables d'environnement

### Backend (Render)
- `DATABASE_URL` : URL PostgreSQL de Render
- `SECRET_KEY` : Clé secrète JWT
- `ALGORITHM` : `HS256`

### Frontend (Firebase)
- Variable d'environnement pour l'URL de l'API backend
- Configurée dans `vite.config.ts` et `client.ts`

---

## 📝 Notes importantes

1. **CORS** : Le backend doit autoriser les requêtes depuis Firebase Hosting
2. **HTTPS** : Firebase Hosting utilise HTTPS, le backend doit aussi être en HTTPS (Render le fait automatiquement)
3. **Variables d'environnement** : Ne jamais commiter les `.env` files
4. **Migrations** : S'exécutent automatiquement au démarrage du backend

---

## 🔗 URLs après déploiement

- **Frontend** : `https://votre-projet.firebaseapp.com`
- **Backend** : `https://votre-service.onrender.com`
- **API** : `https://votre-service.onrender.com/api/v1`

