export const poolLabels={anticipated:'受期待新品',new:'新品观察',historical:'历史重点'};
export const directionLabels={roguelike:'肉鸽',tower_defense:'塔防',roguelike_tower_defense_hybrid:'肉鸽 × 塔防'};
export const dimensionLabels={gameplay:'玩法',story:'故事',art_style:'画风',theme:'题材'};
export const $=selector=>document.querySelector(selector);
export const $$=selector=>Array.from(document.querySelectorAll(selector));

export function publicUrl(value){
  const raw=String(value||'').trim();
  if(!raw)return '';
  if(/^[a-z][a-z0-9+.-]*:/i.test(raw))return raw;
  const base=new URL(document.baseURI);
  if(raw.startsWith('/'))return new URL(raw,base.origin).href;
  const clean=raw.replace(/^\.\//,'');
  const basePath=base.pathname.replace(/[^/]*$/,'').replace(/^\//,'');
  if(basePath&&clean.startsWith(basePath))return new URL('/'+clean,base.origin).href;
  return new URL(clean,base).href;
}

export async function getJSON(path){
  const response=await fetch(publicUrl(path),{cache:'no-store'});
  if(!response.ok)throw new Error('加载失败：'+response.status+' '+path);
  return response.json();
}

export function esc(value){return String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]))}
export function formatNumber(value){const number=Number(value);if(!Number.isFinite(number))return '—';return new Intl.NumberFormat('zh-CN',{maximumFractionDigits:number<100?1:0}).format(number)}
export function metricValue(item){if(!item)return '—';if(item.state==='not_applicable')return '发售前不适用';if(item.state==='missing')return '暂无数据';if(item.id==='positive')return formatNumber(item.value)+'%';if(item.id==='release')return esc(item.value||'待定');return formatNumber(item.value)+(item.unit&&item.unit!=='比例'?' '+esc(item.unit):'')}
export function sourceClass(label){return label==='鉴赏家观点'?'curator':label==='玩家观点'?'player':'muted'}

export function cover(url,title,className='cover',status='available'){
  const resolved=status==='available'?publicUrl(url):'';
  const image=resolved?'<img loading="lazy" src="'+esc(resolved)+'" alt="'+esc(title)+'封面" onerror="this.remove();this.parentElement.classList.add(\'cover-unavailable\')">':'';
  const note=resolved?'':status==='unavailable'?'暂无真实封面':'封面暂不可用';
  return '<div class="'+className+(resolved?'':' cover-unavailable')+'">'+image+'<span class="cover-fallback"><b>'+esc(title)+'</b>'+(note?'<small>'+esc(note)+'</small>':'')+'</span></div>';
}

export function directionField(row){return '<div class="direction-field">'+esc(row?.direction_display||'方向：未标注')+'</div>'}
export function detailHref(appid,returnTo){return 'product-detail.html?appid='+encodeURIComponent(appid)+'&return='+encodeURIComponent(returnTo||'index.html#library')}
export function metricStrip(items){if(!items?.length)return '<div class="empty">暂无可展示商业指标。</div>';return '<div class="metric-strip">'+items.map(item=>'<div class="mini-metric"><span>'+esc(item.label)+'</span><b>'+metricValue(item)+'</b></div>').join('')+'</div>'}
export function badges(items,className='badge muted'){return (items||[]).map(value=>'<span class="'+className+'">'+esc(value)+'</span>').join('')}
