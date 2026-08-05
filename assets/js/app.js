import{$,$$,getJSON,esc,formatNumber,metricStrip,sourceClass,cover,directionField,detailHref}from'./shared.js';
import{initLibrary,setLibraryDirection}from'./library.js';

let homeData=null;
let activeDimension='gameplay';
let activeDirection='';
const directionMedia=matchMedia('(min-width:721px)');
const allowedDirections=new Set(['roguelike','tower_defense','roguelike_tower_defense_hybrid']);
const dimensionOrder=[['gameplay','玩法'],['story','故事'],['art_style','画风'],['theme','题材']];

function effectiveDirection(){return directionMedia.matches?activeDirection:''}
function metricCard(label,value,note){return '<article class="metric-card"><span>'+esc(label)+'</span><b>'+formatNumber(value)+'</b><small>'+esc(note)+'</small></article>'}
function returnPath(anchor){const direction=effectiveDirection();return 'index.html'+(direction?'?direction='+encodeURIComponent(direction):'')+'#'+anchor}
function preserveDirectionHref(href){const url=new URL(href,document.baseURI);const direction=effectiveDirection();if(direction)url.searchParams.set('direction',direction);else url.searchParams.delete('direction');return (url.pathname.split('/').pop()||'index.html')+url.search+url.hash}
function renderConclusions(rows){$('#conclusions').innerHTML=rows.map(row=>'<article class="conclusion"><p>'+esc(row.text)+'</p><a href="'+esc(preserveDirectionHref(row.href))+'">'+esc(row.action)+' →</a></article>').join('')}
function renderPools(rows,total){$('#pool-grid').innerHTML=rows.map(row=>'<article class="panel"><div class="panel-head"><div><span class="eyebrow">'+esc(row.label)+'</span><div class="pool-count">'+formatNumber(row.count)+'</div></div><b>'+formatNumber(row.count/total*100)+'%</b></div><div class="pool-bar"><i style="width:'+Math.max(2,row.count/total*100)+'%"></i></div><p>'+esc(row.purpose)+'</p><a class="text-link" href="'+esc(preserveDirectionHref('?pool='+row.key+'#library'))+'">查看本池产品 →</a></article>').join('')}
function opinionBlock(item){if(!item)return '<div class="opinion empty-opinion">玩家侧讨论尚未形成稳定共识，先看宣传钩子与客观指标。</div>';return '<div class="opinion"><span class="badge '+sourceClass(item.source)+'">'+esc(item.source)+'</span><p>'+esc(item.text)+'</p></div>'}

function featuredCard(row){
  const action=row.action?'<span class="action-label">'+esc(row.action.label)+'：'+esc(row.action.target)+'</span>':'';
  return '<article class="featured-card">'+cover(row.cover,row.title,'cover',row.cover_status)+'<div class="card-body"><div class="badges"><span class="badge">'+esc(row.pool_label)+' #'+esc(row.pool_rank)+'</span>'+row.tags.map(tag=>'<span class="tag">'+esc(tag)+'</span>').join('')+'</div><h4>'+esc(row.title)+'</h4>'+directionField(row)+'<p class="reason">'+esc(row.reason)+'</p>'+metricStrip(row.metrics)+opinionBlock(row.opinion)+'<div class="card-actions">'+action+'<a class="text-link" href="'+detailHref(row.appid,returnPath('featured'))+'">查看详情 →</a></div></div></article>';
}

function renderFeatured(rows){
  const direction=effectiveDirection();
  const filtered=direction?rows.filter(row=>row.direction_key===direction):rows;
  const pools=[['anticipated','受期待新品'],['new','新品观察'],['historical','历史重点']];
  $('#featured-groups').innerHTML=pools.map(([key,label])=>{
    const poolRows=filtered.filter(row=>row.pool===key);
    const body=poolRows.length?poolRows.map(featuredCard).join(''):'<div class="empty direction-empty">当前方向下，本池没有重点样本。</div>';
    return '<section class="featured-group"><div class="featured-group-head"><span class="badge">'+label+'</span><h3>头部代表样本</h3></div><div class="featured-grid">'+body+'</div></section>';
  }).join('');
}

function longboardRows(rows,key){
  if(!rows?.length)return '<div class="longboard-empty">当前方向下没有满足展示条件的'+dimensionOrder.find(item=>item[0]===key)[1]+'长板产品。</div>';
  return '<div class="longboard-list">'+rows.map(row=>'<a class="rank-row" href="'+detailHref(row.appid,returnPath('longboards'))+'"><b>#'+esc(row.rank)+'</b>'+cover(row.cover,row.title,'rank-cover',row.cover_status)+'<div><h4>'+esc(row.title)+'</h4>'+directionField(row)+'<p>'+esc(row.reason)+' · '+esc(row.source)+' · '+formatNumber(row.liked_points)+' 条喜欢点</p></div></a>').join('')+'</div>';
}

function filteredDimensions(dimensions){
  const direction=effectiveDirection();
  return Object.fromEntries(dimensionOrder.map(([key])=>[key,direction?(dimensions[key]||[]).filter(row=>row.direction_key===direction):(dimensions[key]||[])]));
}

function renderLongboards(dimensions){
  const visible=filteredDimensions(dimensions);
  $('#longboard-desktop').innerHTML=dimensionOrder.map(([key,label])=>'<article class="longboard-column"><span class="eyebrow">'+key+'</span><h3>'+label+'长板</h3>'+longboardRows(visible[key],key)+'</article>').join('');
  $('#dimension-tabs').innerHTML=dimensionOrder.map(([key,label])=>'<button data-dimension="'+key+'" class="'+(key===activeDimension?'active':'')+'">'+label+'</button>').join('');
  $('#longboard-mobile-list').innerHTML=longboardRows(visible[activeDimension],activeDimension);
  $$('[data-dimension]').forEach(button=>button.addEventListener('click',()=>{activeDimension=button.dataset.dimension;renderLongboards(dimensions)}));
}

function renderDirectionSlicer(){
  const data=homeData?.direction_slicer;
  if(!data)return;
  const rows=[data.default_option,...data.options];
  $('#direction-options').innerHTML=rows.map(row=>{
    const key=row.direction_key==='all'?'':row.direction_key;
    const count=key?' <small>'+formatNumber(row.product_count)+'</small>':'';
    return '<button type="button" data-direction="'+esc(key)+'" class="'+(key===effectiveDirection()?'active':'')+'" aria-pressed="'+(key===effectiveDirection())+'">'+esc(row.direction_label)+count+'</button>';
  }).join('');
  $$('[data-direction]').forEach(button=>button.addEventListener('click',()=>setDirection(button.dataset.direction)));
}

function setDirection(direction){
  activeDirection=allowedDirections.has(direction)?direction:'';
  renderDirectionSlicer();
  renderFeatured(homeData.featured);
  renderLongboards(homeData.longboards);
  setLibraryDirection(effectiveDirection(),{updateUrl:true});
}

function renderHome(data){
  homeData=data;
  $('#headline').textContent=data.headline;
  $('#hero-intro').textContent=data.intro;
  renderConclusions(data.conclusions);
  $('#hero-metrics').innerHTML=metricCard('全量产品库',data.counts.products,'可搜索候选产品')+metricCard('正式分池',data.counts.formal,'147 / 645 / 1,013')+metricCard('深度语义',data.counts.deep,'其余产品保留基础材料')+metricCard('长板候选',data.counts.longboard,'按四个维度展示');
  renderPools(data.pools,data.counts.formal);
  renderDirectionSlicer();
  renderFeatured(data.featured);
  renderLongboards(data.longboards);
  $('#baseline-title').textContent=data.baseline.title;
  $('#baseline-observation').textContent=data.baseline.observation_text;
  $('#baseline-message').textContent=data.baseline.message;
}

function setupNavigation(){$('#menu-button').addEventListener('click',()=>$('#sidebar').classList.toggle('open'));$$('#sidebar nav a').forEach(link=>link.addEventListener('click',()=>$('#sidebar').classList.remove('open')))}

async function loadFullLongboards(){
  const button=$('#load-full-longboards');
  button.disabled=true;
  button.textContent='正在加载';
  try{
    const data=await getJSON('data/longboards.json');
    homeData.longboards=data.dimensions;
    renderLongboards(homeData.longboards);
    button.textContent='已显示完整长板';
  }catch(error){
    button.disabled=false;
    button.textContent='加载失败，点击重试';
    console.error(error);
  }
}

async function main(){
  setupNavigation();
  const params=new URL(location.href).searchParams;
  const requestedDirection=params.get('direction')||'';
  activeDirection=allowedDirections.has(requestedDirection)?requestedDirection:'';
  const data=await getJSON('data/home.json');
  renderHome(data);
  $('#load-full-longboards').addEventListener('click',loadFullLongboards);
  initLibrary(effectiveDirection());
  directionMedia.addEventListener('change',()=>{
    renderDirectionSlicer();
    renderFeatured(homeData.featured);
    renderLongboards(homeData.longboards);
    setLibraryDirection(effectiveDirection(),{updateUrl:false});
  });
  const libraryStateKeys=['q','pool','scope','evidence','sort','page'];
  if(libraryStateKeys.some(key=>params.has(key))||(directionMedia.matches&&activeDirection))$('#load-library').click();
}

main().catch(error=>{console.error(error);$('#headline').textContent='页面加载失败';$('#hero-intro').textContent=error.message});
