const Announcement = require('../../models/Announcement');

exports.list = async (req, res) => {
  try {
    const { page = 1, limit = 20, includeUnpublished = 'false' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const publishedOnly = includeUnpublished !== 'true';

    const filter = publishedOnly ? { published: true } : {};

    const announcements = await Announcement.find(filter)
      .populate('createdBy', 'username avatar')
      .sort({ pinned: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Announcement.countDocuments(filter);

    res.json({ success: true, announcements, pagination: { currentPage: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)), total } });
  } catch (e) {
    console.error('Announcement.list error', e);
    res.status(500).json({ success: false, message: '获取公告失败' });
  }
};

exports.get = async (req, res) => {
  try {
    const announcement = await Announcement.findById(req.params.id).populate('createdBy', 'username avatar');
    if (!announcement) return res.status(404).json({ success: false, message: '公告不存在' });
    if (!announcement.published) return res.status(404).json({ success: false, message: '公告不存在' });
    res.json({ success: true, announcement });
  } catch (e) {
    console.error('Announcement.get error', e);
    res.status(500).json({ success: false, message: '获取公告失败' });
  }
};

exports.create = async (req, res) => {
  try {
    const { title, content, pinned = false, published = true } = req.body;
    if (!title || !content) return res.status(400).json({ success: false, message: '标题和内容不能为空' });
    const a = new Announcement({ title: title.trim(), content, pinned: !!pinned, published: !!published, createdBy: req.user._id });
    const saved = await a.save();
    await saved.populate('createdBy', 'username avatar');
    res.status(201).json({ success: true, announcement: saved });
  } catch (e) {
    console.error('Announcement.create error', e);
    res.status(500).json({ success: false, message: '创建公告失败' });
  }
};

exports.update = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ success: false, message: '公告不存在' });

    const { title, content, pinned, published } = req.body;
    if (title !== undefined) announcement.title = title.trim();
    if (content !== undefined) announcement.content = content;
    if (pinned !== undefined) announcement.pinned = !!pinned;
    if (published !== undefined) announcement.published = !!published;

    const updated = await announcement.save();
    await updated.populate('createdBy', 'username avatar');
    res.json({ success: true, announcement: updated });
  } catch (e) {
    console.error('Announcement.update error', e);
    res.status(500).json({ success: false, message: '更新公告失败' });
  }
};

exports.remove = async (req, res) => {
  try {
    const { id } = req.params;
    const announcement = await Announcement.findById(id);
    if (!announcement) return res.status(404).json({ success: false, message: '公告不存在' });
    await Announcement.findByIdAndDelete(id);
    res.json({ success: true, message: '公告已删除' });
  } catch (e) {
    console.error('Announcement.remove error', e);
    res.status(500).json({ success: false, message: '删除公告失败' });
  }
};
