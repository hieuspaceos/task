---
phase: 3
title: "Implement-Classifier"
status: pending
effort: "2h"
---

# Phase 3: Implement-Classifier

## Overview

Rule-based classifier using keyword matching and date parsing to auto-assign quadrants.

## Requirements

- Auto-classify on task submit
- Handle both VN and EN keywords
- Parse due dates (today, tomorrow, by Friday, etc.)
- Default to Q2 for personal tasks with no keywords

## Classification Logic

```
1. Extract due date from text
   - "today", "tomorrow", "hôm nay", "ngày mai" → due soon
   - "by Friday", "trước thứ 6", "due Friday" → parse day

2. Score keywords:
   - Q1 keywords: +urgent, +important
   - Q2 keywords: +important, -urgent
   - Q3 keywords: +urgent, -important
   - Q4 keywords: -urgent, -important

3. Apply rules:
   - Q1: (urgent AND important) OR due_soon
   - Q2: important AND NOT urgent
   - Q3: urgent AND NOT important
   - Q4: NOT urgent AND NOT important

4. Default: Q2 (personal tasks default to scheduled)
```

## Keywords

```javascript
const Q1_KEYWORDS = ['asap', 'deadline', 'urgent', 'hurry', 'gấp', 'khẩn', 'hôm nay', 'ngay mai', 'today', 'tomorrow'];
const Q2_KEYWORDS = ['report', 'meeting', 'presentation', 'schedule', 'plan', 'annual', 'review', 'submit', 'báo cáo', 'họp', 'thuyết trình', 'lên lịch', 'kế hoạch'];
const Q3_KEYWORDS = ['reply', 'email', 'call back', 'respond', 'check', 'trả lời', 'gọi lại'];
const Q4_KEYWORDS = ['browse', 'scroll', 'social', 'news', 'watch', 'phone', 'lướt', 'social', 'tin tức', 'xem video'];
```

## Implementation Steps

1. **Create classifier.js**
   - `classifyTask(text)` → returns quadrant (1-4)
   - `extractDate(text)` → returns date or null
   - `scoreKeywords(text)` → returns scores per quadrant

2. **Integrate with main.js**
   - Call classifier on task submit
   - Attach quadrant to task object

## Success Criteria

- [ ] "Submit report by Friday" → Q1
- [ ] "Call mom" → Q2
- [ ] "Reply to emails" → Q3
- [ ] "Browse news" → Q4
- [ ] "báo cáo gấp" → Q1
- [ ] Mixed VN/EN works correctly