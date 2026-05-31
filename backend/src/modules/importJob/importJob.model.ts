import { pool } from "../../config/db";

export type ImportJobStatus = "running" | "success" | "partial" | "failed";

export interface ImportJob {
  id: number;
  store_id: number;
  source_id: number | null;
  job_type: string;
  status: ImportJobStatus;
  imported_count: number;
  updated_count: number;
  failed_count: number;
  error_message: string | null;
  started_at: string;
  completed_at: string | null;
}

export async function createImportJob(input: {
  store_id: number;
  source_id?: number | null;
  job_type: string;
}): Promise<ImportJob> {
  const result = await pool.query<ImportJob>(
    `
      INSERT INTO import_jobs (store_id, source_id, job_type, status)
      VALUES ($1, $2, $3, 'running')
      RETURNING
        id, store_id, source_id, job_type, status,
        imported_count, updated_count, failed_count,
        error_message,
        started_at::text AS started_at,
        completed_at::text AS completed_at
    `,
    [input.store_id, input.source_id ?? null, input.job_type],
  );

  return result.rows[0];
}

export async function completeImportJob(
  jobId: number,
  input: {
    status: ImportJobStatus;
    imported_count: number;
    updated_count: number;
    failed_count: number;
    error_message?: string | null;
  },
): Promise<void> {
  await pool.query(
    `
      UPDATE import_jobs
      SET status = $1,
          imported_count = $2,
          updated_count = $3,
          failed_count = $4,
          error_message = $5,
          completed_at = NOW()
      WHERE id = $6
    `,
    [
      input.status,
      input.imported_count,
      input.updated_count,
      input.failed_count,
      input.error_message ?? null,
      jobId,
    ],
  );
}

export async function listRecentImportJobs(limit = 20): Promise<ImportJob[]> {
  const result = await pool.query<ImportJob>(
    `
      SELECT
        id, store_id, source_id, job_type, status,
        imported_count, updated_count, failed_count,
        error_message,
        started_at::text AS started_at,
        completed_at::text AS completed_at
      FROM import_jobs
      ORDER BY started_at DESC
      LIMIT $1
    `,
    [limit],
  );

  return result.rows;
}

export async function listImportJobsByStore(
  storeId: number,
  limit = 10,
): Promise<ImportJob[]> {
  const result = await pool.query<ImportJob>(
    `
      SELECT
        id, store_id, source_id, job_type, status,
        imported_count, updated_count, failed_count,
        error_message,
        started_at::text AS started_at,
        completed_at::text AS completed_at
      FROM import_jobs
      WHERE store_id = $1
      ORDER BY started_at DESC
      LIMIT $2
    `,
    [storeId, limit],
  );

  return result.rows;
}
