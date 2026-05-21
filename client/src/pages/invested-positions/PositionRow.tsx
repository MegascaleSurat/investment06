// Action triggers for active position rows including partial/full close controls
import React, { useState } from 'react'
import type { TradePosition } from '../../types/trade.types'
import ConfirmModal from '../../components/ui/ConfirmModal'

interface PositionRowProps {
  position: TradePosition
  onClose: (tradeId: string) => void
}

export function PositionRow({ position, onClose }: PositionRowProps) {
  const [modalOpen, setModalOpen] = useState(false);

  const handleCloseTrigger = () => {
    onClose(position.tradeId);
    setModalOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="px-3 py-1.5 text-xs font-semibold rounded bg-rose-500/10 text-rose-500 hover:bg-rose-500/20 transition-colors cursor-pointer"
      >
        Exit Trade
      </button>

      <ConfirmModal
        isOpen={modalOpen}
        title={`Exit Position - ${position.stockCode}`}
        message={`Are you sure you want to trigger market exit orders for ${position.stockCode}?`}
        onConfirm={handleCloseTrigger}
        onCancel={() => setModalOpen(false)}
        confirmLabel="Exit Position"
      />
    </>
  );
}
export default PositionRow
