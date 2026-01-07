# 🚀 Étapes de Déploiement Détaillées

## 📋 Prérequis

1. Compte GitHub (pour le repository)
2. Compte Render (gratuit) : [render.com](https://render.com)
3. Compte Firebase (gratuit) : [firebase.google.com](https://firebase.google.com)
4. Node.js et npm installés
5. Python 3.9+ installé

---

## 🗄️ ÉTAPE 1 : Créer la Base de Données PostgreSQL

### Option A : Sur Render (Recommandé)

1. **Se connecter à Render** : [dashboard.render.com](https://dashboard.render.com)
2. **Créer une nouvelle base de données** :
   - Cliquer sur "New +" → "PostgreSQL"
   - Nom : `exam-platform-db`
   - Plan : **Free** (pour commencer)
   - Région : Choisir la plus proche
   - Cliquer sur "Create Database"

3. **Noter les informations** :
   - **Internal Database URL** : `postgresql://user:password@host:port/dbname`
   - **External Database URL** : Pour les connexions externes
   - **Host, Port, Database, User, Password**

### Option B : Sur Supabase (Alternative gratuite)

1. Aller sur [supabase.com](https://supabase.com)
2. Créer un nouveau projet
3. Aller dans Settings → Database
4. Copier la **Connection String** (URI)
5. Format : `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

---

## 🔧 ÉTAPE 2 : Configurer le Backend pour Render

### 2.1 Préparer le repository

1. **Pousser le code sur GitHub** (si pas déjà fait) :
   ```bash
   git add .
   git commit -m "Prepare for deployment"
   git push origin main
   ```

### 2.2 Créer le service Web sur Render

1. **Aller sur Render Dashboard** → "New +" → "Web Service"
2. **Connecter votre repository GitHub**
3. **Configurer le service** :
   - **Name** : `exam-platform-backend`
   - **Environment** : `Python 3`
   - **Region** : Choisir la même que la base de données
   - **Branch** : `main` (ou votre branche principale)
   - **Root Directory** : `backend`
   - **Build Command** : `pip install -r requirements.txt`
   - **Start Command** : `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 2.3 Configurer les Variables d'Environnement

Dans Render, aller dans "Environment" et ajouter :

```
DATABASE_URL=postgresql+asyncpg://user:password@host:port/dbname
SECRET_KEY=votre-cle-secrete-generee-avec-openssl-rand-hex-32
ALGORITHM=HS256
ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000
FIREBASE_URL=votre-projet.firebaseapp.com
```

**Générer SECRET_KEY** :
```bash
openssl rand -hex 32
```

**Important** : 
- Remplacer `DATABASE_URL` par votre URL PostgreSQL de Render
- Remplacer `FIREBASE_URL` par votre URL Firebase (après déploiement du frontend)

### 2.4 Déployer

1. Cliquer sur "Create Web Service"
2. Render va automatiquement :
   - Cloner le repository
   - Installer les dépendances
   - Exécuter les migrations Alembic
   - Démarrer le serveur

3. **Noter l'URL du backend** : `https://exam-platform-backend.onrender.com`

---

## 🔥 ÉTAPE 3 : Déployer le Frontend sur Firebase

### 3.1 Installer Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 3.2 Initialiser Firebase dans le projet

```bash
cd frontend
firebase init hosting
```

**Réponses aux questions** :
- ✅ **Use an existing project** ou **Create a new project**
- **What do you want to use as your public directory?** : `dist`
- **Configure as a single-page app?** : `Yes`
- **Set up automatic builds and deploys with GitHub?** : `No` (pour l'instant)
- **File dist/index.html already exists. Overwrite?** : `No`

### 3.3 Configurer l'URL de l'API

1. **Créer un fichier `.env` dans `frontend/`** :
   ```bash
   cd frontend
   echo "VITE_API_BASE_URL=https://exam-platform-backend.onrender.com/api/v1" > .env
   ```

   ⚠️ **Remplacer** `exam-platform-backend.onrender.com` par votre URL Render réelle

2. **Vérifier que `vite.config.ts` et `client.ts` sont configurés** (déjà fait)

### 3.4 Build et Déployer

```bash
# Dans le dossier frontend
npm install
npm run build
firebase deploy
```

### 3.5 Noter l'URL Firebase

Après le déploiement, Firebase vous donnera une URL :
- `https://votre-projet.firebaseapp.com`
- `https://votre-projet.web.app`

---

## 🔄 ÉTAPE 4 : Mettre à jour les CORS du Backend

1. **Retourner sur Render** → Votre service backend
2. **Aller dans "Environment"**
3. **Mettre à jour** `FIREBASE_URL` avec votre URL Firebase réelle
4. **Ajouter dans** `ALLOWED_ORIGINS` :
   ```
   ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000,https://votre-projet.firebaseapp.com,https://votre-projet.web.app
   ```
5. **Redémarrer le service** (Render le fait automatiquement)

---

## 🗄️ ÉTAPE 5 : Initialiser la Base de Données

### Option A : Via Render Shell

1. Sur Render, aller dans votre service backend
2. Cliquer sur "Shell"
3. Exécuter :
   ```bash
   cd backend
   python seed_data.py
   ```

### Option B : Via Script local

1. **Créer un fichier `.env` local** avec l'URL de production :
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@host:port/dbname
   ```

2. **Exécuter** :
   ```bash
   cd backend
   python seed_data.py
   ```

### Option C : Via API (si vous avez un endpoint admin)

Créer un utilisateur admin via l'API ou directement en base.

---

## ✅ ÉTAPE 6 : Vérifier le Déploiement

### Vérifier le Backend

1. **Tester l'API** :
   ```bash
   curl https://exam-platform-backend.onrender.com/
   ```
   Devrait retourner : `{"message": "University Exam Optimization API"}`

2. **Tester l'endpoint de login** :
   ```bash
   curl -X POST https://exam-platform-backend.onrender.com/api/v1/login/access-token \
     -H "Content-Type: application/x-www-form-urlencoded" \
     -d "username=admin@example.com&password=secret"
   ```

### Vérifier le Frontend

1. **Ouvrir** `https://votre-projet.firebaseapp.com`
2. **Tester la connexion**
3. **Vérifier que les appels API fonctionnent** (ouvrir la console du navigateur)

---

## 🐛 Dépannage

### Problème : CORS Error

**Solution** : Vérifier que `ALLOWED_ORIGINS` dans Render contient bien l'URL Firebase

### Problème : Database Connection Error

**Solution** : 
- Vérifier que `DATABASE_URL` est correct
- Vérifier que la base de données est accessible depuis Render
- Utiliser l'**Internal Database URL** si disponible

### Problème : Frontend ne charge pas l'API

**Solution** :
- Vérifier que `VITE_API_BASE_URL` dans `.env` est correct
- Rebuild le frontend : `npm run build`
- Redéployer : `firebase deploy`

### Problème : Migrations ne s'exécutent pas

**Solution** :
- Vérifier les logs Render
- Exécuter manuellement via Shell :
  ```bash
  cd backend
  alembic upgrade head
  ```

---

## 📝 Checklist Finale

- [ ] Base PostgreSQL créée et accessible
- [ ] Backend déployé sur Render
- [ ] Variables d'environnement configurées
- [ ] Migrations exécutées
- [ ] Frontend déployé sur Firebase
- [ ] URL API configurée dans le frontend
- [ ] CORS configuré correctement
- [ ] Base de données initialisée avec des données
- [ ] Tests de connexion réussis
- [ ] URLs notées pour la soumission

---

## 🔗 URLs à Noter pour la Soumission

- **Frontend** : `https://votre-projet.firebaseapp.com`
- **Backend API** : `https://exam-platform-backend.onrender.com/api/v1`
- **Documentation API** : `https://exam-platform-backend.onrender.com/docs` (Swagger automatique)

---

## 💡 Astuces

1. **Render Free Tier** : Le service peut "s'endormir" après 15 min d'inactivité. Le premier appel peut être lent.
2. **Firebase Hosting** : Gratuit avec 10 GB de stockage et 360 MB/jour de bande passante
3. **Supabase** : Alternative gratuite à Render pour PostgreSQL avec plus de fonctionnalités
4. **Monitoring** : Utiliser les logs Render pour déboguer

