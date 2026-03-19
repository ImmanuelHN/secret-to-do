/**
 * AI Task Parser
 * Sends voice transcript to Claude API and extracts structured task data.
 */

const SYSTEM_PROMPT = `You are a task parser. The user speaks naturally and you extract task information.
Return ONLY valid JSON with these exact fields (no markdown, no explanation):
{
  "title": "short task title",
  "due_date": "YYYY-MM-DD or null",
  "reminder_time": "HH:MM (24h) or null",
  "priority": "low|medium|high",
  "energy_level": "low|medium|high",
  "description": "extra notes or empty string"
}

Rules:
- "today" = today's date, "tomorrow" = tomorrow's date
- Extract time like "3pm" → "15:00", "9am" → "09:00"
- Guess priority: "urgent/important/must" → high, default → medium
- Keep title short and actionable (max 6 words)
- Today is: ${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
- Today's ISO date: ${new Date().toISOString().split('T')[0]}
`;

function getTomorrowDate() {
  const d = new Date(); d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

export async function parseVoiceToTask(transcript) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 256,
        system: SYSTEM_PROMPT,
        messages: [{ role: 'user', content: transcript }],
      }),
    });

    if (!response.ok) throw new Error('API error');
    const data = await response.json();
    const text = data.content?.[0]?.text || '{}';

    // Clean any accidental markdown fences
    const clean = text.replace(/```json?|```/g, '').trim();
    const parsed = JSON.parse(clean);

    // Normalize
    return {
      title:         parsed.title        || transcript.slice(0, 60),
      due_date:      parsed.due_date     || '',
      reminder_time: parsed.reminder_time|| '',
      priority:      ['low','medium','high'].includes(parsed.priority) ? parsed.priority : 'medium',
      energy_level:  ['low','medium','high'].includes(parsed.energy_level) ? parsed.energy_level : 'medium',
      description:   parsed.description  || '',
    };
  } catch (err) {
    console.warn('[AI Parser] Falling back to raw transcript:', err);
    // Fallback: just use transcript as title
    return {
      title:         transcript.slice(0, 80),
      due_date:      '',
      reminder_time: '',
      priority:      'medium',
      energy_level:  'medium',
      description:   '',
    };
  }
}
