import { TournamentBracket } from "@/components/tournament-bracket/TournamentBracket";
import { demoBracketRounds } from "@/components/tournament-bracket/example-data";

export default function BracketDemoPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-cyan-300/80">
            Next.js Example
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-tight text-white sm:text-5xl">
            TournamentBracket Demo
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-300">
            Example usage for a reusable esports-style bracket component built with React functional
            components and Tailwind utility classes.
          </p>
        </div>

        <TournamentBracket
          rounds={demoBracketRounds}
          title="NSL Championship Finals"
          subtitle="A modern horizontal bracket with reusable round, match, and player components."
        />

        <div className="mt-10 rounded-3xl border border-white/10 bg-slate-900/60 p-6 shadow-[0_18px_60px_rgba(2,6,23,0.35)]">
          <h2 className="text-xl font-bold text-white">Data Structure</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-slate-950/80 p-4 text-sm leading-6 text-slate-300">
{`const rounds = [
  {
    name: "Quarterfinals",
    matches: [
      { player1: "John", player2: "Mark", score1: 3, score2: 1 },
      { player1: "Luke", player2: "James", score1: 2, score2: 3 }
    ]
  },
  {
    name: "Semifinals",
    matches: [
      { player1: "John", player2: "James", score1: 3, score2: 2 }
    ]
  }
]`}
          </pre>
        </div>
      </div>
    </main>
  );
}