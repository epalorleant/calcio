# Alembic for OpenShift/Kubernetes - Guide

## Is Alembic Suitable for OpenShift?

**Yes, absolutely!** Alembic is an excellent choice for database schema management in OpenShift/Kubernetes environments. Here's why:

### ✅ Advantages

1. **Idempotent Operations**: Alembic tracks applied migrations in the database, so running migrations multiple times is safe
2. **Version Control**: All schema changes are tracked in code (Git)
3. **Rollback Support**: Can downgrade migrations if needed
4. **Container-Friendly**: Designed to run as a one-time operation
5. **Production-Proven**: Used by many production applications
6. **No External Dependencies**: Doesn't require separate migration tools

### ⚠️ Important Considerations

1. **Run Before App Starts**: Migrations must complete before the application starts
2. **Database Connectivity**: Migrations need database access (handled by init containers)
3. **URL Conversion**: Alembic needs sync URLs, while async apps use async URLs
4. **Failure Handling**: Migration failures should prevent app deployment

## Deployment Strategies

### Strategy 1: Init Container (Recommended) ⭐

**Best for**: Automatic migrations on every deployment

**How it works**:
- Init container runs migrations before main app starts
- App only starts if migrations succeed
- Single Deployment manages both

**Pros**:
- Automatic - migrations run on every deployment
- Simple - one Deployment to manage
- Safe - app won't start with failed migrations

**Cons**:
- Slightly longer pod startup time
- Can't run migrations independently

**File**: `infra/k8s/backend-with-init.yaml`

### Strategy 2: Helm Pre/Post Hooks

**Best for**: Complex deployments with Helm

**How it works**:
- Use Helm hooks to run migrations before/after deployment
- More control over migration lifecycle

**Pros**:
- Integrated with Helm deployment
- Can run pre/post migration tasks

**Cons**:
- Requires Helm
- More complex setup

## Implementation Details

### Database URL Handling

The application uses **async** SQLAlchemy (asyncpg), but Alembic requires **sync** drivers (psycopg2).

**Solution**: Store both URLs in the secret:
```yaml
DATABASE_URL: postgresql://...          # For Alembic (sync)
DATABASE_URL_ASYNC: postgresql+asyncpg://...  # For app (async)
```

The init container converts the async URL to sync for Alembic.

### Migration Safety

Alembic is safe to run multiple times because:
1. It tracks applied migrations in `alembic_version` table
2. Already-applied migrations are skipped
3. Only new migrations are executed

### Rollback Strategy

If a migration causes issues:
```bash
# Rollback last migration
kubectl exec -it deployment/backend -c migration -n calcio -- \
  alembic downgrade -1

# Rollback to specific revision
kubectl exec -it deployment/backend -c migration -n calcio -- \
  alembic downgrade <revision>
```

## Comparison with Alternatives

### Alembic vs. Manual SQL Scripts

| Feature | Alembic | Manual SQL |
|---------|---------|------------|
| Version Control | ✅ In Git | ⚠️ Need separate process |
| Idempotency | ✅ Built-in | ❌ Manual handling |
| Rollback | ✅ Supported | ⚠️ Manual scripts |
| Dependency Tracking | ✅ Automatic | ❌ Manual |
| Production Ready | ✅ Yes | ⚠️ Depends on process |

### Alembic vs. Flyway/Liquibase

| Feature | Alembic | Flyway | Liquibase |
|---------|---------|--------|-----------|
| Language | Python | SQL/Java | XML/YAML/SQL |
| Python Integration | ✅ Native | ⚠️ Requires Java | ⚠️ Requires Java |
| SQLAlchemy Integration | ✅ Native | ❌ No | ❌ No |
| Learning Curve | ✅ Low (if using Python) | Medium | Medium |

## Best Practices for OpenShift

1. **Use Init Containers**: Ensures migrations run before app starts
2. **Resource Limits**: Set appropriate limits for migration containers
3. **Security**: Run migrations as non-root with dropped capabilities
4. **Monitoring**: Monitor migration job/pod status
5. **Backups**: Always backup before major migrations
6. **Testing**: Test migrations in staging first
7. **Documentation**: Document migration process and rollback procedures

## Troubleshooting

### Migration Fails to Start

**Check**:
- Database connectivity
- Secret contains correct DATABASE_URL
- Migration container has proper permissions

**Debug**:
```bash
kubectl logs job/db-migration -n calcio
kubectl describe pod <migration-pod> -n calcio
```

### Migration Already Applied

This is normal! Alembic will skip already-applied migrations. Check status:
```bash
kubectl exec -it deployment/backend -c migration -n calcio -- \
  alembic current
```

### Database Connection Issues

**Check**:
- Database service is running: `kubectl get pods -n calcio -l app=db`
- Network policies allow connection
- Database credentials in secret are correct

## Conclusion

Alembic is **highly suitable** for OpenShift deployments when:
- ✅ Used with init containers or Jobs
- ✅ Database URLs are properly configured
- ✅ Migration process is tested and documented
- ✅ Rollback procedures are in place

The provided configurations handle all the complexity, making Alembic a robust and production-ready solution for your OpenShift deployment.

