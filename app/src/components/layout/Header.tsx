export function Header() {
  return (
    <div className="flex items-center gap-3 text-zinc-200">
      <span className="inline-flex items-center justify-center size-3.5 rounded-full bg-lime-400 shadow-[0_0_25px_rgba(163,230,53,0.7)]" />
      <div className="flex flex-col">
        <span className="text-sm font-semibold tracking-wide font-['Space_Grotesk']">Conversas Difíceis</span>
        <span className="text-xs text-zinc-400 tracking-wider font-['Manrope']">Treino</span>
      </div>
    </div>
  );
}
