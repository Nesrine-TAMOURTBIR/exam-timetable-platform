# 🚀 Guide de Déploiement sur Render - Étape par Étape

## ✅ Vous avez déjà un compte Render - Parfait !

Maintenant, suivons ces étapes dans l'ordre :

---

## 📋 ÉTAPE 1 : Créer la Base de Données PostgreSQL

### 1.1 Créer la base de données

1. **Aller sur** [dashboard.render.com](https://dashboard.render.com)
2. **Cliquer sur** "New +" (en haut à droite)
3. **Sélectionner** "PostgreSQL"
4. **Remplir le formulaire** :
   - **Name** : `exam-platform-db` (ou un nom de votre choix)
   - **Database** : `exam_db` (ou laisser par défaut)
   - **User** : Laisser par défaut
   - **Region** : Choisir la région la plus proche (ex: `Frankfurt`, `Oregon`)
   - **PostgreSQL Version** : Laisser la dernière version
   - **Plan** : **Free** (pour commencer)
5. **Cliquer sur** "Create Database"

### 1.2 Noter les informations importantes

Une fois créée, vous verrez :

- ✅ **Internal Database URL** : `postgresql://exam_db_7br4_user:ntSPKYfZplyNAqdc46pmQoGVxz7vdrHc@dpg-d5f46fali9vc73dbgpkg-a/exam_db_7br4`
  - ⚠️ **Utilisez celle-ci** pour le backend sur Render (plus rapide)
- ✅ **External Database URL** : Pour connexions externes  postgresql://exam_db_7br4_user:ntSPKYfZplyNAqdc46pmQoGVxz7vdrHc@dpg-d5f46fali9vc73dbgpkg-a.frankfurt-postgres.render.com/exam_db_7br4
- ✅ **Host, Port, Database, User, Password**
dpg-d5f46fali9vc73dbgpkg-a 
5432
exam_db_7br4
exam_db_7br4_user
ntSPKYfZplyNAqdc46pmQoGVxz7vdrHc
**📝 Copiez l'Internal Database URL** - vous en aurez besoin à l'étape 3 !

---

## 🔧 ÉTAPE 2 : Préparer votre Code (si pas déjà fait)

### 2.1 Vérifier que votre code est sur GitHub

1. **Vérifier** que votre projet est sur GitHub
2. Si ce n'est pas le cas :
   ```bash
   git add .
   git commit -m "Prepare for Render deployment"
   git push origin main
   ```

### 2.2 Vérifier les fichiers nécessaires

Assurez-vous d'avoir :
- ✅ `backend/Procfile` (déjà créé)
- ✅ `backend/requirements.txt` (déjà présent)
- ✅ `backend/alembic.ini` (déjà présent)

---

## 🚀 ÉTAPE 3 : Créer le Web Service (Backend)

### 3.1 Créer le service

1. **Sur Render Dashboard**, cliquer sur "New +"
2. **Sélectionner** "Web Service"
3. **Connecter votre repository GitHub** :
   - Si c'est la première fois : "Connect GitHub"
   - Autoriser Render à accéder à vos repos
   - Sélectionner votre repository `exam-timetable-platform`

### 3.2 Configurer le service

Remplir le formulaire :

**Informations de base** :
- **Name** : `exam-platform-backend` (ou votre choix)
- **Region** : **Même région que la base de données** (important pour la performance)
- **Branch** : `main` (ou votre branche principale)
- **Root Directory** : `backend` ⚠️ **IMPORTANT**
- **Runtime** : `Python 3`
- **Build Command** : `pip install -r requirements.txt`
- **Start Command** : `alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port $PORT`

### 3.3 Configurer les Variables d'Environnement

**Cliquer sur "Advanced"** et ajouter ces variables :

| Variable | Valeur | Commentaire |
|----------|--------|-------------|
| `DATABASE_URL` | `postgresql+asyncpg://user:password@host:port/dbname` | ⚠️ **Internal Database URL** de l'étape 1, mais ajouter `+asyncpg` au début |
| `SECRET_KEY` | `votre-cle-secrete` | Générer avec `openssl rand -hex 32` (voir ci-dessous) |
| `ALGORITHM` | `HS256` | Pour JWT |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://localhost:3000` | Pour le développement local |

**🔑 Générer SECRET_KEY** :

Sur Windows (Git Bash ou PowerShell) :
```bash
# Option 1 : Python
python -c "import secrets; print(secrets.token_hex(32))"

# Option 2 : Si vous avez OpenSSL
openssl rand -hex 32
```

**📝 Format DATABASE_URL** :

Si votre Internal Database URL est :
```
postgresql://user:password@dpg-xxxxx-a.frankfurt-postgres.render.com/exam_db_xxxx
```

Changez-la en :
```
postgresql+asyncpg://user:password@dpg-xxxxx-a.frankfurt-postgres.render.com/exam_db_xxxx
```

⚠️ **Ajoutez `+asyncpg` après `postgresql`** !

### 3.4 Créer le service

1. **Cliquer sur** "Create Web Service"
2. Render va automatiquement :
   - Cloner votre repository
   - Installer les dépendances Python
   - Exécuter les migrations Alembic
   - Démarrer le serveur

### 3.5 Vérifier le déploiement

1. **Attendre** que le build se termine (2-5 minutes)
2. **Vérifier les logs** :
   - Cliquer sur "Logs" dans le dashboard
   - Vérifier qu'il n'y a pas d'erreurs
   - Vous devriez voir : "Application startup complete"

3. **Tester l'API** :
   - Cliquer sur l'URL du service (ex: `https://exam-platform-backend.onrender.com`)
   - Vous devriez voir : `{"message": "University Exam Optimization API"}`

**📝 Notez l'URL de votre backend** : `https://votre-service.onrender.com`

---

## 🗄️ ÉTAPE 4 : Initialiser la Base de Données

### 4.1 Vérifier que les migrations sont exécutées

Les migrations s'exécutent automatiquement au démarrage grâce à `alembic upgrade head` dans le Start Command.

**Vérifier dans les logs** :
- Chercher "Running upgrade" dans les logs
- Si vous voyez des erreurs, voir la section Dépannage

### 4.2 (Optionnel) Créer des données de test

**Option A : Via Render Shell** (Recommandé)

1. Dans votre service backend sur Render
2. Cliquer sur "Shell" (en haut à droite)
3. Exécuter :
   ```bash
   cd backend
   python seed_data.py
   ```

**Option B : Via script local**

1. Créer un fichier `.env` local avec :
   ```env
   DATABASE_URL=postgresql+asyncpg://user:password@host:port/dbname
   ```
   (Utiliser l'External Database URL de Render)

2. Exécuter :
   ```bash
   cd backend
   python seed_data.py
   ```

**Option C : Créer un utilisateur admin**

1. Via Render Shell :
   ```bash
   cd backend
   python create_admin.py
   ```

---

## 🔥 ÉTAPE 5 : Déployer le Frontend (Firebase Hosting)

### 5.1 Installer Firebase CLI

```bash
npm install -g firebase-tools
firebase login
```

### 5.2 Initialiser Firebase

```bash
cd frontend
firebase init hosting
```

**Réponses** :
- ✅ Use an existing project ou Create a new project
- **Public directory** : `dist`
- **Single-page app** : `Yes`
- **GitHub automatic deploys** : `No` (pour l'instant)

### 5.3 Configurer l'URL de l'API

1. **Créer un fichier `.env` dans `frontend/`** :
   ```env
   VITE_API_BASE_URL=https://votre-backend.onrender.com/api/v1
   ```
   ⚠️ **Remplacer** `votre-backend.onrender.com` par votre URL Render réelle !

2. **Vérifier** que `frontend/src/api/client.ts` utilise bien `import.meta.env.VITE_API_BASE_URL`

### 5.4 Build et Déployer

```bash
cd frontend
npm install
npm run build
firebase deploy
```

### 5.5 Noter l'URL Firebase

Après le déploiement, vous obtiendrez :
- `https://votre-projet.firebaseapp.com`
- `https://votre-projet.web.app`

**📝 Notez cette URL** !

---

## 🔄 ÉTAPE 6 : Mettre à jour CORS

1. **Retourner sur Render** → Votre service backend
2. **Aller dans** "Environment"
3. **Mettre à jour** `ALLOWED_ORIGINS` :
   ```
   http://localhost:5173,http://localhost:3000,https://votre-projet.firebaseapp.com,https://votre-projet.web.app
   ```
4. **Redémarrer le service** (Render le fait automatiquement)

---

## ✅ ÉTAPE 7 : Tester

### 7.1 Tester le Backend

```bash
# Test de l'API
curl https://votre-backend.onrender.com/

# Devrait retourner :
# {"message": "University Exam Optimization API"}
```

### 7.2 Tester le Frontend

1. **Ouvrir** `https://votre-projet.firebaseapp.com`
2. **Tester la connexion** avec un compte admin
3. **Vérifier la console du navigateur** (F12) pour les erreurs

---

## 🐛 Dépannage

### Problème : "Database connection error"

**Solution** :
- Vérifier que `DATABASE_URL` contient bien `+asyncpg`
- Vérifier que vous utilisez l'**Internal Database URL** (pas External)
- Vérifier que le backend et la DB sont dans la même région

### Problème : "CORS error" dans le frontend

**Solution** :
- Vérifier que `ALLOWED_ORIGINS` contient votre URL Firebase
- Redémarrer le service backend

### Problème : "Migrations failed"

**Solution** :
- Vérifier les logs Render
- Vérifier que `DATABASE_URL` est correct
- Essayer manuellement via Shell :
  ```bash
  cd backend
  alembic upgrade head
  ```

### Problème : "Module not found" ou erreurs Python

**Solution** :
- Vérifier que `requirements.txt` contient toutes les dépendances
- Vérifier les logs de build

---

## 📝 Checklist Finale

- [ ] Base PostgreSQL créée sur Render
- [ ] Internal Database URL notée
- [ ] Web Service créé sur Render
- [ ] Variables d'environnement configurées (DATABASE_URL, SECRET_KEY, etc.)
- [ ] Backend déployé et accessible
- [ ] Migrations exécutées (vérifier les logs)
- [ ] Frontend déployé sur Firebase
- [ ] URL API configurée dans le frontend
- [ ] CORS mis à jour avec l'URL Firebase
- [ ] Tests de connexion réussis
- [ ] URLs notées pour la soumission

---

## 🔗 URLs à Noter

- **Backend API** : `https://votre-backend.onrender.com/api/v1`
- **Frontend** : `https://votre-projet.firebaseapp.com`
- **Documentation API** : `https://votre-backend.onrender.com/docs` (Swagger automatique)

---

## 💡 Astuces

1. **Render Free Tier** : Le service peut "s'endormir" après 15 min d'inactivité. Le premier appel peut être lent (~30s).

2. **Performance** : Utiliser l'Internal Database URL (pas External) pour de meilleures performances.

3. **Logs** : Toujours vérifier les logs Render en cas de problème.

4. **Variables d'environnement** : Ne jamais commiter les `.env` files avec des secrets.

---

## 🎯 Prochaines Actions

1. ✅ Créer la base PostgreSQL (Étape 1)
2. ✅ Créer le Web Service (Étape 3)
3. ✅ Configurer les variables d'environnement
4. ✅ Déployer le frontend (Étape 5)
5. ✅ Tester tout (Étape 7)

**Bonne chance avec le déploiement ! 🚀**

