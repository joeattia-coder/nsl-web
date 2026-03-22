import { KnockoutBracket } from "@/components/tournament-bracket/KnockoutBracket";
import { demoBracketRounds } from "@/components/tournament-bracket/example-data";

export default function BracketDemoPage() {
  return (
    <main className="min-h-screen bg-[#ececec] px-4 py-10 text-slate-900 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-slate-500">
            Next.js Example
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
            KnockoutBracket Demo
          </h1>
          <p className="mt-4 text-base leading-7 text-slate-600">
            Example usage for the reusable broadcast-style knockout bracket component used by the
            public matches page.
          </p>
        </div>

        <KnockoutBracket
          rounds={demoBracketRounds}
          title="NSL Championship Finals"
          subtitle="A premium horizontal bracket with dynamic rounds, polished match cards, and connector alignment."
        />

        <div className="mt-10 rounded-3xl border border-[#e5e7eb] bg-white p-6 shadow-[0_12px_30px_rgba(15,23,42,0.06)]">
          <h2 className="text-xl font-semibold text-slate-950">Data Structure</h2>
          <pre className="mt-4 overflow-x-auto rounded-2xl border border-[#e5e7eb] bg-[#f8f8f8] p-4 text-sm leading-6 text-slate-700">
{`const rounds = [
  {
    id: "quarterfinals",
    name: "Quarterfinals",
    matches: [
      {
        id: "qf-1",
        matchNumber: 1,
        scheduledAt: "2026-04-04T18:00:00.000Z",
        player1: { id: "john", name: "John Murphy", flagCode: "IE", score: 3, isWinner: true },
        player2: { id: "mark", name: "Mark Selby", flagCode: "GB", score: 1 },
      },
    ],
  },
]`}
          </pre>
        </div>
      </div>
    </main>
  );
}