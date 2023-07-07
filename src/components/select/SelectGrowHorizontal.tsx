import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";

export interface Item {
  id: string;
  name: string;
}

export interface SelectGrowHorizontalProps {
  items: Item[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  maxVisible?: number;
}

export function SelectGrowHorizontal({
  items,
  selected,
  setSelected,
  maxVisible = 3,
}: SelectGrowHorizontalProps) {
  const [showAll, setShowAll] = useState(false);
  const selectedItems = useMemo(() => {
    return selectItems(items, selected);
  }, [items, selected]);

  useEffect(() => {
    if (selectedItems.length < maxVisible) {
      setShowAll(false);
    }
  }, [selectedItems, maxVisible]);

  const unselectedItems = items.filter((item) => !selected.includes(item.id));

  function pushSelected(id: string) {
    setSelected([...selected, id]);
  }

  function removeSelected(id: string) {
    setSelected(selected.filter((i) => i !== id));
  }

  function replaceSelected(id: string, withId: string) {
    const ids = selected.map((i) => i === id ? withId : i);
    setSelected(ids);
  }

  return (
    <div className="flex flex-row gap-2">
      {(showAll ? selectedItems : selectedItems.slice(0, maxVisible)).map(({ id, name }) => (
        // The drop down is closed when we replace the selected item because
        // we use id as the key.
        <DropDown
          key={id}
          items={unselectedItems}
          toggleButton={(isOpen, toggle) => (
            <Badge
              onClick={toggle}
              id={id}
              name={name}
              onClose={() => removeSelected(id)}
              isFocused={isOpen}
            />
          )}
          onSelect={(selectedId) => replaceSelected(id, selectedId)}
        />
      ))}

      {!showAll && selectedItems.length > maxVisible && (
        <button
          title={selectedItems.slice(maxVisible).map((i) => i.name).join(',\n')}
          className={`group/button h-8 w-8 rounded-full border border-gray-400 hover:border-amber-400 flex flex-row gap-0.5 items-center justify-center`}
          onClick={() => setShowAll(true)}
        >
          {new Array(3).fill(1).map((_, i) => (
            <span key={i} className="w-1 h-1 bg-gray-400 group-hover/button:bg-black rounded-full"></span>
          ))}
        </button>
      )}

      {showAll && selectedItems.length > maxVisible && (
        <button
          onClick={() => setShowAll(false)}
          className={`shrink-0 h-8 px-4 rounded-full border border-gray-400 hover:border-amber-400 whitespace-nowrap text-gray-400 hover:text-black`}
        >
          Show less
        </button>
      )}

      {unselectedItems.length > 0 && (
        <DropDown
          items={unselectedItems}
          toggleButton={(isOpen, toggle) => (
            <button
              onClick={toggle}
              className={`h-8 w-8 rounded-full border ${isOpen ? 'border-amber-400' : 'border-gray-400'} hover:border-amber-400`}
            >
              +
            </button>
          )}
          onSelect={(id) => pushSelected(id)}
          alwaysOpen={false}
        />
      )}
    </div>
  );
}

interface DropDownProps {
  items: Item[],
  toggleButton: (isOpen: boolean, toggle: () => void) => JSX.Element;
  onSelect: (id: string) => void;
  alwaysOpen?: boolean;
}

function DropDown({
  items,
  toggleButton,
  onSelect,
  alwaysOpen,
}: DropDownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const container = useRef<HTMLDivElement | null>(null);
  useClickOutside(container, () => setIsOpen(false));

  function toggle() {
    setIsOpen((v) => !v);
  }

  return (
    <div
      ref={container}
      className="relative flex flex-col items-center"
    >
      {toggleButton(isOpen, toggle)}

      {(isOpen || alwaysOpen) && (
        <DropDownPanel
          items={items}
          onSelect={onSelect}
        />
      )}
    </div>
  );
}

interface DropDownPanelProps {
  items: Item[];
  onSelect: (id: string) => void;
}

function DropDownPanel({ items, onSelect }: DropDownPanelProps) {
  const inputElm = useRef<HTMLInputElement | null>(null);
  const [filter, setFilter] = useState('');
  const [focus, setFocus] = useState(0);

  const filteredItems = useMemo(() => {
    return filterItems(items, filter);
  }, [items, filter]);

  useEffect(() => {
    if (inputElm.current) {
      inputElm.current.focus()
    }
  }, []);

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
          onSelect(id);
        }
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [filteredItems, focus, onSelect]);

  useEffect(() => {
    if (focus >= filteredItems.length) {
      setFocus(0);
    }
  }, [filteredItems, focus]);

  return (
    <div className="w-0 h-0 block">
      <div className="translate-x-[-50%] translate-y-1 min-w-[200px] max-w-[400px] flex flex-col gap-1 items-start border border-gray-200 rounded-lg p-1 bg-white drop-shadow-lg">
        <input
          ref={inputElm}
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Search kinds"
          className="shrink-0 w-full h-8 px-2 rounded border border-gray-200 hover:border-amber-400 focus:border-amber-400 focus:outline-0 bg-gray-100"
        />

        <div className="shrink-1 w-full max-h-[256px] overflow-y-auto flex flex-col">
          {filteredItems.map(({ id, name }, index) => (
            <button
              key={id}
              onClick={(e) => { onSelect(id); e.stopPropagation()}}
              className={`shrink-0 w-full h-8 px-2 rounded hover:bg-gray-100 text-left overflow-hidden ${focus === index ? 'bg-gray-100' : ''}`}
            >
              {name}
            </button>
          ))}
        </div>
      </div>
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

interface BadgeProps {
  id: string;
  name: string;
  onClick?: () => void;
  onClose?: () => void;
  isFocused?: boolean;
}

function Badge({ name, onClick, onClose, isFocused }: BadgeProps) {
  return (
    <div className="shrink-0 inline-flex gap-0 items-center">
      <button
        onClick={onClick}
        className={`h-8 inline-flex flex-row gap-2 items-center border ${isFocused ? 'border-amber-400' : 'border-gray-400'} hover:border-amber-400 rounded-full pl-3 pr-7`}
      >
        <span className="h-2 w-2 bg-amber-400 rounded-full"></span>
        <span className="whitespace-nowrap">{name}</span>
      </button>
      {onClose && (
        <div className="w-0">
          <button
            onClick={onClose}
            className="h-6 w-6 rounded-full hover:bg-gray-100 -ml-7"
          >
            ⨯
          </button>
        </div>
      )}
    </div>
  );
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
