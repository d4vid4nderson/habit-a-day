'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Fuse from 'fuse.js';
import { LogButton } from '@/components/LogButton';
import { History } from '@/components/History';
import { Calendar } from '@/components/Calendar';
import { Menu } from '@/components/Menu';
import { TrackerData, BathroomType, BathroomEntry } from '@/lib/types';
import { loadData, saveData, createEntry } from '@/lib/storage';
import { PoopIcon, PeeIcon } from '@/components/icons/BathroomIcons';
import { useGender } from '@/lib/GenderContext';

function toLocalDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getToday(): string {
  return toLocalDateString(new Date());
}

const peeQuips = [
  "Bladder: 0, You: 1",
  "Another successful drainage operation!",
  "Hydration station activated!",
  "The bladder has left the building!",
  "Tinkle time champion!",
  "Stream achieved. Mission complete.",
  "Your kidneys thank you for your service.",
  "Liquid assets successfully liquidated!",
  "Release the kraken!",
  "Wee have liftoff!",
  "Peak performance. Peak relief.",
  "Ah yes, the sweet sound of progress.",
  "Nature called. You answered.",
  "Flushed with success!",
  "The porcelain throne awaits no more!",
];

const poopQuips = [
  "Colon: 0, You: 1",
  "Another successful delivery!",
  "Payload deployed successfully!",
  "The brown submarine has left the dock!",
  "Dropping the kids off at the pool!",
  "Mission accomplished, soldier.",
  "Your gut thanks you for your service.",
  "Solid performance. Literally.",
  "Release the chocolate dragon!",
  "Houston, we have separation!",
  "Peak productivity achieved.",
  "Ah yes, the sweet smell of victory.",
  "Nature called. You delivered.",
  "Flushed with pride!",
  "The throne room has been blessed!",
];

function formatDateHeader(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (date.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  }

  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  });
}

export default function Home() {
  const [data, setData] = useState<TrackerData | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [selectedType, setSelectedType] = useState<BathroomType | null>(null);
  const [notes, setNotes] = useState('');
  const [poopConsistency, setPoopConsistency] = useState('');
  const [peeStream, setPeeStream] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [peeDropdownOpen, setPeeDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const peeDropdownRef = useRef<HTMLDivElement | null>(null);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqTab, setFaqTab] = useState<'poop' | 'pee'>('poop');
  const [faqSearch, setFaqSearch] = useState('');
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [addEntryType, setAddEntryType] = useState<BathroomType | null>(null);
  const [addEntryTime, setAddEntryTime] = useState('');
  const [addEntryNotes, setAddEntryNotes] = useState('');
  const [addEntryConsistency, setAddEntryConsistency] = useState('');
  const [addEntryStream, setAddEntryStream] = useState('');
  const [addConsistencyDropdownOpen, setAddConsistencyDropdownOpen] = useState(false);
  const [addStreamDropdownOpen, setAddStreamDropdownOpen] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement | null>(null);
  const addConsistencyRef = useRef<HTMLDivElement | null>(null);
  const addStreamRef = useRef<HTMLDivElement | null>(null);
  const { gender } = useGender();

  const headerGradient = gender === 'female'
    ? 'from-pink-500 to-purple-600'
    : 'from-teal-500 to-blue-600';

  const poopColor = gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400';
  const peeColor = gender === 'female' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400';
  const saveButtonClass = gender === 'female'
    ? 'bg-pink-500 hover:bg-purple-600 active:bg-purple-600'
    : 'bg-teal-500 hover:bg-blue-600 active:bg-blue-600';

  const randomPeeQuip = useMemo(() => {
    return peeQuips[Math.floor(Math.random() * peeQuips.length)];
  }, [selectedType]);

  const randomPoopQuip = useMemo(() => {
    return poopQuips[Math.floor(Math.random() * poopQuips.length)];
  }, [selectedType]);

  useEffect(() => {
    setData(loadData());
  }, []);

  useEffect(() => {
    if (data) {
      saveData(data);
    }
  }, [data]);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current && !dropdownRef.current.contains(target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [dropdownOpen]);

  useEffect(() => {
    if (!peeDropdownOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (peeDropdownRef.current && !peeDropdownRef.current.contains(target)) {
        setPeeDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [peeDropdownOpen]);

  useEffect(() => {
    if (!addDropdownOpen || addEntryType) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (addDropdownRef.current && !addDropdownRef.current.contains(target)) {
        setAddDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [addDropdownOpen, addEntryType]);

  useEffect(() => {
    if (!addConsistencyDropdownOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (addConsistencyRef.current && !addConsistencyRef.current.contains(target)) {
        setAddConsistencyDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [addConsistencyDropdownOpen]);

  useEffect(() => {
    if (!addStreamDropdownOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (addStreamRef.current && !addStreamRef.current.contains(target)) {
        setAddStreamDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [addStreamDropdownOpen]);

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  const handleSelect = (type: BathroomType) => {
    setSelectedType(type);
    setNotes('');
    setPoopConsistency('');
    setPeeStream('');
    setDropdownOpen(false);
    setPeeDropdownOpen(false);
  };

  const handleSave = () => {
    if (!selectedType) return;
    const entry = createEntry(selectedType, notes);
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: [entry, ...prev.entries],
      };
    });
    setSelectedType(null);
    setNotes('');
    setPoopConsistency('');
    setPeeStream('');
    setDropdownOpen(false);
    setPeeDropdownOpen(false);
  };

  const handleManualAdd = (type: BathroomType) => {
    if (!addEntryTime) return;
    const [hours, minutes] = addEntryTime.split(':').map(Number);
    const entryDate = new Date(selectedDate + 'T00:00:00');
    entryDate.setHours(hours, minutes, 0, 0);

    const entry: BathroomEntry = {
      id: crypto.randomUUID(),
      type,
      timestamp: entryDate.getTime(),
      notes: addEntryNotes,
    };

    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: [entry, ...prev.entries],
      };
    });
    setAddDropdownOpen(false);
    setAddEntryType(null);
    setAddEntryTime('');
    setAddEntryNotes('');
    setAddEntryConsistency('');
    setAddEntryStream('');
    setAddConsistencyDropdownOpen(false);
    setAddStreamDropdownOpen(false);
  };

  const handleCancelManualAdd = () => {
    setAddDropdownOpen(false);
    setAddEntryType(null);
    setAddEntryTime('');
    setAddEntryNotes('');
    setAddEntryConsistency('');
    setAddEntryStream('');
    setAddConsistencyDropdownOpen(false);
    setAddStreamDropdownOpen(false);
  };

  const handleCancel = () => {
    setSelectedType(null);
    setNotes('');
    setPoopConsistency('');
    setPeeStream('');
    setDropdownOpen(false);
    setPeeDropdownOpen(false);
  };

  const handleDelete = (id: string) => {
    setData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        entries: prev.entries.filter((e) => e.id !== id),
      };
    });
  };

  const hasEntriesOnDate = (dateStr: string): boolean => {
    const dateStart = new Date(dateStr + 'T00:00:00').getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return data.entries.some((e) => e.timestamp >= dateStart && e.timestamp < dateEnd);
  };

  const getEntriesForDate = (dateStr: string) => {
    const dateStart = new Date(dateStr + 'T00:00:00').getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return data.entries
      .filter((e) => e.timestamp >= dateStart && e.timestamp < dateEnd)
      .sort((a, b) => b.timestamp - a.timestamp);
  };

  const typeConfig = {
    poop: { bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    pee: { bg: 'bg-violet-100 dark:bg-violet-900/30' },
  };

  // FAQ View
  if (showFaq) {
    const poopFaqs: { question: string; answer: string }[] = gender === 'female' ? [
      {
        question: "What does normal poop look like?",
        answer: "Healthy poop is medium to dark brown (thanks to a pigment called bilirubin), soft to firm in texture, and shaped like a sausage due to your intestines. It should be pain-free to pass and require minimal strain."
      },
      {
        question: "How often should I poop?",
        answer: "Most people go once or twice daily, though anywhere from three times a day to three times a week is normal. What matters most is consistency - monitor any significant changes in your routine."
      },
      {
        question: "Why do I get constipated before my period?",
        answer: "Progesterone levels rise before your period and can slow down gut motility, leading to constipation. Once your period starts, prostaglandins kick in and often cause the opposite effect - looser stools or diarrhea."
      },
      {
        question: "Why do I poop more during my period?",
        answer: "Prostaglandins that help your uterus contract can also stimulate your bowels, causing more frequent or looser stools. This is completely normal! Staying hydrated and eating fiber can help manage it."
      },
      {
        question: "Does pregnancy affect bowel movements?",
        answer: "Yes! Hormonal changes, prenatal vitamins (especially iron), and the growing uterus pressing on your intestines can all cause constipation during pregnancy. Talk to your doctor about safe remedies."
      },
      {
        question: "How long should a poop take?",
        answer: "A healthy bowel movement should take about 10-15 minutes. If you're regularly taking longer, you may be dealing with constipation, hemorrhoids, or another condition worth checking out."
      },
      {
        question: "Why is my poop green?",
        answer: "Green poop usually comes from eating spinach, kale, or other leafy greens. It can also mean food moved through your gut quickly, resulting in more bile and less bilirubin. Usually nothing to worry about!"
      },
      {
        question: "What does black poop mean?",
        answer: "Black, tar-like stools can suggest gastrointestinal bleeding and warrant a doctor visit. Iron supplements (common in women) can also cause dark stools. Check with your doctor if unsure."
      },
      {
        question: "What about red poop?",
        answer: "Red poop may indicate lower GI bleeding, with small amounts possibly suggesting hemorrhoids. But before you panic - red foods like beets can also turn your poop red!"
      },
      {
        question: "When should I see a doctor?",
        answer: "Consult a doctor if you have red or black stool, or if any color changes last 2 or more weeks. Also seek help for persistent pain, major changes in frequency, or any symptoms that concern you."
      },
    ] : [
      {
        question: "What does normal poop look like?",
        answer: "Healthy poop is medium to dark brown (thanks to a pigment called bilirubin), soft to firm in texture, and shaped like a sausage due to your intestines. It should be pain-free to pass and require minimal strain."
      },
      {
        question: "How often should I poop?",
        answer: "Most people go once or twice daily, though anywhere from three times a day to three times a week is normal. What matters most is consistency - monitor any significant changes in your routine."
      },
      {
        question: "How long should a poop take?",
        answer: "A healthy bowel movement should take about 10-15 minutes. If you're regularly taking longer, you may be dealing with constipation, hemorrhoids, or another condition worth checking out."
      },
      {
        question: "Why is my poop green?",
        answer: "Green poop usually comes from eating spinach, kale, or other leafy greens. It can also mean food moved through your gut quickly, resulting in more bile and less bilirubin. Usually nothing to worry about!"
      },
      {
        question: "What does black poop mean?",
        answer: "Black, tar-like stools can suggest gastrointestinal bleeding and warrant a doctor visit. However, eating lots of black-colored foods (like licorice or blueberries) can also be the culprit."
      },
      {
        question: "What about red poop?",
        answer: "Red poop may indicate lower GI bleeding, with small amounts possibly suggesting hemorrhoids. But before you panic - red foods like beets can also turn your poop red!"
      },
      {
        question: "Why is my poop yellow or greasy?",
        answer: "Yellow or greasy-looking poop usually means it contains too much fat. This could be from absorption issues or difficulty producing enzymes or bile. Worth mentioning to your doctor if it persists."
      },
      {
        question: "What does white or pale poop mean?",
        answer: "White, gray, or pale stools suggest a lack of bile and may indicate a liver or gallbladder issue. Some anti-diarrhea medications can also cause this. See a doctor if it continues."
      },
      {
        question: "Why is my poop orange?",
        answer: "Orange poop can come from blocked bile ducts, certain medications (like some antacids or the antibiotic rifampin), or simply eating lots of orange foods rich in beta-carotene like carrots and sweet potatoes."
      },
      {
        question: "When should I see a doctor?",
        answer: "Consult a doctor if you have red or black stool, or if any color changes last 2 or more weeks. Also seek help for persistent pain, major changes in frequency, or any symptoms that concern you."
      },
    ];

    const peeFaqs: { question: string; answer: string }[] = gender === 'female' ? [
      {
        question: "How often should I pee?",
        answer: "Most people urinate 6-8 times per day. However, this can vary based on fluid intake, medications, and individual differences. If you're going more than 8-10 times or waking up multiple times at night, it may be worth discussing with a doctor."
      },
      {
        question: "What color should healthy urine be?",
        answer: "Healthy urine is typically pale yellow to light amber, like lemonade. Dark yellow means you need more water, while completely clear might mean you're overhydrated. Unusual colors like orange, pink, or brown warrant a doctor visit."
      },
      {
        question: "Why do women get UTIs more often?",
        answer: "Women have a shorter urethra than men, making it easier for bacteria to reach the bladder. Sexual activity, certain birth control methods, and hormonal changes (like menopause) can also increase UTI risk. Always wipe front to back and pee after sex to help prevent them."
      },
      {
        question: "Why does it burn when I pee?",
        answer: "Burning during urination is often a sign of a UTI, especially if accompanied by frequent urges to pee, cloudy urine, or pelvic pressure. See a doctor promptly - UTIs are easily treated with antibiotics but can spread to kidneys if left untreated."
      },
      {
        question: "Why do I leak urine when I cough, sneeze, or exercise?",
        answer: "This is called stress incontinence and is very common in women, especially after pregnancy and childbirth. Pelvic floor exercises (Kegels) can help strengthen the muscles that control urination. Talk to your doctor about treatment options."
      },
      {
        question: "Why do I need to pee more during my period?",
        answer: "Hormonal fluctuations and prostaglandins during your period can irritate your bladder, causing increased urinary frequency. Bloating and water retention before your period may also play a role."
      },
      {
        question: "Does pregnancy affect urination?",
        answer: "Yes! Early pregnancy hormones increase blood flow to your kidneys, making you pee more. Later, the growing baby puts pressure on your bladder. Frequent urination is one of the earliest and most persistent pregnancy symptoms."
      },
      {
        question: "Why do I have to pee so urgently?",
        answer: "Sudden, intense urges to urinate (urge incontinence) can be caused by overactive bladder, caffeine, UTIs, or bladder irritants. Bladder training exercises and avoiding triggers like caffeine and alcohol can help."
      },
      {
        question: "Is it bad to hold my pee?",
        answer: "Occasionally holding your pee is fine, but regularly holding it for long periods can weaken bladder muscles and increase UTI risk. Try to go when you feel the urge, especially if you're prone to UTIs."
      },
      {
        question: "When should I see a doctor about urination?",
        answer: "See a doctor if you experience pain or burning, blood in urine, frequent UTIs, severe urgency or incontinence, difficulty starting urination, or any sudden changes in your urination patterns."
      },
    ] : [
      {
        question: "How often should I pee?",
        answer: "Most people urinate 6-8 times per day. However, this can vary based on fluid intake, medications, and individual differences. If you're going more than 8-10 times or waking up multiple times at night, it may be worth discussing with a doctor."
      },
      {
        question: "What color should healthy urine be?",
        answer: "Healthy urine is typically pale yellow to light amber, like lemonade. Dark yellow means you need more water, while completely clear might mean you're overhydrated. Unusual colors like orange, pink, or brown warrant a doctor visit."
      },
      {
        question: "Why is my urine stream weak or slow?",
        answer: "A weak stream can be a sign of prostate enlargement (BPH), which is common in men over 50. It can also result from urethral stricture or nerve problems. If you notice a consistently weak stream, talk to your doctor."
      },
      {
        question: "Why do I dribble after I finish peeing?",
        answer: "Post-void dribbling is common in men and often related to urine remaining in the urethra. Try \"milking\" the urethra by pressing gently behind your scrotum after urinating, or waiting a few seconds before leaving the restroom."
      },
      {
        question: "Why do I have to get up at night to pee?",
        answer: "Waking up to urinate (nocturia) can be caused by drinking fluids before bed, prostate enlargement, sleep apnea, or certain medications. Reducing evening fluids and emptying your bladder before bed can help. See a doctor if it's frequent."
      },
      {
        question: "What is the prostate and how does it affect urination?",
        answer: "The prostate is a walnut-sized gland that surrounds the urethra. As men age, it often enlarges (BPH), which can squeeze the urethra and cause urinary symptoms like weak stream, frequency, urgency, and incomplete emptying."
      },
      {
        question: "Why does it burn when I pee?",
        answer: "Burning during urination can indicate a UTI (less common in men but still possible), prostatitis, or an STI. If you experience burning, especially with discharge or fever, see a doctor promptly for evaluation."
      },
      {
        question: "Is it bad to hold my pee?",
        answer: "Occasionally holding your pee is fine, but regularly holding it for extended periods can weaken bladder muscles and potentially contribute to urinary retention. Try to go when you feel the urge."
      },
      {
        question: "Why is there blood in my urine?",
        answer: "Blood in urine (hematuria) can be caused by UTIs, kidney stones, prostate problems, or more serious conditions. Even a small amount of blood warrants a doctor visit to determine the cause."
      },
      {
        question: "When should I see a doctor about urination?",
        answer: "See a doctor if you experience pain or burning, blood in urine, difficulty starting or stopping urination, weak stream, frequent nighttime urination, or any sudden changes in your urination patterns."
      },
    ];

    const allFaqs = [
      ...poopFaqs.map(faq => ({ ...faq, category: 'poop' as const })),
      ...peeFaqs.map(faq => ({ ...faq, category: 'pee' as const })),
    ];
    const tabFaqs = faqTab === 'poop'
      ? poopFaqs.map(faq => ({ ...faq, category: 'poop' as const }))
      : peeFaqs.map(faq => ({ ...faq, category: 'pee' as const }));

    const fuse = new Fuse(allFaqs, {
      keys: ['question', 'answer'],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
    });
    const currentFaqs = faqSearch.trim()
      ? fuse.search(faqSearch).map(result => result.item)
      : tabFaqs;

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => {
            setShowFaq(view === 'faq');
            setShowHistory(view === 'history');
          }}
          currentView="faq"
        />

        <header className={`sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => setShowFaq(false)}
              className="flex items-center gap-1 text-white/90 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-light text-white">
              Potty FAQs
            </h1>
            <div className="w-14" />
          </div>
        </header>

        <main className="mx-auto max-w-lg px-4 py-4 pb-24">
          {/* FAQ Tabs */}
          <div className="mb-6 flex rounded-2xl bg-white p-1.5 shadow-sm dark:bg-zinc-800">
            <button
              onClick={() => { setFaqTab('poop'); setFaqSearch(''); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                faqTab === 'poop'
                  ? gender === 'female'
                    ? 'bg-pink-500 text-white'
                    : 'bg-teal-500 text-white'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Poop FAQs
            </button>
            <button
              onClick={() => { setFaqTab('pee'); setFaqSearch(''); }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-medium transition-colors ${
                faqTab === 'pee'
                  ? gender === 'female'
                    ? 'bg-purple-500 text-white'
                    : 'bg-blue-500 text-white'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Pee FAQs
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <svg
              className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              value={faqSearch}
              onChange={(e) => setFaqSearch(e.target.value)}
              placeholder="Search FAQs..."
              className={`w-full rounded-xl border-2 border-zinc-200 bg-white py-3 pl-12 pr-4 text-base focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${
                gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
              }`}
            />
            {faqSearch && (
              <button
                onClick={() => setFaqSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          <div className="space-y-4">
            {currentFaqs.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-zinc-800">
                <p className="text-zinc-500 dark:text-zinc-400">No FAQs match your search.</p>
              </div>
            ) : currentFaqs.map((faq, index) => (
              <div key={index} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
                <div className="flex items-start justify-between gap-2">
                  <h3 className={`font-semibold bg-gradient-to-r ${headerGradient} bg-clip-text text-transparent`}>
                    {faq.question}
                  </h3>
                  {faqSearch.trim() && (
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      faq.category === 'poop'
                        ? gender === 'female'
                          ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                        : gender === 'female'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                    }`}>
                      {faq.category === 'poop' ? 'Poop' : 'Pee'}
                    </span>
                  )}
                </div>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </main>

        {/* Floating Menu Button */}
        <button
          onClick={() => setMenuOpen(true)}
          className={`fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform bg-gradient-to-r ${headerGradient}`}
          aria-label="Open menu"
        >
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    );
  }

  // History View
  if (showHistory) {
    const dayEntries = getEntriesForDate(selectedDate);

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => {
            setShowHistory(view === 'history');
            setShowFaq(view === 'faq');
          }}
          currentView="history"
        />

        <header className={`sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => {
                setShowHistory(false);
                setSelectedDate(getToday());
              }}
              className="flex items-center gap-1 text-white/90 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-light text-white">
              {gender === 'female' ? 'Herstory' : 'History'}
            </h1>
            <div className="w-14" />
          </div>
        </header>

        <main className="mx-auto max-w-lg px-4 py-4 pb-24">
          <div className="space-y-4">
            {/* Calendar */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <Calendar
                selectedDate={selectedDate}
                onSelectDate={setSelectedDate}
                hasEntries={hasEntriesOnDate}
              />
            </div>

            {/* Entries for selected day */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatDateHeader(selectedDate)}
                </h2>
                {!addEntryType && (
                  <div className="relative" ref={addDropdownRef}>
                    <button
                      onClick={() => setAddDropdownOpen(!addDropdownOpen)}
                      className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold transition-colors ${
                        gender === 'female'
                          ? 'bg-pink-100 text-pink-700 active:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400'
                          : 'bg-teal-100 text-teal-700 active:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-400'
                      }`}
                    >
                      + Add
                      <svg
                        className={`h-5 w-5 transition-transform ${addDropdownOpen ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {addDropdownOpen && (
                      <div className="absolute right-0 z-20 mt-2 w-72 rounded-2xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-800">
                        <div className="space-y-3">
                          <p className="mb-3 text-sm font-medium text-zinc-500 dark:text-zinc-400">What are you logging?</p>
                          <button
                            onClick={() => { setAddEntryType('pee'); setAddDropdownOpen(false); }}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                              gender === 'female'
                                ? 'text-purple-700 hover:bg-purple-100 dark:text-purple-400 dark:hover:bg-purple-900/30'
                                : 'text-blue-700 hover:bg-blue-100 dark:text-blue-400 dark:hover:bg-blue-900/30'
                            }`}
                          >
                            <PeeIcon className="h-7 w-7" />
                            <span className="text-lg font-semibold">Pee&apos;d</span>
                          </button>
                          <button
                            onClick={() => { setAddEntryType('poop'); setAddDropdownOpen(false); }}
                            className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                              gender === 'female'
                                ? 'text-pink-700 hover:bg-pink-100 dark:text-pink-400 dark:hover:bg-pink-900/30'
                                : 'text-teal-700 hover:bg-teal-100 dark:text-teal-400 dark:hover:bg-teal-900/30'
                            }`}
                          >
                            <PoopIcon className="h-7 w-7" />
                            <span className="text-lg font-semibold">Poop&apos;d</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Full-width Add Entry Form */}
              {addEntryType && (
                <div className="mb-4 rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {addEntryType === 'poop' ? (
                        <PoopIcon className={`h-8 w-8 ${poopColor}`} />
                      ) : (
                        <PeeIcon className={`h-8 w-8 ${peeColor}`} />
                      )}
                      <span className={`text-xl font-bold ${addEntryType === 'poop' ? poopColor : peeColor}`}>
                        {addEntryType === 'poop' ? "Poop'd" : "Pee'd"}
                      </span>
                    </div>
                    <button
                      onClick={handleCancelManualAdd}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>

                  <div className="space-y-4">
                    {/* Time Input */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Time</label>
                      <div className="relative w-full overflow-hidden rounded-xl">
                        <input
                          type="time"
                          value={addEntryTime}
                          onChange={(e) => setAddEntryTime(e.target.value)}
                          className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                          style={{
                            WebkitAppearance: 'none',
                            MozAppearance: 'none',
                            appearance: 'none',
                            maxWidth: '100%',
                            boxSizing: 'border-box',
                          }}
                        />
                      </div>
                    </div>

                    {/* Consistency Dropdown (for poop only) */}
                    {addEntryType === 'poop' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Consistency</label>
                        <div className="relative" ref={addConsistencyRef}>
                          <button
                            type="button"
                            onClick={() => setAddConsistencyDropdownOpen(!addConsistencyDropdownOpen)}
                            className={`w-full cursor-pointer rounded-xl border-2 bg-white p-4 text-base flex items-center justify-between focus:outline-none dark:bg-zinc-800 dark:text-zinc-200 ${
                              addConsistencyDropdownOpen
                                ? gender === 'female'
                                  ? 'border-pink-500'
                                  : 'border-teal-500'
                                : 'border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            <span className={`text-left ${addEntryConsistency ? '' : 'text-zinc-400'}`}>
                              {addEntryConsistency === 'hard-lumps' && 'Separate hard lumps'}
                              {addEntryConsistency === 'lumpy-sausage' && 'A lumpy, sausage-like clump'}
                              {addEntryConsistency === 'cracked-sausage' && 'A sausage shape with cracks'}
                              {addEntryConsistency === 'smooth-sausage' && 'Smooth sausage-shaped'}
                              {addEntryConsistency === 'soft-blobs' && 'Soft blobs with clear edges'}
                              {addEntryConsistency === 'mushy-mass' && 'A mushy, ragged mass'}
                              {addEntryConsistency === 'liquid' && 'Liquid'}
                              {!addEntryConsistency && 'Select consistency...'}
                            </span>
                            <svg className={`h-5 w-5 text-zinc-400 transition-transform ${addConsistencyDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {addConsistencyDropdownOpen && (
                            <div className="absolute z-20 mt-2 w-full rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
                              {[
                                { value: '', label: 'Select consistency...' },
                                { value: 'hard-lumps', label: 'Separate hard lumps' },
                                { value: 'lumpy-sausage', label: 'A lumpy, sausage-like clump' },
                                { value: 'cracked-sausage', label: 'A sausage shape with cracks' },
                                { value: 'smooth-sausage', label: 'Smooth sausage-shaped' },
                                { value: 'soft-blobs', label: 'Soft blobs with clear edges' },
                                { value: 'mushy-mass', label: 'A mushy, ragged mass' },
                                { value: 'liquid', label: 'Liquid' },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setAddEntryConsistency(option.value);
                                    setAddConsistencyDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 text-left text-base transition-colors ${
                                    addEntryConsistency === option.value
                                      ? `${gender === 'female' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'}`
                                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 px-4 min-h-[40px]">
                          {addEntryConsistency === 'hard-lumps' && "Indicates constipation. You may need more fiber and water in your diet."}
                          {addEntryConsistency === 'lumpy-sausage' && "Slightly constipated. Try increasing your fiber and fluid intake."}
                          {addEntryConsistency === 'cracked-sausage' && "Normal and healthy! You're doing great."}
                          {addEntryConsistency === 'smooth-sausage' && "Perfect poop! This is the gold standard of bowel movements."}
                          {addEntryConsistency === 'soft-blobs' && "Normal, especially if you're going multiple times a day."}
                          {addEntryConsistency === 'mushy-mass' && "Leaning toward diarrhea. Could be mild infection or dietary issue."}
                          {addEntryConsistency === 'liquid' && "Diarrhea. Stay hydrated and see a doctor if it persists."}
                          {!addEntryConsistency && "\u00A0"}
                        </p>
                      </div>
                    )}

                    {/* Stream Dropdown (for pee only) */}
                    {addEntryType === 'pee' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Stream Strength</label>
                        <div className="relative" ref={addStreamRef}>
                          <button
                            type="button"
                            onClick={() => setAddStreamDropdownOpen(!addStreamDropdownOpen)}
                            className={`w-full cursor-pointer rounded-xl border-2 bg-white p-4 text-base flex items-center justify-between focus:outline-none dark:bg-zinc-800 dark:text-zinc-200 ${
                              addStreamDropdownOpen
                                ? gender === 'female'
                                  ? 'border-purple-500'
                                  : 'border-blue-500'
                                : 'border-zinc-200 dark:border-zinc-700'
                            }`}
                          >
                            <span className={`text-left ${addEntryStream ? '' : 'text-zinc-400'}`}>
                              {addEntryStream === 'strong' && 'Strong'}
                              {addEntryStream === 'normal' && 'Normal'}
                              {addEntryStream === 'weak' && 'Weak'}
                              {addEntryStream === 'intermittent' && 'Intermittent'}
                              {addEntryStream === 'dribbling' && 'Dribbling'}
                              {!addEntryStream && 'Select stream strength...'}
                            </span>
                            <svg className={`h-5 w-5 text-zinc-400 transition-transform ${addStreamDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                          {addStreamDropdownOpen && (
                            <div className="absolute z-20 mt-2 w-full rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
                              {[
                                { value: '', label: 'Select stream strength...' },
                                { value: 'strong', label: 'Strong' },
                                { value: 'normal', label: 'Normal' },
                                { value: 'weak', label: 'Weak' },
                                { value: 'intermittent', label: 'Intermittent' },
                                { value: 'dribbling', label: 'Dribbling' },
                              ].map((option) => (
                                <button
                                  key={option.value}
                                  type="button"
                                  onClick={() => {
                                    setAddEntryStream(option.value);
                                    setAddStreamDropdownOpen(false);
                                  }}
                                  className={`w-full px-4 py-3 text-left text-base transition-colors ${
                                    addEntryStream === option.value
                                      ? `${gender === 'female' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`
                                      : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                                  }`}
                                >
                                  {option.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400 px-4 min-h-[40px]">
                          {addEntryStream === 'strong' && "Forceful, steady stream. Good bladder pressure and pelvic floor function."}
                          {addEntryStream === 'normal' && "Comfortable, consistent flow. Healthy urination pattern."}
                          {addEntryStream === 'weak' && "Low pressure, takes longer. May indicate pelvic floor weakness or obstruction."}
                          {addEntryStream === 'intermittent' && "Stop-and-start stream. Could suggest bladder or prostate issues."}
                          {addEntryStream === 'dribbling' && "Slow drips, difficulty starting/stopping. Consider pelvic floor exercises."}
                          {!addEntryStream && "\u00A0"}
                        </p>
                      </div>
                    )}

                    {/* Notes */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Notes</label>
                      <textarea
                        value={addEntryNotes}
                        onChange={(e) => setAddEntryNotes(e.target.value)}
                        placeholder={addEntryType === 'pee' ? "Urination Documentation (optional)..." : "The Turds As Words (optional)..."}
                        className={`min-h-[100px] w-full resize-none rounded-xl border-2 border-zinc-200 bg-white p-4 text-base leading-relaxed focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${
                          gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                        }`}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleCancelManualAdd}
                        className="flex-1 cursor-pointer rounded-xl bg-zinc-200 py-3 text-base font-medium text-zinc-700 active:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:active:bg-zinc-600"
                      >
                        Flush It
                      </button>
                      <button
                        onClick={() => handleManualAdd(addEntryType)}
                        disabled={!addEntryTime}
                        className={`flex-1 cursor-pointer rounded-xl py-3 text-base font-semibold text-white transition-colors disabled:opacity-50 ${
                          gender === 'female'
                            ? 'bg-pink-500 hover:bg-pink-600 disabled:hover:bg-pink-500'
                            : 'bg-teal-500 hover:bg-teal-600 disabled:hover:bg-teal-500'
                        }`}
                      >
                        Log Entry
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {dayEntries.length > 0 ? (
                <History entries={dayEntries} onDelete={handleDelete} />
              ) : (
                !addEntryType && <p className="py-4 text-center text-zinc-400">No entries</p>
              )}
              {/* Daily Summary */}
              <div className={`flex gap-4 ${dayEntries.length > 0 ? 'mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-700' : 'mt-2'}`}>
                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 dark:bg-zinc-700/50">
                  <PeeIcon className={`h-5 w-5 ${peeColor}`} />
                  <span className={`font-medium ${peeColor}`}>Pee&apos;d</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {dayEntries.filter(e => e.type === 'pee').length}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 dark:bg-zinc-700/50">
                  <PoopIcon className={`h-5 w-5 ${poopColor}`} />
                  <span className={`font-medium ${poopColor}`}>Poop&apos;d</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {dayEntries.filter(e => e.type === 'poop').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* Floating Menu Button */}
        <button
          onClick={() => setMenuOpen(true)}
          className={`fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform bg-gradient-to-r ${headerGradient}`}
          aria-label="Open menu"
        >
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    );
  }

  // Entry Mode - adding notes
  if (selectedType) {
    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => {
            setSelectedType(null);
            setShowHistory(view === 'history');
            setShowFaq(view === 'faq');
          }}
          currentView="log"
        />

        <header className={`sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={handleCancel}
              className="flex items-center gap-1 text-white/90 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-light text-white">
              Potty Deets
            </h1>
            <div className="w-14" />
          </div>
        </header>

        <main className="mx-auto max-w-lg px-4 py-4 pb-24">
          <div className="space-y-4 pt-8">
            {selectedType === 'pee' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <p className={`text-5xl font-black bg-gradient-to-r ${headerGradient} bg-clip-text text-transparent`}>HOLY PISS!!</p>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 italic">{randomPeeQuip}</p>
              </div>
            )}

            {selectedType === 'pee' && (
              <div className="space-y-2">
                <div className="relative" ref={peeDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setPeeDropdownOpen(!peeDropdownOpen)}
                    className={`w-full cursor-pointer rounded-xl border-2 bg-white p-4 text-base flex items-center justify-between focus:outline-none dark:bg-zinc-800 dark:text-zinc-200 ${
                      peeDropdownOpen
                        ? gender === 'female'
                          ? 'border-purple-500'
                          : 'border-blue-500'
                        : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <span className={`text-left ${peeStream ? '' : 'text-zinc-400'}`}>
                      {peeStream === 'strong' && 'Strong'}
                      {peeStream === 'normal' && 'Normal'}
                      {peeStream === 'weak' && 'Weak'}
                      {peeStream === 'intermittent' && 'Intermittent'}
                      {peeStream === 'dribbling' && 'Dribbling'}
                      {!peeStream && 'Select stream strength...'}
                    </span>
                    <svg className={`h-5 w-5 text-zinc-400 transition-transform ${peeDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {peeDropdownOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
                      {[
                        { value: '', label: 'Select stream strength...' },
                        { value: 'strong', label: 'Strong' },
                        { value: 'normal', label: 'Normal' },
                        { value: 'weak', label: 'Weak' },
                        { value: 'intermittent', label: 'Intermittent' },
                        { value: 'dribbling', label: 'Dribbling' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setPeeStream(option.value);
                            setPeeDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-base transition-colors ${
                            peeStream === option.value
                              ? `${gender === 'female' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'}`
                              : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 min-h-[40px]">
                  {peeStream === 'strong' && "Forceful, steady stream. Good bladder pressure and pelvic floor function."}
                  {peeStream === 'normal' && "Comfortable, consistent flow. Healthy urination pattern."}
                  {peeStream === 'weak' && "Low pressure, takes longer. May indicate pelvic floor weakness or obstruction."}
                  {peeStream === 'intermittent' && "Stop-and-start stream. Could suggest bladder or prostate issues."}
                  {peeStream === 'dribbling' && "Slow drips, difficulty starting/stopping. Consider pelvic floor exercises."}
                  {!peeStream && "\u00A0"}
                </p>
              </div>
            )}

            {selectedType === 'poop' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <p className={`text-5xl font-black bg-gradient-to-r ${headerGradient} bg-clip-text text-transparent`}>HOLY SHIT!!</p>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 italic">{randomPoopQuip}</p>
              </div>
            )}

            {selectedType === 'poop' && (
              <div className="space-y-2">
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className={`w-full cursor-pointer rounded-xl border-2 bg-white p-4 text-base flex items-center justify-between focus:outline-none dark:bg-zinc-800 dark:text-zinc-200 ${
                      dropdownOpen
                        ? gender === 'female'
                          ? 'border-pink-500'
                          : 'border-teal-500'
                        : 'border-zinc-200 dark:border-zinc-700'
                    }`}
                  >
                    <span className={`text-left ${poopConsistency ? '' : 'text-zinc-400'}`}>
                      {poopConsistency === 'hard-lumps' && 'Separate hard lumps'}
                      {poopConsistency === 'lumpy-sausage' && 'A lumpy, sausage-like clump'}
                      {poopConsistency === 'cracked-sausage' && 'A sausage shape with cracks'}
                      {poopConsistency === 'smooth-sausage' && 'Smooth sausage-shaped'}
                      {poopConsistency === 'soft-blobs' && 'Soft blobs with clear edges'}
                      {poopConsistency === 'mushy-mass' && 'A mushy, ragged mass'}
                      {poopConsistency === 'liquid' && 'Liquid'}
                      {!poopConsistency && 'Select consistency...'}
                    </span>
                    <svg className={`h-5 w-5 text-zinc-400 transition-transform ${dropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {dropdownOpen && (
                    <div className="absolute z-20 mt-2 w-full rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-800 overflow-hidden">
                      {[
                        { value: '', label: 'Select consistency...' },
                        { value: 'hard-lumps', label: 'Separate hard lumps' },
                        { value: 'lumpy-sausage', label: 'A lumpy, sausage-like clump' },
                        { value: 'cracked-sausage', label: 'A sausage shape with cracks' },
                        { value: 'smooth-sausage', label: 'Smooth sausage-shaped' },
                        { value: 'soft-blobs', label: 'Soft blobs with clear edges' },
                        { value: 'mushy-mass', label: 'A mushy, ragged mass' },
                        { value: 'liquid', label: 'Liquid' },
                      ].map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => {
                            setPoopConsistency(option.value);
                            setDropdownOpen(false);
                          }}
                          className={`w-full px-4 py-3 text-left text-base transition-colors ${
                            poopConsistency === option.value
                              ? `${gender === 'female' ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400' : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'}`
                              : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 min-h-[40px]">
                  {poopConsistency === 'hard-lumps' && "Indicates constipation. You may need more fiber and water in your diet."}
                  {poopConsistency === 'lumpy-sausage' && "Slightly constipated. Try increasing your fiber and fluid intake."}
                  {poopConsistency === 'cracked-sausage' && "Normal and healthy! You're doing great."}
                  {poopConsistency === 'smooth-sausage' && "Perfect poop! This is the gold standard of bowel movements."}
                  {poopConsistency === 'soft-blobs' && "Normal, especially if you're going multiple times a day."}
                  {poopConsistency === 'mushy-mass' && "Leaning toward diarrhea. Could be mild infection or dietary issue."}
                  {poopConsistency === 'liquid' && "Diarrhea. Stay hydrated and see a doctor if it persists."}
                  {!poopConsistency && "\u00A0"}
                </p>
              </div>
            )}

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={selectedType === 'pee' ? "Urination Documentation (optional)..." : "The Turds As Words (optional)..."}
              className={`min-h-[120px] w-full resize-none rounded-xl border-2 border-zinc-200 bg-white p-4 text-base leading-relaxed focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${
                gender === 'female' ? 'focus:!border-purple-500' : 'focus:!border-blue-500'
              }`}
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={handleCancel}
                className="flex-1 cursor-pointer rounded-xl bg-zinc-200 py-4 text-base font-medium text-zinc-700 active:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:active:bg-zinc-600"
              >
                Flush It
              </button>
              <button
                onClick={handleSave}
                className={`flex-1 cursor-pointer rounded-xl py-4 text-base font-medium text-white transition-colors ${saveButtonClass}`}
              >
                Log it
              </button>
            </div>
          </div>
        </main>

        {/* Floating Menu Button */}
        <button
          onClick={() => setMenuOpen(true)}
          className={`fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform bg-gradient-to-r ${headerGradient}`}
          aria-label="Open menu"
        >
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
    );
  }

  // Main Log View
  return (
    <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(view) => {
          setShowHistory(view === 'history');
          setShowFaq(view === 'faq');
        }}
        currentView={showHistory ? 'history' : showFaq ? 'faq' : 'log'}
      />

      <main className="mx-auto max-w-lg px-4 py-4">
        <div className="space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row">
            <LogButton type="pee" onLog={handleSelect} />
            <LogButton type="poop" onLog={handleSelect} />
          </div>

        </div>
      </main>

      {/* Floating Menu Button */}
        <button
          onClick={() => setMenuOpen(true)}
          className={`fixed bottom-6 right-6 z-30 flex h-14 w-14 items-center justify-center rounded-full shadow-lg active:scale-95 transition-transform bg-gradient-to-r ${headerGradient}`}
          aria-label="Open menu"
        >
          <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
    </div>
  );
}
