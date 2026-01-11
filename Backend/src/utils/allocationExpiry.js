function parseSessionStartYear(sessionYear) {
  const raw = String(sessionYear || "").trim();
  const match = /(19|20)\d{2}/.exec(raw);
  if (!match) return null;
  return Number(match[0]);
}

// Business rule:
// Session 2021-22 stays through 2025, cancels when 2026 starts.
// cancelDate = Jan 1 of (startYear + 5)
function computeCancelDateFromSessionYear(sessionYear) {
  const startYear = parseSessionStartYear(sessionYear);
  if (!startYear) return null;
  return new Date(startYear + 5, 0, 1);
}

function startOfDay(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function daysBetween(a, b) {
  const msPerDay = 24 * 60 * 60 * 1000;
  const aa = startOfDay(a);
  const bb = startOfDay(b);
  return Math.round((bb.getTime() - aa.getTime()) / msPerDay);
}

function addMonthsSafe(dateInput, months) {
  const base = new Date(dateInput);
  if (Number.isNaN(base.getTime())) return null;
  const d = new Date(base);
  const day = d.getDate();
  d.setMonth(d.getMonth() + months);
  if (d.getDate() !== day) {
    d.setDate(0);
  }
  return d;
}

function addYearsSafe(dateInput, years) {
  return addMonthsSafe(dateInput, years * 12);
}

// Effective expiry date rules:
// - If allocation.endDate is set, it wins.
// - Else if session-based expiry is after allocation startDate, use session-based expiry.
// - Else (session already expired / late/manual allocation), give 1 year from allocation startDate.
function computeEffectiveExpiryDate({ sessionYear, startDate, endDate }) {
  if (endDate) {
    const ed = new Date(endDate);
    return Number.isNaN(ed.getTime()) ? null : ed;
  }

  const bySession = computeCancelDateFromSessionYear(sessionYear);
  const sd = startDate ? new Date(startDate) : null;
  const hasStart = sd && !Number.isNaN(sd.getTime());

  if (bySession && hasStart) {
    // If the session-based expiry is already before or on the start date,
    // it means the session already expired at allocation time.
    if (bySession.getTime() <= sd.getTime()) {
      return addYearsSafe(sd, 1);
    }
    return bySession;
  }

  if (bySession) return bySession;
  if (hasStart) return addYearsSafe(sd, 1);
  return null;
}

module.exports = {
  parseSessionStartYear,
  computeCancelDateFromSessionYear,
  startOfDay,
  daysBetween,
  addMonthsSafe,
  addYearsSafe,
  computeEffectiveExpiryDate,
};
