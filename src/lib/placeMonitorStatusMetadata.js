// Compact metadata in the existing JSONB status column. No schema migration.
const ID = /^[a-z0-9][a-z0-9-]{0,63}$/u;
export function normalizeSensorRegistry(value) {
  if (!Array.isArray(value) || value.length > 256) return null;
  const seen = new Set();
  const rows = value.map(row => {
    if (!Array.isArray(row) || row.length !== 2 || typeof row[0] !== 'string' || !ID.test(row[0]) ||
        seen.has(row[0]) || typeof row[1] !== 'string' || !row[1].length || row[1].length > 120) return null;
    seen.add(row[0]); return [row[0],row[1]];
  });
  return rows.every(Boolean) ? rows.sort((a,b)=>a[0].localeCompare(b[0])) : null;
}
const date = v => typeof v === 'string' && v.length <= 40 && !Number.isNaN(Date.parse(v));
export function normalizeRuntimeStatus(value) {
  if (!value || !date(value.checked_at) || !Array.isArray(value.branches) || value.branches.length > 8) return null;
  const seen = new Set();
  const branches = value.branches.map(b => {
    const t=b?.trigger;
    if (!b || !['seolleung','gangbyeon'].includes(b.branch_id) || seen.has(b.branch_id) ||
        (b.next_due_at !== null && !date(b.next_due_at)) ||
        (b.next_sensor_id !== null && (typeof b.next_sensor_id !== 'string' || !ID.test(b.next_sensor_id))) ||
        ![true,false,null].includes(b.auto_enabled) || ![true,false,null].includes(b.paused_today) ||
        typeof b.schedule_confirmed !== 'boolean' || !t || !date(t.checked_at) ||
        !['REGISTERED','UNCONFIRMED','NOT_REGISTERED'].includes(t.status) ||
        typeof t.label !== 'string' || t.label.length > 128 ||
        !Array.isArray(t.calendar) || t.calendar.length > 16 ||
        (t.poll_interval_seconds !== null && (!Number.isInteger(t.poll_interval_seconds) || t.poll_interval_seconds < 1))) return null;
    const calendar=t.calendar.map(entry=>{
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return null;
      const out={};
      for (const [k,v] of Object.entries(entry)) {
        const bounds={Hour:[0,23],Minute:[0,59],Weekday:[0,7],Day:[1,31],Month:[1,12]}[k];
        if (!bounds || !Number.isInteger(v) || v < bounds[0] || v > bounds[1]) return null;
        out[k]=v;
      }
      return out;
    });
    if (!calendar.every(Boolean)) return null;
    seen.add(b.branch_id);
    return {branch_id:b.branch_id,next_due_at:b.next_due_at?new Date(b.next_due_at).toISOString():null,
      next_sensor_id:b.next_sensor_id,auto_enabled:b.auto_enabled,paused_today:b.paused_today,
      schedule_confirmed:b.schedule_confirmed,trigger:{label:t.label,status:t.status,
        checked_at:new Date(t.checked_at).toISOString(),calendar,poll_interval_seconds:t.poll_interval_seconds}};
  });
  return branches.every(Boolean)?{checked_at:new Date(value.checked_at).toISOString(),branches}:null;
}
export function encodeObserverStatus(status) {
  const {sensor_registry,registered_sensor_ids:unused,runtime_status,...stored}=status;
  if (!sensor_registry) return stored;
  const metadata={version:2,tasks:stored.schedule_tasks,registry:sensor_registry,runtime:runtime_status||null};
  // PostgreSQL JSONB text adds whitespace after separators. Adding it even in
  // string values is a conservative bound, preserving the existing constraint.
  if (Buffer.byteLength(JSON.stringify(metadata).replace(/[:,]/gu,'$& '),'utf8') > 12000)
    throw new Error('OBSERVER_METADATA_STORAGE_BUDGET');
  return {...stored,schedule_tasks:metadata};
}
export function decodeObserverStatus(status) {
  if (!status || Array.isArray(status.schedule_tasks)) return status;
  const metadata=status.schedule_tasks;
  const registry=normalizeSensorRegistry(metadata?.registry);
  return {...status,schedule_tasks:Array.isArray(metadata?.tasks)?metadata.tasks:[],
    sensor_registry:registry,registered_sensor_ids:registry?.map(x=>x[0])||null,
    runtime_status:normalizeRuntimeStatus(metadata?.runtime)};
}
