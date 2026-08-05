import{$,getJSON,esc,metricValue,sourceClass,badges,cover,directionField}from'./shared.js';
function safePublicUrl(value){try{const parsed=new URL(String(value||'').trim());if(parsed.protocol==='http:'||parsed.protocol==='https:')return parsed.href}catch(error){}return ''}

function section(title,body,id){return '<section class="detail-block"'+(id?' id="'+id+'"':'')+'><h2>'+esc(title)+'</h2>'+body+'</section>'}
function fact(label,value){return '<div class="fact"><span>'+esc(label)+'</span><b>'+esc(value||'暂无')+'</b></div>'}
function actionBlock(action){if(!action)return '<div class="empty">等待下一期同口径数据继续观察。</div>';return '<article class="action-card"><span class="badge">'+esc(action.label)+' · 优先级'+esc(action.priority)+'</span><h3>'+esc(action.target)+'</h3><p>'+esc(action.reason)+'</p>'+(action.trigger?'<small>更新条件：'+esc(action.trigger)+'</small>':'')+'</article>'}

function hero(base){
  const pool=base.pool?base.pool_label+' #'+base.pool_rank:'正式分池外';
  const strengths=base.strengths?.length?base.strengths.map(item=>'<span class="badge">'+esc(item.dimension)+'长板 #'+esc(item.rank)+'</span>').join(''):'<span class="badge muted">未进入四项长板</span>';
  const mainAction=base.action?'<div class="hero-action"><strong>'+esc(base.action.label)+'：'+esc(base.action.target)+'</strong><span>'+esc(base.action.reason)+'</span></div>':'';
  return '<section class="detail-hero">'+cover(base.cover,base.title,'detail-cover',base.cover_status)+'<div class="detail-hero-copy"><div class="badges"><span class="badge">'+esc(pool)+'</span>'+base.tags.slice(0,5).map(tag=>'<span class="tag">'+esc(tag)+'</span>').join('')+'</div><h1>'+esc(base.title)+'</h1>'+directionField(base)+(base.original_title&&base.original_title!==base.title?'<div class="original-title">原名：'+esc(base.original_title)+'</div>':'')+'<p class="detail-summary">'+esc(base.summary)+'</p>'+(base.hook?'<div class="hero-hook"><span class="eyebrow">主宣传钩子</span><strong>'+esc(base.hook)+'</strong></div>':'')+'<div class="strength-row">'+strengths+'</div>'+mainAction+'<p><a class="primary-button" href="'+esc(base.store_url)+'" target="_blank" rel="noopener">打开 Steam 商店</a></p></div></section>';
}

function identity(base,rich){const identity=rich?.identity||{};const status={released:'已发售',coming_soon:'即将发售',prerelease:'未发售'}[base.release_status]||base.release_status||'暂无';return section('1. 产品身份与业务位置','<div class="fact-grid">'+fact('正式分池',base.pool_label)+fact('客观池内序位',base.pool_rank?String(base.pool_rank):'未进入')+fact('语义范围',base.scope_label)+fact('证据状态',base.evidence_label)+fact('发售状态',status)+fact('发售日期',identity.release_date||base.release_date)+fact('开发者',(identity.developers||[]).join(' / '))+fact('发行方',(identity.publishers||[]).join(' / '))+'</div>')}
function hookCards(base,rich){const hooks=rich?.hooks?.length?rich.hooks:base.hooks||[];let body=hooks.length?'<div class="detail-grid">'+hooks.map(item=>'<article class="hook-card"><span class="badge muted">官方宣传钩子 · '+esc(item.dimension)+'</span><h3>'+esc(item.text)+'</h3>'+(item.excerpt?'<details><summary>查看证据原文片段</summary><div class="quote">'+esc(item.excerpt)+(safePublicUrl(item.url)?'<a href="'+esc(safePublicUrl(item.url))+'" target="_blank" rel="noopener">查看来源</a>':'')+'</div></details>':'')+'</article>').join('')+'</div>':'<div class="empty">当前没有可展示的官方宣传钩子。</div>';const shots=rich?.media?.screenshots||[];if(shots.length)body+='<div class="media-grid" style="margin-top:12px">'+shots.map(item=>'<img loading="lazy" src="'+esc(item.url)+'" alt="'+esc(item.alt)+'" onerror="this.remove()">').join('')+'</div>';return section('2. 官方宣传钩子',body)}
function opinionCard(item){return '<article class="opinion-card"><div class="badges"><span class="badge '+sourceClass(item.source)+'">'+esc(item.source)+'</span><span class="badge muted">'+esc(item.dimension)+' · '+esc(item.polarity)+'</span></div><h3>'+esc(item.text)+'</h3>'+(item.excerpts?.length?'<details><summary>查看证据原文片段</summary>'+item.excerpts.map(ref=>'<div class="quote"><b>'+esc(ref.label)+'</b><div>'+esc(ref.excerpt)+'</div>'+(safePublicUrl(ref.url)?'<a href="'+esc(safePublicUrl(ref.url))+'" target="_blank" rel="noopener">查看来源</a>':'')+'</div>').join('')+'</details>':'')+'</article>'}
function opinions(rich){const rows=rich?.opinions||[];const curator=rows.filter(item=>item.source==='鉴赏家观点');const player=rows.filter(item=>item.source==='玩家观点');const column=(title,items)=>'<div class="opinion-column"><h3>'+title+'</h3>'+(items.length?items.map(opinionCard).join(''):'<div class="empty">当前没有可展示的'+title+'。</div>')+'</div>';return section('3. 鉴赏家观点与玩家观点','<div class="opinion-columns">'+column('鉴赏家观点',curator)+column('玩家观点',player)+'</div>')}

function reviewCard(item,sourceLabel,bucketLabel){
  return '<article class="full-review-card"><div class="badges"><span class="badge '+(sourceLabel==='鉴赏家'?'curator':'player')+'">'+esc(sourceLabel)+'</span><span class="badge muted">'+esc(bucketLabel)+'</span><span class="badge muted">'+esc(item.recommendation||'状态未标注')+'</span></div><div class="full-review-text">'+esc(item.text)+'</div>'+(safePublicUrl(item.url)?'<a class="text-link" href="'+esc(safePublicUrl(item.url))+'" target="_blank" rel="noopener">查看公开来源</a>':'')+'</article>';
}

function reviewColumn(source){
  const reviewMap=new Map((source.reviews||[]).map(item=>[item.id,item]));
  const groups=(source.groups||[]).map(group=>{
    const rows=(group.review_ids||[]).map(id=>reviewMap.get(id)).filter(Boolean);
    if(!rows.length)return '';
    return '<section class="full-review-group"><h4>'+esc(group.label)+' <small>'+rows.length+' 条</small></h4>'+rows.map(item=>reviewCard(item,source.label,group.label)).join('')+'</section>';
  }).join('');
  const statusNote=source.empty_status_count?'<p class="review-status-note">另有 '+source.empty_status_count+' 条无正文状态记录，仅保留在审计统计中。</p>':'';
  const body=groups||'<div class="empty">当前没有可阅读的'+esc(source.label)+'完整评论。</div>';
  return '<div class="full-review-column"><div class="full-review-column-head"><h3>'+esc(source.label)+'</h3><span>可阅读 '+source.readable_count+' 条</span></div>'+statusNote+'<div class="full-review-scroll">'+body+'</div></div>';
}

function renderFullReviews(data){return '<div class="full-review-summary"><span>普通玩家 '+data.sources.player.readable_count+' 条</span><span>鉴赏家 '+data.sources.curator.readable_count+' 条</span><span>无正文状态记录 '+(data.sources.player.empty_status_count+data.sources.curator.empty_status_count)+' 条</span></div><div class="full-review-columns">'+reviewColumn(data.sources.player)+reviewColumn(data.sources.curator)+'</div>'}

function fullReviewSection(base){
  if(!base.full_reviews)return section('3.1 完整评论原文','<div class="empty">当前产品不在完整评论投影范围内，页面不伪造评论内容。</div>','full-reviews');
  const counts=base.full_review_counts||{};
  return section('3.1 完整评论原文','<details class="full-review-disclosure" id="full-review-disclosure"><summary>展开完整评论原文（普通玩家 '+(counts.player_readable||0)+' / 鉴赏家 '+(counts.curator_readable||0)+'）</summary><p class="full-review-note">展开后才加载完整长文本；观点摘要与证据原文片段仍保留在上一节。</p><div id="full-review-content"><div class="empty">展开后加载完整评论。</div></div></details>','full-reviews');
}

function attachFullReviewLoader(base){
  const disclosure=$('#full-review-disclosure');
  if(!disclosure||!base.full_reviews)return;
  disclosure.addEventListener('toggle',async()=>{
    if(!disclosure.open||disclosure.dataset.loaded==='true'||disclosure.dataset.loading==='true')return;
    disclosure.dataset.loading='true';
    $('#full-review-content').innerHTML='<div class="empty">正在加载完整评论原文…</div>';
    try{
      const data=await getJSON(base.full_reviews);
      $('#full-review-content').innerHTML=renderFullReviews(data);
      disclosure.dataset.loaded='true';
    }catch(error){
      console.error(error);
      $('#full-review-content').innerHTML='<div class="empty">完整评论加载失败。请收起后重新展开。</div>';
    }finally{
      disclosure.dataset.loading='false';
    }
  });
}

function metrics(base,rich){const rows=rich?.metrics?.length?rich.metrics:base.metrics||[];const body=rows.length?'<div class="metric-grid">'+rows.map(item=>'<article class="metric-item"><b>'+metricValue(item)+'</b><span>'+esc(item.label)+'</span><small>'+esc(item.date||'观察日见页头')+'</small></article>').join('')+'</div>':'<div class="empty">当前没有可展示商业数据。</div>';return section('4. 商业数据',body)}
function baseline(rich){const data=rich?.baseline||{date:'2026-07-23',message:'首期基线，暂无可比趋势。'};return section('5. 单点状态','<div class="baseline-point"><strong>'+esc(data.message)+'</strong><p>观察日：'+esc(data.date||'2026-07-23')+'。本页仅展示带数值和单位的单点状态。</p></div>')}
function risksAndActions(base,rich){const risks=rich?.risks?.length?rich.risks:(base.risk?[base.risk]:[]);const actions=rich?.actions?.length?rich.actions:(base.action?[base.action]:[]);const riskBody=risks.length?risks.map(item=>'<article class="risk-card">'+esc(item)+'</article>').join(''):'<div class="empty">当前没有额外产品风险材料。</div>';return section('6. 风险与行动','<div class="detail-grid"><div><h3>风险</h3>'+riskBody+'</div><div><h3>下一步动作</h3>'+actions.map(actionBlock).join('')+'</div></div>')}
function more(base,rich){const tags=rich?.identity?.tags||base.tags||[];const pointCount=rich?.opinions?.length||0;const hookCount=(rich?.hooks?.length||base.hooks?.length||0);return section('7. 标签、证据原文片段与来源追溯','<details><summary>展开补充材料</summary><div class="tag-row" style="margin-top:10px">'+badges(tags,'tag')+'</div><p>可展示观点 '+pointCount+' 条；官方宣传钩子 '+hookCount+' 条。摘要区引用仍为评论片段；完整原文请在 3.1 节主动展开。</p></details>')}

function render(base,rich){
  document.title=base.title+'｜产品详情';
  $('#detail-root').innerHTML=hero(base)+identity(base,rich)+hookCards(base,rich)+opinions(rich)+fullReviewSection(base)+metrics(base,rich)+baseline(rich)+risksAndActions(base,rich)+more(base,rich);
  attachFullReviewLoader(base);
}

async function main(){
  const params=new URL(location.href).searchParams;
  const appid=params.get('appid');
  const returnTo=params.get('return');
  if(returnTo&&!/^https?:/i.test(returnTo))$('#back-link').href=returnTo;
  if(!appid||!/^[0-9]+$/.test(appid))throw new Error('缺少有效 Steam AppID');
  const shard=String(Number(appid)%64).padStart(2,'0');
  const payload=await getJSON('data/product-shards/'+shard+'.json');
  const base=payload.products.find(item=>item.appid===appid);
  if(!base)throw new Error('没有找到该产品');
  let rich=null;
  if(base.extended){try{rich=await getJSON(base.extended)}catch(error){console.warn('扩展详情暂不可用',error)}}
  render(base,rich);
}

main().catch(error=>{console.error(error);$('#detail-root').innerHTML='<div class="loading-card"><h1>详情加载失败</h1><p>'+esc(error.message)+'</p><a class="primary-button" href="index.html#library">返回产品库</a></div>'});
