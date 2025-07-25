const blockedPhone = require('../models/blockedPhone.js');

const BLOCK_DURATION_MINUTES = 15;
const MAX_ATTEMPTS = 5;

const isPhoneBlocked = async (phone) => {
  const record = await blockedPhone.findOne({ phone });
  if (!record) return false;

  const now = new Date();
  return record.unlocked_at > now;
};

const removeBlockIfExpired = async (phone) => {
  const now = new Date();
  await blockedPhone.deleteOne({ phone, unlocked_at: { $lt: now } });
};

const blockPhone = async (phone) => {
  const now = new Date();
  const unlockTime = new Date(now.getTime() + BLOCK_DURATION_MINUTES * 60000);

  const existing = await blockedPhone.findOne({ phone });

  if (existing) {
    const rec = existing.recurrences + 1;

    if (rec >= MAX_ATTEMPTS) {
      // Bloquear
      await blockedPhone.updateOne({ phone }, {
        $set: {
          locked_at: now,
          unlocked_at: unlockTime,
          recurrences: rec
        }
      });
    } else {
      // Solo aumentar recurrences
      await blockedPhone.updateOne({ phone }, {
        $set: { recurrences: rec }
      });
    }
  } else {
    // Crear nuevo registro de bloqueo
    await blockedPhone.create({
      phone,
      locked_at: now,
      unlocked_at: unlockTime,
      recurrences: 1
    });
  }
};

module.exports = {
  isPhoneBlocked,
  removeBlockIfExpired,
  blockPhone
};
