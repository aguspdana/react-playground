/* eslint-disable @typescript-eslint/no-explicit-any */

import { rankItem } from '@tanstack/match-sorter-utils';
import {
  ColumnDef,
  RowData,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFacetedMinMaxValues,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  ColumnFiltersState,
  FilterFn
} from '@tanstack/react-table';
import { JSX, useEffect, useState } from 'react';

import '@tanstack/react-table';

declare module '@tanstack/table-core' {
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  interface ColumnMeta<TData extends RowData, TValue> {
    name: string;
  }
}

export interface BaseColumn<TData> {
  id: string;
  name?: string;                  // Fallback to id
  header?: JSX.Element;           // Fallback to name
  text?: (row: TData) => string;  // The returned value is used for filtering and sorting rows
  enableResizing?: boolean;
  pin?: boolean;                  // Only the top column can be pinned
}

export interface LeafColumn<TData> extends BaseColumn<TData> {
  cell: (row: TData, index: number, columnId: string) => JSX.Element | string;
  size?: number;                  // Default 256px
  minSize?: number;
  maxSize?: number;
}

export interface GroupColumn<TData> extends BaseColumn<TData> {
  columns: Column<TData>[]
}

export type Column<TData> = LeafColumn<TData> | GroupColumn<TData>;

type IfElse<T extends object, X, Y> = T extends X ? X : Y;

export interface TableProps<TData> {
  data: TData[];
  columns: Column<TData>[];
  filter?: string;
  columnResizeMode?: 'onChange' | 'onEnd';
  autoResetPageIndex?: boolean;
  pinRow?: (row: TData) => boolean;
}

export function Table<TData>({
  data,
  columns,
  filter,
  columnResizeMode,
  autoResetPageIndex,
  pinRow,
}: TableProps<TData>) {
  const [globalFilter, setGlobalFilter] = useState('');
  const [pinnedData, setPinnedData] = useState(pinRow ? pinRows(data, pinRow) : data);

  useEffect(() => {
    setPinnedData(pinRow ? pinRows(data, pinRow) : data);
  }, [data, pinRow]);

  const table = useReactTable({
    data: pinnedData,
    columns: columns.map((col) => toColumnDef(col)),
    filterFns: {
      fuzzy: fuzzyFilter,
    },
    state: {
      globalFilter,
    },
    getCoreRowModel: getCoreRowModel(),
    globalFilterFn: fuzzyFilter,
    getColumnCanGlobalFilter: () => true,
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getFacetedMinMaxValues: getFacetedMinMaxValues(),
    enableFilters: true,
    enableColumnFilters: true,
    columnResizeMode,
    autoResetPageIndex,
  });
  const [columnsMap, setColumnsMap] = useState(
    /// <lowecaseColumnName, columnId[]>
    new Map<string, string[]>()
  );

  /// Update columnsMap
  useEffect(() => {
    const map = new Map<string, string[]>();
    const leafColumns = table.getAllFlatColumns();
    leafColumns.forEach((c) => {
      const name = c.columnDef.meta?.name?.toLowerCase();
      if (!name) {
        return;
      }
      const ids = map.get(name);
      if (ids) {
        ids.push(c.id);
      } else {
        map.set(name, [c.id]);
      }
    });
    setColumnsMap(map);
  }, [table, columns]);

  /// Parse filter and set table's global and column filters
  useEffect(() => {
    const state = parseFilter(filter || '');
    setGlobalFilter(state.globalFilter);
    table.resetColumnFilters(true);
    const columnFilters: ColumnFiltersState = [];
    state.columnFilters.forEach((f) => {
      const ids = columnsMap.get(f.column.toLowerCase());
      ids?.forEach((id) => {
        columnFilters.push({
          id,
          value: f.term,
        });
      });
    });
    table.setColumnFilters(columnFilters);
  }, [table, columnsMap, filter]);

  /// Update column pinning
  useEffect(() => {
    const left: string[] = [];
    columns.forEach((col) => {
      if (col.pin) {
        left.push(col.id);
      }
    });
    table.setColumnPinning({ left });
  }, [table, columns]);

  /// Calculate left position of pinned columns
  const headerGroups = table.getHeaderGroups();
  const left = [0];
  headerGroups[headerGroups.length - 1].headers.slice(0, -1).forEach((header) => {
    left.push(header.getSize() + left[left.length - 1]);
  });

  return (
    <div className="w-full h-full overflow-auto">
      <table className="w-max table-fixed relative border-separate border-spacing-0">
        <thead className="group relative sticky top-0 z-[2]">
          {table.getHeaderGroups().map(headerGroup => {
            let nextLeft = 0;
            return (
              <tr
                key={headerGroup.id}
                className="table-row"
              >
                {headerGroup.headers.map(header => {
                  const def = header.column.columnDef;
                  const colPin = header.column.getIsPinned();
                  const left = nextLeft;
                  nextLeft += header.getSize();
                  return (
                    <th
                      key={header.id}
                      colSpan={header.colSpan}
                      className={`table-cell relative border bg-gray-100 ${
                        className({
                          'sticky z-[2]' : !!colPin,
                          'z-[10]': header.column.getIsResizing(),
                        })
                      }`}
                      style={{
                        width: header.getSize(),
                        left: colPin === 'left' ? left : undefined,
                      }}
                    >
                      {!header.isPlaceholder && (
                        <div
                          onClick={header.column.getToggleSortingHandler()}
                          className="px-2 py-1"
                        >
                          {typeof def.header === 'function'
                            ? def.header(header.getContext())
                            : def.meta?.name
                          }
                          {{
                            asc: ' 🔼',
                            desc: ' 🔽',
                          }[header.column.getIsSorted() as string] ?? null}
                        </div>
                      )}
                      {header.column.getCanResize() && (
                        <div
                          {...{
                            onMouseDown: header.getResizeHandler(),
                            onTouchStart: header.getResizeHandler(),
                            className: `group-hover:bg-amber-100 hover:bg-amber-200 w-2 h-full absolute top-0 right-0 ${
                              className({
                                'bg-amber-400 z-[10]': header.column.getIsResizing(),
                              })
                            }`,
                            style: {
                              transform:
                                columnResizeMode === 'onEnd' &&
                                header.column.getIsResizing()
                                  ? `translateX(${
                                      table.getState().columnSizingInfo.deltaOffset
                                    }px)`
                                  : '',
                            },
                          }}
                        />
                      )}
                    </th>
                  )
                })}
              </tr>
            )})
          }
        </thead>

        <tbody>
          {table.getRowModel().rows.map(row => {
            const isRowPinned = pinRow ? pinRow(row.original) : false;
            return (
              <tr
                key={row.id}
                className={`border-b ${isRowPinned ? 'bg-amber-100' : ''}`}
              >
                {row.getVisibleCells().map((cell, i) => {
                  const def = cell.column.columnDef;
                  const colPin = cell.column.getIsPinned();
                  const c = className({
                    'sticky z-[1]': !!colPin,
                    'bg-amber-100': isRowPinned,
                    'bg-white': !isRowPinned,
                  });
                  return (
                    <td
                      key={cell.id}
                      className={`border px-2 py-1 relative ${c}`}
                      style={{
                        width: cell.column.getSize(),
                        left: colPin === 'left' ? left[i] : undefined,
                      }}
                    >
                      {
                        typeof def.cell === 'function'
                          && def.cell(cell.getContext())
                      }
                    </td>
                  )
                })}
              </tr>
            )
          })}
        </tbody>
      </table>
      <div className="flex flex-row gap-auto items-center justify-between h-12 px-2 py-1 sticky left-0 bottom-0 z-[10] bg-gray-100">
        <div className="flex flex-row gap-2">
          <button
            onClick={() => table.previousPage()}
            className="px-2 py-1 rounded bg-amber-400"
          >
            Prev
          </button>
          <button
            onClick={() => table.nextPage()}
            className="px-2 py-1 rounded bg-amber-400"
          >
            Next
          </button>
        </div>
        <div>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}</div>
      </div>
    </div>
  );
}

interface EditableCellProps {
  value: string;
  setValue: (value: string) => void;
}

export function EditableCell({ value, setValue }: EditableCellProps) {
  const [tempValue, setTempValue] = useState(value);

  return (
    <input
      value={tempValue}
      onChange={(e) => setTempValue(e.target.value)}
      onBlur={() => setValue(tempValue)}
      className="w-full focus:outline-0"
    />
  )
}

function toColumnDef<TData>(column: Column<TData>): ColumnDef<TData> {
  const leafColumn = column as IfElse<typeof column, LeafColumn<TData>, Record<string, any>>;
  if (typeof (leafColumn)?.cell !== 'undefined') {
    const {
      id,
      name,
      header,
      cell,
      text,
      size,
      minSize,
      maxSize,
      enableResizing,
    } = leafColumn as LeafColumn<TData>;
    const def: ColumnDef<TData> = {
      id,
      header: header && (() => header),
      accessorFn: text,
      size: size || 256,
      minSize,
      maxSize,
      enableResizing,
      cell: (context) => cell(context.row.original, context.row.index, id),
      meta: {
        name: name || id,
      },
      filterFn: fuzzyFilter,
      enableColumnFilter: true,
      enableGlobalFilter: true,
    };
    return def;
  }

  const groupColumn = column as GroupColumn<TData>;
  const {
    id,
    name,
    header,
    columns,
    text,
    enableResizing,
  } = groupColumn;
  const def: ColumnDef<TData> = {
    id,
    header: header && (() => header),
    columns: columns.map((col: Column<TData>) => toColumnDef(col)),
    accessorFn: text,
    enableResizing,
    meta: {
      name: name || id,
    },
    filterFn: fuzzyFilter,
    enableColumnFilter: true,
    enableGlobalFilter: true,
  };
  return def;
}

interface ColumnFilterTerm {
  column: string;
  term: string;
}

interface FilterState {
  globalFilter: string;
  columnFilters: ColumnFilterTerm[];
}

/**
 * Parse raw filter.
 * Possible syntax:
 * ```
 * <TERM>
 * <COLUMN_NAME>:<TERM>
 * <COLUMN_NAME>:<TERM>;<COLUMN_NAME>:<TERM>;...
 * ```
 */
function parseFilter(rawFilter: string): FilterState {
  const groups = rawFilter.split(';');
  const filterState: FilterState = {
    globalFilter: '',
    columnFilters: [],
  };

  groups.forEach((group) => {
    const matchColumnFilter = group.match(/^(?<column>.+):(?<term>.*)$/);
    if (matchColumnFilter) {
      const column = matchColumnFilter.groups?.column.trim() || '';
      const term = matchColumnFilter.groups?.term.trim() || '';
      if (column.length > 0 && term.length > 0) {
        filterState.columnFilters.push({ column, term });
      }
    } else if (!filterState.globalFilter) {
      const term = group.trim();
      if (term.length > 0) {
        filterState.globalFilter = term;
      }
    }
  });

  return filterState;
}

/**
 * Cell's value must be a primitive or an array of primitives.
 *
 * NOTE: `react-table` doesn't apply column filter to columns
 * with non-primitive values, but it does apply for global filter.
 * This may be a bug because it's not mentioned in the doc.
 */
const fuzzyFilter: FilterFn<any> = (row, columnId, filter, addMeta) => {
  const itemRank = rankItem(row.getValue(columnId), filter);
  addMeta({ itemRank });
  return itemRank.passed;
};

function pinRows<TData extends RowData>(
  rows: TData[],
  pin: (row: TData) => boolean
): TData[] {
  const pinned: TData[] = [];
  const others: TData[] = [];
  rows.forEach((row) => {
    if (pin(row)) {
      pinned.push(row);
    } else {
      others.push(row);
    }
  });
  return [...pinned, ...others];
}

function className(classNames: Record<string, boolean>): string {
  return Object.entries(classNames)
    .filter(([, shouldUse]) => shouldUse)
    .map(([c]) => c)
    .join(' ');
}
