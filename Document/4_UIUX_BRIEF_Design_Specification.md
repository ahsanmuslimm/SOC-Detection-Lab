# SOC Detection Lab
## UI/UX Brief & Design Specification v1.0

---

## Executive Summary

This document defines the aesthetic principles, design patterns, component specifications, accessibility requirements, and user experience guidelines for SOC Detection Lab. It ensures a cohesive, professional analyst experience across all platforms and roles.

---

## 1. Design Principles

### 1.1 Core UX Principles

1. **Clarity Over Aesthetics**
   - Raw data and evidence must be visible and unobstructed
   - Visual hierarchy prioritizes actionable information
   - No opaque AI scores; show the reasoning

2. **Two-Click Rule**
   - From any alert, raw evidence accessible within two interactions
   - Minimize navigation layers for critical workflows
   - Breadcrumb navigation visible at all times

3. **Context Always Visible**
   - Time, source IP, destination, user, asset context persists during investigation
   - Analyst never loses situational awareness
   - Timeline reference visible in case views

4. **Trust Through Transparency**
   - Every automated action displays triggering logic
   - Approval states clearly marked (pending, approved, rejected)
   - Audit trails readily accessible
   - Known false-positive indicators shown

5. **Mobile-First Consideration**
   - Design works responsively on desktop, tablet, mobile
   - Core workflows optimized for touch
   - Mobile offers subset of critical features

6. **Accessibility by Default**
   - WCAG 2.1 Level AA compliance built-in
   - Keyboard navigation throughout
   - Screen reader support for all content
   - Color not sole indicator of status

### 1.2 Analyst-Centric Design

The platform prioritizes analyst workflow efficiency:
- **Minimize Cognitive Load**: Pre-filter, suggest, correlate
- **Enable Rapid Triage**: Quick assessment without deep drilling
- **Support Deep Investigation**: Advanced pivoting and correlation
- **Document Implicitly**: Actions logged automatically; minimal manual documentation
- **Empower Decision-Making**: Provide context, let analysts decide

---

## 2. Visual Identity

### 2.1 Color Palette

#### Semantic Colors

| Purpose | Color | Hex | Usage |
|---|---|---|---|
| **Primary Action** | Blue | #007BFF | Buttons, links, CTAs |
| **Danger/Destructive** | Red | #DC3545 | Delete, stop, block actions |
| **Success** | Green | #28A745 | Approved, completed, healthy |
| **Warning** | Orange | #FFC107 | Caution, escalation needed |
| **Info** | Cyan | #17A2B8 | Information, hints, tooltips |
| **Neutral** | Gray | #6C757D | Disabled, secondary actions |

#### Severity Levels (Alerts & Severity)

| Severity | Color | Hex | Level |
|---|---|---|---|
| **Critical** | Red | #DC3545 | 9-10 |
| **High** | Orange-Red | #FF6B6B | 7-8 |
| **Medium** | Orange | #FFC107 | 5-6 |
| **Low** | Yellow | #FFE082 | 3-4 |
| **Informational** | Gray | #E9ECEF | 0-2 |

#### Status Colors

| Status | Color | Hex | States |
|---|---|---|---|
| **Active/Running** | Green | #28A745 | Connected, deployed, running |
| **Pending** | Blue | #007BFF | Awaiting approval, in progress |
| **Paused/Idle** | Gray | #6C757D | Paused, disconnected |
| **Error/Failed** | Red | #DC3545 | Failed, error, disconnected |
| **Warning** | Orange | #FFC107 | Needs attention |

#### Background Colors

| Context | Color | Hex | Usage |
|---|---|---|---|
| **Primary BG** | White | #FFFFFF | Main content area |
| **Secondary BG** | Light Gray | #F8F9FA | Panels, cards, sections |
| **Tertiary BG** | Lighter Gray | #E9ECEF | Subtle backgrounds |
| **Dark Mode (Future)** | Dark Gray | #1A1A2E | Night mode option |

### 2.2 Typography

#### Font Stack
```
Primary Font: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif
Monospace (Code): 'Monaco', 'Courier New', monospace
Heading Font: Same as primary (weight variation)
```

#### Font Sizes and Hierarchy

| Element | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| **H1 (Page Title)** | 32px | 700 | 1.2 | Main page heading |
| **H2 (Section)** | 24px | 600 | 1.3 | Section headers |
| **H3 (Subsection)** | 20px | 600 | 1.4 | Subsection headers |
| **Body (Large)** | 16px | 400 | 1.5 | Primary body text |
| **Body (Regular)** | 14px | 400 | 1.6 | General content |
| **Body (Small)** | 12px | 400 | 1.6 | Secondary text, metadata |
| **Caption** | 11px | 400 | 1.5 | Captions, timestamps |
| **Code** | 13px | 400 | 1.4 | Code blocks, raw events |

#### Font Weights

- **700 (Bold)**: Headings, strong emphasis, buttons
- **600 (Semibold)**: Subheadings, labels, column headers
- **500 (Medium)**: Button text, strong labels
- **400 (Regular)**: Body text, descriptions
- **300 (Light)**: Not recommended; use for very subtle content only

### 2.3 Spacing and Layout

#### Base Unit
```
1 unit = 4px
Common multiples: 4, 8, 12, 16, 24, 32, 48, 64
```

#### Spacing Scale

| Scale | Pixels | Usage |
|---|---|---|
| **xs** | 4px | Tight spacing within components |
| **sm** | 8px | Small gaps between elements |
| **md** | 16px | Standard padding and margins |
| **lg** | 24px | Larger sections and content areas |
| **xl** | 32px | Major section separation |
| **xxl** | 48px | Page-level spacing |

#### Layout Grid

- **12-column responsive grid**
- **Desktop**: 12 columns, max-width 1400px
- **Tablet**: 8 columns, max-width 800px
- **Mobile**: 4 columns, max-width 100% (with padding)

### 2.4 Borders and Shadows

#### Border Radius
```
None (sharp): Buttons, inputs, cards in certain contexts
2px: Subtle curves on small elements
4px: Standard cards, modals, panels
8px: Large components, containers
```

#### Box Shadows
```
Subtle: 0 1px 3px rgba(0,0,0,0.1), 0 1px 2px rgba(0,0,0,0.06)
Light: 0 4px 6px rgba(0,0,0,0.1), 0 2px 4px rgba(0,0,0,0.06)
Medium: 0 10px 15px rgba(0,0,0,0.1), 0 4px 6px rgba(0,0,0,0.05)
Dark: 0 20px 25px rgba(0,0,0,0.1), 0 10px 10px rgba(0,0,0,0.04)
```

---

## 3. Component Specifications

### 3.1 Alert Card Component

```
┌─────────────────────────────────────────────────────────┐
│ [SEVERITY] [RULE NAME] [TIME]                  [⋯ Menu] │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  RULE NAME: SSH Multiple Authentication Failures       │
│  SOURCE: 192.168.1.50  →  HOST: ssh-server             │
│  USER: attacker  |  SEVERITY: 8  |  CONFIDENCE: 95%    │
│                                                         │
│  Description: Multiple failed SSH login attempts from   │
│  single source within short timeframe.                  │
│                                                         │
│  [ACKNOWLEDGE]  [INVESTIGATE]  [ESCALATE]  [CLOSE]    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**Interactive States**:
- **Hover**: Subtle shadow lift, background tint
- **Selected**: Left border highlight (4px, primary color)
- **Acknowledged**: Opacity decrease (70%), status indicator
- **Escalated**: Color shift to warning (orange)
- **Closed**: Strikethrough text, reduced opacity

### 3.2 Timeline Component

```
EVENT TIMELINE
═══════════════════════════════════════════════════════════

            14:00  |●  SSH Login Failed (Source: 192.168.1.50)
                   |   Failed user: admin
                   |
            14:05  |●  SSH Login Failed (Source: 192.168.1.50)
                   |   Failed user: root
                   |
            14:10  |●  SSH Login Failed (Source: 192.168.1.50)
                   |   Failed user: ubuntu
                   |
            14:15  |●● SSH Login Success + Command Execution
                   |   User: admin, Command: whoami
                   |   ALERT TRIGGERED ⚠️
                   |
            14:20  |●  Process Creation: /bin/bash
                   |   Parent: sshd, PID: 1234
                   |
            14:25  |●  File Access: /etc/shadow
                   |   Action: opened, User: admin
                   |

FILTERS: [Show all] [Errors only] [Alerts only] [By timeframe]
ZOOM: [1 min] [5 min] [15 min] [1 hour] [Custom]
```

**Interactive States**:
- **Hover on Event**: Expand to show full details, right panel shows raw event
- **Click on Event**: Detail popup with all fields and raw log
- **Filter Active**: Visual indicator showing filter state
- **Scroll**: Smooth continuous scrolling with sticky time labels

### 3.3 Investigation Panel Component

```
┌──────────────────────────────────────────────────────────┐
│ INVESTIGATION WORKSPACE                                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [TAB: SUMMARY] [TAB: TIMELINE] [TAB: ENTITY] [TAB: IOC] │
│                                                          │
│ ┌─────────────────┬──────────────────────────────────┐  │
│ │  ALERT SUMMARY  │  DETAILS                         │  │
│ ├─────────────────┼──────────────────────────────────┤  │
│ │ Rule: SSH Auth  │ Rule ID: 5002                    │  │
│ │ Failed          │ Level: 8 / 10                    │  │
│ │                 │ Confidence: 95%                  │  │
│ │ Source:         │ ATT&CK: T1110.001               │  │
│ │ 192.168.1.50    │ Group: authentication            │  │
│ │                 │                                  │  │
│ │ Destination:    │ TIMELINE: 14:00 - 14:25         │  │
│ │ ssh-server      │ (25 minutes)                     │  │
│ │ Port: 22/TCP    │                                  │  │
│ │                 │ RELATED EVENTS: 12               │  │
│ │ Timestamp:      │                                  │  │
│ │ 14:15:32        │ [VIEW TIMELINE]                  │  │
│ │                 │ [PIVOT BY IP]                    │  │
│ │ [MORE...]       │ [PIVOT BY USER]                  │  │
│ │                 │ [SEARCH TIMELINE]                │  │
│ └─────────────────┴──────────────────────────────────┘  │
│                                                          │
│ ┌────────────────────────────────────────────────────┐  │
│ │ RAW EVENT VIEWER                                   │  │
│ ├────────────────────────────────────────────────────┤  │
│ │ {                                                  │  │
│ │   "timestamp": "2024-09-27T14:15:32Z",            │  │
│ │   "source_ip": "192.168.1.50",                    │  │
│ │   "rule_id": "5002",                              │  │
│ │   "rule_name": "SSH Failed Password",             │  │
│ │   "full_log": "Failed password for admin from"    │  │
│ │ }                                                  │  │
│ │                                                    │  │
│ │ [COPY] [DOWNLOAD] [SHARE]                         │  │
│ └────────────────────────────────────────────────────┘  │
│                                                          │
│ [ACKNOWLEDGE] [CLOSE] [CREATE CASE] [EXECUTE PLAYBOOK] │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.4 Case Detail Component

```
┌──────────────────────────────────────────────────────────┐
│ CASE #1: SSH Brute Force Attack - 192.168.1.50          │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ STATUS: [OPEN] SEVERITY: [HIGH] OWNER: analyst-01      │
│ CREATED: 2024-09-27 14:20  |  UPDATED: 2024-09-27 15:45│
│                                                          │
│ [TAB: TIMELINE]  [TAB: ENTITIES]  [TAB: EVIDENCE]       │
│ [TAB: IOCs]      [TAB: TASKS]     [TAB: NOTES]          │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ TIMELINE                                             │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │                                                      │ │
│ │ 14:00 - SSH Failed Logins (5 events)                │ │
│ │        [Expand] Source: 192.168.1.50                │ │
│ │                                                      │ │
│ │ 14:15 - SSH Successful Connection                   │ │
│ │        [Expand] User: admin, Password: accepted     │ │
│ │                                                      │ │
│ │ 14:20 - Command Execution: whoami                   │ │
│ │        [Expand] Process: /bin/bash, PID: 1234       │ │
│ │                                                      │ │
│ │ [ADD MANUAL EVENT]  [FILTER]  [EXPORT TIMELINE]     │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ ENTITIES (Assets, Users, IPs, Processes)            │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │                                                      │ │
│ │ ASSETS:                                              │ │
│ │  ├─ ssh-server (Linux) - Compromised               │ │
│ │  └─ 192.168.1.1 (Firewall) - Monitoring            │ │
│ │                                                      │ │
│ │ USERS:                                               │ │
│ │  ├─ attacker (unknown - source)                     │ │
│ │  └─ admin (local account - compromised)             │ │
│ │                                                      │ │
│ │ IPs:                                                 │ │
│ │  ├─ 192.168.1.50 (Attacker source) - Blocked       │ │
│ │  └─ 192.168.1.1 (ssh-server)                        │ │
│ │                                                      │ │
│ │ [PIVOT BY ENTITY] [SEARCH SIMILAR] [EXPORT]         │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ EVIDENCE (3 files)                                   │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │                                                      │ │
│ │ ✓ auth_logs_export.txt                             │ │
│ │   Acquired: 2024-09-27 14:22                        │ │
│ │   Hash: SHA256:abc123...                            │ │
│ │   Size: 245 KB                                      │ │
│ │   [VIEW] [DOWNLOAD] [DELETE]                        │ │
│ │                                                      │ │
│ │ ✓ ssh_server_syslog.gz                             │ │
│ │   Acquired: 2024-09-27 14:25                        │ │
│ │   Hash: SHA256:def456...                            │ │
│ │   Size: 1.2 MB                                      │ │
│ │   [VIEW] [DOWNLOAD] [DELETE]                        │ │
│ │                                                      │ │
│ │ [ADD EVIDENCE] [GENERATE REPORT]                    │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ ROOT CAUSE: [Not set]  [EDIT]                          │
│ LESSONS LEARNED: [Not set]  [EDIT]                     │
│                                                          │
│ [CLOSE CASE]  [UPDATE STATUS]  [EXPORT REPORT]         │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.5 Rule Test Component

```
┌──────────────────────────────────────────────────────────┐
│ DETECTION RULE: SSH Multiple Authentication Failures     │
│ ID: 5002  |  VERSION: 1.2.3  |  STATUS: PRODUCTION      │
├──────────────────────────────────────────────────────────┤
│                                                          │
│ [TAB: DETAILS] [TAB: TEST CASES] [TAB: PERFORMANCE]     │
│                                                          │
│ ┌──────────────────────────────────────────────────────┐ │
│ │ TEST CASES                                           │ │
│ ├──────────────────────────────────────────────────────┤ │
│ │                                                      │ │
│ │ ✓ test_positive_brute_force                         │ │
│ │   Status: PASS                                       │ │
│ │   Events: 5 failed attempts in 300s                 │ │
│ │   Expected Alert: YES  |  Actual: YES ✓            │ │
│ │   [VIEW EVENTS] [EDIT] [DELETE]                    │ │
│ │                                                      │ │
│ │ ✓ test_negative_single_failure                      │ │
│ │   Status: PASS                                       │ │
│ │   Events: 1 failed attempt                          │ │
│ │   Expected Alert: NO  |  Actual: NO ✓              │ │
│ │   [VIEW EVENTS] [EDIT] [DELETE]                    │ │
│ │                                                      │ │
│ │ ✗ test_false_positive_valid_lockout                │ │
│ │   Status: FAIL                                       │ │
│ │   Events: User lockout after failed attempts        │ │
│ │   Expected Alert: NO  |  Actual: YES ✗             │ │
│ │   [VIEW EVENTS] [INVESTIGATE] [EDIT]               │ │
│ │                                                      │ │
│ │ [ADD NEW TEST] [RUN ALL TESTS] [CLEAR RESULTS]     │ │
│ │                                                      │ │
│ └──────────────────────────────────────────────────────┘ │
│                                                          │
│ TEST SUMMARY:                                           │
│ Passed: 2/3  (67%)                                      │ │
│ Failed: 1/3  (33%)                                      │ │
│                                                          │ │
│ [FIX RULE] or [ACCEPT FAILURE AND DEPLOY]              │ │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

---

## 4. Page Layouts

### 4.1 L1 Analyst Dashboard Layout

```
┌──────────────────────────────────────────────────────────────┐
│ SOC Detection Lab  [Search] [? Help] [⚙] [👤]               │
├──────────────────────────────────────────────────────────────┤
│ Dashboard > L1 Analyst                                       │
│                                                              │
│ ┌────────────────┬────────────────┬────────────────────────┐ │
│ │ ALERTS NEEDING │ SLA AT RISK    │ HIGH-CONFIDENCE       │ │
│ │ ATTENTION      │ (5 alerts)     │ DETECTIONS (Today)    │ │
│ │                │                │                        │ │
│ │ 23 Unassigned  │ • Alert #234   │ • T1110.001 (SSH)    │ │
│ │ 8 Acknowledged │ • Alert #567   │ • T1190.002 (SQL)    │ │
│ │ 15 Under       │ • Alert #891   │                        │ │
│ │    Investigation│               │                        │ │
│ └────────────────┴────────────────┴────────────────────────┘ │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ PRIORITY ALERT QUEUE                                     │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │                                                          │ │
│ │ [FILTER: All] [STATUS: All] [SORT: Priority]           │ │
│ │                                                          │ │
│ │ 1. [●●●●●●●●●] SSH Brute Force (192.168.1.50)        │ │
│ │    Severity: 8 | Confidence: 95% | New | 5 min ago    │ │
│ │    [ACKNOWLEDGE] [INVESTIGATE] [CLOSE]                │ │
│ │                                                          │ │
│ │ 2. [●●●●●●] SQL Injection Attempt (10.0.0.5)          │ │
│ │    Severity: 6 | Confidence: 87% | Ack'd | 12 min ago │ │
│ │    [INVESTIGATE] [ESCALATE] [CLOSE]                   │ │
│ │                                                          │ │
│ │ 3. [●●●●] Failed API Authentication (192.168.1.100)    │ │
│ │    Severity: 4 | Confidence: 72% | Ack'd | 25 min ago │ │
│ │    [INVESTIGATE] [ESCALATE] [CLOSE]                   │ │
│ │                                                          │ │
│ │ [Load More] (12 more alerts)                            │ │
│ │                                                          │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ Page size: [10 items] | Showing 1-10 of 23                 │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

### 4.2 L2 Analyst Investigation Layout

```
┌──────────────────────────────────────────────────────────────┐
│ SOC Detection Lab  [Search] [? Help] [⚙] [👤]               │
├──────────────────────────────────────────────────────────────┤
│ Cases > Case #1: SSH Brute Force Attack                      │
│                                                              │
│ STATUS: [OPEN] SEVERITY: [HIGH] OWNER: [analyst-01] [EDIT]  │
│                                                              │
│ ┌─────────────────────────┬───────────────────────────────┐  │
│ │                         │                               │  │
│ │ [TAB: TIMELINE]         │  [TAB: ENTITIES]             │  │
│ │ [TAB: EVIDENCE]         │  [TAB: IOCs]                 │  │
│ │ [TAB: TASKS]            │  [TAB: NOTES]                │  │
│ │                         │                               │  │
│ │ Timeline Display        │  Entity Context Panel         │  │
│ │ (Full height, 60%)      │  (Right sidebar, 40%)        │  │
│ │                         │                               │  │
│ │ 14:00 - SSH Failed Logins                               │  │
│ │        ↓                │                               │  │
│ │ 14:15 - SSH Success     │  ASSETS:                      │  │
│ │        ↓                │  • ssh-server                 │  │
│ │ 14:20 - Cmd Execution   │                               │  │
│ │        ↓                │  USERS:                       │  │
│ │ 14:25 - File Access     │  • attacker                   │  │
│ │        ↓                │  • admin                      │  │
│ │ [More events...]        │                               │  │
│ │                         │  IPs:                         │  │
│ │                         │  • 192.168.1.50 (source)     │  │
│ │                         │  • 192.168.1.1 (dest)        │  │
│ │                         │                               │  │
│ │                         │  [PIVOT] [SEARCH] [EXPORT]    │  │
│ │                         │                               │  │
│ └─────────────────────────┴───────────────────────────────┘  │
│                                                              │
│ ┌──────────────────────────────────────────────────────────┐ │
│ │ RAW EVENT VIEWER (Expandable)                            │ │
│ ├──────────────────────────────────────────────────────────┤ │
│ │ {JSON view of selected event}                           │ │
│ └──────────────────────────────────────────────────────────┘ │
│                                                              │
│ [CLOSE CASE] [UPDATE STATUS] [EXECUTE PLAYBOOK] [EXPORT]   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

## 5. Dark Mode Specification (Future)

### 5.1 Dark Mode Colors

| Element | Light Mode | Dark Mode |
|---|---|---|
| **Primary BG** | #FFFFFF | #1A1A2E |
| **Secondary BG** | #F8F9FA | #16213E |
| **Tertiary BG** | #E9ECEF | #0F3460 |
| **Primary Text** | #212529 | #FFFFFF |
| **Secondary Text** | #6C757D | #B0B0B0 |
| **Accent** | #007BFF | #00D4FF |

### 5.2 Considerations

- Preserve color semantics (red still means danger)
- Ensure WCAG AA contrast in dark mode
- Test with accessibility tools

---

## 6. Responsive Design Breakpoints

| Breakpoint | Width | Device | Adjustments |
|---|---|---|---|
| **Mobile** | 320-480px | Phone | Single column, stacked cards, mobile menu |
| **Small Tablet** | 481-768px | Tablet (portrait) | Two-column where possible, drawer navigation |
| **Large Tablet** | 769-1024px | Tablet (landscape) | Three-column grid, sidebar navigation |
| **Desktop** | 1025-1400px | Desktop | Full layout, persistent sidebars |
| **Large Desktop** | 1401px+ | Ultra-wide | Sidebar + main + detail pane |

### 6.1 Mobile Considerations

- **Alert Queue**: Simplified (title, severity, time, assignee)
- **Investigation**: Tabbed interface, full-height timeline
- **Timeline**: Horizontal scrolling, large tap targets (44px minimum)
- **Buttons**: 48px height for touch, ample spacing
- **Modals**: Full-screen on mobile, preserve context via breadcrumbs

---

## 7. Interaction Patterns

### 7.1 Status Indicators

```
Connected       ●  Green (solid)
Disconnected    ○  Gray (hollow)
Pending         ⟳  Blue (rotating)
Error           ✕  Red (X)
Warning         ⚠  Orange (triangle)
Success         ✓  Green (checkmark)
```

### 7.2 Button Hierarchy

```
PRIMARY BUTTON (CTAs)
[BUTTON TEXT]  ← Solid color, most prominent

Secondary Button
[BUTTON TEXT]  ← Outlined, less prominent

Tertiary Button
[BUTTON TEXT]  ← Ghost/text only, least prominent

Danger Button
[BUTTON TEXT]  ← Solid red, destructive action
```

### 7.3 Loading States

```
Loading: [Spinner ⟳] Loading...
Success: [✓] Operation completed
Error: [✕] Operation failed: {error message}
```

### 7.4 Empty States

```
┌────────────────────────────────┐
│                                │
│  ◯  No alerts found            │
│                                │
│  Try adjusting your filters or │
│  check back later.             │
│                                │
│  [CLEAR FILTERS]  [HELP]       │
│                                │
└────────────────────────────────┘
```

---

## 8. Accessibility Specifications

### 8.1 WCAG 2.1 Level AA Compliance

- **Contrast Ratio**: Minimum 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: All interactive elements reachable via Tab/Shift+Tab
- **Focus Indicators**: Visible focus outline on all interactive elements
- **Screen Reader**: Semantic HTML, ARIA labels where needed
- **Color Alone**: Never use color alone to convey information
- **Animation**: No auto-playing animations; pause button for auto-play
- **Text Sizing**: Supports up to 200% zoom without horizontal scrolling

### 8.2 Keyboard Shortcuts (Essential)

| Shortcut | Action |
|---|---|
| **Tab** | Move focus to next element |
| **Shift+Tab** | Move focus to previous element |
| **Enter** | Activate button or submit form |
| **Space** | Activate button or toggle checkbox |
| **Escape** | Close modal or dropdown |
| **Cmd/Ctrl+F** | Global search |
| **Cmd/Ctrl+K** | Command palette (if implemented) |
| **?** | Keyboard shortcuts help |

### 8.3 ARIA Labels

```html
<!-- Alert Card -->
<div role="article" aria-label="SSH Brute Force alert">
  <h2>SSH Multiple Authentication Failures</h2>
  <span aria-label="severity 8 out of 10">Severity: 8</span>
  <button aria-label="Acknowledge this alert">Acknowledge</button>
</div>

<!-- Timeline Event -->
<div role="listitem" aria-label="SSH Login Failed at 14:15">
  <time datetime="2024-09-27T14:15:32Z">14:15</time>
  <span>SSH Login Failed</span>
</div>
```

---

## 9. Animation and Microinteractions

### 9.1 Animation Principles

- **Purpose**: Every animation must serve a functional purpose
- **Duration**: 200-400ms for most interactions
- **Easing**: Use ease-out for entering, ease-in for exiting
- **Subtlety**: Don't distract from content

### 9.2 Common Animations

| Interaction | Animation | Duration |
|---|---|---|
| **Button Hover** | Slight shadow lift, background tint | 200ms |
| **Alert Arrival** | Slide in from top | 300ms |
| **Modal Open** | Fade + slight scale | 300ms |
| **Collapse/Expand** | Smooth height transition | 300ms |
| **Loading Spinner** | Continuous rotation | 2s per rotation |
| **Success Checkmark** | Draw animation | 400ms |

### 9.3 Motion Reduction

Respect `prefers-reduced-motion`:

```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation: none !important;
    transition: none !important;
  }
}
```

---

## 10. Notifications & Toasts

### 10.1 Toast Notification Design

```
┌─────────────────────────────────────────────────────┐
│ ✓ Case #1 closed successfully                  [×] │
└─────────────────────────────────────────────────────┘

Position: Top-right corner
Duration: 5 seconds auto-dismiss (or persistent for errors)
Stack: New toasts appear above old ones
Actions: Close button (×) or click to dismiss
```

### 10.2 Notification Types

- **Success (Green)**: Action completed
- **Warning (Orange)**: Caution or needs attention
- **Error (Red)**: Operation failed
- **Info (Blue)**: Informational message
- **Persistent**: Errors stay until dismissed

---

## 11. Data Tables and Lists

### 11.1 Alert Queue Table

```
┌────┬──────────────┬────────────┬──────────┬──────────┬──────────┐
│    │ RULE         │ SOURCE     │ SEVERITY │ TIME     │ ACTIONS  │
├────┼──────────────┼────────────┼──────────┼──────────┼──────────┤
│ ☐  │ SSH Brute    │ 192.168... │ ●●●●●●● │ 5 min    │ […]     │
│ ☐  │ SQL Inject   │ 10.0.0.5   │ ●●●●●● │ 12 min   │ […]     │
│ ☑  │ API Auth Fail│ 192.168... │ ●●●● │ 25 min   │ […]     │
└────┴──────────────┴────────────┴──────────┴──────────┴──────────┘

Features:
- Sortable columns (click header to sort)
- Selectable rows (checkbox for multi-select actions)
- Hover reveals action buttons
- Fixed header, scrollable body
- Responsive: stack into cards on mobile
```

### 11.2 Pagination

```
Showing 1-10 of 234 results

[< Prev] [1] [2] [3] [...] [20] [21] [Next >]

Or: [Results per page: ▼10] | Page 2 of 23
```

---

## 12. Form Design

### 12.1 Form Layout

```
Form Title
Optional subtitle or instructions

[Label]
[Input field]
Helper text or validation message

[Label]
[Textarea]
250 characters remaining

[Label]
[Dropdown ▼]

☐ Checkbox Label
☐ Another option

◉ Radio option 1
○ Radio option 2

[CANCEL]  [SUBMIT]
```

### 12.2 Validation

- **Real-time**: Validate on blur or keystroke (non-destructive)
- **Visual Feedback**: Red border for error, green for success
- **Error Message**: Clear, specific, actionable
- **Success State**: Visual confirmation upon validation

---

## 13. Search and Filter UI

### 13.1 Search Bar

```
[🔍 Search alerts, cases, IOCs...]

Recent searches:
• SSH brute force
• 192.168.1.50
• admin user

Suggestions:
• status:open (Filter by status)
• severity:>5 (Advanced filters)
• [Saved Searches ▼]
```

### 13.2 Advanced Filters

```
FILTERS

[Status ▼]
☑ New
☑ Acknowledged
☑ Under Investigation
☐ Closed

[Severity ▼]
[Range slider: 0 ─────●───── 10]

[Date Range ▼]
[From] 2024-09-20  [To] 2024-09-27

[Rule ▼]
[Search for rule...]

[APPLY FILTERS] [CLEAR ALL]
```

---

## 14. Branding & Logo

### 14.1 Logo Specifications

- **Logo Format**: SVG (scalable)
- **Minimum Size**: 24px width
- **Variants**:
  - Full logo + text (horizontal)
  - Icon only (for compact spaces)
  - Monochrome (for prints)
  - Dark mode variant

### 14.2 Usage

- **Header**: Full logo in top-left corner
- **Favicon**: Icon variant, 32x32px
- **Loading Screen**: Centered logo with subtle animation

---

## 15. Error Pages

### 15.1 404 Not Found

```
┌──────────────────────────────────┐
│                                  │
│  404                             │
│  Page Not Found                  │
│                                  │
│  The page you're looking for     │
│  doesn't exist or has been moved.│
│                                  │
│  [← Go Back]  [Home]             │
│                                  │
└──────────────────────────────────┘
```

### 15.2 Error States

```
┌──────────────────────────────────┐
│                                  │
│  ✕ Error Loading Data            │
│                                  │
│  Unable to load the alert queue. │
│  Please check your connection    │
│  and try again.                  │
│                                  │
│  [← Go Back]  [Retry]            │
│                                  │
│  Error Code: E-5001              │
│                                  │
└──────────────────────────────────┘
```

---

## 16. Print Stylesheet

### 16.1 Printable Reports

- Hide navigation and controls
- Use dark text on white background
- Break long tables across pages
- Include page numbers and date printed
- Preserve color coding if color printer

---

## 17. Design Tokens (CSS Variables)

```css
:root {
  /* Colors */
  --color-primary: #007BFF;
  --color-danger: #DC3545;
  --color-success: #28A745;
  --color-warning: #FFC107;
  
  /* Typography */
  --font-primary: 'Inter', sans-serif;
  --font-mono: 'Monaco', monospace;
  --font-size-base: 14px;
  
  /* Spacing */
  --space-xs: 4px;
  --space-sm: 8px;
  --space-md: 16px;
  
  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(0,0,0,0.1);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.1);
  
  /* Z-index */
  --z-dropdown: 100;
  --z-modal: 1000;
  --z-tooltip: 1100;
}
```

---

**Document Version**: 1.0  
**Status**: Target Architecture / Build Specification  
**Last Updated**: 2026-09-27
