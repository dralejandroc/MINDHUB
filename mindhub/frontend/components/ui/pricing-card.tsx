'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { CheckIcon } from '@heroicons/react/24/outline';

export interface PricingTier {
  name: string;
  description: string;
  price: {
    monthly: number;
    yearly: number;
  };
  features: string[];
  popular?: boolean;
  buttonText?: string;
  buttonHref?: string;
}

interface PricingCardProps {
  tier: PricingTier;
  paymentFrequency: string;
}

export function PricingCard({ tier, paymentFrequency }: PricingCardProps) {
  const isYearly = paymentFrequency.toLowerCase() === 'yearly';
  const price = isYearly ? tier.price.yearly : tier.price.monthly;
  const originalPrice = isYearly ? tier.price.monthly * 12 : null;

  return (
    <div
      className={cn(
        'relative flex flex-col rounded-2xl border bg-white p-6 shadow-sm transition-all duration-200',
        tier.popular
          ? 'border-primary-600 ring-2 ring-primary-600/20 scale-105'
          : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
      )}
    >
      {tier.popular && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="inline-flex items-center rounded-full bg-primary-600 px-4 py-1 text-sm font-medium text-white">
            Más Popular
          </span>
        </div>
      )}

      <div className="flex-1">
        <h3 className="text-xl font-semibold text-gray-900">{tier.name}</h3>
        <p className="mt-2 text-sm text-gray-600">{tier.description}</p>

        <div className="mt-6">
          <div className="flex items-baseline">
            <span className="text-4xl font-bold text-gray-900">
              ${price}
            </span>
            <span className="ml-1 text-lg text-gray-600">
              {price === 0 ? '' : `/${isYearly ? 'año' : 'mes'}`}
            </span>
          </div>
          {price === 0 && (
            <p className="mt-1 text-sm text-green-600 font-medium">
              Beta en Pruebas - Gratis
            </p>
          )}
          {originalPrice && price > 0 && (
            <p className="mt-1 text-sm text-gray-500">
              Ahorra ${originalPrice - price} al año
            </p>
          )}
        </div>

        <ul className="mt-6 space-y-3">
          {tier.features.map((feature, index) => (
            <li key={index} className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-sm text-gray-700">{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-8">
        <button
          className={cn(
            'w-full rounded-lg px-4 py-3 text-sm font-medium transition-colors',
            tier.popular
              ? 'bg-primary-600 text-white hover:bg-primary-700'
              : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
          )}
        >
          {tier.buttonText || 'Comenzar Prueba'}
        </button>
      </div>
    </div>
  );
}