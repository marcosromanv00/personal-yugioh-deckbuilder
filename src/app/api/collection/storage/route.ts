import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Global mock storage for demo mode persistence
const globalForStorage = global as unknown as {
  mockStorageLocations?: any[];
};

if (!globalForStorage.mockStorageLocations) {
  globalForStorage.mockStorageLocations = [
    {
      id: 'demo-binder-1',
      name: 'Binder de Raras',
      type: 'binder',
      sub_type: 'binder_3x3',
      color_code: '#8b5cf6',
      dimensions: { width: 25, height: 30, depth: 4 },
      capacity: 360,
      grid_layout: { rows: 3, cols: 3, pockets_per_page: 9, total_pages: 40 },
      compartments: { count: 1, names: ['Principal'] },
      render_style: 'binder_binder_3x3',
      description: 'Carpeta principal de intercambio y cartas valiosas.',
      created_at: new Date().toISOString()
    },
    {
      id: 'demo-box-1',
      name: 'Mega Lata 2024',
      type: 'tin',
      sub_type: 'standard',
      color_code: '#d97706',
      dimensions: { width: 15, height: 20, depth: 10 },
      capacity: 200,
      grid_layout: { rows: 1, cols: 1, pockets_per_page: 1, total_pages: 1 },
      compartments: { count: 1, names: ['Principal'] },
      render_style: 'tin_standard',
      description: 'Lata para guardar el bulk y cartas comunes de intercambio.',
      created_at: new Date().toISOString()
    }
  ];
}

// GET: Obtener todos los contenedores de almacenamiento con conteo de ocupación
export async function GET() {
  try {
    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                 process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    let locations = [];
    if (!isSupabaseConfigured) {
      locations = globalForStorage.mockStorageLocations || [];
    } else {
      const { data, error } = await supabase
        .from('yg_storage_locations')
        .select('*')
        .order('name', { ascending: true });

      if (error) {
        throw error;
      }
      locations = data || [];
    }

    // Obtener la cantidad de cartas guardadas en cada contenedor
    let cardCounts: any[] = [];
    if (isSupabaseConfigured) {
      const { data: counts, error: countError } = await supabase
        .from('yg_user_cards')
        .select('storage_location_id, quantity')
        .not('storage_location_id', 'is', null);

      if (countError) {
        console.warn('Error al calcular ocupación:', countError);
      }
      cardCounts = counts || [];
    }

    const countsMap: Record<string, number> = {};
    if (cardCounts) {
      for (const row of cardCounts) {
        if (row.storage_location_id) {
          countsMap[row.storage_location_id] = (countsMap[row.storage_location_id] || 0) + (row.quantity || 1);
        }
      }
    }

    const locationsWithCounts = locations.map((loc: any) => ({
      ...loc,
      occupied_cards: countsMap[loc.id] || 0,
    }));

    return NextResponse.json({ data: locationsWithCounts });
  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al obtener contenedores:', err);
    return NextResponse.json({ error: err.message || 'Error al obtener contenedores de almacenamiento' }, { status: 500 });
  }
}

// POST: Crear un nuevo contenedor de almacenamiento (Binder, Lata, Deckbox, Caja)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      name, 
      type, 
      sub_type, 
      color_code, 
      dimensions, 
      capacity, 
      grid_layout, 
      compartments, 
      render_style, 
      description 
    } = body;

    if (!name || !type) {
      return NextResponse.json({ error: 'Nombre y tipo de contenedor son obligatorios' }, { status: 400 });
    }

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                 process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      const newLoc = {
        id: `demo-${Date.now()}`,
        name,
        type,
        sub_type: sub_type || 'standard',
        color_code: color_code || '#8b5cf6',
        dimensions: dimensions || { width: 0, height: 0, depth: 0 },
        capacity: capacity || 360,
        grid_layout: grid_layout || { rows: 3, cols: 3, pockets_per_page: 9, total_pages: 40 },
        compartments: compartments || { count: 1, names: ['Principal'] },
        render_style: render_style || 'default_binder',
        description: description || '',
        created_at: new Date().toISOString()
      };
      globalForStorage.mockStorageLocations = [...(globalForStorage.mockStorageLocations || []), newLoc];
      return NextResponse.json({ data: newLoc });
    }

    const { data, error } = await supabase
      .from('yg_storage_locations')
      .insert([{
        name,
        type,
        sub_type: sub_type || 'standard',
        color_code: color_code || '#8b5cf6',
        dimensions: dimensions || { width: 0, height: 0, depth: 0 },
        capacity: capacity || 360,
        grid_layout: grid_layout || { rows: 3, cols: 3, pockets_per_page: 9, total_pages: 40 },
        compartments: compartments || { count: 1, names: ['Principal'] },
        render_style: render_style || 'default_binder',
        description: description || '',
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al crear contenedor:', err);
    return NextResponse.json({ error: err.message || 'Error al crear contenedor' }, { status: 500 });
  }
}

// PUT: Editar un contenedor existente
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      id,
      name, 
      type, 
      sub_type, 
      color_code, 
      dimensions, 
      capacity, 
      grid_layout, 
      compartments, 
      render_style, 
      description 
    } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID de contenedor es obligatorio' }, { status: 400 });
    }

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                 process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      globalForStorage.mockStorageLocations = (globalForStorage.mockStorageLocations || []).map(
        loc => loc.id === id ? { ...loc, name, type, sub_type, color_code, dimensions, capacity, grid_layout, compartments, render_style, description } : loc
      );
      const updatedMock = (globalForStorage.mockStorageLocations || []).find(l => l.id === id);
      return NextResponse.json({ data: updatedMock });
    }

    const { data, error } = await supabase
      .from('yg_storage_locations')
      .update({
        name,
        type,
        sub_type: sub_type || 'standard',
        color_code: color_code || '#8b5cf6',
        dimensions: dimensions || { width: 0, height: 0, depth: 0 },
        capacity: capacity || 360,
        grid_layout: grid_layout || { rows: 3, cols: 3, pockets_per_page: 9, total_pages: 40 },
        compartments: compartments || { count: 1, names: ['Principal'] },
        render_style: render_style || 'default_binder',
        description: description || '',
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ data });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al editar contenedor:', err);
    return NextResponse.json({ error: err.message || 'Error al editar contenedor' }, { status: 500 });
  }
}

// DELETE: Eliminar un contenedor (las cartas regresan a la bandeja sin clasificar)
export async function DELETE(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID de contenedor es obligatorio' }, { status: 400 });
    }

    const isSupabaseConfigured = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                                 process.env.NEXT_PUBLIC_SUPABASE_URL !== 'https://placeholder.supabase.co' &&
                                 process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!isSupabaseConfigured) {
      globalForStorage.mockStorageLocations = (globalForStorage.mockStorageLocations || []).filter(
        loc => loc.id !== id
      );
      return NextResponse.json({ success: true });
    }

    // 1. Las cartas asignadas a este contenedor pasan a storage_location_id = NULL
    await supabase
      .from('yg_user_cards')
      .update({ storage_location_id: null, binder_page: null, binder_slot: null })
      .eq('storage_location_id', id);

    // 2. Eliminar el contenedor
    const { error } = await supabase
      .from('yg_storage_locations')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }

    return NextResponse.json({ success: true });

  } catch (error: unknown) {
    const err = error as Error;
    console.error('Error al eliminar contenedor:', err);
    return NextResponse.json({ error: err.message || 'Error al eliminar contenedor' }, { status: 500 });
  }
}
