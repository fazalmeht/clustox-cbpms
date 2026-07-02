/**
 * One-time setup. Run setup() from the Apps Script editor (Run ▸ setup) while signed in
 * as the account that should own the data. It creates the Spreadsheet, builds the tabs,
 * seeds the 5 designations + KPIs, and registers you as the first admin.
 * Safe to re-run: it will NOT overwrite existing data — it only creates what's missing.
 */
function setup() {
  var props = PropertiesService.getScriptProperties();
  var id = props.getProperty(PROP_SHEET_ID);
  var ss;
  if (id) {
    ss = SpreadsheetApp.openById(id);
  } else {
    ss = SpreadsheetApp.create('Clustox CBPMS — Data (do not edit by hand)');
    props.setProperty(PROP_SHEET_ID, ss.getId());
    // remove the default empty sheet later, after tabs exist
  }

  var headers = {};
  headers[TABS.CONFIG]       = ['key','value'];
  headers[TABS.DESIGNATIONS] = ['id','name','identity'];
  headers[TABS.KPIS]         = ['designationId','kpiId','name','weight','desc','question','evidence'];
  headers[TABS.BEHAVIORS]    = ['designationId','behaviorId','name','desc','question'];
  headers[TABS.EMPLOYEES]    = ['id','name','email','designationId','department','manager','project','empType','addedAt'];
  headers[TABS.ASSIGNMENTS]  = ['reviewerEmail','employeeId'];
  headers[TABS.REVIEWS]      = REVIEW_COLS;

  Object.keys(headers).forEach(function (name) {
    var sh = ss.getSheetByName(name);
    if (!sh) { sh = ss.insertSheet(name); }
    if (sh.getLastRow() === 0) {
      sh.getRange(1, 1, 1, headers[name].length).setValues([headers[name]]).setFontWeight('bold');
      sh.setFrozenRows(1);
    }
  });

  // drop the auto-created "Sheet1" if still empty
  var def = ss.getSheetByName('Sheet1');
  if (def && ss.getSheets().length > 1) ss.deleteSheet(def);

  // register first admin
  var me = currentEmail_();
  if (!configGet_('admins')) {
    appendRow_(TABS.CONFIG, { key: 'admins', value: me }, ['key','value']);
  }

  // seed designations only if empty
  if (readTab_(TABS.DESIGNATIONS).length === 0) seedDesignations_();

  Logger.log('Setup complete. Spreadsheet id: ' + ss.getId());
  Logger.log('Admin: ' + me);
  Logger.log('Deploy the web app, then open its URL.');
}

/** Add another admin by email (run from the editor, or manage the Config tab via the app later). */
function addAdmin(email) {
  var v = configGet_('admins') || '';
  var list = v.split(',').map(function (s) { return s.trim().toLowerCase(); }).filter(String);
  email = String(email || '').trim().toLowerCase();
  if (email && list.indexOf(email) < 0) {
    list.push(email);
    var rows = readTab_(TABS.CONFIG).map(function (r) { if (r.key === 'admins') r.value = list.join(','); return r; });
    writeTab_(TABS.CONFIG, rows, ['key','value']);
  }
  Logger.log('Admins: ' + list.join(', '));
}

function seedDesignations_() {
  SEED.forEach(function (d) {
    appendRow_(TABS.DESIGNATIONS, { id: d.id, name: d.name, identity: d.identity }, ['id','name','identity']);
    d.kpis.forEach(function (k) {
      appendRow_(TABS.KPIS, { designationId: d.id, kpiId: k.id, name: k.name, weight: k.weight, desc: k.desc, question: k.question, evidence: k.evidence },
        ['designationId','kpiId','name','weight','desc','question','evidence']);
    });
    d.behaviors.forEach(function (b) {
      appendRow_(TABS.BEHAVIORS, { designationId: d.id, behaviorId: b.id, name: b.name, desc: b.desc, question: b.question },
        ['designationId','behaviorId','name','desc','question']);
    });
  });
}

// Faithful port of the original DEFAULT_DESIGS.
var BEH_BASE = [
  { id: 'b1', name: 'Professionalism & Accountability', desc: 'Reliability, ownership, punctuality, professional conduct, and follow-through.', question: 'Can I consistently rely on this person to honor commitments?' },
  { id: 'b2', name: 'Collaboration & Communication', desc: 'Teamwork, responsiveness, respectful communication, and constructive conflict resolution.', question: 'Is this person someone others actively want to work with?' }
];
var BEH_LEAD = { id: 'b3', name: 'Leadership Behavior', desc: 'Positive influence, constructive feedback, team motivation, conflict handling.', question: 'Does this person elevate those around them?' };

var SEED = [
  { id: 'ase', name: 'Associate Software Engineer', identity: 'Learn, execute, collaborate, and grow.',
    kpis: [
      { id: 'k1', name: 'Delivery Ownership & Technical Excellence', weight: 30, desc: 'Delivers assigned tasks with quality following engineering standards.', question: 'Can this person reliably complete assigned work with minimal supervision?', evidence: 'Completed tasks, PR feedback, QA feedback, rework history.' },
      { id: 'k2', name: 'Product Thinking & Requirements Engineering', weight: 10, desc: 'Understands assigned requirements and connects tasks to feature purpose.', question: 'Do they understand the purpose behind their assigned work?', evidence: 'Grooming participation, clarification questions, requirement notes.' },
      { id: 'k3', name: 'Project Adaptability & Business Agility', weight: 15, desc: 'Adjusts to changing priorities and technologies without major productivity loss.', question: 'Can they adapt without significant productivity loss?', evidence: 'Ramp-up speed, flexibility during priority changes, lead feedback.' },
      { id: 'k4', name: 'Team Communication & Collaboration', weight: 15, desc: 'Communicates within the team, raises blockers early, and collaborates professionally.', question: 'Can I rely on them to communicate proactively within the team?', evidence: 'Slack/Jira updates, blocker communication, meeting participation.' },
      { id: 'k5', name: 'AI Fluency & Engineering Productivity', weight: 15, desc: 'Uses AI tools responsibly and validates AI-generated outputs before use.', question: 'Are they using AI to learn faster and become more productive?', evidence: 'AI-assisted coding, documentation, debugging examples.' },
      { id: 'k6', name: 'Learning Agility & Skill Development', weight: 15, desc: 'Demonstrates consistent learning, skill growth, and openness to feedback.', question: 'Are they growing at the expected pace for their level?', evidence: 'Learning plan progress, training participation, improved independence.' }
    ], behaviors: BEH_BASE },
  { id: 'se', name: 'Software Engineer', identity: 'Independent contributor who owns features and collaborates across functions.',
    kpis: [
      { id: 'k1', name: 'Delivery Ownership', weight: 20, desc: 'Owns assigned features end-to-end with reliable follow-through and first-time quality.', question: 'Can I trust them to independently deliver features with minimal follow-up?', evidence: 'On-time delivery, low rework, low bug leakage, risk updates.' },
      { id: 'k2', name: 'Technical Excellence', weight: 15, desc: 'Produces maintainable, testable, standards-aligned solutions.', question: 'Is this person building reliable and maintainable solutions?', evidence: 'PR quality, code maintainability, test coverage, defect trends.' },
      { id: 'k3', name: 'Product Thinking & Requirements Engineering', weight: 15, desc: 'Understands feature context, dependencies, and business value.', question: 'Do they understand both the what and the why?', evidence: 'Grooming input, dependency identification, requirement gaps raised.' },
      { id: 'k4', name: 'Project Adaptability & Business Agility', weight: 10, desc: 'Creates value across changing project needs, domains, tools, and priorities.', question: 'Can they create value wherever the business needs them?', evidence: 'Project transitions, ramp-up speed, domain learning, flexibility.' },
      { id: 'k5', name: 'Cross-Functional Collaboration', weight: 10, desc: 'Collaborates effectively with PMs, QA, Tech Leads while communicating status.', question: 'Can they independently collaborate across functions?', evidence: 'Updates, QA/PM feedback, planning discussions, stakeholder responsiveness.' },
      { id: 'k6', name: 'AI Fluency & Engineering Productivity', weight: 15, desc: 'Integrates AI into daily workflows while critically validating outputs.', question: 'Are they leveraging AI effectively and safely?', evidence: 'AI-assisted coding/debugging, prompt examples, productivity improvements.' },
      { id: 'k7', name: 'Team Enablement', weight: 10, desc: 'Supports junior engineers and contributes to team effectiveness.', question: 'Do they positively influence and support the team?', evidence: 'Pairing support, onboarding help, knowledge sharing.' },
      { id: 'k8', name: 'Organizational Contribution', weight: 5, desc: 'Contributes to internal improvements beyond assigned work.', question: 'Are they helping Clustox improve beyond their project tasks?', evidence: 'Process suggestions, documentation, templates, hiring support.' }
    ], behaviors: BEH_BASE },
  { id: 'sse', name: 'Senior Software Engineer', identity: 'Technical leader who owns modules, mentors others, and builds client trust.',
    kpis: [
      { id: 'k1', name: 'Delivery Ownership', weight: 20, desc: 'Owns complex deliverables/modules with reliable execution and proactive risk management.', question: 'Can I trust them to independently deliver complex work?', evidence: 'Module delivery, predictable execution, low rework, risk management.' },
      { id: 'k2', name: 'Technical Excellence', weight: 15, desc: 'Raises the technical quality bar through strong design and engineering standards.', question: 'Is this person raising the technical quality bar?', evidence: 'Code/design reviews, defect trends, technical decisions.' },
      { id: 'k3', name: 'Product Thinking & Requirements Engineering', weight: 15, desc: 'Understands module-level impact, dependencies, and business outcomes.', question: 'Do they understand the bigger picture of the module and client context?', evidence: 'Requirement analysis, module dependencies, risk identification.' },
      { id: 'k4', name: 'Mentorship & Team Enablement', weight: 15, desc: 'Develops other engineers through coaching, reviews, pairing, and knowledge sharing.', question: 'Do they make other engineers better?', evidence: 'Mentorship evidence, junior improvement, knowledge sessions.' },
      { id: 'k5', name: 'Stakeholder Communication & Client Trust', weight: 10, desc: 'Communicates independently with stakeholders/clients and handles escalations.', question: 'Would I confidently put them in front of a client?', evidence: 'Client feedback, meeting ownership, escalation handling.' },
      { id: 'k6', name: 'AI Fluency & Engineering Productivity', weight: 10, desc: 'Uses and promotes AI-enabled workflows that improve team productivity.', question: 'Are they helping the team work smarter with AI?', evidence: 'Agentic workflows, AI guidance, reusable prompts/playbooks.' },
      { id: 'k7', name: 'Project Adaptability & Business Agility', weight: 10, desc: 'Maintains performance through changing priorities, domains, and project needs.', question: 'Can they maintain performance through change?', evidence: 'Transition feedback, complex project support, domain ramp-up.' },
      { id: 'k8', name: 'Organizational Contribution', weight: 5, desc: 'Improves engineering, delivery, QA, or operational processes beyond immediate role.', question: 'Are they making Clustox stronger?', evidence: 'Playbooks, standards, process improvements, hiring contributions.' }
    ], behaviors: BEH_BASE.concat([BEH_LEAD]) },
  { id: 'principal', name: 'Principal Software Engineer', identity: 'Technical multiplier who influences products, teams, and client partnerships.',
    kpis: [
      { id: 'k1', name: 'Technical Strategy & Delivery Leadership', weight: 20, desc: 'Provides technical direction, reduces delivery risk, and improves decision-making.', question: 'Are they elevating technical decision-making and delivery outcomes?', evidence: 'Architecture input, risk resolution, delivery leadership, technical roadmaps.' },
      { id: 'k2', name: 'Product Thinking & Business Impact', weight: 20, desc: 'Connects technical decisions to product success, client outcomes, and business value.', question: 'Are they influencing product success and business outcomes?', evidence: 'Roadmap input, product risk analysis, business-value decisions.' },
      { id: 'k3', name: 'Cross-Team Enablement & Mentorship', weight: 15, desc: 'Develops engineers and technical leaders across multiple teams.', question: 'Are they multiplying the effectiveness of others?', evidence: 'Mentorship of seniors/leads, cross-team guidance, technical forums.' },
      { id: 'k4', name: 'Stakeholder Leadership & Client Partnership', weight: 15, desc: 'Leads stakeholder relationships and strengthens client confidence.', question: 'Are they strengthening client partnerships?', evidence: 'Client leadership feedback, strategic discussions, escalation ownership.' },
      { id: 'k5', name: 'AI Fluency & Engineering Productivity', weight: 10, desc: 'Champions AI adoption, reusable workflows, and productivity improvements.', question: 'Are they advancing AI maturity across teams?', evidence: 'AI playbooks, automation workflows, team adoption.' },
      { id: 'k6', name: 'Organizational Contribution', weight: 10, desc: 'Improves systems, standards, and internal operating models at scale.', question: 'Are they making Clustox better at scale?', evidence: 'Engineering standards, governance, reusable assets, hiring bar.' },
      { id: 'k7', name: 'Business Agility & Strategic Initiatives', weight: 10, desc: 'Supports strategic initiatives and helps the organization respond to business change.', question: 'Can they lead through business change?', evidence: 'Strategic initiative participation, cross-project support.' }
    ], behaviors: BEH_BASE.concat([BEH_LEAD]) },
  { id: 'srarch', name: 'Senior Software Architect', identity: 'Business and technology strategist shaping architecture, standards, and long-term value.',
    kpis: [
      { id: 'k1', name: 'Architectural Vision & Technical Strategy', weight: 25, desc: 'Defines scalable architecture, technical standards, and long-term technology direction.', question: 'Are they building systems and standards that will scale?', evidence: 'Architecture artifacts, standards, technical strategy, design governance.' },
      { id: 'k2', name: 'Product Thinking & Business Impact', weight: 20, desc: 'Aligns technology decisions with product strategy, client goals, and business outcomes.', question: 'Are they maximizing business value through technology?', evidence: 'Business-aligned architecture, tradeoff decisions, roadmap influence.' },
      { id: 'k3', name: 'Engineering Enablement & Organizational Influence', weight: 15, desc: 'Elevates engineering practices and technical maturity across the organization.', question: 'Are they positively influencing the entire engineering organization?', evidence: 'Standards, coaching architects/leads, communities of practice.' },
      { id: 'k4', name: 'Executive Communication & Strategic Partnership', weight: 15, desc: 'Communicates with senior stakeholders to align technology and business strategy.', question: 'Would I confidently put them in front of executive stakeholders?', evidence: 'Executive presentations, strategic workshops, stakeholder feedback.' },
      { id: 'k5', name: 'AI Strategy & Engineering Productivity', weight: 15, desc: 'Shapes AI-enabled engineering strategy and scalable adoption across teams.', question: 'Are they shaping our AI-enabled future?', evidence: 'AI strategy, reusable frameworks, adoption roadmaps.' },
      { id: 'k6', name: 'Organizational Contribution', weight: 5, desc: 'Creates long-term organizational value through standards, governance, and process improvements.', question: 'Are they creating long-term organizational value?', evidence: 'Governance, templates, process design, technical policy.' },
      { id: 'k7', name: 'Business Agility & Innovation', weight: 5, desc: 'Identifies innovation opportunities and helps Clustox stay ahead of technology shifts.', question: 'Are they helping Clustox stay ahead of the curve?', evidence: 'Innovation proposals, emerging technology evaluation.' }
    ], behaviors: BEH_BASE.concat([BEH_LEAD]) }
];
