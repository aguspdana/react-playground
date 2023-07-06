import { useCallback, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';

import { EditableCell, Table } from './Table';
import { useSkipper } from '../../hooks/useSkipper';
import {DebouncedInput} from '../debouncedInput/DebouncedInput';

interface Data {
  id: string;
  name: string;
  email: string;
}

const meta: Meta<typeof Table<Data>> = {
  component: Table,
};

export default meta;

type Story = StoryObj<typeof Table<Data>>;

const defaultData: Data[] = [
  {
    id: '1',
    name: 'Jhon',
    email: 'jhon@gmail.com'
  },
  {
    id: '2',
    name: 'Foo',
    email: 'foo@gmail.com'
  },
  {
    id: '3',
    name: 'Dojo',
    email: 'dojo@gmail.com'
  },
];

export const Simple: Story = {
  args: {
    data: defaultData,
    columns: [
      {
        id: 'person',
        name: 'person',
        columns: [
          {
            id: 'name',
            name: 'name',
            cell: (row: Data) => row.name,
            size: 200,
            enableResizing: true,
          },
          {
            id: 'email',
            name: 'email',
            cell: (row: Data) => row.email,
            size: 400,
            enableResizing: true,
          },
        ],
        enableResizing: true,
      }
    ],
    columnResizeMode: 'onEnd',
  },
};

export const Editable: Story = {
  args: {
    columnResizeMode: 'onEnd',
  },
  render: (args) => (() => {
    const [data, setData] = useState(defaultData);
    const [autoResetPageIndex, setAutoResetPageIndex] = useSkipper(false);

    const setValue = useCallback(
      function setValue(value: string, index: number, columnId: string) {
        setAutoResetPageIndex();
        setData((data) => data.map((row, i) => {
          if (i === index) {
            return { ...row, [columnId]: value };
          }
          return row;
        }));
      },
      [setAutoResetPageIndex]
    );

    const columns = [
      {
        id: 'person',
        name: 'person',
        columns: [
          {
            id: 'name',
            name: 'name',
            cell: (row: Data, index: number, columnId: string) => {
              return <EditableCell
                value={row.name}
                setValue={(value) => setValue(value, index, columnId)}
              />;
            },
            enableResizing: true,
          },
          {
            id: 'email',
            name: 'email',
            cell: (row: Data, index: number, columnId: string) => {
              return <EditableCell
                value={row.email}
                setValue={(value) => setValue(value, index, columnId)}
              />;
            },
            enableResizing: true,
          },
        ],
        enableResizing: true,
      }
    ];

    return <Table
      {...args}
      data={data}
      columns={columns}
      autoResetPageIndex={autoResetPageIndex}
    />;
  })()
}

export const Filterable: Story = {
  args: {
    data: defaultData,
    columnResizeMode: 'onEnd',
  },
  render: (args) => (() => {
    const [filter, setFilter] = useState('');
    const columns = [
      {
        id: 'person',
        name: 'person',
        text: (row: Data) => `${row.name} ${row.email}`,
        columns: [
          {
            id: 'name',
            name: 'name',
            cell: (row: Data) => row.name,
            text: (row: Data) => row.name,
            size: 200,
            enableResizing: true,
          },
          {
            id: 'email',
            name: 'email',
            cell: (row: Data) => row.email,
            text: (row: Data) => row.email,
            size: 400,
            enableResizing: true,
          },
        ],
        enableResizing: true,
      }
    ];

    return (
      <div className="w-[800px]">
        <DebouncedInput
          value={filter}
          onChange={setFilter}
          className="border"
        />
        <Table
          {...args}
          columns={columns}
          filter={filter}
        />
      </div>
    );
  })()
}

export const PinnedRows: Story = {
  args: {
    data: defaultData,
    columns: [
      {
        id: 'person',
        name: 'person',
        text: (row: Data) => `${row.name} ${row.email}`,
        columns: [
          {
            id: 'name',
            name: 'name',
            cell: (row: Data) => row.name,
            text: (row: Data) => row.name,
            enableResizing: true,
          },
          {
            id: 'email',
            name: 'email',
            cell: (row: Data) => row.email,
            text: (row: Data) => row.email,
            enableResizing: true,
          },
        ],
        enableResizing: true,
      }
    ],
    pinRow: (row) => (row.name === 'Foo'),
    columnResizeMode: 'onEnd',
  },
}

export const PinnedColumns: Story = {
  args: {
    data: defaultData,
    columns: [
      {
        id: 'person',
        name: 'person',
        text: (row: Data) => `${row.name} ${row.email}`,
        columns: [
          {
            id: 'name',
            name: 'name',
            cell: (row: Data) => row.name,
            text: (row: Data) => row.name,
            size: 256,
            enableResizing: true,
          },
          {
            id: 'email',
            name: 'email',
            cell: (row: Data) => row.email,
            text: (row: Data) => row.email,
            enableResizing: true,
            size: 256,
          },
        ],
        enableResizing: true,
      },
      {
        id: 'id',
        name: 'id',
        cell: (row: Data) => row.id,
        text: (row: Data) => row.id,
        pin: true,
        size: 100,
        enableResizing: true,
      },
      {
        id: 'id2',
        name: 'id2',
        cell: (row: Data) => row.id,
        text: (row: Data) => row.id,
        pin: true,
        size: 256,
        enableResizing: true,
      },
    ],
    columnResizeMode: 'onEnd',
  },
  render: (args) => (() => {
    return (
      <div className="w-[800px] h-[200px] overflow-auto">
        <Table {...args} />
      </div>
    );
  })()
}
