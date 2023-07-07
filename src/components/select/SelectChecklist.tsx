import {MutableRefObject, useEffect, useMemo, useRef, useState} from "react";

interface Item {
  id: string;
  name: string;
}

interface SelectChecklistProps {
  items: Item[];
  selected: string[];
  setSelected: (ids: string[]) => void;
}

export function SelectChecklist({
  items,
  selected,
  setSelected,
}: SelectChecklistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const container = useRef<HTMLDivElement | null>(null);
  useClickOutside(container, () => setIsOpen(false));

  return (
    <div
      ref={container}
      className="flex flex-col items-center"
    >
      <button
        onClick={() => setIsOpen((v) => !v)}
        className="h-8 px-2 rounded border border-gray-400 hover:border-amber-400"
        title={selected.length > 0
          ? selectItems(items, selected).map((i) => i.name).join(',\n')
          : undefined
        }
      >
        {selected.length > 0 ? `${selected.length} kinds` : 'Select kinds'}
      </button>

      {isOpen && (
        <DropDownPanel
          items={items}
          selected={selected}
          setSelected={setSelected}
          close={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

function useClickOutside(
  container: MutableRefObject<HTMLElement | null>,
  action: () => void,
) {
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (container.current && e.target && !container.current.contains(e.target as Node)) {
        action();
      }
    }
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [container, action]);
}

interface DropDownPanelProps {
  items: Item[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  close: () => void;
}

function DropDownPanel({
  items,
  selected,
  setSelected,
  close,
}: DropDownPanelProps) {
  const [filter, setFilter] = useState('');
  const container = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [focus, setFocus] = useState(0);

  useEffect(() => inputRef.current?.focus(), []);

  const filteredItems = useMemo(() => {
    return filterItems(items, filter);
  }, [items, filter]);

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        setFocus((v) => {
          const newFocus = v + 1;
          if (newFocus < filteredItems.length) {
            return newFocus;
          }
          return v;
        });
      } else if (e.key === 'ArrowUp') {
        setFocus((v) => {
          const newFocus = v - 1;
          if (newFocus >= 0) {
            return newFocus;
          }
          return v;
        });
      } else if (e.key === 'Enter') {
        const id = filteredItems[focus]?.id;
        if (id) {
          close();
          setSelected([id]);
        }
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [filteredItems, focus, setSelected, close]);

  return (
    <div
      className="w-0 h-0 translate-y-1 flex flex-col items-center drop-shadow-lg"
    >
      <div
        ref={container}
        className="w-96 max-h-[400px] p-4 flex flex-col gap-2 rounded-lg bg-white border border-gray-200"
      >
        <input
          ref={inputRef}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search kinds"
          className="shrink-0 h-8 px-2 border border-gray-200  hover:border-amber-400 focus:border-amber-400 focus:outline-0 bg-gray-100 rounded"
        />

        <div className="shrink-1 h-full overflow-auto">
          {filteredItems.map(({ id, name }, i) => {
            const on = selected.includes(id);
            return (
              <div
                key={id}
                className="flex flex-row gap-2 items-center"
              >
                <Switch
                  value={on}
                  onChange={() => setSelected(on ? selected.filter((i) => i !== id) : [...selected, id])}
                />
                <button
                  className={`group/button shrink-1 w-full h-8 px-2 flex flex-row gap-2 items-center text-left rounded hover:bg-gray-100 ${i == focus ? 'outline outline-offset-[-1px] outline-1 outline-gray-100' : ''}`}
                  onClick={() => { setSelected([id]); close(); }}
                >
                  {name}
                </button>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  );
}

interface SwitchProps {
  value: boolean;
  onChange?: (value: boolean) => void;
}

function Switch({ value, onChange }: SwitchProps) {
  function toggle() {
    if (onChange) {
      onChange(!value);
    }
  }

  return (
    <button
      onClick={toggle}
      className={`w-10 h-6 px-1 shrink-0 flex flex-row items-center rounded-full border ${value ? 'border-amber-400 justify-end' : 'border-gray-400 justify-start'}`}
    >
      <div className={`w-4 h-4 rounded-full ${value ? 'bg-amber-400' : 'bg-gray-400'}`}></div>
    </button>
  );
}

const matchScore = {
  Equal: 4,
  EqualCaseInsensitive: 3,
  Match: 2,
  MatchCaseInsensitive: 1,
  NoMatch: 0,
} as const;

type MatchScore = typeof matchScore[keyof typeof matchScore];

function scoreMatch(text: string, probe: string): MatchScore {
  if (text.length < probe.length) {
    return matchScore.NoMatch;
  }
  if (text === probe) {
    return matchScore.Equal;
  }
  if (text.toLowerCase() === probe.toLowerCase()) {
    return matchScore.EqualCaseInsensitive;
  }
  const escapedProbe = probe.replace('//', '////');
  if (text.match(escapedProbe)) {
    return matchScore.Match;
  }
  if (text.toLowerCase().match(escapedProbe.toLowerCase())) {
    return matchScore.MatchCaseInsensitive;
  }
  return matchScore.NoMatch;
}

function filterItems(items: Item[], probe: string): Item[] {
  return items.map((item) => ({ item, score: scoreMatch(item.name, probe) }))
    .filter((item) => item.score > 0)
    .sort((a, b) => {
      if (a.score < b.score) {
        return 1;
      }
      if (a.score > b.score) {
        return -1;
      }
      return 0;
    })
    .map((item) => item.item);
}

function selectItems(items: Item[], ids: string[]): Item[] {
  const map = new Map<string, Item>();
  items.forEach((item) => {
    map.set(item.id, item);
  });
  const selectedItems: Item[] = [];
  ids.forEach((id) => {
    const item = map.get(id)
    if (item) {
      selectedItems.push(item);
    }
  });
  return selectedItems;
}
