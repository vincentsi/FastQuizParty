# Security Policy

## 🛡️ Security Score: 9/10

This boilerplate has undergone a comprehensive security audit with **22 out of 22 tasks completed**. See [AUDIT-SECURITE-PERFORMANCE-COMPLET.md](../docs/AUDIT-SECURITE-PERFORMANCE-COMPLET.md) for the full audit report.

## 🔒 Security Features

### Authentication & Authorization

- ✅ JWT with refresh tokens (15min access, 7 days refresh)
- ✅ bcrypt password hashing (salt rounds = 10)
- ✅ Password validation (6+ chars, blacklist of common passwords)
- ✅ Timing attack protection (constant-time comparison for password reset)
- ✅ Role-Based Access Control (RBAC) - zero DB queries
- ✅ Email verification required
- ✅ Secure password reset flow

### Protection Mechanisms

- ✅ **CSRF Protection** - Redis-cached tokens (~1ms validation)
- ✅ **Rate Limiting** - Per endpoint (100 req/min API, 5 req/15min login)
- ✅ **SQL Injection** - Prevented by Prisma ORM
- ✅ **XSS Protection** - httpOnly cookies, CSP headers
- ✅ **CORS** - Properly configured with whitelist
- ✅ **Helmet.js** - Secure HTTP headers
- ✅ **Input Validation** - Zod schemas on all endpoints

### Infrastructure Security

- ✅ **HTTPS Ready** - Nginx SSL configuration (TLS 1.2/1.3)
- ✅ **Secrets Management** - .env files (never committed)
- ✅ **Error Handling** - No sensitive data in error responses
- ✅ **Logging** - Structured logs with Pino (no sensitive data)
- ✅ **Docker Security** - Non-root user, minimal images
- ✅ **Database** - Connection pooling, prepared statements

### Monitoring & Observability

- ✅ **Sentry Integration** - Error tracking and performance monitoring
- ✅ **Audit Trail** - User login tracking (lastLoginAt, lastLoginIp, loginCount)
- ✅ **Soft Delete** - User accounts marked as deleted (not hard deleted)

## 🚨 Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please report it responsibly.

### How to Report

**DO NOT** open a public GitHub issue for security vulnerabilities.

Instead, please email us at: **vincent.si.dev@gmail.com**

Include the following information:

1. **Description** - Clear description of the vulnerability
2. **Impact** - Potential impact and severity
3. **Steps to Reproduce** - Detailed steps to reproduce the issue
4. **Proof of Concept** - Code or screenshots demonstrating the issue
5. **Suggested Fix** - (Optional) Your recommendation for fixing the issue

### Response Timeline

- **Initial Response**: Within 48 hours
- **Status Update**: Within 5 business days
- **Fix Timeline**: Critical issues within 7 days, others within 30 days
- **Public Disclosure**: After fix is deployed and users have time to update

### Security Advisories

Security fixes will be published as GitHub Security Advisories and documented in [CHANGELOG.md](CHANGELOG.md).

## 🔐 Security Best Practices for Users

When deploying this boilerplate in production:

### 1. Environment Variables

Never commit `.env` files. Use strong, unique secrets:

```bash
# Generate strong JWT secrets (64 bytes)
openssl rand -hex 64

# Required secrets:
JWT_SECRET=                  # 64+ characters
JWT_REFRESH_SECRET=          # 64+ characters
DATABASE_URL=                # PostgreSQL connection string
STRIPE_SECRET_KEY=           # From Stripe dashboard
STRIPE_WEBHOOK_SECRET=       # From Stripe webhook setup
RESEND_API_KEY=              # From Resend dashboard
```

### 2. HTTPS Configuration

Enable HTTPS in production:

1. Uncomment HTTPS server block in `nginx/nginx.prod.conf` (lines 127-194)
2. Configure SSL certificates (see `nginx/ssl/README.md`)
3. Enable HTTP→HTTPS redirect (line 87-89)
4. Update `server_name` with your domain

### 3. Rate Limiting

Configure rate limits per your needs in:

- `apps/backend/src/middlewares/security.middleware.ts` (global)
- `apps/backend/src/routes/auth.route.ts` (per-route)
- `nginx/nginx.prod.conf` (Nginx level)

### 4. CORS Configuration

Update CORS whitelist in `apps/backend/src/config/env.ts`:

```typescript
CORS_ORIGIN: z.string().default('http://localhost:3000,https://yourdomain.com')
```

### 5. Sentry Monitoring

Set up Sentry for production error tracking:

```env
SENTRY_DSN=https://...@sentry.io/...
```

### 6. Database Security

- Use strong PostgreSQL passwords
- Enable SSL/TLS for database connections
- Regular backups (automated with `BackupService`)
- Limit database user permissions (principle of least privilege)

### 7. JWT Secret Rotation

Rotate JWT secrets periodically (every 90-180 days). See [SECRETS-ROTATION.md](../docs/SECRETS-ROTATION.md) for the complete guide.

### 8. Dependencies

Keep dependencies up to date:

```bash
# Check for outdated packages
npm outdated

# Check for security vulnerabilities
npm audit

# Update packages
npm update
```

### 9. Redis Security

Secure your Redis instance:

- Use password authentication
- Bind to localhost or private network
- Enable TLS for remote connections
- Regular backups

### 10. Docker Security

Production Docker best practices:

- Use non-root user (already configured)
- Scan images for vulnerabilities (`docker scan`)
- Keep base images updated
- Use multi-stage builds (already implemented)

## 📋 Security Checklist for Deployment

Before deploying to production, verify:

- [ ] All `.env` variables are set with strong secrets
- [ ] HTTPS is enabled in Nginx
- [ ] CORS whitelist is configured correctly
- [ ] Rate limiting is enabled and configured
- [ ] Sentry DSN is set for error monitoring
- [ ] Database backups are scheduled (S3 recommended)
- [ ] JWT secrets are 64+ characters
- [ ] Redis is password-protected
- [ ] PostgreSQL uses strong password
- [ ] Docker images are scanned for vulnerabilities
- [ ] CSP headers are configured (already in Helmet)
- [ ] Stripe webhook secret is configured
- [ ] Email verification is enabled
- [ ] Password validation is enforced (6+ chars)
- [ ] Admin routes are protected by RBAC
- [ ] Audit trail is enabled (login tracking)

## 🔄 Security Updates

This boilerplate receives regular security updates. To stay informed:

1. Watch this repository for releases
2. Subscribe to security advisories
3. Check [CHANGELOG.md](CHANGELOG.md) for security patches
4. Join our community (if applicable)

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Docker Security Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Stripe Security](https://stripe.com/docs/security/stripe)

---

## 📞 Contact

For security-related questions or concerns:

- Email: vincent.si.dev@gmail.com
- Security advisories: [GitHub Security](https://github.com/vincentsi/fullstack-boilerplate/security)

Thank you for helping keep this project secure! 🙏
