import { SleeveInventory } from '@/types/collection';
import { isExtraDeckCardType } from './deckWorkspace.utils';

interface BuildCopyPayloadArgs {
  cardId: number;
  isProxy: boolean;
  selectedCardDetail: { section?: string; card_details?: { type?: string } } | null;
  storageLocationId?: string | null;
  compartmentIndex?: number;
  currentDeckId?: string | null;
  mainProtection: 'single' | 'double' | 'triple';
  mainSleeveFitId: string;
  mainSleeveId: string;
  mainSleeveOverId: string;
  extraProtection: 'single' | 'double' | 'triple';
  extraSleeveFitId: string;
  extraSleeveId: string;
  extraSleeveOverId: string;
  poolProtection: 'single' | 'double' | 'triple';
  poolSleeveFitId: string;
  poolSleeveId: string;
  poolSleeveOverId: string;
  availableSleeves: SleeveInventory[];
}

export function buildAddPhysicalCopyPayload(args: BuildCopyPayloadArgs) {
  const targetSec = args.selectedCardDetail?.section || 'main';
  const isExtra = isExtraDeckCardType(args.selectedCardDetail?.card_details?.type);
  let targetProt = args.mainProtection;
  let targetFitId = args.mainSleeveFitId;
  let targetRegId = args.mainSleeveId;
  let targetOverId = args.mainSleeveOverId;

  if (targetSec === 'extra' || (targetSec === 'side' && isExtra)) {
    targetProt = args.extraProtection;
    targetFitId = args.extraSleeveFitId;
    targetRegId = args.extraSleeveId;
    targetOverId = args.extraSleeveOverId;
  } else if (targetSec === 'pool' || targetSec === 'extras') {
    targetProt = args.poolProtection;
    targetFitId = args.poolSleeveFitId;
    targetRegId = args.poolSleeveId;
    targetOverId = args.poolSleeveOverId;
  }

  const regularSlv = args.availableSleeves.find((s) => s.id === targetRegId);
  const fitSlv = args.availableSleeves.find((s) => s.id === targetFitId);
  const overSlv = args.availableSleeves.find((s) => s.id === targetOverId);

  return {
    card_id: args.cardId,
    storage_location_id: args.storageLocationId || null,
    compartment_index: args.compartmentIndex || 0,
    quantity: 1,
    rarity: args.isProxy ? 'Proxy' : 'Common',
    condition: 'Near Mint',
    status_flag: 'in_deck',
    deck_id: args.currentDeckId || null,
    deck_section: targetSec,
    is_proxy: args.isProxy,
    sleeve_type: targetProt,
    sleeve_fit_id: targetFitId || null,
    sleeve_regular_id: targetRegId || null,
    sleeve_over_id: targetOverId || null,
    sleeve_brand: regularSlv ? regularSlv.brand : '',
    sleeve_color: regularSlv ? regularSlv.color_pattern : '',
    sleeve_inner_brand: fitSlv ? fitSlv.brand : null,
    sleeve_inner_color: fitSlv ? fitSlv.color_pattern : null,
    sleeve_outer_brand: overSlv ? overSlv.brand : null,
    sleeve_outer_color: overSlv ? overSlv.color_pattern : null,
  };
}
