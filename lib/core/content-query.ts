// Filter, cari, urut, dan paginasi daftar konten (murni, diuji).
export type PublishStatus = "draft" | "published" | "archived";

export interface ListRow {
  id: string;
  title: string;
  slug: string;
  publishStatus: PublishStatus;
  updatedAt: number | null;
  extra: string;
}

export interface ListQuery {
  q?: string;
  status?: PublishStatus | "all";
  page?: number;
  pageSize?: number;
}

export interface ListResult {
  items: ListRow[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
  counts: Record<PublishStatus | "all", number>;
}

export const MAX_PAGE_SIZE = 50;

const norm = (s: string) => s.toLocaleLowerCase("id-ID").normalize("NFKD").replace(/[̀-ͯ]/g, "");

export function parseListQuery(params: URLSearchParams): Required<ListQuery> {
  const status = params.get("status");
  const page = Number.parseInt(params.get("page") ?? "1", 10);
  const size = Number.parseInt(params.get("pageSize") ?? "20", 10);
  return {
    q: (params.get("q") ?? "").trim().slice(0, 100),
    status: status === "draft" || status === "published" || status === "archived" ? status : "all",
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(size) ? Math.min(Math.max(size, 1), MAX_PAGE_SIZE) : 20,
  };
}

export function queryRows(rows: ListRow[], query: Required<ListQuery>): ListResult {
  const counts = { all: rows.length, draft: 0, published: 0, archived: 0 };
  for (const r of rows) counts[r.publishStatus]++;

  const needle = norm(query.q);
  const filtered = rows
    .filter((r) => query.status === "all" || r.publishStatus === query.status)
    .filter((r) => !needle || norm(`${r.title} ${r.slug} ${r.extra}`).includes(needle))
    .sort((a, b) => (b.updatedAt ?? 0) - (a.updatedAt ?? 0) || a.title.localeCompare(b.title, "id"));

  const pageCount = Math.max(1, Math.ceil(filtered.length / query.pageSize));
  const page = Math.min(query.page, pageCount);
  const start = (page - 1) * query.pageSize;
  return { items: filtered.slice(start, start + query.pageSize), total: filtered.length, page, pageSize: query.pageSize, pageCount, counts };
}
