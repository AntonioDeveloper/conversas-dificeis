"use client";

import { Button } from "../src/components/ui/Button";
import { Textarea } from "../src/components/ui/TextArea";
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
        | { ok?: unknown; result?: { interpretation?: unknown; emotionalInterpretation?: unknown, reply?: unknown }; error?: unknown };

      if (!res.ok) {
        const message =
          typeof json?.error === "string"
            ? json.error
            : `Falha ao enviar (${res.status}).`;
        throw new Error(message);
      }

      const reply = json?.result?.reply;
      const interpretation = json?.result?.interpretation;
      const emotionalInterpretation = json?.result?.emotionalInterpretation;

      console.log("interpretation", interpretation);

      if (typeof reply !== "string") throw new Error("Resposta inválida do servidor.");

      if (typeof emotionalInterpretation === "string" && emotionalInterpretation.trim().length > 0) {
        setPossibleInterpretation(emotionalInterpretation.trim());
      }
      setOutputText(reply);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Erro desconhecido.";
      setError(message);
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="">
      <h1 className="">Treino</h1>
      <label className="">Situação da conversa</label>
      <Textarea
        value={situation}
        onChange={(e) => setSituation(e.target.value)}
        placeholder="Contexto (ex.: reunião 1:1, feedback, conflito...)"
      />
      <label className="">Persona que vai responder</label>
      <select
        value={persona}
        onChange={(e) => setPersona(e.target.value as Persona)}
        className="border-input dark:bg-input/30 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 disabled:bg-input/50 dark:disabled:bg-input/80 rounded-lg border bg-transparent px-2.5 py-2 text-base transition-colors focus-visible:ring-3 aria-invalid:ring-3 md:text-sm w-full outline-none"
      >
        <option value="busy_boss">Chefe ocupado</option>
        <option value="emotional_partner">Parceiro emocional</option>
        <option value="defensive_colleague">Colega defensivo</option>
      </select>
      <label className="">Digite aqui sua mensagem</label>
      <Textarea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="Escreva aqui..."
      />
      <Button onClick={handleSend} disabled={isSending || inputText.trim().length === 0}>
        {isSending ? "Enviando..." : "Enviar"}
      </Button>
      {error ? <p className="text-destructive text-sm">{error}</p> : null}
      <label className="">Possível interpretação do receptor</label>
      <Textarea
        value={possibleInterpretation}
        readOnly
      />
      <label className="">Saída</label>
      <Textarea
        value={outputText}
        readOnly
        placeholder="A resposta vai aparecer aqui..."
      />

    </div>
  )
}
