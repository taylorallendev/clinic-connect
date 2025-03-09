"use server";

import { createClient } from "@/utils/supabase/server";

// Case type definitions
export type CaseStatus = "draft" | "in_progress" | "completed";
export type CaseType = "checkup" | "emergency" | "surgery" | "follow_up";

export interface Case {
  id: number;
  name: string;
  dateTime: string;
  type: CaseType;
  status: CaseStatus;
  assignedToId?: string;
  assignedToName?: string;
  patientId?: number;
  patientName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

export interface CasesResponse {
  data: Case[];
  meta: PaginationMeta;
}

export interface FetchCasesParams {
  search?: string;
  status?: CaseStatus[];
  type?: CaseType[];
  assignedToId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  page?: number;
  pageSize?: number;
  tab?: string;
}

/**
 * Fetches cases from the database with filtering, sorting, and pagination
 */
export async function fetchCases(
  params: FetchCasesParams = {}
): Promise<CasesResponse> {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      throw new Error("Unauthorized");
    }

    // Build query
    let query = supabase.from("cases").select("*", { count: "exact" });

    // Apply filters
    if (params.search) {
      query = query.or(
        `name.ilike.%${params.search}%, patient_name.ilike.%${params.search}%`
      );
    }

    if (params.status && params.status.length > 0) {
      query = query.in("status", params.status);
    }

    if (params.type && params.type.length > 0) {
      query = query.in("type", params.type);
    }

    if (params.assignedToId) {
      query = query.eq("assigned_to_id", params.assignedToId);
    }

    if (params.dateFrom) {
      query = query.gte("date_time", params.dateFrom);
    }

    if (params.dateTo) {
      query = query.lte("date_time", params.dateTo);
    }

    // Special handling for tabs
    if (params.tab === "my") {
      query = query.eq("assigned_to_id", user.id);
    } else if (params.tab === "draft") {
      query = query.eq("status", "draft");
    } else if (params.tab === "recent") {
      // Default sort for recent tab
      params.sortBy = "updated_at";
      params.sortOrder = "desc";
    }

    // Apply sorting
    const sortBy = params.sortBy || "date_time";
    const sortOrder = params.sortOrder || "desc";
    query = query.order(sortBy, { ascending: sortOrder === "asc" });

    // Apply pagination
    const page = params.page || 1;
    const pageSize = params.pageSize || 10;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    // Execute query
    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching cases:", error);
      throw new Error(error.message);
    }

    // Transform data to match the expected format
    const cases = data.map((item) => ({
      id: item.id,
      name: item.name,
      dateTime: item.date_time,
      type: item.type as CaseType,
      status: item.status as CaseStatus,
      assignedToId: item.assigned_to_id,
      assignedToName: item.assigned_to_name,
      patientId: item.patient_id,
      patientName: item.patient_name,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
    }));

    // Calculate pagination metadata
    const total = count || cases.length;
    const pageCount = Math.ceil(total / pageSize);

    return {
      data: cases,
      meta: {
        total,
        page,
        pageSize,
        pageCount,
      },
    };
  } catch (error) {
    console.error("Failed to fetch cases:", error);
    return {
      data: [],
      meta: {
        total: 0,
        page: 1,
        pageSize: 10,
        pageCount: 0,
      },
    };
  }
}
