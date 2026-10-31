"use client";
import { useEffect, useRef, useState } from "react";

/**
 * Where the FastAPI backend lives.
 *
 * "localhost" only works on the computer running the backend: on a phone it
 * points at the phone itself. Default to the same host that served this page
 * (e.g. http://192.168.1.20:3000 -> http://192.168.1.20:8001), and allow an
 * override with NEXT_PUBLIC_API_BASE for a deployed backend.
 */
function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_BASE) return process.env.NEXT_PUBLIC_API_BASE.replace(/\/$/, "");
  if (typeof window === "undefined") return "http://localhost:8001";
  return `${window.location.protocol}//${window.location.hostname}:8001`;
}

const RECENT_KEY = "gc-prices:recent";
const SEARCH_TIMEOUT_MS = 150_000;

const STORES = ["Mercadona", "HiperDino", "Carrefour", "Spar"] as const;

const STORE_COLORS: Record<string, string> = {
  Mercadona: "#16A34A",
  HiperDino: "#22C55E",
  Carrefour: "#2563EB",
  Spar: "#DC2626",
};

const STORE_ICONS: Record<string, string> = {
  Mercadona: "🟢",
  HiperDino: "🟩",
  Carrefour: "🔵",
  Spar: "🔴",
};

interface Product {
  store: string;
  title: string;
  price: string;
  unit_price: string;
  image_url: string;
  original_price: string;
  is_on_sale: boolean;
  spec_detail: string;
  parsed_price: number;
  relevance_score: number;
  nearest_branch: string;
  distance_km: number;
}

interface GroupedResult {
  spec_key: string;
  group_relevance: number;
  group_cheapest_price: number;
  products: Record<string, Product | null>;
}

interface ApiResponse {
  query: string;
  region_zip: string;
  total_results: number;
  total_groups: number;
  grouped_results: GroupedResult[];
  data: Product[];
  /** Per store: number of items, or "error" / "timeout". Newer backends only. */
  store_status?: Record<string, number | string>;
  cached?: boolean;
}

// ─── Subcomponents ───

function ProductImage({ product }: { product: Product | null }) {
  const [imgError, setImgError] = useState(false);
  const url = product?.image_url;

  if (!url || imgError) {
    return (
      <div className="product-thumb-placeholder">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={url}
      alt={product?.title || "Product"}
      className="product-thumb"
      onError={() => setImgError(true)}
      loading="lazy"
    />
  );
}

function StoreLabel({ store }: { store: string }) {
  // Only shown in the phone layout, where the column headers are hidden.
  return (
    <div className="matrix-store-label">
      <span className="store-dot" style={{ background: STORE_COLORS[store] }} />
      {store}
    </div>
  );
}

function PriceCell({ product, store }: { product: Product | null; store: string }) {
  if (!product) {
    return (
      <div className="matrix-cell matrix-cell--empty">
        <StoreLabel store={store} />
        <span className="text-[var(--text-muted)] text-sm">No listing</span>
      </div>
    );
  }

  return (
    <div className="matrix-cell">
      <StoreLabel store={store} />
      <div className="flex flex-col gap-2">
        {product.is_on_sale && (
          <div className="animate-slide-in">
            <span className="sale-tag animate-pulse-sale">🔥 SALE</span>
          </div>
        )}

        <div className="flex items-baseline gap-2 flex-wrap">
          {product.is_on_sale && product.original_price && (
            <span className="price-original">{product.original_price}</span>
          )}
          <span className={`price-display ${product.is_on_sale ? "price-display--sale" : ""}`}>
            €{product.parsed_price?.toFixed(2) ?? product.price?.replace("€", "").trim()}
          </span>
        </div>

        {product.unit_price && (
          <span className="text-xs text-[var(--text-muted)] font-medium">{product.unit_price}</span>
        )}
      </div>
    </div>
  );
}

function SkeletonRows() {
  return (
    <div className="space-y-3">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton-row" style={{ animationDelay: `${i * 100}ms` }}>
          <div className="skeleton-cell">
            <div className="flex gap-3 items-center">
              <div className="w-14 h-14 rounded-lg animate-shimmer skeleton-bar" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-3/4 animate-shimmer skeleton-bar" />
                <div className="h-3 w-1/3 animate-shimmer skeleton-bar" />
              </div>
            </div>
          </div>
          {[...Array(4)].map((_, j) => (
            <div key={j} className="skeleton-cell">
              <div className="space-y-2">
                <div className="h-6 w-20 animate-shimmer skeleton-bar" />
                <div className="h-3 w-16 animate-shimmer skeleton-bar" />
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function StatsBar({ data }: { data: ApiResponse }) {
  const storeCount = STORES.filter(
    (s) => data.grouped_results.some((g) => g.products[s] !== null)
  ).length;
  const failedStores = Object.entries(data.store_status ?? {})
    .filter(([, v]) => typeof v === "string")
    .map(([store]) => store);

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2 items-center text-sm text-[var(--text-secondary)]">
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[var(--accent-blue)]" />
        <span><strong className="text-[var(--text-primary)]">{data.total_results}</strong> products</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[var(--accent-purple)]" />
        <span><strong className="text-[var(--text-primary)]">{data.total_groups}</strong> groups</span>
      </div>
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[var(--accent-indigo)]" />
        <span><strong className="text-[var(--text-primary)]">{storeCount}</strong> stores responding</span>
      </div>
      {failedStores.length > 0 && (
        <div className="flex items-center gap-2 text-[var(--sale-red)]">
          <div className="w-2 h-2 rounded-full bg-[var(--sale-red)]" />
          <span>No response: {failedStores.join(", ")}</span>
        </div>
      )}
      {data.cached && <span className="text-xs text-[var(--text-muted)]">(cached)</span>}
      {data.grouped_results.length > 0 && (
        <div className="sm:ml-auto text-xs font-medium text-[var(--text-muted)]">
          Best price: <span className="text-[var(--mercadona)] font-bold">€{data.grouped_results[0]?.group_cheapest_price?.toFixed(2)}</span>
        </div>
      )}
    </div>
  );
}

// ─── Main Page ───

export default function Home() {
  const [query, setQuery] = useState("");
  const [zip, setZip] = useState("35001");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ApiResponse | null>(null);
  const [error, setError] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Typing on a phone is slow: keep the last few searches as one-tap chips.
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(RECENT_KEY) || "[]");
      if (Array.isArray(saved)) setRecent(saved.filter((x) => typeof x === "string").slice(0, 8));
    } catch {
      /* storage unavailable: no chips */
    }
  }, []);

  const remember = (q: string) => {
    setRecent((prev) => {
      const next = [q, ...prev.filter((x) => x.toLowerCase() !== q.toLowerCase())].slice(0, 8);
      try {
        localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  };

  const handleSearch = async (e?: React.FormEvent, overrideQuery?: string) => {
    if (e) e.preventDefault();
    const q = (overrideQuery ?? query).trim();
    if (q.length < 2) return;

    // A new search cancels the previous one instead of racing it.
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const timer = setTimeout(() => controller.abort(), SEARCH_TIMEOUT_MS);

    (document.activeElement as HTMLElement | null)?.blur?.(); // close the phone keyboard
    setLoading(true);
    setError("");
    setData(null);
    const apiBase = getApiBase();

    try {
      const res = await fetch(
        `${apiBase}/api/search?q=${encodeURIComponent(q)}&zip_code=${encodeURIComponent(zip.trim() || "35001")}`,
        { signal: controller.signal }
      );
      if (!res.ok) throw new Error(`Search failed (HTTP ${res.status}).`);
      const json: ApiResponse = await res.json();
      setData(json);
      remember(q);
    } catch (err: unknown) {
      if (controller.signal.aborted && abortRef.current !== controller) return; // superseded
      if (controller.signal.aborted) {
        setError("The search took too long. Try again, or try a shorter product name.");
      } else if (err instanceof TypeError) {
        setError(`Can't reach the backend at ${apiBase}. Is it running and reachable from this device?`);
      } else {
        setError(err instanceof Error ? err.message : "Something went wrong.");
      }
    } finally {
      clearTimeout(timer);
      if (abortRef.current === controller) setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same photo again
    if (!file) return;

    setLoading(true);
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(`${getApiBase()}/api/process-image`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) throw new Error("Processing image failed");
      const imgData = await res.json();

      const newQuery = `${imgData.brand} ${imgData.name} ${imgData.weight}`.trim();
      setQuery(newQuery);
      await handleSearch(undefined, newQuery);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to process image.");
      setLoading(false);
    }
  };

  // Find the best (cheapest) product in a group for the product info column
  const getBestProduct = (group: GroupedResult): Product | null => {
    let best: Product | null = null;
    for (const s of STORES) {
      const p = group.products[s];
      if (p && (!best || p.parsed_price < best.parsed_price)) {
        best = p;
      }
    }
    return best;
  };

  // Find cheapest store in group for highlighting
  const getCheapestStore = (group: GroupedResult): string | null => {
    let cheapest: Product | null = null;
    for (const s of STORES) {
      const p = group.products[s];
      if (p && (!cheapest || p.parsed_price < cheapest.parsed_price)) {
        cheapest = p;
      }
    }
    return cheapest?.store ?? null;
  };

  return (
    <main className="min-h-screen p-4 md:p-8" style={{ background: "var(--bg-primary)", paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
      <div className="max-w-[1400px] mx-auto space-y-6 md:space-y-8">

        {/* ── Header ── */}
        <header className="text-center space-y-3 pt-2 md:pt-8 pb-2 md:pb-4">
          <div className="flex items-center justify-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent-purple)] flex items-center justify-center text-white text-xl font-black shadow-lg">
              C
            </div>
          </div>
          <h1 className="text-3xl md:text-5xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
            Gran Canaria Price Comparator
          </h1>
          <p className="text-[var(--text-secondary)] font-medium max-w-2xl mx-auto text-base leading-relaxed">
            Compare groceries across <strong className="text-[var(--text-primary)]">Mercadona</strong>,{" "}
            <strong className="text-[var(--text-primary)]">HiperDino</strong>,{" "}
            <strong className="text-[var(--text-primary)]">Carrefour</strong> &{" "}
            <strong className="text-[var(--text-primary)]">Spar</strong> in Las Palmas — instantly.
          </p>
        </header>

        {/* ── Search Bar ── */}
        <div
          className="rounded-2xl p-4 md:p-5 max-w-3xl mx-auto border"
          style={{
            background: "var(--bg-secondary)",
            borderColor: "var(--border)",
          }}
        >
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3">
            <div className="flex-1">
              <input
                id="search-query"
                type="search"
                enterKeyHint="search"
                autoComplete="off"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products (e.g., Cerveza Tropical)..."
                className="search-input w-full px-5 py-3.5 rounded-xl text-base font-medium"
                disabled={loading}
              />
            </div>

            <div className="flex gap-3 md:contents">
            <div className="w-28 md:w-32 shrink-0">
              <input
                id="search-zip"
                type="text"
                inputMode="numeric"
                maxLength={5}
                aria-label="Postal code"
                value={zip}
                onChange={(e) => setZip(e.target.value)}
                placeholder="Postal"
                className="search-input w-full text-center py-3.5 rounded-xl text-base font-semibold"
                disabled={loading}
              />
            </div>

            <button
              id="search-submit"
              type="submit"
              className="flex-1 md:flex-none px-7 py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-base font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-all active:scale-[0.97] disabled:opacity-40 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed"
              disabled={loading || query.trim().length < 2}
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Scanning...
                </span>
              ) : (
                "Compare"
              )}
            </button>

            {/* Camera Upload */}
            <div className="relative flex items-center justify-center">
              <input
                id="image-upload"
                type="file"
                accept="image/*"
                ref={fileRef}
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                title="Upload Product Photo"
                aria-label="Search by product photo"
                disabled={loading}
              />
              <div
                className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                  loading
                    ? "opacity-40"
                    : "hover:border-[var(--accent-indigo)] hover:bg-[rgba(99,102,241,0.08)]"
                }`}
                style={{ borderColor: "var(--border)" }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--text-secondary)]">
                  <path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z" />
                  <circle cx="12" cy="13" r="3" />
                </svg>
              </div>
            </div>
            </div>
          </form>

          {recent.length > 0 && !loading && (
            <div className="mt-3 flex flex-wrap gap-2">
              {recent.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => {
                    setQuery(r);
                    handleSearch(undefined, r);
                  }}
                  className="px-3 py-1.5 rounded-full text-xs font-semibold border text-[var(--text-secondary)] hover:text-[var(--text-primary)] active:scale-95 transition"
                  style={{ borderColor: "var(--border-hover)" }}
                >
                  {r}
                </button>
              ))}
            </div>
          )}

          {error && (
            <p className="text-[var(--sale-red)] mt-4 text-center font-semibold text-sm animate-pulse">
              {error}
            </p>
          )}
        </div>

        {/* ── Stats Bar ── */}
        {data && !loading && (
          <div className="animate-fade-in-up">
            <StatsBar data={data} />
          </div>
        )}

        {/* ── Loading Skeletons ── */}
        {loading && (
          <div className="matrix-scroll-wrapper">
            <SkeletonRows />
          </div>
        )}

        {/* ── Comparison Matrix ── */}
        {data && !loading && data.grouped_results.length > 0 && (
          <div className="space-y-3 animate-fade-in-up">
            {/* Matrix Header */}
            <div className="matrix-scroll-wrapper">
              <div className="matrix-header">
                <div className="matrix-header-cell">Product</div>
                {STORES.map((store) => (
                  <div key={store} className="matrix-header-cell">
                    <div
                      className="store-dot"
                      style={{ background: STORE_COLORS[store] }}
                    />
                    {store}
                  </div>
                ))}
              </div>

              {/* Matrix Rows */}
              <div className="space-y-2">
                {data.grouped_results.map((group, idx) => {
                  const bestProduct = getBestProduct(group);
                  const cheapestStore = getCheapestStore(group);

                  return (
                    <div
                      key={`${group.spec_key}-${idx}`}
                      className="matrix-row animate-fade-in-up"
                      style={{ animationDelay: `${Math.min(idx, 10) * 60}ms` }}
                    >
                      {/* Product Info Column */}
                      <div className="matrix-cell matrix-cell--product">
                        <ProductImage product={bestProduct} />
                        <div className="flex flex-col gap-1.5 min-w-0">
                          <h3
                            className="text-sm font-bold text-[var(--text-primary)] leading-snug line-clamp-2"
                            title={group.spec_key}
                          >
                            {bestProduct?.title || group.spec_key}
                          </h3>
                          <div className="flex flex-wrap gap-1.5 items-center">
                            {(bestProduct?.spec_detail || "") && (
                              <span className="spec-badge">
                                {bestProduct?.spec_detail}
                              </span>
                            )}
                            {group.group_relevance >= 80 && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[rgba(34,197,94,0.12)] text-[#4ADE80] border border-[rgba(34,197,94,0.2)]">
                                Best Match
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Store Price Columns */}
                      {STORES.map((store) => {
                        const product = group.products[store];
                        const isCheapest = cheapestStore === store && product !== null;
                        return (
                          <div key={store} className="relative matrix-store">
                            {isCheapest && (
                              <div
                                className="absolute top-2 right-2 text-[9px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded"
                                style={{
                                  background: "rgba(34, 197, 94, 0.15)",
                                  color: "#4ADE80",
                                }}
                              >
                                Cheapest
                              </div>
                            )}
                            <PriceCell product={product} store={store} />
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── Empty State ── */}
        {data && !loading && data.grouped_results.length === 0 && (
          <div className="text-center py-16 animate-fade-in-up">
            <div className="text-5xl mb-4">🛒</div>
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              No products found
            </h3>
            <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
              Try a different search term or check if the supermarket websites are accessible.
            </p>
          </div>
        )}

        {/* ── Footer ── */}
        <footer className="text-center py-8 text-xs text-[var(--text-muted)]">
          <p>
            Prices scraped in real-time from Mercadona, HiperDino, Carrefour & Spar.
          </p>
        </footer>
      </div>
    </main>
  );
}
