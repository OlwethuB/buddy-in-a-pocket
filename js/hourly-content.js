
// =========================================================
// HOURLY CONTENT
// File: js/hourly-content.js
// No emoji icons. Original text plus scripture references.
// =========================================================

window.BuddyContent = (() => {
  const categories = {
    funny: [
      "Your notes have been waiting longer than your laundry.",
      "Your future self called. They said, 'Please open the textbook.'",
      "A 10-minute study session is still longer than a 10-minute debate about studying.",
      "Your highlighter is not a substitute for understanding the chapter.",
      "The deadline is approaching. It has excellent time management.",
      "Your textbook isn't judging you. It has no eyes.",
      "Reading the same paragraph six times is not a new study technique.",
      "Your bed has submitted an extremely persuasive counterargument.",
      "One page at a time. Rome wasn't revised in a day.",
      "Your notes called. They would like to become knowledge.",
      "Coffee cannot learn the chapter for you. We checked.",
      "You opened the app. That's the opening scene, not the whole movie.",
      "Your future degree would like a small contribution of effort.",
      "Procrastination: the art of doing everything except the thing.",
      "A plan without a start time is a very polite wish.",
      "Your pen is ready. Your notebook is ready. Are you ready?",
      "Today's plot twist: you actually finish the task.",
      "The syllabus is long. Fortunately, so is the semester.",
      "You don't need perfect stationery to begin.",
      "Your brain deserves a break. First, give it something to remember."
    ],

    riddles: [
      { q: "What has pages but is not a website?", a: "A book." },
      { q: "What gets sharper the more you use it to solve problems?", a: "Your mind." },
      { q: "What can fill a room but takes up no space?", a: "Light." },
      { q: "What has keys but opens no locks?", a: "A piano." },
      { q: "What has a face and hands but no arms or legs?", a: "A clock." },
      { q: "What has many words but never speaks?", a: "A dictionary." },
      { q: "What gets wetter as it dries?", a: "A towel." },
      { q: "What can you catch but never throw?", a: "A cold." },
      { q: "What has a neck but no head?", a: "A bottle." },
      { q: "What has cities but no houses and rivers but no water?", a: "A map." },
      { q: "What goes up but never comes down?", a: "Your age." },
      { q: "What belongs to you but others use it more?", a: "Your name." },
      { q: "What has one eye but cannot see?", a: "A needle." },
      { q: "What breaks when you say its name?", a: "Silence." },
      { q: "What has 13 hearts but no organs?", a: "A deck of cards." },
      { q: "What travels the world while staying in one corner?", a: "A postage stamp." },
      { q: "What can run but never walks?", a: "Water." },
      { q: "What has roots nobody sees and is taller than trees?", a: "A mountain." },
      { q: "What is full of holes but still holds water?", a: "A sponge." },
      { q: "What comes once in a minute, twice in a moment, but never in a thousand years?", a: "The letter M." }
    ],

    quotes: [
      "A small step repeated is a routine in the making.",
      "You don't need to feel ready to begin.",
      "Consistency is returning, even after a difficult day.",
      "Progress is evidence of effort, not perfection.",
      "A realistic plan is more useful than an impressive fantasy.",
      "Start where your attention is, not where you wish it were.",
      "Rest is part of a sustainable routine.",
      "Every question you practise is a chance to learn.",
      "You can change the plan without abandoning the goal.",
      "A missed day is information, not a verdict.",
      "Learning takes time. Give understanding room to grow.",
      "Make the next step clear enough to begin.",
      "Your pace can be different and still move you forward.",
      "A useful session beats a perfect plan that never starts.",
      "Focus on what you can do with the time you have.",
      "Asking for help is a learning strategy.",
      "You are allowed to learn this one step at a time.",
      "Small wins are worth noticing.",
      "Discipline can include kindness toward yourself.",
      "Tomorrow's plan starts with today's honest reflection."
    ],

    scriptures: [
      { ref: "Proverbs 16:3", theme: "Commit your work and plans." },
      { ref: "Galatians 6:9", theme: "Do not grow weary in doing good." },
      { ref: "Philippians 4:6–7", theme: "Bring worries to God in prayer." },
      { ref: "Isaiah 40:31", theme: "Renewed strength and hope." },
      { ref: "Proverbs 3:5–6", theme: "Trust and seek guidance." },
      { ref: "James 1:5", theme: "Ask for wisdom." },
      { ref: "Psalm 46:10", theme: "Be still." },
      { ref: "Matthew 11:28", theme: "Come for rest when weary." },
      { ref: "Joshua 1:9", theme: "Be courageous." },
      { ref: "Colossians 3:23", theme: "Work wholeheartedly." },
      { ref: "Ecclesiastes 3:1", theme: "There is a season for everything." },
      { ref: "Psalm 121:1–2", theme: "Look to the source of your help." },
      { ref: "Romans 12:12", theme: "Persevere in hope." },
      { ref: "Proverbs 4:25–27", theme: "Keep your direction in view." },
      { ref: "Psalm 37:5", theme: "Commit your way and trust." },
      { ref: "2 Timothy 1:7", theme: "Remember courage, love and self-control." },
      { ref: "Matthew 6:34", theme: "Take one day at a time." },
      { ref: "Psalm 90:17", theme: "Ask for your work to be established." },
      { ref: "1 Corinthians 10:31", theme: "Act with purpose." },
      { ref: "Lamentations 3:22–23", theme: "Mercies are renewed." }
    ]
  };

  const categoryNames = {
    funny: "A study break",
    riddles: "A riddle to solve",
    quotes: "A thought to carry",
    scriptures: "A scripture to reflect on"
  };

  function getHourlyIndex(now = new Date()) {
    return Math.floor(now.getTime() / 3_600_000);
  }

  function getCurrent() {
    const hour = getHourlyIndex();
    const keys = Object.keys(categories);
    const category = keys[((hour % keys.length) + keys.length) % keys.length];
    const items = categories[category];
    const item = items[((hour * 7) % items.length + items.length) % items.length];

    return {
      category,
      title: categoryNames[category],
      item,
      hour
    };
  }

  return { categories, getCurrent };
})();
