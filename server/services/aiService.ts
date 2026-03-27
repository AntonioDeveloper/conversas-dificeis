export type Persona = 'busy_boss' | 'emotional_partner' | 'defensive_colleague';

export type AiResult = {
  interpretation: string;
  replyOptions: string[];
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
  const replyOptions = (parsed as { replyOptions?: unknown }).replyOptions;
  const reply = (parsed as { reply?: unknown }).reply;
  if (
    typeof interpretation !== 'string' ||
    interpretation.trim().length === 0
  ) {
    throw new Error('JSON inválido (interpretation).');
  }

  const normalizedReplyOptions = Array.isArray(replyOptions)
    ? replyOptions
        .filter((x): x is string => typeof x === 'string')
        .map((x) => x.trim())
        .filter((x) => x.length > 0)
    : [];

  if (normalizedReplyOptions.length > 0) {
    return {
      interpretation: interpretation.trim(),
      replyOptions: normalizedReplyOptions.slice(0, 4),
    };
  }

  if (typeof reply === 'string' && reply.trim().length > 0) {
    return {
      interpretation: interpretation.trim(),
      replyOptions: [reply.trim()],
    };
  }

  throw new Error('JSON inválido (replyOptions).');
}

export async function generateAiResult(
  input: GenerateInput,
): Promise<AiResult> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return {
      interpretation: 'Mock: sem GROQ_API_KEY configurada.',
      replyOptions: [
        'Pode me dar mais contexto para eu te responder melhor?',
        'Entendi. Qual é o objetivo principal dessa conversa?',
        'Ok. O que você gostaria que eu fizesse agora?',
        'Certo. Quer que eu sugira uma resposta mais direta ou mais diplomática?',
      ],
    };
  }

  const model = process.env.GROQ_MODEL ?? 'openai/gpt-oss-120b';
  const system = [
    'Você é um simulador de comportamento humano para treinar conversas difíceis.',
    personaInstruction(input.persona),
    'Responda estritamente em JSON no formato: {"interpretation":"...","replyOptions":["...","...","...","..."]}',
    'interpretation: descreva o que você entendeu e o estado emocional/intenção percebidos.',
    'replyOptions: gere exatamente 4 respostas possíveis, em português, como a persona; cada uma deve ser realista, concisa, e com variações de tom/estratégia (direta, diplomática, curiosa, assertiva). A resposta mais provável deve ser a primeira do array replyOptions.',
    'Não numere dentro das strings; eu vou enumerar no frontend.',
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
