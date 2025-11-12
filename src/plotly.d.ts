// Type declarations for plotly.js-dist
declare module "plotly.js-dist" {
  interface PlotlyData {
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

  interface PlotlyLayout {
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

  const Plotly: {
    newPlot: (
      elementId: string,
      data: PlotlyData[],
      layout: Partial<PlotlyLayout>
    ) => Promise<void>;
  };

  export default Plotly;
}

