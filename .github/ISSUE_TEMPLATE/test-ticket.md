---
name: Test Ticket
about: Structured manual/QA testing ticket for features, bug fixes, or regression testing
title: "QA: [Feature or Bug Name]"
labels: kind/testing, sig/ui
---

### Summary

<!-- What is being tested and why. Link to the related PR, issue, or epic. -->
**Testing scope:**

**Related:** <!-- PR/Issue/Epic link -->
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

**Environment:**
- [ ] Provider Specific Setup (If Applicable):


### Test Scenarios

<!-- List test cases below. Check the box to indicate a passing test. If a test fails, leave it unchecked and add details. -->

- [ ] **Scenario 1: Happy path**
  - **Steps:**
    1.
    2.
    3.
  - **Expected:**
  - **Actual / Notes:** <!-- Fill in if the test failed or behaved unexpectedly -->

- [ ] **Scenario 2: [Description]**
  - **Steps:**
    1.
  - **Expected:**
  - **Actual / Notes:**


### Edge Cases & Boundary Conditions

<!-- Test error states, empty states, permission boundaries, and invalid inputs. -->

<!-- Examples:
- [ ] Empty states display correctly
- [ ] Error messages are clear and actionable
-->

- [ ]


### Screenshots / Attachments (If Applicable)

<!-- Attach any relevant screenshots, screen recordings, or console logs of bugs encountered during testing. -->


### Acceptance Criteria

<!-- Clear definition of done. What must be true for this ticket to be signed off as passed? -->

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
