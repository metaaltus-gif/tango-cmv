export type ClassificationMode = "item_by_item" | "force_all_to" | "allowed_split";

export type ProductType = "FOOD" | "SALMON" | "DRINK" | "OTHER" | "SUPPLIES" | "EQUIPMENT" | "FURNITURE" | "TAXES";

export interface SupplierRule {
  id: number;
  organization_id: number;
  supplier_name: string;
  classification_mode: ClassificationMode;
  force_product_type: string | null;
  allowed_product_types: string[] | null;
  default_payment_method: string | null;
  supplies_count_as_cmv: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CmvRule {
  id: number;
  organization_id: number;
  category: string;
  subcategory: string | null;
  is_cmv: boolean;
  label: string | null;
  notes: string | null;
  created_at: string;
}

export interface InvoiceSummary {
  invoice_date: string;
  supplier_name: string;
  total: number;
  is_cmv_total: number;
}

export interface WeekSummary {
  week_start: string;
  week_end: string;
  total_invoices: number;
  total_cmv: number;
  total_non_cmv: number;
  salmon_lbs: number;
  salmon_usd: number;
}
