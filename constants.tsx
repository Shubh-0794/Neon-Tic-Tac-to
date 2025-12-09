import { Bot, Users, Bluetooth, Cpu } from 'lucide-react';

export const WINNING_COMBINATIONS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export const MENU_ITEMS = [
  {
    mode: 'LOCAL',
    label: 'Local PvP',
    description: 'Play against a friend on this device',
    icon: <Users className="w-6 h-6" />,
    color: 'bg-blue-600',
  },
  {
    mode: 'AI',
    label: 'vs Gemini AI',
    description: 'Challenge the Google Gemini Model',
    icon: <Bot className="w-6 h-6" />,
    color: 'bg-purple-600',
  },
  {
    mode: 'BLUETOOTH',
    label: 'Bluetooth',
    description: 'Connect to a BLE Game Board',
    icon: <Bluetooth className="w-6 h-6" />,
    color: 'bg-indigo-600',
  }
] as const;
