# HIPAA Security Policy & Compliance Documentation

## Overview

This document outlines the security measures implemented in Habit-a-Day to maintain HIPAA compliance for handling Protected Health Information (PHI).

**Last Updated:** [DATE]
**Version:** 1.0.0
**Review Frequency:** Annual or after significant changes

---

## 1. Protected Health Information (PHI) Inventory

### Data Classification

| Data Type | Classification | Encryption | Access Control |
|-----------|---------------|------------|----------------|
| User Profile (name, email, age) | PHI | At rest + Transit | User only (RLS) |
| Biometric Data (weight, height) | PHI | At rest + Transit | User only (RLS) |
| Bathroom Entries | PHI | At rest + Transit | User only (RLS) |
| Food Journal | PHI | At rest + Transit | User only (RLS) |
| Water Intake | PHI | At rest + Transit | User only (RLS) |
| Physical Therapy Entries | PHI | At rest + Transit | User only (RLS) |
| User Goals | PHI | At rest + Transit | User only (RLS) |
| Session Tokens | Sensitive | Transit (TLS) | System |
| Audit Logs | Sensitive | At rest | Admin/User (own) |

### PHI Data Flow

```
User Input → Frontend → API Routes → Supabase Database
                ↓
        [Sanitization before external APIs]
                ↓
        External APIs (Anthropic, FatSecret) - NO PHI
```

---

## 2. Technical Safeguards

### 2.1 Access Controls

- **Authentication:** OAuth 2.0 (Google, Facebook, Apple) + Email/Password via Supabase Auth
- **Authorization:** Row Level Security (RLS) on all PHI tables
- **Session Management:** JWT tokens with automatic refresh, httpOnly cookies
- **Session Timeout:** 15-minute inactivity timeout (configurable)
- **Maximum Session:** 8-hour absolute timeout requiring re-authentication

### 2.2 Encryption

| Layer | Method | Key Management |
|-------|--------|---------------|
| In Transit | TLS 1.2+ | Managed by Vercel/Supabase |
| At Rest (Database) | AES-256 | Managed by Supabase |
| At Rest (Application) | AES-256-GCM | PHI_ENCRYPTION_KEY env var |
| Backup | AES-256 | Managed by Supabase |

**Application-Level Encryption:**
- Enabled via `ENCRYPT_PHI_AT_REST=true`
- Key: `PHI_ENCRYPTION_KEY` (32-byte base64)
- Fields: notes, pain_level, urine_color, stream_strength

### 2.3 Audit Logging

All PHI access is logged to the `audit_logs` table:

| Event Type | Logged Information |
|------------|-------------------|
| CREATE | user_id, resource_type, resource_id, timestamp |
| READ | user_id, resource_type, resource_id, timestamp |
| UPDATE | user_id, resource_type, resource_id, timestamp |
| DELETE | user_id, resource_type, resource_id, timestamp |
| EXPORT | user_id, export_type, timestamp |
| LOGIN/LOGOUT | user_id, IP, user_agent, timestamp |
| ACCESS_DENIED | user_id, resource_type, reason, timestamp |

**Retention:** Minimum 6 years (HIPAA requirement)

### 2.4 Security Headers

```
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
Content-Security-Policy: [configured in next.config.ts]
```

---

## 3. Administrative Safeguards

### 3.1 Business Associate Agreements (BAAs)

| Service Provider | BAA Status | Review Date |
|-----------------|------------|-------------|
| Supabase | [ ] Signed | |
| Vercel | [ ] Signed | |
| Anthropic | [ ] N/A - No PHI sent | |

### 3.2 Workforce Training

- [ ] All team members complete HIPAA training annually
- [ ] Training records maintained for 6 years
- [ ] Documented acknowledgment of security policies

### 3.3 Access Management

- [ ] Unique user IDs for all workforce members
- [ ] Access reviews conducted quarterly
- [ ] Termination procedures documented

---

## 4. Physical Safeguards

All infrastructure is cloud-hosted:

| Component | Provider | Compliance |
|-----------|----------|------------|
| Database | Supabase | SOC 2 Type II |
| Hosting | Vercel | SOC 2 Type II |
| CDN | Vercel Edge | SOC 2 Type II |

---

## 5. Incident Response Plan

### 5.1 Breach Detection

Monitor for:
- Unusual access patterns
- Failed login attempts
- Large data exports
- Access from unknown IPs

### 5.2 Response Procedures

1. **Identify:** Determine scope and nature of incident
2. **Contain:** Revoke access, isolate affected systems
3. **Eradicate:** Remove threat, patch vulnerabilities
4. **Recover:** Restore services, verify integrity
5. **Report:** Notify affected parties within 60 days (HIPAA requirement)
6. **Document:** Maintain incident records for 6 years

### 5.3 Breach Notification

- **HHS:** Report breaches affecting 500+ individuals within 60 days
- **Individuals:** Notify affected individuals within 60 days
- **Media:** Notify media if breach affects 500+ in a state

---

## 6. Risk Assessment

### 6.1 Annual Risk Assessment Checklist

- [ ] Review access controls
- [ ] Test encryption mechanisms
- [ ] Verify audit log integrity
- [ ] Review third-party vendor compliance
- [ ] Test incident response procedures
- [ ] Update threat model
- [ ] Review and update policies

### 6.2 Known Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Session hijacking | Low | High | httpOnly cookies, short sessions |
| SQL injection | Low | High | Parameterized queries (Supabase) |
| XSS attacks | Medium | Medium | CSP headers, input sanitization |
| Data breach | Low | High | Encryption, access controls |
| Insider threat | Low | High | RLS, audit logging |

---

## 7. Configuration Checklist

### Environment Variables

```bash
# Required for HIPAA compliance
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
SUPABASE_SERVICE_ROLE_KEY=xxx

# Session timeout (milliseconds)
NEXT_PUBLIC_SESSION_TIMEOUT_MS=900000      # 15 minutes
NEXT_PUBLIC_SESSION_WARNING_MS=120000       # 2 minute warning
NEXT_PUBLIC_MAX_SESSION_DURATION_MS=28800000 # 8 hours

# Application-level encryption (optional but recommended)
ENCRYPT_PHI_AT_REST=true
PHI_ENCRYPTION_KEY=<32-byte-base64-key>

# Audit log retention (days)
AUDIT_LOG_RETENTION_DAYS=2190              # 6 years
```

### Generate Encryption Key

```javascript
// Run once to generate PHI_ENCRYPTION_KEY
const key = crypto.getRandomValues(new Uint8Array(32));
console.log(Buffer.from(key).toString('base64'));
```

---

## 8. Compliance Contacts

| Role | Name | Contact |
|------|------|---------|
| Privacy Officer | [NAME] | [EMAIL] |
| Security Officer | [NAME] | [EMAIL] |
| Legal Counsel | [NAME] | [EMAIL] |

---

## 9. Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | [DATE] | [AUTHOR] | Initial policy |

---

## Appendix A: Required Supabase Migrations

Run these migrations to enable HIPAA compliance features:

1. `add_hipaa_audit_logging.sql` - Creates audit_logs table

---

## Appendix B: Security Testing

### Recommended Testing Schedule

| Test Type | Frequency | Last Completed |
|-----------|-----------|----------------|
| Vulnerability Scan | Monthly | |
| Penetration Test | Annual | |
| Access Review | Quarterly | |
| Backup Restoration | Semi-annual | |
| Incident Response Drill | Annual | |
