export const RECORD_STATUS_OPTIONS = [
  { value: "DRAFT", label: "草稿" },
  { value: "UNFILLED", label: "未填写" },
  { value: "SUBMITTED", label: "已提交" },
  { value: "PENDING_WITHDRAWAL", label: "撤回审核中" },
  { value: "APPROVED", label: "已审核通过" },
  { value: "REJECTED", label: "已拒绝" },
] as const;

export type RecordStatusType = typeof RECORD_STATUS_OPTIONS[number]["value"];