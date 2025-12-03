import { gameState } from './gameState.js';
import { parseTime, timeToMinutes, minutesToTime } from './timeWindowState.js';

const roleKeys = Object.keys(gameState.config.roles);

const isTimeInWindow = (time, windowStart, windowEnd) => {
  const timeMin = timeToMinutes(time);
  const startMin = timeToMinutes(windowStart);
  const endMin = timeToMinutes(windowEnd);

  // Handle window that wraps around midnight
  if (endMin < startMin) {
    return timeMin >= startMin || timeMin <= endMin;
  }

  return timeMin >= startMin && timeMin <= endMin;
};

const parseWindow = (windowString) => {
  const [start, end] = windowString.split('-');
  return { start, end };
};

const randomTimeBetween = (startTime, endTime) => {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);

  // Handle wrap around midnight
  if (endMin < startMin) {
    const minutesInDay = 24 * 60;
    const rangeSize = (minutesInDay - startMin) + endMin;
    const offset = Math.floor(Math.random() * rangeSize);
    const totalMin = (startMin + offset) % minutesInDay;
    return minutesToTime(totalMin);
  }

  const randomMin = Math.floor(Math.random() * (endMin - startMin)) + startMin;
  return minutesToTime(randomMin);
};

const randomTimeOutsideWindow = (windowString) => {
  const { start, end } = parseWindow(windowString);
  const startMin = timeToMinutes(start);
  const endMin = timeToMinutes(end);

  // Generate time in the opposite window
  let newStart, newEnd;
  if (endMin < startMin) {
    // Window wraps midnight, so opposite is the gap
    newStart = minutesToTime(endMin);
    newEnd = minutesToTime(startMin);
  } else {
    // Normal window, pick random outside section
    if (Math.random() < 0.5) {
      // Before window
      newStart = '00:00';
      newEnd = minutesToTime(Math.max(0, startMin - 1));
    } else {
      // After window
      newStart = minutesToTime(Math.min(1439, endMin + 1));
      newEnd = '23:59';
    }
  }

  return randomTimeBetween(newStart, newEnd);
};

const randomTimeInWindow = (windowString) => {
  const { start, end } = parseWindow(windowString);
  return randomTimeBetween(start, end);
};

const generateRandomTime = () => {
  const totalMinutes = Math.floor(Math.random() * (24 * 60));
  return minutesToTime(totalMinutes);
};

const generateNormalRoomLog = (roomId, allRoles) => {
  const entries = [];
  const entryCount = Math.floor(Math.random() * 7) + 6; // 6-12 entries

  // Room owner gets 2-3 entries
  const ownerEntryCount = Math.floor(Math.random() * 2) + 2; // 2-3
  for (let i = 0; i < ownerEntryCount; i++) {
    entries.push({
      roleId: roomId,
      time: generateRandomTime()
    });
  }

  // Fill remaining with random NPCs (0-1 entry each)
  const otherRoles = allRoles.filter((role) => role !== roomId);
  const remainingEntries = entryCount - ownerEntryCount;

  for (let i = 0; i < remainingEntries; i++) {
    const randomRole = otherRoles[Math.floor(Math.random() * otherRoles.length)];
    entries.push({
      roleId: randomRole,
      time: generateRandomTime()
    });
  }

  // Sort by time
  entries.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  return entries;
};

const generateMurderRoomLog = (murderRoomId, killerRole, plausibleSuspects, weaponEvidence, correctWeaponCategory, timeOfDeath, window8h, window4h, allRoles) => {
  const entries = [];
  const { start: start8h, end: end8h } = parseWindow(window8h);
  const { start: start4h, end: end4h } = parseWindow(window4h);

  // 1. Killer: 0-10 minutes before TOD (inside 4h window)
  const todMinutes = timeToMinutes(timeOfDeath);
  const killerMinutesBeforeTOD = Math.floor(Math.random() * 11); // 0-10
  const killerTime = minutesToTime(Math.max(0, todMinutes - killerMinutesBeforeTOD));
  entries.push({ roleId: killerRole, time: killerTime });

  // 2. Determine suspects remaining after weapon elimination
  // These are plausible suspects with correct weapon (excluding killer)
  const remainingAfterWeapon = plausibleSuspects.filter(rk =>
    rk !== killerRole && weaponEvidence[rk] === correctWeaponCategory
  );

  // 3. Eliminate 1 suspect via 8h window (outside window = alibi)
  const eliminate8hCount = Math.min(1, remainingAfterWeapon.length);
  const eliminateBy8h = remainingAfterWeapon.slice(0, eliminate8hCount);

  for (const roleId of eliminateBy8h) {
    entries.push({
      roleId,
      time: randomTimeOutsideWindow(window8h)
    });
  }

  const remainingAfter8h = remainingAfterWeapon.slice(eliminate8hCount);

  // 4. Eliminate 0-1 suspects via 4h window (in 8h but not 4h - "red herring")
  const eliminate4hCount = Math.min(
    Math.random() < 0.7 ? 1 : 0, // 70% chance to eliminate one
    remainingAfter8h.length
  );

  const eliminateBy4h = remainingAfter8h.slice(0, eliminate4hCount);

  for (const roleId of eliminateBy4h) {
    // Place in 8h window but outside 4h window
    let time;
    let attempts = 0;
    do {
      time = randomTimeInWindow(window8h);
      attempts++;
    } while (isTimeInWindow(time, start4h, end4h) && attempts < 100);

    // Fallback if we can't find a spot
    if (attempts >= 100) {
      const edge8hMin = timeToMinutes(start8h);
      const edge4hMin = timeToMinutes(start4h);
      if (Math.abs(edge8hMin - edge4hMin) > 30) {
        time = minutesToTime(edge8hMin + 15);
      } else {
        time = minutesToTime(timeToMinutes(end8h) - 15);
      }
    }

    entries.push({ roleId, time });
  }

  // 5. Final suspects: inside 4h window (including killer already added)
  const finalSuspects = remainingAfter8h.slice(eliminate4hCount);
  for (const roleId of finalSuspects) {
    entries.push({
      roleId,
      time: randomTimeInWindow(window4h)
    });
  }

  // 6. Add entries for non-plausible suspects (random times for realism)
  const nonPlausible = allRoles.filter(rk =>
    !plausibleSuspects.includes(rk) && rk !== murderRoomId
  );

  const randomEntryCount = Math.min(
    Math.floor(Math.random() * 3) + 2, // 2-4
    nonPlausible.length
  );

  for (let i = 0; i < randomEntryCount; i++) {
    if (nonPlausible.length > 0) {
      const roleId = nonPlausible[Math.floor(Math.random() * nonPlausible.length)];
      entries.push({
        roleId,
        time: generateRandomTime()
      });
    }
  }

  // Sort by time
  entries.sort((a, b) => timeToMinutes(a.time) - timeToMinutes(b.time));

  return entries;
};

export const generateAllDoorLogs = (murderRoomId, killerRole, plausibleSuspects, weaponEvidence, correctWeaponCategory, timeOfDeath, window8h, window4h) => {
  const doorLogs = {};
  const allRoles = roleKeys;
  const victimRole = gameState.case.victim?.roleKey;

  gameState.map.rooms.forEach((room) => {
    if (room.id === murderRoomId) {
      // Generate murder room log with constraint-based elimination
      doorLogs[room.id] = generateMurderRoomLog(
        murderRoomId,
        killerRole,
        plausibleSuspects,
        weaponEvidence,
        correctWeaponCategory,
        timeOfDeath,
        window8h,
        window4h,
        allRoles.filter((role) => role !== victimRole) // Exclude victim from all logs
      );
    } else {
      // Generate normal room log
      doorLogs[room.id] = generateNormalRoomLog(
        room.id,
        allRoles.filter((role) => role !== victimRole) // Exclude victim from all logs
      );
    }
  });

  return doorLogs;
};
