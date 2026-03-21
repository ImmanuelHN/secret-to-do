/**
 * AI Task Parser — Enhanced
 * 
 * - Parses natural speech into structured task data
 * - Looks up similar past tasks to reuse their day-of-week patterns
 * - Returns a "needs_confirmation" flag when date/time is uncertain
 */
import { db } from '../db/database';

function buildSystemPrompt(similarTaskContext) {
  const now   = new Date();
  const today = now.toISOString().split('T')[0];
  const todayName = now.toLocaleDateString('en-US', { weekday: 'long' });

  // Build date reference table for next 14 days
  const dateRef = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + i);
    dateRef.push(`${d.toLocaleDateString('en-US',{weekday:'long'})} = ${d.toISOString().split('T')[0]}`);
  }

  return `You are a task parser for a to-do app. Extract structured data from natural speech.
Return ONLY valid JSON. No markdown. No explanation.

{
  "title": "short actionable task title (max 6 words)",
  "due_date": "YYYY-MM-DD or null",
  "reminder_time": "HH:MM 24h format or null",
  "priority": "low|medium|high",
  "energy_level": "low|medium|high",
  "description": "any extra details or empty string",
  "recur": "daily|weekly|monthly|null",
  "confidence": "high|medium|low",
  "needs_confirmation": true|false
}

DATE PARSING RULES:
- Today is ${todayName}, ${today}
- "today" → ${today}
- "tomorrow" → ${dateRef[1]}
- "next week" → ${dateRef[7]}
- "next month" → use first of next month
- Day names: ${dateRef.slice(0,7).join(', ')}
- Numbers: "on the 25th" → find next occurrence of 25th
- If date is completely absent or very vague → null, set needs_confirmation: true

TIME PARSING RULES:
- "3pm" → "15:00", "3:30pm" → "15:30", "9am" → "09:00"
- "morning" → "08:00", "afternoon" → "14:00", "evening" → "19:00", "night" → "21:00"
- If time is absent → null, set needs_confirmation: true

${similarTaskContext ? `SIMILAR TASK HISTORY (use this to infer missing date/time):
${similarTaskContext}
If the user's task is similar to a past task and date/time is missing, reuse the pattern from history.` : ''}

PRIORITY RULES:
- "urgent/important/must/asap/critical" → high
- "sometime/maybe/whenever" → low  
- default → medium

RECUR RULES:
- "every day/daily" → "daily"
- "every week/weekly" → "weekly"  
- "every month/monthly" → "monthly"
- default → null

Set needs_confirmation: true when:
- Date or time is ambiguous or missing
- You had to infer from history
- The task meaning is unclear`;
}

async function findSimilarTaskHistory(transcript) {
  try {
    const allTasks = await db.tasks.toArray();
    if (!allTasks.length) return null;

    const words = transcript.toLowerCase().split(/\s+/).filter(w => w.length > 3);
    const similar = allTasks
      .filter(t => t.due_date && (t.reminder_time || t.due_date))
      .filter(t => {
        const titleLower = t.title.toLowerCase();
        return words.some(w => titleLower.includes(w));
      })
      .slice(-5); // last 5 similar tasks

    if (!similar.length) return null;

    return similar.map(t => {
      const d = t.due_date ? new Date(t.due_date + 'T00:00:00') : null;
      const dayName = d ? d.toLocaleDateString('en-US', { weekday: 'long' }) : null;
      return `"${t.title}" → day: ${dayName || 'unknown'}, date: ${t.due_date || 'none'}, time: ${t.reminder_time || 'none'}`;
    }).join('\n');
  } catch {
    return null;
  }
}

export async function parseVoiceToTask(transcript) {
  const similarCtx = await findSimilarTaskHistory(transcript);

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 400,
        system: buildSystemPrompt(similarCtx),
        messages: [{ role: 'user', content: transcript }],
      }),
    });

    if (!response.ok) throw new Error('API error');
    const data  = await response.json();
    const text  = data.content?.[0]?.text || '{}';
    const clean = text.replace(/```json?|```/g, '').trim();
    const parsed = JSON.parse(clean);

    return {
      title:             parsed.title             || transcript.slice(0, 60),
      due_date:          parsed.due_date          || '',
      reminder_time:     parsed.reminder_time     || '',
      priority:          ['low','medium','high'].includes(parsed.priority)     ? parsed.priority     : 'medium',
      energy_level:      ['low','medium','high'].includes(parsed.energy_level) ? parsed.energy_level : 'medium',
      description:       parsed.description       || '',
      recur:             ['daily','weekly','monthly'].includes(parsed.recur)   ? parsed.recur        : null,
      needs_confirmation: !!parsed.needs_confirmation,
      confidence:        parsed.confidence        || 'medium',
    };
  } catch (err) {
    console.warn('[AI Parser] Fallback:', err);
    return {
      title:             transcript.slice(0, 80),
      due_date:          '',
      reminder_time:     '',
      priority:          'medium',
      energy_level:      'medium',
      description:       '',
      recur:             null,
      needs_confirmation: true,
      confidence:        'low',
    };
  }
}
