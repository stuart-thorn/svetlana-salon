import { MAX_PARTY, personLabel, type Catalog, type PartyMember } from "@salon/booking";
import { Notice, Plus } from "../ui";

interface Props {
  catalog: Catalog;
  people: PartyMember[];
  onAdd: (audienceId: string) => void;
  onRemove: (audienceId: string) => void;
  onChange: (ref: string, change: Partial<Omit<PartyMember, "ref">>) => void;
}

const inputClass =
  "mt-1 w-full rounded-xl border border-line bg-white px-3 py-2.5 text-base outline-none transition-colors focus:border-accent sm:text-sm aria-[invalid=true]:border-red-400";

/** Ages offered for menus that ask (children): under 1 to 17. */
const AGES = Array.from({ length: 18 }, (_, i) => i);

/**
 * How many people from each menu (the business's audiences), each child's age and, optionally, everyone's first
 * name, so each person is shown only what suits them.
 */
export default function PeopleStep({ catalog, people, onAdd, onRemove, onChange }: Props) {
  const full = people.length >= MAX_PARTY;
  return (
    <div className="max-w-lg space-y-8">
      <p className="text-sm text-muted">Everyone is booked together, with one payment. Up to {MAX_PARTY} people.</p>

      <ul className="divide-y divide-line rounded-2xl border border-line">
        {catalog.audiences.map((a) => {
          const count = people.filter((p) => p.audienceId === a.id).length;
          return (
            <li key={a.id} className="flex items-center justify-between gap-4 px-5 py-4">
              <span className="min-w-0">
                <span className="block font-medium">{a.name}</span>
                {a.description && <span className="block text-sm text-muted">{a.description}</span>}
              </span>
              <span className="flex shrink-0 items-center gap-3">
                <button
                  type="button"
                  onClick={() => onRemove(a.id)}
                  disabled={count === 0}
                  aria-label={`One fewer for ${a.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line text-lg leading-none transition-colors enabled:hover:border-accent disabled:opacity-30"
                >
                  −
                </button>
                <span className="w-5 text-center font-medium tabular-nums" aria-live="polite">
                  {count}
                </span>
                <button
                  type="button"
                  onClick={() => onAdd(a.id)}
                  disabled={full}
                  aria-label={`One more for ${a.name}`}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line transition-colors enabled:hover:border-accent disabled:opacity-30"
                >
                  <Plus />
                </button>
              </span>
            </li>
          );
        })}
      </ul>

      {people.length > 0 && (
        <section>
          <h2 className="mb-3 text-sm font-medium">Who they are</h2>
          <ul className="space-y-3">
            {people.map((p, i) => {
              const audience = catalog.audiences.find((a) => a.id === p.audienceId);
              return (
                <li key={p.ref} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-3 rounded-xl border border-line px-4 py-3">
                  <label className="text-sm">
                    <span className="text-muted">
                      {personLabel({ age: p.age }, i)} · {audience?.name}
                    </span>
                    <input
                      type="text"
                      autoComplete="off"
                      placeholder="First name (optional)"
                      value={p.name ?? ""}
                      maxLength={40}
                      onChange={(e) => onChange(p.ref, { name: e.target.value })}
                      className={inputClass}
                    />
                  </label>
                  {audience?.askAge && (
                    <label className="text-sm">
                      <span className="text-muted">Age</span>
                      <select
                        value={p.age ?? ""}
                        aria-invalid={p.age === undefined}
                        onChange={(e) => onChange(p.ref, { age: e.target.value === "" ? undefined : Number(e.target.value) })}
                        className={inputClass}
                      >
                        <option value="">Choose</option>
                        {AGES.map((n) => (
                          <option key={n} value={n}>
                            {n === 0 ? "Under 1" : n}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {people.length === 1 && <Notice>Add at least one more person, or go back to book for one.</Notice>}
      {full && <Notice>For more than {MAX_PARTY} people, please call us and we'll arrange it.</Notice>}
    </div>
  );
}
