import { MutableRefObject, useEffect, useMemo, useRef, useState } from "react";

export interface Item {
  id: string;
  name: string;
}

export interface SelectGrowHorizontalChecklistProps {
  items: Item[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  maxVisible?: number;
}

export function SelectGrowHorizontalChecklist({
  items,
  selected,
  setSelected,
  maxVisible = 3,
}: SelectGrowHorizontalChecklistProps) {
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
          items={items}
          selected={selected}
          toggleButton={(isOpen, toggle) => (
            <Badge
              onClick={toggle}
              id={id}
              name={name}
              onClose={() => removeSelected(id)}
              isFocused={isOpen}
            />
          )}
          setSelected={setSelected}
          keepOpen={false}
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
          items={items}
          selected={selected}
          toggleButton={(isOpen, toggle) => (
            <button
              onClick={toggle}
              className={`h-8 w-8 rounded-full border ${isOpen ? 'border-amber-400' : 'border-gray-400'} hover:border-amber-400`}
            >
              +
            </button>
          )}
          setSelected={setSelected}
          keepOpen={true}
        />
      )}
    </div>
  );
}

interface DropDownProps {
  items: Item[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  toggleButton: (isOpen: boolean, toggle: () => void) => JSX.Element;
  keepOpen?: boolean;
}

function DropDown({
  items,
  selected,
  toggleButton,
  setSelected,
  keepOpen,
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

      {(isOpen) && (
        <DropDownPanel
          items={items}
          selected={selected}
          setSelected={setSelected}
          close={() => setIsOpen(false)}
          keepOpen={keepOpen}
        />
      )}
    </div>
  );
}

interface DropDownPanelProps {
  items: Item[];
  selected: string[];
  setSelected: (ids: string[]) => void;
  close: () => void;
  align?: 'left' | 'center' | 'right';
  keepOpen?: boolean;
}

function DropDownPanel({
  items,
  selected,
  setSelected,
  close,
  align,
  keepOpen,
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
          const newSelected = selected.includes(id)
            ? selected.filter((i) => i !== id)
            : [...selected, id];
          setSelected(newSelected);
          if (!keepOpen) {
            close();
          }
        }
      }
    }
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [selected, filteredItems, focus, setSelected, close, keepOpen]);

  return (
    <div
      className={`w-0 h-0 translate-y-1 flex flex-col ${align === 'left' ? 'items-start' : align === 'right' ? 'items-end' : 'items-center'} drop-shadow-lg`}
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
                  className={`group/button shrink-1 w-full h-8 px-2 flex flex-row gap-2 items-center text-left rounded hover:bg-gray-100 ${i == focus ? 'outline outline-offset-[-1px] outline-1 outline-gray-200' : ''}`}
                  onClick={() => {
                    const newSelected = on
                      ? selected.filter((i) => i !== id)
                      : [...selected, id]
                    setSelected(newSelected);
                    if (!keepOpen) {
                      close();
                    }
                  }}
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
