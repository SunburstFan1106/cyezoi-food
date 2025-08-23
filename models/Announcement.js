const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    pinned: { type: Boolean, default: false },
    published: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

AnnouncementSchema.virtual('id').get(function () {
  return this._id.toString();
});

module.exports = mongoose.model('Announcement', AnnouncementSchema);
