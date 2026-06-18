import { getGoals as dbGetGoals, saveGoals as dbSaveGoals } from './db.js';

const Q1_KEYWORDS = [
  // English
  'asap', 'deadline', 'urgent', 'hurry', 'critical', 'emergency', 'immediately', 'now', 'right now', 'right away',
  'today', 'tomorrow', 'by friday', 'by monday', 'due', 'overdue', 'late', 'crisis', 'crash',
  // Vietnamese
  'gấp', 'khẩn', 'hôm nay', 'ngày mai', 'trước deadline', 'càng sớm càng tốt', 'chuẩn bị gấp',
  'ngay', 'lập tức', 'tức thì', 'quan trọng', 'bắt buộc', 'bắt đầu ngay',
  'chạy deadline', 'sắp hết hạn', 'trễ', 'quá hạn', 'cứu nguy', 'xử lý ngay'
];

const Q2_KEYWORDS = [
  // English
  'report', 'meeting', 'presentation', 'schedule', 'plan', 'annual', 'review', 'submit',
  'project', 'goal', 'objective', 'strategy', 'vision', 'dream', 'learn', 'study', 'practice',
  'exercise', 'train', 'develop', 'improve', 'growth', 'habit', 'routine', 'seminar', 'conference',
  'workshop', 'course', 'training', 'certification', 'read', 'book', 'write', 'create', 'build',
  // Vietnamese
  'báo cáo', 'họp', 'thuyết trình', 'lên lịch', 'kế hoạch', 'lịch', 'tuần này', 'tuần sau',
  'dự án', 'học', 'ôn', 'thi', 'kiểm tra', 'seminar', 'conference', 'mục tiêu', 'chiến lược',
  'tầm nhìn', 'ước mơ', 'rèn luyện', 'phát triển', 'cải thiện', 'tăng trưởng', 'thói quen',
  'tập luyện', 'khóa học', 'chứng chỉ', 'đọc sách', 'viết', 'sáng tạo', 'xây dựng',
  'ôn tập', 'chuẩn bị', 'kế hoạch', 'tổ chức', 'sắp xếp', 'nghiên cứu', 'phân tích',
  'thiết kế', 'lập trình', 'code', 'học hỏi', 'nâng cấp', 'cập nhật', 'đào tạo'
];

const Q3_KEYWORDS = [
  // English
  'reply', 'email', 'call back', 'respond', 'check', 'message', 'phone call', 'text',
  'interrupt', 'distraction', 'someone else', 'delegate', 'ask someone', 'forward',
  'cc', 'bcc', 'newsletter', 'news', 'social media', 'notification',
  // Vietnamese
  'trả lời', 'gọi lại', 'mail', 'phone', 'gọi', 'tin nhắn', 'zalo', 'messenger', 'message',
  'làm phiền', 'gián đoạn', 'người khác', 'ủy thác', 'nhờ người', 'chuyển tiếp',
  'thư rác', 'quảng cáo', 'notification', 'thông báo', 'mạng xã hội', 'bình luận',
  'like', 'share', 'retweet', 'inbox', 'hộp thư', 'tin chưa đọc'
];

const Q4_KEYWORDS = [
  // English
  'browse', 'scroll', 'social', 'news', 'watch', 'youtube', 'tiktok', 'facebook', 'instagram',
  'game', 'gaming', 'netflix', 'series', 'movie', 'entertainment', 'fun', 'relax', 'sleep',
  'chat', 'gossip', 'rumor', 'trending', 'viral', 'meme', 'funny',
  // Vietnamese
  'lướt', 'lướt facebook', 'lướt mạng', 'tin tức', 'xem video', 'xem phim', 'xem youtube',
  'chơi game', 'game', 'netflix', 'phim', 'series', 'giải trí', 'thư giãn', 'ngủ',
  'tán gẫu', 'gossip', 'thị phi', 'trend', 'viral', 'meme', 'hài hước', 'mạng xã hội',
  'tiktok', 'youtube', 'facebook', 'instagram', 'twitter', 'reddit', 'tin đồn'
];

// Match task against user goals
async function matchGoals(text) {
  const goals = await dbGetGoals();
  if (goals.length === 0) return null;

  const lower = text.toLowerCase();
  for (const goal of goals) {
    const goalText = typeof goal === 'string' ? goal : goal.text;
    const goalLower = goalText.toLowerCase();
    const goalWords = goalLower.split(/\s+/);
    const matchCount = goalWords.filter(word => word.length > 2 && lower.includes(word)).length;
    if (matchCount >= Math.ceil(goalWords.length * 0.5)) {
      return goalText;
    }
  }
  return null;
}

function classifyTask(text) {
  const lower = text.toLowerCase().trim();

  // Q1: urgent + important
  const q1Score = Q1_KEYWORDS.filter(k => lower.includes(k.toLowerCase())).length;
  if (q1Score > 0) return 1;

  // Q2: important
  const q2Score = Q2_KEYWORDS.filter(k => lower.includes(k.toLowerCase())).length;
  if (q2Score > 0) return 2;

  // Q3: urgent but delegatable
  const q3Score = Q3_KEYWORDS.filter(k => lower.includes(k.toLowerCase())).length;
  if (q3Score > 0) return 3;

  // Q4: not urgent, not important
  const q4Score = Q4_KEYWORDS.filter(k => lower.includes(k.toLowerCase())).length;
  if (q4Score > 0) return 4;

  return 0;
}

// AI Classification using MiniMax API (OpenAI-compatible)
async function classifyWithAI(text, apiKey) {
  if (!apiKey) return null;

  try {
    // MiniMax uses OpenAI-compatible API
    const response = await fetch('https://api.minimax.chat/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'MiniMax-Text-01',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: `Classify this task into one of 4 Eisenhower Matrix quadrants:\nQ1 = Urgent + Important (do immediately)\nQ2 = Not Urgent + Important (schedule it)\nQ3 = Urgent + Not Important (delegate it)\nQ4 = Not Urgent + Not Important (eliminate it)\n\nTask: "${text}"\n\nRespond with just the quadrant number: 1, 2, 3, or 4`
        }]
      })
    });

    if (!response.ok) {
      console.error('MiniMax API error:', response.status);
      return null;
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    const q = parseInt(content);
    if ([1, 2, 3, 4].includes(q)) return q;
    return null;
  } catch (e) {
    console.error('AI classification failed:', e);
    return null;
  }
}

export { classifyTask, classifyWithAI };
