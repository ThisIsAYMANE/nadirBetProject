'use client';

import { useState, useEffect } from 'react';
import { casinoApi } from '@/lib/casinoApi';
import { Button } from '@/components/ui/button';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Check, Loader2 } from 'lucide-react';

interface CurrencySelectorProps {
  currentCurrency?: string;
  onCurrencyChange?: (currency: string) => void;
}

export default function CurrencySelector({ currentCurrency, onCurrencyChange }: CurrencySelectorProps) {
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [selectedCurrency, setSelectedCurrency] = useState<string>(currentCurrency || 'EUR');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'success' | 'error'>('idle');

  useEffect(() => {
    loadCurrencies();
  }, []);

  useEffect(() => {
    if (currentCurrency) {
      setSelectedCurrency(currentCurrency);
    }
  }, [currentCurrency]);

  const loadCurrencies = async () => {
    try {
      setIsLoading(true);
      const limits = await casinoApi.getProviders();
      
      // Extract unique currencies from limits
      const currencies = new Set<string>();
      const limitsArray = Array.isArray(limits) ? limits : [limits];
      
      limitsArray.forEach((limit: any) => {
        if (limit.currency) {
          currencies.add(limit.currency);
        }
      });

      // Default to EUR if no currencies found
      if (currencies.size === 0) {
        currencies.add('EUR');
        currencies.add('USD');
      }

      setAvailableCurrencies(Array.from(currencies).sort());
    } catch (error) {
      console.error('Error loading currencies:', error);
      // Fallback currencies
      setAvailableCurrencies(['EUR', 'USD', 'GBP']);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCurrencyChange = async (currency: string) => {
    if (currency === selectedCurrency || isSaving) {
      return;
    }

    setIsSaving(true);
    setSaveStatus('idle');

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (!token) {
        setSaveStatus('error');
        return;
      }

      const BACKEND_BASE_URL =
        process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

      const response = await fetch(`${BACKEND_BASE_URL}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currency }),
      });

      if (!response.ok) {
        throw new Error('Failed to update currency');
      }

      setSelectedCurrency(currency);
      setSaveStatus('success');
      
      // Notify parent component
      if (onCurrencyChange) {
        onCurrencyChange(currency);
      }

      // Refresh page after a short delay to update game list
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Error updating currency:', error);
      setSaveStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner size="sm" />
        <span className="ml-2 text-gray-400">Loading currencies...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-white mb-2">Currency</h3>
        <p className="text-sm text-gray-400 mb-4">
          Select your preferred currency for casino games. This affects which games and providers are available.
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        {availableCurrencies.map((currency) => {
          const isSelected = currency === selectedCurrency;
          const isSavingThis = isSaving && currency === selectedCurrency;

          return (
            <button
              key={currency}
              onClick={() => handleCurrencyChange(currency)}
              disabled={isSaving}
              className={`
                relative p-4 rounded-lg border-2 transition-all
                ${isSelected
                  ? 'border-green-500 bg-green-500/10 text-green-500'
                  : 'border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600'
                }
                ${isSaving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {isSavingThis && (
                <div className="absolute top-2 right-2">
                  <Loader2 className="w-4 h-4 animate-spin text-green-500" />
                </div>
              )}
              {isSelected && !isSavingThis && (
                <div className="absolute top-2 right-2">
                  <Check className="w-4 h-4 text-green-500" />
                </div>
              )}
              <div className="text-center">
                <div className="text-2xl font-bold mb-1">{currency}</div>
                <div className="text-xs text-gray-400">
                  {currency === 'EUR' && 'Euro'}
                  {currency === 'USD' && 'US Dollar'}
                  {currency === 'GBP' && 'British Pound'}
                  {currency === 'CAD' && 'Canadian Dollar'}
                  {currency === 'AUD' && 'Australian Dollar'}
                  {currency === 'JPY' && 'Japanese Yen'}
                  {currency === 'CHF' && 'Swiss Franc'}
                  {currency === 'CNY' && 'Chinese Yuan'}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {saveStatus === 'success' && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-3 text-green-400 text-sm">
          Currency updated successfully! Refreshing...
        </div>
      )}

      {saveStatus === 'error' && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-400 text-sm">
          Failed to update currency. Please try again.
        </div>
      )}
    </div>
  );
}
