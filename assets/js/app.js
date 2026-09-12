/* ============== Flowlist — a private, mobile-first to-do list ============== */

/* ---------- palettes ---------- */
const COLORS = [
  {hex:'#2D6A4A', bg:'#DCEEDD'}, // green
  {hex:'#3B6EA0', bg:'#DCE7F4'}, // blue
  {hex:'#B5722C', bg:'#F4E3D0'}, // amber
  {hex:'#7B5EA7', bg:'#E7DFF4'}, // purple
  {hex:'#1F8A8A', bg:'#D8F0EF'}, // teal
  {hex:'#B23A5C', bg:'#F4DCE3'}, // rose
  {hex:'#4A6741', bg:'#E3EBD9'}, // olive
  {hex:'#6B5842', bg:'#EDE3D6'}, // brown
];
const ICONS = ['📌','💼','🏠','🛒','📚','💰','✈️','🎯','💻','🎨','🧾','❤️','🎓','🧹','🎵','📅','💪','🍎'];

const TASKS_KEY = 'flowlist_tasks_v1';
const LISTS_KEY = 'flowlist_lists_v1';
const SETTINGS_KEY = 'flowlist_settings_v1';
const EXPANDED_KEY = 'flowlist_expanded_v1';

let tasks = [];   // [{id,title,notes,listId,priority,dueDate,done,createdAt,completedAt}]
let lists = [];   // [{id,name,icon,colorIdx,createdAt}]
let settings = { dark:false, fontSize:'medium' };
let expandedLists = new Set(); // list ids currently expanded on the Tasks page

let filterMode = 'all';        // all | active | done
let sortMode = 'due-asc';      // due-asc | priority-desc | name-asc | created-desc
let currentListDetailId = null;
let editingTaskId = null;
let editingListId = null;
let pendingActionTaskId = null;
let pendingDeleteUndo = null;

/* ---------- helpers ---------- */
function uid(prefix){ return prefix+'_'+Date.now()+'_'+Math.random().toString(36).slice(2,7); }
function todayStr(){ const d=new Date(); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function dateNDaysAgo(n){ const d=new Date(); d.setDate(d.getDate()-n); return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0'); }
function colorFor(list){ return list ? COLORS[list.colorIdx % COLORS.length] : COLORS[0]; }
function listById(id){ return lists.find(l=>l.id===id); }
function taskById(id){ return tasks.find(t=>t.id===id); }
function escapeHtml(s){ return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmtDue(dateStr){
  if(!dateStr) return null;
  const today = todayStr();
  const tmr = dateNDaysAgo(-1);
  if(dateStr === today) return {label:'Today', overdue:false};
  if(dateStr === tmr) return {label:'Tomorrow', overdue:false};
  const d = new Date(dateStr+'T00:00:00');
  const overdue = dateStr < today;
  const label = d.toLocaleDateString(undefined,{month:'short', day:'numeric'});
  return {label, overdue};
}
function priorityRank(p){ return p==='high'?3:p==='med'?2:1; }

/* ---------- persistence ---------- */
function loadAll(){
  try{ const raw = localStorage.getItem(TASKS_KEY); tasks = raw ? JSON.parse(raw) : []; }catch(e){ tasks=[]; }
  try{
    const raw = localStorage.getItem(LISTS_KEY);
    lists = raw ? JSON.parse(raw) : null;
  }catch(e){ lists=null; }
  if(!lists || !lists.length){
    lists = [
      { id:uid('l'), name:'Work', icon:'💼', colorIdx:1, createdAt:todayStr() },
      { id:uid('l'), name:'Personal', icon:'🏠', colorIdx:0, createdAt:todayStr() },
      { id:uid('l'), name:'Other', icon:'📌', colorIdx:3, createdAt:todayStr() },
    ];
    saveLists();
  }
  try{ const raw = localStorage.getItem(SETTINGS_KEY); if(raw) settings = Object.assign(settings, JSON.parse(raw)); }catch(e){}
  try{ const raw = localStorage.getItem(EXPANDED_KEY); expandedLists = new Set(raw ? JSON.parse(raw) : []); }catch(e){ expandedLists = new Set(); }
}
function saveTasks(){ try{ localStorage.setItem(TASKS_KEY, JSON.stringify(tasks)); }catch(e){} }
function saveLists(){ try{ localStorage.setItem(LISTS_KEY, JSON.stringify(lists)); }catch(e){} }
function saveSettings(){ try{ localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); }catch(e){} }
function saveExpanded(){ try{ localStorage.setItem(EXPANDED_KEY, JSON.stringify([...expandedLists])); }catch(e){} }

/* ---------- app boot ---------- */
document.addEventListener('DOMContentLoaded', ()=>{
  loadAll();
  applySettings();
  buildIconPicker(ICONS[0]);
  buildColorPicker(0);
  bindNav();
  bindToday();
  bindTaskForm();
  bindListForm();
  bindActionSheet();
  bindSort();
  bindMore();
  bindConfirm();
  renderAll();
});

function applySettings(){
  document.body.classList.toggle('dark', !!settings.dark);
  document.body.classList.remove('fs-xsmall','fs-small','fs-medium','fs-large');
  document.body.classList.add('fs-'+(settings.fontSize||'medium'));
}

function renderAll(){
  renderToday();
  renderProgress();
  renderLists();
  if(currentPage()==='list-detail' && currentListDetailId) renderListDetail(currentListDetailId);
}

function currentPage(){
  const active = document.querySelector('.page.active');
  return active ? active.id.replace('page-','') : 'today';
}

/* ---------- navigation ---------- */
function bindNav(){
  document.querySelectorAll('.nav-item').forEach(el=>{
    el.addEventListener('click', ()=> goToPage(el.dataset.page));
  });
  document.getElementById('settingsBtn').addEventListener('click', ()=> goToPage('more'));
  document.getElementById('listDetailBackBtn').addEventListener('click', ()=> goToPage('lists'));
  document.getElementById('fabBtn').addEventListener('click', ()=> openTaskForm(null));
  document.getElementById('addListBtn').addEventListener('click', ()=> openListForm(null));
}
function goToPage(page){
  document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
  const target = document.getElementById('page-'+page);
  if(target) target.classList.add('active');
  document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active', n.dataset.page===page));

  const titleEl = document.getElementById('pageTitle');
  const countEl = document.getElementById('taskCount');
  const headRow = document.querySelector('.wrap > #appContent > .head-row');
  if(page==='today'){
    headRow.style.display='flex';
    titleEl.textContent = 'Tasks';
    const openCount = tasks.filter(t=>!t.done).length;
    countEl.textContent = openCount + (openCount===1?' task':' tasks');
  } else {
    headRow.style.display='none';
  }
  if(page==='progress') renderProgress();
  if(page==='lists') renderLists();
}

/* ================= TODAY / TASKS PAGE ================= */
function bindToday(){
  document.querySelectorAll('#filterSeg .seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#filterSeg .seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      filterMode = btn.dataset.filter;
      renderToday();
    });
  });
  document.getElementById('sortBtn').addEventListener('click', ()=> showOverlay('sortOverlay'));
}

function getFilteredSortedTasks(scopeListId){
  let arr = tasks.slice();
  if(scopeListId) arr = arr.filter(t=>t.listId===scopeListId);
  if(filterMode==='active') arr = arr.filter(t=>!t.done);
  if(filterMode==='done') arr = arr.filter(t=>t.done);
  arr.sort((a,b)=>{
    if(sortMode==='due-asc'){
      const ad = a.dueDate || '9999-99-99', bd = b.dueDate || '9999-99-99';
      if(ad!==bd) return ad<bd?-1:1;
      return priorityRank(b.priority)-priorityRank(a.priority);
    }
    if(sortMode==='priority-desc') return priorityRank(b.priority)-priorityRank(a.priority);
    if(sortMode==='name-asc') return a.title.localeCompare(b.title);
    if(sortMode==='created-desc') return b.createdAt.localeCompare(a.createdAt);
    return 0;
  });
  // incomplete tasks first, then completed (unless explicitly filtering "done")
  if(filterMode==='all'){
    arr.sort((a,b)=> (a.done===b.done) ? 0 : (a.done ? 1 : -1));
  }
  return arr;
}

function renderToday(){
  const total = tasks.length;
  const done = tasks.filter(t=>t.done).length;
  const pending = total - done;
  const overdue = tasks.filter(t=> !t.done && t.dueDate && t.dueDate < todayStr()).length;
  const pct = total ? Math.round((done/total)*100) : 0;

  document.getElementById('completionValue').textContent = pct+'%';
  document.getElementById('statPending').textContent = pending;
  document.getElementById('statCompleted').textContent = done;
  document.getElementById('statOverdue').textContent = overdue;
  const ring = document.getElementById('completionRing');
  const color = pct===0 ? '#EEEAE0' : 'var(--green)';
  ring.style.background = `conic-gradient(${color} 0 ${pct}%, #EEEAE0 ${pct}% 100%)`;

  const openCount = pending;
  document.getElementById('taskCount').textContent = openCount + (openCount===1?' task':' tasks');

  const wrap = document.getElementById('lists');
  if(!lists.length){
    wrap.innerHTML = `<div class="empty-state"><div class="glyph">🗂</div><p>No categories yet.<br>Add one from the Lists tab.</p></div>`;
    return;
  }
  wrap.innerHTML = lists.map(l=>categoryGroupHtml(l)).join('');
  bindCategoryEvents(wrap);
}

function categoryGroupHtml(l){
  const c = colorFor(l);
  const listTasks = getFilteredSortedTasks(l.id);
  const totalInList = tasks.filter(t=>t.listId===l.id).length;
  const openInList = tasks.filter(t=>t.listId===l.id && !t.done).length;
  const isOpen = expandedLists.has(l.id);
  const bodyHtml = listTasks.length
    ? listTasks.map(t=>taskEntryHtml(t)).join('')
    : `<div class="empty-state" style="padding:22px 16px;"><p>${filterMode==='done' ? 'Nothing completed here yet.' : filterMode==='active' ? 'No active tasks here.' : 'No tasks in this category yet.'}</p></div>`;
  return `
    <div class="cat-group">
      <div class="cat-header" data-cat-toggle="${l.id}">
        <div class="entry-icon" style="background:${c.hex}">${l.icon}</div>
        <div class="cat-title">
          <div class="cat-name">${escapeHtml(l.name)}</div>
          <div class="cat-sub">${openInList} open · ${totalInList} total</div>
        </div>
        <div class="cat-chevron ${isOpen?'open':''}">⌄</div>
      </div>
      <div class="cat-body ${isOpen?'open':''}" id="catBody-${l.id}">
        ${bodyHtml}
      </div>
    </div>`;
}

function bindCategoryEvents(wrap){
  wrap.querySelectorAll('[data-cat-toggle]').forEach(header=>{
    header.addEventListener('click', ()=>{
      const id = header.dataset.catToggle;
      const body = document.getElementById('catBody-'+id);
      const chevron = header.querySelector('.cat-chevron');
      if(expandedLists.has(id)) expandedLists.delete(id); else expandedLists.add(id);
      body.classList.toggle('open');
      chevron.classList.toggle('open');
      saveExpanded();
    });
  });
  wrap.querySelectorAll('.cat-body').forEach(body=> bindTaskEntryEvents(body));
}

function taskEntryHtml(t){
  const list = listById(t.listId);
  const c = colorFor(list);
  const due = fmtDue(t.dueDate);
  const pillClass = t.priority==='high'?'pill-high':t.priority==='med'?'pill-med':'pill-low';
  const pillLabel = t.priority==='high'?'High':t.priority==='med'?'Medium':'Low';
  return `
    <div class="entry" data-task-id="${t.id}">
      <div class="status-toggle ${t.done?'done':''}" data-toggle-id="${t.id}">
        <svg viewBox="0 0 24 24" fill="none" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
      </div>
      <div class="entry-icon" style="background:${c.hex}">${list ? list.icon : '📌'}</div>
      <div class="entry-main">
        <div class="entry-name ${t.done?'done':''}">${escapeHtml(t.title)}</div>
        <div class="entry-sub">
          <span>${list ? escapeHtml(list.name) : 'No list'}</span>
          ${due ? `<span class="${due.overdue && !t.done ?'val-miss':''}">• ${due.overdue && !t.done ? 'Overdue · ' : ''}${due.label}</span>` : ''}
          <span class="pill ${pillClass}">${pillLabel}</span>
        </div>
      </div>
      <button class="entry-menu" data-menu-id="${t.id}">⋯</button>
    </div>`;
}

function bindTaskEntryEvents(scope){
  scope.querySelectorAll('[data-toggle-id]').forEach(el=>{
    el.addEventListener('click', (e)=>{ e.stopPropagation(); toggleTaskDone(el.dataset.toggleId); });
  });
  scope.querySelectorAll('[data-menu-id]').forEach(el=>{
    el.addEventListener('click', (e)=>{ e.stopPropagation(); openActionSheet(el.dataset.menuId); });
  });
  scope.querySelectorAll('.entry').forEach(el=>{
    el.addEventListener('click', ()=> openTaskForm(el.dataset.taskId));
  });
}

function toggleTaskDone(id){
  const t = taskById(id);
  if(!t) return;
  t.done = !t.done;
  t.completedAt = t.done ? todayStr() : null;
  saveTasks();
  renderAll();
  showToast(t.done ? 'Marked done' : 'Marked not done');
}

/* ---------- task form (add/edit) ---------- */
function bindTaskForm(){
  document.querySelectorAll('#prioritySeg .seg-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#prioritySeg .seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
    });
  });
  document.getElementById('taskFormCancel').addEventListener('click', ()=> hideOverlay('taskFormOverlay'));
  document.getElementById('taskFormSave').addEventListener('click', saveTaskForm);
}

function populateListSelect(selectedId){
  const sel = document.getElementById('tList');
  sel.innerHTML = lists.map(l=>`<option value="${l.id}" ${l.id===selectedId?'selected':''}>${l.icon} ${escapeHtml(l.name)}</option>`).join('');
}

function openTaskForm(id){
  editingTaskId = id;
  const t = id ? taskById(id) : null;
  document.getElementById('taskFormTitle').textContent = t ? 'Edit task' : 'New task';
  document.getElementById('tTitle').value = t ? t.title : '';
  document.getElementById('tNotes').value = t ? (t.notes||'') : '';
  document.getElementById('tDue').value = t ? (t.dueDate||'') : '';
  populateListSelect(t ? t.listId : (lists[0] && lists[0].id));
  document.querySelectorAll('#prioritySeg .seg-btn').forEach(b=>{
    b.classList.toggle('active', b.dataset.priority === (t ? t.priority : 'med'));
  });
  showOverlay('taskFormOverlay');
  setTimeout(()=> document.getElementById('tTitle').focus(), 200);
}

function saveTaskForm(){
  const title = document.getElementById('tTitle').value.trim();
  if(!title){ document.getElementById('tTitle').focus(); return; }
  const listId = document.getElementById('tList').value;
  const notes = document.getElementById('tNotes').value.trim();
  const dueDate = document.getElementById('tDue').value || '';
  const priorityBtn = document.querySelector('#prioritySeg .seg-btn.active');
  const priority = priorityBtn ? priorityBtn.dataset.priority : 'med';

  if(editingTaskId){
    const t = taskById(editingTaskId);
    if(t){ t.title=title; t.listId=listId; t.notes=notes; t.dueDate=dueDate; t.priority=priority; }
  } else {
    tasks.push({ id:uid('t'), title, notes, listId, priority, dueDate, done:false, createdAt:todayStr(), completedAt:null });
  }
  saveTasks();
  hideOverlay('taskFormOverlay');
  renderAll();
  showToast(editingTaskId ? 'Task updated' : 'Task added');
}

/* ---------- action sheet (edit/delete) ---------- */
function bindActionSheet(){
  document.getElementById('actionEdit').addEventListener('click', ()=>{
    hideOverlay('actionOverlay');
    openTaskForm(pendingActionTaskId);
  });
  document.getElementById('actionDelete').addEventListener('click', ()=>{
    hideOverlay('actionOverlay');
    deleteTaskWithUndo(pendingActionTaskId);
  });
  document.getElementById('actionCancel').addEventListener('click', ()=> hideOverlay('actionOverlay'));
}
function openActionSheet(id){
  pendingActionTaskId = id;
  const t = taskById(id);
  document.getElementById('actionSub').textContent = t ? t.title : '';
  showOverlay('actionOverlay');
}
function deleteTaskWithUndo(id){
  const idx = tasks.findIndex(t=>t.id===id);
  if(idx===-1) return;
  const [removed] = tasks.splice(idx,1);
  saveTasks();
  renderAll();
  pendingDeleteUndo = { task:removed, idx };
  showToast('Task deleted', true);
}

/* ---------- sort sheet ---------- */
function bindSort(){
  document.getElementById('sortCloseX').addEventListener('click', ()=> hideOverlay('sortOverlay'));
  document.querySelectorAll('[data-sort-radio]').forEach(radio=>{
    radio.addEventListener('change', ()=>{
      sortMode = radio.dataset.sortRadio;
      renderToday();
      hideOverlay('sortOverlay');
    });
  });
}
function syncSortRadios(){
  document.querySelectorAll('[data-sort-radio]').forEach(radio=>{
    radio.checked = radio.dataset.sortRadio === sortMode;
  });
}

/* ================= PROGRESS PAGE ================= */
function renderProgress(){
  const el = document.getElementById('progressContent');
  const days = []; for(let i=6;i>=0;i--) days.push(dateNDaysAgo(i));
  const names = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const counts = days.map(d => tasks.filter(t=> t.completedAt===d).length);
  const maxCount = Math.max(1, ...counts);

  const totalCompletedWeek = counts.reduce((a,b)=>a+b,0);
  const totalTasks = tasks.length;
  const totalDone = tasks.filter(t=>t.done).length;
  const overdue = tasks.filter(t=>!t.done && t.dueDate && t.dueDate<todayStr()).length;
  const avgPerDay = (totalCompletedWeek/7).toFixed(1);

  const barsHtml = days.map((d,i)=>{
    const dow = new Date(d+'T00:00:00').getDay();
    const pct = Math.round((counts[i]/maxCount)*100);
    return `<div class="bar-row">
      <div class="bar-row-top"><span class="bn">${names[dow]}</span><span class="bv">${counts[i]}</span></div>
      <div class="bar-track"><div class="bar-fill" style="width:${pct}%"></div></div>
    </div>`;
  }).join('');

  el.innerHTML = `
    <div class="stat-card">
      <h3>Tasks completed per day</h3>
      ${barsHtml}
    </div>
    <div class="insight-grid">
      <div class="insight-card">
        <div class="insight-icon">✅</div>
        <div class="insight-label">Completed (all time)</div>
        <div class="insight-value">${totalDone} / ${totalTasks}</div>
      </div>
      <div class="insight-card">
        <div class="insight-icon">📅</div>
        <div class="insight-label">This week</div>
        <div class="insight-value">${totalCompletedWeek} tasks</div>
      </div>
      <div class="insight-card">
        <div class="insight-icon">⚡</div>
        <div class="insight-label">Daily average</div>
        <div class="insight-value">${avgPerDay} / day</div>
      </div>
      <div class="insight-card">
        <div class="insight-icon">⏰</div>
        <div class="insight-label">Overdue now</div>
        <div class="insight-value" style="${overdue>0?'color:var(--red)':''}">${overdue}</div>
      </div>
    </div>
  `;
}

/* ================= LISTS PAGE ================= */
function renderLists(){
  const el = document.getElementById('listsContent');
  if(!lists.length){
    el.innerHTML = `<div class="empty-state"><div class="glyph">🗂</div><p>No lists yet.<br>Tap + to create one.</p></div>`;
    return;
  }
  el.innerHTML = lists.map(l=>{
    const c = colorFor(l);
    const listTasks = tasks.filter(t=>t.listId===l.id);
    const openCount = listTasks.filter(t=>!t.done).length;
    return `
      <div class="list-card" data-list-id="${l.id}">
        <div class="list-avatar" style="background:${c.hex}">${l.icon}</div>
        <div class="list-main">
          <div class="list-cname">${escapeHtml(l.name)}</div>
          <div class="list-csub">${listTasks.length} task${listTasks.length===1?'':'s'} total</div>
        </div>
        <div class="list-cnet">${openCount} open</div>
        <div class="list-chevron">›</div>
      </div>`;
  }).join('');
  el.querySelectorAll('[data-list-id]').forEach(card=>{
    card.addEventListener('click', ()=>{
      currentListDetailId = card.dataset.listId;
      goToPage('list-detail');
      renderListDetail(currentListDetailId);
    });
  });
}

function renderListDetail(listId){
  const l = listById(listId);
  const el = document.getElementById('listDetailContent');
  if(!l){ el.innerHTML=''; return; }
  const c = colorFor(l);
  const listTasks = getFilteredSortedTasks(listId);
  const total = tasks.filter(t=>t.listId===listId).length;
  const done = tasks.filter(t=>t.listId===listId && t.done).length;

  el.innerHTML = `
    <div class="gd-header" style="display:flex;align-items:center;gap:12px;margin-top:16px;">
      <div class="list-avatar" style="width:48px;height:48px;font-size:21px;background:${c.hex}">${l.icon}</div>
      <div style="flex:1;min-width:0;">
        <h2 style="font-size:20px;font-weight:800;margin:0;">${escapeHtml(l.name)}</h2>
        <p style="font-size:12.5px;color:var(--gray);margin:2px 0 0;">${done} of ${total} completed</p>
      </div>
      <button class="sq-btn" id="editListBtn" title="Edit list">✎</button>
    </div>
    <div id="listDetailTasks" style="margin-top:16px;"></div>
  `;
  const tWrap = document.getElementById('listDetailTasks');
  if(!listTasks.length){
    tWrap.innerHTML = `<div class="empty-state"><div class="glyph">📝</div><p>No tasks in this list yet.</p></div>`;
  } else {
    tWrap.innerHTML = `<div class="group">${listTasks.map(t=>taskEntryHtml(t)).join('')}</div>`;
    bindTaskEntryEvents(tWrap);
  }
  document.getElementById('editListBtn').addEventListener('click', ()=> openListForm(listId));
}

/* ---------- list form (add/edit) ---------- */
function bindListForm(){
  document.getElementById('listFormCancel').addEventListener('click', ()=> hideOverlay('listFormOverlay'));
  document.getElementById('listFormSave').addEventListener('click', saveListForm);
  document.getElementById('listFormDelete').addEventListener('click', ()=>{
    hideOverlay('listFormOverlay');
    confirmAction('Delete this list?', 'Tasks in this list will move to no list. This can\'t be undone.', ()=>{
      tasks.forEach(t=>{ if(t.listId===editingListId) t.listId=null; });
      lists = lists.filter(l=>l.id!==editingListId);
      saveLists(); saveTasks();
      goToPage('lists');
      renderAll();
      showToast('List deleted');
    });
  });
}

function buildIconPicker(selected){
  const el = document.getElementById('iconPicker');
  el.innerHTML = ICONS.map(ic=>`<div class="icon-opt ${ic===selected?'sel':''}" data-icon="${ic}">${ic}</div>`).join('');
  el.querySelectorAll('.icon-opt').forEach(o=>{
    o.addEventListener('click', ()=>{
      el.querySelectorAll('.icon-opt').forEach(x=>x.classList.remove('sel'));
      o.classList.add('sel');
    });
  });
}
function buildColorPicker(selectedIdx){
  const el = document.getElementById('colorPicker');
  el.innerHTML = COLORS.map((c,i)=>`<div class="color-opt ${i===selectedIdx?'sel':''}" data-coloridx="${i}" style="background:${c.hex}"></div>`).join('');
  el.querySelectorAll('.color-opt').forEach(o=>{
    o.addEventListener('click', ()=>{
      el.querySelectorAll('.color-opt').forEach(x=>x.classList.remove('sel'));
      o.classList.add('sel');
    });
  });
}
function getIconPicker(){ const sel = document.querySelector('#iconPicker .icon-opt.sel'); return sel ? sel.dataset.icon : ICONS[0]; }
function getColorPicker(){ const sel = document.querySelector('#colorPicker .color-opt.sel'); return sel ? parseInt(sel.dataset.coloridx,10) : 0; }

function openListForm(id){
  editingListId = id;
  const l = id ? listById(id) : null;
  document.getElementById('listFormTitle').textContent = l ? 'Edit list' : 'New list';
  document.getElementById('lName').value = l ? l.name : '';
  buildIconPicker(l ? l.icon : ICONS[0]);
  buildColorPicker(l ? l.colorIdx : (lists.length % COLORS.length));
  document.getElementById('listFormDelete').style.display = l ? 'block' : 'none';
  showOverlay('listFormOverlay');
  setTimeout(()=> document.getElementById('lName').focus(), 200);
}

function saveListForm(){
  const name = document.getElementById('lName').value.trim();
  if(!name){ document.getElementById('lName').focus(); return; }
  const icon = getIconPicker();
  const colorIdx = getColorPicker();
  if(editingListId){
    const l = listById(editingListId);
    if(l){ l.name=name; l.icon=icon; l.colorIdx=colorIdx; }
  } else {
    lists.push({ id:uid('l'), name, icon, colorIdx, createdAt:todayStr() });
  }
  saveLists();
  hideOverlay('listFormOverlay');
  renderAll();
  showToast(editingListId ? 'List updated' : 'List created');
}

/* ================= MORE PAGE ================= */
function bindMore(){
  const darkToggle = document.getElementById('darkToggle');
  darkToggle.classList.toggle('on', !!settings.dark);
  darkToggle.addEventListener('click', ()=>{
    settings.dark = !settings.dark;
    darkToggle.classList.toggle('on', settings.dark);
    applySettings();
    saveSettings();
  });

  document.querySelectorAll('#fontSizeSeg .seg-btn').forEach(btn=>{
    btn.classList.toggle('active', btn.dataset.fs===settings.fontSize);
    btn.addEventListener('click', ()=>{
      document.querySelectorAll('#fontSizeSeg .seg-btn').forEach(b=>b.classList.remove('active'));
      btn.classList.add('active');
      settings.fontSize = btn.dataset.fs;
      applySettings();
      saveSettings();
    });
  });

  document.getElementById('moreExportBtn').addEventListener('click', exportBackup);
  document.getElementById('moreImportBtn').addEventListener('click', ()=> document.getElementById('importFile').click());
  document.getElementById('importFile').addEventListener('change', importBackup);
  document.getElementById('moreResetBtn').addEventListener('click', ()=>{
    confirmAction('Reset all data?', 'This deletes every task and list on this device. This can\'t be undone.', ()=>{
      localStorage.removeItem(TASKS_KEY);
      localStorage.removeItem(LISTS_KEY);
      tasks = []; lists = [];
      loadAll(); // recreates default lists since storage is now empty
      renderAll();
      goToPage('today');
      showToast('All data reset');
    });
  });
}

function exportBackup(){
  const data = { tasks, lists, settings, exportedAt: new Date().toISOString(), app:'Flowlist' };
  const blob = new Blob([JSON.stringify(data,null,2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = 'flowlist-backup-'+todayStr()+'.json';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  showToast('Backup exported');
}

function importBackup(e){
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ()=>{
    try{
      const data = JSON.parse(reader.result);
      if(Array.isArray(data.tasks)) tasks = data.tasks;
      if(Array.isArray(data.lists) && data.lists.length) lists = data.lists;
      if(data.settings) settings = Object.assign(settings, data.settings);
      saveTasks(); saveLists(); saveSettings();
      applySettings();
      renderAll();
      showToast('Backup imported');
    }catch(err){
      showToast('Import failed — invalid file');
    }
  };
  reader.readAsText(file);
  e.target.value = '';
}

/* ================= shared: overlays, toast, confirm ================= */
function showOverlay(id){
  if(id==='sortOverlay') syncSortRadios();
  document.getElementById(id).classList.add('show');
}
function hideOverlay(id){ document.getElementById(id).classList.remove('show'); }

document.addEventListener('click', (e)=>{
  if(e.target.classList && e.target.classList.contains('overlay')) e.target.classList.remove('show');
});

let toastTimer = null;
function showToast(msg, withUndo){
  const toast = document.getElementById('toast');
  document.getElementById('toastMsg').textContent = msg;
  const undoBtn = document.getElementById('toastUndoBtn');
  undoBtn.style.display = withUndo ? 'inline-block' : 'none';
  toast.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(()=>{ toast.classList.remove('show'); pendingDeleteUndo=null; }, withUndo ? 5000 : 2200);
}
document.addEventListener('DOMContentLoaded', ()=>{
  document.getElementById('toastUndoBtn').addEventListener('click', ()=>{
    if(pendingDeleteUndo){
      tasks.splice(pendingDeleteUndo.idx, 0, pendingDeleteUndo.task);
      saveTasks();
      renderAll();
      pendingDeleteUndo = null;
    }
    document.getElementById('toast').classList.remove('show');
  });
});

let confirmCallback = null;
function bindConfirm(){
  document.getElementById('confirmCancelBtn').addEventListener('click', ()=> hideOverlay('confirmOverlay'));
  document.getElementById('confirmOkBtn').addEventListener('click', ()=>{
    hideOverlay('confirmOverlay');
    if(confirmCallback) confirmCallback();
    confirmCallback = null;
  });
}
function confirmAction(title, sub, cb){
  document.getElementById('confirmTitle').textContent = title;
  document.getElementById('confirmSub').textContent = sub;
  confirmCallback = cb;
  showOverlay('confirmOverlay');
}
