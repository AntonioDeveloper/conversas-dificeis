export type Persona = 'busy_boss' | 'emotional_partner' | 'defensive_colleague';

export type AiResult = {
  interpretation: string;
  reply: string;
};

export type GenerateInput = {
  text: string;
  persona: Persona;
  situation?: string;
};

function personaInstruction(persona: Persona): string {
  if (persona === 'busy_boss') {
    return 'Você é um chefe ocupado: direto, pragmático, com pouco tempo, mas não agressivo.';
  }
  if (persona === 'emotional_partner') {
    return 'Você é um parceiro emocional: vulnerável, busca conexão, reage a tom e intenção.';
  }
  return 'Você é um colega defensivo: se sente acusado facilmente, tenta se justificar, pode retrucar.';
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start >= 0 && end > start) {
      const slice = text.slice(start, end + 1);
      return JSON.parse(slice);
    }
    throw new Error('Resposta não contém JSON válido.');
  }
}

function coerceResult(parsed: unknown): AiResult {
  if (typeof parsed !== 'object' || parsed === null) {
    throw new Error('JSON inválido (objeto).');
  }
  const interpretation = (parsed as { interpretation?: unknown })
    .interpretation;
  const reply = (parsed as { reply?: unknown }).reply;
  if (
    typeof interpretation !== 'string' ||
    interpretation.trim().length === 0
  ) {
    throw new Error('JSON inválido (interpretation).');
  }
  if (typeof reply !== 'string' || reply.trim().length === 0) {
    throw new Error('JSON inválido (reply).');
  }
  return { interpretation: interpretation.trim(), reply: reply.trim() };
}

export async function generateAiResult(
  input: GenerateInput,
): Promise<AiResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      interpretation: 'Mock: sem GROQ_API_KEY configurada.',
      reply: 'Em que posso ajudar?',
    };
  }

  const model = process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b';
  const system = [
    'Você é um simulador de comportamento humano para treinar conversas difíceis.',
    personaInstruction(input.persona),
    'Responda estritamente em JSON no formato: {"interpretation":"...","reply":"..."}',
    'interpretation: descreva o que você entendeu e o estado emocional/intenção percebidos.',
    'reply: responda como a persona, em português, de forma realista e concisa.',
  ].join('\n');

  const user = JSON.stringify({
    situation: input.situation ?? '',
    message: input.text,
  });

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.7,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Groq falhou (${res.status}). ${text}`);
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };

  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Groq retornou resposta vazia.');

  return coerceResult(safeJsonParse(content));
}
