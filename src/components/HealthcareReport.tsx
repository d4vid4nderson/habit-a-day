'use client';

import { useState, RefObject } from 'react';
import { X, FileText, Loader2, Calendar, Download, CheckCircle } from 'lucide-react';
import {
  UserProfile,
  BathroomEntry,
  WaterEntry,
  FoodEntry,
} from '@/lib/types';
import {
  generateHealthcareReport,
  downloadPdf,
  DateRange,
} from '@/lib/services/pdfReportService';

type DateRangeOption = '7days' | '30days' | 'custom';

interface HealthcareReportProps {
  isOpen: boolean;
  onClose: () => void;
  profile: UserProfile;
  bathroomEntries: BathroomEntry[];
  waterEntries: WaterEntry[];
  foodEntries: FoodEntry[];
  pottyChartRef?: RefObject<HTMLDivElement | null>;
  waterChartRef?: RefObject<HTMLDivElement | null>;
  foodChartRef?: RefObject<HTMLDivElement | null>;
  chartRef?: RefObject<HTMLDivElement | null>;
  gender: 'male' | 'female';
}

export function HealthcareReport({
  isOpen,
  onClose,
  profile,
  bathroomEntries,
  waterEntries,
  foodEntries,
  pottyChartRef,
  waterChartRef,
  foodChartRef,
  chartRef,
  gender,
}: HealthcareReportProps) {
  const resolvedPottyChartRef = pottyChartRef ?? chartRef;
  const resolvedWaterChartRef = waterChartRef ?? chartRef;
  const resolvedFoodChartRef = foodChartRef ?? chartRef;

  const [dateRangeOption, setDateRangeOption] = useState<DateRangeOption>('7days');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const getDateRange = (): DateRange => {
    const endDate = new Date();
    endDate.setHours(23, 59, 59, 999);

    if (dateRangeOption === 'custom' && customStartDate && customEndDate) {
      return {
        startDate: new Date(customStartDate + 'T00:00:00'),
        endDate: new Date(customEndDate + 'T23:59:59'),
      };
    }

    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);

    if (dateRangeOption === '30days') {
      startDate.setDate(startDate.getDate() - 29);
    } else {
      startDate.setDate(startDate.getDate() - 6);
    }

    return { startDate, endDate };
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setIsComplete(false);

    try {
      const dateRange = getDateRange();
      const blob = await generateHealthcareReport(
        {
          profile,
          bathroomEntries,
          waterEntries,
          foodEntries,
          dateRange,
        },
        resolvedPottyChartRef?.current,
        resolvedWaterChartRef?.current,
        resolvedFoodChartRef?.current
      );

      const patientName = [profile.first_name, profile.last_name]
        .filter(Boolean)
        .join('_') || 'patient';
      const dateStr = new Date().toISOString().split('T')[0];
      const filename = `health_report_${patientName}_${dateStr}.pdf`;

      downloadPdf(blob, filename);
      setIsComplete(true);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleClose = () => {
    setIsComplete(false);
    setDateRangeOption('7days');
    setCustomStartDate('');
    setCustomEndDate('');
    onClose();
  };

  const isCustomDateValid =
    dateRangeOption !== 'custom' ||
    (customStartDate && customEndDate && new Date(customStartDate) <= new Date(customEndDate));

  // Calculate preview stats
  const dateRange = getDateRange();
  const filteredBathroom = bathroomEntries.filter(
    (e) => e.timestamp >= dateRange.startDate.getTime() && e.timestamp <= dateRange.endDate.getTime()
  );
  const filteredWater = waterEntries.filter(
    (e) => e.timestamp >= dateRange.startDate.getTime() && e.timestamp <= dateRange.endDate.getTime()
  );
  const filteredFood = foodEntries.filter(
    (e) => e.timestamp >= dateRange.startDate.getTime() && e.timestamp <= dateRange.endDate.getTime()
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-3xl shadow-2xl max-h-[90vh] flex flex-col animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r ${
            gender === 'female'
              ? 'from-pink-500 to-purple-500'
              : 'from-teal-500 to-blue-500'
          } rounded-t-3xl`}
        >
          <div className="flex items-center gap-2 text-white">
            <FileText className="w-5 h-5" />
            <h2 className="text-lg font-bold">Healthcare Report</h2>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-white/20 transition-colors text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* Description */}
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            Generate a comprehensive PDF report to share with your healthcare provider.
            The report includes your health tracking data, trends, and detailed logs.
          </p>

          {/* Date Range Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <Calendar className="inline-block w-4 h-4 mr-1.5 -mt-0.5" />
              Select Date Range
            </label>

            <div className="grid grid-cols-3 gap-2">
              {[
                { value: '7days', label: 'Last 7 days' },
                { value: '30days', label: 'Last 30 days' },
                { value: 'custom', label: 'Custom' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setDateRangeOption(option.value as DateRangeOption)}
                  className={`px-3 py-2.5 text-sm font-medium rounded-xl transition-all ${
                    dateRangeOption === option.value
                      ? gender === 'female'
                        ? 'bg-pink-500 text-white'
                        : 'bg-teal-500 text-white'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            {/* Custom Date Pickers */}
            {dateRangeOption === 'custom' && (
              <div className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    max={customEndDate || undefined}
                    className={`w-full px-4 py-3 text-base rounded-xl border-2 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors ${
                      gender === 'female'
                        ? 'border-pink-200 dark:border-pink-800 focus:border-pink-500'
                        : 'border-teal-200 dark:border-teal-800 focus:border-teal-500'
                    } focus:outline-none`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    min={customStartDate || undefined}
                    max={new Date().toISOString().split('T')[0]}
                    className={`w-full px-4 py-3 text-base rounded-xl border-2 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 transition-colors ${
                      gender === 'female'
                        ? 'border-pink-200 dark:border-pink-800 focus:border-pink-500'
                        : 'border-teal-200 dark:border-teal-800 focus:border-teal-500'
                    } focus:outline-none`}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Preview Card */}
          <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-xl p-4 space-y-3">
            <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Report Preview
            </h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-3">
                <div
                  className={`text-xl font-bold ${
                    gender === 'female' ? 'text-pink-500' : 'text-teal-500'
                  }`}
                >
                  {filteredBathroom.length}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Bathroom</div>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-3">
                <div
                  className={`text-xl font-bold ${
                    gender === 'female' ? 'text-pink-500' : 'text-teal-500'
                  }`}
                >
                  {filteredWater.length}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Water</div>
              </div>
              <div className="bg-white dark:bg-zinc-800 rounded-lg p-3">
                <div
                  className={`text-xl font-bold ${
                    gender === 'female' ? 'text-pink-500' : 'text-teal-500'
                  }`}
                >
                  {filteredFood.length}
                </div>
                <div className="text-xs text-zinc-500 dark:text-zinc-400">Food</div>
              </div>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 text-center">
              entries found in selected date range
            </p>
          </div>

          {/* Report Contents */}
          <div className="text-xs text-zinc-500 dark:text-zinc-400 space-y-1">
            <p className="font-medium text-zinc-600 dark:text-zinc-300">Report includes:</p>
            <ul className="list-disc list-inside space-y-0.5 pl-1">
              <li>Patient demographics</li>
              <li>Summary statistics for all trackers</li>
              <li>Health trends chart</li>
              <li>Detailed bathroom log</li>
              <li>Water intake log</li>
              <li>Food journal log</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 pb-6 border-t border-zinc-200 dark:border-zinc-700">
          {isComplete ? (
            <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400 py-2">
              <CheckCircle className="w-5 h-5" />
              <span className="font-medium">PDF downloaded successfully!</span>
            </div>
          ) : (
            <button
              onClick={handleGenerate}
              disabled={isGenerating || !isCustomDateValid}
              className={`w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-white transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed ${
                gender === 'female'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600'
                  : 'bg-gradient-to-r from-teal-500 to-blue-500 hover:from-teal-600 hover:to-blue-600'
              }`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Generate PDF Report
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
