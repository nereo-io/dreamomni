"use client";

import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CreditHistoryModal } from '@/components/ui/credit-history-modal';

interface CreditsCostSectionProps {
  leftCredits: number | null;
  estimatedCost: number;
  onShowPricing: () => void;
  labels: {
    credits: string;
    cost: string;
    recharge: string;
  };
  className?: string;
}

/**
 * A reusable section to display user credits and the cost of an action.
 * Includes a link to show credit history and a button to recharge.
 */
export function CreditsCostSection({
  leftCredits,
  estimatedCost,
  onShowPricing,
  labels,
  className = "",
}: CreditsCostSectionProps) {
  const [showCreditHistoryModal, setShowCreditHistoryModal] = useState(false);

  return (
    <>
      <div className={`bg-gray-800 rounded-lg p-4 ${className}`}>
        <div className="flex justify-between items-center">
          <div>
            {leftCredits !== null ? (
              <button
                type="button"
                className="text-gray-300 mb-1 flex items-center gap-1 hover:text-gray-100 transition-colors cursor-pointer"
                onClick={() => setShowCreditHistoryModal(true)}
              >
                {labels.credits}: {leftCredits}
                <ChevronRight className="h-4 w-4 text-gray-400" />
              </button>
            ) : (
              <div className="text-gray-300 mb-1">
                {labels.credits}: -
              </div>
            )}
            <div className="text-gray-300">
              {labels.cost}: {estimatedCost} ⚡
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="bg-transparent border-gray-600 text-gray-300 hover:bg-gray-700"
            onClick={onShowPricing}
          >
            {labels.recharge}
          </Button>
        </div>
      </div>

      <CreditHistoryModal
        open={showCreditHistoryModal}
        onOpenChange={setShowCreditHistoryModal}
      />
    </>
  );
}

