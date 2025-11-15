/* assets/app.js
   Shared JS for pages: handles users, session, courses, progress, lessons, quizzes, vocab
*/

// --- Storage Keys ---
const USERS_KEY = 'll_users_v2';
const SESSION_KEY = 'll_session_v2';

// --- Sample Data: courses with lessons, quizzes, vocab ---
const COURSES = [
  {
    id: 'spanish-basic',
    title: 'Spanish — Basics',
    level: 'Beginner',
    desc: 'Greetings, numbers, common phrases.',
    lessons: [
      { id: 's1-l1', title: 'Greetings & Intros', content: 'Hola, ¿Cómo estás? — Basic greetings and introductions.' },
      { id: 's1-l2', title: 'Numbers 1-10', content: 'Uno, dos, tres... Practice counting from 1 to 10.' }
    ],
    quizzes: [
      { id:'s1-q1', title:'Basics Quiz', questions:[
          { q:'How do you say Hello?', opts:['Hola','Bonjour','Ciao'], a:0 },
          { q:'What is 2 in Spanish?', opts:['dos','due','deux'], a:0 }
      ] }
    ],
    vocab: [
      {word:'Hola',meaning:'Hello'},
      {word:'Adiós',meaning:'Goodbye'},
      {word:'Gracias',meaning:'Thank you'}
    ]
  },
  {
    id: 'french-basic',
    title: 'French — Beginner',
    level: 'Beginner',
    desc: 'Simple phrases, polite expressions.',
    lessons:[
      { id:'f1-l1', title:'Bonjour & Politeness', content:'Bonjour, merci, s’il vous plaît.'}
    ],
    quizzes:[
      { id:'f1-q1', title:'French Mini Quiz', questions:[
        { q:'How to say Thank you?', opts:['Merci','Gracias','Danke'], a:0 }
      ] }
    ],
    vocab:[
      {word:'Bonjour',meaning:'Hello'},
      {word:'Merci',meaning:'Thank you'}
    ]
  }
];

// --- UTILITIES ---
function loadUsers(){ try{ return JSON.parse(localStorage.getItem(USERS_KEY))||{} }catch(e){ return {} } }
function saveUsers(u){ localStorage.setItem(USERS_KEY, JSON.stringify(u)) }
function getSession(){ try{ return JSON.parse(localStorage.getItem(SESSION_KEY)) }catch(e){ return null } }
function setSession(id){ localStorage.setItem(SESSION_KEY, JSON.stringify({id,ts:Date.now()})) }
function clearSession(){ localStorage.removeItem(SESSION_KEY) }

// --- AUTH & REGISTRATION (with simulated OTP) ---
let simulatedOTP = null;

function createAccount(identifier, password){
  if(!identifier || !password) return {ok:false,msg:'Fill required fields'};
  const users = loadUsers();
  if(users[identifier]) return {ok:false,msg:'Account exists'};
  users[identifier] = { password, profile:{name:'',language:'',daily:20}, enrolled:[], progress:{}, quizzes:[], speaking:[] };
  saveUsers(users);
  return {ok:true};
}

function signIn(identifier,password){
  const users = loadUsers();
  if(!users[identifier]) return {ok:false,msg:'Account not found'};
  if(users[identifier].password !== password) return {ok:false,msg:'Invalid credentials'};
  setSession(identifier);
  return {ok:true};
}

// OTP simulation
function sendOTP(){ simulatedOTP = String(Math.floor(1000+Math.random()*9000)); return simulatedOTP }

// --- Enrollment / course actions ---
function enrollCourse(courseId){
  const s = getSession(); if(!s) return {ok:false,msg:'Sign in first'};
  const users = loadUsers(); const u = users[s.id];
  if(!u.enrolled.includes(courseId)) u.enrolled.push(courseId);
  saveUsers(users);
  return {ok:true};
}

function markLessonComplete(courseId, lessonId){
  const s = getSession(); if(!s) return {ok:false,msg:'Sign in first'};
  const users = loadUsers(); const u = users[s.id];
  u.progress = u.progress || {};
  u.progress[courseId] = u.progress[courseId] || [];
  if(!u.progress[courseId].includes(lessonId)) u.progress[courseId].push(lessonId);
  saveUsers(users);
  return {ok:true};
}

function saveQuizResult(courseId, quizId, scorePct){
  const s = getSession(); if(!s) return;
  const users = loadUsers(); const u = users[s.id];
  u.quizzes = u.quizzes || [];
  u.quizzes.push({courseId, quizId, scorePct, ts:Date.now()});
  saveUsers(users);
}

// --- Vocabulary ---
function getCourseById(id){ return COURSES.find(c=>c.id===id) }

// --- HEADER USER AREA ---
function renderHeaderUser(areaSelector){
  const session = getSession();
  const el = document.querySelector(areaSelector);
  if(!el) return;

  if(!session){
    el.innerHTML = `<a class="btn" href="auth.html">Sign in</a>`;
  } else {
    const users = loadUsers();
    const u = users[session.id];

    el.innerHTML = `
      <div class="row">
        <div class="badge">${u.profile.language || 'Learner'}</div>
        <div style="margin-left:8px;">
          <strong>${u.profile.name || session.id.split('@')[0]}</strong>
          <div class="small">${session.id}</div>
        </div>
        <button class="btn ghost" id="signoutBtn">Sign out</button>
      </div>`;

    document.getElementById("signoutBtn").addEventListener("click",()=>{
      clearSession();
      location.reload();
    });
  }
}

// ---------------- INDEX PAGE ----------------
function initIndex(){
  renderHeaderUser('#header-user');
  const el = document.getElementById('featured');
  if(!el) return;
  el.innerHTML = COURSES.map(c=>`
    <div class="course">
      <div style="flex:1">
        <strong>${c.title}</strong>
        <div class="small">${c.desc}</div>
      </div>
      <a class="btn" href="courses.html">View</a>
    </div>`).join('');
}

// ---------------- AUTH PAGE ----------------
function initAuth(){
  renderHeaderUser('#header-user');

  const suBtn = document.getElementById("su-create");
  const suId = document.getElementById("su-identifier");
  const suPwd = document.getElementById("su-password");
  const suOtp = document.getElementById("su-otp");
  const suOtpSect = document.getElementById("su-otp-section");
  const suNote = document.getElementById("su-note");

  const siBtn = document.getElementById("si-btn");
  const siId = document.getElementById("si-identifier");
  const siPwd = document.getElementById("si-password");

  // SIGN UP
  if(suBtn){
    suBtn.addEventListener("click",()=>{
      const res = createAccount(suId.value.trim(), suPwd.value.trim());
      if(!res.ok) return alert(res.msg);

      const otp = sendOTP();
      suOtpSect.style.display = "block";
      suNote.textContent = "Your OTP: " + otp + " (Simulated)";
      
      suId.disabled = true;
      suPwd.disabled = true;
    });
  }

  // VERIFY OTP
  const suVerify = document.getElementById("su-verify");
  if(suVerify){
    suVerify.addEventListener("click",()=>{
      if(suOtp.value.trim() === simulatedOTP){
        setSession(suId.value.trim());
        alert("Account created & signed in!");
        location.href = "dashboard.html";
      } else {
        alert("Wrong OTP");
      }
    });
  }

  // SIGN IN
  if(siBtn){
    siBtn.addEventListener("click",()=>{
      const res = signIn(siId.value.trim(), siPwd.value.trim());
      if(!res.ok) return alert(res.msg);
      location.href = "dashboard.html";
    });
  }
}

// ---------------- COURSES PAGE ----------------
function initCourses(){
  renderHeaderUser('#header-user');

  const el = document.getElementById("course-list");
  if(!el) return;

  el.innerHTML = COURSES.map(c=>`
    <div class="card course">
      <div style="flex:1">
        <strong>${c.title}</strong>
        <div class="small">${c.level} • ${c.desc}</div>
      </div>
      <a class="btn" href="courses.html?open=${c.id}">Open</a>
    </div>`).join('');

  const params = new URLSearchParams(location.search);
  const openId = params.get("open");
  if(openId) showCourseDetail(openId);
}

function showCourseDetail(courseId){
  const course = getCourseById(courseId);
  const main = document.querySelector(".container");
  if(!course || !main) return;

  main.innerHTML = `
    <div class="card">
      <div class="row" style="justify-content:space-between;">
        <div>
          <h2 class="headline">${course.title}</h2>
          <div class="small">${course.desc}</div>
        </div>
        <button class="btn" id="enrollBtn">Enroll</button>
      </div>

      <hr style="margin:15px 0;">

      ${course.lessons.map(l=>`
        <div class="card" style="margin-top:10px;">
          <strong>${l.title}</strong>
          <div class="small">${l.content}</div>
          <div class="row" style="margin-top:10px;">
            <a class="btn ghost" href="lesson.html?course=${course.id}&lesson=${l.id}">Open Lesson</a>
          </div>
        </div>
      `).join('')}
    </div>

    <div class="card">
      <a class="btn ghost" href="courses.html">← Back to Courses</a>
    </div>
  `;

  document.getElementById("enrollBtn").addEventListener("click",()=>{
    const r = enrollCourse(courseId);
    if(!r.ok) return alert(r.msg);
    alert("Enrolled!");
  });
}

// ---------------- LESSON PAGE ----------------
function initLesson(){
  renderHeaderUser('#header-user');
  const params = new URLSearchParams(location.search);
  const courseId = params.get("course");
  const lessonId = params.get("lesson");

  const course = getCourseById(courseId);
  const lesson = course?.lessons.find(l=>l.id===lessonId);

  const titleEl = document.getElementById("lessonTitle");
  const contentEl = document.getElementById("lessonContent");

  titleEl.textContent = lesson.title;
  contentEl.textContent = lesson.content;

  document.getElementById("playLesson").addEventListener("click", simulatePlayback);
  document.getElementById("completeLesson").addEventListener("click",()=>{
    markLessonComplete(courseId,lessonId);
    alert("Lesson marked complete");
  });

  document.getElementById("openQuiz").href = `quiz.html?course=${courseId}&quiz=${course.quizzes[0].id}`;
}

function simulatePlayback(){
  const fill = document.querySelector(".progress > i");
  let w=0; fill.style.width="0%";
  const t = setInterval(()=>{
    w+=10;
    fill.style.width = w+"%";
    if(w>=100) clearInterval(t);
  },300);
}

// ---------------- QUIZ PAGE ----------------
function initQuiz(){
  renderHeaderUser('#header-user');

  const params = new URLSearchParams(location.search);
  const courseId = params.get("course");
  const quizId = params.get("quiz");

  const course = getCourseById(courseId);
  const quiz = course.quizzes.find(q=>q.id===quizId);

  document.getElementById("quizTitle").textContent = quiz.title;

  const area = document.getElementById("quizArea");
  area.innerHTML = quiz.questions.map((q,i)=>`
    <div class="card" style="margin-top:10px;">
      <strong>Q${i+1}. ${q.q}</strong>
      ${q.opts.map((o,oi)=>`
        <div style="margin-top:8px;">
          <label><input type="radio" name="q${i}" value="${oi}"> ${o}</label>
        </div>
      `).join('')}
    </div>
  `).join('') + `
    <button class="btn" style="margin-top:18px;" id="submitQuiz">Submit Quiz</button>
  `;

  document.getElementById("submitQuiz").addEventListener("click",()=>{
    let score=0;
    quiz.questions.forEach((q,i)=>{
      const sel=document.querySelector(`input[name='q${i}']:checked`);
      if(sel && Number(sel.value)===q.a) score++;
    });
    const pct = Math.round(score/quiz.questions.length*100);
    saveQuizResult(courseId,quizId,pct);
    alert("You scored: "+pct+"%");
    location.href="dashboard.html";
  });
}

// ---------------- VOCAB PAGE ----------------
function initVocab(){
  renderHeaderUser('#header-user');

  const params = new URLSearchParams(location.search);
  const courseId = params.get("course") || COURSES[0].id;
  const course = getCourseById(courseId);

  document.getElementById("vocabCourseTitle").textContent = course.title + " — Vocabulary";

  const stack = course.vocab.slice();
  let idx=0;

  const wordEl = document.getElementById("v-word");
  const meanEl = document.getElementById("v-mean");

  function render(){
    const item = stack[idx % stack.length];
    wordEl.textContent = item.word;
    meanEl.textContent = "—";
  }

  render();

  document.getElementById("v-show").addEventListener("click",()=>{
    meanEl.textContent = stack[idx % stack.length].meaning;
  });

  document.getElementById("v-next").addEventListener("click",()=>{
    idx++;
    render();
  });
}

// ---------------- DASHBOARD PAGE ----------------
function initDashboard(){
  renderHeaderUser('#header-user');
  const dash = document.getElementById("dashMain");
  const s = getSession();
  if(!s){
    dash.innerHTML = "<p class='muted'>Sign in to view your learning dashboard.</p>";
    return;
  }

  const users = loadUsers();
  const u = users[s.id];

  const profileHTML = `
    <div class="card">
      <div class="row" style="justify-content:space-between;">
        <div>
          <h3>${u.profile.name || s.id.split("@")[0]}</h3>
          <div class="small">Target: ${u.profile.language || "—"} • Daily ${u.profile.daily} mins</div>
        </div>
        <button class="btn" id="editProfile">Edit Profile</button>
      </div>
    </div>
  `;

  const enrolled = u.enrolled || [];
  let coursesHTML = "";

  if(enrolled.length === 0){
    coursesHTML = "<p class='muted'>You have not enrolled in any course.</p>";
  } else {
    coursesHTML = enrolled.map(cid=>{
      const course = getCourseById(cid);
      const done = (u.progress[cid] || []).length;
      const total = course.lessons.length;
      const pct = Math.round(done/total*100);

      return `
        <div class="card" style="margin-top:12px;">
          <div class="row" style="justify-content:space-between;">
            <div>
              <strong>${course.title}</strong>
              <div class="small">${done}/${total} lessons completed</div>
            </div>
            <div style="text-align:right;">
              <div class="progress" style="width:160px;">
                <i style="width:${pct}%;"></i>
              </div>
              <a class="btn ghost" style="margin-top:10px;" href="lesson.html?course=${cid}&lesson=${course.lessons[0].id}">
                Continue
              </a>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  const recentQuiz = u.quizzes.length ?
    u.quizzes.slice(-3).reverse().map(q=>{
      return `<div class="small">${getCourseById(q.courseId).title} — ${q.scorePct}%</div>`;
    }).join('') :
    "<p class='muted'>No quizzes attempted yet.</p>";

  dash.innerHTML = `
    ${profileHTML}
    <div class="card">
      <h3>Enrolled Courses</h3>
      ${coursesHTML}
    </div>
    <div class="card">
      <h3>Recent Quizzes</h3>
      ${recentQuiz}
    </div>
  `;

  document.getElementById("editProfile").addEventListener("click",()=>{
    const name = prompt("Enter your name", u.profile.name || "");
    if(name === null) return;

    const lang = prompt("Target language?", u.profile.language || "");
    if(lang === null) return;

    const daily = prompt("Daily learning minutes?", u.profile.daily);
    if(daily === null) return;

    u.profile.name = name;
    u.profile.language = lang;
    u.profile.daily = Number(daily) || 20;

    saveUsers(users);
    alert("Profile updated!");
    location.reload();
  });
}

// ---------------- ROUTER ----------------
document.addEventListener("DOMContentLoaded",()=>{
  const page = document.body.dataset.page;

  if(page==="index") initIndex();
  if(page==="auth") initAuth();
  if(page==="courses") initCourses();
  if(page==="lesson") initLesson();
  if(page==="quiz") initQuiz();
  if(page==="vocab") initVocab();
  if(page==="dashboard") initDashboard();
});
