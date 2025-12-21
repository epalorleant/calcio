# Creating the Root User Account

The root user account has all privileges and can grant admin roles to other users. To create the initial root user, use the provided script.

## Method 1: Using Command Line Arguments

```bash
cd backend
python scripts/create_root_user.py --email admin@example.com --username admin --password your_secure_password
```

## Method 2: Using Environment Variables

```bash
cd backend
export ROOT_EMAIL=admin@example.com
export ROOT_USERNAME=admin
export ROOT_PASSWORD=your_secure_password
python scripts/create_root_user.py
```

## Method 3: Using Docker/Container

If running in a container, you can execute the script inside the container:

```bash
# If using docker-compose
docker-compose exec backend python scripts/create_root_user.py --email admin@example.com --username admin --password your_secure_password
```

## Method 4: Using OpenShift/Kubernetes

### Step 1: Find the Backend Pod

First, identify the backend pod name:

```bash
# List pods in the calcio namespace
oc get pods -n calcio | grep backend

# Or using kubectl
kubectl get pods -n calcio | grep backend
```

You should see something like: `backend-xxxxxxxxxx-xxxxx`

### Step 2: Execute the Script in the Pod

Execute the script inside the backend pod:

```bash
# Using oc (OpenShift CLI)
oc exec -it deployment/backend -n calcio -- python scripts/create_root_user.py --email admin@example.com --username admin --password your_secure_password

# Or using kubectl
kubectl exec -it deployment/backend -n calcio -- python scripts/create_root_user.py --email admin@example.com --username admin --password your_secure_password
```

**Note**: If you're using a pod name instead of deployment, use:
```bash
oc exec -it <backend-pod-name> -n calcio -- python scripts/create_root_user.py --email admin@example.com --username admin --password your_secure_password
```

### Step 3: Alternative - Using Environment Variables

You can also pass credentials via environment variables:

```bash
oc exec -it deployment/backend -n calcio -- env ROOT_EMAIL=admin@example.com ROOT_USERNAME=admin ROOT_PASSWORD=your_secure_password python scripts/create_root_user.py
```

### Step 4: Verify the Root User was Created

Check the script output. You should see:
```
Root user created successfully!
  Email: admin@example.com
  Username: admin

You can now log in with these credentials.
```

### Troubleshooting in OpenShift

If you encounter permission issues:

1. **Check if the pod is running**:
   ```bash
   oc get pods -n calcio
   ```

2. **Check pod logs**:
   ```bash
   oc logs deployment/backend -n calcio
   ```

3. **Verify database connectivity**:
   ```bash
   oc exec -it deployment/backend -n calcio -- python -c "from app.core.config import settings; print(settings.database_url)"
   ```

4. **If the script file is not found**, verify it's in the container:
   ```bash
   oc exec -it deployment/backend -n calcio -- ls -la scripts/
   ```

## Important Notes

1. **Password Requirements**: The password must be at least 8 characters long.
2. **Email Uniqueness**: The email must be unique and not already registered.
3. **Username Uniqueness**: The username must be unique and not already taken.
4. **Root User**: Only one root user can exist. If a root user already exists, the script will inform you and exit.
5. **Security**: Choose a strong password for the root account as it has full system access.

## After Creating the Root User

Once the root user is created, you can:

1. Log in to the application using the email and password you specified
2. Access the "Admin Management" page (visible only to root users) to grant admin roles to other users
3. Perform all administrative actions in the system

## Troubleshooting

- **"Root user already exists"**: A root user has already been created. You can log in with the existing root credentials.
- **"Email already registered"**: The email is already in use. Choose a different email or use the existing account.
- **"Username already taken"**: The username is already in use. Choose a different username.

