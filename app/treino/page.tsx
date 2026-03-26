"use client";

import { Button } from "../src/components/ui/Button";
import { Textarea } from "../src/components/ui/TextArea";
import { Card } from "../src/components/layout/Card";
import { BioIntelHeader } from "../src/components/layout/Header";
import * as React from "react";

type Persona = "busy_boss" | "emotional_partner" | "defensive_colleague";

export default function Treino() {
  const [inputText, setInputText] = React.useState("");
  const [situation, setSituation] = React.useState("");
  const [persona, setPersona] = React.useState<Persona>("busy_boss");
  const [possibleInterpretation, setPossibleInterpretation] = React.useState("");
  const [outputText, setOutputText] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function handleSend() {
    setError(null);
    setIsSending(true);

    try {
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

      console.log("interpretation", interpretation);

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
        const numbered = normalizedReplyOptions
          .slice(0, 4)
          .map((text, idx) => `${idx + 1}) ${text}`)
          .join("\n\n");
        setOutputText(numbered);
        return;
      }

      if (typeof reply !== "string") throw new Error("Resposta inválida do servidor.");
      setOutputText(reply);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro desconhecido.";
      setError(message);
    } finally {
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
          </Card>
          <Card title="Persona" icon className="font-['Space_Grotesk']">
            <select
              value={persona}
              onChange={(e) => setPersona(e.target.value as Persona)}
              className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors md:text-sm w-full outline-none"
            >
              <option value="busy_boss">Gestor Ocupado</option>
              <option value="emotional_partner">Parceiro Emocional</option>
              <option value="defensive_colleague">Colega Defensivo</option>
            </select>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Entrada de simulação"
            icon
            right={
              <Button onClick={handleSend} disabled={isSending || inputText.trim().length === 0}>
                {isSending ? "Enviando..." : "Enviar"}
              </Button>
            }
            className="font-['Space_Grotesk']"
          >
            <Textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Escreva aqui sua fala para simular a reação..."
            />
            {error ? <p className="text-destructive text-sm mt-2">{error}</p> : null}
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card title="Possível interpretação" icon className="font-['Space_Grotesk']">
              <Textarea value={possibleInterpretation} readOnly placeholder="Aguardando análise da API..." />
            </Card>
            <Card title="Respostas possíveis" icon className="font-['Space_Grotesk']">
              <Textarea value={outputText} readOnly placeholder="Aguardando entrada para gerar sugestões..." />
            </Card>
          </div>

          <div className="flex items-center justify-between text-xs text-zinc-500">
            <span>Modelo: BIO-INTEL-LARGE-v3</span>
            <span>Latência: {isSending ? "..." : "- ms"}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
