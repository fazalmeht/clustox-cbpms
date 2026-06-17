import { useState, useEffect, useCallback, useRef } from "react";
// ─── SUPABASE CLIENT ─────────────────────────────────────────────────────────
const SUPA_URL = "https://cwemsdfdfrpwdgpecdws.supabase.co";
const SUPA_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN3ZW1zZGZkZnJwd2RncGVjZHdzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2OTc0ODQsImV4cCI6MjA5NzI3MzQ4NH0.LYMI3Sl8H1tXqP-wShi7a7QRH9czGwGx_a6O51_1dOs";

const db = {
  async get(key) {
    const r = await fetch(SUPA_URL + "/rest/v1/cbpms_config?key=eq." + key + "&select=value", {
      headers: { apikey: SUPA_KEY, Authorization: "Bearer " + SUPA_KEY }
    });
    const rows = await r.json();
    return rows.length ? rows[0].value : null;
  },
  async set(key, value) {
    await fetch(SUPA_URL + "/rest/v1/cbpms_config", {
      method: "POST",
      headers: {
        apikey: SUPA_KEY,
        Authorization: "Bearer " + SUPA_KEY,
        "Content-Type": "application/json",
        Prefer: "resolution=merge-duplicates"
      },
      body: JSON.stringify({ key, value, updated_at: new Date().toISOString() })
    });
  }
};



const LOGO = "data:image/png;base64,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";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const C = {
  bg:      "#F5F7FA",
  sidebar: "#FFFFFF",
  card:    "#FFFFFF",
  border:  "#E8ECF0",
  border2: "#D1D9E0",
  green:   "#1DB954",
  greenD:  "#17a349",
  greenL:  "#E8F8EE",
  blue:    "#3B82F6",
  blueL:   "#EFF6FF",
  purple:  "#8B5CF6",
  purpleL: "#F5F3FF",
  amber:   "#F59E0B",
  amberL:  "#FFFBEB",
  red:     "#EF4444",
  redL:    "#FEF2F2",
  teal:    "#0EA5E9",
  tealL:   "#F0F9FF",
  text:    "#111827",
  text2:   "#374151",
  text3:   "#6B7280",
  text4:   "#9CA3AF",
  white:   "#FFFFFF",
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
const uid = () => Math.random().toString(36).slice(2,9);
const lsGet = (k,fb) => { try { const v=localStorage.getItem(k); return v?JSON.parse(v):fb; } catch{ return fb; } };
const lsSet = (k,v) => { try { localStorage.setItem(k,JSON.stringify(v)); } catch{} };

const RLABELS = ["","Unsatisfactory","Needs Improvement","Meets Expectations","Exceeds Expectations","Exceptional"];
const RCOLORS = ["",C.red,C.amber,"#F59E0B",C.teal,C.green];

function calcScore(kpis,r){return kpis.reduce((s,k,i)=>s+(r[i]||0)*(k.weight/100),0);}
function calcGate(behaviors,b){
  const v=behaviors.map((_,i)=>b[i]||"");
  if(v.includes("critical"))return"critical";
  if(v.includes("watch"))return"watch";
  if(v.every(x=>x==="meets"))return"meets";
  return"unset";
}
function getRec(score,gate){
  if(gate==="critical")return{label:"PIP / Immediate Action",color:C.red,bg:"#FEF2F2",icon:"🚨"};
  if(gate==="watch")   return{label:"Coaching Required",     color:C.amber,bg:"#FFFBEB",icon:"⚠️"};
  if(score===0)        return{label:"Not Rated",              color:C.text4,bg:C.bg,     icon:"⏳"};
  if(score>=4.5)       return{label:"Exceptional",            color:C.green,bg:C.greenL, icon:"🏆"};
  if(score>=3.75)      return{label:"Exceeds Expectations",   color:C.teal, bg:C.tealL,  icon:"⭐"};
  if(score>=3.0)       return{label:"Meets Expectations",     color:C.blue, bg:C.blueL,  icon:"✅"};
  return                      {label:"Improvement Plan",      color:C.red,  bg:C.redL,   icon:"📋"};
}

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
const DEFAULT_CREDS = {
  admin: {id:"admin",username:"admin",password:"clustox@admin",role:"admin",name:"Administrator"},
};

const REVIEWERS_DEFAULT = [];

const DEFAULT_DESIGS = [
  {id:"ase",name:"Associate Software Engineer",identity:"Learn, execute, collaborate, and grow.",
   kpis:[
    {id:"k1",name:"Delivery Ownership & Technical Excellence",weight:30,desc:"Delivers assigned tasks with quality following engineering standards.",question:"Can this person reliably complete assigned work with minimal supervision?",evidence:"Completed tasks, PR feedback, QA feedback, rework history."},
    {id:"k2",name:"Product Thinking & Requirements Engineering",weight:10,desc:"Understands assigned requirements and connects tasks to feature purpose.",question:"Do they understand the purpose behind their assigned work?",evidence:"Grooming participation, clarification questions, requirement notes."},
    {id:"k3",name:"Project Adaptability & Business Agility",weight:15,desc:"Adjusts to changing priorities and technologies without major productivity loss.",question:"Can they adapt without significant productivity loss?",evidence:"Ramp-up speed, flexibility during priority changes, lead feedback."},
    {id:"k4",name:"Team Communication & Collaboration",weight:15,desc:"Communicates within the team, raises blockers early, and collaborates professionally.",question:"Can I rely on them to communicate proactively within the team?",evidence:"Slack/Jira updates, blocker communication, meeting participation."},
    {id:"k5",name:"AI Fluency & Engineering Productivity",weight:15,desc:"Uses AI tools responsibly and validates AI-generated outputs before use.",question:"Are they using AI to learn faster and become more productive?",evidence:"AI-assisted coding, documentation, debugging examples."},
    {id:"k6",name:"Learning Agility & Skill Development",weight:15,desc:"Demonstrates consistent learning, skill growth, and openness to feedback.",question:"Are they growing at the expected pace for their level?",evidence:"Learning plan progress, training participation, improved independence."},
   ],
   behaviors:[
    {id:"b1",name:"Professionalism & Accountability",desc:"Reliability, ownership, punctuality, professional conduct, and follow-through.",question:"Can I consistently rely on this person to honor commitments?"},
    {id:"b2",name:"Collaboration & Communication",desc:"Teamwork, responsiveness, respectful communication, and constructive conflict resolution.",question:"Is this person someone others actively want to work with?"},
   ]},
  {id:"se",name:"Software Engineer",identity:"Independent contributor who owns features and collaborates across functions.",
   kpis:[
    {id:"k1",name:"Delivery Ownership",weight:20,desc:"Owns assigned features end-to-end with reliable follow-through and first-time quality.",question:"Can I trust them to independently deliver features with minimal follow-up?",evidence:"On-time delivery, low rework, low bug leakage, risk updates."},
    {id:"k2",name:"Technical Excellence",weight:15,desc:"Produces maintainable, testable, standards-aligned solutions.",question:"Is this person building reliable and maintainable solutions?",evidence:"PR quality, code maintainability, test coverage, defect trends."},
    {id:"k3",name:"Product Thinking & Requirements Engineering",weight:15,desc:"Understands feature context, dependencies, and business value.",question:"Do they understand both the what and the why?",evidence:"Grooming input, dependency identification, requirement gaps raised."},
    {id:"k4",name:"Project Adaptability & Business Agility",weight:10,desc:"Creates value across changing project needs, domains, tools, and priorities.",question:"Can they create value wherever the business needs them?",evidence:"Project transitions, ramp-up speed, domain learning, flexibility."},
    {id:"k5",name:"Cross-Functional Collaboration",weight:10,desc:"Collaborates effectively with PMs, QA, Tech Leads while communicating status.",question:"Can they independently collaborate across functions?",evidence:"Updates, QA/PM feedback, planning discussions, stakeholder responsiveness."},
    {id:"k6",name:"AI Fluency & Engineering Productivity",weight:15,desc:"Integrates AI into daily workflows while critically validating outputs.",question:"Are they leveraging AI effectively and safely?",evidence:"AI-assisted coding/debugging, prompt examples, productivity improvements."},
    {id:"k7",name:"Team Enablement",weight:10,desc:"Supports junior engineers and contributes to team effectiveness.",question:"Do they positively influence and support the team?",evidence:"Pairing support, onboarding help, knowledge sharing."},
    {id:"k8",name:"Organizational Contribution",weight:5,desc:"Contributes to internal improvements beyond assigned work.",question:"Are they helping Clustox improve beyond their project tasks?",evidence:"Process suggestions, documentation, templates, hiring support."},
   ],
   behaviors:[
    {id:"b1",name:"Professionalism & Accountability",desc:"Reliability, ownership, punctuality, professional conduct, and follow-through.",question:"Can I consistently rely on this person to honor commitments?"},
    {id:"b2",name:"Collaboration & Communication",desc:"Teamwork, responsiveness, respectful communication, and constructive conflict resolution.",question:"Is this person someone others actively want to work with?"},
   ]},
  {id:"sse",name:"Senior Software Engineer",identity:"Technical leader who owns modules, mentors others, and builds client trust.",
   kpis:[
    {id:"k1",name:"Delivery Ownership",weight:20,desc:"Owns complex deliverables/modules with reliable execution and proactive risk management.",question:"Can I trust them to independently deliver complex work?",evidence:"Module delivery, predictable execution, low rework, risk management."},
    {id:"k2",name:"Technical Excellence",weight:15,desc:"Raises the technical quality bar through strong design and engineering standards.",question:"Is this person raising the technical quality bar?",evidence:"Code/design reviews, defect trends, technical decisions."},
    {id:"k3",name:"Product Thinking & Requirements Engineering",weight:15,desc:"Understands module-level impact, dependencies, and business outcomes.",question:"Do they understand the bigger picture of the module and client context?",evidence:"Requirement analysis, module dependencies, risk identification."},
    {id:"k4",name:"Mentorship & Team Enablement",weight:15,desc:"Develops other engineers through coaching, reviews, pairing, and knowledge sharing.",question:"Do they make other engineers better?",evidence:"Mentorship evidence, junior improvement, knowledge sessions."},
    {id:"k5",name:"Stakeholder Communication & Client Trust",weight:10,desc:"Communicates independently with stakeholders/clients and handles escalations.",question:"Would I confidently put them in front of a client?",evidence:"Client feedback, meeting ownership, escalation handling."},
    {id:"k6",name:"AI Fluency & Engineering Productivity",weight:10,desc:"Uses and promotes AI-enabled workflows that improve team productivity.",question:"Are they helping the team work smarter with AI?",evidence:"Agentic workflows, AI guidance, reusable prompts/playbooks."},
    {id:"k7",name:"Project Adaptability & Business Agility",weight:10,desc:"Maintains performance through changing priorities, domains, and project needs.",question:"Can they maintain performance through change?",evidence:"Transition feedback, complex project support, domain ramp-up."},
    {id:"k8",name:"Organizational Contribution",weight:5,desc:"Improves engineering, delivery, QA, or operational processes beyond immediate role.",question:"Are they making Clustox stronger?",evidence:"Playbooks, standards, process improvements, hiring contributions."},
   ],
   behaviors:[
    {id:"b1",name:"Professionalism & Accountability",desc:"Reliability, ownership, punctuality, professional conduct, and follow-through.",question:"Can I consistently rely on this person to honor commitments?"},
    {id:"b2",name:"Collaboration & Communication",desc:"Teamwork, responsiveness, respectful communication, and constructive conflict resolution.",question:"Is this person someone others actively want to work with?"},
    {id:"b3",name:"Leadership Behavior",desc:"Positive influence, constructive feedback, team motivation, conflict handling.",question:"Does this person elevate those around them?"},
   ]},
  {id:"principal",name:"Principal Software Engineer",identity:"Technical multiplier who influences products, teams, and client partnerships.",
   kpis:[
    {id:"k1",name:"Technical Strategy & Delivery Leadership",weight:20,desc:"Provides technical direction, reduces delivery risk, and improves decision-making.",question:"Are they elevating technical decision-making and delivery outcomes?",evidence:"Architecture input, risk resolution, delivery leadership, technical roadmaps."},
    {id:"k2",name:"Product Thinking & Business Impact",weight:20,desc:"Connects technical decisions to product success, client outcomes, and business value.",question:"Are they influencing product success and business outcomes?",evidence:"Roadmap input, product risk analysis, business-value decisions."},
    {id:"k3",name:"Cross-Team Enablement & Mentorship",weight:15,desc:"Develops engineers and technical leaders across multiple teams.",question:"Are they multiplying the effectiveness of others?",evidence:"Mentorship of seniors/leads, cross-team guidance, technical forums."},
    {id:"k4",name:"Stakeholder Leadership & Client Partnership",weight:15,desc:"Leads stakeholder relationships and strengthens client confidence.",question:"Are they strengthening client partnerships?",evidence:"Client leadership feedback, strategic discussions, escalation ownership."},
    {id:"k5",name:"AI Fluency & Engineering Productivity",weight:10,desc:"Champions AI adoption, reusable workflows, and productivity improvements.",question:"Are they advancing AI maturity across teams?",evidence:"AI playbooks, automation workflows, team adoption."},
    {id:"k6",name:"Organizational Contribution",weight:10,desc:"Improves systems, standards, and internal operating models at scale.",question:"Are they making Clustox better at scale?",evidence:"Engineering standards, governance, reusable assets, hiring bar."},
    {id:"k7",name:"Business Agility & Strategic Initiatives",weight:10,desc:"Supports strategic initiatives and helps the organization respond to business change.",question:"Can they lead through business change?",evidence:"Strategic initiative participation, cross-project support."},
   ],
   behaviors:[
    {id:"b1",name:"Professionalism & Accountability",desc:"Reliability, ownership, punctuality, professional conduct, and follow-through.",question:"Can I consistently rely on this person to honor commitments?"},
    {id:"b2",name:"Collaboration & Communication",desc:"Teamwork, responsiveness, respectful communication, and constructive conflict resolution.",question:"Is this person someone others actively want to work with?"},
    {id:"b3",name:"Leadership Behavior",desc:"Positive influence, constructive feedback, team motivation, conflict handling.",question:"Does this person elevate those around them?"},
   ]},
  {id:"srarch",name:"Senior Software Architect",identity:"Business and technology strategist shaping architecture, standards, and long-term value.",
   kpis:[
    {id:"k1",name:"Architectural Vision & Technical Strategy",weight:25,desc:"Defines scalable architecture, technical standards, and long-term technology direction.",question:"Are they building systems and standards that will scale?",evidence:"Architecture artifacts, standards, technical strategy, design governance."},
    {id:"k2",name:"Product Thinking & Business Impact",weight:20,desc:"Aligns technology decisions with product strategy, client goals, and business outcomes.",question:"Are they maximizing business value through technology?",evidence:"Business-aligned architecture, tradeoff decisions, roadmap influence."},
    {id:"k3",name:"Engineering Enablement & Organizational Influence",weight:15,desc:"Elevates engineering practices and technical maturity across the organization.",question:"Are they positively influencing the entire engineering organization?",evidence:"Standards, coaching architects/leads, communities of practice."},
    {id:"k4",name:"Executive Communication & Strategic Partnership",weight:15,desc:"Communicates with senior stakeholders to align technology and business strategy.",question:"Would I confidently put them in front of executive stakeholders?",evidence:"Executive presentations, strategic workshops, stakeholder feedback."},
    {id:"k5",name:"AI Strategy & Engineering Productivity",weight:15,desc:"Shapes AI-enabled engineering strategy and scalable adoption across teams.",question:"Are they shaping our AI-enabled future?",evidence:"AI strategy, reusable frameworks, adoption roadmaps."},
    {id:"k6",name:"Organizational Contribution",weight:5,desc:"Creates long-term organizational value through standards, governance, and process improvements.",question:"Are they creating long-term organizational value?",evidence:"Governance, templates, process design, technical policy."},
    {id:"k7",name:"Business Agility & Innovation",weight:5,desc:"Identifies innovation opportunities and helps Clustox stay ahead of technology shifts.",question:"Are they helping Clustox stay ahead of the curve?",evidence:"Innovation proposals, emerging technology evaluation."},
   ],
   behaviors:[
    {id:"b1",name:"Professionalism & Accountability",desc:"Reliability, ownership, punctuality, professional conduct, and follow-through.",question:"Can I consistently rely on this person to honor commitments?"},
    {id:"b2",name:"Collaboration & Communication",desc:"Teamwork, responsiveness, respectful communication, and constructive conflict resolution.",question:"Is this person someone others actively want to work with?"},
    {id:"b3",name:"Leadership Behavior",desc:"Positive influence, constructive feedback, team motivation, conflict handling.",question:"Does this person elevate those around them?"},
   ]},
];

// ─── ICONS ─────────────────────────────────────────────────────────────────
const Ic = ({n,sz=16,c="currentColor",style:st}) => {
  const s={width:sz,height:sz,flexShrink:0,display:"block",...st};
  const p={fill:"none",stroke:c,strokeWidth:"1.8",strokeLinecap:"round",strokeLinejoin:"round"};
  const icons = {
    dash: <svg style={s}viewBox="0 0 24 24"{...p}><rect x="3"y="3"width="7"height="7"/><rect x="14"y="3"width="7"height="7"/><rect x="3"y="14"width="7"height="7"/><rect x="14"y="14"width="7"height="7"/></svg>,
    users:<svg style={s}viewBox="0 0 24 24"{...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9"cy="7"r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
    user: <svg style={s}viewBox="0 0 24 24"{...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12"cy="7"r="4"/></svg>,
    review:<svg style={s}viewBox="0 0 24 24"{...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16"y1="13"x2="8"y2="13"/><line x1="16"y1="17"x2="8"y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
    tag:  <svg style={s}viewBox="0 0 24 24"{...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7"y1="7"x2="7.01"y2="7"/></svg>,
    bar:  <svg style={s}viewBox="0 0 24 24"{...p}><line x1="18"y1="20"x2="18"y2="10"/><line x1="12"y1="20"x2="12"y2="4"/><line x1="6"y1="20"x2="6"y2="14"/></svg>,
    lock: <svg style={s}viewBox="0 0 24 24"{...p}><rect x="3"y="11"width="18"height="11"rx="2"ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>,
    gear: <svg style={s}viewBox="0 0 24 24"{...p}><circle cx="12"cy="12"r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
    plus: <svg style={s}viewBox="0 0 24 24"{...p}><line x1="12"y1="5"x2="12"y2="19"/><line x1="5"y1="12"x2="19"y2="12"/></svg>,
    pen:  <svg style={s}viewBox="0 0 24 24"{...p}><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>,
    bin:  <svg style={s}viewBox="0 0 24 24"{...p}><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>,
    tick: <svg style={s}viewBox="0 0 24 24"{...p}><polyline points="20 6 9 17 4 12"/></svg>,
    x:    <svg style={s}viewBox="0 0 24 24"{...p}><line x1="18"y1="6"x2="6"y2="18"/><line x1="6"y1="6"x2="18"y2="18"/></svg>,
    right:<svg style={s}viewBox="0 0 24 24"{...p}><line x1="5"y1="12"x2="19"y2="12"/><polyline points="12 5 19 12 12 19"/></svg>,
    left: <svg style={s}viewBox="0 0 24 24"{...p}><line x1="19"y1="12"x2="5"y2="12"/><polyline points="12 19 5 12 12 5"/></svg>,
    down: <svg style={s}viewBox="0 0 24 24"{...p}><polyline points="6 9 12 15 18 9"/></svg>,
    up:   <svg style={s}viewBox="0 0 24 24"{...p}><polyline points="18 15 12 9 6 15"/></svg>,
    eye:  <svg style={s}viewBox="0 0 24 24"{...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12"cy="12"r="3"/></svg>,
    key:  <svg style={s}viewBox="0 0 24 24"{...p}><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>,
    copy: <svg style={s}viewBox="0 0 24 24"{...p}><rect x="9"y="9"width="13"height="13"rx="2"ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>,
    logout:<svg style={s}viewBox="0 0 24 24"{...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21"y1="12"x2="9"y2="12"/></svg>,
    search:<svg style={s}viewBox="0 0 24 24"{...p}><circle cx="11"cy="11"r="8"/><line x1="21"y1="21"x2="16.65"y2="16.65"/></svg>,
    dl:   <svg style={s}viewBox="0 0 24 24"{...p}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12"y1="15"x2="12"y2="3"/></svg>,
    mail: <svg style={s}viewBox="0 0 24 24"{...p}><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>,
    assign:<svg style={s}viewBox="0 0 24 24"{...p}><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9"cy="7"r="4"/><line x1="19"y1="8"x2="19"y2="14"/><line x1="22"y1="11"x2="16"y2="11"/></svg>,
    shield:<svg style={s}viewBox="0 0 24 24"{...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>,
    trend:<svg style={s}viewBox="0 0 24 24"{...p}><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
    info: <svg style={s}viewBox="0 0 24 24"{...p}><circle cx="12"cy="12"r="10"/><line x1="12"y1="16"x2="12"y2="12"/><line x1="12"y1="8"x2="12.01"y2="8"/></svg>,
    award:<svg style={s}viewBox="0 0 24 24"{...p}><circle cx="12"cy="8"r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/></svg>,
    clock:<svg style={s}viewBox="0 0 24 24"{...p}><circle cx="12"cy="12"r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    check2:<svg style={s}viewBox="0 0 24 24"{...p}><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    warn: <svg style={s}viewBox="0 0 24 24"{...p}><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12"y1="9"x2="12"y2="13"/><line x1="12"y1="17"x2="12.01"y2="17"/></svg>,
    target:<svg style={s}viewBox="0 0 24 24"{...p}><circle cx="12"cy="12"r="10"/><circle cx="12"cy="12"r="6"/><circle cx="12"cy="12"r="2"/></svg>,
  };
  return icons[n]||null;
};

// ─── CSS ────────────────────────────────────────────────────────────────────
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',system-ui,sans-serif;background:#F5F7FA;color:#111827;}
input,select,textarea{font-family:'Inter',sans-serif;font-size:13px;color:#111827;background:#fff;border:1.5px solid #E8ECF0;border-radius:8px;padding:9px 12px;width:100%;transition:border-color 0.15s,box-shadow 0.15s;outline:none;}
input:focus,select:focus,textarea:focus{border-color:#1DB954;box-shadow:0 0 0 3px rgba(29,185,84,0.1);}
input::placeholder,textarea::placeholder{color:#9CA3AF;}
select option{color:#111827;}
textarea{resize:vertical;min-height:60px;line-height:1.5;}
button{font-family:'Inter',sans-serif;}
::-webkit-scrollbar{width:6px;}
::-webkit-scrollbar-track{background:#F5F7FA;}
::-webkit-scrollbar-thumb{background:#D1D9E0;border-radius:3px;}
.g2{display:grid;grid-template-columns:1fr 1fr;gap:16px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px;}
@media(max-width:700px){.g2,.g3{grid-template-columns:1fr;}}
`;

// ─── SHARED UI ATOMS ─────────────────────────────────────────────────────────
function Toast({toasts}){
  return(<div style={{position:"fixed",bottom:24,right:24,zIndex:9999,display:"flex",flexDirection:"column",gap:8,pointerEvents:"none"}}>
    {toasts.map(t=>(
      <div key={t.id} style={{background:t.type==="error"?C.red:C.green,color:"#fff",borderRadius:10,padding:"12px 18px",fontSize:13,fontWeight:600,display:"flex",alignItems:"center",gap:10,boxShadow:"0 4px 20px rgba(0,0,0,0.15)",minWidth:260}}>
        <Ic n={t.type==="error"?"warn":"tick"} sz={15} c="#fff"/>{t.msg}
      </div>
    ))}
  </div>);
}

function Modal({title,onClose,children,width=540}){
  return(
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.4)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:C.white,borderRadius:16,boxShadow:"0 20px 60px rgba(0,0,0,0.2)",width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"20px 24px",borderBottom:`1px solid ${C.border}`}}>
          <div style={{fontWeight:700,fontSize:16,color:C.text}}>{title}</div>
          <button onClick={onClose} style={{width:32,height:32,borderRadius:8,border:`1.5px solid ${C.border}`,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="x" sz={14} c={C.text3}/></button>
        </div>
        <div style={{padding:"24px"}}>{children}</div>
      </div>
    </div>
  );
}

function Fld({label,required,children,hint,style}){
  return(<div style={{display:"flex",flexDirection:"column",gap:5,...style}}>
    <label style={{fontSize:12,fontWeight:600,color:C.text2}}>
      {label}{required&&<span style={{color:C.red,marginLeft:2}}>*</span>}
    </label>
    {children}
    {hint&&<div style={{fontSize:11,color:C.text4}}>{hint}</div>}
  </div>);
}

function Btn({children,onClick,variant="primary",size="md",disabled,style,icon}){
  const base={display:"inline-flex",alignItems:"center",gap:7,fontWeight:600,cursor:disabled?"not-allowed":"pointer",border:"none",borderRadius:8,transition:"all 0.15s",fontFamily:"Inter,sans-serif",opacity:disabled?0.5:1,...style};
  const sz=size==="sm"?{padding:"6px 12px",fontSize:12}:size==="lg"?{padding:"12px 24px",fontSize:15}:{padding:"9px 18px",fontSize:13};
  const v={
    primary:{background:C.green,color:"#fff",boxShadow:"0 1px 3px rgba(29,185,84,0.3)"},
    secondary:{background:C.white,color:C.text2,border:`1.5px solid ${C.border2}`},
    danger:{background:C.redL,color:C.red,border:`1.5px solid rgba(239,68,68,0.3)`},
    ghost:{background:"transparent",color:C.text3,border:"none"},
  };
  return(<button onClick={disabled?undefined:onClick} style={{...base,...sz,...v[variant]}}>{icon&&<Ic n={icon} sz={size==="sm"?12:14} c={v[variant].color||C.text2}/>}{children}</button>);
}

function Avatar({name,size=36,color=C.green}){
  const initials=name?name.split(" ").map(w=>w[0]).join("").slice(0,2).toUpperCase():"?";
  const bg=color+"20";
  return(<div style={{width:size,height:size,background:bg,border:`1.5px solid ${color}40`,borderRadius:size/3,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:700,fontSize:size*0.35,color,flexShrink:0}}>{initials}</div>);
}

function StatusPill({status}){
  const map={evaluated:{bg:C.greenL,color:C.green,label:"Evaluated",icon:"check2"},pending:{bg:"#FFF7ED",color:C.amber,label:"Pending",icon:"clock"},assigned:{bg:C.blueL,color:C.blue,label:"Assigned",icon:"user"},unassigned:{bg:C.bg,color:C.text4,label:"Unassigned",icon:"x"}};
  const s=map[status]||map.unassigned;
  return(<span style={{display:"inline-flex",alignItems:"center",gap:5,background:s.bg,color:s.color,borderRadius:20,padding:"4px 10px",fontSize:11,fontWeight:600}}><Ic n={s.icon} sz={10} c={s.color}/>{s.label}</span>);
}

function RecBadge({label,color,bg,icon}){
  return(<span style={{display:"inline-flex",alignItems:"center",gap:6,background:bg,color,borderRadius:8,padding:"5px 12px",fontSize:12,fontWeight:600}}><span>{icon}</span>{label}</span>);
}

function Card({children,style,padding=24}){
  return(<div style={{background:C.white,borderRadius:12,border:`1px solid ${C.border}`,padding,...style}}>{children}</div>);
}

function PageHeader({icon,title,sub,action}){
  return(<div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:24,flexWrap:"wrap",gap:12}}>
    <div style={{display:"flex",alignItems:"center",gap:12}}>
      <div style={{width:44,height:44,background:C.greenL,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n={icon} sz={22} c={C.green}/></div>
      <div>
        <h2 style={{fontSize:20,fontWeight:700,color:C.text}}>{title}</h2>
        {sub&&<p style={{fontSize:13,color:C.text3,marginTop:2}}>{sub}</p>}
      </div>
    </div>
    {action}
  </div>);
}

function Empty({icon,title,sub}){
  return(<div style={{textAlign:"center",padding:"48px 24px"}}>
    <div style={{width:56,height:56,background:C.bg,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px"}}><Ic n={icon} sz={26} c={C.text4}/></div>
    <div style={{fontWeight:600,fontSize:15,color:C.text2,marginBottom:6}}>{title}</div>
    <div style={{fontSize:13,color:C.text4,maxWidth:300,margin:"0 auto",lineHeight:1.6}}>{sub}</div>
  </div>);
}

function ProgressBar({value,max,color=C.green,height=6}){
  const pct=max?Math.min(100,(value/max)*100):0;
  return(<div style={{height,background:C.border,borderRadius:99,overflow:"hidden"}}>
    <div style={{height:"100%",width:`${pct}%`,background:color,borderRadius:99,transition:"width 0.4s ease"}}/>
  </div>);
}

// ─── APP ROOT ────────────────────────────────────────────────────────────────
export default function App(){
  const [session,setSession]=useState(null);
  const [desigs,setD]=useState([]);
  const [emps,setE]=useState([]);
  const [revs,setRevs]=useState([]);
  const [reviewers,setRvrs]=useState([]);
  const [assign,setAssign]=useState({});
  const [creds,setCreds]=useState({});
  const [loading,setLoad]=useState(true);
  const [toasts,setToasts]=useState([]);

  const params=new URLSearchParams(window.location.search);
  const tok=params.get("view");

  const toast=useCallback((msg,type="success")=>{
    const id=uid();setToasts(t=>[...t,{id,msg,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  },[]);

  useEffect(()=>{
    (async()=>{
      try {
        const [d,e,revs,rvrs,asgn,cr] = await Promise.all([
          db.get("designations"), db.get("employees"), db.get("reviews"),
          db.get("reviewers"), db.get("assign"), db.get("creds")
        ]);
        setD(d||DEFAULT_DESIGS);
        setE(e||[]);
        setRevs(revs||[]);
        setRvrs(rvrs||[]);
        setAssign(asgn||{});
        setCreds(cr||DEFAULT_CREDS);
      } catch(err) {
        console.error("Supabase load failed, falling back to localStorage", err);
        setD(lsGet("cbpms-d",DEFAULT_DESIGS));
        setE(lsGet("cbpms-e",[]));
        setRevs(lsGet("cbpms-revs",[]));
        setRvrs(lsGet("cbpms-rvrs",[]));
        setAssign(lsGet("cbpms-assign",{}));
        setCreds(lsGet("cbpms-creds",DEFAULT_CREDS));
      }
      setLoad(false);
    })();
  },[]);

  const saveD=v=>{setD(v);db.set("designations",v).catch(()=>lsSet("cbpms-d",v));};
  const saveE=v=>{setE(v);db.set("employees",v).catch(()=>lsSet("cbpms-e",v));};
  const saveRevs=v=>{setRevs(v);db.set("reviews",v).catch(()=>lsSet("cbpms-revs",v));};
  const saveRvrs=v=>{setRvrs(v);db.set("reviewers",v).catch(()=>lsSet("cbpms-rvrs",v));};
  const saveAssign=v=>{setAssign(v);db.set("assign",v).catch(()=>lsSet("cbpms-assign",v));};
  const saveCreds=v=>{setCreds(v);db.set("creds",v).catch(()=>lsSet("cbpms-creds",v));};

  if(loading)return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16,fontFamily:"Inter,sans-serif"}}>
      <style>{CSS}</style>
      <img src={LOGO} alt="Clustox" style={{height:52}}/>
      <div style={{color:C.text,fontSize:16,fontWeight:600}}>Competency Based Performance Management System</div>
      <div style={{display:"flex",alignItems:"center",gap:10,color:C.text4,fontSize:13}}>
        <div style={{width:16,height:16,border:`2px solid ${C.green}`,borderTopColor:"transparent",borderRadius:"50%",animation:"spin 0.8s linear infinite"}}/>
        Loading data…
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(tok){
    const rev=revs.find(r=>r.token===tok);
    const dsg=rev?desigs.find(d=>d.id===rev.designationId):null;
    return<><style>{CSS}</style><EmpResultPage rev={rev} desig={dsg}/></>;
  }

  if(!session)return<><style>{CSS}</style><LoginPage creds={creds} reviewers={reviewers} onLogin={setSession}/></>;

  const myAssigned=session.role==="reviewer"?(assign[session.id]||[]):[...emps.map(e=>e.id)];

  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",fontFamily:"Inter,system-ui,sans-serif"}}>
      <style>{CSS}</style>
      <MainArea session={session} desigs={desigs} saveD={saveD} emps={emps} saveE={saveE}
        revs={revs} saveRevs={saveRevs} reviewers={reviewers} saveRvrs={saveRvrs}
        assign={assign} saveAssign={saveAssign} creds={creds} saveCreds={saveCreds}
        myAssigned={myAssigned} toast={toast} onLogout={()=>setSession(null)}/>
      <Toast toasts={toasts}/>
    </div>
  );
}
// ─── SIDEBAR ─────────────────────────────────────────────────────────────────
function Sidebar({session,onLogout}){
  const [tab,setTab]=useState("dash");
  const adminLinks=[
    {id:"dash",   n:"dash",   lb:"Dashboard"},
    {id:"emps",   n:"users",  lb:"Employees"},
    {id:"rvrs",   n:"assign", lb:"Reviewers"},
    {id:"desigs", n:"tag",    lb:"Designations & KPIs"},
    {id:"reports",n:"bar",    lb:"Reports"},
    {id:"security",n:"lock",  lb:"Security"},
  ];
  const reviewerLinks=[
    {id:"myrevs", n:"review",  lb:"My Evaluations"},
    {id:"done",   n:"tick",    lb:"Completed"},
  ];
  const links=session.role==="admin"?adminLinks:reviewerLinks;
  return(
    <div style={{width:230,flexShrink:0,background:C.white,borderRight:`1px solid ${C.border}`,display:"flex",flexDirection:"column",height:"100vh",position:"sticky",top:0,overflowY:"auto"}}>
      {/* Logo area */}
      <div style={{padding:"20px 20px 0",borderBottom:`1px solid ${C.border}`,paddingBottom:16,marginBottom:8}}>
        <img src={LOGO} alt="Clustox" style={{height:38,display:"block",marginBottom:8}}/>
        <div style={{fontSize:10,fontWeight:600,color:C.text4,textTransform:"uppercase",letterSpacing:"0.5px",lineHeight:1.4}}>Competency Based Performance<br/>Management System</div>
      </div>
      {/* User badge */}
      <div style={{padding:"12px 16px",margin:"8px 12px",background:C.bg,borderRadius:10,display:"flex",alignItems:"center",gap:10}}>
        <Avatar name={session.username} size={34} color={session.role==="admin"?C.purple:C.green}/>
        <div style={{overflow:"hidden"}}>
          <div style={{fontSize:13,fontWeight:600,color:C.text,textTransform:"capitalize",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{session.username}</div>
          <div style={{fontSize:11,color:session.role==="admin"?C.purple:C.green,fontWeight:600,textTransform:"capitalize"}}>{session.role}</div>
        </div>
      </div>
      {/* Nav */}
      <nav style={{flex:1,padding:"4px 12px"}}>
        <SidebarSection session={session} links={links} active={tab} onSet={setTab}/>
      </nav>
      {/* Logout */}
      <div style={{padding:"12px"}}>
        <button onClick={onLogout} style={{width:"100%",padding:"10px 14px",border:`1.5px solid ${C.border}`,borderRadius:9,background:"transparent",color:C.text3,fontSize:13,fontWeight:500,cursor:"pointer",display:"flex",alignItems:"center",gap:8,fontFamily:"Inter,sans-serif"}}>
          <Ic n="logout" sz={14} c={C.text3}/>Sign Out
        </button>
      </div>
    </div>
  );
}

function SidebarSection({session,links,active,onSet}){
  return(
    <div style={{display:"flex",flexDirection:"column",gap:2}}>
      {links.map(l=>{
        const isActive=active===l.id;
        return(
          <button key={l.id} onClick={()=>onSet(l.id)}
            style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",borderRadius:9,border:"none",background:isActive?C.greenL:"transparent",color:isActive?C.green:C.text3,fontSize:13,fontWeight:isActive?600:400,cursor:"pointer",textAlign:"left",fontFamily:"Inter,sans-serif",transition:"all 0.12s"}}>
            <Ic n={l.n} sz={15} c={isActive?C.green:C.text3}/>{l.lb}
          </button>
        );
      })}
    </div>
  );
}

// Keep MainArea aware of active tab via prop-drilling through Sidebar — we'll lift tab state
function MainArea({session,desigs,saveD,emps,saveE,revs,saveRevs,reviewers,saveRvrs,assign,saveAssign,creds,saveCreds,myAssigned,toast,onLogout}){
  const [tab,setTab]=useState(session.role==="admin"?"dash":"myrevs");
  
  // Override sidebar — render custom sidebar with setTab
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",minWidth:0}}>
      {/* Top bar */}
      <header style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 28px",height:60,display:"flex",alignItems:"center",justifyContent:"space-between",flexShrink:0,position:"sticky",top:0,zIndex:100}}>
        <div style={{fontSize:14,fontWeight:600,color:C.text2}}>{TAB_LABELS[tab]||"Dashboard"}</div>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <span style={{fontSize:12,color:C.text4}}>Clustox CBPMS</span>
          <div style={{width:1,height:16,background:C.border}}/>
          <Avatar name={session.username} size={30} color={session.role==="admin"?C.purple:C.green}/>
        </div>
      </header>
      <div style={{display:"flex",flex:1,minHeight:0}}>
        {/* Sidebar nav only (no logo/user, that's in the outer Sidebar) */}
        <SidebarNav session={session} tab={tab} setTab={setTab} onLogout={onLogout}/>
        {/* Content */}
        <main style={{flex:1,padding:"28px",overflowY:"auto",minWidth:0}}>
          {session.role==="admin"&&(
            <>
              {tab==="dash"&&<AdminDash emps={emps} revs={revs} reviewers={reviewers} assign={assign} setTab={setTab}/>}
              {tab==="emps"&&<EmpMgr emps={emps} saveE={saveE} desigs={desigs} revs={revs} reviewers={reviewers} assign={assign} saveAssign={saveAssign} toast={toast}/>}
              {tab==="rvrs"&&<ReviewerMgr reviewers={reviewers} saveRvrs={saveRvrs} emps={emps} assign={assign} saveAssign={saveAssign} revs={revs} toast={toast}/>}
              {tab==="desigs"&&<DesigMgr desigs={desigs} saveD={saveD} toast={toast}/>}
              {tab==="reports"&&<ReportsView revs={revs} emps={emps} desigs={desigs} saveRevs={saveRevs} toast={toast}/>}
              {tab==="security"&&<SecurityView creds={creds} saveCreds={saveCreds} reviewers={reviewers} saveRvrs={saveRvrs} toast={toast}/>}
            </>
          )}
          {session.role==="reviewer"&&(
            <>
              {tab==="myrevs"&&<ReviewerView session={session} desigs={desigs} emps={emps} revs={revs} saveRevs={saveRevs} assign={assign} toast={toast}/>}
              {tab==="done"&&<ReviewerDone session={session} revs={revs} desigs={desigs} toast={toast}/>}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

const TAB_LABELS={dash:"Dashboard",emps:"Employees",rvrs:"Reviewers & Assignments",desigs:"Designations & KPIs",reports:"Reports",security:"Security",myrevs:"My Evaluations",done:"Completed Reviews"};

function SidebarNav({session,tab,setTab,onLogout}){
  const adminLinks=[
    {id:"dash",   n:"dash",   lb:"Dashboard"},
    {id:"emps",   n:"users",  lb:"Employees"},
    {id:"rvrs",   n:"assign", lb:"Reviewers"},
    {id:"desigs", n:"tag",    lb:"Designations & KPIs"},
    {id:"reports",n:"bar",    lb:"Reports"},
    {id:"security",n:"lock",  lb:"Security"},
  ];
  const reviewerLinks=[
    {id:"myrevs", n:"review",  lb:"My Evaluations"},
    {id:"done",   n:"check2",  lb:"Completed"},
  ];
  const links=session.role==="admin"?adminLinks:reviewerLinks;
  return(
    <div style={{width:210,flexShrink:0,background:C.white,borderRight:`1px solid ${C.border}`,padding:"12px",display:"flex",flexDirection:"column",gap:2,overflowY:"auto"}}>
      {/* Logo */}
      <div style={{padding:"4px 8px 16px",borderBottom:`1px solid ${C.border}`,marginBottom:8}}>
        <img src={LOGO} alt="Clustox" style={{height:34,display:"block",marginBottom:6}}/>
        <div style={{fontSize:10,fontWeight:600,color:C.text4,textTransform:"uppercase",letterSpacing:"0.4px",lineHeight:1.4}}>CBPMS · Clustox</div>
      </div>
      {/* User */}
      <div style={{display:"flex",alignItems:"center",gap:9,padding:"8px 10px",background:C.bg,borderRadius:9,marginBottom:8}}>
        <Avatar name={session.username} size={30} color={session.role==="admin"?C.purple:C.green}/>
        <div><div style={{fontSize:12,fontWeight:600,color:C.text,textTransform:"capitalize"}}>{session.username}</div><div style={{fontSize:10,color:session.role==="admin"?C.purple:C.green,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.3px"}}>{session.role}</div></div>
      </div>
      {/* Links */}
      {links.map(l=>{
        const on=tab===l.id;
        return(<button key={l.id} onClick={()=>setTab(l.id)}
          style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:8,border:"none",background:on?C.greenL:"transparent",color:on?C.green:C.text3,fontSize:13,fontWeight:on?600:400,cursor:"pointer",textAlign:"left",fontFamily:"Inter,sans-serif",transition:"all 0.12s"}}>
          <Ic n={l.n} sz={15} c={on?C.green:C.text3}/>{l.lb}
        </button>);
      })}
      {/* Logout at bottom */}
      <div style={{flex:1}}/>
      <button onClick={onLogout}
        style={{display:"flex",alignItems:"center",gap:9,padding:"9px 12px",borderRadius:8,border:`1px solid ${C.border}`,background:"transparent",color:C.text4,fontSize:13,fontWeight:400,cursor:"pointer",fontFamily:"Inter,sans-serif",marginTop:8}}>
        <Ic n="logout" sz={14} c={C.text4}/>Sign Out
      </button>
    </div>
  );
}
// ─── LOGIN PAGE ──────────────────────────────────────────────────────────────
function LoginPage({creds,reviewers,onLogin}){
  const [u,setU]=useState("");const [p,setP]=useState("");const [sp,setSP]=useState(false);
  const [err,setErr]=useState("");const [busy,setBusy]=useState(false);
  const go=()=>{
    setErr("");setBusy(true);
    setTimeout(()=>{
      // Check admin
      const admin=Object.values(creds).find(c=>c.username===u.trim()&&c.password===p&&c.role==="admin");
      if(admin){onLogin({role:"admin",id:"admin",username:admin.username});return;}
      // Check reviewers
      const rv=reviewers.find(r=>r.username===u.trim()&&r.password===p);
      if(rv){onLogin({role:"reviewer",id:rv.id,username:rv.username,name:rv.name});return;}
      setErr("Invalid username or password.");setBusy(false);
    },600);
  };
  return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex"}}>
      {/* Left brand panel */}
      <div style={{width:"42%",background:`linear-gradient(145deg,#0f2a1a 0%,#1a4a2e 50%,#0d3320 100%)`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:"48px",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",top:"-20%",right:"-10%",width:400,height:400,background:"rgba(29,185,84,0.08)",borderRadius:"50%"}}/>
        <div style={{position:"absolute",bottom:"-10%",left:"-10%",width:300,height:300,background:"rgba(29,185,84,0.06)",borderRadius:"50%"}}/>
        <div style={{position:"relative",zIndex:1,textAlign:"center"}}>
          <div style={{background:"rgba(255,255,255,0.96)",borderRadius:16,padding:"22px 40px",display:"inline-block",marginBottom:32,boxShadow:"0 8px 32px rgba(0,0,0,0.25)"}}>
            <img src={LOGO} alt="Clustox" style={{height:54,display:"block"}}/>
          </div>
          <h1 style={{color:"#fff",fontSize:24,fontWeight:700,lineHeight:1.4,marginBottom:12}}>Competency Based<br/>Performance Management</h1>
          <p style={{color:"rgba(255,255,255,0.6)",fontSize:14,lineHeight:1.6,maxWidth:280}}>Standardized, data-driven performance evaluations for engineering teams.</p>
          <div style={{marginTop:36,display:"flex",flexDirection:"column",gap:10}}>
            {["Weighted KPI scoring across designations","Multi-reviewer workflow management","Private employee result sharing"].map(tx=>(
              <div key={tx} style={{display:"flex",alignItems:"center",gap:12,background:"rgba(255,255,255,0.06)",borderRadius:10,padding:"11px 18px"}}>
                <div style={{width:7,height:7,borderRadius:"50%",background:"#1DB954",flexShrink:0}}/>
                <span style={{color:"rgba(255,255,255,0.8)",fontSize:13}}>{tx}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      {/* Right form panel */}
      <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",padding:"40px"}}>
        <div style={{width:"100%",maxWidth:400}}>
          <h2 style={{fontSize:26,fontWeight:700,color:C.text,marginBottom:6}}>Welcome back</h2>
          <p style={{color:C.text3,fontSize:14,marginBottom:32}}>Sign in to your account to continue</p>
          <div style={{marginBottom:18}}>
            <Fld label="Username" required>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><Ic n="user" sz={15} c={C.text4}/></div>
                <input value={u} onChange={e=>setU(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} placeholder="Enter your username" style={{paddingLeft:38,border:err?`1.5px solid ${C.red}`:`1.5px solid ${C.border}`}}/>
              </div>
            </Fld>
          </div>
          <div style={{marginBottom:8}}>
            <Fld label="Password" required>
              <div style={{position:"relative"}}>
                <div style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",pointerEvents:"none"}}><Ic n="key" sz={15} c={C.text4}/></div>
                <input value={p} onChange={e=>setP(e.target.value)} onKeyDown={e=>e.key==="Enter"&&go()} type={sp?"text":"password"} placeholder="Enter your password" style={{paddingLeft:38,paddingRight:42,border:err?`1.5px solid ${C.red}`:`1.5px solid ${C.border}`}}/>
                <button onClick={()=>setSP(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",padding:0,display:"flex"}}><Ic n="eye" sz={15} c={C.text4}/></button>
              </div>
            </Fld>
          </div>
          {err&&<div style={{display:"flex",alignItems:"center",gap:8,background:C.redL,border:`1px solid rgba(239,68,68,0.25)`,borderRadius:8,padding:"10px 14px",color:C.red,fontSize:13,marginBottom:16}}><Ic n="warn" sz={13} c={C.red}/>{err}</div>}
          <button onClick={go} disabled={busy} style={{width:"100%",padding:"12px",borderRadius:10,border:"none",background:C.green,color:"#fff",fontSize:15,fontWeight:600,cursor:busy?"wait":"pointer",marginTop:22,display:"flex",alignItems:"center",justifyContent:"center",gap:10,boxShadow:`0 4px 14px rgba(29,185,84,0.3)`,fontFamily:"Inter,sans-serif",opacity:busy?0.8:1}}>
            {busy?"Signing in…":<><Ic n="right" sz={16} c="#fff"/>Sign In</>}
          </button>
          <p style={{textAlign:"center",marginTop:24,fontSize:12,color:C.text4}}>Clustox Internal Use Only · Secure Access</p>
        </div>
      </div>
    </div>
  );
}

// ─── ADMIN DASHBOARD ─────────────────────────────────────────────────────────
function AdminDash({emps,revs,reviewers,assign,setTab}){
  const evaluated=emps.filter(e=>revs.some(r=>r.empId===e.id)).length;
  const assigned=emps.filter(e=>Object.values(assign).flat().includes(e.id)).length;
  const hi=revs.filter(r=>r.jobScore>=4.5&&r.behaviorGate==="meets").length;
  const risk=revs.filter(r=>["PIP / Immediate Action","Improvement Plan"].includes(r.recommendation)).length;
  const stats=[
    {lb:"Total Employees",val:emps.length,ic:"users",color:C.blue,bg:C.blueL,action:()=>setTab("emps")},
    {lb:"Evaluations Done",val:revs.length,ic:"check2",color:C.green,bg:C.greenL,action:()=>setTab("reports")},
    {lb:"Active Reviewers",val:reviewers.length,ic:"assign",color:C.purple,bg:C.purpleL,action:()=>setTab("rvrs")},
    {lb:"At Risk",val:risk,ic:"warn",color:C.red,bg:C.redL,action:()=>setTab("reports")},
  ];
  const recentRevs=[...revs].sort((a,b)=>b.submittedAt-a.submittedAt).slice(0,5);
  return(<div>
    <PageHeader icon="dash" title="Dashboard" sub="Overview of your performance management cycle"/>
    <div className="g3" style={{marginBottom:24,gridTemplateColumns:"repeat(4,1fr)"}}>
      {stats.map(s=>(
        <button key={s.lb} onClick={s.action} style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:12,padding:"20px",cursor:"pointer",textAlign:"left",fontFamily:"Inter,sans-serif",transition:"box-shadow 0.15s",boxShadow:"none"}}
          onMouseOver={e=>e.currentTarget.style.boxShadow="0 4px 20px rgba(0,0,0,0.08)"}
          onMouseOut={e=>e.currentTarget.style.boxShadow="none"}>
          <div style={{width:40,height:40,background:s.bg,borderRadius:10,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:14}}><Ic n={s.ic} sz={20} c={s.color}/></div>
          <div style={{fontSize:28,fontWeight:700,color:C.text,marginBottom:4}}>{s.val}</div>
          <div style={{fontSize:12,color:C.text4,fontWeight:500}}>{s.lb}</div>
        </button>
      ))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20,marginBottom:24}}>
      <Card>
        <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><Ic n="trend" sz={15} c={C.green}/>Evaluation Progress</div>
        <div style={{marginBottom:12}}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
            <span style={{color:C.text3}}>Employees evaluated</span>
            <span style={{fontWeight:600,color:C.text}}>{evaluated} / {emps.length}</span>
          </div>
          <ProgressBar value={evaluated} max={emps.length||1} color={C.green} height={8}/>
        </div>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:13}}>
            <span style={{color:C.text3}}>Employees assigned</span>
            <span style={{fontWeight:600,color:C.text}}>{assigned} / {emps.length}</span>
          </div>
          <ProgressBar value={assigned} max={emps.length||1} color={C.blue} height={8}/>
        </div>
      </Card>
      <Card>
        <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><Ic n="award" sz={15} c={C.amber}/>Score Distribution</div>
        {revs.length===0?<div style={{color:C.text4,fontSize:13,textAlign:"center",padding:"24px 0"}}>No evaluations yet</div>:
          [["🏆","Exceptional (≥4.5)",revs.filter(r=>r.jobScore>=4.5&&r.behaviorGate==="meets").length,C.green],
           ["⭐","Exceeds (3.75–4.5)",revs.filter(r=>r.jobScore>=3.75&&r.jobScore<4.5).length,C.teal],
           ["✅","Meets (3.0–3.75)",revs.filter(r=>r.jobScore>=3&&r.jobScore<3.75).length,C.blue],
           ["📋","Improvement (<3.0)",revs.filter(r=>r.jobScore<3&&r.behaviorGate!=="critical").length,C.amber],
           ["🚨","PIP",revs.filter(r=>r.behaviorGate==="critical").length,C.red],
          ].map(([ic,lb,cnt,col])=>cnt>0&&(
            <div key={lb} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
              <span style={{fontSize:14,width:20}}>{ic}</span>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:3,fontSize:12}}>
                  <span style={{color:C.text3}}>{lb}</span><span style={{fontWeight:600,color:col}}>{cnt}</span>
                </div>
                <ProgressBar value={cnt} max={revs.length} color={col} height={5}/>
              </div>
            </div>
          ))
        }
      </Card>
    </div>
    {recentRevs.length>0&&(
      <Card>
        <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><Ic n="clock" sz={15} c={C.blue}/>Recent Evaluations</div>
        <div style={{display:"flex",flexDirection:"column",gap:0}}>
          {recentRevs.map((r,i)=>{
            const rc=getRec(r.jobScore,r.behaviorGate);
            return(<div key={r.id} style={{display:"flex",alignItems:"center",gap:14,padding:"12px 0",borderBottom:i<recentRevs.length-1?`1px solid ${C.border}`:"none"}}>
              <Avatar name={r.empName} size={36}/>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:C.text}}>{r.empName}</div><div style={{fontSize:12,color:C.text4}}>{r.designationName} · {r.cycle}</div></div>
              <div style={{fontSize:20,fontWeight:700,color:rc.color}}>{r.jobScore.toFixed(1)}</div>
              <RecBadge {...rc}/>
            </div>);
          })}
        </div>
      </Card>
    )}
  </div>);
}
// ─── EMPLOYEE MANAGER ────────────────────────────────────────────────────────
function EmpMgr({emps,saveE,desigs,revs,reviewers,assign,saveAssign,toast}){
  const [modal,setModal]=useState(null); // null | "add" | empId
  const [srch,setSrch]=useState("");
  const [cpd,setCpd]=useState(null);
  const blank={name:"",designationId:"",department:"",manager:"",project:"",empType:"Full-time"};
  const [form,setForm]=useState(blank);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  const filt=emps.filter(e=>
    e.name.toLowerCase().includes(srch.toLowerCase())||
    (desigs.find(d=>d.id===e.designationId)?.name||"").toLowerCase().includes(srch.toLowerCase())||
    (e.department||"").toLowerCase().includes(srch.toLowerCase())
  );

  const openAdd=()=>{setForm(blank);setModal("add");};
  const openEdit=emp=>{setForm({name:emp.name,designationId:emp.designationId,department:emp.department||"",manager:emp.manager||"",project:emp.project||"",empType:emp.empType||"Full-time"});setModal(emp.id);};
  
  const save=()=>{
    if(!form.name.trim()){toast("Name is required.","error");return;}
    if(!form.designationId){toast("Designation is required.","error");return;}
    if(modal==="add"){saveE([...emps,{id:uid(),...form,addedAt:Date.now()}]);toast("Employee added.");}
    else{saveE(emps.map(e=>e.id===modal?{...e,...form}:e));toast("Employee updated.");}
    setModal(null);
  };

  const rem=emp=>{
    if(!confirm(`Remove ${emp.name}?`))return;
    saveE(emps.filter(e=>e.id!==emp.id));
    // Also remove from assign
    const a={...assign};Object.keys(a).forEach(k=>{a[k]=(a[k]||[]).filter(id=>id!==emp.id);});
    saveAssign(a);
    toast("Employee removed.");
  };

  const getLink=id=>{const r=revs.find(x=>x.empId===id);if(!r||!r.token)return null;return`${window.location.origin}${window.location.pathname}?view=${r.token}`;};
  const cpLink=id=>{const l=getLink(id);if(l){navigator.clipboard.writeText(l);setCpd(id);setTimeout(()=>setCpd(null),2200);toast("Share link copied!");}};

  const getReviewer=empId=>{
    for(const [rvId,ids] of Object.entries(assign)){if((ids||[]).includes(empId)){const rv=reviewers.find(r=>r.id===rvId);return rv;}}
    return null;
  };

  return(<div>
    <PageHeader icon="users" title="Employees" sub={`${emps.length} employees in the system`}
      action={<Btn icon="plus" onClick={openAdd}>Add Employee</Btn>}/>
    <Card style={{marginBottom:20}}>
      <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
        <div style={{position:"relative",flex:1,minWidth:200}}>
          <div style={{position:"absolute",left:11,top:"50%",transform:"translateY(-50%)"}}><Ic n="search" sz={14} c={C.text4}/></div>
          <input value={srch} onChange={e=>setSrch(e.target.value)} placeholder="Search employees by name, designation, or department…" style={{paddingLeft:34}}/>
        </div>
        <span style={{fontSize:13,color:C.text4,whiteSpace:"nowrap"}}>{filt.length} of {emps.length}</span>
      </div>
    </Card>

    {filt.length===0?<Card><Empty icon="users" title="No employees found" sub={srch?"No employees match your search.":"Add your first employee to get started."}/></Card>:
      <div style={{display:"flex",flexDirection:"column",gap:0,border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden",background:C.white}}>
        {/* Table header */}
        <div style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1.2fr 1fr 1fr auto",gap:12,padding:"10px 18px",background:C.bg,borderBottom:`1px solid ${C.border}`,fontSize:11,fontWeight:600,color:C.text4,textTransform:"uppercase",letterSpacing:"0.5px"}}>
          <span>Employee</span><span>Designation</span><span>Department</span><span>Reviewer</span><span>Status</span><span></span>
        </div>
        {filt.map((emp,i)=>{
          const dsg=desigs.find(d=>d.id===emp.designationId);
          const rev=revs.find(r=>r.empId===emp.id);
          const rvr=getReviewer(emp.id);
          const hasLink=rev&&rev.token;
          const status=rev?"evaluated":rvr?"assigned":"unassigned";
          return(
            <div key={emp.id} style={{display:"grid",gridTemplateColumns:"2fr 1.5fr 1.2fr 1fr 1fr auto",gap:12,padding:"14px 18px",borderBottom:i<filt.length-1?`1px solid ${C.border}`:"none",alignItems:"center",background:C.white,transition:"background 0.1s"}}
              onMouseOver={e=>e.currentTarget.style.background=C.bg}
              onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <div style={{display:"flex",alignItems:"center",gap:10}}>
                <Avatar name={emp.name} size={34}/>
                <div><div style={{fontWeight:600,fontSize:13,color:C.text}}>{emp.name}</div><div style={{fontSize:11,color:C.text4}}>{emp.empType||"Full-time"}</div></div>
              </div>
              <div style={{fontSize:12,color:C.text2}}>{dsg?.name||<span style={{color:C.text4}}>—</span>}</div>
              <div style={{fontSize:12,color:C.text3}}>{emp.department||<span style={{color:C.text4}}>—</span>}</div>
              <div style={{fontSize:12,color:C.text3}}>{rvr?<span style={{display:"flex",alignItems:"center",gap:5}}><Avatar name={rvr.name} size={20} color={C.blue}/><span>{rvr.name}</span></span>:<span style={{color:C.text4}}>Unassigned</span>}</div>
              <div><StatusPill status={status}/></div>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {hasLink&&<button onClick={()=>cpLink(emp.id)} style={{display:"flex",alignItems:"center",gap:5,padding:"5px 10px",borderRadius:6,border:`1px solid ${cpd===emp.id?C.green:C.teal}`,background:cpd===emp.id?C.greenL:C.tealL,color:cpd===emp.id?C.green:C.teal,fontSize:11,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}><Ic n={cpd===emp.id?"tick":"copy"} sz={11} c={cpd===emp.id?C.green:C.teal}/>{cpd===emp.id?"Copied":"Share"}</button>}
                <button onClick={()=>openEdit(emp)} style={{width:28,height:28,border:`1px solid ${C.border}`,borderRadius:7,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="pen" sz={12} c={C.text4}/></button>
                <button onClick={()=>rem(emp)} style={{width:28,height:28,border:`1px solid rgba(239,68,68,0.2)`,borderRadius:7,background:C.redL,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="bin" sz={12} c={C.red}/></button>
              </div>
            </div>
          );
        })}
      </div>
    }

    {modal&&(
      <Modal title={modal==="add"?"Add Employee":"Edit Employee"} onClose={()=>setModal(null)}>
        <div className="g2" style={{marginBottom:18}}>
          <Fld label="Full Name" required><input value={form.name} onChange={e=>f("name",e.target.value)} placeholder="e.g. Sarah Ahmed"/></Fld>
          <Fld label="Designation" required><select value={form.designationId} onChange={e=>f("designationId",e.target.value)}><option value="">— Select Designation —</option>{desigs.map(d=><option key={d.id} value={d.id}>{d.name}</option>)}</select></Fld>
          <Fld label="Department / Team"><input value={form.department} onChange={e=>f("department",e.target.value)} placeholder="e.g. Platform Engineering"/></Fld>
          <Fld label="Manager"><input value={form.manager} onChange={e=>f("manager",e.target.value)} placeholder="e.g. Ali Hassan"/></Fld>
          <Fld label="Project / Client"><input value={form.project} onChange={e=>f("project",e.target.value)} placeholder="e.g. Atlas / Acme Corp"/></Fld>
          <Fld label="Employment Type"><select value={form.empType} onChange={e=>f("empType",e.target.value)}><option>Full-time</option><option>Contract</option><option>Part-time</option></select></Fld>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          <Btn icon={modal==="add"?"plus":"tick"} onClick={save}>{modal==="add"?"Add Employee":"Save Changes"}</Btn>
        </div>
      </Modal>
    )}
  </div>);
}

// ─── REVIEWER MANAGER ────────────────────────────────────────────────────────
function ReviewerMgr({reviewers,saveRvrs,emps,assign,saveAssign,revs,toast}){
  const [modal,setModal]=useState(null); // null | "add" | rvId | "assign"
  const [assignModal,setAssignModal]=useState(null); // rvId
  const blank={name:"",username:"",password:"",email:""};
  const [form,setForm]=useState(blank);
  const f=(k,v)=>setForm(p=>({...p,[k]:v}));

  const save=()=>{
    if(!form.name.trim()||!form.username.trim()||!form.password.trim()){toast("Name, username, and password are required.","error");return;}
    if(reviewers.some(r=>r.username===form.username.trim()&&r.id!==modal)){toast("Username already exists.","error");return;}
    if(modal==="add"){saveRvrs([...reviewers,{id:uid(),...form,createdAt:Date.now()}]);toast("Reviewer account created.");}
    else{saveRvrs(reviewers.map(r=>r.id===modal?{...r,...form}:r));toast("Reviewer updated.");}
    setModal(null);
  };

  const rem=rv=>{
    if(!confirm(`Remove reviewer ${rv.name}?`))return;
    saveRvrs(reviewers.filter(r=>r.id!==rv.id));
    const a={...assign};delete a[rv.id];saveAssign(a);
    toast("Reviewer removed.");
  };

  const getStats=rv=>{
    const ids=assign[rv.id]||[];
    const done=ids.filter(id=>revs.some(r=>r.empId===id)).length;
    return{assigned:ids.length,done};
  };

  return(<div>
    <PageHeader icon="assign" title="Reviewers & Assignments" sub="Manage reviewer accounts and assign employees to them"
      action={<Btn icon="plus" onClick={()=>{setForm(blank);setModal("add");}}>Add Reviewer</Btn>}/>

    {reviewers.length===0?
      <Card><Empty icon="user" title="No reviewers yet" sub="Create reviewer accounts and assign employees to them. Reviewers can only see and evaluate their assigned employees."/></Card>:
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        {reviewers.map(rv=>{
          const st=getStats(rv);
          const ids=assign[rv.id]||[];
          const assignedEmps=emps.filter(e=>ids.includes(e.id));
          return(
            <Card key={rv.id} style={{overflow:"hidden"}}>
              <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:st.assigned>0?16:0}}>
                <Avatar name={rv.name} size={44} color={C.blue}/>
                <div style={{flex:1}}>
                  <div style={{fontWeight:700,fontSize:15,color:C.text}}>{rv.name}</div>
                  <div style={{fontSize:12,color:C.text4,marginTop:2}}>@{rv.username}{rv.email?` · ${rv.email}`:""}</div>
                </div>
                <div style={{display:"flex",gap:8,flexShrink:0,flexWrap:"wrap",justifyContent:"flex-end"}}>
                  <div style={{textAlign:"center",padding:"8px 16px",background:C.bg,borderRadius:8,minWidth:72}}>
                    <div style={{fontSize:20,fontWeight:700,color:C.text}}>{st.assigned}</div>
                    <div style={{fontSize:10,color:C.text4,fontWeight:500}}>Assigned</div>
                  </div>
                  <div style={{textAlign:"center",padding:"8px 16px",background:C.greenL,borderRadius:8,minWidth:72}}>
                    <div style={{fontSize:20,fontWeight:700,color:C.green}}>{st.done}</div>
                    <div style={{fontSize:10,color:C.green,fontWeight:500}}>Evaluated</div>
                  </div>
                  <Btn variant="secondary" size="sm" icon="assign" onClick={()=>setAssignModal(rv.id)}>Assign</Btn>
                  <button onClick={()=>{setForm({name:rv.name,username:rv.username,password:rv.password,email:rv.email||""});setModal(rv.id);}} style={{width:30,height:30,border:`1px solid ${C.border}`,borderRadius:7,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="pen" sz={13} c={C.text4}/></button>
                  <button onClick={()=>rem(rv)} style={{width:30,height:30,border:`1px solid rgba(239,68,68,0.2)`,borderRadius:7,background:C.redL,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="bin" sz={13} c={C.red}/></button>
                </div>
              </div>
              {st.assigned>0&&(
                <div>
                  <div style={{height:1,background:C.border,marginBottom:12}}/>
                  <div style={{fontSize:11,fontWeight:600,color:C.text4,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:10}}>Assigned Employees ({st.assigned})</div>
                  <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                    {assignedEmps.map(emp=>{
                      const done=revs.some(r=>r.empId===emp.id);
                      return(<div key={emp.id} style={{display:"flex",alignItems:"center",gap:7,background:done?C.greenL:C.bg,border:`1px solid ${done?C.green+"30":C.border}`,borderRadius:8,padding:"6px 10px"}}>
                        <Avatar name={emp.name} size={22} color={done?C.green:C.text4}/>
                        <span style={{fontSize:12,fontWeight:500,color:C.text2}}>{emp.name}</span>
                        {done&&<Ic n="tick" sz={11} c={C.green}/>}
                      </div>);
                    })}
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    }

    {/* Add/Edit Reviewer Modal */}
    {modal&&(
      <Modal title={modal==="add"?"Add Reviewer":"Edit Reviewer"} onClose={()=>setModal(null)} width={480}>
        <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
          <Fld label="Full Name" required><input value={form.name} onChange={e=>f("name",e.target.value)} placeholder="e.g. Ali Hassan"/></Fld>
          <Fld label="Username" required hint="Used to log in to the system"><input value={form.username} onChange={e=>f("username",e.target.value)} placeholder="e.g. ali.hassan"/></Fld>
          <Fld label={modal==="add"?"Password":"New Password (leave blank to keep current)"} required={modal==="add"}><input type="password" value={form.password} onChange={e=>f("password",e.target.value)} placeholder={modal==="add"?"Set a password":"Leave blank to keep current"}/></Fld>
          <Fld label="Email (optional)"><input value={form.email} onChange={e=>f("email",e.target.value)} placeholder="e.g. ali@clustox.com"/></Fld>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
          <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          <Btn icon={modal==="add"?"plus":"tick"} onClick={save}>{modal==="add"?"Create Reviewer":"Save Changes"}</Btn>
        </div>
      </Modal>
    )}

    {/* Assign Employees Modal */}
    {assignModal&&(
      <AssignModal rvId={assignModal} reviewer={reviewers.find(r=>r.id===assignModal)} emps={emps} assign={assign} saveAssign={saveAssign} onClose={()=>setAssignModal(null)} toast={toast}/>
    )}
  </div>);
}

function AssignModal({rvId,reviewer,emps,assign,saveAssign,onClose,toast}){
  const [sel,setSel]=useState(new Set(assign[rvId]||[]));
  const toggle=id=>setSel(s=>{const n=new Set(s);n.has(id)?n.delete(id):n.add(id);return n;});
  const save=()=>{
    const a={...assign,[rvId]:[...sel]};
    saveAssign(a);
    toast(`${sel.size} employee(s) assigned to ${reviewer?.name}.`);
    onClose();
  };
  const allAssigned=new Set(Object.entries(assign).filter(([k])=>k!==rvId).flatMap(([,v])=>v||[]));
  return(
    <Modal title={`Assign Employees → ${reviewer?.name}`} onClose={onClose} width={520}>
      <p style={{fontSize:13,color:C.text3,marginBottom:16}}>Select the employees this reviewer is responsible for evaluating.</p>
      {emps.length===0?<div style={{color:C.text4,fontSize:13,padding:"20px 0",textAlign:"center"}}>No employees added yet.</div>:
        <div style={{display:"flex",flexDirection:"column",gap:6,marginBottom:20,maxHeight:360,overflowY:"auto"}}>
          {emps.map(emp=>{
            const isAssignedElsewhere=allAssigned.has(emp.id);
            const checked=sel.has(emp.id);
            return(
              <label key={emp.id} style={{display:"flex",alignItems:"center",gap:12,padding:"10px 14px",borderRadius:9,border:`1.5px solid ${checked?C.green:C.border}`,background:checked?C.greenL:C.white,cursor:"pointer",transition:"all 0.12s"}}>
                <input type="checkbox" checked={checked} onChange={()=>toggle(emp.id)} style={{width:15,height:15,cursor:"pointer",accentColor:C.green}}/>
                <Avatar name={emp.name} size={30}/>
                <div style={{flex:1}}>
                  <div style={{fontSize:13,fontWeight:600,color:C.text}}>{emp.name}</div>
                  <div style={{fontSize:11,color:C.text4}}>{emp.department||"No department"}{isAssignedElsewhere&&!checked?" · Assigned to another reviewer":""}</div>
                </div>
                {checked&&<Ic n="tick" sz={14} c={C.green}/>}
              </label>
            );
          })}
        </div>
      }
      <div style={{display:"flex",gap:10,justifyContent:"space-between",alignItems:"center"}}>
        <span style={{fontSize:12,color:C.text4}}>{sel.size} selected</span>
        <div style={{display:"flex",gap:10}}>
          <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
          <Btn icon="tick" onClick={save}>Save Assignments</Btn>
        </div>
      </div>
    </Modal>
  );
}
// ─── DESIGNATION MANAGER ─────────────────────────────────────────────────────
function DesigMgr({desigs,saveD,toast}){
  const [sel,setSel]=useState(null);
  const [showNew,setShowNew]=useState(false);
  const [nn,setNN]=useState("");const [ni,setNI]=useState("");
  const [kModal,setKModal]=useState(null); // null | "add" | kpiId
  const [bModal,setBModal]=useState(null);
  const [kf,setKf]=useState({name:"",weight:"",desc:"",question:"",evidence:""});
  const [bf,setBf]=useState({name:"",desc:"",question:""});

  const dsg=desigs.find(d=>d.id===sel);
  const upd=p=>saveD(desigs.map(d=>d.id===sel?{...d,...p}:d));
  const tw=dsg?(dsg.kpis||[]).reduce((s,k)=>s+k.weight,0):0;

  const addD=()=>{if(!nn.trim()){toast("Name required.","error");return;}const d={id:uid(),name:nn.trim(),identity:ni.trim(),kpis:[],behaviors:[]};saveD([...desigs,d]);setSel(d.id);setNN("");setNI("");setShowNew(false);toast("Designation created.");};
  const remD=id=>{if(!confirm("Delete this designation?"))return;saveD(desigs.filter(d=>d.id!==id));if(sel===id)setSel(null);toast("Deleted.");};

  const saveK=()=>{
    if(!kf.name.trim()){toast("KPI name required.","error");return;}
    const w=parseFloat(kf.weight);if(isNaN(w)||w<=0){toast("Enter a valid weight.","error");return;}
    const cur=(dsg.kpis||[]).filter(k=>k.id!==kModal).reduce((s,k)=>s+k.weight,0);
    if(cur+w>100.01){toast(`Only ${(100-cur).toFixed(0)}% remaining.`,"error");return;}
    kModal==="add"?upd({kpis:[...(dsg.kpis||[]),{id:uid(),...kf,weight:w}]}):upd({kpis:dsg.kpis.map(k=>k.id===kModal?{...k,...kf,weight:w}:k)});
    toast(kModal==="add"?"KPI added.":"KPI updated.");setKModal(null);setKf({name:"",weight:"",desc:"",question:"",evidence:""});
  };
  const saveB=()=>{if(!bf.name.trim()){toast("Name required.","error");return;}bModal==="add"?upd({behaviors:[...(dsg.behaviors||[]),{id:uid(),...bf}]}):upd({behaviors:dsg.behaviors.map(b=>b.id===bModal?{...b,...bf}:b)});toast(bModal==="add"?"Added.":"Updated.");setBModal(null);setBf({name:"",desc:"",question:""});};

  return(<div>
    <PageHeader icon="tag" title="Designations & KPIs" sub="Define job levels, scoring criteria, and behavior gates"/>
    <div style={{display:"grid",gridTemplateColumns:"240px 1fr",gap:20,alignItems:"start"}}>
      <Card style={{padding:16}}>
        <div style={{fontWeight:600,fontSize:13,color:C.text,marginBottom:12}}>Designations</div>
        <div style={{display:"flex",flexDirection:"column",gap:4,marginBottom:12}}>
          {desigs.map(d=>(
            <div key={d.id} onClick={()=>setSel(d.id)} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"9px 10px",borderRadius:8,background:sel===d.id?C.greenL:"transparent",border:`1px solid ${sel===d.id?C.green+"40":"transparent"}`,cursor:"pointer",transition:"all 0.12s"}} onMouseOver={e=>{if(sel!==d.id)e.currentTarget.style.background=C.bg;}} onMouseOut={e=>{if(sel!==d.id)e.currentTarget.style.background="transparent";}}>
              <span style={{fontSize:12,fontWeight:sel===d.id?600:400,color:sel===d.id?C.green:C.text2,lineHeight:1.3}}>{d.name}</span>
              <button onClick={ev=>{ev.stopPropagation();remD(d.id);}} style={{width:22,height:22,border:"none",background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center",borderRadius:4,flexShrink:0}}><Ic n="bin" sz={11} c="rgba(239,68,68,0.4)"/></button>
            </div>
          ))}
        </div>
        {showNew?(
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            <input value={nn} onChange={e=>setNN(e.target.value)} placeholder="Designation name *" style={{fontSize:12}}/>
            <textarea value={ni} onChange={e=>setNI(e.target.value)} placeholder="Role identity (optional)" rows={2} style={{fontSize:12}}/>
            <div style={{display:"flex",gap:6}}>
              <Btn size="sm" style={{flex:1,justifyContent:"center"}} onClick={addD}><Ic n="plus" sz={11} c="#fff"/>Create</Btn>
              <button onClick={()=>setShowNew(false)} style={{width:30,height:30,border:`1px solid ${C.border}`,borderRadius:7,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="x" sz={12} c={C.text4}/></button>
            </div>
          </div>
        ):(
          <Btn variant="secondary" size="sm" icon="plus" style={{width:"100%",justifyContent:"center"}} onClick={()=>setShowNew(true)}>New Designation</Btn>
        )}
      </Card>

      {!dsg?<Card><Empty icon="tag" title="Select a designation" sub="Click a designation on the left to view and manage its KPIs and behavior gates."/></Card>:
        <div>
          <Card style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12,marginBottom:16}}>
              <div>
                <div style={{fontWeight:700,fontSize:16,color:C.text,marginBottom:4}}>{dsg.name}</div>
                <div style={{fontSize:13,color:C.text3}}>{dsg.identity||"No identity set"}</div>
              </div>
              <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:tw===100?C.greenL:tw>100?C.redL:C.amberL,borderRadius:8,flexShrink:0}}>
                <Ic n="target" sz={13} c={tw===100?C.green:tw>100?C.red:C.amber}/>
                <span style={{fontSize:12,fontWeight:600,color:tw===100?C.green:tw>100?C.red:C.amber}}>Weight: {tw.toFixed(0)}%{tw===100?" ✓":tw>100?" ↑":`— ${(100-tw).toFixed(0)}% remaining`}</span>
              </div>
            </div>
            <Fld label="Role Identity">
              <input defaultValue={dsg.identity} onBlur={e=>upd({identity:e.target.value})} placeholder="One-line purpose of this role"/>
            </Fld>
          </Card>

          <Card style={{marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontWeight:600,fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:8}}><Ic n="trend" sz={15} c={C.blue}/>Job KPIs <span style={{background:C.blueL,color:C.blue,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:600,marginLeft:4}}>{(dsg.kpis||[]).length}</span></div>
              <Btn variant="secondary" size="sm" icon="plus" onClick={()=>{setKf({name:"",weight:"",desc:"",question:"",evidence:""});setKModal("add");}}>Add KPI</Btn>
            </div>
            {(dsg.kpis||[]).length===0?<div style={{color:C.text4,fontSize:13,padding:"12px 0"}}>No KPIs yet. Add at least one KPI.</div>:
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {(dsg.kpis||[]).map((k,i)=>(
                  <div key={k.id} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:i<(dsg.kpis||[]).length-1?`1px solid ${C.border}`:"none",alignItems:"start"}}>
                    <div style={{flex:1}}>
                      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                        <span style={{fontWeight:600,fontSize:13,color:C.text}}>{k.name}</span>
                        <span style={{background:C.blueL,color:C.blue,borderRadius:6,padding:"1px 7px",fontSize:11,fontWeight:700}}>{k.weight}%</span>
                      </div>
                      <div style={{fontSize:12,color:C.text3,lineHeight:1.5}}>{k.desc}</div>
                    </div>
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      <button onClick={()=>{setKf({name:k.name,weight:String(k.weight),desc:k.desc||"",question:k.question||"",evidence:k.evidence||""});setKModal(k.id);}} style={{width:28,height:28,border:`1px solid ${C.border}`,borderRadius:6,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="pen" sz={12} c={C.text4}/></button>
                      <button onClick={()=>{upd({kpis:dsg.kpis.filter(x=>x.id!==k.id)});toast("Removed.");}} style={{width:28,height:28,border:`1px solid rgba(239,68,68,0.2)`,borderRadius:6,background:C.redL,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="bin" sz={12} c={C.red}/></button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </Card>

          <Card>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:16}}>
              <div style={{fontWeight:600,fontSize:14,color:C.text,display:"flex",alignItems:"center",gap:8}}><Ic n="shield" sz={15} c={C.purple}/>Behavior Gates <span style={{background:C.purpleL,color:C.purple,borderRadius:20,padding:"2px 8px",fontSize:11,fontWeight:600,marginLeft:4}}>{(dsg.behaviors||[]).length}</span></div>
              <Btn variant="secondary" size="sm" icon="plus" onClick={()=>{setBf({name:"",desc:"",question:""});setBModal("add");}}>Add Behavior</Btn>
            </div>
            {(dsg.behaviors||[]).length===0?<div style={{color:C.text4,fontSize:13,padding:"12px 0"}}>No behavior gates yet.</div>:
              <div style={{display:"flex",flexDirection:"column",gap:0}}>
                {(dsg.behaviors||[]).map((b,i)=>(
                  <div key={b.id} style={{display:"flex",gap:12,padding:"12px 0",borderBottom:i<(dsg.behaviors||[]).length-1?`1px solid ${C.border}`:"none",alignItems:"start"}}>
                    <div style={{flex:1}}>
                      <div style={{fontWeight:600,fontSize:13,color:C.text,marginBottom:3}}>{b.name}</div>
                      <div style={{fontSize:12,color:C.text3,lineHeight:1.5}}>{b.desc}</div>
                    </div>
                    <div style={{display:"flex",gap:5,flexShrink:0}}>
                      <button onClick={()=>{setBf({name:b.name,desc:b.desc||"",question:b.question||""});setBModal(b.id);}} style={{width:28,height:28,border:`1px solid ${C.border}`,borderRadius:6,background:"transparent",cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="pen" sz={12} c={C.text4}/></button>
                      <button onClick={()=>{upd({behaviors:dsg.behaviors.filter(x=>x.id!==b.id)});toast("Removed.");}} style={{width:28,height:28,border:`1px solid rgba(239,68,68,0.2)`,borderRadius:6,background:C.redL,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}><Ic n="bin" sz={12} c={C.red}/></button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </Card>
        </div>
      }
    </div>

    {kModal&&(<Modal title={kModal==="add"?"Add KPI":"Edit KPI"} onClose={()=>setKModal(null)}>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
        <div className="g2"><Fld label="KPI Name" required><input value={kf.name} onChange={e=>setKf(p=>({...p,name:e.target.value}))} placeholder="e.g. Delivery Ownership"/></Fld><Fld label="Weight %" required><input type="number" min="1" max="100" value={kf.weight} onChange={e=>setKf(p=>({...p,weight:e.target.value}))} placeholder="e.g. 20"/></Fld></div>
        <Fld label="Description"><textarea value={kf.desc} onChange={e=>setKf(p=>({...p,desc:e.target.value}))} rows={2} placeholder="What does this KPI measure?"/></Fld>
        <Fld label="Manager Question"><input value={kf.question} onChange={e=>setKf(p=>({...p,question:e.target.value}))} placeholder="e.g. Can I trust them to deliver independently?"/></Fld>
        <Fld label="Suggested Evidence"><input value={kf.evidence} onChange={e=>setKf(p=>({...p,evidence:e.target.value}))} placeholder="e.g. PRs, delivery records, feedback"/></Fld>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={()=>setKModal(null)}>Cancel</Btn><Btn onClick={saveK}>{kModal==="add"?"Add KPI":"Update KPI"}</Btn></div>
    </Modal>)}
    {bModal&&(<Modal title={bModal==="add"?"Add Behavior Gate":"Edit Behavior Gate"} onClose={()=>setBModal(null)} width={480}>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
        <Fld label="Name" required><input value={bf.name} onChange={e=>setBf(p=>({...p,name:e.target.value}))} placeholder="e.g. Leadership Behavior"/></Fld>
        <Fld label="Description"><textarea value={bf.desc} onChange={e=>setBf(p=>({...p,desc:e.target.value}))} rows={2} placeholder="What does this behavior entail?"/></Fld>
        <Fld label="Manager Question"><input value={bf.question} onChange={e=>setBf(p=>({...p,question:e.target.value}))} placeholder="e.g. Does this person elevate those around them?"/></Fld>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}><Btn variant="secondary" onClick={()=>setBModal(null)}>Cancel</Btn><Btn onClick={saveB}>{bModal==="add"?"Add Behavior":"Update Behavior"}</Btn></div>
    </Modal>)}
  </div>);
}

// ─── SECURITY VIEW ────────────────────────────────────────────────────────────
function SecurityView({creds,saveCreds,toast}){
  const [af,setAf]=useState({username:creds.admin?.username||"",password:"",confirm:""});
  const upd=()=>{
    if(!af.username.trim()){toast("Username cannot be empty.","error");return;}
    if(af.password&&af.password!==af.confirm){toast("Passwords do not match.","error");return;}
    saveCreds({...creds,admin:{...creds.admin,username:af.username.trim(),...(af.password?{password:af.password}:{})}});
    setAf(p=>({...p,password:"",confirm:""}));toast("Admin credentials updated.");
  };
  return(<div>
    <PageHeader icon="lock" title="Security" sub="Manage admin account credentials"/>
    <Card style={{maxWidth:520}}>
      <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:16,display:"flex",alignItems:"center",gap:8}}><Ic n="lock" sz={15} c={C.purple}/>Admin Account</div>
      <p style={{fontSize:13,color:C.text3,marginBottom:20}}>Change the Admin username and password. Leave password blank to keep the current one.</p>
      <div style={{display:"flex",flexDirection:"column",gap:14,marginBottom:20}}>
        <Fld label="Admin Username" required><input value={af.username} onChange={e=>setAf(p=>({...p,username:e.target.value}))} placeholder="Admin username"/></Fld>
        <Fld label="New Password"><input type="password" value={af.password} onChange={e=>setAf(p=>({...p,password:e.target.value}))} placeholder="Leave blank to keep current"/></Fld>
        <Fld label="Confirm New Password"><input type="password" value={af.confirm} onChange={e=>setAf(p=>({...p,confirm:e.target.value}))} placeholder="Repeat new password"/></Fld>
      </div>
      <Btn icon="tick" onClick={upd}>Update Admin Credentials</Btn>
      <p style={{fontSize:12,color:C.text4,marginTop:12}}>💡 Reviewer credentials are managed in the Reviewers tab.</p>
    </Card>
  </div>);
}
// ─── REVIEWER VIEW ────────────────────────────────────────────────────────────
function ReviewerView({session,desigs,emps,revs,saveRevs,assign,toast}){
  const [step,setStep]=useState(0); // 0=select, 1=kpis, 2=preview
  const [empId,setEmpId]=useState("");const [cyc,setCyc]=useState("");
  const [rat,setRat]=useState({});const [nt,setNt]=useState({});
  const [beh,setBeh]=useState({});const [bn,setBn]=useState({});
  const [com,setCom]=useState("");const [pro,setPro]=useState("");
  const [done,setDone]=useState(false);

  const myIds=assign[session.id]||[];
  const myEmps=emps.filter(e=>myIds.includes(e.id));
  const emp=myEmps.find(x=>x.id===empId);
  const dsg=emp?desigs.find(x=>x.id===emp.designationId):null;
  const kpis=dsg?.kpis||[];const bl=dsg?.behaviors||[];
  const sc=calcScore(kpis,rat);const gt=calcGate(bl,beh);const rc=getRec(sc,gt);
  const rated=Object.keys(rat).filter(k=>rat[k]>0).length;
  const reset=()=>{setStep(0);setEmpId("");setCyc("");setRat({});setNt({});setBeh({});setBn({});setCom("");setPro("");setDone(false);};

  const submit=()=>{
    if(rated<kpis.length){toast(`Please rate all ${kpis.length} KPIs.`,"error");return;}
    const tok=uid()+uid();
    const rev={id:uid(),token:tok,empId:emp.id,empName:emp.name,designationId:dsg.id,designationName:dsg.name,department:emp.department||"",project:emp.project||"",reviewerName:session.name||session.username,reviewerId:session.id,cycle:cyc,ratings:{...rat},notes:{...nt},behaviors:{...beh},behaviorNotes:{...bn},jobScore:sc,behaviorGate:gt,recommendation:rc.label,mgrComments:com,promotion:pro,submittedAt:Date.now()};
    const idx=revs.findIndex(r=>r.empId===emp.id&&r.cycle===cyc);
    saveRevs(idx>=0?revs.map((r,i)=>i===idx?rev:r):[...revs,rev]);
    setDone(true);toast("Review submitted!");
  };

  if(myEmps.length===0)return(<div>
    <PageHeader icon="review" title="My Evaluations" sub="Employees assigned to you for review"/>
    <Card><Empty icon="users" title="No employees assigned" sub="The admin hasn't assigned any employees to you yet. Contact your administrator to get started."/></Card>
  </div>);

  if(done)return(<div style={{maxWidth:560}}>
    <div style={{background:C.greenL,border:`1px solid ${C.green}30`,borderRadius:16,padding:"32px",textAlign:"center",marginBottom:20}}>
      <div style={{width:64,height:64,background:C.green,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",boxShadow:`0 4px 20px rgba(29,185,84,0.3)`}}><Ic n="tick" sz={28} c="#fff"/></div>
      <h2 style={{fontSize:22,fontWeight:700,color:C.text,marginBottom:6}}>Review Submitted!</h2>
      <p style={{color:C.text3,marginBottom:20}}>{emp?.name} · {dsg?.name} · {cyc}</p>
      <div style={{display:"inline-block",background:rc.bg,border:`1px solid ${rc.color}30`,borderRadius:10,padding:"12px 20px",marginBottom:20}}>
        <div style={{fontSize:24,marginBottom:4}}>{rc.icon}</div>
        <div style={{color:rc.color,fontWeight:700,fontSize:18}}>{rc.label}</div>
        <div style={{color:C.text4,fontSize:12,marginTop:4}}>Score: {sc.toFixed(2)} · Gate: {gt}</div>
      </div>
      <br/>
      <Btn icon="plus" onClick={reset} variant="secondary">Evaluate Another Employee</Btn>
    </div>
  </div>);

  const STEPS=["Select Employee","Rate KPIs","Submit"];

  return(<div>
    <PageHeader icon="review" title="My Evaluations" sub={`${myEmps.length} employee${myEmps.length===1?"":"s"} assigned to you`}/>
    {/* Step indicator */}
    <div style={{display:"flex",alignItems:"center",gap:0,marginBottom:28,maxWidth:400}}>
      {STEPS.map((s,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:0,flex:i<STEPS.length-1?1:"auto"}}>
          <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
            <div style={{width:28,height:28,borderRadius:"50%",background:step>i?C.green:step===i?C.green:C.border,color:step>=i?"#fff":C.text4,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,transition:"all 0.2s"}}>
              {step>i?<Ic n="tick" sz={12} c="#fff"/>:i+1}
            </div>
            <div style={{fontSize:11,fontWeight:step===i?600:400,color:step===i?C.green:C.text4,whiteSpace:"nowrap"}}>{s}</div>
          </div>
          {i<STEPS.length-1&&<div style={{flex:1,height:2,background:step>i?C.green:C.border,margin:"0 6px",marginBottom:20,transition:"all 0.2s"}}/>}
        </div>
      ))}
    </div>

    {step===0&&(<Card>
      <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:16}}>Select Employee to Evaluate</div>
      <div style={{display:"flex",flexDirection:"column",gap:16,marginBottom:20}}>
        <div className="g2">
          <Fld label="Employee" required>
            <select value={empId} onChange={e=>{setEmpId(e.target.value);setRat({});setNt({});setBeh({});setBn({});}}>
              <option value="">— Select Employee —</option>
              {myEmps.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}
            </select>
          </Fld>
          <Fld label="Review Cycle" required>
            <select value={cyc} onChange={e=>setCyc(e.target.value)}>
              <option value="">— Select Cycle —</option>
              {["Q1 2025","Q2 2025","Q3 2025","Q4 2025","H1 2025","H2 2025","Annual 2025","Q1 2026","Q2 2026","H1 2026","Annual 2026"].map(c=><option key={c}>{c}</option>)}
            </select>
          </Fld>
        </div>
        {emp&&dsg&&(
          <div style={{background:C.bg,borderRadius:10,padding:"14px 16px",border:`1px solid ${C.border}`}}>
            <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:10}}>
              <Avatar name={emp.name} size={38}/>
              <div><div style={{fontWeight:600,fontSize:14,color:C.text}}>{emp.name}</div><div style={{fontSize:12,color:C.text4}}>{dsg.name}{emp.department?` · ${emp.department}`:""}</div></div>
            </div>
            <div style={{fontSize:12,color:C.text3,fontStyle:"italic",marginBottom:10}}>{dsg.identity}</div>
            <div style={{display:"flex",gap:8}}>
              <span style={{background:C.greenL,color:C.green,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600}}>{kpis.length} KPIs</span>
              <span style={{background:C.purpleL,color:C.purple,borderRadius:6,padding:"3px 10px",fontSize:11,fontWeight:600}}>{bl.length} Behavior Gates</span>
            </div>
          </div>
        )}
      </div>
      <Btn icon="right" onClick={()=>{if(!empId){toast("Select an employee.","error");return;}if(!cyc){toast("Select a cycle.","error");return;}if(!dsg||kpis.length===0){toast("No KPIs configured for this designation. Contact admin.","error");return;}setStep(1);}}>Start Evaluation</Btn>
    </Card>)}

    {step===1&&dsg&&(<div>
      <div style={{background:C.white,border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 16px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}><Avatar name={emp.name} size={32}/><div><div style={{fontWeight:600,fontSize:13,color:C.text}}>{emp.name}</div><div style={{fontSize:11,color:C.text4}}>{dsg.name} · {cyc}</div></div></div>
        <div style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",background:rated===kpis.length?C.greenL:C.amberL,borderRadius:8}}>
          <Ic n={rated===kpis.length?"tick":"info"} sz={13} c={rated===kpis.length?C.green:C.amber}/>
          <span style={{fontSize:12,fontWeight:600,color:rated===kpis.length?C.green:C.amber}}>{rated}/{kpis.length} rated · Running score: {sc.toFixed(2)}</span>
        </div>
      </div>

      <Card style={{marginBottom:16}}>
        <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:20,display:"flex",alignItems:"center",gap:8}}><Ic n="trend" sz={15} c={C.blue}/>Job KPIs — Rate 1 (lowest) to 5 (highest)</div>
        {kpis.map((k,i)=>{
          const r=rat[i]||0;
          return(<div key={k.id} style={{borderBottom:`1px solid ${C.border}`,paddingBottom:18,marginBottom:18}}>
            <div style={{display:"flex",gap:16,alignItems:"start",flexWrap:"wrap"}}>
              <div style={{flex:1,minWidth:200}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:4,flexWrap:"wrap"}}>
                  <span style={{fontWeight:600,fontSize:13,color:C.text}}>{k.name}</span>
                  <span style={{background:C.blueL,color:C.blue,borderRadius:6,padding:"1px 8px",fontSize:11,fontWeight:700}}>{k.weight}%</span>
                </div>
                <div style={{fontSize:12,color:C.text3,lineHeight:1.5,marginBottom:k.question?6:0}}>{k.desc}</div>
                {k.question&&<div style={{fontSize:12,color:C.text4,fontStyle:"italic",display:"flex",gap:5,alignItems:"flex-start"}}><Ic n="info" sz={11} c={C.text4} style={{flexShrink:0,marginTop:1}}/><span>{k.question}</span></div>}
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4,flexShrink:0}}>
                <div style={{display:"flex",gap:5}}>
                  {[1,2,3,4,5].map(v=>(
                    <button key={v} onClick={()=>setRat(rs=>({...rs,[i]:v}))}
                      style={{width:40,height:40,borderRadius:9,border:`2px solid ${r===v?RCOLORS[v]:C.border}`,background:r===v?RCOLORS[v]+"15":C.white,color:r===v?RCOLORS[v]:C.text3,fontWeight:700,fontSize:14,cursor:"pointer",fontFamily:"Inter,sans-serif",transition:"all 0.15s",boxShadow:r===v?`0 2px 8px ${RCOLORS[v]}30`:"none"}}>
                      {v}
                    </button>
                  ))}
                </div>
                <div style={{fontSize:11,fontWeight:600,color:r>0?RCOLORS[r]:C.text4}}>{RLABELS[r]||"Not yet rated"}</div>
              </div>
            </div>
            <textarea value={nt[i]||""} onChange={e=>setNt(n=>({...n,[i]:e.target.value}))} placeholder="Add evidence or notes for this KPI…" rows={2} style={{marginTop:10,fontSize:12}}/>
          </div>);
        })}
      </Card>

      <Card style={{marginBottom:16}}>
        <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:20,display:"flex",alignItems:"center",gap:8}}><Ic n="shield" sz={15} c={C.purple}/>Behavior Gates — Non-weighted qualitative assessment</div>
        {bl.map((b,i)=>{const sl=beh[i]||"";return(
          <div key={b.id} style={{borderBottom:`1px solid ${C.border}`,paddingBottom:14,marginBottom:14}}>
            <div style={{display:"flex",gap:16,alignItems:"start",flexWrap:"wrap"}}>
              <div style={{flex:1}}><div style={{fontWeight:600,fontSize:13,color:C.text,marginBottom:3}}>{b.name}</div><div style={{fontSize:12,color:C.text3,lineHeight:1.5}}>{b.desc}</div></div>
              <div style={{display:"flex",gap:6,flexShrink:0}}>
                {[["meets","Meets",C.green],["watch","Watch",C.amber],["critical","Critical",C.red]].map(([v,lb,col])=>(
                  <button key={v} onClick={()=>setBeh(bv=>({...bv,[i]:v}))}
                    style={{padding:"7px 14px",borderRadius:8,border:`2px solid ${sl===v?col:C.border}`,background:sl===v?col+"15":C.white,color:sl===v?col:C.text3,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif",transition:"all 0.15s"}}>
                    {lb}
                  </button>
                ))}
              </div>
            </div>
            <textarea value={bn[i]||""} onChange={e=>setBn(n=>({...n,[i]:e.target.value}))} placeholder="Behavioral evidence notes…" rows={2} style={{marginTop:8,fontSize:12}}/>
          </div>
        );})}
      </Card>

      <Card style={{marginBottom:16}}>
        <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:16}}>Final Assessment</div>
        <div className="g2" style={{marginBottom:14}}>
          <Fld label="Promotion Readiness">
            <select value={pro} onChange={e=>setPro(e.target.value)}>
              <option value="">— Select —</option>
              <option>Yes – Ready now</option>
              <option>Not yet – 1 cycle away</option>
              <option>No – Focus on current role</option>
            </select>
          </Fld>
        </div>
        <Fld label="Manager Comments">
          <textarea value={com} onChange={e=>setCom(e.target.value)} rows={4} placeholder="Summary observations, context, development notes, feedback…"/>
        </Fld>
      </Card>

      {/* Summary bar */}
      <div style={{background:rc.bg,border:`1px solid ${rc.color}30`,borderRadius:12,padding:"16px 20px",marginBottom:16,display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
        <div style={{fontSize:28}}>{rc.icon}</div>
        <div style={{flex:1}}>
          <div style={{fontWeight:700,fontSize:16,color:rc.color}}>{rc.label}</div>
          <div style={{fontSize:12,color:C.text4,marginTop:2}}>Score: {sc.toFixed(2)} · Gate: {gt==="unset"?"Not all rated":gt}</div>
        </div>
        <div style={{display:"flex",gap:12}}>
          <Btn variant="secondary" onClick={()=>setStep(0)}><Ic n="left" sz={13} c={C.text3}/>Back</Btn>
          <Btn icon="tick" onClick={submit}>Submit Review</Btn>
        </div>
      </div>
    </div>)}
  </div>);
}

function ReviewerDone({session,revs,desigs,toast}){
  const myRevs=revs.filter(r=>r.reviewerId===session.id);
  const [cpd,setCpd]=useState(null);
  const cpLink=(r)=>{const l=`${window.location.origin}${window.location.pathname}?view=${r.token}`;navigator.clipboard.writeText(l);setCpd(r.id);setTimeout(()=>setCpd(null),2200);toast("Link copied!");};
  return(<div>
    <PageHeader icon="check2" title="Completed Reviews" sub={`${myRevs.length} review${myRevs.length===1?"":"s"} submitted`}/>
    {myRevs.length===0?<Card><Empty icon="review" title="No completed reviews yet" sub="Reviews you submit will appear here."/></Card>:
      <div style={{display:"flex",flexDirection:"column",gap:12}}>
        {[...myRevs].sort((a,b)=>b.submittedAt-a.submittedAt).map(r=>{
          const rc=getRec(r.jobScore,r.behaviorGate);
          return(<Card key={r.id} style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
            <Avatar name={r.empName} size={40}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:600,fontSize:14,color:C.text}}>{r.empName}</div>
              <div style={{fontSize:12,color:C.text4}}>{r.designationName} · {r.cycle} · {new Date(r.submittedAt).toLocaleDateString()}</div>
            </div>
            <div style={{fontSize:22,fontWeight:700,color:rc.color,marginRight:4}}>{r.jobScore.toFixed(1)}</div>
            <RecBadge {...rc}/>
            {r.token&&<button onClick={()=>cpLink(r)} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",border:`1px solid ${cpd===r.id?C.green:C.border}`,borderRadius:8,background:cpd===r.id?C.greenL:C.white,color:cpd===r.id?C.green:C.text3,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"Inter,sans-serif"}}><Ic n={cpd===r.id?"tick":"copy"} sz={12} c={cpd===r.id?C.green:C.text3}/>{cpd===r.id?"Copied":"Copy Link"}</button>}
          </Card>);
        })}
      </div>
    }
  </div>);
}
// ─── REPORTS VIEW ─────────────────────────────────────────────────────────────
function ReportsView({revs,emps,desigs,saveRevs,toast}){
  const [fC,setFC]=useState("all");const [fD,setFD]=useState("all");const [fR,setFR]=useState("all");const [srt,setSrt]=useState("recent");const [exp,setExp]=useState(null);const [cpd,setCpd]=useState(null);
  const cy=[...new Set(revs.map(r=>r.cycle))].sort();
  const dn=[...new Set(revs.map(r=>r.designationName))].sort();
  const rc2=[...new Set(revs.map(r=>r.recommendation))];
  let fil=revs.filter(r=>(fC==="all"||r.cycle===fC)&&(fD==="all"||r.designationName===fD)&&(fR==="all"||r.recommendation===fR));
  fil=[...fil].sort((a,b)=>srt==="name"?a.empName.localeCompare(b.empName):srt==="score_d"?b.jobScore-a.jobScore:srt==="score_a"?a.jobScore-b.jobScore:b.submittedAt-a.submittedAt);
  const avg=fil.length?fil.reduce((s,r)=>s+r.jobScore,0)/fil.length:0;
  const hi=fil.filter(r=>r.jobScore>=4.5&&r.behaviorGate==="meets").length;
  const risk=fil.filter(r=>["PIP / Immediate Action","Improvement Plan"].includes(r.recommendation)).length;
  const dist=fil.reduce((ac,r)=>{ac[r.recommendation]=(ac[r.recommendation]||0)+1;return ac;},{});

  const cpL=r=>{const l=`${window.location.origin}${window.location.pathname}?view=${r.token}`;navigator.clipboard.writeText(l);setCpd(r.id);setTimeout(()=>setCpd(null),2200);toast("Employee link copied!");};
  const exportCSV=()=>{
    const h=["Employee","Designation","Department","Cycle","Reviewer","Job Score","Behavior Gate","Recommendation","Promotion","Submitted"].join(",");
    const rows=fil.map(r=>[`"${r.empName}"`,`"${r.designationName}"`,`"${r.department||""}"`,`"${r.cycle}"`,`"${r.reviewerName}"`,r.jobScore.toFixed(2),r.behaviorGate,`"${r.recommendation}"`,`"${r.promotion||""}"`,new Date(r.submittedAt).toLocaleDateString()].join(","));
    const blob=new Blob([[h,...rows].join("\n")],{type:"text/csv"});
    const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="clustox_cbpms_report.csv";a.click();toast("CSV exported.");
  };

  return(<div>
    <PageHeader icon="bar" title="Reports" sub="Company-wide performance overview" action={<Btn variant="secondary" icon="dl" onClick={exportCSV} disabled={fil.length===0}>Export CSV</Btn>}/>
    {revs.length===0?<Card><Empty icon="bar" title="No evaluations yet" sub="Completed evaluations will appear here once reviewers submit them."/></Card>:
      <><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:24}}>
        {[{lb:"Total Reviews",val:fil.length,ic:"review",c:C.blue,bg:C.blueL},{lb:"Avg Score",val:avg.toFixed(2),ic:"trend",c:avg>=4?C.green:avg>=3?C.blue:C.amber,bg:avg>=4?C.greenL:avg>=3?C.blueL:C.amberL},{lb:"High Performers",val:hi,ic:"award",c:C.green,bg:C.greenL},{lb:"At Risk",val:risk,ic:"warn",c:C.red,bg:C.redL}].map(s=>(
          <Card key={s.lb} style={{padding:"16px"}}>
            <div style={{width:36,height:36,background:s.bg,borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><Ic n={s.ic} sz={18} c={s.c}/></div>
            <div style={{fontSize:26,fontWeight:700,color:C.text,marginBottom:3}}>{s.val}</div>
            <div style={{fontSize:11,color:C.text4,fontWeight:500,textTransform:"uppercase",letterSpacing:"0.4px"}}>{s.lb}</div>
          </Card>
        ))}
      </div>

      {Object.keys(dist).length>0&&<Card style={{marginBottom:20}}>
        <div style={{fontWeight:600,fontSize:14,color:C.text,marginBottom:14,display:"flex",alignItems:"center",gap:8}}><Ic n="award" sz={15} c={C.amber}/>Recommendation Breakdown</div>
        <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
          {Object.entries(dist).map(([r,cnt])=>{const rc3=getRec(0,"unset");const c3={label:r,...getRec(r==="PIP / Immediate Action"?0:r==="Coaching Required"?0:r==="Exceptional / High Performer"?4.5:r==="Exceeds Expectations"?4:r==="Meets Expectations"?3.5:2,"unset")};const cc=r==="PIP / Immediate Action"?C.red:r==="Coaching Required"?C.amber:r==="Exceptional / High Performer"||r==="Exceeds Expectations"?C.green:r==="Meets Expectations"?C.blue:C.amber;const bg2=r==="PIP / Immediate Action"?C.redL:r==="Coaching Required"?C.amberL:r.includes("Exceptional")||r.includes("Exceeds")?C.greenL:r==="Meets Expectations"?C.blueL:C.amberL;
            return<div key={r} style={{background:bg2,border:`1px solid ${cc}20`,borderRadius:10,padding:"12px 16px",textAlign:"center",flex:"1 1 120px"}}><div style={{fontSize:24,fontWeight:700,color:cc}}>{cnt}</div><div style={{fontSize:11,color:cc,fontWeight:500,marginTop:3,lineHeight:1.3}}>{r}</div></div>;})}
        </div>
      </Card>}

      <Card style={{marginBottom:16,padding:"16px"}}>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"flex-end"}}>
          {[["Cycle",fC,setFC,[["all","All Cycles"],...cy.map(c=>[c,c])]],["Designation",fD,setFD,[["all","All Designations"],...dn.map(d=>[d,d])]],["Outcome",fR,setFR,[["all","All Outcomes"],...rc2.map(r=>[r,r])]],["Sort",srt,setSrt,[["recent","Recent First"],["name","Name A–Z"],["score_d","Score ↓"],["score_a","Score ↑"]]]].map(([lb,val,setter,opts])=>(
            <Fld key={lb} label={lb} style={{minWidth:140,flex:1}}><select value={val} onChange={e=>setter(e.target.value)}>{opts.map(([v,l])=><option key={v} value={v}>{l}</option>)}</select></Fld>
          ))}
        </div>
      </Card>

      <div style={{border:`1px solid ${C.border}`,borderRadius:12,overflow:"hidden"}}>
        <div style={{padding:"10px 18px",background:C.bg,borderBottom:`1px solid ${C.border}`,fontSize:11,fontWeight:600,color:C.text4,textTransform:"uppercase",letterSpacing:"0.5px"}}>
          {fil.length} results
        </div>
        {fil.map((r,i)=>{
          const rc=getRec(r.jobScore,r.behaviorGate);const open=exp===r.id;
          const dsg=desigs.find(d=>d.id===r.designationId);
          return(<div key={r.id} style={{background:C.white,borderBottom:i<fil.length-1?`1px solid ${C.border}`:"none"}}>
            <div onClick={()=>setExp(open?null:r.id)} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",cursor:"pointer",transition:"background 0.1s"}}
              onMouseOver={e=>e.currentTarget.style.background=C.bg} onMouseOut={e=>e.currentTarget.style.background=C.white}>
              <Avatar name={r.empName} size={38}/>
              <div style={{flex:1}}>
                <div style={{fontWeight:600,fontSize:13,color:C.text}}>{r.empName}</div>
                <div style={{fontSize:11,color:C.text4,marginTop:2}}>{r.designationName}{r.department?` · ${r.department}`:""} · {r.cycle} · Reviewed by {r.reviewerName}</div>
              </div>
              <div style={{fontSize:22,fontWeight:700,color:rc.color,marginRight:8}}>{r.jobScore.toFixed(2)}</div>
              <RecBadge {...rc}/>
              <Ic n={open?"up":"down"} sz={15} c={C.text4} style={{marginLeft:4}}/>
            </div>
            {open&&(
              <div style={{padding:"16px 18px 20px",background:C.bg,borderTop:`1px solid ${C.border}`}}>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16}}>
                  <RecBadge {...rc}/>
                  <span style={{display:"inline-flex",alignItems:"center",gap:5,background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,color:C.text3}}>Gate: {r.behaviorGate}</span>
                  {r.promotion&&<span style={{display:"inline-flex",alignItems:"center",gap:5,background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,color:C.text3}}>Promotion: {r.promotion}</span>}
                  <span style={{display:"inline-flex",alignItems:"center",gap:5,background:C.white,border:`1px solid ${C.border}`,borderRadius:8,padding:"5px 12px",fontSize:12,color:C.text3}}>{new Date(r.submittedAt).toLocaleDateString()}</span>
                  {r.token&&<button onClick={()=>cpL(r)} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"5px 12px",border:`1px solid ${cpd===r.id?C.green:C.teal}`,borderRadius:8,background:cpd===r.id?C.greenL:C.tealL,color:cpd===r.id?C.green:C.teal,fontSize:12,fontWeight:600,cursor:"pointer",fontFamily:"Inter,sans-serif"}}><Ic n={cpd===r.id?"tick":"mail"} sz={12} c={cpd===r.id?C.green:C.teal}/>{cpd===r.id?"Copied!":"Copy Employee Link"}</button>}
                </div>
                {dsg&&dsg.kpis.length>0&&(
                  <div style={{background:C.white,borderRadius:10,border:`1px solid ${C.border}`,padding:"14px 16px",marginBottom:12}}>
                    <div style={{fontWeight:600,fontSize:12,color:C.text3,textTransform:"uppercase",letterSpacing:"0.5px",marginBottom:12}}>KPI Breakdown</div>
                    <div style={{display:"flex",flexDirection:"column",gap:10}}>
                      {dsg.kpis.map((k,i2)=>{const rt=r.ratings[i2]||0;const col=RCOLORS[rt]||C.border;return(
                        <div key={k.id} style={{display:"grid",gridTemplateColumns:"1fr 60px 160px",gap:12,alignItems:"center"}}>
                          <div style={{fontSize:12,color:C.text2}}>{k.name} <span style={{color:C.text4}}>({k.weight}%)</span></div>
                          <div style={{fontSize:13,fontWeight:700,color:rt>0?col:C.text4,textAlign:"center"}}>{rt>0?`${rt}/5`:"—"}</div>
                          <ProgressBar value={rt} max={5} color={col} height={6}/>
                        </div>
                      );})}
                    </div>
                  </div>
                )}
                {r.mgrComments&&<div style={{background:C.white,borderRadius:10,border:`1px solid ${C.border}`,borderLeft:`3px solid ${C.green}`,padding:"12px 14px",marginBottom:12,fontSize:13,color:C.text2,lineHeight:1.6}}><div style={{fontSize:11,fontWeight:600,color:C.green,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:6}}>Manager Comments</div>{r.mgrComments}</div>}
                <button onClick={()=>{if(confirm("Delete this review permanently?"))saveRevs(revs.filter(x=>x.id!==r.id));toast("Deleted.");}} style={{display:"inline-flex",alignItems:"center",gap:6,padding:"6px 12px",border:`1px solid rgba(239,68,68,0.3)`,borderRadius:7,background:C.redL,color:C.red,fontSize:12,fontWeight:500,cursor:"pointer",fontFamily:"Inter,sans-serif"}}><Ic n="bin" sz={12} c={C.red}/>Delete Review</button>
              </div>
            )}
          </div>);
        })}
      </div>
      </>
    }
  </div>);
}

// ─── EMPLOYEE RESULT PAGE ─────────────────────────────────────────────────────
function EmpResultPage({rev,desig}){
  if(!rev)return(
    <div style={{minHeight:"100vh",background:C.bg,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div style={{textAlign:"center",maxWidth:400}}>
        <img src={LOGO} alt="Clustox" style={{height:44,marginBottom:20}}/>
        <div style={{background:C.redL,border:`1px solid rgba(239,68,68,0.3)`,borderRadius:14,padding:"28px 32px"}}>
          <div style={{fontSize:32,marginBottom:12}}>🔒</div>
          <div style={{fontSize:18,fontWeight:700,color:C.text,marginBottom:8}}>Link Not Found</div>
          <div style={{fontSize:13,color:C.text3,lineHeight:1.6}}>This evaluation link is invalid or has expired.<br/>Please contact your manager for a valid link.</div>
        </div>
      </div>
    </div>
  );
  const rc=getRec(rev.jobScore,rev.behaviorGate);
  const kpis=desig?.kpis||[];
  return(
    <div style={{minHeight:"100vh",background:C.bg}}>
      {/* Header */}
      <div style={{background:C.white,borderBottom:`1px solid ${C.border}`,padding:"0 24px"}}>
        <div style={{maxWidth:720,margin:"0 auto",height:64,display:"flex",alignItems:"center",gap:16}}>
          <img src={LOGO} alt="Clustox" style={{height:34}}/>
          <div style={{width:1,height:20,background:C.border}}/>
          <div style={{fontSize:13,color:C.text3}}>Performance Evaluation Result</div>
        </div>
      </div>
      <div style={{maxWidth:720,margin:"0 auto",padding:"32px 20px 60px"}}>
        {/* Hero */}
        <div style={{background:`linear-gradient(135deg,${rc.color}08,${rc.color}04)`,border:`1px solid ${rc.color}25`,borderRadius:16,padding:"32px",textAlign:"center",marginBottom:24}}>
          <div style={{width:64,height:64,background:rc.bg,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",margin:"0 auto 16px",fontSize:28}}>{rc.icon}</div>
          <h1 style={{fontSize:24,fontWeight:700,color:C.text,marginBottom:6}}>Hi, {rev.empName}!</h1>
          <p style={{color:C.text3,fontSize:14,marginBottom:20}}>Your <strong>{rev.cycle}</strong> performance evaluation has been completed.</p>
          <span style={{display:"inline-block",background:rc.bg,color:rc.color,borderRadius:10,padding:"10px 20px",fontWeight:700,fontSize:16,border:`1px solid ${rc.color}30`}}>{rc.icon} {rc.label}</span>
        </div>
        {/* Stats */}
        <div className="g3" style={{marginBottom:24}}>
          {[
            {lb:"Job Score",val:rev.jobScore.toFixed(2),sub:RLABELS[Math.round(rev.jobScore)]||"",c:rev.jobScore>=4.5?C.green:rev.jobScore>=3?C.blue:C.red},
            {lb:"Behavior Gate",val:rev.behaviorGate.charAt(0).toUpperCase()+rev.behaviorGate.slice(1),sub:rev.behaviorGate==="meets"?"No concerns":rev.behaviorGate==="watch"?"Coaching recommended":"Immediate attention",c:rev.behaviorGate==="critical"?C.red:rev.behaviorGate==="watch"?C.amber:C.green},
            {lb:"Review Date",val:new Date(rev.submittedAt).toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"}),sub:`By ${rev.reviewerName}`,c:C.text3},
          ].map(b=>(
            <Card key={b.lb} style={{textAlign:"center",padding:"20px 16px"}}>
              <div style={{fontSize:10,color:C.text4,textTransform:"uppercase",letterSpacing:"0.5px",fontWeight:600,marginBottom:10}}>{b.lb}</div>
              <div style={{fontSize:22,fontWeight:700,color:b.c,marginBottom:4}}>{b.val}</div>
              <div style={{fontSize:11,color:C.text4}}>{b.sub}</div>
            </Card>
          ))}
        </div>
        {/* Details */}
        <Card style={{marginBottom:16}}>
          <div style={{fontWeight:600,fontSize:13,color:C.text,marginBottom:14}}>Evaluation Details</div>
          <div className="g2">
            {[["Designation",rev.designationName],["Department",rev.department||"—"],["Project",rev.project||"—"],["Promotion",rev.promotion||"Not specified"]].map(([k,v])=>(
              <div key={k} style={{background:C.bg,borderRadius:8,padding:"10px 12px"}}>
                <div style={{fontSize:10,color:C.text4,fontWeight:600,textTransform:"uppercase",letterSpacing:"0.4px",marginBottom:4}}>{k}</div>
                <div style={{fontSize:13,fontWeight:500,color:C.text2}}>{v}</div>
              </div>
            ))}
          </div>
        </Card>
        {kpis.length>0&&(
          <Card style={{marginBottom:16}}>
            <div style={{fontWeight:600,fontSize:13,color:C.text,marginBottom:16}}>KPI Breakdown</div>
            {kpis.map((k,i)=>{
              const rt=rev.ratings[i]||0;const col=RCOLORS[rt]||C.text4;
              return(<div key={k.id} style={{marginBottom:14}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <div style={{fontSize:13,color:C.text2,fontWeight:500}}>{k.name} <span style={{color:C.text4,fontSize:11}}>({k.weight}%)</span></div>
                  <div style={{display:"flex",alignItems:"center",gap:8}}>
                    <span style={{fontWeight:700,fontSize:14,color:rt>0?col:C.text4}}>{rt>0?`${rt}/5`:"—"}</span>
                    {rt>0&&<span style={{fontSize:11,color:col,fontWeight:500}}>{RLABELS[rt]}</span>}
                  </div>
                </div>
                <ProgressBar value={rt} max={5} color={col} height={7}/>
                {rev.notes&&rev.notes[i]&&<div style={{fontSize:12,color:C.text4,marginTop:5,fontStyle:"italic"}}>{rev.notes[i]}</div>}
              </div>);
            })}
          </Card>
        )}
        {rev.mgrComments&&(
          <Card style={{marginBottom:16,borderLeft:`4px solid ${C.green}`}}>
            <div style={{fontWeight:600,fontSize:13,color:C.green,marginBottom:10}}>Manager Comments</div>
            <p style={{fontSize:14,color:C.text2,lineHeight:1.7}}>{rev.mgrComments}</p>
          </Card>
        )}
        <div style={{textAlign:"center",color:C.text4,fontSize:12,marginTop:24}}>
          This is an official Clustox performance evaluation. For questions, contact your manager or HR.
        </div>
      </div>
    </div>
  );
}
