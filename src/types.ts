// Type definitions for the wallet-map application

export interface WalletBalances {
  address: string;
  balances: Map<string, number>;
}

export interface TokenHolders {
  connections: number;
  total: number;
}

export interface Node {
  id: string;
  label: string;
  x: number;
  y: number;
  type: "wallet" | "token";
  weight?: number;
}

export interface Edge {
  source: string;
  target: string;
}

export interface LayoutResult {
  walletNodes: Node[];
  poolNodes: Node[];
  edges: Edge[];
}

// Plotly type declarations
export interface PlotlyData {
  x?: (number | null)[];
  y?: (number | null)[];
  mode?: string;
  line?: { color: string; width: number };
  hoverinfo?: string;
  text?: string[];
  textposition?: string;
  marker?: {
    size?: number[];
    color?: string[];
    opacity?: number;
  };
  [key: string]: unknown;
}

export interface PlotlyLayout {
  xaxis?: {
    showgrid?: boolean;
    zeroline?: boolean;
    showticklabels?: boolean;
  };
  yaxis?: {
    showgrid?: boolean;
    zeroline?: boolean;
    showticklabels?: boolean;
  };
  margin?: { l: number; r: number; b: number; t: number };
  hovermode?: string;
  [key: string]: unknown;
}

declare global {
  interface HTMLElement {
    on?: (event: string, callback: (data: PlotlyClickEvent) => void) => void;
  }
}

export interface PlotlyClickEvent {
  points: Array<{
    pointIndex: number;
  }>;
}

