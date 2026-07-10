/**
 * Clustox CBPMS — Google Apps Script web app (server)
 * Backend = a Google Sheet (hidden datastore). Auth = Workspace SSO.
 * No passwords, no client-side DB keys. Every privileged call re-checks role server-side.
 */

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
var PROP_SHEET_ID = 'SPREADSHEET_ID';   // Script Property holding the data Spreadsheet id
var TABS = {
  CONFIG:        'Config',        // key | value
  DESIGNATIONS:  'Designations',  // id | name | identity
  KPIS:          'KPIs',          // designationId | kpiId | name | weight | desc | question | evidence
  BEHAVIORS:     'Behaviors',     // designationId | behaviorId | name | desc | question
  EMPLOYEES:     'Employees',     // id | name | email | designationId | department | manager | project | empType | addedAt
  ASSIGNMENTS:   'Assignments',   // reviewerEmail | employeeId
  REVIEWS:       'Reviews'        // see REVIEW_COLS below
};
var REVIEW_COLS = ['id','empId','empName','empEmail','designationId','designationName','department','project',
  'reviewerEmail','reviewerName','cycle','status','ratings','notes','behaviors','behaviorNotes',
  'jobScore','behaviorGate','recommendation','mgrComments','promotion','submittedAt','updatedAt','editRequest'];

var CYCLES = ['Q1 2025','Q2 2025','Q3 2025','Q4 2025','H1 2025','H2 2025','Annual 2025',
  'Q1 2026','Q2 2026','H1 2026','Annual 2026'];

// ─── WEB APP ENTRY ──────────────────────────────────────────────────────────--
function doGet() {
  return HtmlService.createTemplateFromFile('Index')
    .evaluate()
    .setTitle('Clustox CBPMS')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function include(name) {
  return HtmlService.createHtmlOutputFromFile(name).getContent();
}

// ─── IDENTITY & ROLE ────────────────────────────────────────────────────────--
function currentEmail_() {
  var e = Session.getActiveUser().getEmail();
  return (e || '').toLowerCase();
}
function admins_() {
  var v = configGet_('admins') || '';
  return v.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(String);
}
function isAdmin_() { return admins_().indexOf(currentEmail_()) >= 0; }
function requireAdmin_() { if (!isAdmin_()) throw new Error('Not authorized: admin only.'); }

// ─── SPREADSHEET ACCESS ─────────────────────────────────────────────────────--
function ss_() {
  var id = PropertiesService.getScriptProperties().getProperty(PROP_SHEET_ID);
  if (!id) throw new Error('Not set up yet. An admin must run setup() once. See SETUP.md.');
  return SpreadsheetApp.openById(id);
}
function sheet_(name) {
  var sh = ss_().getSheetByName(name);
  if (!sh) throw new Error('Missing tab: ' + name + '. Re-run setup().');
  return sh;
}
/** Read a tab as an array of plain objects keyed by the header row. */
function readTab_(name) {
  var rng = sheet_(name).getDataRange().getValues();
  if (rng.length < 2) return [];
  var head = rng[0];
  return rng.slice(1).filter(function (r) { return r.join('') !== ''; }).map(function (r) {
    var o = {}; head.forEach(function (h, i) { o[h] = r[i]; }); return o;
  });
}
/** Overwrite a tab's data rows (keeping header) from an array of objects. */
function writeTab_(name, rows, cols) {
  var sh = sheet_(name);
  var last = sh.getLastRow();
  if (last > 1) sh.getRange(2, 1, last - 1, sh.getLastColumn()).clearContent();
  if (!rows.length) return;
  var data = rows.map(function (o) { return cols.map(function (c) { return o[c] === undefined ? '' : o[c]; }); });
  sh.getRange(2, 1, data.length, cols.length).setValues(data);
}
function appendRow_(name, obj, cols) {
  sheet_(name).appendRow(cols.map(function (c) { return obj[c] === undefined ? '' : obj[c]; }));
}

function configGet_(key) {
  var rows = readTab_(TABS.CONFIG);
  for (var i = 0; i < rows.length; i++) if (rows[i].key === key) return rows[i].value;
  return null;
}

// ─── SCORING (authoritative — also mirrored on client for live display) ────────
function calcScore_(kpis, ratings) {
  return kpis.reduce(function (s, k, i) {
    return s + (Number(ratings[i]) || 0) * (Number(k.weight) / 100);
  }, 0);
}
function calcGate_(behaviors, beh) {
  var v = behaviors.map(function (_, i) { return beh[i] || ''; });
  if (v.indexOf('critical') >= 0) return 'critical';
  if (v.indexOf('watch') >= 0) return 'watch';
  if (v.length && v.every(function (x) { return x === 'meets'; })) return 'meets';
  return 'unset';
}
function getRec_(score, gate) {
  if (gate === 'critical') return 'PIP / Immediate Action';
  if (gate === 'watch')    return 'Coaching Required';
  if (score === 0)         return 'Not Rated';
  if (score >= 4.5)        return 'Exceptional';
  if (score >= 3.75)       return 'Exceeds Expectations';
  if (score >= 3.0)        return 'Meets Expectations';
  return 'Improvement Plan';
}

// ─── DATA SHAPING ───────────────────────────────────────────────────────────--
function designationsFull_() {
  var desigs = readTab_(TABS.DESIGNATIONS);
  var kpis = readTab_(TABS.KPIS);
  var beh = readTab_(TABS.BEHAVIORS);
  return desigs.map(function (d) {
    return {
      id: d.id, name: d.name, identity: d.identity,
      kpis: kpis.filter(function (k) { return k.designationId === d.id; })
        .map(function (k) { return { id: k.kpiId, name: k.name, weight: Number(k.weight), desc: k.desc, question: k.question, evidence: k.evidence }; }),
      behaviors: beh.filter(function (b) { return b.designationId === d.id; })
        .map(function (b) { return { id: b.behaviorId, name: b.name, desc: b.desc, question: b.question }; })
    };
  });
}
function reviewRowToObj_(r) {
  function parse(s) { try { return JSON.parse(s || '{}'); } catch (e) { return {}; } }
  return {
    id: r.id, empId: r.empId, empName: r.empName, empEmail: r.empEmail,
    designationId: r.designationId, designationName: r.designationName,
    department: r.department, project: r.project,
    reviewerEmail: r.reviewerEmail, reviewerName: r.reviewerName, cycle: r.cycle, status: r.status,
    ratings: parse(r.ratings), notes: parse(r.notes), behaviors: parse(r.behaviors), behaviorNotes: parse(r.behaviorNotes),
    jobScore: Number(r.jobScore) || 0, behaviorGate: r.behaviorGate, recommendation: r.recommendation,
    mgrComments: r.mgrComments, promotion: r.promotion,
    submittedAt: Number(r.submittedAt) || 0, updatedAt: Number(r.updatedAt) || 0,
    editRequest: (function () { try { return r.editRequest ? JSON.parse(r.editRequest) : null; } catch (e) { return null; } })()
  };
}

// ─── PUBLIC API (called from client via google.script.run) ─────────────────────
/** Single bootstrap call: identity, role, and the data this user is allowed to see. */
function getBootstrap() {
  var email = currentEmail_();
  if (!email) throw new Error('Could not determine your Google identity.');
  var admin = isAdmin_();
  var designations = designationsFull_();
  var employees = readTab_(TABS.EMPLOYEES);
  var assignments = readTab_(TABS.ASSIGNMENTS);
  var reviews = readTab_(TABS.REVIEWS).map(reviewRowToObj_);

  var myAssigned = assignments.filter(function (a) {
    return String(a.reviewerEmail).toLowerCase() === email;
  }).map(function (a) { return a.employeeId; });

  var out = {
    user: { email: email, role: admin ? 'admin' : 'reviewer' },
    isAdmin: admin,
    designations: designations,
    cycles: CYCLES,
    myAssigned: myAssigned,
    // employees assigned to me, for the reviewer wizard
    myEmployees: employees.filter(function (e) { return myAssigned.indexOf(e.id) >= 0; }),
    // my own reviews (drafts + submitted) as a reviewer
    myReviews: reviews.filter(function (r) { return String(r.reviewerEmail).toLowerCase() === email; })
  };
  if (admin) {
    out.employees = employees;
    out.assignments = assignments;
    out.reviews = reviews;   // admin sees all
  }
  return out;
}

/** Save (draft or submit) a review. Reviewer must be assigned to the employee (or admin). */
function saveReview(payload) {
  var email = currentEmail_();
  var employees = readTab_(TABS.EMPLOYEES);
  var emp = employees.filter(function (e) { return e.id === payload.empId; })[0];
  if (!emp) throw new Error('Unknown employee.');

  if (!isAdmin_()) {
    var assigned = readTab_(TABS.ASSIGNMENTS).some(function (a) {
      return String(a.reviewerEmail).toLowerCase() === email && a.employeeId === payload.empId;
    });
    if (!assigned) throw new Error('You are not assigned to review this employee.');
  }

  var desig = designationsFull_().filter(function (d) { return d.id === emp.designationId; })[0];
  if (!desig) throw new Error('Designation not configured.');

  var status = payload.status === 'submitted' ? 'submitted' : 'draft';
  if (status === 'submitted') {
    var rated = desig.kpis.filter(function (_, i) { return Number(payload.ratings[i]) > 0; }).length;
    if (rated < desig.kpis.length) throw new Error('Rate all ' + desig.kpis.length + ' KPIs before submitting.');
    var notes = payload.notes || {};
    var missingEvidence = desig.kpis.filter(function (_, i) { return !notes[i] || !String(notes[i]).trim(); }).length;
    if (missingEvidence > 0) throw new Error('Evidence is required for all KPIs — ' + missingEvidence + ' still missing.');
  }

  // Recompute score/gate/recommendation server-side — never trust the client.
  var score = calcScore_(desig.kpis, payload.ratings || {});
  var gate = calcGate_(desig.behaviors, payload.behaviors || {});
  var rec = getRec_(score, gate);
  var now = Date.now();

  var rows = readTab_(TABS.REVIEWS).map(reviewRowToObj_);
  // one review per (employee, cycle)
  var existing = rows.filter(function (r) { return r.empId === payload.empId && r.cycle === payload.cycle; })[0];

  var rec_obj = {
    id: existing ? existing.id : Utilities.getUuid(),
    empId: emp.id, empName: emp.name, empEmail: emp.email || '',
    designationId: desig.id, designationName: desig.name,
    department: emp.department || '', project: emp.project || '',
    reviewerEmail: email, reviewerName: payload.reviewerName || email,
    cycle: payload.cycle, status: status,
    ratings: JSON.stringify(payload.ratings || {}),
    notes: JSON.stringify(payload.notes || {}),
    behaviors: JSON.stringify(payload.behaviors || {}),
    behaviorNotes: JSON.stringify(payload.behaviorNotes || {}),
    jobScore: score.toFixed(4), behaviorGate: gate, recommendation: rec,
    mgrComments: payload.mgrComments || '', promotion: payload.promotion || '',
    submittedAt: status === 'submitted' ? now : (existing ? existing.submittedAt : ''),
    updatedAt: now,
    // Submitting clears any pending/approved edit request; a draft keeps whatever was there.
    editRequest: status === 'submitted' ? '' : (existing && existing.editRequest ? JSON.stringify(existing.editRequest) : '')
  };

  // upsert by id
  var raw = readTab_(TABS.REVIEWS);
  var idx = -1;
  for (var i = 0; i < raw.length; i++) if (raw[i].id === rec_obj.id) { idx = i; break; }
  if (idx >= 0) { raw[idx] = rec_obj; writeTab_(TABS.REVIEWS, raw, REVIEW_COLS); }
  else { appendRow_(TABS.REVIEWS, rec_obj, REVIEW_COLS); }

  return { ok: true, jobScore: score, behaviorGate: gate, recommendation: rec, status: status };
}

/** Reviewer asks admin for permission to edit an already-submitted review. */
function requestReviewEdit(reviewId, reason) {
  var email = currentEmail_();
  if (!reason || !String(reason).trim()) throw new Error('A reason for the edit request is required.');
  var raw = readTab_(TABS.REVIEWS);
  var idx = -1;
  for (var i = 0; i < raw.length; i++) if (raw[i].id === reviewId) { idx = i; break; }
  if (idx < 0) throw new Error('Review not found.');
  if (!isAdmin_() && String(raw[idx].reviewerEmail).toLowerCase() !== email) {
    throw new Error('You can only request edits on your own reviews.');
  }
  raw[idx].editRequest = JSON.stringify({
    requestedBy: email, reason: String(reason).trim(), requestedAt: Date.now(), status: 'pending'
  });
  writeTab_(TABS.REVIEWS, raw, REVIEW_COLS);
  return { ok: true };
}

/** Admin approves or rejects a pending edit request. decision = 'approved' | 'rejected'. */
function resolveEditRequest(reviewId, decision) {
  requireAdmin_();
  if (decision !== 'approved' && decision !== 'rejected') throw new Error('Invalid decision.');
  var raw = readTab_(TABS.REVIEWS);
  var idx = -1;
  for (var i = 0; i < raw.length; i++) if (raw[i].id === reviewId) { idx = i; break; }
  if (idx < 0) throw new Error('Review not found.');
  var er;
  try { er = raw[idx].editRequest ? JSON.parse(raw[idx].editRequest) : null; } catch (e) { er = null; }
  if (!er) throw new Error('No edit request on this review.');
  er.status = decision;
  er.resolvedBy = currentEmail_();
  er.resolvedAt = Date.now();
  raw[idx].editRequest = JSON.stringify(er);
  writeTab_(TABS.REVIEWS, raw, REVIEW_COLS);
  return { ok: true, status: decision };
}

// ── Admin: employees ──
function saveEmployee(emp) {
  requireAdmin_();
  if (!emp.name) throw new Error('Name is required.');
  if (!emp.designationId) throw new Error('Designation is required.');
  emp.empCode = String(emp.empCode == null ? '' : emp.empCode).trim();
  if (!emp.empCode) throw new Error('Employee ID is required.');
  var rows = readTab_(TABS.EMPLOYEES);
  var dupe = rows.some(function (e) {
    return e.id !== emp.id &&
      String(e.empCode || '').trim().toLowerCase() === emp.empCode.toLowerCase();
  });
  if (dupe) throw new Error('Employee ID "' + emp.empCode + '" is already in use.');
  if (emp.id) {
    var found = false;
    rows = rows.map(function (e) { if (e.id === emp.id) { found = true; return Object.assign(e, emp); } return e; });
    if (!found) throw new Error('Employee not found.');
  } else {
    emp.id = Utilities.getUuid();
    emp.addedAt = Date.now();
    rows.push(emp);
  }
  var cols = ['id','name','email','designationId','department','manager','project','empType','addedAt','empCode'];
  writeTab_(TABS.EMPLOYEES, rows, cols);
  return { ok: true, id: emp.id };
}
function deleteEmployee(id) {
  requireAdmin_();
  var cols = ['id','name','email','designationId','department','manager','project','empType','addedAt','empCode'];
  writeTab_(TABS.EMPLOYEES, readTab_(TABS.EMPLOYEES).filter(function (e) { return e.id !== id; }), cols);
  writeTab_(TABS.ASSIGNMENTS, readTab_(TABS.ASSIGNMENTS).filter(function (a) { return a.employeeId !== id; }), ['reviewerEmail','employeeId']);
  return { ok: true };
}

// ── Admin: assignments (reviewer email -> employee ids) ──
function setAssignments(reviewerEmail, employeeIds) {
  requireAdmin_();
  reviewerEmail = String(reviewerEmail || '').trim().toLowerCase();
  if (!reviewerEmail) throw new Error('Reviewer email required.');
  employeeIds = employeeIds || [];

  var all = readTab_(TABS.ASSIGNMENTS);
  var prev = all.filter(function (a) { return String(a.reviewerEmail).toLowerCase() === reviewerEmail; })
    .map(function (a) { return a.employeeId; });
  var rows = all.filter(function (a) { return String(a.reviewerEmail).toLowerCase() !== reviewerEmail; });
  employeeIds.forEach(function (id) { rows.push({ reviewerEmail: reviewerEmail, employeeId: id }); });
  writeTab_(TABS.ASSIGNMENTS, rows, ['reviewerEmail','employeeId']);

  // Notify the reviewer only when NEW employees were added (not on removals/no-ops).
  var added = employeeIds.filter(function (id) { return prev.indexOf(id) < 0; });
  var emailed = false;
  if (added.length) { try { notifyReviewer_(reviewerEmail, employeeIds, added.length); emailed = true; } catch (e) {} }
  return { ok: true, emailed: emailed };
}

/** Email a reviewer that employees have been assigned to them for evaluation. */
function notifyReviewer_(reviewerEmail, employeeIds, newCount) {
  if (!employeeIds.length) return;
  var emps = readTab_(TABS.EMPLOYEES);
  var desigs = readTab_(TABS.DESIGNATIONS);
  function desigName(id) { var d = desigs.filter(function (x) { return x.id === id; })[0]; return d ? d.name : ''; }
  var names = employeeIds.map(function (id) {
    var e = emps.filter(function (x) { return x.id === id; })[0];
    if (!e) return null;
    var dn = desigName(e.designationId);
    return ' • ' + e.name + (dn ? ' — ' + dn : '');
  }).filter(String);

  var url = '';
  try {
    url = ScriptApp.getService().getUrl();
    if (url) url += (url.indexOf('?') >= 0 ? '&' : '?') + 'view=eval';
  } catch (e) {}

  var subject = 'Clustox CBPMS — employees assigned for your review';
  var body = 'Hello,\n\n' +
    'You have been assigned ' + newCount + ' new employee' + (newCount === 1 ? '' : 's') +
    ' to evaluate in the Clustox Competency Based Performance Management System.\n\n' +
    'Your current assignment (' + names.length + ' total):\n' + names.join('\n') + '\n\n' +
    'Please sign in to complete their evaluations' + (url ? ':\n' + url : '.') + '\n\n' +
    'You can save drafts as you go and submit when ready. Submitted reviews stay available under "My Reviews".\n\n' +
    '— Clustox CBPMS';
  MailApp.sendEmail(reviewerEmail, subject, body);
}

// ── Admin: designations & KPIs ──
function saveDesignation(d) {
  requireAdmin_();
  if (!d.name) throw new Error('Designation name required.');
  var sum = (d.kpis || []).reduce(function (s, k) { return s + (Number(k.weight) || 0); }, 0);
  if (d.kpis && d.kpis.length && Math.round(sum) !== 100) throw new Error('KPI weights must sum to 100% (currently ' + sum + '%).');

  var desigs = readTab_(TABS.DESIGNATIONS);
  if (!d.id) d.id = (d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')) || Utilities.getUuid();
  var di = -1; for (var i = 0; i < desigs.length; i++) if (desigs[i].id === d.id) di = i;
  var drow = { id: d.id, name: d.name, identity: d.identity || '' };
  if (di >= 0) desigs[di] = drow; else desigs.push(drow);
  writeTab_(TABS.DESIGNATIONS, desigs, ['id','name','identity']);

  // rewrite KPI + behavior rows for this designation
  var kpis = readTab_(TABS.KPIS).filter(function (k) { return k.designationId !== d.id; });
  (d.kpis || []).forEach(function (k, i) {
    kpis.push({ designationId: d.id, kpiId: k.id || ('k' + (i + 1)), name: k.name, weight: k.weight, desc: k.desc || '', question: k.question || '', evidence: k.evidence || '' });
  });
  writeTab_(TABS.KPIS, kpis, ['designationId','kpiId','name','weight','desc','question','evidence']);

  var beh = readTab_(TABS.BEHAVIORS).filter(function (b) { return b.designationId !== d.id; });
  (d.behaviors || []).forEach(function (b, i) {
    beh.push({ designationId: d.id, behaviorId: b.id || ('b' + (i + 1)), name: b.name, desc: b.desc || '', question: b.question || '' });
  });
  writeTab_(TABS.BEHAVIORS, beh, ['designationId','behaviorId','name','desc','question']);
  return { ok: true, id: d.id };
}
function deleteDesignation(id) {
  requireAdmin_();
  writeTab_(TABS.DESIGNATIONS, readTab_(TABS.DESIGNATIONS).filter(function (d) { return d.id !== id; }), ['id','name','identity']);
  writeTab_(TABS.KPIS, readTab_(TABS.KPIS).filter(function (k) { return k.designationId !== id; }), ['designationId','kpiId','name','weight','desc','question','evidence']);
  writeTab_(TABS.BEHAVIORS, readTab_(TABS.BEHAVIORS).filter(function (b) { return b.designationId !== id; }), ['designationId','behaviorId','name','desc','question']);
  return { ok: true };
}
