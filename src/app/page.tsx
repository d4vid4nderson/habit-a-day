'use client';

import { useState, useEffect, useMemo, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Fuse from 'fuse.js';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { LogButton } from '@/components/LogButton';
import { History } from '@/components/History';
import { Calendar } from '@/components/Calendar';
import { Menu } from '@/components/Menu';
import { DesktopNav } from '@/components/DesktopNav';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { MigrationPrompt } from '@/components/MigrationPrompt';
import { BathroomType, BathroomEntry, WaterUnit, MealType, UrineColor, URINE_COLORS, StreamStrength } from '@/lib/types';
import { PoopIcon, PeeIcon, SimplePoopIcon, SimpleDropletIcon } from '@/components/icons/BathroomIcons';
import { CalorieAIModal } from '@/components/CalorieAIModal';
import { HealthcareReport } from '@/components/HealthcareReport';
import BarcodeScanner from '@/components/BarcodeScanner';
import { Flame, Sparkles, FileText, Share2, Copy, ScanBarcode } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useEntries } from '@/lib/hooks/useEntries';
import { useProfile } from '@/lib/hooks/useProfile';
import { useWaterIntake } from '@/lib/hooks/useWaterIntake';
import { useFoodJournal } from '@/lib/hooks/useFoodJournal';
import { calculateDietaryNeeds, getMealTypeLabel } from '@/lib/services/foodService';
import { createCustomFood } from '@/lib/services/customFoodsService';

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

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { entries, loading: entriesLoading, createEntry, deleteEntry } = useEntries();
  const { profile, gender, loading: profileLoading } = useProfile();
  const { entries: waterEntries, loading: waterLoading, createEntry: createWaterEntry, deleteEntry: deleteWaterEntry, getTodayTotal } = useWaterIntake();
  const { entries: foodEntries, loading: foodLoading, createEntry: createFoodEntry, deleteEntry: deleteFoodEntry, getTodayTotal: getTodayCalories, getTodayCaloriesByMeal } = useFoodJournal();

  const [currentView, setCurrentView] = useState<'home' | 'potty' | 'history' | 'faq' | 'water' | 'water-history' | 'water-faq' | 'food' | 'food-history' | 'food-faq'>('home');
  const [selectedType, setSelectedType] = useState<BathroomType | null>(null);
  const [notes, setNotes] = useState('');
  const [poopConsistency, setPoopConsistency] = useState('');
  const [peeStream, setPeeStream] = useState('');
  const [selectedUrineColor, setSelectedUrineColor] = useState<UrineColor | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(getToday());
  const [menuOpen, setMenuOpen] = useState(false);
  const [faqTab, setFaqTab] = useState<'poop' | 'pee'>('poop');
  const [faqSearch, setFaqSearch] = useState('');
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const [addEntryType, setAddEntryType] = useState<BathroomType | null>(null);
  const [addEntryHour, setAddEntryHour] = useState('');
  const [addEntryMinute, setAddEntryMinute] = useState('');
  const [addEntryAmPm, setAddEntryAmPm] = useState<'AM' | 'PM'>('AM');
  const [addEntryNotes, setAddEntryNotes] = useState('');
  const [addEntryConsistency, setAddEntryConsistency] = useState('');
  const [addEntryStream, setAddEntryStream] = useState('');
  const [showMigration, setShowMigration] = useState(true);
  const [selectedTracker, setSelectedTracker] = useState<'potty' | 'water' | 'food'>('food');
  const [chartDays, setChartDays] = useState<7 | 30 | 90 | 365>(7);
  const [chartDropdownOpen, setChartDropdownOpen] = useState(false);
  const addDropdownRef = useRef<HTMLDivElement | null>(null);
  const chartDropdownRef = useRef<HTMLDivElement | null>(null);

  // Water intake state
  const [waterAmount, setWaterAmount] = useState('');
  const [waterUnit, setWaterUnit] = useState<WaterUnit>('oz');
  const [waterNotes, setWaterNotes] = useState('');
  const [waterSelectedDate, setWaterSelectedDate] = useState(getToday());
  const [waterFaqSearch, setWaterFaqSearch] = useState('');
  // Water history add form state
  const [waterHistoryAddOpen, setWaterHistoryAddOpen] = useState(false);
  const [waterHistoryAmount, setWaterHistoryAmount] = useState('');
  const [waterHistoryNotes, setWaterHistoryNotes] = useState('');
  const [waterHistoryHour, setWaterHistoryHour] = useState('');
  const [waterHistoryMinute, setWaterHistoryMinute] = useState('');
  const [waterHistoryAmPm, setWaterHistoryAmPm] = useState<'AM' | 'PM'>('AM');

  // Food journal state
  const [foodMealType, setFoodMealType] = useState<MealType>('breakfast');
  const [foodCalories, setFoodCalories] = useState('');
  const [foodNotes, setFoodNotes] = useState('');
  const [foodSelectedDate, setFoodSelectedDate] = useState(getToday());
  const [foodFaqSearch, setFoodFaqSearch] = useState('');
  const [foodEntryHour, setFoodEntryHour] = useState('');
  const [foodEntryMinute, setFoodEntryMinute] = useState('');
  const [foodEntryAmPm, setFoodEntryAmPm] = useState<'AM' | 'PM'>('AM');
  const [calorieAIModalOpen, setCalorieAIModalOpen] = useState(false);
  const [calorieAISource, setCalorieAISource] = useState<'food' | 'food-history'>('food');
  const [barcodeScannerOpen, setBarcodeScannerOpen] = useState(false);
  const [barcodeScannerSource, setBarcodeScannerSource] = useState<'food' | 'food-history'>('food');
  const [foodCarbs, setFoodCarbs] = useState('');
  const [foodFat, setFoodFat] = useState('');
  const [foodProtein, setFoodProtein] = useState('');
  // Food history add form state
  const [foodHistoryAddOpen, setFoodHistoryAddOpen] = useState(false);
  const [foodHistoryMealType, setFoodHistoryMealType] = useState<MealType>('breakfast');
  const [foodHistoryCalories, setFoodHistoryCalories] = useState('');
  const [foodHistoryNotes, setFoodHistoryNotes] = useState('');
  const [foodHistoryHour, setFoodHistoryHour] = useState('');
  const [foodHistoryMinute, setFoodHistoryMinute] = useState('');
  const [foodHistoryAmPm, setFoodHistoryAmPm] = useState<'AM' | 'PM'>('AM');
  const [foodHistoryCarbs, setFoodHistoryCarbs] = useState('');
  const [foodHistoryFat, setFoodHistoryFat] = useState('');
  const [foodHistoryProtein, setFoodHistoryProtein] = useState('');
  const [healthcareReportOpen, setHealthcareReportOpen] = useState(false);
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const pottyChartRef = useRef<HTMLDivElement>(null);
  const waterChartRef = useRef<HTMLDivElement>(null);
  const foodChartRef = useRef<HTMLDivElement>(null);

  // Chart data - configurable time range
  const chartData = useMemo(() => {
    const days: { date: string; label: string; poop: number; pee: number; water: number; calories: number; carbs: number; fat: number; protein: number }[] = [];
    const today = new Date();

    for (let i = chartDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = toLocalDateString(date);
      const dateStart = new Date(dateStr + 'T00:00:00').getTime();
      const dateEnd = dateStart + 24 * 60 * 60 * 1000;

      // Count potty entries
      const poopCount = entries.filter(e => e.type === 'poop' && e.timestamp >= dateStart && e.timestamp < dateEnd).length;
      const peeCount = entries.filter(e => e.type === 'pee' && e.timestamp >= dateStart && e.timestamp < dateEnd).length;

      // Sum water intake (convert to oz for consistency)
      const waterTotal = waterEntries
        .filter(e => e.timestamp >= dateStart && e.timestamp < dateEnd)
        .reduce((sum, e) => {
          const amount = e.unit === 'ml' ? e.amount / 29.5735 : e.amount;
          return sum + amount;
        }, 0);

      // Sum food calories and macros
      const dayFoodEntries = foodEntries.filter(e => e.timestamp >= dateStart && e.timestamp < dateEnd);
      const caloriesTotal = dayFoodEntries.reduce((sum, e) => sum + e.calories, 0);
      const carbsTotal = dayFoodEntries.reduce((sum, e) => sum + (e.carbs || 0), 0);
      const fatTotal = dayFoodEntries.reduce((sum, e) => sum + (e.fat || 0), 0);
      const proteinTotal = dayFoodEntries.reduce((sum, e) => sum + (e.protein || 0), 0);

      // Format label based on range
      let label: string;
      if (chartDays <= 7) {
        label = date.toLocaleDateString('en-US', { weekday: 'short' });
      } else if (chartDays <= 30) {
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      } else {
        label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      }

      days.push({
        date: dateStr,
        label,
        poop: poopCount,
        pee: peeCount,
        water: Math.round(waterTotal * 10) / 10,
        calories: caloriesTotal,
        carbs: carbsTotal,
        fat: fatTotal,
        protein: proteinTotal,
      });
    }

    return days;
  }, [entries, waterEntries, foodEntries, chartDays]);

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

  // Get dietary needs based on profile
  const dietaryNeeds = useMemo(() => {
    const weightLbs = profile?.weight && profile?.weight_unit === 'kg'
      ? profile.weight * 2.20462
      : profile?.weight || null;
    return calculateDietaryNeeds(gender, profile?.age || null, weightLbs);
  }, [gender, profile?.age, profile?.weight, profile?.weight_unit]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/login');
    }
  }, [authLoading, user, router]);

  // Read view from query params (for navigation from other pages like profile)
  useEffect(() => {
    const viewParam = searchParams.get('view');
    if (viewParam) {
      const validViews = ['home', 'potty', 'history', 'faq', 'water', 'water-history', 'water-faq', 'food', 'food-history', 'food-faq'];
      if (validViews.includes(viewParam)) {
        setCurrentView(viewParam as typeof currentView);
        // Clear the query param from URL without triggering a navigation
        window.history.replaceState({}, '', '/');
      }
    }
  }, [searchParams]);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [currentView]);

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

  // Close chart dropdown when clicking outside
  useEffect(() => {
    if (!chartDropdownOpen) return;
    const handlePointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node;
      if (chartDropdownRef.current && !chartDropdownRef.current.contains(target)) {
        setChartDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
    };
  }, [chartDropdownOpen]);

  // Show loading state while checking auth
  if (authLoading || profileLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Loading...</div>
      </div>
    );
  }

  // Don't render anything if not authenticated (will redirect)
  if (!user) {
    return null;
  }

  // Show loading state while fetching entries
  if (entriesLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-zinc-500">Loading your data...</div>
      </div>
    );
  }

  const handleSelect = (type: BathroomType) => {
    setSelectedType(type);
    setNotes('');
    setPoopConsistency('');
    setPeeStream('');
    setSelectedUrineColor(undefined);
  };

  const handleSave = async () => {
    if (!selectedType) return;
    try {
      const streamStrength = selectedType === 'pee' && peeStream ? peeStream as StreamStrength : undefined;
      await createEntry(selectedType, notes, undefined, selectedUrineColor, streamStrength);
      setSelectedType(null);
      setNotes('');
      setPoopConsistency('');
      setPeeStream('');
      setSelectedUrineColor(undefined);
    } catch (err) {
      console.error('Failed to create entry:', err);
    }
  };

  const handleManualAdd = async (type: BathroomType) => {
    if (!addEntryHour || !addEntryMinute) return;
    let hours = parseInt(addEntryHour);
    const minutes = parseInt(addEntryMinute);
    // Convert 12-hour to 24-hour format
    if (addEntryAmPm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (addEntryAmPm === 'AM' && hours === 12) {
      hours = 0;
    }
    const entryDate = new Date(selectedDate + 'T00:00:00');
    entryDate.setHours(hours, minutes, 0, 0);

    try {
      const streamStrength = type === 'pee' && addEntryStream ? addEntryStream as StreamStrength : undefined;
      await createEntry(type, addEntryNotes, entryDate.getTime(), undefined, streamStrength);
      setAddDropdownOpen(false);
      setAddEntryType(null);
      setAddEntryHour('');
      setAddEntryMinute('');
      setAddEntryAmPm('AM');
      setAddEntryNotes('');
      setAddEntryConsistency('');
      setAddEntryStream('');
    } catch (err) {
      console.error('Failed to create entry:', err);
    }
  };

  const handleCancelManualAdd = () => {
    setAddDropdownOpen(false);
    setAddEntryType(null);
    setAddEntryHour('');
    setAddEntryMinute('');
    setAddEntryAmPm('AM');
    setAddEntryNotes('');
    setAddEntryConsistency('');
    setAddEntryStream('');
  };

  const handleCancel = () => {
    setSelectedType(null);
    setNotes('');
    setPoopConsistency('');
    setPeeStream('');
    setSelectedUrineColor(undefined);
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEntry(id);
    } catch (err) {
      console.error('Failed to delete entry:', err);
    }
  };

  // Water intake handlers
  const handleWaterLog = async () => {
    const amount = parseFloat(waterAmount);
    if (!amount || amount <= 0) return;
    try {
      await createWaterEntry(amount, waterUnit, waterNotes);
      setWaterAmount('');
      setWaterNotes('');
    } catch (err) {
      console.error('Failed to log water:', err);
    }
  };

  const handleWaterDelete = async (id: string) => {
    try {
      await deleteWaterEntry(id);
    } catch (err) {
      console.error('Failed to delete water entry:', err);
    }
  };

  const getWaterEntriesForDate = (dateStr: string) => {
    const dateStart = new Date(dateStr + 'T00:00:00').getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return waterEntries
      .filter((e) => e.timestamp >= dateStart && e.timestamp < dateEnd)
      .sort((a, b) => b.timestamp - a.timestamp); // Reverse chronological order (newest first)
  };

  const hasWaterEntriesOnDate = (dateStr: string): boolean => {
    const dateStart = new Date(dateStr + 'T00:00:00').getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return waterEntries.some((e) => e.timestamp >= dateStart && e.timestamp < dateEnd);
  };

  const hasEntriesOnDate = (dateStr: string): boolean => {
    const dateStart = new Date(dateStr + 'T00:00:00').getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return entries.some((e) => e.timestamp >= dateStart && e.timestamp < dateEnd);
  };

  const getEntriesForDate = (dateStr: string) => {
    const dateStart = new Date(dateStr + 'T00:00:00').getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return entries
      .filter((e) => e.timestamp >= dateStart && e.timestamp < dateEnd)
      .sort((a, b) => b.timestamp - a.timestamp); // Reverse chronological order (newest first)
  };

  const typeConfig = {
    poop: { bg: 'bg-cyan-100 dark:bg-cyan-900/30' },
    pee: { bg: 'bg-violet-100 dark:bg-violet-900/30' },
  };

  // Food journal handlers
  const handleFoodLog = async () => {
    const calories = parseInt(foodCalories);
    // Allow 0 calories for beverages, but not for other meal types
    if (isNaN(calories) || calories < 0 || (calories === 0 && foodMealType !== 'beverage')) return;

    // Parse time if provided, otherwise use current time
    let timestamp = Date.now();
    if (foodEntryHour && foodEntryMinute) {
      const now = new Date();
      let hours = parseInt(foodEntryHour);
      const minutes = parseInt(foodEntryMinute);

      // Convert to 24-hour format
      if (foodEntryAmPm === 'PM' && hours !== 12) {
        hours += 12;
      } else if (foodEntryAmPm === 'AM' && hours === 12) {
        hours = 0;
      }

      now.setHours(hours, minutes, 0, 0);
      timestamp = now.getTime();
    }

    try {
      const macroOptions = {
        carbs: foodCarbs ? parseInt(foodCarbs) : undefined,
        fat: foodFat ? parseInt(foodFat) : undefined,
        protein: foodProtein ? parseInt(foodProtein) : undefined,
      };
      await createFoodEntry(foodMealType, calories, foodNotes, timestamp, macroOptions);
      setFoodCalories('');
      setFoodCarbs('');
      setFoodFat('');
      setFoodProtein('');
      setFoodNotes('');
      setFoodEntryHour('');
      setFoodEntryMinute('');
    } catch (err) {
      console.error('Failed to log food entry:', err);
    }
  };

  const handleFoodDelete = async (id: string) => {
    try {
      await deleteFoodEntry(id);
    } catch (err) {
      console.error('Failed to delete food entry:', err);
    }
  };

  const handleFoodDuplicate = async (entry: { meal_type: MealType; calories: number; carbs?: number; fat?: number; protein?: number; notes?: string }) => {
    try {
      const macroOptions = {
        carbs: entry.carbs,
        fat: entry.fat,
        protein: entry.protein,
      };
      await createFoodEntry(entry.meal_type, entry.calories, entry.notes, undefined, macroOptions);
    } catch (err) {
      console.error('Failed to duplicate food entry:', err);
    }
  };

  // Barcode scanner handler
  const handleBarcodeProductFound = (product: { name: string; brand?: string; calories?: number; carbs?: number; fat?: number; protein?: number; servingSize?: string }) => {
    const productName = product.brand ? `${product.brand} ${product.name}` : product.name;
    const servingInfo = product.servingSize ? ` (${product.servingSize})` : '';

    if (barcodeScannerSource === 'food-history') {
      setFoodHistoryCalories(product.calories?.toString() || '');
      setFoodHistoryCarbs(product.carbs?.toString() || '');
      setFoodHistoryFat(product.fat?.toString() || '');
      setFoodHistoryProtein(product.protein?.toString() || '');
      setFoodHistoryNotes(productName + servingInfo);
    } else {
      setFoodCalories(product.calories?.toString() || '');
      setFoodCarbs(product.carbs?.toString() || '');
      setFoodFat(product.fat?.toString() || '');
      setFoodProtein(product.protein?.toString() || '');
      setFoodNotes(productName + servingInfo);
    }
  };

  // Save custom food from barcode scanner
  const handleSaveCustomFood = async (food: { name: string; brand?: string; barcode: string; calories?: number; carbs?: number; fat?: number; protein?: number; servingSize?: string }) => {
    if (!user) return;

    await createCustomFood(user.id, {
      name: food.name,
      brand: food.brand,
      barcode: food.barcode,
      calories: food.calories || 0,
      carbs: food.carbs,
      fat: food.fat,
      protein: food.protein,
      serving_size: food.servingSize,
    });
  };

  // Water history add handlers
  const handleWaterHistoryAdd = async () => {
    if (!waterHistoryAmount || !waterHistoryHour || !waterHistoryMinute) return;

    let hours = parseInt(waterHistoryHour);
    const minutes = parseInt(waterHistoryMinute);
    // Convert 12-hour to 24-hour format
    if (waterHistoryAmPm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (waterHistoryAmPm === 'AM' && hours === 12) {
      hours = 0;
    }

    const entryDate = new Date(waterSelectedDate + 'T00:00:00');
    entryDate.setHours(hours, minutes, 0, 0);

    try {
      await createWaterEntry(parseFloat(waterHistoryAmount), waterUnit, waterHistoryNotes, entryDate.getTime());
      handleWaterHistoryCancel();
    } catch (err) {
      console.error('Failed to add water entry:', err);
    }
  };

  const handleWaterHistoryCancel = () => {
    setWaterHistoryAddOpen(false);
    setWaterHistoryAmount('');
    setWaterHistoryNotes('');
    setWaterHistoryHour('');
    setWaterHistoryMinute('');
    setWaterHistoryAmPm('AM');
  };

  // Food history add handlers
  const handleFoodHistoryAdd = async () => {
    if (!foodHistoryCalories || !foodHistoryHour || !foodHistoryMinute) return;

    const calories = parseInt(foodHistoryCalories);
    // Allow 0 calories for beverages, but not for other meal types
    if (isNaN(calories) || calories < 0 || (calories === 0 && foodHistoryMealType !== 'beverage')) return;

    let hours = parseInt(foodHistoryHour);
    const minutes = parseInt(foodHistoryMinute);
    // Convert 12-hour to 24-hour format
    if (foodHistoryAmPm === 'PM' && hours !== 12) {
      hours += 12;
    } else if (foodHistoryAmPm === 'AM' && hours === 12) {
      hours = 0;
    }

    const entryDate = new Date(foodSelectedDate + 'T00:00:00');
    entryDate.setHours(hours, minutes, 0, 0);

    try {
      const macroOptions = {
        carbs: foodHistoryCarbs ? parseInt(foodHistoryCarbs) : undefined,
        fat: foodHistoryFat ? parseInt(foodHistoryFat) : undefined,
        protein: foodHistoryProtein ? parseInt(foodHistoryProtein) : undefined,
      };
      await createFoodEntry(foodHistoryMealType, calories, foodHistoryNotes, entryDate.getTime(), macroOptions);
      handleFoodHistoryCancel();
    } catch (err) {
      console.error('Failed to add food entry:', err);
    }
  };

  const handleFoodHistoryCancel = () => {
    setFoodHistoryAddOpen(false);
    setFoodHistoryMealType('breakfast');
    setFoodHistoryCalories('');
    setFoodHistoryCarbs('');
    setFoodHistoryFat('');
    setFoodHistoryProtein('');
    setFoodHistoryNotes('');
    setFoodHistoryHour('');
    setFoodHistoryMinute('');
    setFoodHistoryAmPm('AM');
  };

  const getFoodEntriesForDate = (dateStr: string) => {
    const dateStart = new Date(dateStr + 'T00:00:00').getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return foodEntries
      .filter((e) => e.timestamp >= dateStart && e.timestamp < dateEnd)
      .sort((a, b) => b.timestamp - a.timestamp); // Reverse chronological order (newest first)
  };

  const hasFoodEntriesOnDate = (dateStr: string): boolean => {
    const dateStart = new Date(dateStr + 'T00:00:00').getTime();
    const dateEnd = dateStart + 24 * 60 * 60 * 1000;
    return foodEntries.some((e) => e.timestamp >= dateStart && e.timestamp < dateEnd);
  };

  // FAQ View
  if (currentView === 'faq') {
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
          onNavigate={(view) => setCurrentView(view)}
          currentView="faq"
        />

        <DesktopNav
          currentView="faq"
          onNavigate={(view) => setCurrentView(view)}
          onOpenSettings={() => setMenuOpen(true)}
          gender={gender}
          avatarUrl={profile?.avatar_url}
          userName={profile?.first_name || undefined}
        />

        <header className={`lg:hidden sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => setCurrentView('potty')}
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

        <main className="mx-auto max-w-lg px-4 py-4 pb-24 lg:pb-4">
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

        <MobileBottomNav
          currentView="faq"
          onNavigate={(view) => setCurrentView(view)}
          onOpenMore={() => setMenuOpen(true)}
          gender={gender}
        />
      </div>
    );
  }

  // History View
  if (currentView === 'history') {
    const dayEntries = getEntriesForDate(selectedDate);

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => setCurrentView(view)}
          currentView="history"
        />

        <DesktopNav
          currentView="history"
          onNavigate={(view) => setCurrentView(view)}
          onOpenSettings={() => setMenuOpen(true)}
          gender={gender}
          avatarUrl={profile?.avatar_url}
          userName={profile?.first_name || undefined}
        />

        <header className={`lg:hidden sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => {
                setCurrentView('potty');
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

        <main className="mx-auto max-w-lg px-4 py-4 pb-24 lg:pb-4">
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
                            <SimpleDropletIcon className="h-7 w-7" />
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
                            <SimplePoopIcon className="h-7 w-7" />
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
                        <SimplePoopIcon className={`h-8 w-8 ${poopColor}`} />
                      ) : (
                        <SimpleDropletIcon className={`h-8 w-8 ${peeColor}`} />
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
                      <div className="flex gap-2">
                        {/* Hour */}
                        <select
                          value={addEntryHour}
                          onChange={(e) => setAddEntryHour(e.target.value)}
                          className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        >
                          <option value="">Hr</option>
                          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="flex items-center text-zinc-400 text-xl font-bold">:</span>
                        {/* Minute */}
                        <select
                          value={addEntryMinute}
                          onChange={(e) => setAddEntryMinute(e.target.value)}
                          className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        >
                          <option value="">Min</option>
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        {/* AM/PM */}
                        <select
                          value={addEntryAmPm}
                          onChange={(e) => setAddEntryAmPm(e.target.value as 'AM' | 'PM')}
                          className={`rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>

                    {/* Consistency Dropdown (for poop only) */}
                    {addEntryType === 'poop' && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Consistency</label>
                        <select
                          value={addEntryConsistency}
                          onChange={(e) => setAddEntryConsistency(e.target.value)}
                          className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        >
                          <option value="">Select consistency...</option>
                          <option value="hard-lumps">Hard lumps</option>
                          <option value="lumpy-sausage">Lumpy sausage</option>
                          <option value="cracked-sausage">Cracked sausage</option>
                          <option value="smooth-sausage">Smooth sausage</option>
                          <option value="soft-blobs">Soft blobs</option>
                          <option value="mushy-mass">Mushy</option>
                          <option value="liquid">Liquid</option>
                        </select>
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
                        <select
                          value={addEntryStream}
                          onChange={(e) => setAddEntryStream(e.target.value)}
                          className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-purple-500' : 'focus:border-blue-500'
                          }`}
                        >
                          <option value="">Select stream strength...</option>
                          <option value="strong">Strong</option>
                          <option value="normal">Normal</option>
                          <option value="weak">Weak</option>
                          <option value="intermittent">Intermittent</option>
                          <option value="dribbling">Dribbling</option>
                        </select>
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
                        disabled={!addEntryHour || !addEntryMinute}
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
                  <SimpleDropletIcon className={`h-5 w-5 ${peeColor}`} />
                  <span className={`font-medium ${peeColor}`}>Pee&apos;d</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {dayEntries.filter(e => e.type === 'pee').length}
                  </span>
                </div>
                <div className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 dark:bg-zinc-700/50">
                  <SimplePoopIcon className={`h-5 w-5 ${poopColor}`} />
                  <span className={`font-medium ${poopColor}`}>Poop&apos;d</span>
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {dayEntries.filter(e => e.type === 'poop').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </main>

        <MobileBottomNav
          currentView="history"
          onNavigate={(view) => setCurrentView(view)}
          onOpenMore={() => setMenuOpen(true)}
          gender={gender}
        />
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
            setCurrentView(view);
          }}
          currentView="potty"
        />

        <DesktopNav
          currentView="potty"
          onNavigate={(view) => {
            setSelectedType(null);
            setCurrentView(view);
          }}
          onOpenSettings={() => setMenuOpen(true)}
          gender={gender}
          avatarUrl={profile?.avatar_url}
          userName={profile?.first_name || undefined}
        />

        <header className={`lg:hidden sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
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

        <main className="mx-auto max-w-lg px-4 py-4 pb-24 lg:pb-4">
          <div className="space-y-4 pt-8">
            {selectedType === 'pee' && (
              <div className="flex flex-col items-center justify-center py-12 space-y-2">
                <p className={`text-5xl font-black bg-gradient-to-r ${headerGradient} bg-clip-text text-transparent`}>HOLY PISS!!</p>
                <p className="text-lg text-zinc-500 dark:text-zinc-400 italic">{randomPeeQuip}</p>
              </div>
            )}

            {selectedType === 'pee' && (
              <div className="space-y-4">
                {/* Urine Color Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 px-1">
                    Urine Color (Hydration Level)
                  </label>
                  <select
                    value={selectedUrineColor || ''}
                    onChange={(e) => setSelectedUrineColor(e.target.value ? Number(e.target.value) as UrineColor : undefined)}
                    autoFocus
                    className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                      gender === 'female' ? 'focus:border-purple-500' : 'focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select urine color...</option>
                    {URINE_COLORS.map((item) => (
                      <option key={item.level} value={item.level}>
                        {item.level}. {item.label} - {item.status}
                      </option>
                    ))}
                  </select>
                  {selectedUrineColor && (
                    <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className="w-8 h-8 rounded-full border-2 border-zinc-300 dark:border-zinc-600 flex-shrink-0"
                        style={{ backgroundColor: URINE_COLORS.find(c => c.level === selectedUrineColor)?.color }}
                      />
                      <p className={`text-sm font-medium ${
                        URINE_COLORS.find(c => c.level === selectedUrineColor)?.status === 'Hydrated' ? 'text-green-600 dark:text-green-400' :
                        URINE_COLORS.find(c => c.level === selectedUrineColor)?.status === 'Mildly Dehydrated' ? 'text-yellow-600 dark:text-yellow-400' :
                        URINE_COLORS.find(c => c.level === selectedUrineColor)?.status === 'Dehydrated' ? 'text-orange-600 dark:text-orange-400' :
                        'text-red-600 dark:text-red-400'
                      }`}>
                        {URINE_COLORS.find(c => c.level === selectedUrineColor)?.status}
                      </p>
                    </div>
                  )}
                </div>

                {/* Stream Strength Dropdown */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 px-1">
                    Stream Strength
                  </label>
                  <select
                    value={peeStream}
                    onChange={(e) => setPeeStream(e.target.value)}
                    className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                      gender === 'female' ? 'focus:border-purple-500' : 'focus:border-blue-500'
                    }`}
                  >
                    <option value="">Select stream strength...</option>
                    <option value="strong">Strong</option>
                    <option value="normal">Normal</option>
                    <option value="weak">Weak</option>
                    <option value="intermittent">Intermittent</option>
                    <option value="dribbling">Dribbling</option>
                  </select>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 px-4 min-h-[40px]">
                    {peeStream === 'strong' && "Forceful, steady stream. Good bladder pressure and pelvic floor function."}
                    {peeStream === 'normal' && "Comfortable, consistent flow. Healthy urination pattern."}
                    {peeStream === 'weak' && "Low pressure, takes longer. May indicate pelvic floor weakness or obstruction."}
                    {peeStream === 'intermittent' && "Stop-and-start stream. Could suggest bladder or prostate issues."}
                    {peeStream === 'dribbling' && "Slow drips, difficulty starting/stopping. Consider pelvic floor exercises."}
                    {!peeStream && "\u00A0"}
                  </p>
                </div>
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
                <select
                  value={poopConsistency}
                  onChange={(e) => setPoopConsistency(e.target.value)}
                  autoFocus
                  className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                    gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                  }`}
                >
                  <option value="">Select consistency...</option>
                  <option value="hard-lumps">Separate hard lumps</option>
                  <option value="lumpy-sausage">A lumpy, sausage-like clump</option>
                  <option value="cracked-sausage">A sausage shape with cracks</option>
                  <option value="smooth-sausage">Smooth sausage-shaped</option>
                  <option value="soft-blobs">Soft blobs with clear edges</option>
                  <option value="mushy-mass">A mushy, ragged mass</option>
                  <option value="liquid">Liquid</option>
                </select>
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

        <MobileBottomNav
          currentView="potty"
          onNavigate={(view) => {
            setSelectedType(null);
            setCurrentView(view);
          }}
          onOpenMore={() => setMenuOpen(true)}
          gender={gender}
        />
      </div>
    );
  }

  // Potty Logger View
  if (currentView === 'potty') {
    // Calculate today's stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStart = today.getTime();
    const todayEnd = todayStart + 24 * 60 * 60 * 1000;

    const todayEntries = entries.filter(e => e.timestamp >= todayStart && e.timestamp < todayEnd);
    const todayPoopCount = todayEntries.filter(e => e.type === 'poop').length;
    const todayPeeCount = todayEntries.filter(e => e.type === 'pee').length;

    // Get last log time
    const lastEntry = entries.length > 0 ? entries[0] : null;
    const getLastLogText = () => {
      if (!lastEntry) return 'No logs yet';
      const diff = Date.now() - lastEntry.timestamp;
      const minutes = Math.floor(diff / 60000);
      const hours = Math.floor(diff / 3600000);
      if (minutes < 1) return 'Just now';
      if (minutes < 60) return `${minutes}m ago`;
      if (hours < 24) return `${hours}h ago`;
      return new Date(lastEntry.timestamp).toLocaleDateString();
    };

    // Calculate streak (consecutive days with at least one poop)
    const calculateStreak = () => {
      let streak = 0;
      const checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      for (let i = 0; i < 30; i++) {
        const dayStart = checkDate.getTime();
        const dayEnd = dayStart + 24 * 60 * 60 * 1000;
        const hasPoopOnDay = entries.some(e => e.type === 'poop' && e.timestamp >= dayStart && e.timestamp < dayEnd);

        if (hasPoopOnDay) {
          streak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else if (i === 0) {
          // Today doesn't count against streak if no poop yet
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
      return streak;
    };
    const streak = calculateStreak();

    // Today's entries (newest first)
    const recentEntries = todayEntries.sort((a, b) => b.timestamp - a.timestamp);

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        {showMigration && (
          <MigrationPrompt onComplete={() => setShowMigration(false)} />
        )}

        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => setCurrentView(view)}
          currentView="potty"
        />

        <DesktopNav
          currentView="potty"
          onNavigate={(view) => setCurrentView(view)}
          onOpenSettings={() => setMenuOpen(true)}
          gender={gender}
          avatarUrl={profile?.avatar_url}
          userName={profile?.first_name || undefined}
        />

        <header className={`lg:hidden sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-1 text-white/90 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-light text-white">
              Potty Logger
            </h1>
            <div className="w-14" />
          </div>
        </header>

        <main className="mx-auto max-w-lg lg:max-w-5xl px-4 py-6 pb-24 lg:pb-6">
          {/* Desktop: Two-column layout, Mobile: Single column */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-6">
            {/* Left Column - Stats & Log Buttons */}
            <div className="space-y-4">
            {/* Today's Stats Card */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Today&apos;s Activity</h2>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                  gender === 'female'
                    ? 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400'
                    : 'bg-teal-100 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400'
                }`}>
                  {getLastLogText()}
                </span>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-3">
                {/* Poop Count */}
                <div className={`rounded-xl p-3 text-center ${
                  gender === 'female'
                    ? 'bg-pink-50 dark:bg-pink-900/20'
                    : 'bg-teal-50 dark:bg-teal-900/20'
                }`}>
                  <div className={`flex justify-center mb-1 ${
                    gender === 'female' ? 'text-pink-500 dark:text-pink-400' : 'text-teal-500 dark:text-teal-400'
                  }`}>
                    <PoopIcon className="w-10 h-10" />
                  </div>
                  <div className={`text-2xl font-black ${
                    gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'
                  }`}>{todayPoopCount}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">poops</div>
                </div>

                {/* Pee Count */}
                <div className={`rounded-xl p-3 text-center ${
                  gender === 'female'
                    ? 'bg-purple-50 dark:bg-purple-900/20'
                    : 'bg-blue-50 dark:bg-blue-900/20'
                }`}>
                  <div className={`flex justify-center mb-1 ${
                    gender === 'female' ? 'text-purple-500 dark:text-purple-400' : 'text-blue-500 dark:text-blue-400'
                  }`}>
                    <PeeIcon className="w-10 h-10" />
                  </div>
                  <div className={`text-2xl font-black ${
                    gender === 'female' ? 'text-purple-600 dark:text-purple-400' : 'text-blue-600 dark:text-blue-400'
                  }`}>{todayPeeCount}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">pees</div>
                </div>

                {/* Streak */}
                <div className="rounded-xl p-3 text-center bg-amber-50 dark:bg-amber-900/20">
                  <div className="flex justify-center mb-1 text-amber-500 dark:text-amber-400">
                    <Flame className="w-10 h-10" fill="currentColor" />
                  </div>
                  <div className="text-2xl font-black text-amber-600 dark:text-amber-400">{streak}</div>
                  <div className="text-xs text-zinc-500 dark:text-zinc-400">day streak</div>
                </div>
              </div>
            </div>

            {/* Side-by-side Log Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleSelect('poop')}
                className={`relative flex flex-col items-center justify-center rounded-2xl p-6 transition-all duration-150 active:scale-95 ${
                  gender === 'female'
                    ? 'bg-gradient-to-br from-pink-500 to-pink-600 active:from-pink-600 active:to-pink-700 shadow-lg shadow-pink-500/30'
                    : 'bg-gradient-to-br from-teal-500 to-teal-600 active:from-teal-600 active:to-teal-700 shadow-lg shadow-teal-500/30'
                }`}
              >
                <div className="text-white mb-2">
                  <PoopIcon className="w-16 h-16" />
                </div>
                <span className="text-white font-black text-xl tracking-tight">POOP&apos;D</span>
              </button>

              <button
                onClick={() => handleSelect('pee')}
                className={`relative flex flex-col items-center justify-center rounded-2xl p-6 transition-all duration-150 active:scale-95 ${
                  gender === 'female'
                    ? 'bg-gradient-to-br from-purple-500 to-purple-600 active:from-purple-600 active:to-purple-700 shadow-lg shadow-purple-500/30'
                    : 'bg-gradient-to-br from-blue-500 to-blue-600 active:from-blue-600 active:to-blue-700 shadow-lg shadow-blue-500/30'
                }`}
              >
                <div className="text-white mb-2">
                  <PeeIcon className="w-16 h-16" />
                </div>
                <span className="text-white font-black text-xl tracking-tight">PEE&apos;D</span>
              </button>
            </div>
            </div>

            {/* Right Column - Recent Entries */}
            <div className="space-y-4 mt-4 lg:mt-0">
            {/* Today's Entries */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400">Today&apos;s Entries</h2>
                <button
                  onClick={() => setCurrentView('history')}
                  className={`text-sm font-medium ${
                    gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'
                  }`}
                >
                  View History
                </button>
              </div>

              {recentEntries.length > 0 ? (
                <div className="space-y-2">
                  {recentEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          entry.type === 'poop'
                            ? gender === 'female'
                              ? 'bg-pink-100 text-pink-500 dark:bg-pink-900/30 dark:text-pink-400'
                              : 'bg-teal-100 text-teal-500 dark:bg-teal-900/30 dark:text-teal-400'
                            : gender === 'female'
                              ? 'bg-purple-100 text-purple-500 dark:bg-purple-900/30 dark:text-purple-400'
                              : 'bg-blue-100 text-blue-500 dark:bg-blue-900/30 dark:text-blue-400'
                        }`}>
                          {entry.type === 'poop' ? (
                            <PoopIcon className="w-6 h-6" />
                          ) : (
                            <PeeIcon className="w-6 h-6" />
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-zinc-800 dark:text-zinc-200 capitalize">
                              {entry.type === 'poop' ? 'Pooped' : 'Peed'}
                            </p>
                            {entry.type === 'pee' && entry.urine_color && (
                              <div
                                className="w-4 h-4 rounded-full border border-zinc-300 dark:border-zinc-600"
                                style={{ backgroundColor: URINE_COLORS.find(c => c.level === entry.urine_color)?.color }}
                                title={URINE_COLORS.find(c => c.level === entry.urine_color)?.status}
                              />
                            )}
                          </div>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(entry.timestamp).toLocaleString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit'
                            })}
                            {entry.type === 'pee' && entry.urine_color && (
                              <span className="ml-1">
                                · {URINE_COLORS.find(c => c.level === entry.urine_color)?.status}
                              </span>
                            )}
                            {entry.type === 'pee' && entry.stream_strength && (
                              <span className="ml-1">
                                · {entry.stream_strength.charAt(0).toUpperCase() + entry.stream_strength.slice(1)} stream
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 ${
                    gender === 'female'
                      ? 'bg-pink-100 text-pink-400 dark:bg-pink-900/30 dark:text-pink-500'
                      : 'bg-teal-100 text-teal-400 dark:bg-teal-900/30 dark:text-teal-500'
                  }`}>
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <p className="text-zinc-400 dark:text-zinc-500">No logs yet today</p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">Tap a button above to log!</p>
                </div>
              )}
            </div>
            </div>
          </div>
        </main>

        <MobileBottomNav
          currentView="potty"
          onNavigate={(view) => setCurrentView(view)}
          onOpenMore={() => setMenuOpen(true)}
          gender={gender}
        />
      </div>
    );
  }

  // Water Intake View
  if (currentView === 'water') {
    const todayTotal = getTodayTotal(waterUnit);
    const dailyGoal = waterUnit === 'oz' ? 64 : waterUnit === 'ml' ? 1893 : waterUnit === 'cups' ? 8 : 1.9; // 64 oz, 1893 ml, 8 cups, or 1.9L
    const progress = Math.min((todayTotal / dailyGoal) * 100, 100);

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => setCurrentView(view)}
          currentView="water"
        />

        <DesktopNav
          currentView="water"
          onNavigate={(view) => setCurrentView(view)}
          onOpenSettings={() => setMenuOpen(true)}
          gender={gender}
          avatarUrl={profile?.avatar_url}
          userName={profile?.first_name || undefined}
        />

        <header className={`lg:hidden sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-1 text-white/90 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-light text-white">
              Water Intake
            </h1>
            <div className="w-14" />
          </div>
        </header>

        <main className="mx-auto max-w-lg lg:max-w-5xl px-4 py-6 pb-24 lg:pb-6">
          {/* Desktop: Two-column layout, Mobile: Single column */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-6">
            {/* Left Column - Water Tank & Quick Add */}
            <div className="space-y-4">
            {/* Animated Water Tank */}
            <div className="rounded-2xl bg-gradient-to-b from-slate-100 to-slate-200 dark:from-zinc-800 dark:to-zinc-900 p-4 shadow-sm overflow-hidden relative z-0">
              {/* Water Tank Container */}
              <div className="relative h-48 rounded-xl bg-gradient-to-b from-slate-200/50 to-slate-300/50 dark:from-zinc-700/50 dark:to-zinc-800/50 border-4 border-slate-300 dark:border-zinc-600 overflow-hidden">
                {/* Tank inner shadow */}
                <div className="absolute inset-0 shadow-inner pointer-events-none z-[5]" />

                {/* Center Stats - BEHIND water */}
                <div className="absolute inset-0 flex flex-col items-center justify-center z-[1]">
                  <p className="text-5xl font-black text-cyan-600 dark:text-white">
                    {todayTotal.toFixed(1)}
                  </p>
                  <p className="text-lg font-bold text-cyan-500 dark:text-white/90">
                    {waterUnit}
                  </p>
                </div>

                {/* Water fill with wave animation - IN FRONT of numbers */}
                <div
                  className="absolute bottom-0 left-0 right-0 transition-all duration-1000 ease-out z-[2]"
                  style={{ height: `${progress}%` }}
                >
                  {/* Wave SVG */}
                  <svg
                    className="absolute -top-3 left-0 w-[200%] animate-[wave_3s_ease-in-out_infinite]"
                    viewBox="0 0 1200 40"
                    preserveAspectRatio="none"
                    style={{ height: '16px' }}
                  >
                    <path
                      d="M0 20 Q150 0 300 20 T600 20 T900 20 T1200 20 V40 H0 Z"
                      className="fill-cyan-400/80 dark:fill-cyan-500/80"
                    />
                  </svg>
                  <svg
                    className="absolute -top-2 left-0 w-[200%] animate-[wave_2.5s_ease-in-out_infinite_reverse]"
                    viewBox="0 0 1200 40"
                    preserveAspectRatio="none"
                    style={{ height: '12px', animationDelay: '-0.5s' }}
                  >
                    <path
                      d="M0 20 Q150 40 300 20 T600 20 T900 20 T1200 20 V40 H0 Z"
                      className="fill-cyan-500/60 dark:fill-cyan-400/60"
                    />
                  </svg>

                  {/* Water body - semi-transparent to see numbers through */}
                  <div className="absolute top-3 left-0 right-0 bottom-0 bg-gradient-to-b from-cyan-400/85 via-cyan-500/90 to-blue-600/95 dark:from-cyan-500/85 dark:via-cyan-600/90 dark:to-blue-700/95" />

                  {/* Bubbles */}
                  <div className="absolute inset-0 overflow-hidden">
                    <div className="absolute bottom-0 left-[10%] w-3 h-3 bg-white/40 rounded-full animate-[bubble_2s_ease-in_infinite]" style={{ animationDelay: '0s' }} />
                    <div className="absolute bottom-0 left-[25%] w-2 h-2 bg-white/30 rounded-full animate-[bubble_2.5s_ease-in_infinite]" style={{ animationDelay: '0.5s' }} />
                    <div className="absolute bottom-0 left-[45%] w-4 h-4 bg-white/30 rounded-full animate-[bubble_3s_ease-in_infinite]" style={{ animationDelay: '1s' }} />
                    <div className="absolute bottom-0 left-[65%] w-2 h-2 bg-white/40 rounded-full animate-[bubble_2.2s_ease-in_infinite]" style={{ animationDelay: '0.3s' }} />
                    <div className="absolute bottom-0 left-[80%] w-3 h-3 bg-white/30 rounded-full animate-[bubble_2.8s_ease-in_infinite]" style={{ animationDelay: '0.8s' }} />
                  </div>

                  {/* Shine effect */}
                  <div className="absolute top-4 left-2 w-2 h-16 bg-white/20 rounded-full blur-sm" />
                </div>

                {/* Measurement lines */}
                <div className="absolute inset-y-0 right-2 flex flex-col justify-between py-2 z-[3]">
                  {[100, 75, 50, 25, 0].map((mark) => (
                    <div key={mark} className="flex items-center gap-1">
                      <span className="text-[10px] font-semibold text-cyan-600 dark:text-white">{mark}%</span>
                      <div className="w-2 h-px bg-cyan-400 dark:bg-white/70" />
                    </div>
                  ))}
                </div>

                {/* Goal reached celebration */}
                {progress >= 100 && (
                  <div className="absolute inset-0 flex items-center justify-center z-[4] bg-cyan-500/20 backdrop-blur-sm">
                    <div className="text-center animate-bounce">
                      <span className="text-6xl">🎉</span>
                      <p className="text-white font-black text-xl drop-shadow-lg">HYDRATED!</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats below tank */}
              <div className="mt-3 flex items-center justify-between px-2">
                <div className="text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Goal</p>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">{dailyGoal} {waterUnit}</p>
                </div>
                <div className={`text-center px-4 py-1.5 rounded-full ${
                  progress >= 100
                    ? 'bg-green-100 dark:bg-green-900/30'
                    : 'bg-cyan-100 dark:bg-cyan-900/30'
                }`}>
                  <p className={`text-sm font-bold ${
                    progress >= 100
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-cyan-600 dark:text-cyan-400'
                  }`}>
                    {progress >= 100 ? '✓ Complete!' : `${progress.toFixed(0)}%`}
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">Remaining</p>
                  <p className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                    {progress >= 100 ? '0' : (dailyGoal - todayTotal).toFixed(1)} {waterUnit}
                  </p>
                </div>
              </div>
            </div>

            {/* Quick Add Bottles */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Tap to Hydrate!</p>
                <select
                  value={waterUnit}
                  onChange={(e) => setWaterUnit(e.target.value as WaterUnit)}
                  className={`rounded-lg border-2 border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                    gender === 'female' ? 'focus:border-pink-500 text-pink-600' : 'focus:border-teal-500 text-teal-600'
                  }`}
                >
                  <option value="oz">oz</option>
                  <option value="ml">ml</option>
                  <option value="cups">cups</option>
                  <option value="L">liters</option>
                </select>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { oz: 8, ml: 237, cups: 1, L: 0.24, label: 'SIP', fill: 25 },
                  { oz: 12, ml: 355, cups: 1.5, L: 0.35, label: 'GULP', fill: 50 },
                  { oz: 16, ml: 473, cups: 2, L: 0.47, label: 'CHUG', fill: 75 },
                  { oz: 20, ml: 591, cups: 2.5, L: 0.59, label: 'FLOOD', fill: 100 },
                ].map((option, index) => {
                  const amount = option[waterUnit as keyof typeof option];
                  const displayAmount = waterUnit === 'L' ? `${amount}L` : waterUnit === 'cups' ? `${amount}c` : `${amount}`;
                  return (
                  <button
                    key={index}
                    onClick={() => {
                      createWaterEntry(amount as number, waterUnit).catch(console.error);
                    }}
                    className="group flex flex-col items-center gap-1 rounded-2xl bg-gradient-to-b from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 p-3 transition-all duration-200 active:scale-95 hover:shadow-lg hover:shadow-cyan-500/20 border-2 border-cyan-200/50 dark:border-cyan-700/50 active:border-cyan-400 dark:active:border-cyan-500"
                  >
                    {/* Water Bottle SVG */}
                    <div className="relative w-12 h-16">
                      <svg viewBox="0 0 40 60" className="w-full h-full">
                        {/* Bottle outline */}
                        <defs>
                          <clipPath id={`bottle-clip-${index}`}>
                            <path d="M12 8 L12 12 Q4 14 4 22 L4 52 Q4 56 8 56 L32 56 Q36 56 36 52 L36 22 Q36 14 28 12 L28 8 Z" />
                          </clipPath>
                          <linearGradient id={`water-gradient-${index}`} x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#22d3ee" />
                            <stop offset="100%" stopColor="#0891b2" />
                          </linearGradient>
                        </defs>

                        {/* Bottle cap */}
                        <rect x="14" y="2" width="12" height="6" rx="2" className="fill-zinc-400 dark:fill-zinc-500" />

                        {/* Bottle body (empty) */}
                        <path
                          d="M12 8 L12 12 Q4 14 4 22 L4 52 Q4 56 8 56 L32 56 Q36 56 36 52 L36 22 Q36 14 28 12 L28 8 Z"
                          className="fill-cyan-100/50 dark:fill-cyan-900/30 stroke-cyan-300 dark:stroke-cyan-600"
                          strokeWidth="1.5"
                        />

                        {/* Water fill (animated on hover/active) */}
                        <g clipPath={`url(#bottle-clip-${index})`}>
                          <rect
                            x="4"
                            y={56 - (option.fill * 0.44)}
                            width="32"
                            height={option.fill * 0.44}
                            fill={`url(#water-gradient-${index})`}
                            className="transition-all duration-300 group-hover:opacity-100 group-active:opacity-100"
                            style={{ opacity: 0.7 }}
                          />
                          {/* Water wave effect */}
                          <ellipse
                            cx="20"
                            cy={56 - (option.fill * 0.44)}
                            rx="14"
                            ry="2"
                            className="fill-cyan-300/60 dark:fill-cyan-400/40 group-active:animate-pulse"
                          />
                        </g>

                        {/* Shine effect */}
                        <ellipse cx="12" cy="30" rx="3" ry="8" className="fill-white/30 dark:fill-white/10" />
                      </svg>

                      {/* Splash effect on active */}
                      <div className="absolute -top-1 -left-1 -right-1 opacity-0 group-active:opacity-100 transition-opacity">
                        <svg viewBox="0 0 50 20" className="w-full h-6">
                          <circle cx="10" cy="10" r="3" className="fill-cyan-400 animate-ping" style={{ animationDuration: '0.5s' }} />
                          <circle cx="25" cy="5" r="2" className="fill-cyan-300 animate-ping" style={{ animationDuration: '0.4s', animationDelay: '0.1s' }} />
                          <circle cx="40" cy="10" r="3" className="fill-cyan-400 animate-ping" style={{ animationDuration: '0.5s', animationDelay: '0.05s' }} />
                        </svg>
                      </div>
                    </div>

                    {/* Label */}
                    <span className="text-[10px] font-black text-cyan-600 dark:text-cyan-400 tracking-wide">
                      {option.label}
                    </span>
                    <span className="text-xs font-bold text-cyan-700 dark:text-cyan-300">
                      {displayAmount}
                    </span>
                  </button>
                  );
                })}
              </div>
            </div>
            </div>

            {/* Right Column - Custom Amount & Recent Entries */}
            <div className="space-y-4 mt-4 lg:mt-0">
            {/* Custom Amount */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Custom Amount</p>
                <span className={`text-sm font-medium ${gender === 'female' ? 'text-pink-600' : 'text-teal-600'}`}>
                  {waterUnit}
                </span>
              </div>
              <input
                type="number"
                value={waterAmount}
                onChange={(e) => setWaterAmount(e.target.value)}
                placeholder={`Amount in ${waterUnit}`}
                className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 mb-3 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                }`}
              />
              <textarea
                value={waterNotes}
                onChange={(e) => setWaterNotes(e.target.value)}
                placeholder="Notes (optional)..."
                className={`min-h-[80px] w-full resize-none rounded-xl border-2 border-zinc-200 bg-white p-4 text-base focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 mb-3 ${
                  gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                }`}
              />
              <button
                onClick={handleWaterLog}
                disabled={!waterAmount || parseFloat(waterAmount) <= 0}
                className={`w-full rounded-xl py-3 text-base font-semibold text-white transition-colors disabled:opacity-50 ${
                  gender === 'female'
                    ? 'bg-pink-500 hover:bg-pink-600 disabled:hover:bg-pink-500'
                    : 'bg-teal-500 hover:bg-teal-600 disabled:hover:bg-teal-500'
                }`}
              >
                Log Water
              </button>
            </div>

            {/* Today's Entries */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Today&apos;s Entries</p>
                <button
                  onClick={() => setCurrentView('water-history')}
                  className={`text-sm font-medium ${
                    gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'
                  }`}
                >
                  View History
                </button>
              </div>
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStart = today.getTime();
                const todayEnd = todayStart + 24 * 60 * 60 * 1000;
                const todayWaterEntries = waterEntries
                  .filter((e) => e.timestamp >= todayStart && e.timestamp < todayEnd)
                  .sort((a, b) => b.timestamp - a.timestamp); // Newest first
                return todayWaterEntries.length > 0 ? (
                <div className="space-y-2">
                  {todayWaterEntries.map((entry) => {
                    // Convert entry to selected unit
                    const toOz = (amount: number, unit: WaterUnit): number => {
                      switch (unit) {
                        case 'oz': return amount;
                        case 'ml': return amount / 29.5735;
                        case 'cups': return amount * 8;
                        case 'L': return amount * 33.814;
                        default: return amount;
                      }
                    };
                    const fromOz = (ozAmount: number, targetUnit: WaterUnit): number => {
                      switch (targetUnit) {
                        case 'oz': return ozAmount;
                        case 'ml': return ozAmount * 29.5735;
                        case 'cups': return ozAmount / 8;
                        case 'L': return ozAmount / 33.814;
                        default: return ozAmount;
                      }
                    };
                    const convertedAmount = fromOz(toOz(entry.amount, entry.unit), waterUnit);
                    const displayAmount = waterUnit === 'L' || waterUnit === 'cups' ? convertedAmount.toFixed(2) : Math.round(convertedAmount);

                    return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <svg className={`h-5 w-5 ${gender === 'female' ? 'text-pink-500' : 'text-teal-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537" />
                        </svg>
                        <div>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">
                            {displayAmount} {waterUnit}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleWaterDelete(entry.id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-center text-zinc-400 py-4">No entries yet. Start tracking!</p>
              );
              })()}
            </div>
            </div>
          </div>
        </main>

        <MobileBottomNav
          currentView="water"
          onNavigate={(view) => setCurrentView(view)}
          onOpenMore={() => setMenuOpen(true)}
          gender={gender}
        />
      </div>
    );
  }

  // Water History View
  if (currentView === 'water-history') {
    const dayWaterEntries = getWaterEntriesForDate(waterSelectedDate);
    // Convert any unit to oz (base unit), then to target unit
    const toOzLocal = (amount: number, unit: WaterUnit): number => {
      switch (unit) {
        case 'oz': return amount;
        case 'ml': return amount / 29.5735;
        case 'cups': return amount * 8;
        case 'L': return amount * 33.814;
        default: return amount;
      }
    };
    const fromOzLocal = (ozAmount: number, targetUnit: WaterUnit): number => {
      switch (targetUnit) {
        case 'oz': return ozAmount;
        case 'ml': return ozAmount * 29.5735;
        case 'cups': return ozAmount / 8;
        case 'L': return ozAmount / 33.814;
        default: return ozAmount;
      }
    };
    const dayTotal = dayWaterEntries.reduce((total, entry) => {
      const ozAmount = toOzLocal(entry.amount, entry.unit);
      return total + fromOzLocal(ozAmount, waterUnit);
    }, 0);

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => setCurrentView(view)}
          currentView="water-history"
        />

        <DesktopNav
          currentView="water-history"
          onNavigate={(view) => setCurrentView(view)}
          onOpenSettings={() => setMenuOpen(true)}
          gender={gender}
          avatarUrl={profile?.avatar_url}
          userName={profile?.first_name || undefined}
        />

        <header className={`lg:hidden sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => setCurrentView('water')}
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

        <main className="mx-auto max-w-lg px-4 py-4 pb-24 lg:pb-4">
          <div className="space-y-4">
            {/* Calendar */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <Calendar
                selectedDate={waterSelectedDate}
                onSelectDate={setWaterSelectedDate}
                hasEntries={hasWaterEntriesOnDate}
              />
            </div>

            {/* Entries for selected day */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatDateHeader(waterSelectedDate)}
                </h2>
                {!waterHistoryAddOpen && (
                  <button
                    onClick={() => setWaterHistoryAddOpen(true)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold transition-colors ${
                      gender === 'female'
                        ? 'bg-pink-100 text-pink-700 active:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400'
                        : 'bg-teal-100 text-teal-700 active:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-400'
                    }`}
                  >
                    + Add
                  </button>
                )}
              </div>

              {/* Add Water Form */}
              {waterHistoryAddOpen && (
                <div className="mb-4 rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className={`h-8 w-8 ${gender === 'female' ? 'text-pink-500' : 'text-teal-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537" />
                      </svg>
                      <span className={`text-xl font-bold ${gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'}`}>
                        Add Water
                      </span>
                    </div>
                    <button
                      onClick={handleWaterHistoryCancel}
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
                      <div className="flex gap-2">
                        <select
                          value={waterHistoryHour}
                          onChange={(e) => setWaterHistoryHour(e.target.value)}
                          className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        >
                          <option value="">Hr</option>
                          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="flex items-center text-zinc-400 text-xl font-bold">:</span>
                        <select
                          value={waterHistoryMinute}
                          onChange={(e) => setWaterHistoryMinute(e.target.value)}
                          className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        >
                          <option value="">Min</option>
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          value={waterHistoryAmPm}
                          onChange={(e) => setWaterHistoryAmPm(e.target.value as 'AM' | 'PM')}
                          className={`rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>

                    {/* Amount Input */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Amount</label>
                      <input
                        type="number"
                        value={waterHistoryAmount}
                        onChange={(e) => setWaterHistoryAmount(e.target.value)}
                        placeholder={`Amount in ${waterUnit}`}
                        className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                          gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                        }`}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Notes</label>
                      <textarea
                        value={waterHistoryNotes}
                        onChange={(e) => setWaterHistoryNotes(e.target.value)}
                        placeholder="Optional notes..."
                        className={`min-h-[100px] w-full resize-none rounded-xl border-2 border-zinc-200 bg-white p-4 text-base leading-relaxed focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${
                          gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                        }`}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleWaterHistoryCancel}
                        className="flex-1 cursor-pointer rounded-xl bg-zinc-200 py-3 text-base font-medium text-zinc-700 active:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:active:bg-zinc-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleWaterHistoryAdd}
                        disabled={!waterHistoryAmount || !waterHistoryHour || !waterHistoryMinute}
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

              {dayWaterEntries.length > 0 ? (
                <div className="space-y-2">
                  {dayWaterEntries.map((entry) => {
                    const convertedAmount = fromOzLocal(toOzLocal(entry.amount, entry.unit), waterUnit);
                    const displayAmount = waterUnit === 'L' || waterUnit === 'cups' ? convertedAmount.toFixed(2) : Math.round(convertedAmount);

                    return (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-700/50"
                    >
                      <div className="flex items-center gap-3">
                        <svg className={`h-5 w-5 ${gender === 'female' ? 'text-pink-500' : 'text-teal-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537" />
                        </svg>
                        <div>
                          <p className="font-medium text-zinc-800 dark:text-zinc-200">
                            {displayAmount} {waterUnit}
                          </p>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            {entry.notes && ` • ${entry.notes}`}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleWaterDelete(entry.id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-4 text-center text-zinc-400">No entries</p>
              )}

              {/* Daily Summary */}
              <div className={`flex items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 dark:bg-zinc-700/50 ${dayWaterEntries.length > 0 ? 'mt-4' : 'mt-2'}`}>
                <svg className={`h-5 w-5 ${gender === 'female' ? 'text-pink-500' : 'text-teal-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537" />
                </svg>
                <span className={`font-medium ${gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'}`}>Total</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {dayTotal.toFixed(1)} {waterUnit}
                </span>
              </div>
            </div>
          </div>
        </main>

        <MobileBottomNav
          currentView="water-history"
          onNavigate={(view) => setCurrentView(view)}
          onOpenMore={() => setMenuOpen(true)}
          gender={gender}
        />
      </div>
    );
  }

  // Water FAQ View
  if (currentView === 'water-faq') {
    const hydrationFaqs: { question: string; answer: string }[] = gender === 'female' ? [
      {
        question: "How much water should I drink daily?",
        answer: "Women should aim for about 11.5 cups (2.7 liters) of fluids daily from all beverages and foods. However, needs vary based on activity level, climate, pregnancy, and breastfeeding. During pregnancy, aim for about 10 cups, and while breastfeeding, about 13 cups."
      },
      {
        question: "Does water intake affect my menstrual cycle?",
        answer: "Yes! Staying hydrated can help reduce bloating, cramps, and fatigue during your period. Dehydration can worsen PMS symptoms and headaches. Many women need extra fluids during menstruation due to blood loss."
      },
      {
        question: "How does hydration affect my skin?",
        answer: "Proper hydration helps maintain skin elasticity, reduces the appearance of fine lines, and gives skin a healthy glow. While water alone won't cure skin issues, chronic dehydration can make skin look dull and more prone to wrinkles."
      },
      {
        question: "Can drinking water help with weight management?",
        answer: "Yes! Drinking water before meals can help you feel fuller and eat less. Water also boosts metabolism slightly and helps your body burn calories more efficiently. Replace sugary drinks with water for best results."
      },
      {
        question: "Why do I need to pee so often when I drink more water?",
        answer: "Frequent urination when increasing water intake is normal as your body adjusts. Your bladder will adapt over time. However, if you're going more than 8-10 times daily or waking multiple times at night, consult a doctor."
      },
      {
        question: "Does caffeine count toward my water intake?",
        answer: "Caffeinated beverages do contribute to hydration, though caffeine has a mild diuretic effect. Moderate coffee and tea consumption (3-4 cups daily) can count toward your fluid intake, but water remains the best choice."
      },
      {
        question: "How do I know if I'm dehydrated?",
        answer: "Signs include dark yellow urine, thirst, dry mouth, fatigue, headache, and dizziness. Women may also notice dry skin, chapped lips, and decreased skin elasticity. Check your urine color - pale yellow indicates good hydration."
      },
      {
        question: "Should I drink more water during pregnancy?",
        answer: "Absolutely! Water is crucial for forming amniotic fluid, producing extra blood volume, building new tissue, carrying nutrients, and preventing constipation and UTIs - common pregnancy issues. Aim for at least 10 cups daily."
      },
      {
        question: "Does hydration affect UTI risk?",
        answer: "Yes! Women are more prone to UTIs, and staying well-hydrated helps flush bacteria from the urinary tract. Drinking plenty of water and urinating frequently can significantly reduce UTI risk."
      },
      {
        question: "What's the best time to drink water?",
        answer: "Drink water throughout the day rather than large amounts at once. Start your morning with a glass, drink before meals, and sip during exercise. Reduce intake 1-2 hours before bed to avoid disrupting sleep."
      },
    ] : [
      {
        question: "How much water should I drink daily?",
        answer: "Men should aim for about 15.5 cups (3.7 liters) of fluids daily from all beverages and foods. However, needs increase with physical activity, hot weather, and certain health conditions. Athletes may need significantly more."
      },
      {
        question: "Does hydration affect muscle performance?",
        answer: "Absolutely! Even mild dehydration (2% body weight loss) can significantly impair physical performance, strength, and power. Muscles are about 75% water, and dehydration leads to fatigue, reduced endurance, and increased injury risk."
      },
      {
        question: "How does water intake affect testosterone?",
        answer: "Dehydration can temporarily lower testosterone levels and increase cortisol (stress hormone). Staying hydrated supports optimal hormone function, which is important for muscle building, energy, and overall male health."
      },
      {
        question: "Can drinking water help with weight management?",
        answer: "Yes! Drinking water before meals can help you feel fuller and eat less. Water also boosts metabolism slightly and helps your body burn calories more efficiently. Replace sugary drinks with water for best results."
      },
      {
        question: "Why do I need to pee so often when I drink more water?",
        answer: "Frequent urination when increasing water intake is normal as your body adjusts. If you're over 50 and experiencing frequent nighttime urination or weak stream, it could indicate prostate issues worth discussing with a doctor."
      },
      {
        question: "Does caffeine count toward my water intake?",
        answer: "Caffeinated beverages do contribute to hydration, though caffeine has a mild diuretic effect. Moderate coffee and tea consumption (3-4 cups daily) can count toward your fluid intake, but water remains the best choice."
      },
      {
        question: "How do I know if I'm dehydrated?",
        answer: "Signs include dark yellow urine, thirst, dry mouth, fatigue, headache, and dizziness. During exercise, watch for muscle cramps and decreased performance. Check your urine color - pale yellow indicates good hydration."
      },
      {
        question: "How much extra water do I need when exercising?",
        answer: "Drink 17-20 oz 2-3 hours before exercise, 8 oz every 15-20 minutes during exercise, and 16-24 oz for every pound lost after exercise. For intense workouts over an hour, consider electrolyte drinks."
      },
      {
        question: "Does alcohol affect hydration?",
        answer: "Yes, alcohol is a diuretic that increases urine production. For every alcoholic drink, your body can eliminate up to 4x that amount in water. Alternate alcoholic drinks with water and hydrate well before and after drinking."
      },
      {
        question: "What's the best time to drink water?",
        answer: "Drink water throughout the day rather than large amounts at once. Start your morning with a glass, drink before meals, and sip during exercise. Reduce intake 1-2 hours before bed to avoid disrupting sleep."
      },
    ];

    const fuse = new Fuse(hydrationFaqs, {
      keys: ['question', 'answer'],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
    });

    const currentWaterFaqs = waterFaqSearch.trim()
      ? fuse.search(waterFaqSearch).map(result => result.item)
      : hydrationFaqs;

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => setCurrentView(view)}
          currentView="water-faq"
        />

        <DesktopNav
          currentView="water-faq"
          onNavigate={(view) => setCurrentView(view)}
          onOpenSettings={() => setMenuOpen(true)}
          gender={gender}
          avatarUrl={profile?.avatar_url}
          userName={profile?.first_name || undefined}
        />

        <header className={`lg:hidden sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => setCurrentView('water')}
              className="flex items-center gap-1 text-white/90 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-light text-white">
              Hydration FAQs
            </h1>
            <div className="w-14" />
          </div>
        </header>

        <main className="mx-auto max-w-lg px-4 py-4 pb-24 lg:pb-4">
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
              value={waterFaqSearch}
              onChange={(e) => setWaterFaqSearch(e.target.value)}
              placeholder="Search hydration FAQs..."
              className={`w-full rounded-xl border-2 border-zinc-200 bg-white py-3 pl-12 pr-4 text-base focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${
                gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
              }`}
            />
            {waterFaqSearch && (
              <button
                onClick={() => setWaterFaqSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>

          {/* Info Card */}
          <div className={`rounded-2xl p-4 mb-4 ${gender === 'female' ? 'bg-cyan-50 dark:bg-cyan-900/20' : 'bg-cyan-50 dark:bg-cyan-900/20'}`}>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-cyan-500 flex items-center justify-center">
                <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-cyan-900 dark:text-cyan-100">Stay Hydrated!</p>
                <p className="text-sm text-cyan-700 dark:text-cyan-300">
                  {gender === 'female' ? 'Aim for ~92 oz / 11.5 cups (2.7L) daily' : 'Aim for ~125 oz / 15.5 cups (3.7L) daily'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {currentWaterFaqs.length === 0 ? (
              <div className="rounded-2xl bg-white p-8 text-center shadow-sm dark:bg-zinc-800">
                <p className="text-zinc-500 dark:text-zinc-400">No FAQs match your search.</p>
              </div>
            ) : currentWaterFaqs.map((faq, index) => (
              <div key={index} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
                <h3 className={`font-semibold bg-gradient-to-r ${headerGradient} bg-clip-text text-transparent`}>
                  {faq.question}
                </h3>
                <p className="mt-2 text-zinc-600 dark:text-zinc-400">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </main>

        <MobileBottomNav
          currentView="water-faq"
          onNavigate={(view) => setCurrentView(view)}
          onOpenMore={() => setMenuOpen(true)}
          gender={gender}
        />
      </div>
    );
  }

  // Food Journal View
  if (currentView === 'food') {
    const todayCalories = getTodayCalories();
    const calorieGoal = dietaryNeeds.dailyCalories;
    const progress = Math.min((todayCalories / calorieGoal) * 100, 100);
    const caloriesByMeal = getTodayCaloriesByMeal();

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => setCurrentView(view)}
          currentView="food"
        />

        <DesktopNav
          currentView="food"
          onNavigate={(view) => setCurrentView(view)}
          onOpenSettings={() => setMenuOpen(true)}
          gender={gender}
          avatarUrl={profile?.avatar_url}
          userName={profile?.first_name || undefined}
        />

        <header className={`lg:hidden sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => setCurrentView('home')}
              className="flex items-center gap-1 text-white/90 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-light text-white">
              Food Journal
            </h1>
            <div className="w-14" />
          </div>
        </header>

        <main className="mx-auto max-w-lg lg:max-w-5xl px-4 py-6 pb-24 lg:pb-6">
          {/* Desktop: Two-column layout, Mobile: Single column */}
          <div className="lg:grid lg:grid-cols-2 lg:gap-6">
            {/* Left Column - Progress & Log Form */}
            <div className="space-y-4">
              {/* Progress Card */}
              <div className="rounded-2xl bg-white p-6 shadow-sm dark:bg-zinc-800">
                <div className="text-center mb-4">
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-1">Today&apos;s Calories</p>
                  <p className={`text-4xl font-bold bg-gradient-to-r ${headerGradient} bg-clip-text text-transparent`}>
                    {todayCalories}
                  </p>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    of {calorieGoal} cal goal
                  </p>
                </div>

                {/* Progress Bar */}
                <div className="h-4 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${headerGradient} transition-all duration-500`}
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-center text-sm text-zinc-500 dark:text-zinc-400 mt-2">
                  {progress >= 100 ? '🎯 Goal reached!' : `${calorieGoal - todayCalories} cal remaining`}
                </p>
              </div>

              {/* Log New Entry */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400 mb-3">Log Food Entry</p>

              {/* Meal Type Selection with Calorie Counts */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                {(['breakfast', 'lunch', 'dinner', 'snack', 'beverage', 'dessert'] as const).map((meal) => (
                  <button
                    key={meal}
                    onClick={() => setFoodMealType(meal)}
                    className={`rounded-xl py-2 text-xs font-medium transition-colors flex flex-col items-center ${
                      foodMealType === meal
                        ? gender === 'female'
                          ? 'bg-pink-500'
                          : 'bg-teal-500'
                        : 'bg-zinc-100 dark:bg-zinc-700'
                    }`}
                  >
                    <span className={`capitalize ${
                      foodMealType === meal
                        ? 'text-white'
                        : gender === 'female'
                          ? 'text-pink-500 dark:text-pink-400'
                          : 'text-teal-500 dark:text-teal-400'
                    }`}>{meal}</span>
                    <span className={`text-[10px] ${
                      foodMealType === meal
                        ? 'text-white/80'
                        : 'text-zinc-400 dark:text-zinc-500'
                    }`}>
                      {caloriesByMeal[meal]} cal
                    </span>
                  </button>
                ))}
              </div>

              {/* Time Selection */}
              <div className="mb-4">
                <label className="text-xs text-zinc-500 dark:text-zinc-400 mb-1.5 block">Time (optional)</label>
                <div className="flex gap-2">
                  <select
                    value={foodEntryHour}
                    onChange={(e) => setFoodEntryHour(e.target.value)}
                    className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                      gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                    }`}
                  >
                    <option value="">Hour</option>
                    {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                  <select
                    value={foodEntryMinute}
                    onChange={(e) => setFoodEntryMinute(e.target.value)}
                    className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                      gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                    }`}
                  >
                    <option value="">Min</option>
                    {['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'].map((m) => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                  <select
                    value={foodEntryAmPm}
                    onChange={(e) => setFoodEntryAmPm(e.target.value as 'AM' | 'PM')}
                    className={`w-20 rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                      gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                    }`}
                  >
                    <option value="AM">AM</option>
                    <option value="PM">PM</option>
                  </select>
                </div>
              </div>

              {/* Calories Input with AI Button */}
              <div className="flex gap-2 mb-3">
                <input
                  type="number"
                  value={foodCalories}
                  onChange={(e) => setFoodCalories(e.target.value)}
                  placeholder="Estimated calories"
                  className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => {
                    setBarcodeScannerSource('food');
                    setBarcodeScannerOpen(true);
                  }}
                  className={`px-3 rounded-xl font-semibold text-white transition-all active:scale-95 flex items-center gap-1 ${
                    gender === 'female'
                      ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                      : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                  }`}
                  title="Scan barcode"
                >
                  <ScanBarcode className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCalorieAISource('food');
                    setCalorieAIModalOpen(true);
                  }}
                  className={`px-4 rounded-xl font-semibold text-white transition-all active:scale-95 flex items-center gap-2 ${
                    gender === 'female'
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                      : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600'
                  }`}
                  title="Ask AI for calorie estimate"
                >
                  <Sparkles className="w-5 h-5" />
                  <span className="hidden sm:inline">AI</span>
                </button>
              </div>

              {/* Macros Input Row */}
              <div className="flex gap-2 mb-3">
                <div className="flex-1">
                  <input
                    type="number"
                    value={foodCarbs}
                    onChange={(e) => setFoodCarbs(e.target.value)}
                    placeholder="Carbs (g)"
                    className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={foodFat}
                    onChange={(e) => setFoodFat(e.target.value)}
                    placeholder="Fat (g)"
                    className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <input
                    type="number"
                    value={foodProtein}
                    onChange={(e) => setFoodProtein(e.target.value)}
                    placeholder="Protein (g)"
                    className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-3 py-2.5 text-sm focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                      gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                    }`}
                  />
                </div>
              </div>

              {/* Notes */}
              <textarea
                value={foodNotes}
                onChange={(e) => setFoodNotes(e.target.value)}
                placeholder="What did you eat? (optional)"
                className={`min-h-[80px] w-full resize-none rounded-xl border-2 border-zinc-200 bg-white p-4 text-base focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 mb-3 ${
                  gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                }`}
              />

              <button
                onClick={handleFoodLog}
                disabled={!foodCalories || (parseInt(foodCalories) <= 0 && foodMealType !== 'beverage') || (parseInt(foodCalories) < 0)}
                className={`w-full rounded-xl py-3 text-base font-semibold text-white transition-colors disabled:opacity-50 ${
                  gender === 'female'
                    ? 'bg-pink-500 hover:bg-pink-600 disabled:hover:bg-pink-500'
                    : 'bg-teal-500 hover:bg-teal-600 disabled:hover:bg-teal-500'
                }`}
              >
                Log Food
              </button>
            </div>
            </div>

            {/* Right Column - Entries & Targets */}
            <div className="space-y-4 mt-4 lg:mt-0">
            {/* Today's Entries */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">Today&apos;s Entries</p>
                <button
                  onClick={() => setCurrentView('food-history')}
                  className={`text-sm font-medium ${
                    gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'
                  }`}
                >
                  View History
                </button>
              </div>
              {(() => {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const todayStart = today.getTime();
                const todayEnd = todayStart + 24 * 60 * 60 * 1000;
                const todayFoodEntries = foodEntries
                  .filter((e) => e.timestamp >= todayStart && e.timestamp < todayEnd)
                  .sort((a, b) => b.timestamp - a.timestamp); // Reverse chronological order (newest first)
                return todayFoodEntries.length > 0 ? (
                <div className="space-y-2">
                  {todayFoodEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-700/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          gender === 'female' ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-teal-100 dark:bg-teal-900/30'
                        }`}>
                          <svg className={`h-4 w-4 ${gender === 'female' ? 'text-pink-500' : 'text-teal-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M7 4v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
                            <path d="M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0" />
                            <path d="M17 12v9" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-800 dark:text-zinc-200 capitalize truncate">
                            {getMealTypeLabel(entry.meal_type)} - {entry.calories} cal
                          </p>
                          {(entry.carbs !== undefined || entry.fat !== undefined || entry.protein !== undefined) && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-300">
                              {entry.carbs !== undefined && <span className="text-green-600 dark:text-green-400">C: {entry.carbs}g</span>}
                              {entry.carbs !== undefined && (entry.fat !== undefined || entry.protein !== undefined) && ' • '}
                              {entry.fat !== undefined && <span className="text-yellow-600 dark:text-yellow-400">F: {entry.fat}g</span>}
                              {entry.fat !== undefined && entry.protein !== undefined && ' • '}
                              {entry.protein !== undefined && <span className="text-purple-600 dark:text-purple-400">P: {entry.protein}g</span>}
                            </p>
                          )}
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            {entry.notes && ` • ${entry.notes.substring(0, 30)}${entry.notes.length > 30 ? '...' : ''}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleFoodDuplicate(entry)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            gender === 'female'
                              ? 'text-zinc-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                              : 'text-zinc-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                          }`}
                          title="Duplicate entry"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleFoodDelete(entry.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete entry"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-zinc-400">No entries yet today</p>
              );
              })()}
            </div>

            {/* Dietary Info Card */}
            <div className={`rounded-2xl p-4 shadow-sm ${
              gender === 'female' ? 'bg-pink-50 dark:bg-pink-900/20' : 'bg-teal-50 dark:bg-teal-900/20'
            }`}>
              <p className={`text-sm font-medium mb-2 ${
                gender === 'female' ? 'text-pink-700 dark:text-pink-300' : 'text-teal-700 dark:text-teal-300'
              }`}>Your Daily Targets</p>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Calories:</span>
                  <span className={`font-medium ${gender === 'female' ? 'text-pink-700 dark:text-pink-300' : 'text-teal-700 dark:text-teal-300'}`}>
                    {dietaryNeeds.dailyCalories}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Protein:</span>
                  <span className={`font-medium ${gender === 'female' ? 'text-pink-700 dark:text-pink-300' : 'text-teal-700 dark:text-teal-300'}`}>
                    {dietaryNeeds.protein}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Carbs:</span>
                  <span className={`font-medium ${gender === 'female' ? 'text-pink-700 dark:text-pink-300' : 'text-teal-700 dark:text-teal-300'}`}>
                    {dietaryNeeds.carbs}g
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-400">Fat:</span>
                  <span className={`font-medium ${gender === 'female' ? 'text-pink-700 dark:text-pink-300' : 'text-teal-700 dark:text-teal-300'}`}>
                    {dietaryNeeds.fat}g
                  </span>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('food-faq')}
                className={`mt-3 text-xs font-medium ${
                  gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'
                }`}
              >
                View Dietary FAQs →
              </button>
            </div>
            </div>
          </div>
        </main>

        <MobileBottomNav
          currentView="food"
          onNavigate={(view) => setCurrentView(view)}
          onOpenMore={() => setMenuOpen(true)}
          gender={gender}
        />

        {/* Calorie AI Modal */}
        <CalorieAIModal
          isOpen={calorieAIModalOpen}
          onClose={() => setCalorieAIModalOpen(false)}
          onSelectCalories={(calories, foodDescription) => {
            if (calorieAISource === 'food-history') {
              setFoodHistoryCalories(calories.toString());
              if (foodDescription) {
                setFoodHistoryNotes(foodDescription);
              }
            } else {
              setFoodCalories(calories.toString());
              if (foodDescription) {
                setFoodNotes(foodDescription);
              }
            }
          }}
          gender={gender}
        />

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={barcodeScannerOpen}
          onClose={() => setBarcodeScannerOpen(false)}
          onProductFound={handleBarcodeProductFound}
          onSaveCustomFood={handleSaveCustomFood}
          userId={user?.id}
          gender={gender}
        />
      </div>
    );
  }

  // Food History View
  if (currentView === 'food-history') {
    const dayFoodEntries = getFoodEntriesForDate(foodSelectedDate);
    const dayTotal = dayFoodEntries.reduce((sum, e) => sum + e.calories, 0);

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => setCurrentView(view)}
          currentView="food-history"
        />

        <DesktopNav
          currentView="food-history"
          onNavigate={(view) => setCurrentView(view)}
          onOpenSettings={() => setMenuOpen(true)}
          gender={gender}
          avatarUrl={profile?.avatar_url}
          userName={profile?.first_name || undefined}
        />

        <header className={`lg:hidden sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => setCurrentView('food')}
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

        <main className="mx-auto max-w-lg px-4 py-4 pb-24 lg:pb-4">
          <div className="space-y-4">
            {/* Calendar */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <Calendar
                selectedDate={foodSelectedDate}
                onSelectDate={setFoodSelectedDate}
                hasEntries={hasFoodEntriesOnDate}
              />
            </div>

            {/* Entries for selected day */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-zinc-800 dark:text-zinc-200">
                  {formatDateHeader(foodSelectedDate)}
                </h2>
                {!foodHistoryAddOpen && (
                  <button
                    onClick={() => setFoodHistoryAddOpen(true)}
                    className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-base font-semibold transition-colors ${
                      gender === 'female'
                        ? 'bg-pink-100 text-pink-700 active:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400'
                        : 'bg-teal-100 text-teal-700 active:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-400'
                    }`}
                  >
                    + Add
                  </button>
                )}
              </div>

              {/* Add Food Form */}
              {foodHistoryAddOpen && (
                <div className="mb-4 rounded-2xl border-2 border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-700 dark:bg-zinc-900 overflow-hidden">
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <svg className={`h-8 w-8 ${gender === 'female' ? 'text-pink-500' : 'text-teal-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path d="M7 4v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
                        <path d="M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0" />
                        <path d="M17 12v9" />
                      </svg>
                      <span className={`text-xl font-bold ${gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'}`}>
                        Add Food
                      </span>
                    </div>
                    <button
                      onClick={handleFoodHistoryCancel}
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
                      <div className="flex gap-2">
                        <select
                          value={foodHistoryHour}
                          onChange={(e) => setFoodHistoryHour(e.target.value)}
                          className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        >
                          <option value="">Hr</option>
                          {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((h) => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <span className="flex items-center text-zinc-400 text-xl font-bold">:</span>
                        <select
                          value={foodHistoryMinute}
                          onChange={(e) => setFoodHistoryMinute(e.target.value)}
                          className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        >
                          <option value="">Min</option>
                          {Array.from({ length: 60 }, (_, i) => (
                            <option key={i} value={i}>{i.toString().padStart(2, '0')}</option>
                          ))}
                        </select>
                        <select
                          value={foodHistoryAmPm}
                          onChange={(e) => setFoodHistoryAmPm(e.target.value as 'AM' | 'PM')}
                          className={`rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        >
                          <option value="AM">AM</option>
                          <option value="PM">PM</option>
                        </select>
                      </div>
                    </div>

                    {/* Meal Type */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Meal Type</label>
                      <select
                        value={foodHistoryMealType}
                        onChange={(e) => setFoodHistoryMealType(e.target.value as MealType)}
                        className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                          gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                        }`}
                      >
                        <option value="breakfast">Breakfast</option>
                        <option value="lunch">Lunch</option>
                        <option value="dinner">Dinner</option>
                        <option value="snack">Snack</option>
                        <option value="beverage">Beverage</option>
                        <option value="dessert">Dessert</option>
                      </select>
                    </div>

                    {/* Calories Input with AI Button */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Calories</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={foodHistoryCalories}
                          onChange={(e) => setFoodHistoryCalories(e.target.value)}
                          placeholder="Estimated calories"
                          className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setBarcodeScannerSource('food-history');
                            setBarcodeScannerOpen(true);
                          }}
                          className={`px-3 rounded-xl font-semibold text-white transition-all active:scale-95 flex items-center gap-1 ${
                            gender === 'female'
                              ? 'bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-purple-600 hover:to-indigo-600'
                              : 'bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600'
                          }`}
                          title="Scan barcode"
                        >
                          <ScanBarcode className="w-5 h-5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCalorieAISource('food-history');
                            setCalorieAIModalOpen(true);
                          }}
                          className={`px-4 rounded-xl font-semibold text-white transition-all active:scale-95 flex items-center gap-2 ${
                            gender === 'female'
                              ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                              : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600'
                          }`}
                          title="Ask AI for calorie estimate"
                        >
                          <Sparkles className="w-5 h-5" />
                          <span className="hidden sm:inline">AI</span>
                        </button>
                      </div>
                    </div>

                    {/* Macros Input */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Macros (optional)</label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={foodHistoryCarbs}
                          onChange={(e) => setFoodHistoryCarbs(e.target.value)}
                          placeholder="Carbs (g)"
                          className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        />
                        <input
                          type="number"
                          value={foodHistoryFat}
                          onChange={(e) => setFoodHistoryFat(e.target.value)}
                          placeholder="Fat (g)"
                          className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        />
                        <input
                          type="number"
                          value={foodHistoryProtein}
                          onChange={(e) => setFoodHistoryProtein(e.target.value)}
                          placeholder="Protein (g)"
                          className={`flex-1 rounded-xl border-2 border-zinc-200 bg-white px-3 py-3 text-base text-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                            gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="mb-2 block text-sm font-medium text-zinc-500 dark:text-zinc-400">Notes</label>
                      <textarea
                        value={foodHistoryNotes}
                        onChange={(e) => setFoodHistoryNotes(e.target.value)}
                        placeholder="Optional notes..."
                        className={`min-h-[100px] w-full resize-none rounded-xl border-2 border-zinc-200 bg-white p-4 text-base leading-relaxed focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:placeholder-zinc-500 ${
                          gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                        }`}
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        onClick={handleFoodHistoryCancel}
                        className="flex-1 cursor-pointer rounded-xl bg-zinc-200 py-3 text-base font-medium text-zinc-700 active:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-300 dark:active:bg-zinc-600"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleFoodHistoryAdd}
                        disabled={!foodHistoryCalories || !foodHistoryHour || !foodHistoryMinute || (parseInt(foodHistoryCalories) <= 0 && foodHistoryMealType !== 'beverage') || (parseInt(foodHistoryCalories) < 0)}
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

              {dayFoodEntries.length > 0 ? (
                <div className="space-y-2">
                  {dayFoodEntries.map((entry) => (
                    <div
                      key={entry.id}
                      className="flex items-center justify-between rounded-xl bg-zinc-50 px-4 py-3 dark:bg-zinc-700/50"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          gender === 'female' ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-teal-100 dark:bg-teal-900/30'
                        }`}>
                          <svg className={`h-4 w-4 ${gender === 'female' ? 'text-pink-500' : 'text-teal-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path d="M7 4v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
                            <path d="M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0" />
                            <path d="M17 12v9" />
                          </svg>
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-zinc-800 dark:text-zinc-200 capitalize truncate">
                            {getMealTypeLabel(entry.meal_type)} - {entry.calories} cal
                          </p>
                          {(entry.carbs !== undefined || entry.fat !== undefined || entry.protein !== undefined) && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-300">
                              {entry.carbs !== undefined && <span className="text-green-600 dark:text-green-400">C: {entry.carbs}g</span>}
                              {entry.carbs !== undefined && (entry.fat !== undefined || entry.protein !== undefined) && ' • '}
                              {entry.fat !== undefined && <span className="text-yellow-600 dark:text-yellow-400">F: {entry.fat}g</span>}
                              {entry.fat !== undefined && entry.protein !== undefined && ' • '}
                              {entry.protein !== undefined && <span className="text-purple-600 dark:text-purple-400">P: {entry.protein}g</span>}
                            </p>
                          )}
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}
                            {entry.notes && ` • ${entry.notes}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <button
                          onClick={() => handleFoodDuplicate(entry)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            gender === 'female'
                              ? 'text-zinc-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-900/20'
                              : 'text-zinc-400 hover:text-teal-500 hover:bg-teal-50 dark:hover:bg-teal-900/20'
                          }`}
                          title="Add to today"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleFoodDelete(entry.id)}
                          className="p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                          title="Delete entry"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="py-4 text-center text-zinc-400">No entries</p>
              )}

              {/* Daily Summary */}
              <div className={`flex items-center justify-center gap-2 rounded-xl bg-zinc-100 py-3 dark:bg-zinc-700/50 ${dayFoodEntries.length > 0 ? 'mt-4' : 'mt-2'}`}>
                <svg className={`h-5 w-5 ${gender === 'female' ? 'text-pink-500' : 'text-teal-500'}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path d="M7 4v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
                  <path d="M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0" />
                  <path d="M17 12v9" />
                </svg>
                <span className={`font-medium ${gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'}`}>Total</span>
                <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                  {dayTotal} calories
                </span>
              </div>
            </div>
          </div>
        </main>

        <MobileBottomNav
          currentView="food-history"
          onNavigate={(view) => setCurrentView(view)}
          onOpenMore={() => setMenuOpen(true)}
          gender={gender}
        />

        {/* Calorie AI Modal */}
        <CalorieAIModal
          isOpen={calorieAIModalOpen}
          onClose={() => setCalorieAIModalOpen(false)}
          onSelectCalories={(calories, foodDescription) => {
            if (calorieAISource === 'food-history') {
              setFoodHistoryCalories(calories.toString());
              if (foodDescription) {
                setFoodHistoryNotes(foodDescription);
              }
            } else {
              setFoodCalories(calories.toString());
              if (foodDescription) {
                setFoodNotes(foodDescription);
              }
            }
          }}
          gender={gender}
        />

        {/* Barcode Scanner Modal */}
        <BarcodeScanner
          isOpen={barcodeScannerOpen}
          onClose={() => setBarcodeScannerOpen(false)}
          onProductFound={handleBarcodeProductFound}
          onSaveCustomFood={handleSaveCustomFood}
          userId={user?.id}
          gender={gender}
        />
      </div>
    );
  }

  // Food FAQ View
  if (currentView === 'food-faq') {
    const dietaryFaqs: { question: string; answer: string }[] = gender === 'female' ? [
      {
        question: "How many calories should I eat daily?",
        answer: `Based on your profile, your estimated daily calorie need is around ${dietaryNeeds.dailyCalories} calories. This is calculated using the Mifflin-St Jeor equation, factoring in your age, weight, and assuming light activity. Adjust based on your actual activity level and goals.`
      },
      {
        question: "How does my menstrual cycle affect calorie needs?",
        answer: "Your metabolism can increase by 100-300 calories during the luteal phase (after ovulation). Many women experience increased hunger before their period. Listen to your body and allow for slightly more calories during this time if needed."
      },
      {
        question: "How much protein do I need?",
        answer: `Aim for about ${dietaryNeeds.protein}g of protein daily (roughly 0.8-1g per pound of lean body mass). Protein is essential for muscle maintenance, hormone production, and satiety. Good sources include lean meats, fish, eggs, dairy, legumes, and tofu.`
      },
      {
        question: "Should I eat differently during pregnancy?",
        answer: "During pregnancy, you need about 300 extra calories in the second trimester and 450 in the third. Focus on nutrient-dense foods, adequate folate, iron, calcium, and DHA. Always consult your healthcare provider for personalized advice."
      },
      {
        question: "How can I manage hormonal cravings?",
        answer: "Hormonal cravings are normal! Instead of restricting, try satisfying cravings with healthier alternatives. Ensure adequate protein and fiber at meals, stay hydrated, and manage stress. Dark chocolate in moderation can help with chocolate cravings."
      },
      {
        question: "What should I eat for healthy skin and hair?",
        answer: "Focus on foods rich in biotin (eggs, nuts), vitamin C (citrus, berries), omega-3s (salmon, walnuts), and zinc (seeds, legumes). Adequate protein and hydration are also essential for healthy skin and hair growth."
      },
      {
        question: "How do I maintain bone health through diet?",
        answer: "Women need about 1000-1200mg of calcium daily. Include dairy products, fortified plant milks, leafy greens, and calcium-set tofu. Vitamin D (from sunlight or supplements) helps calcium absorption. Weight-bearing exercise also supports bone health."
      },
      {
        question: "What foods help with PMS symptoms?",
        answer: "Foods rich in calcium, magnesium, and B6 can help reduce PMS symptoms. Try leafy greens, bananas, whole grains, and fatty fish. Reducing caffeine, alcohol, and high-sodium foods during PMS may also help with bloating and mood."
      },
      {
        question: "How can I boost iron levels naturally?",
        answer: "Women need about 18mg of iron daily (more during menstruation). Pair iron-rich foods (red meat, spinach, lentils) with vitamin C to boost absorption. Avoid coffee/tea with meals as they inhibit iron absorption."
      },
      {
        question: "What's a balanced approach to eating?",
        answer: "Aim for a plate that's half vegetables, quarter protein, and quarter complex carbs. Include healthy fats daily. Avoid labeling foods as 'good' or 'bad' - all foods can fit in a balanced diet. Focus on adding nutritious foods rather than restricting."
      },
    ] : [
      {
        question: "How many calories should I eat daily?",
        answer: `Based on your profile, your estimated daily calorie need is around ${dietaryNeeds.dailyCalories} calories. This is calculated using the Mifflin-St Jeor equation, factoring in your age, weight, and assuming light activity. Adjust higher for increased physical activity.`
      },
      {
        question: "How much protein do I need for muscle building?",
        answer: `For muscle building, aim for ${Math.round(dietaryNeeds.protein * 1.2)}-${Math.round(dietaryNeeds.protein * 1.5)}g of protein daily (about 1-1.2g per pound of body weight). Spread protein intake across 4-5 meals for optimal muscle protein synthesis.`
      },
      {
        question: "What should I eat before and after workouts?",
        answer: "Pre-workout (1-2 hours before): Complex carbs with moderate protein (e.g., oatmeal with banana). Post-workout (within 1 hour): Protein with fast carbs for recovery (e.g., protein shake with fruit). This timing optimizes performance and recovery."
      },
      {
        question: "How do I gain muscle while minimizing fat?",
        answer: "Eat at a slight caloric surplus (200-300 calories above maintenance), prioritize protein, time nutrients around workouts, and progress gradually in the gym. A 'lean bulk' typically results in gaining 0.5-1 lb per week with minimal fat gain."
      },
      {
        question: "How do carbs affect performance?",
        answer: `Aim for about ${dietaryNeeds.carbs}g of carbs daily for sustained energy. Carbs are your body's preferred fuel for high-intensity exercise. Time more carbs around workouts and choose complex carbs (whole grains, oats) for steady energy release.`
      },
      {
        question: "What foods support testosterone levels?",
        answer: "Include zinc-rich foods (oysters, beef, pumpkin seeds), vitamin D (fatty fish, egg yolks), healthy fats (olive oil, avocados), and cruciferous vegetables. Avoid excessive alcohol and maintain a healthy body fat percentage."
      },
      {
        question: "How much water should I drink for exercise?",
        answer: "For active men: about 125 oz (3.7L) daily from all sources. Add 16-24 oz for every pound lost during exercise. During intense workouts lasting over an hour, consider electrolyte drinks to replace sodium and potassium."
      },
      {
        question: "What should I eat for heart health?",
        answer: "Focus on omega-3 fatty acids (salmon, mackerel), fiber (oats, beans), and potassium-rich foods (bananas, potatoes). Limit saturated fats, sodium, and processed meats. Men have higher heart disease risk, making these changes especially important."
      },
      {
        question: "How can I lose fat while keeping muscle?",
        answer: "Create a moderate caloric deficit (300-500 cal below maintenance), keep protein high (1g per lb body weight), maintain strength training intensity, and prioritize sleep. Lose weight slowly (0.5-1 lb/week) to preserve muscle mass."
      },
      {
        question: "What supplements are actually useful?",
        answer: "Evidence-backed supplements include creatine monohydrate (5g daily for performance), vitamin D (if deficient), omega-3s (if not eating fatty fish), and protein powder (for convenience). Most other supplements have limited evidence."
      },
    ];

    const fuse = new Fuse(dietaryFaqs, {
      keys: ['question', 'answer'],
      threshold: 0.4,
      ignoreLocation: true,
      includeScore: true,
    });

    const currentFoodFaqs = foodFaqSearch.trim()
      ? fuse.search(foodFaqSearch).map(result => result.item)
      : dietaryFaqs;

    return (
      <div className="min-h-screen bg-zinc-50 pb-safe dark:bg-zinc-950">
        <Menu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onNavigate={(view) => setCurrentView(view)}
          currentView="food-faq"
        />

        <DesktopNav
          currentView="food-faq"
          onNavigate={(view) => setCurrentView(view)}
          onOpenSettings={() => setMenuOpen(true)}
          gender={gender}
          avatarUrl={profile?.avatar_url}
          userName={profile?.first_name || undefined}
        />

        <header className={`lg:hidden sticky top-0 z-10 bg-gradient-to-r ${headerGradient}`}>
          <div className="flex items-center justify-between px-4 py-5">
            <button
              onClick={() => setCurrentView('food')}
              className="flex items-center gap-1 text-white/90 hover:text-white"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <h1 className="text-2xl font-light text-white">
              Dietary FAQs
            </h1>
            <div className="w-14" />
          </div>
        </header>

        <main className="mx-auto max-w-lg px-4 py-4 pb-24 lg:pb-4">
          <div className="space-y-4">
            {/* Personalized Info Banner */}
            <div className={`rounded-2xl p-4 ${
              gender === 'female' ? 'bg-pink-100 dark:bg-pink-900/30' : 'bg-teal-100 dark:bg-teal-900/30'
            }`}>
              <p className={`text-sm font-medium ${
                gender === 'female' ? 'text-pink-700 dark:text-pink-300' : 'text-teal-700 dark:text-teal-300'
              }`}>
                Personalized for you based on your profile
              </p>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                Daily targets: {dietaryNeeds.dailyCalories} cal • {dietaryNeeds.protein}g protein • {dietaryNeeds.carbs}g carbs • {dietaryNeeds.fat}g fat
              </p>
            </div>

            {/* Search */}
            <div className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
              <input
                type="text"
                value={foodFaqSearch}
                onChange={(e) => setFoodFaqSearch(e.target.value)}
                placeholder="Search dietary FAQs..."
                className={`w-full rounded-xl border-2 border-zinc-200 bg-white px-4 py-3 text-base focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 ${
                  gender === 'female' ? 'focus:border-pink-500' : 'focus:border-teal-500'
                }`}
              />
            </div>

            {/* FAQ List */}
            <div className="space-y-3">
              {currentFoodFaqs.map((faq, index) => (
                <div key={index} className="rounded-2xl bg-white p-4 shadow-sm dark:bg-zinc-800">
                  <h3 className={`font-semibold mb-2 ${
                    gender === 'female' ? 'text-pink-700 dark:text-pink-300' : 'text-teal-700 dark:text-teal-300'
                  }`}>
                    {faq.question}
                  </h3>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              ))}
              {currentFoodFaqs.length === 0 && (
                <div className="rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-800 text-center">
                  <p className="text-zinc-500 dark:text-zinc-400">No matching FAQs found</p>
                </div>
              )}
            </div>
          </div>
        </main>

        <MobileBottomNav
          currentView="food-faq"
          onNavigate={(view) => setCurrentView(view)}
          onOpenMore={() => setMenuOpen(true)}
          gender={gender}
        />
      </div>
    );
  }

  // Home View (Landing Page)
  return (
    <div className={`min-h-screen pb-safe bg-gradient-to-br ${gender === 'female' ? 'from-pink-50 via-purple-50 to-zinc-50 dark:from-zinc-950 dark:via-purple-950/20 dark:to-zinc-950' : 'from-teal-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950'}`}>
      {showMigration && (
        <MigrationPrompt onComplete={() => setShowMigration(false)} />
      )}

      <Menu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onNavigate={(view) => setCurrentView(view)}
        currentView="home"
      />

      <DesktopNav
        currentView="home"
        onNavigate={(view) => setCurrentView(view)}
        onOpenSettings={() => setMenuOpen(true)}
        gender={gender}
        avatarUrl={profile?.avatar_url}
        userName={profile?.first_name || undefined}
      />

      <main className="mx-auto max-w-6xl px-4 pt-6 pb-24 lg:pb-6">
        {/* Recovery Journey Banner */}
        <div className={`rounded-2xl p-4 mb-6 flex items-center gap-4 ${gender === 'female' ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gradient-to-r from-teal-500 to-blue-600'}`}>
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm flex-shrink-0">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-white text-sm lg:text-base">Your Recovery Journey</h2>
            <p className="text-white/80 text-xs lg:text-sm">Tracking daily habits helps build awareness and supports your path to recovery.</p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Content - Graph Area */}
          <div className="flex-1 order-1 lg:order-1">
            <div className={`rounded-3xl bg-white/80 backdrop-blur-sm p-6 shadow-xl dark:bg-zinc-800/80 min-h-[400px] border border-white/50 dark:border-zinc-700/50 ${gender === 'female' ? 'shadow-pink-500/5' : 'shadow-teal-500/5'}`}>
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-1.5 rounded-full bg-gradient-to-b ${headerGradient}`} />
                  <h2 className="text-xl font-bold text-zinc-800 dark:text-zinc-100">
                    Activity Overview
                  </h2>
                </div>
                <div className="relative" ref={chartDropdownRef}>
                  <button
                    onClick={() => setChartDropdownOpen(!chartDropdownOpen)}
                    className={`flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${gender === 'female' ? 'bg-pink-100 text-pink-700 hover:bg-pink-200 dark:bg-pink-900/30 dark:text-pink-400 dark:hover:bg-pink-900/50' : 'bg-teal-100 text-teal-700 hover:bg-teal-200 dark:bg-teal-900/30 dark:text-teal-400 dark:hover:bg-teal-900/50'}`}
                  >
                    Last {chartDays} days
                    <svg className={`h-3.5 w-3.5 transition-transform ${chartDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {chartDropdownOpen && (
                    <div className="absolute right-0 top-full mt-1 py-1 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-zinc-200 dark:border-zinc-700 min-w-[120px] z-50">
                      {([7, 30, 90, 365] as const).map((days) => (
                        <button
                          key={days}
                          onClick={() => {
                            setChartDays(days);
                            setChartDropdownOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2 text-sm font-medium transition-colors ${
                            chartDays === days
                              ? gender === 'female'
                                ? 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
                                : 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400'
                              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'
                          }`}
                        >
                          Last {days} days
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Graph Area */}
              <div ref={chartContainerRef} className="h-64 mb-6">
                {!selectedTracker ? (
                  <div className="h-full rounded-xl bg-zinc-100 dark:bg-zinc-700 flex items-center justify-center">
                    <div className="text-center space-y-2">
                      <svg className="h-12 w-12 text-zinc-400 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">Select trackers below to view data</p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" className="dark:stroke-zinc-700" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: '#71717a' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e4e4e7' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: '#71717a' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e4e4e7' }}
                        allowDecimals={false}
                        domain={[0, 'auto']}
                        unit={selectedTracker === 'water' ? ' oz' : ''}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(255, 255, 255, 0.95)',
                          border: '1px solid #e4e4e7',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Legend
                        wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                      />
                      {selectedTracker === 'potty' && (
                        <>
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="poop"
                            name="Poop"
                            stroke={gender === 'female' ? '#ec4899' : '#14b8a6'}
                            strokeWidth={2}
                            dot={{ fill: gender === 'female' ? '#ec4899' : '#14b8a6', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="pee"
                            name="Pee"
                            stroke={gender === 'female' ? '#a855f7' : '#3b82f6'}
                            strokeWidth={2}
                            dot={{ fill: gender === 'female' ? '#a855f7' : '#3b82f6', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </>
                      )}
                      {selectedTracker === 'water' && (
                        <Line
                          yAxisId="left"
                          type="monotone"
                          dataKey="water"
                          name="Water (oz)"
                          stroke="#06b6d4"
                          strokeWidth={2}
                          dot={{ fill: '#06b6d4', r: 4 }}
                          activeDot={{ r: 6 }}
                        />
                      )}
                      {selectedTracker === 'food' && (
                        <>
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="calories"
                            name="Calories"
                            stroke="#f97316"
                            strokeWidth={2}
                            dot={{ fill: '#f97316', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="carbs"
                            name="Carbs (g)"
                            stroke="#22c55e"
                            strokeWidth={2}
                            dot={{ fill: '#22c55e', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="fat"
                            name="Fat (g)"
                            stroke="#eab308"
                            strokeWidth={2}
                            dot={{ fill: '#eab308', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="protein"
                            name="Protein (g)"
                            stroke="#8b5cf6"
                            strokeWidth={2}
                            dot={{ fill: '#8b5cf6', r: 4 }}
                            activeDot={{ r: 6 }}
                          />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Offscreen charts for PDF capture */}
              <div className="fixed -left-[10000px] top-0 w-[640px] h-[260px] bg-white pointer-events-none">
                <div ref={pottyChartRef} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: '#71717a' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e4e4e7' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: '#71717a' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e4e4e7' }}
                        allowDecimals={false}
                        domain={[0, 'auto']}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="poop"
                        name="Poop"
                        stroke={gender === 'female' ? '#ec4899' : '#14b8a6'}
                        strokeWidth={2}
                        dot={{ fill: gender === 'female' ? '#ec4899' : '#14b8a6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="pee"
                        name="Pee"
                        stroke={gender === 'female' ? '#a855f7' : '#3b82f6'}
                        strokeWidth={2}
                        dot={{ fill: gender === 'female' ? '#a855f7' : '#3b82f6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="fixed -left-[10000px] top-[300px] w-[640px] h-[260px] bg-white pointer-events-none">
                <div ref={waterChartRef} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: '#71717a' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e4e4e7' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: '#71717a' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e4e4e7' }}
                        allowDecimals={false}
                        domain={[0, 'auto']}
                        unit=" oz"
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="water"
                        name="Water (oz)"
                        stroke="#06b6d4"
                        strokeWidth={2}
                        dot={{ fill: '#06b6d4', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="fixed -left-[10000px] top-[600px] w-[640px] h-[260px] bg-white pointer-events-none">
                <div ref={foodChartRef} className="w-full h-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 12, fill: '#71717a' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e4e4e7' }}
                      />
                      <YAxis
                        yAxisId="left"
                        tick={{ fontSize: 12, fill: '#71717a' }}
                        tickLine={false}
                        axisLine={{ stroke: '#e4e4e7' }}
                        allowDecimals={false}
                        domain={[0, 'auto']}
                      />
                      <Legend wrapperStyle={{ fontSize: '10px' }} />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="calories"
                        name="Calories"
                        stroke="#f97316"
                        strokeWidth={2}
                        dot={{ fill: '#f97316', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="carbs"
                        name="Carbs (g)"
                        stroke="#22c55e"
                        strokeWidth={2}
                        dot={{ fill: '#22c55e', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="fat"
                        name="Fat (g)"
                        stroke="#eab308"
                        strokeWidth={2}
                        dot={{ fill: '#eab308', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        yAxisId="left"
                        type="monotone"
                        dataKey="protein"
                        name="Protein (g)"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: '#8b5cf6', r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Tracker Selection - Single select */}
              <div className="space-y-4 pt-2 border-t border-zinc-100 dark:border-zinc-700">
                <div className="pt-4">
                  <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Select tracker to display</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {/* Food Journal - Select */}
                  <button
                    onClick={() => setSelectedTracker('food')}
                    className={`rounded-2xl p-4 text-center transition-all duration-200 border ${
                      selectedTracker === 'food'
                        ? 'bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 border-orange-300 dark:border-orange-700 shadow-lg shadow-orange-500/20'
                        : 'bg-zinc-50 dark:bg-zinc-700/50 border-zinc-200/50 dark:border-zinc-600/30 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500'
                    }`}
                  >
                    <div className="relative inline-block">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all ${selectedTracker === 'food' ? 'bg-orange-500 shadow-md shadow-orange-500/30' : 'bg-zinc-200 dark:bg-zinc-600'}`}>
                        <svg className={`h-5 w-5 ${selectedTracker === 'food' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M7 4v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
                          <path d="M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0" />
                          <path d="M17 12v9" />
                        </svg>
                      </div>
                      {selectedTracker === 'food' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center shadow-sm">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs font-bold ${selectedTracker === 'food' ? 'text-orange-700 dark:text-orange-300' : 'text-zinc-600 dark:text-zinc-400'}`}>Food</p>
                  </button>

                  {/* Physical Therapy - Coming Soon */}
                  <div className="rounded-2xl p-4 text-center bg-zinc-100/50 dark:bg-zinc-700/30 opacity-50 cursor-not-allowed border border-zinc-200/50 dark:border-zinc-600/30">
                    <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center mx-auto mb-2">
                      <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M2 12h1" />
                        <path d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2" />
                        <path d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" />
                        <path d="M9 12h6" />
                        <path d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" />
                        <path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2" />
                        <path d="M22 12h-1" />
                      </svg>
                    </div>
                    <p className="text-xs font-semibold text-zinc-400">Physical</p>
                  </div>

                  {/* Potty Logger - Select */}
                  <button
                    onClick={() => setSelectedTracker('potty')}
                    className={`rounded-2xl p-4 text-center transition-all duration-200 border ${
                      selectedTracker === 'potty'
                        ? gender === 'female'
                          ? 'bg-gradient-to-br from-pink-100 to-purple-100 dark:from-pink-900/40 dark:to-purple-900/40 border-pink-300 dark:border-pink-700 shadow-lg shadow-pink-500/20'
                          : 'bg-gradient-to-br from-teal-100 to-cyan-100 dark:from-teal-900/40 dark:to-cyan-900/40 border-teal-300 dark:border-teal-700 shadow-lg shadow-teal-500/20'
                        : 'bg-zinc-50 dark:bg-zinc-700/50 border-zinc-200/50 dark:border-zinc-600/30 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500'
                    }`}
                  >
                    <div className="relative inline-block">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all ${selectedTracker === 'potty' ? (gender === 'female' ? 'bg-pink-500 shadow-md shadow-pink-500/30' : 'bg-teal-500 shadow-md shadow-teal-500/30') : 'bg-zinc-200 dark:bg-zinc-600'}`}>
                        <svg className={`h-5 w-5 ${selectedTracker === 'potty' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M3 10a3 7 0 1 0 6 0a3 7 0 1 0 -6 0" />
                          <path d="M21 10c0 -3.866 -1.343 -7 -3 -7" />
                          <path d="M6 3h12" />
                          <path d="M21 10v10l-3 -1l-3 2l-3 -3l-3 2v-10" />
                          <path d="M6 10h.01" />
                        </svg>
                      </div>
                      {selectedTracker === 'potty' && (
                        <div className={`absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center shadow-sm ${gender === 'female' ? 'bg-pink-500' : 'bg-teal-500'}`}>
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs font-bold ${selectedTracker === 'potty' ? (gender === 'female' ? 'text-pink-700 dark:text-pink-300' : 'text-teal-700 dark:text-teal-300') : 'text-zinc-600 dark:text-zinc-400'}`}>Potty</p>
                  </button>

                  {/* Water Intake - Select */}
                  <button
                    onClick={() => setSelectedTracker('water')}
                    className={`rounded-2xl p-4 text-center transition-all duration-200 border ${
                      selectedTracker === 'water'
                        ? 'bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/40 dark:to-blue-900/40 border-cyan-300 dark:border-cyan-700 shadow-lg shadow-cyan-500/20'
                        : 'bg-zinc-50 dark:bg-zinc-700/50 border-zinc-200/50 dark:border-zinc-600/30 hover:bg-zinc-100 dark:hover:bg-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-500'
                    }`}
                  >
                    <div className="relative inline-block">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center mx-auto mb-2 transition-all ${selectedTracker === 'water' ? 'bg-cyan-500 shadow-md shadow-cyan-500/30' : 'bg-zinc-200 dark:bg-zinc-600'}`}>
                        <svg className={`h-5 w-5 ${selectedTracker === 'water' ? 'text-white' : 'text-zinc-500 dark:text-zinc-400'}`} fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2" />
                          <path d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537" />
                          <path d="M7 14.803a2.4 2.4 0 0 0 1 -.803a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 1 -.805" />
                        </svg>
                      </div>
                      {selectedTracker === 'water' && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-cyan-500 flex items-center justify-center shadow-sm">
                          <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <p className={`text-xs font-bold ${selectedTracker === 'water' ? 'text-cyan-700 dark:text-cyan-300' : 'text-zinc-600 dark:text-zinc-400'}`}>Water</p>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar */}
          <div className="w-full lg:w-80 order-2 lg:order-2 space-y-4">
            {/* Habit Tracker Links */}
            <div className={`rounded-3xl bg-white/80 backdrop-blur-sm p-5 shadow-xl dark:bg-zinc-800/80 border border-white/50 dark:border-zinc-700/50 ${gender === 'female' ? 'shadow-pink-500/5' : 'shadow-teal-500/5'}`}>
              <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${gender === 'female' ? 'text-pink-600 dark:text-pink-400' : 'text-teal-600 dark:text-teal-400'}`}>
                Habit Trackers
              </h3>
              <div className="space-y-2">
                {/* Food Journal */}
                <button
                  onClick={() => setCurrentView('food')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border group ${
                    gender === 'female'
                      ? 'bg-orange-50 dark:bg-orange-900/20 border-orange-200/50 dark:border-orange-800/30 hover:bg-orange-100 dark:hover:bg-orange-900/30 hover:shadow-md hover:shadow-orange-500/10'
                      : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200/50 dark:border-amber-800/30 hover:bg-amber-100 dark:hover:bg-amber-900/30 hover:shadow-md hover:shadow-amber-500/10'
                  }`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${gender === 'female' ? 'bg-orange-500' : 'bg-amber-500'}`}>
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M7 4v17m-3 -17v3a3 3 0 1 0 6 0v-3" />
                      <path d="M14 8a3 4 0 1 0 6 0a3 4 0 1 0 -6 0" />
                      <path d="M17 12v9" />
                    </svg>
                  </div>
                  <span className={`flex-1 text-sm font-semibold text-left ${gender === 'female' ? 'text-orange-900 dark:text-orange-100' : 'text-amber-900 dark:text-amber-100'}`}>Food Journal</span>
                  <svg className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${gender === 'female' ? 'text-orange-400' : 'text-amber-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Physical Therapy */}
                <div className="flex items-center gap-3 p-3 rounded-xl bg-zinc-100/50 dark:bg-zinc-700/30 opacity-60 border border-zinc-200/50 dark:border-zinc-600/30">
                  <div className="h-9 w-9 rounded-lg bg-zinc-200 dark:bg-zinc-600 flex items-center justify-center">
                    <svg className="h-5 w-5 text-zinc-400" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M2 12h1" />
                      <path d="M6 8h-2a1 1 0 0 0 -1 1v6a1 1 0 0 0 1 1h2" />
                      <path d="M6 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" />
                      <path d="M9 12h6" />
                      <path d="M15 7v10a1 1 0 0 0 1 1h1a1 1 0 0 0 1 -1v-10a1 1 0 0 0 -1 -1h-1a1 1 0 0 0 -1 1" />
                      <path d="M18 8h2a1 1 0 0 1 1 1v6a1 1 0 0 1 -1 1h-2" />
                      <path d="M22 12h-1" />
                    </svg>
                  </div>
                  <span className="flex-1 text-sm font-semibold text-zinc-500 dark:text-zinc-400">Physical Therapy</span>
                  <span className="text-xs bg-zinc-200 dark:bg-zinc-600 text-zinc-500 dark:text-zinc-400 px-2.5 py-1 rounded-full font-medium">Soon</span>
                </div>

                {/* Potty Logger */}
                <button
                  onClick={() => setCurrentView('potty')}
                  className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border group ${gender === 'female' ? 'bg-pink-50 dark:bg-pink-900/20 border-pink-200/50 dark:border-pink-800/30 hover:bg-pink-100 dark:hover:bg-pink-900/30 hover:shadow-md hover:shadow-pink-500/10' : 'bg-teal-50 dark:bg-teal-900/20 border-teal-200/50 dark:border-teal-800/30 hover:bg-teal-100 dark:hover:bg-teal-900/30 hover:shadow-md hover:shadow-teal-500/10'}`}
                >
                  <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${gender === 'female' ? 'bg-pink-500' : 'bg-teal-500'}`}>
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M3 10a3 7 0 1 0 6 0a3 7 0 1 0 -6 0" />
                      <path d="M21 10c0 -3.866 -1.343 -7 -3 -7" />
                      <path d="M6 3h12" />
                      <path d="M21 10v10l-3 -1l-3 2l-3 -3l-3 2v-10" />
                      <path d="M6 10h.01" />
                    </svg>
                  </div>
                  <span className={`flex-1 text-sm font-semibold text-left ${gender === 'female' ? 'text-pink-900 dark:text-pink-100' : 'text-teal-900 dark:text-teal-100'}`}>Potty Logger</span>
                  <svg className={`h-5 w-5 transition-transform group-hover:translate-x-1 ${gender === 'female' ? 'text-pink-400' : 'text-teal-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Water Intake */}
                <button
                  onClick={() => setCurrentView('water')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl transition-all duration-200 border group bg-cyan-50 dark:bg-cyan-900/20 border-cyan-200/50 dark:border-cyan-800/30 hover:bg-cyan-100 dark:hover:bg-cyan-900/30 hover:shadow-md hover:shadow-cyan-500/10"
                >
                  <div className="h-9 w-9 rounded-lg bg-cyan-500 flex items-center justify-center">
                    <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M10 5h4v-2a1 1 0 0 0 -1 -1h-2a1 1 0 0 0 -1 1v2" />
                      <path d="M14 3.5c0 1.626 .507 3.212 1.45 4.537l.05 .07a8.093 8.093 0 0 1 1.5 4.694v6.199a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-6.2c0 -1.682 .524 -3.322 1.5 -4.693l.05 -.07a7.823 7.823 0 0 0 1.45 -4.537" />
                      <path d="M7 14.803a2.4 2.4 0 0 0 1 -.803a2.4 2.4 0 0 1 2 -1a2.4 2.4 0 0 1 2 1a2.4 2.4 0 0 0 2 1a2.4 2.4 0 0 0 2 -1a2.4 2.4 0 0 1 1 -.805" />
                    </svg>
                  </div>
                  <span className="flex-1 text-sm font-semibold text-cyan-900 dark:text-cyan-100 text-left">Water Intake</span>
                  <svg className="h-5 w-5 text-cyan-400 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Healthcare Report Button */}
            <button
              onClick={() => setHealthcareReportOpen(true)}
              className={`w-full rounded-3xl p-5 shadow-lg transition-all duration-200 hover:shadow-xl active:scale-[0.98] bg-white dark:bg-zinc-800 border-2 ${
                gender === 'female'
                  ? 'border-pink-400 dark:border-pink-500 hover:border-pink-500 dark:hover:border-pink-400'
                  : 'border-teal-400 dark:border-teal-500 hover:border-teal-500 dark:hover:border-teal-400'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${
                  gender === 'female'
                    ? 'bg-pink-100 dark:bg-pink-900/40'
                    : 'bg-teal-100 dark:bg-teal-900/40'
                }`}>
                  <Share2 className={`h-7 w-7 ${
                    gender === 'female'
                      ? 'text-pink-600 dark:text-pink-400'
                      : 'text-teal-600 dark:text-teal-400'
                  }`} />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className={`block font-bold text-lg ${
                    gender === 'female'
                      ? 'text-pink-700 dark:text-pink-300'
                      : 'text-teal-700 dark:text-teal-300'
                  }`}>Share with Provider</span>
                  <span className="block text-sm text-zinc-500 dark:text-zinc-400">Generate PDF Report</span>
                </div>
                <svg className={`h-6 w-6 flex-shrink-0 ${
                  gender === 'female'
                    ? 'text-pink-400 dark:text-pink-500'
                    : 'text-teal-400 dark:text-teal-500'
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </button>
          </div>
        </div>
      </main>

      <MobileBottomNav
        currentView="home"
        onNavigate={(view) => setCurrentView(view)}
        onOpenMore={() => setMenuOpen(true)}
        gender={gender}
      />

      {/* Healthcare Report Modal */}
      {profile && (
        <HealthcareReport
          isOpen={healthcareReportOpen}
          onClose={() => setHealthcareReportOpen(false)}
          profile={profile}
          bathroomEntries={entries}
          waterEntries={waterEntries}
          foodEntries={foodEntries}
          pottyChartRef={pottyChartRef}
          waterChartRef={waterChartRef}
          foodChartRef={foodChartRef}
          gender={gender}
        />
      )}
    </div>
  );
}

function HomeLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-teal-50 via-cyan-50 to-zinc-50 dark:from-zinc-950 dark:via-teal-950/20 dark:to-zinc-950">
      <div className="text-zinc-500">Loading...</div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<HomeLoading />}>
      <HomeContent />
    </Suspense>
  );
}
