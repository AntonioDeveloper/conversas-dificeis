"use client";

import { Button } from "../src/components/ui/Button";
import { Textarea } from "../src/components/ui/TextArea";
import { Card } from "../src/components/layout/Card";
import { BioIntelHeader } from "../src/components/layout/Header";
import { Spinner } from "../src/components/ui/Spinner";
import * as React from "react";

type Persona = "busy_boss" | "emotional_partner" | "defensive_colleague";

export default function Treino() {
  const [inputText, setInputText] = React.useState("");
  const [situation, setSituation] = React.useState("");
  const [persona, setPersona] = React.useState<Persona>("busy_boss");
  const [possibleInterpretation, setPossibleInterpretation] = React.useState("");
  const [replyOptions, setReplyOptions] = React.useState<string[]>([]);
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [latencyMs, setLatencyMs] = React.useState<number | null>(null);

  async function handleSend() {
    setError(null);
    setReplyOptions([]);
    setIsSending(true);
    let t0 = 0;

    try {
      t0 = performance.now();
      const res = await fetch("http://localhost:3001/enviar-mensagem", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ text: inputText, situation, persona }),
      });

      const json = (await res.json().catch(() => null)) as
        | null
        | { ok?: unknown; result?: { interpretation?: unknown; emotionalInterpretation?: unknown; reply?: unknown; replyOptions?: unknown }; error?: unknown };

      if (!res.ok) {
        const message =
          typeof json?.error === "string"
            ? json.error
            : `Falha ao enviar (${res.status}).`;
        throw new Error(message);
      }

      const reply = json?.result?.reply;
      const replyOptions = json?.result?.replyOptions;
      const interpretation = json?.result?.interpretation;
      const emotionalInterpretation = json?.result?.emotionalInterpretation;

      const normalizedReplyOptions =
        Array.isArray(replyOptions)
          ? replyOptions
              .filter((x): x is string => typeof x === "string")
              .map((x) => x.trim())
              .filter((x) => x.length > 0)
          : [];

      const resolvedInterpretation =
        typeof emotionalInterpretation === "string" && emotionalInterpretation.trim().length > 0
          ? emotionalInterpretation.trim()
          : typeof interpretation === "string" && interpretation.trim().length > 0
          ? interpretation.trim()
          : "";

      setPossibleInterpretation(resolvedInterpretation);

      if (normalizedReplyOptions.length > 0) {
        setReplyOptions(normalizedReplyOptions.slice(0, 4));
        return;
      }

      if (typeof reply !== "string") throw new Error("Resposta inválida do servidor.");
      setReplyOptions([reply.trim()].filter((x) => x.length > 0));
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro desconhecido.";
      setError(message);
    } finally {
      if (t0 > 0) {
        const dt = Math.round(performance.now() - t0);
        setLatencyMs(dt);
      }
      setIsSending(false);
    }
  }

  return (
    <div className="min-h-screen w-full bg-black text-zinc-200 px-6 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-6">
          <BioIntelHeader />
          <Card title="Contexto da conversa" icon className="font-['Space_Grotesk']">
            <Textarea
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
              placeholder="Descreva o cenário, antecedentes e objetivo..."
            />
            <div className="mt-2 text-xs text-zinc-400">Dica: seja específico sobre o objetivo e o histórico recente.</div>
          </Card>
          <Card title="Persona" icon className="font-['Space_Grotesk']">
            <select
              value={persona}
              name="persona"
              onChange={(e) => setPersona(e.target.value as Persona)}
              className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors md:text-sm w-full outline-none"
            >
              <option value="busy_boss">Gestor Ocupado</option>
              <option value="emotional_partner">Parceiro Emocional</option>
              <option value="defensive_colleague">Colega Defensivo</option>
              <option value="collaborative_coworker">Colega Prestativo</option>
              <option value="demanding_client">Cliente Exigente</option>
            </select>
            <div className="mt-2 text-xs text-zinc-400">
              Altere a persona para variar tom e estratégia da resposta.
            </div>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Entrada de simulação"
           
            className="font-['Space_Grotesk']"
          >
            <Textarea
            className="mb-2"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escreva aqui sua fala para simular a reação..."
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isSending && inputText.trim().length > 0) {
                  e.preventDefault();
                  handleSend();
                }
              }}
            />             
              <Button onClick={handleSend} disabled={isSending || inputText.trim().length === 0}>
                {isSending ? <span className="inline-flex items-center gap-2"><Spinner className="size-4" /> Enviando...</span> : "Enviar"}
              </Button>
          
            {error ? <p className="text-destructive text-sm mt-2">{error}</p> : null}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Possível interpretação" icon className="font-['Space_Grotesk']">
              <Textarea value={possibleInterpretation} readOnly placeholder="Aguardando análise da API..." />
            </Card>
            <Card title="Respostas possíveis" icon className="font-['Space_Grotesk']">
              {replyOptions.length === 0 ? (
                <div className="text-sm text-zinc-500">Aguardando entrada para gerar sugestões...</div>
              ) : (
                <div className="space-y-3">
                  {replyOptions.map((text, idx) => {
                    const isMostLikely = idx === 0;
                    return (
                      <div
                        key={`${idx}-${text.slice(0, 24)}`}
                        className={
                          "rounded-lg border px-3 py-2 whitespace-pre-wrap " +
                          (isMostLikely
                            ? "border-lime-400/30 bg-lime-400/5 text-lime-300"
                            : "border-white/10 bg-black/20 text-zinc-200")
                        }
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="text-xs uppercase tracking-widest text-zinc-500">{idx + 1}</div>
                          {isMostLikely ? (
                            <div className="text-xs uppercase tracking-widest text-lime-400">Mais provável</div>
                          ) : null}
                        </div>
                        <div className="mt-2 text-sm leading-relaxed">{text}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Modelo: BIO-INTEL-LARGE-v3</span>
            <span>Latência: {isSending ? "..." : latencyMs !== null ? `${latencyMs} ms` : "- ms"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
