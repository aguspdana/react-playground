import type { Meta, StoryObj } from '@storybook/react';
import { SelectGrowHorizontal } from './SelectGrowHorizontal2';
import {useState} from 'react';

const meta: Meta = {
  component: SelectGrowHorizontal,
};

type Story = StoryObj<typeof SelectGrowHorizontal>;

export const Primary: Story = {
  args: {
    items: [
      {
        id: 'blog',
        name: 'blog',
      },
      {
        id: 'daily expense',
        name: 'daily expense',
      },
      {
        id: 'note',
        name: 'note',
      },
      {
        id: 'todo',
        name: 'todo',
      },
    ]
  },
  render: (args) => (() => {
    const [selected, setSelected] = useState<string[]>([]);
    return <SelectGrowHorizontal
      {...args}
      selected={selected}
      setSelected={setSelected}
    />;
  })(),
};

export const ManyKinds: Story = {
  args: {
    items: [
      {
        id: 'blog',
        name: 'blog',
      },
      {
        id: 'daily expense',
        name: 'daily expense',
      },
      {
        id: 'note',
        name: 'note',
      },
      {
        id: 'todo',
        name: 'todo',
      },
      {
        id: 'kjnsdpinasdkck',
        name: 'kjnsdpinasdkck',
      },
      {
        id: 'kjasdpiuhbapkjencas',
        name: 'kjasdpiuhbapkjencas',
      },
      {
        id: 'lkjasdpiauhdfa',
        name: 'lkjasdpiauhdfa',
      },
      {
        id: 'kajsdpciuasdjnsdc',
        name: 'kajsdpciuasdjnsdc',
      },
      {
        id: 'ipuhsdlkjfnadadf',
        name: 'ipuhsdlkjfnadadf',
      },
      {
        id: 'kjhapoiufasda',
        name: 'kjhapoiufasda',
      },
      {
        id: 'pioh9sdkcjbasd',
        name: 'pioh9sdkcjbasd',
      },
      {
        id: 'kjshdfperf',
        name: 'kjshdfperf',
      },
      {
        id: 'mkjdadoiadca',
        name: 'mkjdadoiadca',
      },
    ]
  },
  render: (args) => (() => {
    const [selected, setSelected] = useState<string[]>([]);
    return <SelectGrowHorizontal
      {...args}
      selected={selected}
      setSelected={setSelected}
    />;
  })(),
};

export default meta;
