# Pull Request

## Target Branch
- [ ] FE/dev
- [ ] FE/prod

(Check the target branch for this PR)

---

## Summary
Briefly describe what this PR does.

---

## Checklist (Required)

### General
- [ ] Branch is up to date with the target branch
- [ ] No unrelated changes included
- [ ] Code follows project standards
- [ ] No debug logs or temporary code left behind

---

## FE/dev Checklist (Development PRs)

(Complete this section only if target branch is FE/dev)

- [ ] Feature or fix is complete
- [ ] Unit tests added or updated (if applicable)
- [ ] Manual testing completed
- [ ] No version bump included
- [ ] Safe to merge into FE/dev

---

## FE/prod Checklist (Production Release PRs)

(Complete this section only if target branch is FE/prod)

### Versioning
- [ ] Release branch created from latest FE/dev
- [ ] Branch name follows `release/vX.Y.Z`
- [ ] Application version updated (package.json)
- [ ] Version follows semantic versioning

### Testing & Stability
- [ ] All automated tests are passing
- [ ] Manual smoke testing completed
- [ ] No known critical or high-severity issues

### Environment & Deployment
- [ ] Production environment variables verified
- [ ] No secrets committed
- [ ] CI/CD pipeline will deploy on merge

### Rollback Readiness
- [ ] Previous stable version identified
- [ ] Rollback plan understood

---

## Post-Merge Actions (FE/prod only)
- [ ] Production tag will be created after merge
- [ ] Production deployment verified
- [ ] FE/prod will be merged back into FE/dev

---

## Release Information (FE/prod only)
- Release Version: vX.Y.Z  
- Previous Stable Version: vX.Y.Z-1  

---

## Additional Notes
Add any risks, follow-ups, or important context.
