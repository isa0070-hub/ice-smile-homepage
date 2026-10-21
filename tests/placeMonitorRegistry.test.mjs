import assert from 'node:assert/strict';
import test from 'node:test';
import {buildPlaceMonitorDashboard} from '../src/lib/placeMonitorDashboard.js';
import {normalizePlaceMonitorSyncPayload} from '../src/lib/placeMonitorContract.js';
import {encodeObserverStatus,decodeObserverStatus,normalizeSensorRegistry,normalizeRuntimeStatus} from '../src/lib/placeMonitorStatusMetadata.js';
import {createPlaceMonitorPacketSnapshot,buildPlaceMonitorAnalysisPacket} from '../src/lib/placeMonitorAnalysisPacket.js';
const now=new Date('2026-10-21T23:30:00+09:00');
const registry=Array.from({length:57},(_,i)=>['sensor-'+i,'관측 센서 '+i]);
const measurements=Array.from({length:54},(_,i)=>({measurement_id:'mea_'+i.toString(16).padStart(16,'0'),sensor_id:'sensor-'+i,
 query:'관측 센서 '+i,result_surface:'unified_search_place',measured_at:i<17?'2026-10-21T10:00:00+09:00':'2026-10-20T10:00:00+09:00',
 measurement_status:'VALID',observed_n:5,target_found:true,organic_rank:1,error_summary:null,checkpoint:null,experiment_id:null,source_version:'0.13.1',search_conditions:{}}));
const runtime={checked_at:now.toISOString(),branches:['seolleung','gangbyeon'].map(branch_id=>({branch_id,next_due_at:'2026-10-22T10:00:00+09:00',next_sensor_id:'sensor-0',auto_enabled:true,paused_today:false,schedule_confirmed:true,
 trigger:{label:'fixture.'+branch_id,status:'UNCONFIRMED',checked_at:now.toISOString(),calendar:[],poll_interval_seconds:null}}))};
const fixture={measurements,observer_status:{source_id:'seolleung-place-observer-v13',source_version:'0.13.1',generated_at:now.toISOString(),phase:'AUTO_OBSERVATION_ENABLED',schedule_tasks:[],sensor_registry:registry,runtime_status:runtime}};

test('existing records: all registered sensors survive latest selection, including old and unmeasured',()=>{
 const status=fixture.observer_status;
 const d=buildPlaceMonitorDashboard(fixture.measurements,now,status.sensor_registry);
 assert.deepEqual(d.coverage,{registered_count:57,included_count:57,measured_count:54,today_count:17,older_count:37,unmeasured_count:3,unknown_time_count:0,registry_received:true});
 assert.equal(new Set(d.sensors.map(x=>x.sensor_id)).size,57);
 const latest=new Map();for(const x of fixture.measurements)if(!latest.has(x.sensor_id)||Date.parse(x.measured_at)>Date.parse(latest.get(x.sensor_id).measured_at))latest.set(x.sensor_id,x);
 for(const s of d.sensors)assert.equal(s.last_attempt?.measurement_id,latest.get(s.sensor_id)?.measurement_id);
});
test('registry count is dynamic, duplicate registry is rejected, unknown registry is not declared complete',()=>{
 assert.equal(buildPlaceMonitorDashboard([],now,[['one','첫 센서'],['two','둘째 센서']]).coverage.unmeasured_count,2);
 assert.equal(normalizeSensorRegistry([['same','a'],['same','b']]),null);
 assert.equal(buildPlaceMonitorDashboard([],now).coverage.registered_count,null);
 assert.equal(normalizeRuntimeStatus({checked_at:'not-a-date',branches:[]}),null);
});
test('new status roundtrips through current bounded JSONB column, without schema or credential additions',()=>{
 const normalized=normalizePlaceMonitorSyncPayload({items:[],observer_status:fixture.observer_status});assert.ok(normalized);
 const stored=encodeObserverStatus(normalized.observerStatus);const decoded=decodeObserverStatus(stored);
 assert.equal(decoded.sensor_registry.length,57);assert.equal(decoded.registered_sensor_ids.length,57);
 assert.equal(decoded.runtime_status.branches.length,2);
 assert.ok(Buffer.byteLength(JSON.stringify(stored.schedule_tasks).replace(/[:,]/gu,'$& '))<=12000);
 assert.equal(normalizePlaceMonitorSyncPayload({items:[],observer_status:{...fixture.observer_status,runtime_status:{checked_at:'invalid',branches:[]}}}),null);
});
test('packet keeps the complete registry, original statuses and ID uniqueness, with no false today claim',()=>{
 const dashboard={...buildPlaceMonitorDashboard(fixture.measurements,now,fixture.observer_status.sensor_registry),observer_status:fixture.observer_status};
 const snapshot=createPlaceMonitorPacketSnapshot({dashboard,copiedAt:now,history:fixture.measurements.slice(-4)});
 assert.equal(snapshot.sensors.length,57);assert.equal(snapshot.coverage.today_count,17);assert.equal(snapshot.coverage.older_count,37);assert.equal(snapshot.coverage.unmeasured_count,3);
 assert.equal(new Set(snapshot.held_measurements.map(x=>x.measurement_id)).size,snapshot.held_measurements.length);
 const packet=buildPlaceMonitorAnalysisPacket(snapshot);assert.match(packet,/등록 전체\/포함: 57 \/ 57/);assert.match(packet,/오늘 17 \/ 과거 37 \/ 미관측 3/);assert.match(packet,/관측 상태: 미관측/);
 for(const [id] of fixture.observer_status.sensor_registry)assert.ok(packet.includes('- 센서 ID: '+id));
 assert.match(packet,/강변 다음 실행:/);assert.match(packet,/실행 트리거 등록 확인:/);
});
