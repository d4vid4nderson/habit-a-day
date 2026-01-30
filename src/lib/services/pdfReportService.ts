import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  UserProfile,
  BathroomEntry,
  WaterEntry,
  FoodEntry,
  URINE_COLORS,
} from '@/lib/types';
import { calculateDietaryNeeds, getMealTypeLabel } from './foodService';

export interface DateRange {
  startDate: Date;
  endDate: Date;
}

export interface ReportData {
  profile: UserProfile;
  bathroomEntries: BathroomEntry[];
  waterEntries: WaterEntry[];
  foodEntries: FoodEntry[];
  dateRange: DateRange;
}

interface SummaryStats {
  bathroom: {
    totalBowelMovements: number;
    totalUrinations: number;
    avgDailyBM: number;
    avgDailyUrinations: number;
  };
  water: {
    totalOz: number;
    dailyAvgOz: number;
    recommendedOz: number;
    percentOfRecommended: number;
  };
  food: {
    totalCalories: number;
    dailyAvgCalories: number;
    recommendedCalories: number;
    percentOfRecommended: number;
    totalCarbs: number;
    totalFat: number;
    totalProtein: number;
    dailyAvgCarbs: number;
    dailyAvgFat: number;
    dailyAvgProtein: number;
    recommendedCarbs: number;
    recommendedFat: number;
    recommendedProtein: number;
  };
}

function filterEntriesByDateRange<T extends { timestamp: number }>(
  entries: T[],
  dateRange: DateRange
): T[] {
  const startTimestamp = dateRange.startDate.getTime();
  const endTimestamp = dateRange.endDate.getTime() + (24 * 60 * 60 * 1000 - 1); // End of day
  return entries.filter(
    (entry) => entry.timestamp >= startTimestamp && entry.timestamp <= endTimestamp
  );
}

function calculateDaysBetween(startDate: Date, endDate: Date): number {
  const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end days
}

function calculateSummaryStats(data: ReportData): SummaryStats {
  const { profile, bathroomEntries, waterEntries, foodEntries, dateRange } = data;
  const days = calculateDaysBetween(dateRange.startDate, dateRange.endDate);

  // Bathroom stats
  const bowelMovements = bathroomEntries.filter((e) => e.type === 'poop').length;
  const urinations = bathroomEntries.filter((e) => e.type === 'pee').length;

  // Water stats (convert all to oz)
  const totalOz = waterEntries.reduce((sum, entry) => {
    let oz = entry.amount;
    switch (entry.unit) {
      case 'ml':
        oz = entry.amount / 29.5735;
        break;
      case 'L':
        oz = entry.amount * 33.814;
        break;
      case 'cups':
        oz = entry.amount * 8;
        break;
    }
    return sum + oz;
  }, 0);

  // Food stats
  const totalCalories = foodEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalCarbs = foodEntries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
  const totalFat = foodEntries.reduce((sum, entry) => sum + (entry.fat || 0), 0);
  const totalProtein = foodEntries.reduce((sum, entry) => sum + (entry.protein || 0), 0);

  // Get recommended values
  const weightLbs = profile.weight_unit === 'kg' && profile.weight
    ? profile.weight * 2.20462
    : profile.weight;
  const dietaryNeeds = calculateDietaryNeeds(profile.gender, profile.age, weightLbs);

  return {
    bathroom: {
      totalBowelMovements: bowelMovements,
      totalUrinations: urinations,
      avgDailyBM: Math.round((bowelMovements / days) * 10) / 10,
      avgDailyUrinations: Math.round((urinations / days) * 10) / 10,
    },
    water: {
      totalOz: Math.round(totalOz),
      dailyAvgOz: Math.round(totalOz / days),
      recommendedOz: dietaryNeeds.water,
      percentOfRecommended: Math.round((totalOz / days / dietaryNeeds.water) * 100),
    },
    food: {
      totalCalories: Math.round(totalCalories),
      dailyAvgCalories: Math.round(totalCalories / days),
      recommendedCalories: dietaryNeeds.dailyCalories,
      percentOfRecommended: Math.round(
        (totalCalories / days / dietaryNeeds.dailyCalories) * 100
      ),
      totalCarbs: Math.round(totalCarbs),
      totalFat: Math.round(totalFat),
      totalProtein: Math.round(totalProtein),
      dailyAvgCarbs: Math.round(totalCarbs / days),
      dailyAvgFat: Math.round(totalFat / days),
      dailyAvgProtein: Math.round(totalProtein / days),
      recommendedCarbs: dietaryNeeds.carbs,
      recommendedFat: dietaryNeeds.fat,
      recommendedProtein: dietaryNeeds.protein,
    },
  };
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
}

function formatTime(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function formatDateTime(timestamp: number): string {
  const date = new Date(timestamp);
  return `${formatDate(date)} ${formatTime(timestamp)}`;
}

function formatHeight(profile: UserProfile): string {
  if (profile.height_unit === 'metric' && profile.height_cm) {
    return `${profile.height_cm} cm`;
  }
  if (profile.height_feet !== null && profile.height_inches !== null) {
    return `${profile.height_feet}'${profile.height_inches}"`;
  }
  return 'Not specified';
}

function formatWeight(profile: UserProfile): string {
  if (profile.weight) {
    return `${profile.weight} ${profile.weight_unit || 'lbs'}`;
  }
  return 'Not specified';
}

function getUrineColorLabel(color: number): string {
  const colorInfo = URINE_COLORS.find((c) => c.level === color);
  return colorInfo ? `${colorInfo.label} (${colorInfo.status})` : `Level ${color}`;
}

export async function generateHealthcareReport(
  data: ReportData,
  pottyChartElement?: HTMLElement | null,
  waterChartElement?: HTMLElement | null,
  foodChartElement?: HTMLElement | null
): Promise<Blob> {
  const pdf = new jsPDF('p', 'mm', 'letter');
  const pageWidth = 215.9;
  const pageHeight = 279.4;
  const margin = 15;
  const contentWidth = pageWidth - margin * 2;

  // Filter entries by date range
  const bathroomEntries = filterEntriesByDateRange(data.bathroomEntries, data.dateRange);
  const waterEntries = filterEntriesByDateRange(data.waterEntries, data.dateRange);
  const foodEntries = filterEntriesByDateRange(data.foodEntries, data.dateRange);

  const filteredData: ReportData = {
    ...data,
    bathroomEntries,
    waterEntries,
    foodEntries,
  };

  const stats = calculateSummaryStats(filteredData);
  const { profile, dateRange } = data;

  // ============ PAGE 1: Cover & Summary ============
  let y = margin;

  // Header background
  pdf.setFillColor(20, 184, 166); // Teal
  pdf.rect(0, 0, pageWidth, 50, 'F');

  // Draw checkmark circle icon
  const iconX = margin + 8;
  const iconY = 20;
  const iconRadius = 7;

  // Circle outline
  pdf.setDrawColor(255, 255, 255);
  pdf.setLineWidth(1.2);
  pdf.circle(iconX, iconY, iconRadius, 'S');

  // Checkmark inside circle
  pdf.setLineWidth(1.2);
  pdf.setLineCap('round');
  pdf.setLineJoin('round');
  // Draw checkmark path: starts at left, goes down-right, then up-right
  pdf.line(iconX - 3, iconY, iconX - 0.5, iconY + 2.5); // Left part of check
  pdf.line(iconX - 0.5, iconY + 2.5, iconX + 4, iconY - 2.5); // Right part of check

  // Title text (positioned after icon)
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('HABIT-A-DAY', margin + 20, 18);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'normal');
  pdf.text('HEALTH REPORT', margin + 20, 26);

  pdf.setFontSize(10);
  const patientName = [profile.first_name, profile.last_name].filter(Boolean).join(' ') || 'Patient';
  pdf.text(`Patient: ${patientName}`, margin, 38);
  pdf.text(
    `Report Period: ${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`,
    margin,
    44
  );
  pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth - margin - 55, 44);

  y = 60;

  // Patient Demographics Section
  pdf.setTextColor(20, 184, 166);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('PATIENT DEMOGRAPHICS', margin, y);
  y += 2;

  pdf.setDrawColor(20, 184, 166);
  pdf.setLineWidth(0.5);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 8;

  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');

  const demographics = [
    ['Age:', profile.age ? `${profile.age} years` : 'Not specified'],
    ['Gender:', profile.gender === 'male' ? 'Male' : 'Female'],
    ['Weight:', formatWeight(profile)],
    ['Height:', formatHeight(profile)],
  ];

  demographics.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, margin + 25, y);
    y += 7;
  });

  y += 8;

  // Summary Statistics Section
  pdf.setTextColor(20, 184, 166);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('SUMMARY STATISTICS', margin, y);
  y += 2;

  pdf.setDrawColor(20, 184, 166);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 10;

  // Three columns for stats
  const colWidth = contentWidth / 3;

  // Bathroom stats
  pdf.setTextColor(59, 130, 246); // Blue
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Bathroom', margin, y);

  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  y += 7;
  pdf.text(`Total Bowel Movements: ${stats.bathroom.totalBowelMovements}`, margin, y);
  y += 5;
  pdf.text(`Total Urinations: ${stats.bathroom.totalUrinations}`, margin, y);
  y += 5;
  pdf.text(`Avg Daily BM: ${stats.bathroom.avgDailyBM}`, margin, y);
  y += 5;
  pdf.text(`Avg Daily Urinations: ${stats.bathroom.avgDailyUrinations}`, margin, y);

  // Reset y for next column
  const statsY = y - 22;
  y = statsY;

  // Water stats
  pdf.setTextColor(6, 182, 212); // Cyan
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Water Intake', margin + colWidth, y);

  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  y += 7;
  pdf.text(`Total: ${stats.water.totalOz} oz`, margin + colWidth, y);
  y += 5;
  pdf.text(`Daily Avg: ${stats.water.dailyAvgOz} oz`, margin + colWidth, y);
  y += 5;
  pdf.text(`Recommended: ${stats.water.recommendedOz} oz/day`, margin + colWidth, y);
  y += 5;
  pdf.text(`vs Recommended: ${stats.water.percentOfRecommended}%`, margin + colWidth, y);

  // Reset y for next column
  y = statsY;

  // Food stats
  pdf.setTextColor(249, 115, 22); // Orange
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Food Journal', margin + colWidth * 2, y);

  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  y += 7;
  pdf.text(`Total: ${stats.food.totalCalories.toLocaleString()} cal`, margin + colWidth * 2, y);
  y += 5;
  pdf.text(`Daily Avg: ${stats.food.dailyAvgCalories.toLocaleString()} cal`, margin + colWidth * 2, y);
  y += 5;
  pdf.text(`Recommended: ${stats.food.recommendedCalories.toLocaleString()} cal/day`, margin + colWidth * 2, y);
  y += 5;
  pdf.text(`vs Recommended: ${stats.food.percentOfRecommended}%`, margin + colWidth * 2, y);

  y += 15;

  // Macronutrient Summary
  pdf.setTextColor(20, 184, 166);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('MACRONUTRIENT SUMMARY', margin, y);
  y += 2;

  pdf.setDrawColor(20, 184, 166);
  pdf.line(margin, y, margin + contentWidth, y);
  y += 10;

  // Three columns for macros
  // Carbs
  pdf.setTextColor(34, 197, 94); // Green
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Carbohydrates', margin, y);

  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  const macroY = y + 7;
  pdf.text(`Total: ${stats.food.totalCarbs}g`, margin, macroY);
  pdf.text(`Daily Avg: ${stats.food.dailyAvgCarbs}g`, margin, macroY + 5);
  pdf.text(`Recommended: ${stats.food.recommendedCarbs}g/day`, margin, macroY + 10);

  // Fat
  pdf.setTextColor(234, 179, 8); // Yellow
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Fat', margin + colWidth, y);

  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total: ${stats.food.totalFat}g`, margin + colWidth, macroY);
  pdf.text(`Daily Avg: ${stats.food.dailyAvgFat}g`, margin + colWidth, macroY + 5);
  pdf.text(`Recommended: ${stats.food.recommendedFat}g/day`, margin + colWidth, macroY + 10);

  // Protein
  pdf.setTextColor(139, 92, 246); // Purple
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Protein', margin + colWidth * 2, y);

  pdf.setTextColor(60, 60, 60);
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Total: ${stats.food.totalProtein}g`, margin + colWidth * 2, macroY);
  pdf.text(`Daily Avg: ${stats.food.dailyAvgProtein}g`, margin + colWidth * 2, macroY + 5);
  pdf.text(`Recommended: ${stats.food.recommendedProtein}g/day`, margin + colWidth * 2, macroY + 10);

  y = macroY + 20;

  // ============ PAGES 2+: Detailed Logs ============

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (y + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      y = margin;
      return true;
    }
    return false;
  };

  // Helper function to wrap text and calculate height
  const wrapText = (text: string, maxWidth: number): string[] => {
    return pdf.splitTextToSize(text, maxWidth);
  };

  // Helper function to capture and add chart
  const addChartToPage = async (
    chartElement: HTMLElement | null | undefined,
    title: string,
    legendItems?: { label: string; color: [number, number, number] }[]
  ): Promise<void> => {
    if (!chartElement) return;

    pdf.setTextColor(20, 184, 166);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, y);
    y += 2;

    pdf.setDrawColor(20, 184, 166);
    pdf.line(margin, y, margin + contentWidth, y);
    y += 8;

    try {
      const canvas = await html2canvas(chartElement, {
        scale: 2,
        backgroundColor: '#ffffff',
        logging: false,
      } as Parameters<typeof html2canvas>[1]);
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = contentWidth;
      const imgHeight = (canvas.height / canvas.width) * imgWidth;
      const chartHeight = Math.min(imgHeight, 90);

      checkPageBreak(chartHeight);

      pdf.addImage(imgData, 'PNG', margin, y, imgWidth, chartHeight);
      y += chartHeight + 12;
    } catch (error) {
      console.error('Error capturing chart:', error);
      pdf.setTextColor(150, 150, 150);
      pdf.setFontSize(11);
      pdf.text('Chart could not be captured', margin, y);
      y += 10;
    }

    if (legendItems && legendItems.length > 0) {
      const legendY = y;
      const swatchSize = 4;
      const itemGap = 4;
      let cursorX = margin;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);

      legendItems.forEach((item) => {
        pdf.setFillColor(item.color[0], item.color[1], item.color[2]);
        pdf.rect(cursorX, legendY - swatchSize + 1, swatchSize, swatchSize, 'F');
        cursorX += swatchSize + 2;
        pdf.text(item.label, cursorX, legendY);
        cursorX += pdf.getTextWidth(item.label) + itemGap + 6;
      });

      y += 8;
    }
  };

  // Bathroom Log
  if (bathroomEntries.length > 0) {
    pdf.addPage();
    y = margin;

    // Add potty chart before bathroom log
    await addChartToPage(pottyChartElement, 'BATHROOM ACTIVITY', [
      { label: 'Poop', color: [20, 184, 166] },
      { label: 'Pee', color: [59, 130, 246] },
    ]);

    pdf.setTextColor(20, 184, 166);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('BATHROOM LOG', margin, y);
    y += 2;

    pdf.setDrawColor(20, 184, 166);
    pdf.line(margin, y, margin + contentWidth, y);
    y += 8;

    // Table headers
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y - 4, contentWidth, 8, 'F');

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date/Time', margin + 2, y);
    pdf.text('Type', margin + 42, y);
    pdf.text('Details', margin + 60, y);
    pdf.text('Notes', margin + 115, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    // Sort by timestamp descending
    const sortedBathroom = [...bathroomEntries].sort((a, b) => b.timestamp - a.timestamp);

    sortedBathroom.forEach((entry) => {
      const notes = entry.notes || '-';
      const notesMaxWidth = contentWidth - 115; // Width available for notes column
      const wrappedNotes = wrapText(notes, notesMaxWidth);

      let details = '';
      if (entry.type === 'pee') {
        if (entry.urine_color) {
          details = `Color: ${getUrineColorLabel(entry.urine_color)}`;
        }
        if (entry.stream_strength) {
          details += details ? `, Stream: ${entry.stream_strength}` : `Stream: ${entry.stream_strength}`;
        }
      }
      const detailsMaxWidth = 53; // Width for details column
      const wrappedDetails = wrapText(details || '-', detailsMaxWidth);
      const rowHeight = Math.max(6, Math.max(wrappedNotes.length, wrappedDetails.length) * 4 + 2);

      checkPageBreak(rowHeight);

      pdf.text(formatDateTime(entry.timestamp), margin + 2, y);
      pdf.text(entry.type === 'poop' ? 'Bowel Movement' : 'Urination', margin + 42, y);

      wrappedDetails.forEach((line, i) => {
        pdf.text(line, margin + 60, y + i * 4);
      });

      wrappedNotes.forEach((line, i) => {
        pdf.text(line, margin + 115, y + i * 4);
      });

      y += rowHeight;
    });
  }

  // Water Intake Log
  if (waterEntries.length > 0) {
    checkPageBreak(40);
    if (y > margin + 10) {
      pdf.addPage();
      y = margin;
    }

    // Add water chart before water intake log
    await addChartToPage(waterChartElement, 'WATER INTAKE ACTIVITY', [
      { label: 'Water (oz)', color: [6, 182, 212] },
    ]);

    pdf.setTextColor(20, 184, 166);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('WATER INTAKE LOG', margin, y);
    y += 2;

    pdf.setDrawColor(20, 184, 166);
    pdf.line(margin, y, margin + contentWidth, y);
    y += 8;

    // Table headers
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y - 4, contentWidth, 8, 'F');

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date/Time', margin + 2, y);
    pdf.text('Amount', margin + 50, y);
    pdf.text('Notes', margin + 90, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    const sortedWater = [...waterEntries].sort((a, b) => b.timestamp - a.timestamp);

    sortedWater.forEach((entry) => {
      const notes = entry.notes || '-';
      const notesMaxWidth = contentWidth - 90; // Width available for notes column
      const wrappedNotes = wrapText(notes, notesMaxWidth);
      const rowHeight = Math.max(6, wrappedNotes.length * 4 + 2);

      checkPageBreak(rowHeight);

      pdf.text(formatDateTime(entry.timestamp), margin + 2, y);
      pdf.text(`${entry.amount} ${entry.unit}`, margin + 50, y);

      wrappedNotes.forEach((line, i) => {
        pdf.text(line, margin + 90, y + i * 4);
      });

      y += rowHeight;
    });
  }

  // Food Journal Log
  if (foodEntries.length > 0) {
    checkPageBreak(40);
    if (y > margin + 10) {
      pdf.addPage();
      y = margin;
    }

    // Add food chart before food journal
    await addChartToPage(foodChartElement, 'FOOD INTAKE ACTIVITY', [
      { label: 'Calories', color: [249, 115, 22] },
      { label: 'Carbs (g)', color: [34, 197, 94] },
      { label: 'Fat (g)', color: [234, 179, 8] },
      { label: 'Protein (g)', color: [139, 92, 246] },
    ]);

    pdf.setTextColor(20, 184, 166);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('FOOD JOURNAL', margin, y);
    y += 2;

    pdf.setDrawColor(20, 184, 166);
    pdf.line(margin, y, margin + contentWidth, y);
    y += 8;

    // Table headers
    pdf.setFillColor(240, 240, 240);
    pdf.rect(margin, y - 4, contentWidth, 8, 'F');

    pdf.setTextColor(60, 60, 60);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Date/Time', margin + 2, y);
    pdf.text('Meal', margin + 42, y);
    pdf.text('Cals', margin + 70, y);
    pdf.text('C/F/P', margin + 90, y);
    pdf.text('Notes', margin + 120, y);
    y += 6;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);

    const sortedFood = [...foodEntries].sort((a, b) => b.timestamp - a.timestamp);

    sortedFood.forEach((entry) => {
      const notes = entry.notes || '-';
      const notesMaxWidth = contentWidth - 120; // Width available for notes column
      const wrappedNotes = wrapText(notes, notesMaxWidth);
      const rowHeight = Math.max(6, wrappedNotes.length * 4 + 2);

      checkPageBreak(rowHeight);

      pdf.text(formatDateTime(entry.timestamp), margin + 2, y);
      pdf.text(getMealTypeLabel(entry.meal_type), margin + 42, y);
      pdf.text(`${entry.calories}`, margin + 70, y);

      // Macros: C/F/P format
      const carbs = entry.carbs !== undefined ? entry.carbs : '-';
      const fat = entry.fat !== undefined ? entry.fat : '-';
      const protein = entry.protein !== undefined ? entry.protein : '-';
      pdf.text(`${carbs}/${fat}/${protein}`, margin + 90, y);

      wrappedNotes.forEach((line, i) => {
        pdf.text(line, margin + 120, y + i * 4);
      });

      y += rowHeight;
    });
  }

  // Footer on each page
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setTextColor(150, 150, 150);
    pdf.setFontSize(8);
    pdf.text(
      `Page ${i} of ${totalPages} | Generated by Habit-a-Day`,
      pageWidth / 2,
      pageHeight - 8,
      { align: 'center' }
    );
  }

  return pdf.output('blob');
}

export function downloadPdf(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
