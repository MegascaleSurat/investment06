// Order status chip mapping execution responses to visual layouts
import React from 'react'
import { OrderStatus } from '../../types/enums'
import {Badge} from '../../components/ui/badge'

interface OrderStatusChipProps {
  status: OrderStatus
}

export function OrderStatusChip({ status }: OrderStatusChipProps) {
  const getVariant = (s: OrderStatus) => {
    switch (s) {
      case OrderStatus.FILLED:
        return 'success';
      case OrderStatus.PARTIAL:
        return 'info';
      case OrderStatus.REQUESTED:
        return 'warning';
      case OrderStatus.FAILED:
      case OrderStatus.CANCELLED:
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <Badge variant={getVariant(status)}>
      {status}
    </Badge>
  );
}
export default OrderStatusChip
