import {useEffect, useMemo, useRef, useState} from "react";

interface Item {
  id: string;
  name: string;
}

interface SelectModalProps {
  items: Item[];
  selected: string[];
  setSelected: (ids: string[]) => void;
}

export function SelectModal({
  items,
  selected,
  setSelected,
}: SelectModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const container = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (container.current && e.target && !container.current?.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  return (
    <div ref={container}>
      <button
        onClick={() => setIsOpen(true)}
        className="h-8 px-2 rounded border border-gray-400 hover:border-amber-400"
        title={selected.length > 0
          ? selectItems(items, selected).map((i) => i.name).join(',\n')
          : undefined
        }
      >
        {selected.length > 0 ? `${selected.length} kinds` : 'Select kinds'}
      </button>

      {isOpen && (
        <Modal
          items={items}
          selected={selected}
          setSelected={setSelected}
          close={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}

interface ModalProps {
  items: Item[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  close: () => void;
}

function Modal({
  items,
  selected,
  setSelected,
  close,
}: ModalProps) {
  const [filter, setFilter] = useState('');
  const container = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => inputRef.current?.focus(), []);

  const filteredItems = useMemo(() => {
    return filterItems(items, filter);
  }, [items, filter]);

  function handleClose(e: React.MouseEvent<HTMLDivElement>) {
    if (container.current && !container.current.contains(e.target as Node)) {
      close();
    }
  }

  return (
    <div
      className="w-0 h-0"
      onClick={handleClose}
    >
      <div
        className="absolute top-0 left-0 right-0 bottom-0 pt-[200px] flex flex-col items-center bg-gray-100"
      >
        <div
          ref={container}
          className="w-96 max-h-[400px] p-4 flex flex-col gap-1 rounded-lg bg-white border border-gray-200"
        >
          <input
            ref={inputRef}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            placeholder="Search kinds"
            className="shrink-0 h-8 px-2 border border-gray-200  hover:border-amber-400 focus:border-amber-400 focus:outline-0 bg-gray-100 rounded"
          />

          <div className="shrink-1 h-full overflow-auto">
            {filteredItems.map(({ id, name }) => {
              const on = selected.includes(id);
              return (
                <button
                  key={id}
                  className="group/button w-full h-8 flex flex-row gap-2 items-center"
                  onClick={() => setSelected(on ? selected.filter((i) => i !== id) : [...selected, id])}
                >
                  <Switch value={on} />
                  <div
                    className="w-full h-full px-2 flex flex-row items-center text-left rounded group-hover/button:bg-gray-100"
                  >
                    {name}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SwitchProps {
  value: boolean;
}

function Switch({ value }: SwitchProps) {
  return (
    <div className={`w-8 h-4 px-0.5 flex flex-row items-center rounded-full border ${value ? 'border-amber-400 justify-end' : 'border-gray-400 justify-start'}`}>
      <div className={`w-3 h-3 rounded-full ${value ? 'bg-amber-400' : 'bg-gray-400'}`}></div>
    </div>
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
