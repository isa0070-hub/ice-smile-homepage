"use client";

import Link from "next/link";
import {useCallback,useEffect,useState} from "react";
import PlaceMonitorAnalysisCopy from "@/components/PlaceMonitorAnalysisCopy";
import {adminFetch} from "@/lib/adminClient";
import styles from "./page.module.css";

const REFRESH_MS = 15 * 60 * 1000;
const names={seolleung:'선릉',gangbyeon:'강변'};
const statuses={VALID:'정상 순위',NOT_IN_OBSERVED_RANGE:'관측범위 내 미발견',UI_CHANGED:'화면 구조 변경',
  MEASUREMENT_FAILED:'수집 실패',CAPTCHA:'보안 확인 필요',LOGIN_BLOCK:'로그인 차단',AUTO_PAN_DETECTED:'지도 자동 이동',
  CONTEXT_CHANGED:'조건 변경',AMBIGUOUS_ENTITY:'업체 식별 보류',MANUAL_REVIEW_REQUIRED:'수동 확인 필요'};
const reasons={NO_PLACE_AREA_OBSERVED:'플레이스 영역 미관측',SINGLE_PLACE_DETAIL_UNRANKED:'단일 업체 상세 · 순위 목록 아님',BROWSER_OR_EXTRACTION_FAILURE:'브라우저 또는 추출 실패'};
const freshness={TODAY:'오늘 자료',OLDER:'과거 자료',UNMEASURED:'미관측',UNKNOWN:'시각 미확인',FUTURE:'미래 시각 확인 필요'};
function formatDate(v){return v&&!Number.isNaN(Date.parse(v))?new Intl.DateTimeFormat('ko-KR',{dateStyle:'medium',timeStyle:'medium',timeZone:'Asia/Seoul'}).format(new Date(v)):'미확인';}
function rankLabel(m){if(m?.measurement_status==='VALID'&&m.target_found&&Number.isInteger(m.organic_rank)&&m.organic_rank>0)return m.organic_rank+'위';return '—';}
export default function PlaceMonitorPage(){
 const [dashboard,setDashboard]=useState({sensors:[],limits:{}});
 const [history,setHistory]=useState([]),[historyScope,setHistoryScope]=useState('이력 미조회');
 const [sensor,setSensor]=useState(''),[loadingLatest,setLoadingLatest]=useState(true),[loadingHistory,setLoadingHistory]=useState(false);
 const [error,setError]=useState(''),[lastCheckedAt,setLastCheckedAt]=useState(null);
 const loadLatest=useCallback(async({silent=false}={})=>{
  if(!silent)setLoadingLatest(true);
  try{const result=await adminFetch('/api/admin/place-monitor?mode=latest');setDashboard(result.dashboard||{sensors:[],limits:{}});setLastCheckedAt(new Date());setError('');}
  catch(e){setError(e.message||'최신 자료를 불러오지 못했습니다.');}finally{if(!silent)setLoadingLatest(false);}
 },[]);
 const loadHistory=useCallback(async()=>{
  setLoadingHistory(true);
  try{const params=new URLSearchParams({mode:'history',limit:'50'});if(sensor)params.set('sensor',sensor);
   const result=await adminFetch('/api/admin/place-monitor?'+params);setHistory(result.items||[]);setHistoryScope(sensor||'전체 센서');setError('');}
  catch(e){setError(e.message||'이력을 불러오지 못했습니다.');}finally{setLoadingHistory(false);}
 },[sensor]);
 useEffect(()=>{
  const initial=setTimeout(()=>loadLatest(),0);
  const refresh=()=>{if(document.visibilityState === "visible")loadLatest({silent:true});};
  const timer=setInterval(refresh,REFRESH_MS);document.addEventListener('visibilitychange',refresh);
  return()=>{clearTimeout(initial);clearInterval(timer);document.removeEventListener('visibilitychange',refresh);};
 },[loadLatest]);
 const rows=dashboard.sensors||[],c=dashboard.coverage||{},runtime=dashboard.observer_status?.runtime_status;
 const todayCounts=rows.filter(x=>x.freshness==='TODAY').reduce((a,x)=>{const k=x.last_attempt?.measurement_status;a[k]=(a[k]||0)+1;return a;},{});
 return <main className={styles.page}>
  <header className={styles.header}><div><p className={styles.eyebrow}>자연 플레이스 · 관리자 전용</p><h1>선릉 · 강변 자연노출 관측</h1><p className={styles.description}>등록 목록 전체와 센서별 최신 저장 결과를 함께 표시합니다. 과거 자료와 미관측을 오늘 결과로 취급하지 않습니다.</p></div><div className={styles.headerActions}><button onClick={()=>loadLatest()} disabled={loadingLatest}>{loadingLatest?'확인 중':'지금 새로고침'}</button><Link href="/admin">관리자 홈</Link></div></header>
  <section className={styles.coverage} aria-label="등록 센서와 자료 날짜">
   {[["등록 전체",c.registered_count??'미수신'],["화면·패킷 포함",c.included_count??rows.length],["오늘",c.today_count??'미수신'],["과거",c.older_count??'미수신'],["미관측",c.unmeasured_count??'미수신']].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}
  </section>
  <section className={styles.statusStrip} aria-label="동기화 상태"><div><span>마지막 클라우드 동기화</span><strong>{formatDate(dashboard.last_sync_at)} KST</strong></div><div><span>최신 요약 생성 · 페이지 확인</span><strong>{formatDate(dashboard.generated_at)} KST</strong><span>{formatDate(lastCheckedAt)}</span></div><p>화면이 보일 때만 기존 15분 간격으로 확인합니다. 최신 요약은 센서별 1건이며, 원본 이력 조회의 50행 상한과 별개입니다.</p></section>
  {error?<p className={styles.error}>{error}</p>:null}
  {!c.registry_received?<p className={styles.error}>등록 목록이 아직 수신되지 않았습니다. 현재 보이는 센서 수를 전체 등록 수로 해석하지 않습니다.</p>:null}
  <section className={styles.schedulePanel} aria-label="실제 자동 실행 일정"><div><p className={styles.eyebrow}>확인한 일정 상태</p><h2>다음 자동 관측</h2></div>
   {runtime?.branches?.length?<div className={styles.runtimeGrid}>{runtime.branches.map(b=><article key={b.branch_id}><h3>{names[b.branch_id]||b.branch_id}</h3><p><b>{b.schedule_confirmed?formatDate(b.next_due_at):'일정 미확인'} KST</b></p><p>{b.next_sensor_id||'다음 대상 미확인'}</p><p>실행 트리거: {({REGISTERED:'등록 확인',UNCONFIRMED:'미확인',NOT_REGISTERED:'미등록 확인'})[b.trigger.status]}</p><p>{b.trigger.calendar.map((v,i)=><span key={i}>{v.Hour??'매시'}시 {v.Minute??0}분{v.Weekday!==undefined?' · 요일 '+v.Weekday:''}{' '}</span>)}</p><p className={styles.scheduleNote}>트리거 확인 {formatDate(b.trigger.checked_at)} KST<br/>일정 확인 {formatDate(runtime.checked_at)} KST</p></article>)}</div>:<p>실제 일정·트리거 확인값 미수신. 미등록으로 판단하지 않습니다.</p>}
   <p className={styles.scheduleNote}>표시된 시각에 확인한 상태이며, 실제 실행·수집 성공·홈페이지 동기화는 별도 결과입니다.</p>
  </section>
  <PlaceMonitorAnalysisCopy dashboard={dashboard} history={history} selectedSensorFilter="등록 센서 전체 · 이력 필터와 분리" historyScope={historyScope}/>
  <section className={styles.latestSection} aria-labelledby="latest-title"><div className={styles.sectionHeading}><div><p className={styles.eyebrow}>등록 전체 · 센서별 최신값</p><h2 id="latest-title">최신 관측 결과</h2></div><span>{rows.length}개 포함</span></div>
   <p className={styles.scheduleNote}>오늘 최신 결과: 정상 순위 {todayCounts.VALID||0} · 범위 내 미발견 {todayCounts.NOT_IN_OBSERVED_RANGE||0} · 화면 구조 변경 {todayCounts.UI_CHANGED||0} · 수집 실패 {todayCounts.MEASUREMENT_FAILED||0}. 오류와 미관측은 순위 하락으로 판정하지 않습니다.</p>
   <div className={styles.tableWrap}><table><thead><tr><th>지점 · 센서</th><th>검색어</th><th>최신 측정 시각 KST</th><th>자료 날짜</th><th>판독 상태</th><th>자연순위</th><th>관측범위</th><th>근거</th></tr></thead><tbody>{rows.map(row=>{const m=row.last_attempt;return <tr key={row.sensor_id} data-sensor-id={row.sensor_id} data-measurement-id={m?.measurement_id||''}><td>{names[row.branch_id]||row.branch_id}<br/><small>{row.sensor_id}</small></td><td>{row.query||m?.query||'검색어 미수신'}</td><td>{m?formatDate(m.measured_at):'저장된 측정 없음'}</td><td><span className={row.freshness==='TODAY'?styles.goodBadge:styles.reviewBadge}>{freshness[row.freshness]||'미확인'}</span></td><td>{m?statuses[m.measurement_status]||m.measurement_status:'미관측'}{m?.error_summary?<p>{reasons[m.error_summary]||m.error_summary}</p>:null}</td><td>{rankLabel(m)}</td><td>{m?m.observed_n+'개':'—'}</td><td>{m?<details><summary>측정 ID·조건</summary><small>{m.measurement_id}<br/>{m.result_surface}<br/>{JSON.stringify(m.search_conditions)}<br/>판독기 {m.source_version||'미기록'}</small></details>:'원본 측정 없음'}</td></tr>;})}</tbody></table></div>
  </section>
  <section className={styles.historySection} aria-labelledby="history-title"><div className={styles.sectionHeading}><h2 id="history-title">원본 측정 이력</h2></div><div className={styles.historyControls}><label>이력 센서<select value={sensor} onChange={e=>setSensor(e.target.value)}><option value="">전체 센서</option>{rows.map(row=><option key={row.sensor_id} value={row.sensor_id}>{names[row.branch_id]} · {row.query||row.sensor_id}</option>)}</select></label><button onClick={loadHistory} disabled={loadingHistory}>{loadingHistory?'불러오는 중':'기존 이력 최대 50건 조회'}</button></div><p className={styles.scheduleNote}>버튼을 눌렀을 때만 조회합니다. 이력 0건 표시는 아직 조회하지 않은 경우를 포함하며 전체 기록 부재를 뜻하지 않습니다.</p>
   {history.length?<div className={styles.tableWrap}><table><thead><tr><th>측정시각 KST</th><th>센서</th><th>자연순위</th><th>상태</th><th>측정 ID</th></tr></thead><tbody>{history.map(m=><tr key={m.measurement_id}><td>{formatDate(m.measured_at)}</td><td>{m.query}</td><td>{rankLabel(m)}</td><td>{statuses[m.measurement_status]||m.measurement_status}</td><td>{m.measurement_id}</td></tr>)}</tbody></table></div>:null}
  </section>
 </main>;
}
