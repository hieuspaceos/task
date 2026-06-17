---
title: "Eisenhower Task Manager"
description: "Simple daily task manager with bilingual rule-based auto-classification into Eisenhower matrix"
status: pending
priority: P2
branch: ""
tags: ["tauri", "eisenhower", "task-manager", "vn-en"]
blockedBy: []
blocks: []
created: "2026-06-15T04:57:16.927Z"
createdBy: "ck:plan"
source: skill
---

# Eisenhower Task Manager

## Overview

Single-page daily task manager. User types task in one input → app auto-classifies into Eisenhower quadrant (Q1-Q4) using rule-based keyword + date parsing. User corrects misclassifications via drag-and-drop. Daily reset = fresh start.

## Phases

| Phase | Name | Status |
|-------|------|--------|
| 0 | [Env-Check](./phase-00-env-check.md) | Pending |
| 1 | [Setup](./phase-01-setup.md) | Pending |
| 2 | [Implement-UI](./phase-02-implement-ui.md) | Pending |
| 3 | [Implement-Classifier](./phase-03-implement-classifier.md) | Pending |
| 4 | [Test](./phase-04-test.md) | Pending |

## Tech Stack

- **App shell**: Tauri 2.x
- **Frontend**: Vanilla HTML/CSS/JS (no framework)
- **Storage**: LocalStorage (daily tasks, no persistence across days)
- **AI**: Rule-based classification only (no API key)

## Bilingual Keywords (VN + EN)

| Quadrant | EN Keywords | VN Keywords |
|----------|-------------|--------------|
| Q1: Do First | asap, deadline, urgent, hurry, today, by Friday | gấp, khẩn, hôm nay, trước deadline |
| Q2: Schedule | report, meeting, presentation, schedule, plan, annual, review, submit | báo cáo, họp, thuyết trình, lên lịch, kế hoạch |
| Q3: Delegate | reply, email, call back, respond, check | trả lời, reply, email, gọi lại |
| Q4: Eliminate | browse, scroll, social, news, watch, phone | lướt, social, tin tức, xem video |

## Dependencies

None - standalone app.