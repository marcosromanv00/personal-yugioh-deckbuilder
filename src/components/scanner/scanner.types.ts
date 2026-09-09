export interface YgoDetectedCard {
  id: number;
  name: string;
  type: string;
  desc?: string;
  image_url: string;
  image_url_small?: string;
  archetype?: string;
  atk?: number | null;
  def?: number | null;
  level?: number | null;
  attribute?: string | null;
  race?: string | null;
}

export type ScannerStage =
  | 'idle'
  | 'object_detected'
  | 'reading_ocr'
  | 'fetching_card'
  | 'card_found'
  | 'not_found';

export interface CardCodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCardRegistered: (card: YgoDetectedCard, quantity: number) => void;
  title?: string;
  subtitle?: string;
  maxQuantity?: number;
}
