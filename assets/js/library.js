import{$,getJSON,esc,formatNumber,metricValue,cover,directionField,detailHref}from'./shared.js';

const pageSize=30;
let products=[];
let loaded=false;
let debounceTimer=null;
let currentDirection='';

function stateFromUrl(){
  const params=new URL(location.href).searchParams;
  return{query:params.get('q')||'',pool:params.get('pool')||'',scope:params.get('scope')||'',evidence:params.get('evidence')||'',sort:params.get('sort')||'default',direction:currentDirection,page:Math.max(1,Number(params.get('page')||1))};
}

function applyState(state){
  $('#filter-query').value=state.query;
  $('#filter-pool').value=state.pool;
  $('#filter-scope').value=state.scope;
  $('#filter-evidence').value=state.evidence;
  $('#filter-sort').value=state.sort;
}

function readState(){return{query:$('#filter-query').value.trim(),pool:$('#filter-pool').value,scope:$('#filter-scope').value,evidence:$('#filter-evidence').value,sort:$('#filter-sort').value,direction:currentDirection,page:1}}
function setParam(params,key,value,defaultValue=''){if(value&&value!==defaultValue)params.set(key,String(value));else params.delete(key)}

function updateUrl(state){
  const url=new URL(location.href);
  setParam(url.searchParams,'q',state.query);
  setParam(url.searchParams,'pool',state.pool);
  setParam(url.searchParams,'scope',state.scope);
  setParam(url.searchParams,'evidence',state.evidence);
  setParam(url.searchParams,'sort',state.sort,'default');
  setParam(url.searchParams,'direction',state.direction);
  setParam(url.searchParams,'page',state.page,1);
  url.hash='library';
  history.replaceState(null,'',(url.pathname.split('/').pop()||'index.html')+url.search+url.hash);
}

function normalized(value){return String(value||'').toLocaleLowerCase('zh-CN')}
function sortValue(row,key){const value=row.sort?.[key];return Number.isFinite(Number(value))?Number(value):-Infinity}

function filterRows(state){
  const query=normalized(state.query);
  let rows=products.filter(row=>{
    const queryMatch=!query||normalized([row.title,row.original_title,row.appid,...(row.tags||[])].join(' ')).includes(query);
    const poolMatch=!state.pool||(state.pool==='outside'?!row.pool:row.pool===state.pool);
    const directionMatch=!state.direction||row.direction_key===state.direction;
    return queryMatch&&poolMatch&&directionMatch&&(!state.scope||row.scope===state.scope)&&(!state.evidence||row.evidence===state.evidence);
  });
  rows=[...rows];
  if(state.sort==='title')rows.sort((a,b)=>a.title.localeCompare(b.title,'zh-CN')||a.order-b.order);
  else if(state.sort==='pool')rows.sort((a,b)=>(a.pool_rank||1e9)-(b.pool_rank||1e9)||a.order-b.order);
  else if(['sales','wishlist','reviews','positive'].includes(state.sort))rows.sort((a,b)=>sortValue(b,state.sort)-sortValue(a,state.sort)||a.order-b.order);
  else rows.sort((a,b)=>a.order-b.order);
  return rows;
}

function stateGrid(row){return '<div class="state-grid"><span><b>正式分池</b><em>'+esc(row.pool_label)+(row.pool_rank?' #'+esc(row.pool_rank):'')+'</em></span><span><b>语义范围</b><em>'+esc(row.scope_label)+'</em></span><span><b>证据状态</b><em>'+esc(row.evidence_label)+'</em></span></div>'}
function rowMetrics(row){const metrics=row.metrics||[];return '<div class="row-metrics">'+(metrics.length?metrics.slice(0,2).map(item=>'<div class="mini-metric"><span>'+esc(item.label)+'</span><b>'+metricValue(item)+'</b></div>').join(''):'<div class="empty">暂无关键指标</div>')+'</div>'}

function productRow(row){
  return '<article class="library-row">'+cover(row.cover,row.title,'cover',row.cover_status)+'<div class="library-copy"><div class="badges"><span class="badge">'+esc(row.pool_label)+(row.pool_rank?' #'+esc(row.pool_rank):'')+'</span>'+(row.tags||[]).slice(0,3).map(tag=>'<span class="tag">'+esc(tag)+'</span>').join('')+'</div><h3>'+esc(row.title)+'</h3>'+directionField(row)+'<p>'+esc(row.summary||'当前保留产品身份与基础业务材料。')+'</p><small>Steam AppID '+esc(row.appid)+'</small></div>'+stateGrid(row)+rowMetrics(row)+'<a class="primary-button" href="'+detailHref(row.appid,location.pathname+location.search+'#library')+'">查看详情</a></article>';
}

function render(state){
  const rows=filterRows(state);
  const pages=Math.max(1,Math.ceil(rows.length/pageSize));
  state.page=Math.min(state.page,pages);
  const start=(state.page-1)*pageSize;
  $('#result-meta').textContent='找到 '+formatNumber(rows.length)+' 款产品 · 第 '+state.page+' / '+pages+' 页';
  $('#library-list').innerHTML=rows.slice(start,start+pageSize).map(productRow).join('')||'<div class="empty">没有符合条件的产品，请调整筛选。</div>';
  $('#pagination').innerHTML='<button id="page-prev" '+(state.page<=1?'disabled':'')+'>上一页</button><b>'+state.page+' / '+pages+'</b><button id="page-next" '+(state.page>=pages?'disabled':'')+'>下一页</button>';
  $('#page-prev').addEventListener('click',()=>{state.page--;updateUrl(state);render(state);$('#library').scrollIntoView()});
  $('#page-next').addEventListener('click',()=>{state.page++;updateUrl(state);render(state);$('#library').scrollIntoView()});
  updateUrl(state);
}

async function loadLibrary(){
  if(!loaded){
    const button=$('#load-library');
    button.disabled=true;
    button.textContent='正在加载 10,576 款产品';
    const data=await getJSON('data/search-index.json');
    products=data.products;
    loaded=true;
    button.textContent='产品库已加载';
  }
  $('#library-panel').hidden=false;
  const state=stateFromUrl();
  applyState(state);
  render(state);
}

export function setLibraryDirection(direction,{updateUrl:shouldUpdateUrl=true}={}){
  currentDirection=direction||'';
  const state=stateFromUrl();
  state.direction=currentDirection;
  if(loaded){
    const pages=Math.max(1,Math.ceil(filterRows(state).length/pageSize));
    if(state.page>pages)state.page=1;
    render(state);
  }else if(shouldUpdateUrl){
    updateUrl(state);
  }
  if(loaded&&!shouldUpdateUrl)return;
  if(loaded&&shouldUpdateUrl)updateUrl(state);
}

export function initLibrary(initialDirection=''){
  currentDirection=initialDirection;
  const button=$('#load-library');
  button.addEventListener('click',()=>loadLibrary().catch(error=>{console.error(error);button.disabled=false;button.textContent='加载失败，点击重试'}));
  ['#filter-pool','#filter-scope','#filter-evidence','#filter-sort'].forEach(selector=>$(selector).addEventListener('change',()=>{const state=readState();updateUrl(state);render(state)}));
  $('#filter-query').addEventListener('input',()=>{clearTimeout(debounceTimer);debounceTimer=setTimeout(()=>{const state=readState();updateUrl(state);render(state)},220)});
}
