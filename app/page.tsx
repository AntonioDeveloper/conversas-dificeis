import Link from "next/link";
import { Button } from "./src/components/ui/Button";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-black text-zinc-200">
      <main className="max-w-3xl mx-auto px-6 py-24">
        <h1 className="text-4xl font-semibold tracking-tight font-['Space_Grotesk']">
          Conversas Difíceis
        </h1>
        <p className="mt-3 text-zinc-400">
          Treine abordagens, ajuste o tom e receba opções de resposta com o simulador BIO-INTEL.
        </p>
        <div className="mt-8">
          <Link href="/treino">
            <Button size="lg">Ir para o treino</Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
