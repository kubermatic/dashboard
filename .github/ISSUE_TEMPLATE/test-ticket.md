---
name: Test Ticket
about: Structured manual/QA testing ticket for features, bug fixes, or regression testing
title: "QA: [Feature or Bug Name]"
labels: kind/testing, sig/ui
---

### Summary
**Testing scope:** <!-- Brief description of what is being tested and why -->
**Related:**
- Issue: <!-- paste Issue URL here -->
- PR: <!-- paste PR URL here -->

### Type of Testing
- [ ] New Feature
- [ ] Bug Fix / Regression
- [ ] UI/UX
- [ ] Performance
- [ ] Security / Permissions (RBAC)
- [ ] Upgrade / Migration
- [ ] Other:

### Test Depth
<!-- Smoke: verify core flow works end-to-end. Full/Deep: cover edge cases, RBAC, error states, providers. -->
- [ ] Smoke
- [ ] Full / Deep

### Prerequisites
<!-- Environment setup, feature flags, admin settings, or test data required before testing begins. -->
<!-- ⚠️ WARNING: Do not include sensitive API tokens, kubeconfigs, or passwords in this issue. -->
<!--
- [ ] Feature flag enabled in admin panel (if applicable)
- [ ] Seed datacenter configured with at least one provider (e.g. AWS, GCP)
- [ ] Admin and member user accounts available for RBAC testing
-->
**Environment:**
- [ ] Provider Specific Setup (If Applicable):

### Test Scenarios
<!-- Check the box to mark a passing test. Leave unchecked and add notes for failures. -->

- [ ] **Scenario 1: Happy path**
  - **Steps:**
    1.
    2.
    3.
  - **Expected:**
  - **Actual / Notes:**

- [ ] **Scenario 2: [Description]**
  - **Steps:**
    1.
  - **Expected:**
  - **Actual / Notes:**

### Edge Cases & Boundary Conditions
<!-- Test error states, empty states, permission boundaries, and invalid inputs. -->
<!--
- [ ] Member user cannot access admin-only settings
- [ ] Invalid input shows validation error, no crash
-->
- [ ]

### Screenshots / Attachments
<!-- Attach screenshots, screen recordings, or console logs for any failures. -->

### Acceptance Criteria
<!-- What must be true for this ticket to be signed off as passed? -->
<!--
- [ ] Works end-to-end on at least one provider
- [ ] No console errors during normal flow
-->
- [ ]

## Blockers & Follow-ups
**Blockers** (testing cannot proceed):
- [ ]

**Known Issues** (to document):
- [ ]

## Important Links
<!-- Add links to relevant docs, design specs, or related issues -->

### Test Environment
- **UI Version:**
- **API Version:**
- **K8s Version:**
- **Provider:**
- **Browser & OS:** <!-- e.g., Chrome 114 on macOS Ventura -->
- **Domain:**
