export enum AppRoute {
  HOME = 'HOME',
  ELECTRICITY = 'ELECTRICITY',
  MITOOG = 'MITOOG',
  CSHARP = 'CSHARP'
}

export enum ComponentType {
  RESISTOR = 'RESISTOR',
  SOURCE = 'SOURCE',
  WIRE = 'WIRE',
  AMMETER = 'AMMETER',
  VOLTMETER = 'VOLTMETER'
}

export interface CircuitComponent {
  id: string;
  type: ComponentType;
  value: number; // Ohms or Volts
  label: string;
  x: number;
  y: number;
  rotation?: number; // degrees
  isParallelBranch?: boolean;
}

export interface SimulationState {
  voltage: number;
  resistors: { [id: string]: number };
  totalResistance: number;
  totalCurrent: number;
  branchCurrents: { [branchId: string]: number }; // For calculating dot speed
  active: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}