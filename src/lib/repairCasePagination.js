const POSTGREST_RANGE_NOT_SATISFIABLE = "PGRST103";

export function isRepairCasePageOutOfRangeError(error, currentPage) {
  return (
    Number.isInteger(currentPage) &&
    currentPage > 1 &&
    error?.code === POSTGREST_RANGE_NOT_SATISFIABLE
  );
}
