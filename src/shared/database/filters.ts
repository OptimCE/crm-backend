import {ObjectLiteral, SelectQueryBuilder} from "typeorm";
import type {Sort} from "../dtos/query.dtos.js";

export type FilterDef<T extends ObjectLiteral> = {
  key: string;
  apply: (qb: SelectQueryBuilder<T>, val: unknown) => void;
  parse?: (val: unknown) => unknown;
};

export type SortDef<T extends ObjectLiteral> = {
  key: string; // The property name in your DTO (e.g., 'sort_name')
  // The function to execute if this key is present in the DTO
  apply: (qb: SelectQueryBuilder<T>, direction: Sort) => void;
};

export function add(qb: SelectQueryBuilder<any>, sql: string, params?: Record<string, unknown>) {
  const hasWhere = (qb as any).expressionMap.wheres.length > 0;
  return hasWhere ? qb.andWhere(sql, params) : qb.where(sql, params);
}

export function applyFilters<TEntity extends ObjectLiteral, TQuery>(
    filters: FilterDef<TEntity>[],
    qb: SelectQueryBuilder<TEntity>,
    q: TQuery // Accepts your DTO class directly
) {
  for (const f of filters) {
    // Safe access to the DTO property
    const raw = (q as any)[f.key];

    if (raw === undefined || raw === null || raw === "") continue;
    const val = f.parse ? f.parse(raw) : raw;
    f.apply(qb, val);
  }
  return qb;
}

export function applySorts<TEntity extends ObjectLiteral, TQuery>(
    sorts: SortDef<TEntity>[],
    qb: SelectQueryBuilder<TEntity>,
    q: TQuery
) {
  for (const s of sorts) {
    // Access the DTO property (e.g., q.sort_name)
    const direction = (q as any)[s.key];

    // Only apply if the value is explicitly ASC or DESC
    if (direction === 'ASC' || direction === 'DESC') {
      s.apply(qb, direction);
    }
  }
  return qb;
}