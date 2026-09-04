'use client';

import { useState, useMemo } from 'react';
import {
  SleeveInventory,
  SleeveInventoryFormData,
  SleeveCategory,
} from '@/types/collection';

export interface UseSleeveFormStateProps {
  editingSleeve?: SleeveInventory | null;
  initialTab?: 'add_stock' | 'create';
  initialSleeveId?: string;
  initialCategory?: SleeveCategory;
  availableSleeves?: SleeveInventory[];
  suggestedQuantity?: number;
  sectionTotalQuantity?: number;
  onSuccess: (sleeve?: SleeveInventory) => void;
  onClose: () => void;
}

const EMPTY_FORM: SleeveInventoryFormData = {
  name: '',
  category: 'regular',
  brand: 'Dragon Shield',
  color_pattern: 'Matte Black',
  color_hex: '#1a1a2e',
  size_type: 'standard',
  condition: 'new',
  quantity_total: 60,
  notes: '',
};

export function useSleeveFormState({
  editingSleeve,
  initialTab = 'add_stock',
  initialSleeveId,
  initialCategory,
  availableSleeves = [],
  suggestedQuantity,
  sectionTotalQuantity,
  onSuccess,
  onClose,
}: UseSleeveFormStateProps) {
  const [activeTab, setActiveTab] = useState<'add_stock' | 'create'>(() => {
    if (editingSleeve) return 'create';
    if (availableSleeves.length === 0) return 'create';
    return initialTab;
  });

  const [categoryFilter, setCategoryFilter] = useState<'all' | SleeveCategory>(() => {
    if (initialCategory) return initialCategory;
    if (initialSleeveId) {
      const match = availableSleeves.find((s) => s.id === initialSleeveId);
      if (match?.category) return match.category;
    }
    return 'all';
  });

  const [selectedSleeveId, setSelectedSleeveId] = useState<string>(() => {
    if (initialSleeveId && availableSleeves.some((s) => s.id === initialSleeveId)) {
      return initialSleeveId;
    }
    if (initialCategory) {
      const matchCat = availableSleeves.find((s) => s.category === initialCategory);
      if (matchCat) return matchCat.id;
    }
    return availableSleeves[0]?.id || '';
  });

  const [addQuantity, setAddQuantity] = useState<number>(() => {
    if (suggestedQuantity && suggestedQuantity > 0) return suggestedQuantity;
    if (sectionTotalQuantity && sectionTotalQuantity > 0) return sectionTotalQuantity;
    return 60;
  });

  const [form, setForm] = useState<SleeveInventoryFormData>(() => {
    if (editingSleeve) {
      return {
        name: editingSleeve.name,
        category: editingSleeve.category || 'regular',
        brand: editingSleeve.brand,
        color_pattern: editingSleeve.color_pattern,
        color_hex: editingSleeve.color_hex || '#1a1a2e',
        size_type: editingSleeve.size_type,
        condition: editingSleeve.condition,
        quantity_total: editingSleeve.quantity_total,
        notes: editingSleeve.notes || '',
      };
    }
    return {
      ...EMPTY_FORM,
      category: initialCategory || 'regular',
    };
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const selectedSleeve = useMemo(() => {
    return availableSleeves.find((s) => s.id === selectedSleeveId) || null;
  }, [availableSleeves, selectedSleeveId]);

  const filteredSleevesForStock = useMemo(() => {
    if (categoryFilter === 'all') return availableSleeves;
    return availableSleeves.filter((s) => (s.category || 'regular') === categoryFilter);
  }, [availableSleeves, categoryFilter]);

  const handleCategoryFilterChange = (cat: 'all' | SleeveCategory) => {
    setCategoryFilter(cat);
    const candidateList = cat === 'all'
      ? availableSleeves
      : availableSleeves.filter((s) => (s.category || 'regular') === cat);
    if (candidateList.length > 0 && !candidateList.some((s) => s.id === selectedSleeveId)) {
      setSelectedSleeveId(candidateList[0].id);
    }
  };

  const updateForm = <K extends keyof SleeveInventoryFormData>(key: K, value: SleeveInventoryFormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleAddStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSleeveId) {
      setError('Debes seleccionar una funda para añadir stock.');
      return;
    }
    if (addQuantity <= 0) {
      setError('La cantidad a sumar debe ser mayor a 0.');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/collection/sleeve-inventory', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedSleeveId,
          add_quantity: addQuantity,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        onSuccess(json.data);
        onClose();
      } else {
        const json = await res.json();
        setError(json.error || 'Error al actualizar el stock de la funda.');
      }
    } catch {
      setError('Error de red al actualizar stock.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateOrEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.brand.trim()) {
      setError('El nombre y la marca son obligatorios.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const url = '/api/collection/sleeve-inventory';
      const method = editingSleeve ? 'PUT' : 'POST';
      const body = editingSleeve ? { ...form, id: editingSleeve.id } : form;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const json = await res.json();
        onSuccess(json.data);
        onClose();
      } else {
        const json = await res.json();
        setError(json.error || 'Error al guardar la funda.');
      }
    } catch {
      setError('Error de red al guardar la funda.');
    } finally {
      setSubmitting(false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    categoryFilter,
    handleCategoryFilterChange,
    selectedSleeveId,
    setSelectedSleeveId,
    selectedSleeve,
    filteredSleevesForStock,
    addQuantity,
    setAddQuantity,
    form,
    updateForm,
    submitting,
    error,
    setError,
    handleAddStockSubmit,
    handleCreateOrEditSubmit,
  };
}
