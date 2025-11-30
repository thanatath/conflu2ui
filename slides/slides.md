---
theme: default
title: Conflu2UI - AI Hackathon Pitch
info: |
  ## Conflu2UI
  Boost BA to Super BA — and Boost Everyone
class: text-center
highlighter: shiki
drawings:
  persist: false
transition: slide-left
mdc: true
colorSchema: dark
fonts:
  sans: 'Kanit'
  mono: 'Fira Code'
  provider: google
---

<div class="relative">
<div class="absolute -top-20 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-pink-500/20 rounded-full blur-3xl"></div>
</div>

# Conflu2UI

<div class="mt-6 text-2xl text-gray-300 tracking-wide">
Boost BA to <span class="text-indigo-400 font-semibold">Super BA</span> — and Boost <span class="text-purple-400 font-semibold">Everyone</span>
</div>

<div class="mt-4 text-gray-500 text-sm max-w-md mx-auto">
เปลี่ยน User Story ให้เป็น Interactive UI Prototype ได้ทันที ด้วย Multi-Agent Systems
</div>

<div class="mt-12 flex justify-center gap-4">
<div class="px-5 py-2 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
<span class="text-indigo-300 font-mono">Team: โดดงานไปแข่ง AI</span>
</div>
</div>

<div class="mt-16 flex justify-center gap-8 text-gray-600 text-xs font-mono">
<div class="flex items-center gap-2">
<div class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
</div>
<div>SCB MINI Hackathon 2025</div>
</div>

<style>
h1 {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
  background-clip: text;
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-size: 5rem !important;
  font-weight: 700;
  letter-spacing: -0.02em;
  text-shadow: 0 0 80px rgba(102, 126, 234, 0.5);
}
</style>

---
transition: fade-out
layout: image-right
image: /The_Waiting_Game.jpg
backgroundSize: contain
class: my-auto
---

# The Waiting Game

<div class="text-lg text-gray-400 mb-6">วงจรแห่งการรอคอย และต้นทุนแฝงมหาศาล</div>

<div class="space-y-4">
<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center text-lg">📋</div>
<div class="flex-1">
<div class="text-orange-400 font-semibold">BA</div>
<div class="text-gray-500 text-xs">เขียน User Story เสร็จ <span class="text-green-400">✓</span></div>
</div>
</div>

<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center text-lg">🎨</div>
<div class="flex-1">
<div class="text-yellow-400 font-semibold">Designer</div>
<div class="text-gray-500 text-xs">วาด UI Mockup <span class="text-yellow-400 animate-pulse">⏳ 3-4 Days</span></div>
</div>
</div>

<div class="flex items-center gap-3">
<div class="w-10 h-10 rounded-lg bg-cyan-500/20 flex items-center justify-center text-lg">💻</div>
<div class="flex-1">
<div class="text-cyan-400 font-semibold">Developer</div>
<div class="text-gray-500 text-xs">รอรูป Design <span class="text-red-400">⛔ Blocked</span></div>
</div>
</div>
</div>

<div v-click class="mt-6 bg-red-500/10 border border-red-500/30 rounded-xl px-4 py-3">
<div class="text-red-400 font-semibold">Developer Idle Time = Money Burned</div>
<div class="text-gray-500 text-xs mt-1">เงินเดือนจ่ายไป แต่งานไม่ได้เริ่ม</div>
</div>

<div v-click class="mt-4 flex gap-4 text-center text-sm">
<div class="text-gray-400"><span class="text-lg font-bold text-orange-400">3-4</span> วัน/รอบ</div>
<div class="text-gray-400"><span class="text-lg font-bold text-red-400">~40</span> MD/เดือน</div>
</div>

---
layout: image-left
image: /The_Solution.png
backgroundSize: contain
class: my-auto
transition: slide-up
---

# The Solution

<div class="text-lg text-gray-400 mb-8">พระเอกขี่ม้าขาว มาลบช่วงเวลาแห่งการรอ</div>

<div class="space-y-3">
<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center text-2xl">📝</div>
<div class="flex-1">
<div class="text-green-400 font-semibold text-lg">User Story Input</div>
<div class="flex flex-wrap gap-1 mt-1">
<span class="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-gray-400">Confluence</span>
<span class="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-gray-400">.docx</span>
<span class="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-gray-400">.md</span>
<span class="text-xs bg-zinc-800 border border-zinc-700 rounded px-2 py-0.5 text-gray-400">Plain Text</span>
</div>
</div>
</div>

<div class="text-2xl text-indigo-400 pl-5">↓</div>

<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center text-2xl animate-pulse">🤖</div>
<div>
<div class="text-indigo-400 font-semibold text-lg">AI Engine</div>
<div class="text-gray-500 text-sm font-mono">Multi-Agent System</div>
</div>
</div>

<div class="text-2xl text-indigo-400 pl-5">↓</div>

<div class="flex items-center gap-4">
<div class="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-2xl">🖥️</div>
<div>
<div class="text-blue-400 font-semibold text-lg">Interactive UI</div>
<div class="text-gray-500 text-sm font-mono">Prototype Preview</div>
</div>
</div>
</div>

<div v-click class="mt-4 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl px-4 py-3">
<span class="text-indigo-300 font-semibold">ไม่ต้องรอ Design อีกต่อไป</span>
<div class="text-gray-400 text-sm">เปลี่ยน Requirement ให้เป็นของที่จับต้องได้ทันที</div>
</div>

---
transition: slide-left
---

# How It Works

<div class="text-xl text-gray-400 mb-8">Flow สั้นๆ — ไม่ใช่เวทมนตร์ แต่คือ Engineering</div>

<div class="flex items-center justify-center gap-4 mt-12">
  <div class="w-48 bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-center">
    <div class="text-3xl mb-2">📄</div>
    <div class="font-semibold text-gray-300">User Story</div>
    <div class="text-xs text-gray-500 mt-1 font-mono">Markdown / Text / docx</div>
  </div>

  <div class="text-2xl text-gray-600">→</div>

  <div class="w-48 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl p-4 text-center">
    <div class="text-3xl mb-2">🧠</div>
    <div class="font-semibold text-indigo-300">AI Engine</div>
    <div class="text-xs text-indigo-400 mt-1 font-mono">UX/UI Tuned LLM</div>
  </div>

  <div class="text-2xl text-gray-600">→</div>

  <div class="w-48 bg-zinc-800/50 border border-zinc-700 rounded-xl p-4 text-center">
    <div class="text-3xl mb-2">💻</div>
    <div class="font-semibold text-gray-300">Coding</div>
    <div class="text-xs text-gray-500 mt-1 font-mono">Via Agent</div>
  </div>

  <div class="text-2xl text-gray-600">→</div>

  <div class="w-48 bg-gradient-to-br from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-xl p-4 text-center">
    <div class="text-3xl mb-2">🖼️</div>
    <div class="font-semibold text-green-300">Live Preview</div>
    <div class="text-xs text-green-400 mt-1 font-mono">Interactive UI</div>
  </div>
</div>

<div v-click class="mt-12 text-center">
  <div class="inline-block border border-zinc-700 rounded-lg px-6 py-3 bg-zinc-800/30">
    <span class="text-gray-400">เปลี่ยน</span>
    <span class="text-indigo-400 font-semibold mx-2">ภาษาคน</span>
    <span class="text-gray-400">ให้เป็น</span>
    <span class="text-green-400 font-semibold mx-2">ภาษาคอม</span>
    <span class="text-gray-400">ด้วย AI Engine</span>
  </div>
</div>

---
layout: image-right
image: /Why_Were_Different.png
backgroundSize: contain
class: my-auto
transition: fade
---

# Deep into technical

<div class="text-lg text-gray-400 mb-6">Agentic Orchestration — Multi-Agent Systems</div>

<div class="space-y-3">
<div class="flex items-center gap-3 bg-orange-500/10 border border-orange-500/20 rounded-xl p-3">
<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center">📋</div>
<div>
<div class="text-orange-400 font-semibold">BA Agent</div>
<div class="text-xs text-gray-500">วิเคราะห์ User Story • Clarify Requirements</div>
</div>
</div>

<div class="flex items-center gap-3 bg-purple-500/10 border border-purple-500/20 rounded-xl p-3">
<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 flex items-center justify-center">🏗️</div>
<div>
<div class="text-purple-400 font-semibold">SA Agent</div>
<div class="text-xs text-gray-500">ออกแบบ UI/UX Spec • กำหนด Component</div>
</div>
</div>

<div class="flex items-center gap-3 bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-3">
<div class="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-cyan-600 flex items-center justify-center">💻</div>
<div>
<div class="text-cyan-400 font-semibold">DEV Agent</div>
<div class="text-xs text-gray-500">Generate Code • Responsive Design</div> 
</div>
</div>
</div>

<div v-click class="mt-4 space-y-2">
<div class="bg-zinc-800/30 border border-zinc-700 rounded-lg p-2 text-sm">
<span class="text-indigo-400 font-semibold">🎯 Contextual Encapsulation</span>
<span class="text-gray-500 ml-2">Isolate history ของแต่ละ Agent</span>
</div>
<div class="bg-zinc-800/30 border border-zinc-700 rounded-lg p-2 text-sm">
<span class="text-green-400 font-semibold">🛡️ Reduced Hallucination</span>
<span class="text-gray-500 ml-2">Context เล็กลง = ผลลัพธ์แม่นยำ</span>
</div>
</div>

---
transition: fade
---

# Our Secret Sauce

<div class="text-lg text-gray-400 mb-6">แล้วที่มีอยู่ในท้องตลาด?</div>

<div class="grid grid-cols-2 gap-6">
<div>
<div class="text-gray-500 text-sm font-mono mb-3">Prompt to Product ในตลาด</div>
<div class="grid grid-cols-3 gap-2">
<img src="/Our_Secret_Sauce.jpg" class="w-full h-20 object-cover rounded-lg border border-zinc-700 opacity-70" />
<img src="/Our_Secret_Sauce_2.webp" class="w-full h-20 object-cover rounded-lg border border-zinc-700 opacity-70" />
<img src="/Our_Secret_Sauce_3.png" class="w-full h-20 object-cover rounded-lg border border-zinc-700 opacity-70" />
</div>
<div class="mt-3 text-sm text-gray-400 space-y-1">
<div><span class="text-yellow-400">→</span> Single LLM ตัวเดียว</div>
<div><span class="text-yellow-400">→</span> One-shot generation</div>
<div><span class="text-yellow-400">→</span> No Isolated context</div>
</div>
</div>

<div class="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl p-5">
<div class="text-indigo-400 text-sm font-mono mb-3">Prompt to MAS to Product</div>
<div class="text-xl font-semibold text-white mb-3">Conflu2UI</div>
<div class="text-sm text-gray-300 space-y-1">
<div><span class="text-green-400">✓</span> Multi-Agent Systems</div>
<div><span class="text-green-400">✓</span> Specialized Role Delegation</div>
<div><span class="text-green-400">✓</span> Contextual Encapsulation</div>
<div><span class="text-green-400">✓</span> Virtual Software House</div>
</div>
</div>
</div>

<div v-click class="mt-6 text-center">
<div class="inline-block bg-zinc-800/50 border border-zinc-700 rounded-xl px-6 py-3 text-sm">
<span class="text-indigo-400 font-semibold">Conflu2UI</span>
<span class="text-gray-400"> — Platform Agent ตัวแรกๆ ที่นำเสนอ </span>
<span class="text-purple-400 font-semibold">Agentic MAS</span>
</div>
</div>

---
layout: center
class: text-center
transition: zoom-in
---

# Live Demo

<div class="text-lg text-gray-400 mb-6">Conception Preview</div>

<div class="relative w-full max-w-4xl mx-auto">
<div class="bg-zinc-900 border border-zinc-700 rounded-2xl overflow-hidden shadow-2xl">
<div class="bg-zinc-800 px-4 py-2 flex items-center gap-2">
<div class="flex gap-2">
<div class="w-3 h-3 rounded-full bg-red-500/80"></div>
<div class="w-3 h-3 rounded-full bg-yellow-500/80"></div>
<div class="w-3 h-3 rounded-full bg-green-500/80"></div>
</div>
<div class="flex-1 text-center">
<span class="text-gray-500 text-sm font-mono">conflu2ui.thanatach.com</span>
</div>
</div>
<video src="/video.webm" class="w-full" controls></video>
</div>
</div>

<div v-click class="mt-6 flex justify-center gap-6">
<div class="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2">
<span class="text-indigo-400 font-mono text-sm">Real-time Streaming</span>
</div>
<div class="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2">
<span class="text-green-400 font-mono text-sm">Live Code Editing</span>
</div>
  <div class="bg-zinc-800/50 border border-zinc-700 rounded-lg px-4 py-2">
    <span class="text-purple-400 font-mono text-sm">Instant Preview</span>
  </div>
</div>

---
transition: slide-up
---

# The Impact

<div class="text-xl text-gray-400 mb-8">กลับมาดูปัญหาที่เราแก้ได้</div>

<div class="grid grid-cols-2 gap-8 mt-8">
  <div>
    <div class="text-red-400 font-semibold text-lg mb-4 flex items-center gap-2">
      <span class="text-2xl">❌</span> Before (Traditional)
    </div>
    <div class="space-y-3">
      <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-gray-400 text-sm">
        Dev รอ Design 3-4 วัน = Idle Time
      </div>
      <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-gray-400 text-sm">
        BA กับ Dev เห็นภาพไม่ตรงกัน
      </div>
      <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-gray-400 text-sm">
        แก้ไปแก้มา = Cost พุ่งสูง
      </div>
      <div class="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-gray-400 text-sm">
        Feedback Loop ยาวนาน
      </div>
    </div>
  </div>

  <div>
    <div class="text-green-400 font-semibold text-lg mb-4 flex items-center gap-2">
      <span class="text-2xl">✓</span> After (Conflu2UI)
    </div>
    <div class="space-y-3">
      <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-gray-300 text-sm">
        Dev เริ่มงานได้ตั้งแต่ <span class="text-green-400 font-semibold">Day 1</span>
      </div>
      <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-gray-300 text-sm">
        เห็นภาพตรงกัน = <span class="text-green-400 font-semibold">Zero Miscommunication</span>
      </div>
      <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-gray-300 text-sm">
        ได้ Code พร้อมใช้ = <span class="text-green-400 font-semibold">Head Start</span>
      </div>
      <div class="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-gray-300 text-sm">
        Iterate ได้ทันที = <span class="text-green-400 font-semibold">Fast Feedback</span>
      </div>
    </div>
  </div>
</div>

<div v-click class="mt-8 text-center">
  <div class="inline-block bg-gradient-to-r from-green-500/20 to-cyan-500/20 border border-green-500/30 rounded-xl px-8 py-4">
    <span class="text-green-300 text-xl font-semibold">ลดเวลาคุย ลดเวลารอ และ Dev ได้เริ่มงานตั้งแต่วันแรก</span>
  </div>
</div>

---
transition: slide-up
---

# Roadmap

<div class="text-xl text-gray-400 mb-8">อนาคตที่มากกว่า Prototyping</div>

<div class="grid grid-cols-3 gap-6 mt-12">
<div class="bg-gradient-to-b from-green-500/10 to-transparent border border-green-500/30 rounded-2xl p-6 text-center">
<div class="text-green-400 font-mono text-sm mb-2">Now</div>
<div class="w-4 h-4 rounded-full bg-green-500 ring-4 ring-green-500/20 mx-auto mb-4"></div>
<div class="text-gray-300 font-semibold">BA-Focused Prototyping</div>
<div class="text-gray-500 text-sm mt-2">User Story → Interactive UI</div>
</div>

<div class="bg-gradient-to-b from-indigo-500/10 to-transparent border border-indigo-500/30 rounded-2xl p-6 text-center">
<div class="text-indigo-400 font-mono text-sm mb-2">Future</div>
<div class="w-4 h-4 rounded-full bg-indigo-500 ring-4 ring-indigo-500/20 mx-auto mb-4"></div>
<div class="text-gray-300 font-semibold">Expand to All Roles</div>
<div class="text-gray-500 text-sm mt-2">PM, QA, Designer, Developer</div>
</div>

<div class="bg-gradient-to-b from-purple-500/10 to-transparent border border-purple-500/30 rounded-2xl p-6 text-center">
<div class="text-purple-400 font-mono text-sm mb-2">Future</div>
<div class="w-4 h-4 rounded-full bg-purple-500 ring-4 ring-purple-500/20 mx-auto mb-4"></div>
<div class="text-gray-300 font-semibold">Enterprise Scale</div>
<div class="text-gray-500 text-sm mt-2">Agent PM, QA, Pentest, Full SDLC</div>
</div>
</div>

<div v-click class="mt-12 text-center">
<div class="inline-block bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-xl px-8 py-4">
<span class="text-indigo-300 text-lg">จาก Prototyping Platform สู่</span>
<span class="text-purple-400 text-lg font-semibold"> Virtual Software House</span>
</div>
</div>

---
layout: center
class: text-center
---

# Thank You

<div class="relative">
<div class="absolute -top-32 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-gradient-to-r from-indigo-500/10 via-purple-500/15 to-pink-500/10 rounded-full blur-3xl"></div>
</div>

<div class="text-6xl font-bold bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent mb-6">
Questions? Let's talk!
</div>

<div class="flex justify-center gap-3 mb-10">
<div class="w-12 h-1 rounded-full bg-indigo-500/50"></div>
<div class="w-12 h-1 rounded-full bg-purple-500/50"></div>
<div class="w-12 h-1 rounded-full bg-pink-500/50"></div>
</div>

<div class="inline-block px-6 py-3 rounded-full bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 mb-8">
<span class="text-indigo-300 font-mono">Team: โดดงานไปแข่ง AI</span>
</div>

<div class="flex justify-center gap-6 text-gray-600 text-sm">
<div class="flex items-center gap-2 hover:text-purple-400 transition-colors cursor-pointer">
<span>📦</span>
<span class="font-mono">github.com/thanatath/conflu2ui</span>
</div>
</div>

---
transition: fade
class: text-center
---

# Appendix

<div class="text-lg text-gray-400 mb-8">Links & Resources</div>

<div class="grid grid-cols-2 gap-12 max-w-2xl mx-auto mt-8">
<div class="flex flex-col items-center">
<div class="bg-white p-3 rounded-2xl mb-4">
<img src="/qr-web.png" class="w-36 h-36" />
</div>
<div class="text-xl font-semibold text-indigo-400">Live Demo</div>
<a href="https://conflu2ui.thanatach.com" target="_blank" class="text-gray-500 text-sm font-mono hover:text-indigo-400 transition-colors">conflu2ui.thanatach.com</a>
</div>

<div class="flex flex-col items-center">
<div class="bg-white p-3 rounded-2xl mb-4">
<img src="/qr-github.png" class="w-36 h-36" />
</div>
<div class="text-xl font-semibold text-purple-400">Source Code</div>
<a href="https://github.com/thanatath/conflu2ui" target="_blank" class="text-gray-500 text-sm font-mono hover:text-purple-400 transition-colors">github.com/thanatath/conflu2ui</a>
</div>
</div>

<div class="mt-10 text-gray-600 text-sm">
Scan QR codes to explore
</div>

---
transition: fade
---

# Tech Stack

<div class="text-lg text-gray-400 mb-6">Built from Scratch</div>

<div class="grid grid-cols-2 gap-6">
<div class="space-y-4">
<div class="bg-green-500/10 border border-green-500/30 rounded-xl p-4">
<div class="flex items-center gap-3 mb-2">
<div class="w-8 h-8 rounded-lg bg-green-500/20 flex items-center justify-center text-lg">⚡</div>
<div class="text-green-400 font-semibold">NuxtJS</div>
</div>
<div class="text-sm text-gray-400">Server-Side Rendering (SSR) Framework</div>
</div>

<div class="bg-cyan-500/10 border border-cyan-500/30 rounded-xl p-4">
<div class="flex items-center gap-3 mb-2">
<div class="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-lg">🎨</div>
<div class="text-cyan-400 font-semibold">VueJS SFC</div>
</div>
<div class="text-sm text-gray-400">Single File Components สำหรับ Render Preview Prototype</div>
</div>
</div>

<div class="space-y-4">
<div class="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-4">
<div class="flex items-center gap-3 mb-2">
<div class="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-lg">🤖</div>
<div class="text-indigo-400 font-semibold">OpenAI-compatible APIs</div>
</div>
<div class="text-sm text-gray-400">เชื่อมต่อ AI Provider ได้หลากหลาย</div>
</div>

<div class="bg-purple-500/10 border border-purple-500/30 rounded-xl p-4">
<div class="flex items-center gap-3 mb-2">
<div class="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center text-lg">💬</div>
<div class="text-purple-400 font-semibold">Multi-turn Chat Completion</div>
</div>
<div class="text-sm text-gray-400">หลักการพัฒนา Agent แต่ละตัว</div>
</div>
</div>
</div>

<div v-click class="mt-6 text-center">
<div class="inline-block bg-zinc-800/50 border border-zinc-700 rounded-xl px-6 py-3">
<span class="text-gray-400">พัฒนาตั้งแต่ </span>
<span class="text-indigo-400 font-semibold">0</span>
<span class="text-gray-400"> — ไม่ได้ใช้ SDK สำเร็จรูป</span>
</div>
</div>
