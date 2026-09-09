import { useState, useCallback } from 'react';
import { StorageLocation } from '@/types/collection';
import { sanitizeBulkInput } from '@/lib/bulkSanitizer';
import { parseQuantityIdList } from '../containerWorkspace.utils';

export interface UseContainerBulkImportProps {
  location: StorageLocation | null;
  isInbox: boolean;
  containerId: string | undefined;
  activeCompartment: number;
  setHasMutated: React.Dispatch<React.SetStateAction<boolean>>;
  fetchCards: () => Promise<void>;
  toast: {
    info: (msg: string, opts?: { title?: string }) => void;
    error: (msg: string, opts?: { title?: string }) => void;
    success: (msg: string, opts?: { title?: string }) => void;
  };
}

export interface ContainerBulkImportState {
  ydkText: string;
  setYdkText: React.Dispatch<React.SetStateAction<string>>;
  ydkFileName: string;
  setYdkFileName: React.Dispatch<React.SetStateAction<string>>;
  importSubTab: 'ydk' | 'id_list';
  setImportSubTab: React.Dispatch<React.SetStateAction<'ydk' | 'id_list'>>;
  splitCopiesImport: boolean;
  targetCompartmentForImport: number;
  setTargetCompartmentForImport: React.Dispatch<React.SetStateAction<number>>;
  importLoading: boolean;
  importSuccessMsg: string;
  importError: string;
  handleYdkImport: (e: React.FormEvent) => Promise<void>;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

/**
 * useContainerBulkImport
 * Sub-hook modular para la importación masiva mediante archivos YDK
 * o listados numéricos de cartas e IDs.
 */
export function useContainerBulkImport({
  location,
  isInbox,
  containerId,
  activeCompartment,
  setHasMutated,
  fetchCards,
  toast,
}: UseContainerBulkImportProps): ContainerBulkImportState {
  const [ydkText, setYdkText] = useState('');
  const [ydkFileName, setYdkFileName] = useState('');
  const [importSubTab, setImportSubTab] = useState<'ydk' | 'id_list'>('ydk');
  const [splitCopiesImport] = useState<boolean>(true);
  const [targetCompartmentForImport, setTargetCompartmentForImport] = useState<number>(0);
  const [importLoading, setImportLoading] = useState(false);
  const [importSuccessMsg, setImportSuccessMsg] = useState('');
  const [importError, setImportError] = useState('');

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setYdkFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      setYdkText((evt.target?.result as string) || '');
    };
    reader.readAsText(file);
  }, []);

  const handleYdkImport = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanedText = sanitizeBulkInput(ydkText, importSubTab === 'id_list');
    setYdkText(cleanedText);

    if (!cleanedText.trim()) {
      setImportError('Por favor selecciona un archivo .ydk o pega el listado de cartas');
      return;
    }

    setImportLoading(true);
    setImportError('');
    setImportSuccessMsg('');

    try {
      const effectiveCompartment = location?.compartments && location.compartments.count > 1
        ? targetCompartmentForImport
        : (activeCompartment === -1 ? 0 : activeCompartment);

      const bodyPayload: Record<string, unknown> = {
        storage_location_id: isInbox ? null : containerId,
        compartment_index: effectiveCompartment,
        split_individual: splitCopiesImport,
      };

      if (importSubTab === 'id_list') {
        const parsedCardIds = parseQuantityIdList(ydkText);
        if (parsedCardIds.length === 0) {
          throw new Error('No se identificaron IDs numéricos válidos. Formato esperado: "1 61280937" (cantidad e ID por línea)');
        }
        bodyPayload.cardIds = parsedCardIds;
      } else {
        bodyPayload.ydkText = ydkText;
      }

      const res = await fetch('/api/collection/inbox', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || 'Error al procesar la importación');
      }

      const count = json.insertedCount || json.parsedCount || 0;
      setImportSuccessMsg(`¡Éxito! Se importaron ${count} cartas.`);
      toast.success(`${count} cartas importadas correctamente`, { title: '¡Importación completada!' });
      setHasMutated(true);
      setYdkText('');
      setYdkFileName('');
      await fetchCards();
    } catch (err: unknown) {
      const error = err as Error;
      setImportError(error.message || 'Error al importar cartas');
      toast.error(error.message || 'Error al importar cartas', { title: 'Error de importación' });
    } finally {
      setImportLoading(false);
    }
  }, [
    ydkText,
    importSubTab,
    location,
    targetCompartmentForImport,
    activeCompartment,
    isInbox,
    containerId,
    splitCopiesImport,
    toast,
    setHasMutated,
    fetchCards,
  ]);

  return {
    ydkText,
    setYdkText,
    ydkFileName,
    setYdkFileName,
    importSubTab,
    setImportSubTab,
    splitCopiesImport,
    targetCompartmentForImport,
    setTargetCompartmentForImport,
    importLoading,
    importSuccessMsg,
    importError,
    handleYdkImport,
    handleFileUpload,
  };
}
