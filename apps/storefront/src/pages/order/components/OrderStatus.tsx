import { B3Tag } from '@/components/B3Tag';
import { useB3Lang } from '@/lib/lang';

import getOrderStatus, { orderStatusTranslationVariables } from '../shared/getOrderStatus';

interface OrderStatusProps {
  code: string;
  text?: string;
}

export default function OrderStatus(props: OrderStatusProps) {
  const b3Lang = useB3Lang();
  const { code, text } = props;

  const status = getOrderStatus(code);
  const translationVariable = orderStatusTranslationVariables[code];
  const translatedStatus = translationVariable ? b3Lang(translationVariable) : undefined;
  const label =
    translatedStatus && translatedStatus !== code ? translatedStatus : text || status.name;

  return status.name && label ? (
    <B3Tag color={status.color} textColor={status.textColor}>
      {label}
    </B3Tag>
  ) : null;
}
