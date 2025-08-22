// 公告栏模块：负责加载并渲染公告列表与详情

export async function loadAnnouncements(ctx = { apiUrl: 'api' }) {
  try {
    const res = await fetch(`${ctx.apiUrl}/announcements`);
    const data = await res.json();
    if (!data.success) return [];
    return data.announcements || [];
  } catch (e) {
    console.error('loadAnnouncements error', e);
    return [];
  }
}

export function renderAnnouncements(announcements = []) {
  if (!announcements || announcements.length === 0) {
    return `
      <div id="announcements-section" class="announcements-section">
        <div id="announcements-title" class="ann-main-title">公告栏</div>
        <div class="ann-empty">暂无公告</div>
      </div>
    `;
  }
  
  return `
    <div id="announcements-section" class="announcements-section">
      <div id="announcements-title" class="ann-main-title">公告栏</div>
      <div class="ann-cards">
        ${announcements.map(a => `
          <div class="ann-card" data-id="${a._id}">
            <div class="ann-card-header">
              <h3 class="ann-card-title">${escapeHtml(a.title)}</h3>
              ${a.pinned ? '<span class="ann-badge ann-badge-pinned">置顶</span>' : ''}
            </div>
            <div class="ann-card-meta">
              <span class="ann-author">${a.createdBy ? escapeHtml(a.createdBy.username) : '系统'}</span>
              <span class="ann-date">${new Date(a.createdAt).toLocaleDateString('zh-CN')}</span>
            </div>
            <div class="ann-card-content">${escapeHtml(truncate(a.content, 200))}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function truncate(str, n) {
  if (!str) return '';
  return str.length > n ? str.slice(0, n-1) + '…' : str;
}

function escapeHtml(unsafe) {
  if (unsafe === undefined || unsafe === null) return '';
  return String(unsafe).replace(/[&<>"']/g, function(m) { return ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#039;"})[m]; });
}

// 增加点击委托用于显示详情
export function bindAnnouncementsClicks(container = document) {
  container.addEventListener('click', async (e) => {
    const card = e.target.closest('.ann-card');
    if (!card) return;
    const id = card.getAttribute('data-id');
    try {
      const res = await fetch(`/api/announcements/${id}`);
      const data = await res.json();
      if (!data.success) return;
      showAnnouncementModal(data.announcement);
    } catch (err) {
      console.error('fetch announcement detail error', err);
    }
  });
}

export function showAnnouncementModal(ann) {
  // 简易 modal
  let modal = document.getElementById('announcementModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'announcementModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="close" id="announcementModalClose">&times;</span>
        <h2 id="announcementModalTitle"></h2>
        <div id="announcementModalBody"></div>
      </div>`;
    document.getElementById('modals-root').appendChild(modal);
    document.getElementById('announcementModalClose').addEventListener('click', () => { modal.style.display = 'none'; });
  }
  modal.querySelector('#announcementModalTitle').textContent = ann.title;
  modal.querySelector('#announcementModalBody').innerHTML = `<div class="ann-full">${escapeHtml(ann.content)}</div>`;
  modal.style.display = 'block';
}

// 导出一个挂载点函数，供 App 使用
export async function mountAnnouncements(appInstance) {
  const announcements = await loadAnnouncements({ apiUrl: appInstance.apiUrl });
  
  // 配置公告栏位置：'sidebar' 或 'bottom'
  const position = 'sidebar'; // 您可以改为 'bottom'
  
  if (position === 'sidebar') {
    mountAsSidebar(announcements);
  } else {
    mountAsBottom(announcements);
  }
  
  bindAnnouncementsClicks(document);
}

function mountAsSidebar(announcements) {
  // 创建主布局容器（如果不存在）
  const root = document.getElementById('app-root');
  let mainLayout = document.querySelector('.main-layout');
  
  if (!mainLayout) {
    // 如果还没有主布局，需要重构页面结构
    const existingContainer = document.querySelector('.container');
    if (existingContainer) {
      // 将现有容器包装在新的布局中
      mainLayout = document.createElement('div');
      mainLayout.className = 'main-layout';
      
      const contentArea = document.createElement('div');
      contentArea.className = 'content-area';
      
      const sidebar = document.createElement('div');
      sidebar.className = 'announcements-sidebar';
      
      // 移动现有容器到内容区
      existingContainer.parentNode.insertBefore(mainLayout, existingContainer);
      contentArea.appendChild(existingContainer);
      mainLayout.appendChild(contentArea);
      mainLayout.appendChild(sidebar);
    }
  }
  
  // 移除旧的公告元素
  removeExistingAnnouncements();
  
  // 将公告内容插入到侧边栏
  const sidebar = document.querySelector('.announcements-sidebar');
  if (sidebar) {
    const announcementsHtml = renderAnnouncements(announcements);
    sidebar.innerHTML = announcementsHtml;
  }
}

function mountAsBottom(announcements) {
  // 恢复原来的布局（移除侧边栏布局）
  const mainLayout = document.querySelector('.main-layout');
  if (mainLayout) {
    const container = mainLayout.querySelector('.container');
    const root = document.getElementById('app-root');
    if (container && root) {
      root.appendChild(container);
      mainLayout.remove();
    }
  }
  
  // 移除旧的公告元素
  removeExistingAnnouncements();
  
  // 将公告添加到页面底部
  const root = document.getElementById('app-root');
  const announcementsHtml = renderAnnouncements(announcements);
  
  const bottomSection = document.createElement('div');
  bottomSection.className = 'announcements-bottom';
  bottomSection.innerHTML = announcementsHtml;
  
  root.appendChild(bottomSection);
}

function removeExistingAnnouncements() {
  const existingSection = document.getElementById('announcements-section');
  const existingTitle = document.getElementById('announcements-title');
  const existingHeader = document.getElementById('announcements-header');
  const existingBottom = document.querySelector('.announcements-bottom');
  
  if (existingSection) existingSection.remove();
  if (existingTitle) existingTitle.remove();
  if (existingHeader) existingHeader.remove();
  if (existingBottom) existingBottom.remove();
}

// 管理员管理公告功能
export function showAdminAnnouncementModal() {
  let modal = document.getElementById('adminAnnouncementModal');
  if (!modal) {
    modal = document.createElement('div');
    modal.id = 'adminAnnouncementModal';
    modal.className = 'modal';
    modal.innerHTML = `
      <div class="modal-content" style="max-width: 800px;">
        <span class="close" id="adminAnnounceModalClose">&times;</span>
        <h2>📢 管理公告</h2>
        <div class="admin-announce-tabs">
          <button id="createAnnounceTab" class="tab-btn active">创建公告</button>
          <button id="manageAnnounceTab" class="tab-btn">管理公告</button>
        </div>
        <div id="createAnnouncePanel" class="tab-panel">
          <form id="createAnnounceForm">
            <div class="form-group">
              <label>公告标题</label>
              <input type="text" name="title" required placeholder="输入公告标题">
            </div>
            <div class="form-group">
              <label>公告内容</label>
              <textarea name="content" required placeholder="输入公告内容" rows="6"></textarea>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" name="pinned"> 置顶显示
              </label>
            </div>
            <div class="form-group">
              <label>
                <input type="checkbox" name="published" checked> 立即发布
              </label>
            </div>
            <div class="form-actions">
              <button type="submit" class="primary">创建公告</button>
              <button type="button" id="cancelCreateAnnounce">取消</button>
            </div>
          </form>
        </div>
        <div id="manageAnnouncePanel" class="tab-panel" style="display:none;">
          <div id="announceList">加载中...</div>
        </div>
      </div>`;
    document.getElementById('modals-root').appendChild(modal);
    
    // 绑定事件
    document.getElementById('adminAnnounceModalClose').addEventListener('click', () => { modal.style.display = 'none'; });
    document.getElementById('cancelCreateAnnounce').addEventListener('click', () => { modal.style.display = 'none'; });
    document.getElementById('createAnnounceTab').addEventListener('click', () => switchTab('create'));
    document.getElementById('manageAnnounceTab').addEventListener('click', () => switchTab('manage'));
    document.getElementById('createAnnounceForm').addEventListener('submit', handleCreateAnnounce);
    
    function switchTab(tab) {
      document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach(panel => panel.style.display = 'none');
      
      if (tab === 'create') {
        document.getElementById('createAnnounceTab').classList.add('active');
        document.getElementById('createAnnouncePanel').style.display = 'block';
      } else {
        document.getElementById('manageAnnounceTab').classList.add('active');
        document.getElementById('manageAnnouncePanel').style.display = 'block';
        loadManageAnnouncements();
      }
    }
  }
  
  modal.style.display = 'block';
}

async function handleCreateAnnounce(e) {
  e.preventDefault();
  const form = e.target;
  const formData = new FormData(form);
  
  try {
    const response = await fetch('/api/announcements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        title: formData.get('title'),
        content: formData.get('content'),
        pinned: formData.get('pinned') === 'on',
        published: formData.get('published') === 'on'
      })
    });
    
    const result = await response.json();
    if (result.success) {
      alert('公告创建成功！');
      form.reset();
      document.getElementById('adminAnnouncementModal').style.display = 'none';
      // 刷新公告显示
      if (window.app) {
        await mountAnnouncements(window.app);
      }
    } else {
      alert('创建失败: ' + result.message);
    }
  } catch (error) {
    console.error('创建公告失败:', error);
    alert('网络错误，请重试');
  }
}

async function loadManageAnnouncements() {
  try {
    const response = await fetch('/api/announcements?includeUnpublished=true', {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.success) {
      renderManageList(data.announcements);
    } else {
      document.getElementById('announceList').innerHTML = '<p>加载失败</p>';
    }
  } catch (error) {
    console.error('加载公告列表失败:', error);
    document.getElementById('announceList').innerHTML = '<p>网络错误</p>';
  }
}

function renderManageList(announcements) {
  if (!announcements || announcements.length === 0) {
    document.getElementById('announceList').innerHTML = '<p>暂无公告</p>';
    return;
  }
  
  const html = announcements.map(ann => `
    <div class="manage-ann-item">
      <div class="manage-ann-info">
        <h4>${escapeHtml(ann.title)} ${ann.pinned ? '<span class="badge">置顶</span>' : ''} ${!ann.published ? '<span class="badge unpublished">未发布</span>' : ''}</h4>
        <p>${escapeHtml(truncate(ann.content, 100))}</p>
        <small>创建时间: ${new Date(ann.createdAt).toLocaleString()}</small>
      </div>
      <div class="manage-ann-actions">
        <button onclick="editAnnouncement('${ann._id}')" class="btn-small">编辑</button>
        <button onclick="deleteAnnouncement('${ann._id}')" class="btn-small danger">删除</button>
      </div>
    </div>
  `).join('');
  
  document.getElementById('announceList').innerHTML = html;
}

window.editAnnouncement = async function(id) {
  // 简化版：直接prompt编辑
  const title = prompt('新标题:');
  const content = prompt('新内容:');
  if (!title || !content) return;
  
  try {
    const response = await fetch(`/api/announcements/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ title, content })
    });
    
    const result = await response.json();
    if (result.success) {
      alert('更新成功！');
      loadManageAnnouncements();
      if (window.app) await mountAnnouncements(window.app);
    } else {
      alert('更新失败: ' + result.message);
    }
  } catch (error) {
    console.error('更新失败:', error);
    alert('网络错误');
  }
};

window.deleteAnnouncement = async function(id) {
  if (!confirm('确定删除此公告吗？')) return;
  
  try {
    const response = await fetch(`/api/announcements/${id}`, {
      method: 'DELETE',
      credentials: 'include'
    });
    
    const result = await response.json();
    if (result.success) {
      alert('删除成功！');
      loadManageAnnouncements();
      if (window.app) await mountAnnouncements(window.app);
    } else {
      alert('删除失败: ' + result.message);
    }
  } catch (error) {
    console.error('删除失败:', error);
    alert('网络错误');
  }
};
