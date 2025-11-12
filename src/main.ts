import Plotly from "plotly.js-dist";
import type {
  WalletBalances,
  TokenHolders,
  Node,
  Edge,
  LayoutResult,
  PlotlyClickEvent,
} from "./types.js";
import { PoolType, Filter, PoolInit, Sailfish, SailfishCallbacks, SailfishMessage, TokenInit, TokenMint, Trade, TradeRaw } from "sailfish-sdk";

let TOTAL_TRADES = 0;
let TOTAL_WALLETS = 0;
let TOTAL_TOKENS = 0;

const callbacks: SailfishCallbacks = {
  onMessage: (message: SailfishMessage) => { },
  onTokenInit: (message: TokenInit) => { },
  onTokenMint: (message: TokenMint) => { },
  onTokenGraduate: (message: PoolInit) => { },
  onPoolInit: (poolInit: PoolInit) => { },
  onTradeRaw: (tradeRaw: TradeRaw) => handleRawTrade(tradeRaw),
  onTrade: (trade: Trade) => { },
};

// Convert lamports to SOL
const lamportsToSol = (lamports: string) => {
  const SOL_DECIMALS = 9; // 1 SOL = 10^9 lamports
  return Number(lamports) / Math.pow(10, SOL_DECIMALS);
}


const shortMe = (address: string) => {
  return address.slice(0, 4) + "..." + address.slice(-4);
}

const runSailfish = async () => {
  const sailfish = new Sailfish(callbacks, {} as Filter);
  sailfish.swim();
}


const updateWalletBalance = (t: TradeRaw) => {
  if (isPairedWithSol(t) == false || isBondingCurveTrade(t) == true) {
    // We don't care for now about the non SOL paired tokens.
    // Also, we don't care for now about bonding curve trades.
    return;
  }

  const is_buy = isBuy(t);
  const amount = is_buy ? lamportsToSol(t.token_amount_in) : lamportsToSol(t.token_amount_out);
  const tokenAddress = is_buy ? t.token_address_out : t.token_address_in;
  const walletAddress = t.from_wallet; // @dev RISK is we will get the JUP delegate wallet. 

  if (!wallets.has(walletAddress)) {
    wallets.set(walletAddress, {
      address: walletAddress,
      balances: new Map([[tokenAddress, amount]])
    });
    return;
  }

  const wallet = wallets.get(walletAddress)!;

  const has_token = wallet.balances.has(tokenAddress);
  switch (has_token) {
    case true:
      if (is_buy) {
        wallet.balances.set(tokenAddress, wallet.balances.get(tokenAddress)! + amount);
      } else {
        const new_balance = wallet.balances.get(tokenAddress)! - amount;
        if (new_balance <= 0) {
          wallet.balances.delete(tokenAddress);
        } else {
          wallet.balances.set(tokenAddress, new_balance);
        }
      }
      break;

    case false:
      if (is_buy) {
        wallet.balances.set(tokenAddress, amount);
      }
      break;

    default:
      break;
  }
}

const SOL_ADDRESS = "So11111111111111111111111111111111111111112"

const isPairedWithSol = (tradeRaw: TradeRaw) => {
  return [tradeRaw.token_address_in, tradeRaw.token_address_out].includes(SOL_ADDRESS);
}

const isBondingCurveTrade = (tradeRaw: TradeRaw) => {
  const bonding_curves = [PoolType.RaydiumLaunchpad, PoolType.PumpFunAmm];
  return bonding_curves.includes(tradeRaw.pool_type as PoolType);
}

const isBuy = (tradeRaw: TradeRaw) => {
  return tradeRaw.token_address_in === SOL_ADDRESS;
}

const handleRawTrade = (t: TradeRaw) => {
  updateWalletBalance(t);
  render();
}

const poolBias = 0.7; // 70% weight to connection count, 30% to USD sum

// initial pools and wallets
let wallets: Map<string, WalletBalances> = new Map();

// store pool stats
const token_holders = new Map<string, TokenHolders>();

function updateTokenData(): void {
  token_holders.clear();
  wallets.forEach((w) => {
    if (w.balances.size < 5) { // @dev we don't care about wallets with less than 5 balances
      return;
    }
    w.balances.forEach((usd, token) => {
      if (!token_holders.has(token)) {
        token_holders.set(token, { connections: 0, total: 0 });
      }
      const p = token_holders.get(token)!;
      p.connections++;
      p.total += usd;
    });
  });

}

// compute node positions
function layoutNodes(): LayoutResult {
  const walletNodes: Node[] = [];
  const poolNodes: Node[] = [];
  const edges: Edge[] = [];

  updateTokenData();

  const walletCount = wallets.size;
  const poolCount = token_holders.size;

  const walletRadius = 250;
  const poolRadius = 400;
  const cx = 600;
  const cy = 400;

  const wallet_keys = Array.from(wallets.keys());
  // wallets: inner circle
  wallet_keys.forEach((walletAddress, i) => {
    const angle = (2 * Math.PI * i) / walletCount;
    walletNodes.push({
      id: walletAddress,
      label: shortMe(walletAddress),
      x: cx + walletRadius * Math.cos(angle),
      y: cy + walletRadius * Math.sin(angle),
      type: "wallet",
    });
  });

  // pools: outer circle
  Array.from(token_holders.entries()).forEach(([token, data], i) => {
    const angle = (2 * Math.PI * i) / poolCount;
    const weightedScore = poolBias * data.connections + (1 - poolBias) * Math.log10(data.total + 1);

    poolNodes.push({
      id: token,
      label: shortMe(token),
      x: cx + poolRadius * Math.cos(angle),
      y: cy + poolRadius * Math.sin(angle),
      type: "token",
      weight: weightedScore,
    });
  });

  // edges
  wallets.forEach((w) => {
    w.balances.forEach((usd, token) => {
      edges.push({ source: w.address, target: token });
    });
  });

  return { walletNodes, poolNodes, edges };
}

function render(): void {
  const { walletNodes, poolNodes, edges } = layoutNodes();

  const allNodes = [...walletNodes, ...poolNodes];
  const nodeIndex = new Map<string, number>(
    allNodes.map((n, i) => [n.id, i])
  );

  const edgeTrace: {
    x: (number | null)[];
    y: (number | null)[];
    mode: string;
    line: { color: string; width: number };
    hoverinfo: string;
  } = {
    x: [],
    y: [],
    mode: "lines",
    line: { color: "#999", width: 1 },
    hoverinfo: "none",
  };

  edges.forEach((e) => {
    const s = allNodes[nodeIndex.get(e.source)!];
    const t = allNodes[nodeIndex.get(e.target)!];
    if (s && t) {
      edgeTrace.x.push(s.x, t.x, null);
      edgeTrace.y.push(s.y, t.y, null);
    }
  });

  const nodeTrace = {
    x: allNodes.map((n) => n.x),
    y: allNodes.map((n) => n.y),
    mode: "markers+text" as const,
    text: allNodes.map((n) => n.label),
    textposition: "top center" as const,
    marker: {
      size: allNodes.map((n) =>
        n.type === "wallet" ? 16 : 20 + (n.weight ?? 1) * 4
      ),
      color: allNodes.map((n) => (n.type === "wallet" ? "green" : "blue")),
      opacity: 0.9,
    },
    hoverinfo: "text" as const,
  };

  const networkElement = document.getElementById("network");
  if (!networkElement) {
    console.error("Network element not found");
    return;
  }

  Plotly.newPlot("network", [edgeTrace, nodeTrace], {
    xaxis: { showgrid: false, zeroline: false, showticklabels: false },
    yaxis: { showgrid: false, zeroline: false, showticklabels: false },
    margin: { l: 0, r: 0, b: 0, t: 0 },
    hovermode: "closest",
  });

  if (networkElement.on) {
    networkElement.on("plotly_click", (data: PlotlyClickEvent) => {
      const pointIndex = data.points[0]?.pointIndex;
      if (pointIndex === undefined) return;
      const node = allNodes[pointIndex];
      if (node) {
        navigator.clipboard.writeText(node.id).then(() => {
          alert(`Copied: ${node.id}`);
        });
      }
    });
  }
}

// Initialize the app
runSailfish()
render();

